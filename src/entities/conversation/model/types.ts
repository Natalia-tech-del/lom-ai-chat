export type TMessageStatus = 'pending' | 'streaming' | 'done' | 'error' | 'stopped'

export type TMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  status: TMessageStatus
  createdAt: number
}

export type TActiveRun = {
  status: string
}

export type TConversation = {
  id: string
  title: string
  messages: TMessage[]
  activeRun: TActiveRun | null
  updatedAt: number
}
