import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { Block } from 'pw-js-world'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { BomBotMapEntry } from '@/type/BomBotMapEntry.ts'
import { BomBotState } from '@/enum/BomBotState.ts'
import { BomBotBlockType } from '@/enum/BomBotBlockType.ts'
import { PlayerBomBotStatData } from '@/type/BomBotPlayerStatData.ts'

export const useBomBotWorldStore = defineStore('BomBotWorldStore', () => {
  const bombBlocks = ref<Raw<WorldBlock[]>>([])
  const bombTimerBgBlockTimeSpent = ref<Raw<Block>>(new Block(0))
  const bombTimerBgBlockTimeLeft = ref<Raw<Block>>(new Block(0))
  const bomBotMaps = ref<Raw<BomBotMapEntry[]>>([])
  const blockTypes = ref<BomBotBlockType[]>([]) // index is block id
  const currentState = ref<BomBotState>(BomBotState.STOPPED)
  const playedOnce = ref<boolean>(false)
  const playerBombotStatData = ref<PlayerBomBotStatData>({})
  const everySecondUpdateIsRunning = ref<boolean>(false)

  return {
    bombBlocks,
    bombTimerBgBlockTimeSpent,
    bombTimerBgBlockTimeLeft,
    bomBotMaps,
    blockTypes,
    currentState,
    playedOnce,
    playerBombotStatData,
    everySecondUpdateIsRunning,
  }
})
