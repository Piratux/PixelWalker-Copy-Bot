import { defineStore } from 'pinia'
import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { PWGameWorldHelper } from 'pw-js-world'
import { Raw, ref } from 'vue'
import { BotType } from '@/core/enum/BotType.ts'

export const usePwClientStore = defineStore('PwClientStore', () => {
  const pwGameClient = ref<Raw<PWGameClient> | undefined>(undefined)
  const pwApiClient = ref<Raw<PWApiClient> | undefined>(undefined)
  const pwGameWorldHelper = ref<Raw<PWGameWorldHelper> | undefined>(undefined)
  const worldId = ref<string>('')
  const email = ref<string>('')
  const password = ref<string>('')
  const secretEditKey = ref<string>('')
  const botType = ref<BotType>(BotType.COPY_BOT)
  const totalBlocksLeftToReceiveFromWorldBlockPlacedPacket = ref<number>(0)
  const blocks = ref<ListBlockResult[]>([]) // sorted and uppercased blocks
  const blocksByPwId = ref<Record<number, ListBlockResult>>({})
  const blocksByPwName = ref<Record<string, ListBlockResult>>({})
  const isConnected = ref<boolean>(false)
  const roomType = ref<string>('')

  return {
    pwGameClient,
    pwApiClient,
    pwGameWorldHelper,
    worldId,
    email,
    password,
    secretEditKey,
    botType,
    totalBlocksLeftToReceiveFromWorldBlockPlacedPacket,
    blocks,
    blocksByPwId,
    blocksByPwName,
    isConnected,
    roomType,
  }
})

export function getPwGameClient(): PWGameClient {
  return usePwClientStore().pwGameClient!
}

export function getPwApiClient(): PWApiClient {
  return usePwClientStore().pwApiClient!
}

export function getPwGameWorldHelper(): PWGameWorldHelper {
  return usePwClientStore().pwGameWorldHelper!
}

export function getPwBlocks(): ListBlockResult[] {
  return usePwClientStore().blocks
}

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getPwBlocksByPwId(): Record<number, ListBlockResult> {
  return usePwClientStore().blocksByPwId
}

// TODO: Think what to do about blockname = EMPTY as there is more than 1 entry
export function getPwBlocksByPwName(): Record<string, ListBlockResult> {
  return usePwClientStore().blocksByPwName
}

export function getPwBotType(): BotType {
  return usePwClientStore().botType
}
