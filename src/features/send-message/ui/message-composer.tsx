import { Button, Group, Textarea } from '@mantine/core'
import { Send, Square } from 'lucide-react'
import { useState } from 'react'
import { useConversationStore } from '@entities/conversation'
import { sendUserText } from '../model/send-user-text'
import { stopRun } from '../model/start-run'

/**
 * Фича отправки пользовательского сообщения.
 * Управляет вводом текста и добавляет сообщение
 * в активный диалог.
 */
export const MessageComposer = () => {
  const [value, setValue] = useState('')
  const activeId = useConversationStore((state) => state.activeConversationId)
  const isRunning = useConversationStore((state) => {
    const conversation = state.conversations.find((item) => item.id === state.activeConversationId)
    return Boolean(conversation?.activeRun)
  })
  const send = () => {
    if (isRunning) {
      return
    }
    sendUserText(value)
    setValue('')
  }
  return (
    <Group p="md" align="flex-end" wrap="nowrap">
      <Textarea
        flex={1}
        autosize
        minRows={1}
        maxRows={6}
        placeholder="Напишите вопрос…"
        value={value}
        disabled={isRunning}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send()
          }
        }}
      />
      {isRunning && activeId ? (
        <Button
          color="red"
          variant="light"
          onClick={() => stopRun(activeId)}
          aria-label="Остановить"
        >
          <Square size={18} />
        </Button>
      ) : (
        <Button onClick={send} aria-label="Отправить">
          <Send size={18} />
        </Button>
      )}
    </Group>
  )
}
