import { defineStore } from 'pinia'
import { ref } from 'vue'

export const userBomBotAutomaticRestartCounterStore = defineStore('BomBotAutomaticRestartCounterStore', () => {
  const totalAutomaticRestarts = ref<number>(0)

  return {
    totalAutomaticRestarts,
  }
})
