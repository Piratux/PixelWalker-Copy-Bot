import { defineStore } from 'pinia'
import { PlayerCopyBotData } from '@/type/BotData.ts'
import { ref } from 'vue'

export const useCopyBotStore = defineStore('CopyBotStore', () => {
  // TODO: periodically remove entries for players who left world (though it takes little data)
  const playerCopyBotData = ref<PlayerCopyBotData>({})

  return {
    playerCopyBotData,
  }
})

export function getPlayerCopyBotData(): PlayerCopyBotData {
  return useCopyBotStore().playerCopyBotData
}
