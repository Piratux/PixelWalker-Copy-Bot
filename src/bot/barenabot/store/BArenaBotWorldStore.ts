import { defineStore } from 'pinia'
import { Raw, ref } from 'vue'
import { BArenaBotState } from '@/bot/barenabot/enum/BArenaBotState.ts'
import { PlayerBArenaBotWorldData } from '@/bot/barenabot/type/BArenaBotPlayerWorldData.ts'
import { Block } from 'pw-js-world'

export const useBArenaBotWorldStore = defineStore('BArenaBotWorldStore', () => {
  const currentState = ref<BArenaBotState>(BArenaBotState.STOPPED)
  const playerBArenaBotWorldData = ref<Raw<PlayerBArenaBotWorldData>>(new Map())
  const everyTickUpdateIsRunning = ref<boolean>(false)
  const ticksPassed = ref<number>(0)
  const lastActivePlayerCount = ref<number>(0)
  const teamBluePlayerFgBlocks = ref<Raw<Block[]>>([])
  const teamRedPlayerFgBlocks = ref<Raw<Block[]>>([])
  const teamBlueProjectileFgBlock = ref<Raw<Block>>(new Block(0))
  const teamRedProjectileFgBlock = ref<Raw<Block>>(new Block(0))
  const mapEmptyFgBlock = ref<Raw<Block>>(new Block(0))

  return {
    currentState,
    playerBArenaBotWorldData,
    everyTickUpdateIsRunning,
    ticksPassed,
    lastActivePlayerCount,
    teamBluePlayerFgBlocks,
    teamRedPlayerFgBlocks,
    teamBlueProjectileFgBlock,
    teamRedProjectileFgBlock,
    mapEmptyFgBlock,
  }
})
