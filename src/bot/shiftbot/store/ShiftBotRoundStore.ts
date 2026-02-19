import { Player } from 'pw-js-world'
import { ShiftBotLevelDifficulty } from '@/bot/shiftbot/enum/ShiftBotLevelDifficulty.ts'
import { ShiftBotMapEntry } from '@/bot/shiftbot/type/ShiftBotMapEntry.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'

interface ShiftBotRoundStore {
  playersInGame: Player[]
  waitingForMorePlayersMessagePrintedOnce: boolean
  secondsPassedInCountingDownToRemoveNoSpeedState: number
  secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState: number
  secondsPassedInPauseAfterRoundState: number
  winnerPlayerId: number | null
  currentLevelDifficulty: ShiftBotLevelDifficulty
  currentLevel: number
  timestampInMsWhenRoundStarted: number
  timestampInMsWhenFirstPlayerCompletedLevel: number
  atLeastOnePlayerCompletedLevel: boolean
  currentMapEntry: ShiftBotMapEntry | null
  entranceCloseBlocks: WorldBlock[]
  secondsPassedInPlayingState: number
  playersInformedOnceThatMinuteLeftBeforeMaxRoundLength: boolean
  playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecausePlayerWon: boolean
  playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecauseMaxRoundLengthReached: boolean
}

const store = createShiftBotRoundStore()

function createShiftBotRoundStore(): ShiftBotRoundStore {
  return {
    playersInGame: [],
    waitingForMorePlayersMessagePrintedOnce: false,
    secondsPassedInCountingDownToRemoveNoSpeedState: 0,
    secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState: 0,
    secondsPassedInPauseAfterRoundState: 0,
    winnerPlayerId: 0,
    currentLevelDifficulty: ShiftBotLevelDifficulty.EASY,
    currentLevel: 0,
    timestampInMsWhenRoundStarted: 0,
    timestampInMsWhenFirstPlayerCompletedLevel: 0,
    atLeastOnePlayerCompletedLevel: false,
    currentMapEntry: null,
    entranceCloseBlocks: [],
    secondsPassedInPlayingState: 0,
    playersInformedOnceThatMinuteLeftBeforeMaxRoundLength: false,
    playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecausePlayerWon: false,
    playersInformedOnceThatFiveSecondsLeftBeforeRoundEndsBecauseMaxRoundLengthReached: false,
  }
}

export function resetShiftBotRoundStore() {
  Object.assign(store, createShiftBotRoundStore())
}

export function useShiftBotRoundStore(): ShiftBotRoundStore {
  return store
}
