import { BArenaBotState } from '@/bot/barenabot/enum/BArenaBotState.ts'
import { BArenaBotPlayerWorldData } from '@/bot/barenabot/type/BArenaBotPlayerWorldData.ts'
import { Block } from 'pw-js-world'

interface BArenaBotWorldStore {
  currentState: BArenaBotState
  playerBArenaBotWorldData: Map<number, BArenaBotPlayerWorldData>
  everyTickUpdateIsRunning: boolean
  ticksPassed: number
  lastActivePlayerCount: number
  teamBluePlayerFgBlocks: Block[]
  teamRedPlayerFgBlocks: Block[]
  teamBlueProjectileFgBlock: Block
  teamRedProjectileFgBlock: Block
  playerIdQueue: number[]
}

const store = createBArenaBotWorldStore()

function createBArenaBotWorldStore(): BArenaBotWorldStore {
  return {
    currentState: BArenaBotState.STOPPED,
    playerBArenaBotWorldData: new Map(),
    everyTickUpdateIsRunning: false,
    ticksPassed: 0,
    lastActivePlayerCount: 0,
    teamBluePlayerFgBlocks: [],
    teamRedPlayerFgBlocks: [],
    teamBlueProjectileFgBlock: new Block(0),
    teamRedProjectileFgBlock: new Block(0),
    playerIdQueue: [],
  }
}

export function resetBArenaBotWorldStore() {
  Object.assign(store, createBArenaBotWorldStore())
}

export function useBArenaBotWorldStore(): BArenaBotWorldStore {
  return store
}
