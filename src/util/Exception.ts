import { MessageService } from '@/service/MessageService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { GENERAL_CONSTANTS } from '@/constant/General.ts'
import { usePwClientStore } from '@/store/PwClientStore.ts'

export function getExceptionDescription(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message
  } else {
    return 'Unknown error occured.'
  }
}

export function handleException(exception: unknown): void {
  console.error(exception)
  const exceptionDescription = getExceptionDescription(exception)
  MessageService.error(exceptionDescription)

  if (usePwClientStore().isConnected) {
    sendGlobalChatMessage(GENERAL_CONSTANTS.GENERIC_ERROR)
  }
}
