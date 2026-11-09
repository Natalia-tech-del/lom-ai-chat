import { AppShell, Burger, Group, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { MessageComposer } from '@features/send-message'
import { ChatThread } from '@widgets/chat-thread'
import { ConversationList } from '@widgets/conversation-list'
import classes from './chat-page.module.css'

export const ChatPage = () => {
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={4}>LOM AI</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        <ConversationList onSelect={close} />
      </AppShell.Navbar>
      <AppShell.Main className={classes.main}>
        <ChatThread />
        <MessageComposer />
      </AppShell.Main>
    </AppShell>
  )
}
