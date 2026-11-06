import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Component, type ReactNode } from 'react'

type TErrorBoundaryProps = {
  children: ReactNode
}

type TErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<TErrorBoundaryProps, TErrorBoundaryState> {
  state: TErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): TErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <Center h="100%" p="md">
        <Stack align="center" gap="sm">
          <Title order={2}>Что-то пошло не так</Title>
          <Text c="dimmed" ta="center">
            Перезагрузите страницу — ваши диалоги сохранятся.
          </Text>
          <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
        </Stack>
      </Center>
    )
  }
}
