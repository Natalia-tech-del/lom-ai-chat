import { Box, Button, Paper, ScrollArea, Stack, Text } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useConversationStore } from '@entities/conversation'
import { retryRun, sendUserText } from '@features/send-message'
import classes from './chat-thread.module.css'

const examples = [
  'Объясни второй закон Ньютона',
  'Сколько будет 17 × 24?',
  'Помоги решить задачу, но не давай ответ сразу',
]

// виджет переписки - отображает содержимое активного диалога
export const ChatThread = () => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const conversations = useConversationStore((state) => state.conversations)
  const activeId = useConversationStore((state) => state.activeConversationId)
  const conversation = conversations.find((item) => item.id === activeId)
  const lastText = conversation?.messages.at(-1)?.text
  const runStatus = conversation?.activeRun?.status
  const lastAssistant = conversation?.messages.findLast((item) => item.role === 'assistant')

  useEffect(() => {
    if (!stickToBottom.current) {
      return
    }

    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    viewport.scrollTo({ top: viewport.scrollHeight })
  }, [conversation?.messages, lastText, runStatus])

  if (!conversation || conversation.messages.length === 0) {
    return (
      <Box className={classes.empty}>
        <Stack align="center" gap="sm">
          <Text ta="center">Выберите пример или напишите свой вопрос</Text>
          {examples.map((example) => (
            <Button key={example} variant="light" onClick={() => sendUserText(example)}>
              {example}
            </Button>
          ))}
        </Stack>
      </Box>
    )
  }

  return (
    <ScrollArea
      className={classes.scroll}
      viewportRef={viewportRef}
      onScrollPositionChange={({ y }) => {
        const viewport = viewportRef.current

        if (!viewport) {
          return
        }

        stickToBottom.current = viewport.scrollHeight - viewport.clientHeight - y < 80
      }}
    >
      <Stack p="md" gap="sm">
        {conversation.messages.map((message) => {
          const canRetry =
            message.id === lastAssistant?.id &&
            (message.status === 'error' || message.status === 'stopped')

          return (
            <Paper
              key={message.id}
              p="sm"
              radius="md"
              bg={message.role === 'user' ? 'indigo.1' : 'gray.1'}
              c="inherit"
              className={message.role === 'user' ? classes.user : classes.assistant}
            >
              <Text className={classes.text} c="inherit">
                {message.text || (message.status === 'pending' ? 'Думаю…' : '')}
              </Text>
              {canRetry ? (
                <Button mt="xs" size="xs" variant="light" onClick={() => retryRun(conversation.id)}>
                  Повторить
                </Button>
              ) : null}
            </Paper>
          )
        })}
        {conversation.activeRun ? (
          <Text size="sm" c="dimmed">
            {conversation.activeRun.status}
          </Text>
        ) : null}
      </Stack>
    </ScrollArea>
  )
}
