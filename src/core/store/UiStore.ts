import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AlertData } from '@/core/type/AlertData.ts'

export const useUiStore = defineStore('UiStore', () => {
  const alerts = ref<AlertData[]>([])

  return {
    alerts,
  }
})
