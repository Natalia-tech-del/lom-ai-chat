import { Button, Loader, NavLink, ScrollArea, Stack, Text } from '@mantine/core'
import { Plus } from 'lucide-react'
import { useConversationStore } from '@entities/conversation'

type TConversationListProps = {
  onSelect?: () => void
}

// виджет списка диалогов - показывает все созданные чаты, позволяет создать новый и переключаться между существующими
export const ConversationList = ({ onSelect }: TConversationListProps) => {
  const conversations = useConversationStore((state) => state.conversations)
  const activeId = useConversationStore((state) => state.activeConversationId)
  const createConversation = useConversationStore((state) => state.createConversation)
  const selectConversation = useConversationStore((state) => state.selectConversation)

  return (
    <Stack h="100%" gap="sm">
      <Button
        leftSection={<Plus size={16} />}
        onClick={() => {
          createConversation()
          onSelect?.()
        }}
      >
        Новый диалог
      </Button>
      <ScrollArea flex={1}>
        {conversations.length === 0 ? (
          <Text size="sm" c="dimmed">
            Пока нет диалогов
          </Text>
        ) : (
          conversations.map((conversation) => (
            <NavLink
              key={conversation.id}
              label={conversation.title}
              active={conversation.id === activeId}
              rightSection={conversation.activeRun ? <Loader size="xs" /> : undefined}
              onClick={() => {
                selectConversation(conversation.id)
                onSelect?.()
              }}
            />
          ))
        )}
      </ScrollArea>
    </Stack>
  )
}
