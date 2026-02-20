import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { PWGameWorldHelper, SendableBlockPacket } from 'pw-js-world'
import { BotType } from '@/core/enum/BotType.ts'

interface PwClientStore {
  pwGameClient?: PWGameClient
  pwApiClient?: PWApiClient
  pwGameWorldHelper?: PWGameWorldHelper
  worldId: string
  email: string
  password: string
  secretEditKey: string
  botType: BotType
  totalBlocksLeftToReceiveFromWorldBlockPlacedPacket: number
  unsuccessfullyPlacedBlockPackets: Map<string, SendableBlockPacket>
  blocks: ListBlockResult[]
  blocksByPwId: Map<number, ListBlockResult>
  blocksByPwName: Map<string, ListBlockResult>
  isConnected: boolean
  roomType: string
  isAdminModeOn: boolean
}

const store = createPwClientStore()

function createPwClientStore(): PwClientStore {
  return {
    pwGameClient: undefined,
    pwApiClient: undefined,
    pwGameWorldHelper: undefined,
    worldId: '',
    email: '',
    password: '',
    secretEditKey: '',
    botType: BotType.COPY_BOT,
    totalBlocksLeftToReceiveFromWorldBlockPlacedPacket: 0,
    unsuccessfullyPlacedBlockPackets: new Map(),
    blocks: [],
    blocksByPwId: new Map(),
    blocksByPwName: new Map(),
    isConnected: false,
    roomType: '',
    isAdminModeOn: false,
  }
}

export function resetPwClientStore() {
  Object.assign(store, createPwClientStore())
}

export function usePwClientStore(): PwClientStore {
  return store
}

export function getPwGameClient(): PWGameClient {
  return store.pwGameClient!
}

export function getPwApiClient(): PWApiClient {
  return store.pwApiClient!
}

export function getPwGameWorldHelper(): PWGameWorldHelper {
  return store.pwGameWorldHelper!
}

export function getPwBlocks(): ListBlockResult[] {
  return store.blocks
}

// TODO: Think what to do about blockid = 0 as there is more than 1 entry
export function getPwBlocksByPwId(): Map<number, ListBlockResult> {
  return store.blocksByPwId
}

// TODO: Think what to do about blockname = EMPTY as there is more than 1 entry
export function getPwBlocksByPwName(): Map<string, ListBlockResult> {
  return store.blocksByPwName
}

export function getPwBotType(): BotType {
  return store.botType
}
