import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { simplerNewton } from './replies'
import { runAgent } from './run-agent'
import type { TAgentEvent, TAgentMessage } from './types'

const collect = async (history: TAgentMessage[]): Promise<TAgentEvent[]> => {
  const events: TAgentEvent[] = []
  const controller = new AbortController()
  const running = (async () => {
    for await (const event of runAgent(history, controller.signal)) {
      events.push(event)
    }
  })()

  await vi.runAllTimersAsync()
  await running
  return events
}

const joinedText = (events: TAgentEvent[]) =>
  events
    .filter((event) => event.type === 'text_delta')
    .map((event) => event.text)
    .join('')

describe('runAgent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('считает произведение через калькулятор', async () => {
    const events = await collect([{ role: 'user', text: 'Сколько будет 17 × 24?' }])

    expect(events[0]).toEqual({ type: 'status', message: 'Анализирую задачу' })
    expect(events).toContainEqual({
      type: 'tool_call',
      tool: 'calculator',
      input: '17 * 24',
    })
    expect(events).toContainEqual({
      type: 'tool_result',
      tool: 'calculator',
      result: '408',
    })
    expect(joinedText(events)).toContain('408')
    expect(events.at(-1)).toEqual({ type: 'completed' })
  })

  it('упрощает предыдущее объяснение Ньютона', async () => {
    const events = await collect([
      { role: 'user', text: 'Объясни второй закон Ньютона' },
      { role: 'assistant', text: 'Длинное объяснение' },
      { role: 'user', text: 'А теперь объясни проще' },
    ])

    expect(joinedText(events)).toBe(simplerNewton)
  })

  it('отдаёт ошибку по ключевой фразе', async () => {
    const events = await collect([{ role: 'user', text: 'покажи ошибку' }])

    expect(events.some((event) => event.type === 'error')).toBe(true)
    expect(events.some((event) => event.type === 'completed')).toBe(false)
  })

  it('перестаёт слать события после остановки', async () => {
    const controller = new AbortController()
    const events: TAgentEvent[] = []
    const running = (async () => {
      for await (const event of runAgent(
        [{ role: 'user', text: 'Объясни закон Ома' }],
        controller.signal,
      )) {
        events.push(event)
      }
    })()

    await vi.advanceTimersByTimeAsync(450)
    controller.abort()
    await vi.runAllTimersAsync()
    await running

    expect(events.some((event) => event.type === 'completed')).toBe(false)
  })
})
