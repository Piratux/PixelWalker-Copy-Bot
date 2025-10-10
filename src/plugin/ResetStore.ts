import { cloneDeep } from 'lodash-es'
import { getActivePinia, Pinia, PiniaPluginContext, Store } from 'pinia'

export function resetStorePlugin({ store }: PiniaPluginContext) {
  const initialState = cloneDeep(store.$state)
  store.$reset = () =>
    store.$patch(($state) => {
      Object.assign($state, cloneDeep(initialState))
    })
}

interface ExtendedPinia extends Pinia {
  _s: Map<string, Store>
}

export function resetAllStores() {
  const pinia = getActivePinia() as ExtendedPinia | undefined

  if (!pinia) {
    throw new Error('There is no active Pinia instance')
  }

  pinia._s.forEach((store) => store.$reset())
}
