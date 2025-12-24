import { defineStore } from 'pinia'
import { ref } from 'vue'
import ManyKeysMap from 'many-keys-map'
import { EerListBlockResult } from '@/webtool/eer/block/EerMappings.ts'

export const useEerClientStore = defineStore('EerClientStore', () => {
  const blocksByParameters = ref<ManyKeysMap<number[], EerListBlockResult>>(new ManyKeysMap()) // Key consist of [LegacyId, LegacyMorph]

  return {
    blocksByParameters,
  }
})

export function getPwBlocksByEerParameters(): ManyKeysMap<number[], EerListBlockResult> {
  return useEerClientStore().blocksByParameters
}
