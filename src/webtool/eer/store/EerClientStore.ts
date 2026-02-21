import ManyKeysMap from 'many-keys-map'
import { EerListBlockResult } from '@/webtool/eer/block/EerMappings.ts'

interface EerClientStore {
  blocksByParameters: ManyKeysMap<number[], EerListBlockResult>
}

const store = createEerClientStore()

function createEerClientStore(): EerClientStore {
  return {
    blocksByParameters: new ManyKeysMap(),
  }
}

export function resetEerClientStore() {
  Object.assign(store, createEerClientStore())
}

export function useEerClientStore(): EerClientStore {
  return store
}
