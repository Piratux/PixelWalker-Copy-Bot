import { defineStore } from 'pinia'
import { PlayerCopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { Raw, ref } from 'vue'

export const useCopyBotStore = defineStore('CopyBotStore', () => {
  // TODO: periodically remove entries for players who left world (though it takes little data)
  const playerCopyBotData = ref<Raw<PlayerCopyBotData>>(new Map())

  return {
    playerCopyBotData,
  }
})

export function getPlayerCopyBotData(): PlayerCopyBotData {
  return useCopyBotStore().playerCopyBotData
}
