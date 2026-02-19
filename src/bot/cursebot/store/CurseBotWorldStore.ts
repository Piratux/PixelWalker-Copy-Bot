import { CurseBotMapEntry } from '@/bot/cursebot/type/CurseBotMapEntry.ts'
import { CurseBotState } from '@/bot/cursebot/enum/CurseBotState.ts'
import { CurseBotPlayerWorldData } from '@/bot/cursebot/type/CurseBotPlayerWorldData.ts'
import { Block } from 'pw-js-world'

interface CurseBotWorldStore {
  curseBotMaps: CurseBotMapEntry[]
  currentState: CurseBotState
  playerCurseBotWorldData: Map<number, CurseBotPlayerWorldData>
  everySecondUpdateIsRunning: boolean
  lastActivePlayerCount: number
  mapClearAfterEachRoundFgBlock: Block
}

const store = createCurseBotWorldStore()

function createCurseBotWorldStore(): CurseBotWorldStore {
  return {
    curseBotMaps: [],
    currentState: CurseBotState.STOPPED,
    playerCurseBotWorldData: new Map(),
    everySecondUpdateIsRunning: false,
    lastActivePlayerCount: 0,
    mapClearAfterEachRoundFgBlock: new Block(0),
  }
}

export function resetCurseBotWorldStore() {
  Object.assign(store, createCurseBotWorldStore())
}

export function useCurseBotWorldStore(): CurseBotWorldStore {
  return store
}
