import { BArenaPlayerBotRoundData } from '@/bot/barenabot/type/BArenaBotPlayerRoundData.ts'
import { BArenaBotProjectileRoundData } from '@/bot/barenabot/type/BArenaBotProjectileRoundData.ts'
import { type BArenaEvent } from '@/bot/barenabot/type/BArenaEvent.ts'

interface BArenaBotRoundStore {
  waitingForMorePlayersMessagePrintedOnce: boolean
  secondsPassedInCelebratingVictoryState: number
  secondsPassedInCountingDownForRoundStartState: number
  timestampInMsWhenRoundStart: number
  playerBArenaBotRoundData: Map<number, BArenaPlayerBotRoundData>
  startingPlayerBArenaBotRoundData: Map<number, BArenaPlayerBotRoundData>
  projectileBArenaBotRoundData: BArenaBotProjectileRoundData[]
  roundEvents: BArenaEvent[]
}

const store = createBArenaBotRoundStore()

function createBArenaBotRoundStore(): BArenaBotRoundStore {
  return {
    waitingForMorePlayersMessagePrintedOnce: false,
    secondsPassedInCelebratingVictoryState: 0,
    secondsPassedInCountingDownForRoundStartState: 0,
    timestampInMsWhenRoundStart: 0,
    playerBArenaBotRoundData: new Map(),
    startingPlayerBArenaBotRoundData: new Map(),
    projectileBArenaBotRoundData: [],
    roundEvents: [],
  }
}

export function resetBArenaBotRoundStore() {
  Object.assign(store, createBArenaBotRoundStore())
}

export function useBArenaBotRoundStore(): BArenaBotRoundStore {
  return store
}
