import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { ShiftBotMapEntry } from '@/shiftbot/type/ShiftBotMapEntry.ts'
import { ShiftBotState } from '@/shiftbot/enum/ShiftBotState.ts'
import { PlayerShiftBotWorldData } from '@/shiftbot/type/ShiftBotPlayerWorldData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block } from 'pw-js-world'

export const useShiftBotWorldStore = defineStore('ShiftBotWorldStore', () => {
  const shiftBotMaps = ref<Raw<ShiftBotMapEntry[][]>>([[], [], []]) // 3 difficulties: easy, medium, hard
  const currentState = ref<ShiftBotState>(ShiftBotState.STOPPED)
  const playerShiftBotWorldData = ref<Raw<PlayerShiftBotWorldData>>(new Map())
  const everySecondUpdateIsRunning = ref<boolean>(false)
  const lastActivePlayerCount = ref<number>(0)
  const mapRoundClearBlocks = ref<Raw<WorldBlock[]>>([])
  const mapFirstRoundPrepareBlocks = ref<Raw<WorldBlock[]>>([])
  const mapSurroundingBlocks = ref<Raw<WorldBlock[]>>([])
  const mapRoundStartBlocks = ref<Raw<WorldBlock[]>>([])
  const map5SecondsAfterRoundStartBlocks = ref<Raw<WorldBlock[]>>([])
  const mapEntranceBlock = ref<Raw<Block>>(new Block(0))
  const mapExitBlock = ref<Raw<Block>>(new Block(0))
  const arrowUpBlock = ref<Raw<Block>>(new Block(0))
  const arrowLeftBlock = ref<Raw<Block>>(new Block(0))
  const arrowRightBlock = ref<Raw<Block>>(new Block(0))
  const mapEntranceCloseBlock = ref<Raw<Block>>(new Block(0))
  const mapExitCloseBlock = ref<Raw<Block>>(new Block(0))
  const coinBlock = ref<Raw<Block>>(new Block(0))

  return {
    shiftBotMaps,
    currentState,
    playerShiftBotWorldData,
    everySecondUpdateIsRunning,
    lastActivePlayerCount,
    mapRoundClearBlocks,
    mapFirstRoundPrepareBlocks,
    mapSurroundingBlocks,
    mapRoundStartBlocks,
    map5SecondsAfterRoundStartBlocks,
    mapEntranceBlock,
    mapExitBlock,
    arrowUpBlock,
    arrowLeftBlock,
    arrowRightBlock,
    mapEntranceCloseBlock,
    mapExitCloseBlock,
    coinBlock,
  }
})
