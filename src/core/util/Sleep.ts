import { setTimeout as _workerSetTimeoutImpl } from 'worker-timers'

// NOTE: workerSetTimeout makes sure sleeps are not throttled in inactive tabs (this is required as bot is hosted on browser)
// In Node.js environment (no window), fall back to native timers to avoid browser-only Worker API issues
const _isNodeEnv = typeof window === 'undefined'
const workerSetTimeout: (callback: () => void, delay: number) => number = _isNodeEnv
  ? (cb, delay) => setTimeout(cb, delay) as unknown as number
  : _workerSetTimeoutImpl

/**
 * https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
 */
export function sleep(ms = 0): Promise<void> {
  return new Promise((resolve) => {
    workerSetTimeout(resolve, ms)
  })
}

export function setCustomTimeout(callback: () => void, ms = 0): void {
  workerSetTimeout(callback, ms)
}
