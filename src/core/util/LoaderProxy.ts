import { Ref } from 'vue'
import { sleep } from '@/core/util/Sleep.ts'

export async function withLoading(loading: Ref<boolean>, callback: () => Promise<void>) {
  loading.value = true

  // Sleep is needed, so that UI gets updated, especially if callback was constructed from synchronous function using createAsyncCallback().
  // Sleep length indicates minimum time amount for which double click is prevented.
  await sleep(500)
  try {
    await callback()
  } finally {
    loading.value = false
  }
}
