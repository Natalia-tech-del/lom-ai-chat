// Создаёт Promise с задержкой, который можно досрочно отменить через AbortSignal.
export const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(signal.reason)
    }

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal.addEventListener('abort', onAbort)
  })
