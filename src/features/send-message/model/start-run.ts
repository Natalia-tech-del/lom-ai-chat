import { useConversationStore } from '@entities/conversation'
import { runAgent } from '@shared/mock-agent'
import type { TAgentMessage } from '@shared/mock-agent'

// Храним контроллеры генерации ответов.
// По ID диалога можно найти нужный контроллер и остановить генерацию.
const controllers = new Map<string, AbortController>()

// подготовка истории переписки для mock-agent: без служебных статусов и заверешенные
const toAgentHistory = (conversationId: string): TAgentMessage[] => {
  const conversation = useConversationStore
    .getState()
    .conversations.find((item) => item.id === conversationId)

  if (!conversation) {
    return []
  }

  return conversation.messages
    .filter((message) => message.role === 'user' || message.status === 'done')
    .map((message) => ({ role: message.role, text: message.text }))
}

// Запускает агента и обрабатывает его события
export const startRun = async (conversationId: string, assistantMessageId: string) => {
  controllers.get(conversationId)?.abort()

  const controller = new AbortController()
  controllers.set(conversationId, controller)

  const store = useConversationStore.getState()

  try {
    for await (const event of runAgent(toAgentHistory(conversationId), controller.signal)) {
      if (controllers.get(conversationId) !== controller) {
        return
      }

      switch (event.type) {
        case 'status':
          store.setActiveRun(conversationId, { status: event.message })
          break
        case 'tool_call':
        case 'tool_result':
          break
        case 'text_delta':
          store.appendAssistantText(conversationId, assistantMessageId, event.text)
          break
        case 'completed':
          store.setMessageStatus(conversationId, assistantMessageId, 'done')
          store.setActiveRun(conversationId, null)
          break
        case 'error':
          store.appendAssistantText(conversationId, assistantMessageId, event.message)
          store.setMessageStatus(conversationId, assistantMessageId, 'error')
          store.setActiveRun(conversationId, null)
          break
        default: {
          const exhaustive: never = event
          throw new Error(`Неизвестное событие агента: ${exhaustive}`)
        }
      }
    }

    if (controllers.get(conversationId) !== controller) {
      return
    }

    if (controller.signal.aborted) {
      store.setMessageStatus(conversationId, assistantMessageId, 'stopped')
      store.setActiveRun(conversationId, null)
    }
  } catch {
    if (controllers.get(conversationId) !== controller) {
      return
    }

    store.setMessageStatus(conversationId, assistantMessageId, 'error')
    store.setActiveRun(conversationId, null)
  } finally {
    if (controllers.get(conversationId) === controller) {
      controllers.delete(conversationId)
    }
  }
}

// функция остановки
export const stopRun = (conversationId: string) => {
  controllers.get(conversationId)?.abort()
}

// функция повтора
export const retryRun = (conversationId: string) => {
  const conversation = useConversationStore
    .getState()
    .conversations.find((item) => item.id === conversationId)

  if (!conversation) {
    return
  }

  const lastAssistant = [...conversation.messages]
    .reverse()
    .find((message) => message.role === 'assistant')

  if (!lastAssistant) {
    return
  }

  if (lastAssistant.status !== 'error' && lastAssistant.status !== 'stopped') {
    return
  }

  stopRun(conversationId)
  useConversationStore.getState().resetAssistantMessage(conversationId, lastAssistant.id)
  void startRun(conversationId, lastAssistant.id)
}
