import { Button, Group, Textarea } from '@mantine/core'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { sendUserText } from '../model/send-user-text'

/**
 * Фича отправки пользовательского сообщения.
 * Управляет вводом текста и добавляет сообщение
 * в активный диалог.
 */
export const MessageComposer = () => {
  const [value, setValue] = useState('')

  const send = () => {
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
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            send()
          }
        }}
      />
      <Button onClick={send} aria-label="Отправить">
        <Send size={18} />
      </Button>
    </Group>
  )
}
