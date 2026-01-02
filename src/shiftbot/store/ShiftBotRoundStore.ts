import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { Player } from 'pw-js-world'
import { ShiftBotLevelDifficulty } from '@/shiftbot/enum/ShiftBotLevelDifficulty.ts'
import { ShiftBotMapEntry } from '@/shiftbot/type/ShiftBotMapEntry.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'

export const useShiftBotRoundStore = defineStore('ShiftBotRoundStore', () => {
  const playersInGame = ref<Player[]>([])
  const waitingForMorePlayersMessagePrintedOnce = ref<boolean>(false)
  const secondsPassedInCountingDownToRemoveNoSpeedState = ref<number>(0)
  const secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState = ref<number>(0)
  const secondsPassedInCelebratingVictoryState = ref<number>(0)
  const winnerPlayerId = ref<number>(0)
  const currentLevelDifficulty = ref<ShiftBotLevelDifficulty>(ShiftBotLevelDifficulty.EASY)
  const currentLevel = ref<number>(0)
  const timestampInMsWhenRoundStarted = ref<number>(0)
  const timestampInMsWhenFirstPlayerCompletedLevel = ref<number>(0)
  const atLeastOnePlayerCompletedLevel = ref<boolean>(false)
  const currentMapEntry = ref<Raw<ShiftBotMapEntry> | null>(null)
  const entranceCloseBlocks = ref<Raw<WorldBlock[]>>([])
  const secondsPassedInPlayingState = ref<number>(0)
  const playersInformedOnceThatMinuteLeftBeforeMaxRoundLength = ref<boolean>(false)

  return {
    playersInGame,
    waitingForMorePlayersMessagePrintedOnce,
    secondsPassedInCountingDownToRemoveNoSpeedState,
    secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState,
    secondsPassedInCelebratingVictoryState,
    winnerPlayerId,
    currentLevelDifficulty,
    currentLevel,
    timestampInMsWhenRoundStarted,
    timestampInMsWhenFirstPlayerCompletedLevel,
    atLeastOnePlayerCompletedLevel,
    currentMapEntry,
    entranceCloseBlocks,
    secondsPassedInPlayingState,
    playersInformedOnceThatMinuteLeftBeforeMaxRoundLength,
  }
})
