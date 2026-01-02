import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Player } from 'pw-js-world'

export const useCurseBotRoundStore = defineStore('CurseBotRoundStore', () => {
  const playersInGame = ref<Player[]>([])
  const waitingForMorePlayersMessagePrintedOnce = ref<boolean>(false)
  const secondsPassedInCountingDownToRemoveNoSpeedState = ref<number>(0)
  const secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState = ref<number>(0)
  const secondsPassedInCelebratingVictoryState = ref<number>(0)
  const timestampInMsWhenCursePickedUp = ref<number>(0)
  const lastPlayerIdWithCurseEffect = ref<number>(0)
  const winnerPlayerId = ref<number>(0)

  return {
    playersInGame,
    waitingForMorePlayersMessagePrintedOnce,
    secondsPassedInCountingDownToRemoveNoSpeedState,
    secondsPassedInWaitingForAllPlayersToBeTeleportedToMapState,
    secondsPassedInCelebratingVictoryState,
    timestampInMsWhenCursePickedUp,
    lastPlayerIdWithCurseEffect,
    winnerPlayerId,
  }
})
