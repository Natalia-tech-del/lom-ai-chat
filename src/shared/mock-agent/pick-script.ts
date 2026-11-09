import type { TAgentMessage } from './types'

export type TScript =
  | { kind: 'explain'; topic: 'newton' | 'ohm' }
  | { kind: 'simpler'; topic: 'newton' | 'ohm' | null }
  | { kind: 'calculator'; left: number; right: number }
  | { kind: 'hint' }
  | { kind: 'error' }
  | { kind: 'default' }

// Определяет тему сообщения
const topicOf = (text: string) => {
  if (/ньютон/i.test(text)) {
    return 'newton' as const
  }

  if (/ом[аеу]/i.test(text)) {
    return 'ohm' as const
  }

  return null
}

// Находит последнюю известную тему в истории диалога
const previousTopic = (history: TAgentMessage[]) => {
  let skippedCurrent = false

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index]

    if (message.role !== 'user') {
      continue
    }

    if (!skippedCurrent) {
      skippedCurrent = true
      continue
    }

    const topic = topicOf(message.text)

    if (topic) {
      return topic
    }
  }

  return null
}

// Определяет сценарий ответа на основе последнего сообщения пользователя и истории диалога.
export const pickScript = (history: TAgentMessage[]): TScript => {
  const current = history.findLast((message) => message.role === 'user')
  const text = current?.text ?? ''

  if (/покажи ошибку/i.test(text)) {
    return { kind: 'error' }
  }

  if (/проще/i.test(text)) {
    return { kind: 'simpler', topic: previousTopic(history) }
  }

  if (/не давай ответ|без ответа/i.test(text)) {
    return { kind: 'hint' }
  }

  const product = text.match(/(\d+)\s*[*xх×]\s*(\d+)/i)

  if (product) {
    return {
      kind: 'calculator',
      left: Number(product[1]),
      right: Number(product[2]),
    }
  }

  const topic = topicOf(text)

  if (topic) {
    return { kind: 'explain', topic }
  }

  return { kind: 'default' }
}
