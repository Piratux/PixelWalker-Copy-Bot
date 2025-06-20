import { defineStore } from 'pinia'
import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { PWGameWorldHelper } from 'pw-js-world'
import { Raw, ref } from 'vue'
import ManyKeysMap from 'many-keys-map'

export const usePWClientStore = defineStore('PWClientStore', () => {
  const pwGameClient = ref<Raw<PWGameClient> | undefined>(undefined)
  const pwApiClient = ref<Raw<PWApiClient> | undefined>(undefined)
  const pwGameWorldHelper = ref<Raw<PWGameWorldHelper> | undefined>(undefined)
  const worldId = ref<string>('')
  const email = ref<string>('')
  const password = ref<string>('')
  const secretEditKey = ref<string>('')
  const totalBlocksLeftToReceiveFromWorldImport = ref<number>(0)
  const blocks = ref<ListBlockResult[]>([]) // sorted and uppercased blocks
  const blocksByPwId = ref<Record<number, ListBlockResult>>({})
  const blocksByPwName = ref<Record<string, ListBlockResult>>({})
  const blocksByEelvlParameters = ref<ManyKeysMap<number[], ListBlockResult>>(new ManyKeysMap()) // Key consist of [LegacyId, LegacyMorph]
  const isConnected = ref<boolean>(false)

  return {
    pwGameClient,
    pwApiClient,
    pwGameWorldHelper,
    worldId,
    email,
    password,
    secretEditKey,
    totalBlocksLeftToReceiveFromWorldImport,
    blocks,
    blocksByPwId,
    blocksByPwName,
    blocksByEelvlParameters,
    isConnected,
  }
})

export function getPwGameClient(): PWGameClient {
  return usePWClientStore().pwGameClient!
}

export function getPwApiClient(): PWApiClient {
  return usePWClientStore().pwApiClient!
}

export function getPwGameWorldHelper(): PWGameWorldHelper {
  return usePWClientStore().pwGameWorldHelper!
}

export function getPwBlocks(): ListBlockResult[] {
  return usePWClientStore().blocks
}

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getPwBlocksByPwId(): Record<number, ListBlockResult> {
  return usePWClientStore().blocksByPwId
}

// TODO: Think what to do about blockname = EMPTY as there is more than 1 entry
export function getPwBlocksByPwName(): Record<string, ListBlockResult> {
  return usePWClientStore().blocksByPwName
}

export function getPwBlocksByEelvlParameters(): ManyKeysMap<number[], ListBlockResult> {
  return usePWClientStore().blocksByEelvlParameters
}
