import { useUiStore } from '@/core/store/UiStore.ts'
import { AlertType, createAlert } from '@/core/type/AlertData.ts'

export const AlertService = {
  info: (message: string) => {
    useUiStore().alerts.push(createAlert(message, AlertType.INFO))
  },
  warning: (message: string) => {
    useUiStore().alerts.push(createAlert(message, AlertType.WARNING))
  },
  error: (message: string) => {
    useUiStore().alerts.push(createAlert(message, AlertType.ERROR))
  },
  success: (message: string) => {
    useUiStore().alerts.push(createAlert(message, AlertType.SUCCESS))
  },
  clear: () => {
    useUiStore().alerts = []
  },
}
