import { defineStore } from 'pinia'
import { ref } from 'vue'
import ManyKeysMap from 'many-keys-map'
import { ListBlockResult } from 'pw-js-api'

export const useEerClientStore = defineStore('EerClientStore', () => {
  const blocksByParameters = ref<ManyKeysMap<number[], ListBlockResult>>(new ManyKeysMap()) // Key consist of [LegacyId, LegacyMorph]

  return {
    blocksByParameters,
  }
})

export function getPwBlocksByEerParameters(): ManyKeysMap<number[], ListBlockResult> {
  return useEerClientStore().blocksByParameters
}
