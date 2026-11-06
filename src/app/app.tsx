import { MantineProvider } from '@mantine/core'
import { ChatPage } from '@pages/chat'
import { ErrorBoundary } from './error-boundary'
import { theme } from './theme'

export const App = () => (
  <MantineProvider theme={theme}>
    <ErrorBoundary>
      <ChatPage />
    </ErrorBoundary>
  </MantineProvider>
)
