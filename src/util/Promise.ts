export function createAsyncCallback(callback: () => void): () => Promise<void> {
  return () =>
    new Promise<void>((resolve) => {
      callback()
      resolve()
    })
}


// This should be an exact copy of ps-js-api's Promisable type.
export type Promisable<T> = T | Promise<T>;