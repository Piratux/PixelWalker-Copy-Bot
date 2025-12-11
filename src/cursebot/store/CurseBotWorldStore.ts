import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { CurseBotMapEntry } from '@/cursebot/type/CurseBotMapEntry.ts'
import { CurseBotState } from '@/cursebot/enum/CurseBotState.ts'
import { PlayerCurseBotWorldData } from '@/cursebot/type/CurseBotPlayerWorldData.ts'

export const useCurseBotWorldStore = defineStore('CurseBotWorldStore', () => {
  const curseBotMaps = ref<Raw<CurseBotMapEntry[]>>([])
  const currentState = ref<CurseBotState>(CurseBotState.STOPPED)
  const playerCurseBotWorldData = ref<Raw<PlayerCurseBotWorldData>>(new Map())
  const everySecondUpdateIsRunning = ref<boolean>(false)
  const lastActivePlayerCount = ref<number>(0)

  return {
    curseBotMaps,
    currentState,
    playerCurseBotWorldData,
    everySecondUpdateIsRunning,
    lastActivePlayerCount,
  }
})
