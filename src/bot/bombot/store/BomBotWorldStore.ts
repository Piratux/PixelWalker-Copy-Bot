import { Block } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { BomBotMapEntry } from '@/bot/bombot/type/BomBotMapEntry.ts'
import { BomBotState } from '@/bot/bombot/enum/BomBotState.ts'
import { BomBotBlockType } from '@/bot/bombot/enum/BomBotBlockType.ts'
import { BomBotPlayerWorldData } from '@/bot/bombot/type/BomBotPlayerWorldData.ts'
import { BomBotPowerUpData } from '@/bot/bombot/type/BomBotPowerUpData.ts'
import { BomBotSpecialBombData } from '@/bot/bombot/type/BomBotSpecialBombData.ts'

interface BomBotWorldStore {
  defaultBombBlocks: WorldBlock[]
  specialBombData: BomBotSpecialBombData[]
  bombRemoveBlocks: WorldBlock[]
  specialBombRemoveBlocks: WorldBlock[]
  powerUpData: BomBotPowerUpData[]
  bombTimerBgBlockTimeSpent: Block
  bombTimerBgBlockTimeLeft: Block
  bombTypeFgBlockIndicator: Block
  bomBotMaps: BomBotMapEntry[]
  blockTypes: BomBotBlockType[]
  currentState: BomBotState
  playedOnce: boolean
  playerBomBotWorldData: Map<number, BomBotPlayerWorldData>
  everySecondUpdateIsRunning: boolean
  randomEffectBlocks: Block[]
  totalRoundsPassed: number
  lastActivePlayerCount: number
}

const store = createBomBotWorldStore()

function createBomBotWorldStore(): BomBotWorldStore {
  return {
    defaultBombBlocks: [],
    specialBombData: [],
    bombRemoveBlocks: [],
    specialBombRemoveBlocks: [],
    powerUpData: [],
    bombTimerBgBlockTimeSpent: new Block(0),
    bombTimerBgBlockTimeLeft: new Block(0),
    bombTypeFgBlockIndicator: new Block(0),
    bomBotMaps: [],
    blockTypes: [],
    currentState: BomBotState.STOPPED,
    playedOnce: false,
    playerBomBotWorldData: new Map(),
    everySecondUpdateIsRunning: false,
    randomEffectBlocks: [],
    totalRoundsPassed: 0,
    lastActivePlayerCount: 0,
  }
}

export function resetBomBotWorldStore() {
  Object.assign(store, createBomBotWorldStore())
}

export function useBomBotWorldStore(): BomBotWorldStore {
  return store
}
