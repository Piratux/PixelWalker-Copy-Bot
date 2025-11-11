import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EELVL_BLOCKS, EelvlBlock } from '@/webtool/eelvl/block/EelvlBlocks.ts'
import ManyKeysMap from 'many-keys-map'
import { ListBlockResult } from 'pw-js-api'

export const useEelvlClientStore = defineStore('EelvlClientStore', () => {
  const blocksById = computed<Map<number, EelvlBlock>>(() => {
    return EELVL_BLOCKS.reduce((acc: Map<number, EelvlBlock>, item: EelvlBlock) => {
      acc.set(item.id, item)
      return acc
    }, new Map())
  })

  const blocksByParameters = ref<ManyKeysMap<number[], ListBlockResult>>(new ManyKeysMap()) // Key consist of [LegacyId, LegacyMorph]

  return {
    blocksById,
    blocksByParameters,
  }
})

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getEelvlBlocksById(): Map<number, EelvlBlock> {
  return useEelvlClientStore().blocksById
}

export function getPwBlocksByEelvlParameters(): ManyKeysMap<number[], ListBlockResult> {
  return useEelvlClientStore().blocksByParameters
}
