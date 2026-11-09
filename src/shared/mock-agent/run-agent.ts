// Имитация бэкенда - работы AI-агента
import { pickScript, type TScript } from './pick-script'
import {
  defaultReply,
  errorReply,
  explainNewton,
  explainOhm,
  hintReply,
  missingTopicReply,
  simplerNewton,
  simplerOhm,
} from './replies'
import { sleep } from './sleep'
import type { TAgentEvent, TAgentMessage } from './types'

const STATUS_MS = 450
const TOOL_MS = 500
const DELTA_MS = 40

const textFor = (script: TScript) => {
  if (script.kind === 'explain' && script.topic === 'newton') {
    return explainNewton
  }

  if (script.kind === 'explain' && script.topic === 'ohm') {
    return explainOhm
  }

  if (script.kind === 'simpler' && script.topic === 'newton') {
    return simplerNewton
  }

  if (script.kind === 'simpler' && script.topic === 'ohm') {
    return simplerOhm
  }

  if (script.kind === 'simpler') {
    return missingTopicReply
  }

  if (script.kind === 'hint') {
    return hintReply
  }

  return defaultReply
}

// Разбивает текст на части, ориентируясь на длину 28 символов
const splitText = (text: string) => {
  const chunks: string[] = []
  let current = ''

  for (const part of text.split(/(\s+)/)) {
    if (current && current.length + part.length > 28) {
      chunks.push(current)
      current = part
    } else {
      current += part
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

// Постепенная отправка текста
async function* streamText(text: string, signal: AbortSignal) {
  for (const chunk of splitText(text)) {
    yield { type: 'text_delta', text: chunk } satisfies TAgentEvent
    await sleep(DELTA_MS, signal)
  }
}

export async function* runAgent(
  history: TAgentMessage[],
  signal: AbortSignal,
): AsyncGenerator<TAgentEvent> {
  const script = pickScript(history)

  try {
    yield { type: 'status', message: 'Анализирую задачу' }
    await sleep(STATUS_MS, signal)

    if (script.kind === 'error') {
      yield { type: 'error', message: errorReply }
      return
    }

    if (script.kind === 'calculator') {
      const input = `${script.left} * ${script.right}`
      const result = String(script.left * script.right)

      yield { type: 'status', message: 'Использую калькулятор' }
      yield { type: 'tool_call', tool: 'calculator', input }
      await sleep(TOOL_MS, signal)
      yield { type: 'tool_result', tool: 'calculator', result }
      yield { type: 'status', message: 'Формирую ответ' }
      await sleep(STATUS_MS, signal)
      yield* streamText(`${script.left} × ${script.right} = ${result}.`, signal)
      yield { type: 'completed' }
      return
    }

    yield { type: 'status', message: 'Формирую ответ' }
    await sleep(STATUS_MS, signal)
    yield* streamText(textFor(script), signal)
    yield { type: 'completed' }
  } catch {
    if (signal.aborted) {
      return
    }

    throw new Error('Не получилось ответить.')
  }
}
