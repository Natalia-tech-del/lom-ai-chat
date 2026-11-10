import { useConversationStore } from '@entities/conversation'
import { startRun } from './start-run'

export const sendUserText = (text: string) => {
  const trimmed = text.trim()

  if (!trimmed) {
    return
  }

  const store = useConversationStore.getState()
  const conversationId = store.activeConversationId ?? store.createConversation()
  const conversation = store.conversations.find((item) => item.id === conversationId)

  if (conversation?.activeRun) {
    return
  }

  store.addUserMessage(conversationId, trimmed)
  const assistantMessageId = store.startAssistantMessage(conversationId)
  void startRun(conversationId, assistantMessageId)
}
