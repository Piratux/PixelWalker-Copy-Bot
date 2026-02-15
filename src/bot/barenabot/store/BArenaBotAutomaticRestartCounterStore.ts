import { defineStore } from 'pinia'
import { ref } from 'vue'

export const userBArenaBotAutomaticRestartCounterStore = defineStore('BArenaBotAutomaticRestartCounterStore', () => {
  const totalAutomaticRestarts = ref<number>(0)

  return {
    totalAutomaticRestarts,
  }
})
