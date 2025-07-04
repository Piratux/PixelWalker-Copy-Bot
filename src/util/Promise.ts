export function createAsyncCallback(callback: () => void): () => Promise<void> {
  return () =>
    new Promise<void>((resolve) => {
      callback()
      resolve()
    })
}
