import { useConversationStore } from '@entities/conversation'

export const sendUserText = (text: string) => {
  const trimmed = text.trim()

  if (!trimmed) {
    return
  }

  const store = useConversationStore.getState()
  const conversationId = store.activeConversationId ?? store.createConversation()
  store.addUserMessage(conversationId, trimmed)
}
