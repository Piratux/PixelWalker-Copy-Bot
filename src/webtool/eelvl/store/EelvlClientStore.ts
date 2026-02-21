import { EELVL_BLOCKS, EelvlBlock } from '@/webtool/eelvl/block/EelvlBlocks.ts'
import ManyKeysMap from 'many-keys-map'
import { ListBlockResult } from 'pw-js-api'

interface EelvlClientStore {
  blocksById: Map<number, EelvlBlock> // NOTE: There is more than 1 entry for blockid = 0
  blocksByParameters: ManyKeysMap<number[], ListBlockResult>
}

const store = createEelvlClientStore()

function createEelvlClientStore(): EelvlClientStore {
  return {
    blocksById: EELVL_BLOCKS.reduce((acc: Map<number, EelvlBlock>, item: EelvlBlock) => {
      acc.set(item.id, item)
      return acc
    }, new Map()),
    blocksByParameters: new ManyKeysMap(),
  }
}

export function resetEelvlClientStore() {
  Object.assign(store, createEelvlClientStore())
}

export function useEelvlClientStore(): EelvlClientStore {
  return store
}
