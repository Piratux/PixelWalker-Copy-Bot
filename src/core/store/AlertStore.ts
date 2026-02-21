import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AlertData, AlertType } from '@/core/type/AlertData.ts'

export const useAlertStore = defineStore('AlertStore', () => {
  const alerts = ref<AlertData[]>([])

  function info(message: string) {
    alerts.value.push(createAlert(message, AlertType.INFO))
  }
  function warning(message: string) {
    alerts.value.push(createAlert(message, AlertType.WARNING))
  }
  function error(message: string) {
    alerts.value.push(createAlert(message, AlertType.ERROR))
  }
  function success(message: string) {
    alerts.value.push(createAlert(message, AlertType.SUCCESS))
  }
  function clear() {
    alerts.value = []
  }

  return {
    alerts,
    info,
    warning,
    error,
    success,
    clear,
  }
})

export function createAlert(text: string, type: AlertType): AlertData {
  return {
    text,
    type,
  }
}
