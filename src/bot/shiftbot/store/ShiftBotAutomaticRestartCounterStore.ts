import { defineStore } from 'pinia'
import { ref } from 'vue'

export const userShiftBotAutomaticRestartCounterStore = defineStore('ShiftBotAutomaticRestartCounterStore', () => {
  const totalAutomaticRestarts = ref<number>(0)

  return {
    totalAutomaticRestarts,
  }
})
