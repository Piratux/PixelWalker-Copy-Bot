import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { BArenaPlayerBotRoundData } from '@/bot/barenabot/type/BArenaBotPlayerRoundData.ts'
import { BArenaBotProjectileRoundData } from '@/bot/barenabot/type/BArenaBotProjectileRoundData.ts'

export const useBArenaBotRoundStore = defineStore('BArenaBotRoundStore', () => {
  const waitingForMorePlayersMessagePrintedOnce = ref<boolean>(false)
  const secondsPassedInCelebratingVictoryState = ref<number>(0)
  const secondsPassedInCountingDownForRoundStartState = ref<number>(0)
  const timestampInMsWhenRoundStart = ref<number>(0)
  const playerBArenaBotRoundData = ref<Raw<Map<number, BArenaPlayerBotRoundData>>>(new Map())
  const startingPlayerBArenaBotRoundData = ref<Raw<Map<number, BArenaPlayerBotRoundData>>>(new Map()) // Used to know which players were selected at start of game
  const projectileBArenaBotRoundData = ref<Raw<BArenaBotProjectileRoundData[]>>([])

  return {
    waitingForMorePlayersMessagePrintedOnce,
    secondsPassedInCelebratingVictoryState,
    secondsPassedInCountingDownForRoundStartState,
    timestampInMsWhenRoundStart,
    playerBArenaBotRoundData,
    startingPlayerBArenaBotRoundData,
    projectileBArenaBotRoundData,
  }
})
