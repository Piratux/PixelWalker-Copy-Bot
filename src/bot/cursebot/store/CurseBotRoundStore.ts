import { Player } from 'pw-js-world'

interface CurseBotRoundStore {
  playersInGame: Player[]
  waitingForMorePlayersMessagePrintedOnce: boolean
  secondsPassedInCountingDownToRemoveNoSpeedState: number
  secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState: number
  secondsPassedInCelebratingVictoryState: number
  timestampInMsWhenCursePickedUp: number
  lastPlayerIdWithCurseEffect: number
  winnerPlayerId: number
}

const store = createCurseBotRoundStore()

function createCurseBotRoundStore(): CurseBotRoundStore {
  return {
    playersInGame: [],
    waitingForMorePlayersMessagePrintedOnce: false,
    secondsPassedInCountingDownToRemoveNoSpeedState: 0,
    secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState: 0,
    secondsPassedInCelebratingVictoryState: 0,
    timestampInMsWhenCursePickedUp: 0,
    lastPlayerIdWithCurseEffect: 0,
    winnerPlayerId: 0,
  }
}

export function resetCurseBotRoundStore() {
  Object.assign(store, createCurseBotRoundStore())
}

export function useCurseBotRoundStore(): CurseBotRoundStore {
  return store
}
