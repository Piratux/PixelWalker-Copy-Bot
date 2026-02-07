import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { CurseBotMapEntry } from '@/bot/cursebot/type/CurseBotMapEntry.ts'
import { CurseBotState } from '@/bot/cursebot/enum/CurseBotState.ts'
import { PlayerCurseBotWorldData } from '@/bot/cursebot/type/CurseBotPlayerWorldData.ts'
import { Block } from 'pw-js-world'

export const useCurseBotWorldStore = defineStore('CurseBotWorldStore', () => {
  const curseBotMaps = ref<Raw<CurseBotMapEntry[]>>([])
  const currentState = ref<CurseBotState>(CurseBotState.STOPPED)
  const playerCurseBotWorldData = ref<Raw<PlayerCurseBotWorldData>>(new Map())
  const everySecondUpdateIsRunning = ref<boolean>(false)
  const lastActivePlayerCount = ref<number>(0)
  const mapClearAfterEachRoundFgBlock = ref<Raw<Block>>(new Block(0))

  return {
    curseBotMaps,
    currentState,
    playerCurseBotWorldData,
    everySecondUpdateIsRunning,
    lastActivePlayerCount,
    mapClearAfterEachRoundFgBlock,
  }
})
