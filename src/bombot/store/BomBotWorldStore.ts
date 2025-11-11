import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { Block } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { BomBotMapEntry } from '@/bombot/type/BomBotMapEntry.ts'
import { BomBotState } from '@/bombot/enum/BomBotState.ts'
import { BomBotBlockType } from '@/bombot/enum/BomBotBlockType.ts'
import { PlayerBomBotWorldData } from '@/bombot/type/BomBotPlayerWorldData.ts'
import { BomBotPowerUpData } from '@/bombot/type/BomBotPowerUpData.ts'
import { BomBotSpecialBombData } from '@/bombot/type/BomBotSpecialBombData.ts'

export const useBomBotWorldStore = defineStore('BomBotWorldStore', () => {
  const defaultBombBlocks = ref<Raw<WorldBlock[]>>([])
  const specialBombData = ref<Raw<BomBotSpecialBombData[]>>([])
  const bombRemoveBlocks = ref<Raw<WorldBlock[]>>([])
  const specialBombRemoveBlocks = ref<Raw<WorldBlock[]>>([])
  const powerUpData = ref<Raw<BomBotPowerUpData[]>>([])
  const bombTimerBgBlockTimeSpent = ref<Raw<Block>>(new Block(0))
  const bombTimerBgBlockTimeLeft = ref<Raw<Block>>(new Block(0))
  const bombTypeFgBlockIndicator = ref<Raw<Block>>(new Block(0))
  const bomBotMaps = ref<Raw<BomBotMapEntry[]>>([])
  const blockTypes = ref<BomBotBlockType[]>([]) // index is block id
  const currentState = ref<BomBotState>(BomBotState.STOPPED)
  const playedOnce = ref<boolean>(false)
  const playerBomBotWorldData = ref<Raw<PlayerBomBotWorldData>>(new Map())
  const everySecondUpdateIsRunning = ref<boolean>(false)
  const randomEffectBlocks = ref<Raw<Block[]>>([])
  const totalRoundsPassed = ref<number>(0)

  return {
    defaultBombBlocks,
    specialBombData,
    bombRemoveBlocks,
    specialBombRemoveBlocks,
    powerUpData,
    bombTimerBgBlockTimeSpent,
    bombTimerBgBlockTimeLeft,
    bombTypeFgBlockIndicator,
    bomBotMaps,
    blockTypes,
    currentState,
    playedOnce,
    playerBomBotWorldData,
    everySecondUpdateIsRunning,
    randomEffectBlocks,
    totalRoundsPassed,
  }
})
