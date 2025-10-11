export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface AlertData {
  text: string
  type: AlertType
  closable: boolean
}

export function createAlert(text: string, type: AlertType, closable = true): AlertData {
  return {
    text,
    type,
    closable,
  }
}
