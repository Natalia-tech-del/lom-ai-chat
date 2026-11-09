import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TActiveRun, TConversation, TMessage, TMessageStatus } from './types'

const newId = () => crypto.randomUUID()

// Создание заголовка диалога
const titleFrom = (text: string) => {
  const trimmed = text.trim().replace(/\s+/g, ' ')

  if (trimmed.length <= 48) {
    return trimmed || 'Новый диалог'
  }

  return `${trimmed.slice(0, 48).trim()}…`
}

// Обновление конкретного диалога
const patchConversation = (
  conversations: TConversation[], // диалоги
  conversationId: string,
  patch: (conversation: TConversation) => TConversation,
) =>
  conversations.map((conversation) =>
    conversation.id === conversationId ? patch(conversation) : conversation,
  )

type TConversationStore = {
  conversations: TConversation[]
  activeConversationId: string | null
  createConversation: () => string
  selectConversation: (id: string) => void
  addUserMessage: (conversationId: string, text: string) => void
  startAssistantMessage: (conversationId: string) => string
  appendAssistantText: (conversationId: string, messageId: string, chunk: string) => void
  setMessageStatus: (conversationId: string, messageId: string, status: TMessageStatus) => void
  setActiveRun: (conversationId: string, activeRun: TActiveRun | null) => void
}

export const useConversationStore = create<TConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      // создает новый диалог
      createConversation: () => {
        const id = newId()
        const conversation: TConversation = {
          id,
          title: 'Новый диалог',
          messages: [],
          activeRun: null,
          updatedAt: Date.now(),
        }

        set({
          conversations: [conversation, ...get().conversations],
          activeConversationId: id,
        })

        return id
      },

      // выбирает диалог
      selectConversation: (id) => {
        set({ activeConversationId: id })
      },

      // добавляет новое сообщение пользователя в конкретный диалог
      addUserMessage: (conversationId, text) => {
        const message: TMessage = {
          id: newId(),
          role: 'user',
          text,
          status: 'done',
          createdAt: Date.now(),
        }

        set({
          conversations: patchConversation(get().conversations, conversationId, (conversation) => ({
            ...conversation,
            title: conversation.messages.length === 0 ? titleFrom(text) : conversation.title,
            messages: [...conversation.messages, message],
            updatedAt: Date.now(),
          })),
        })
      },

      // создает в истории диалога пустое сообщение ассистента со статусом pending и возвращает его ID
      startAssistantMessage: (conversationId) => {
        const message: TMessage = {
          id: newId(),
          role: 'assistant',
          text: '',
          status: 'pending',
          createdAt: Date.now(),
        }

        set({
          conversations: patchConversation(get().conversations, conversationId, (conversation) => ({
            ...conversation,
            messages: [...conversation.messages, message],
            updatedAt: Date.now(),
          })),
        })

        return message.id
      },

      // находит нужный диалог и сообщение по ID, дописывает полученный фрагмент и меняет статус сообщения на streaming. Остальные сообщения не трогает
      appendAssistantText: (conversationId, messageId, chunk) => {
        set({
          conversations: patchConversation(get().conversations, conversationId, (conversation) => ({
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId
                ? { ...message, text: `${message.text}${chunk}`, status: 'streaming' }
                : message,
            ),
            updatedAt: Date.now(),
          })),
        })
      },

      // меняет статус конкретного сообщения в истории диалога
      setMessageStatus: (conversationId, messageId, status) => {
        set({
          conversations: patchConversation(get().conversations, conversationId, (conversation) => ({
            ...conversation,
            messages: conversation.messages.map((message) =>
              message.id === messageId ? { ...message, status } : message,
            ),
            updatedAt: Date.now(),
          })),
        })
      },

      // обновляет состояние выполнения агента внутри конкретного диалога
      setActiveRun: (conversationId, activeRun) => {
        set({
          conversations: patchConversation(get().conversations, conversationId, (conversation) => ({
            ...conversation,
            activeRun,
            updatedAt: Date.now(),
          })),
        })
      },
    }),
    // в localStorage сохраняются все диалоги с историей сообщений и ID активного диалога. При этом activeRun принудительно сбрасывается в null, поскольку после перезагрузки генерация не продолжается.
    {
      name: 'lom-ai-conversations',
      partialize: (state) => ({
        activeConversationId: state.activeConversationId,
        conversations: state.conversations.map((conversation) => ({
          ...conversation,
          activeRun: null,
        })),
      }),
      // Обработка состояния после восстановления Store из localStorage
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return
        }

        useConversationStore.setState({
          conversations: state.conversations.map((conversation) => ({
            ...conversation,
            activeRun: null,
            messages: conversation.messages.map((message) =>
              message.role === 'assistant' &&
              (message.status === 'pending' || message.status === 'streaming')
                ? { ...message, status: 'stopped' }
                : message,
            ),
          })),
        })
      },
    },
  ),
)
