import { defineStore } from 'pinia'
import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { PWGameWorldHelper } from 'pw-js-world'
import { computed, markRaw, ref } from 'vue'

export const usePWClientStore = defineStore('PWClientStore', () => {
  let _pwGameClient: PWGameClient | undefined
  let _pwApiClient: PWApiClient | undefined
  const _blocks: ListBlockResult[] = [] // sorted and uppercased blocks
  const pwGameWorldHelper = markRaw(new PWGameWorldHelper())
  const worldId = ref<string>('')
  const email = ref<string>('')
  const password = ref<string>('')
  const secretEditKey = ref<string>('')
  const totalBlocksLeftToReceiveFromWorldImport = ref<number>(0)
  const blocksById: Record<number, ListBlockResult> = {}
  const blocksByName: Record<string, ListBlockResult> = {}

  const pwGameClient = computed<PWGameClient | undefined>(() => {
    if (!_pwApiClient) {
      return undefined
    }
    return _pwGameClient
  })

  function setPwGameClient(client: PWGameClient | undefined) {
    _pwGameClient = client
  }

  const pwApiClient = computed<PWApiClient | undefined>(() => {
    if (!_pwApiClient) {
      return undefined
    }
    return _pwApiClient
  })

  function setPwApiClient(client: PWApiClient | undefined) {
    _pwApiClient = client
  }

  function initBlocks(blocks: ListBlockResult[]) {
    blocks = blocks
      .sort((a, b) => a.Id - b.Id)
      .map((block) => ({
        ...block,
        PaletteId: block.PaletteId.toUpperCase(),
      }))
    blocks.forEach((block) => {
      _blocks.push(block)
      blocksById[block.Id] = block
      blocksByName[block.PaletteId] = block
    })
  }

  return {
    pwGameClient,
    pwApiClient,
    pwGameWorldHelper,
    worldId,
    email,
    password,
    secretEditKey,
    totalBlocksLeftToReceiveFromWorldImport,
    _blocks,
    blocksById,
    blocksByName,
    setPwGameClient,
    setPwApiClient,
    initBlocks,
  }
})

export function getPwGameClient(): PWGameClient {
  return usePWClientStore().pwGameClient!
}

export function getPwApiClient(): PWApiClient {
  return usePWClientStore().pwApiClient!
}

export function getPwGameWorldHelper(): PWGameWorldHelper {
  return usePWClientStore().pwGameWorldHelper
}

export function getPwBlocks(): ListBlockResult[] {
  return usePWClientStore()._blocks
}

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getPwBlocksById(): Record<number, ListBlockResult> {
  return usePWClientStore().blocksById
}

// TODO: Think what to do about blockname = EMPTY as there is more than 1 entry
export function getPwBlocksByName(): Record<string, ListBlockResult> {
  return usePWClientStore().blocksByName
}
