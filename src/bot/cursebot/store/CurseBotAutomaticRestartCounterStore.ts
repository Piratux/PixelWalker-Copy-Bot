import { defineStore } from 'pinia'
import { ref } from 'vue'

export const userCurseBotAutomaticRestartCounterStore = defineStore('CurseBotAutomaticRestartCounterStore', () => {
  const totalAutomaticRestarts = ref<number>(0)

  return {
    totalAutomaticRestarts,
  }
})
