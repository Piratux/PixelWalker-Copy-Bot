import { ShiftBotMapEntry } from '@/bot/shiftbot/type/ShiftBotMapEntry.ts'
import { ShiftBotState } from '@/bot/shiftbot/enum/ShiftBotState.ts'
import { ShiftBotPlayerWorldData } from '@/bot/shiftbot/type/ShiftBotPlayerWorldData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block } from 'pw-js-world'

interface ShiftBotWorldStore {
  shiftBotMaps: ShiftBotMapEntry[][]
  currentState: ShiftBotState
  playerShiftBotWorldData: Map<number, ShiftBotPlayerWorldData>
  everySecondUpdateIsRunning: boolean
  lastActivePlayerCount: number
  mapRoundClearBlocks: WorldBlock[]
  mapFirstRoundPrepareBlocks: WorldBlock[]
  mapSurroundingBlocks: WorldBlock[]
  mapRoundStartBlocks: WorldBlock[]
  map5SecondsAfterRoundStartBlocks: WorldBlock[]
  mapEntranceBlock: Block
  mapExitBlock: Block
  arrowUpBlock: Block
  arrowLeftBlock: Block
  arrowRightBlock: Block
  mapEntranceCloseBlock: Block
  mapExitCloseBlock: Block
  coinBlock: Block
}

const store = createShiftBotWorldStore()

function createShiftBotWorldStore(): ShiftBotWorldStore {
  return {
    shiftBotMaps: [[], [], []],
    currentState: ShiftBotState.STOPPED,
    playerShiftBotWorldData: new Map(),
    everySecondUpdateIsRunning: false,
    lastActivePlayerCount: 0,
    mapRoundClearBlocks: [],
    mapFirstRoundPrepareBlocks: [],
    mapSurroundingBlocks: [],
    mapRoundStartBlocks: [],
    map5SecondsAfterRoundStartBlocks: [],
    mapEntranceBlock: new Block(0),
    mapExitBlock: new Block(0),
    arrowUpBlock: new Block(0),
    arrowLeftBlock: new Block(0),
    arrowRightBlock: new Block(0),
    mapEntranceCloseBlock: new Block(0),
    mapExitCloseBlock: new Block(0),
    coinBlock: new Block(0),
  }
}

export function resetShiftBotWorldStore() {
  Object.assign(store, createShiftBotWorldStore())
}

export function useShiftBotWorldStore(): ShiftBotWorldStore {
  return store
}
