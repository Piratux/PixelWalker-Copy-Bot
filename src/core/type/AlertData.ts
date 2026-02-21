export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface AlertData {
  text: string
  type: AlertType
}
