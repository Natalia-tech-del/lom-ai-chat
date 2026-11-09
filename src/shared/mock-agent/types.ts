export type TAgentMessage = {
  role: 'user' | 'assistant'
  text: string
}

// событие, которое агент отдает наружу
export type TAgentEvent =
  | { type: 'status'; message: string }
  | { type: 'tool_call'; tool: string; input: string }
  | { type: 'tool_result'; tool: string; result: string }
  | { type: 'text_delta'; text: string }
  | { type: 'completed' }
  | { type: 'error'; message: string }
