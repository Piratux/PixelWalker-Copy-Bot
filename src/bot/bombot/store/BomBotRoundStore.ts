import { Player } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { BomBotPlayerRoundData } from '@/bot/bombot/type/BomBotPlayerRoundData.ts'
import { BomBotSpecialBomb } from '@/bot/bombot/enum/BomBotSpecialBomb.ts'

interface BomBotRoundStore {
  availablePlayerSpawnPositions: vec2[]
  playersInGame: Player[]
  lastPlayerSelectedArrayIndex: number
  totalPlayersTeleportedToMap: number
  totalPlayersTeleportedToMapLastSeenValue: number
  totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch: number
  playersThatWereSelectedForRoundStart: Player[]
  playerIdsBomberQueueOriginal: number[]
  playerIdsBomberQueueRemainder: number[]
  bomberPlayerId: number
  secondsSpentByBomber: number
  secondsLeftBeforeBombMustBeRemoved: number
  secondsLeftBeforeBomberCanBomb: number
  lastBombPos: vec2
  lastBombType: BomBotSpecialBomb | null
  bombAvailable: boolean
  waitingForMorePlayersMessagePrintedOnce: boolean
  playerBomBotRoundData: Map<number, BomBotPlayerRoundData>
}

const store = createBomBotRoundStore()

function createBomBotRoundStore(): BomBotRoundStore {
  return {
    availablePlayerSpawnPositions: [],
    playersInGame: [],
    lastPlayerSelectedArrayIndex: 0,
    totalPlayersTeleportedToMap: 0,
    totalPlayersTeleportedToMapLastSeenValue: 0,
    totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch: 0,
    playersThatWereSelectedForRoundStart: [],
    playerIdsBomberQueueOriginal: [],
    playerIdsBomberQueueRemainder: [],
    bomberPlayerId: 0,
    secondsSpentByBomber: 0,
    secondsLeftBeforeBombMustBeRemoved: 0,
    secondsLeftBeforeBomberCanBomb: 0,
    lastBombPos: vec2(0, 0),
    lastBombType: null,
    bombAvailable: false,
    waitingForMorePlayersMessagePrintedOnce: false,
    playerBomBotRoundData: new Map(),
  }
}

export function resetBomBotRoundStore() {
  Object.assign(store, createBomBotRoundStore())
}

export function useBomBotRoundStore(): BomBotRoundStore {
  return store
}
