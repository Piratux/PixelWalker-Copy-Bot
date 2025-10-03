import { defineStore } from 'pinia'
import { computed } from 'vue'
import { EELVL_BLOCKS, EelvlBlock } from '@/eelvl/block/EelvlBlocks.ts'

export const useEelvlClientStore = defineStore('EelvlClientStore', () => {
  const blocksById = computed<Record<number, EelvlBlock>>(() => {
    return EELVL_BLOCKS.reduce((acc: Record<number, EelvlBlock>, item: EelvlBlock) => {
      acc[item.id] = item
      return acc
    }, {})
  })

  const blocksByName = computed<Record<string, EelvlBlock>>(() => {
    return EELVL_BLOCKS.reduce((acc: Record<string, EelvlBlock>, item: EelvlBlock) => {
      acc[item.name] = item
      return acc
    }, {})
  })

  return {
    blocksById,
    blocksByName,
  }
})

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getEelvlBlocksById(): Record<number, EelvlBlock> {
  return useEelvlClientStore().blocksById
}

// TODO: Think what to do about blockname = EMPTY as there is more than 1 entry
export function getEelvlBlocksByName(): Record<string, EelvlBlock> {
  return useEelvlClientStore().blocksByName
}
