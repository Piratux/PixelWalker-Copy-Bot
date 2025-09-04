import { setTimeout as workerSetTimeout } from 'worker-timers'

// NOTE: workerSetTimeout makes sure sleeps are not throttled in inactive tabs (this is required as bot is hosted on browser)

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
