import { MessageService } from '@/core/service/MessageService.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'
import { GENERAL_CONSTANTS } from '@/core/constant/General.ts'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { GameError } from '@/core/class/GameError.ts'

function getTrueExceptionMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message
  } else {
    return GENERAL_CONSTANTS.GENERIC_ERROR
  }
}

interface PwJsApiErrorObject {
  type: string
  error: unknown
}

function handleInGameException(exception: unknown) {
  if (exception instanceof GameError) {
    printGameErrorExceptionMessage(exception)
  } else if ((exception as PwJsApiErrorObject).error instanceof GameError) {
    // Consider using Typia to simplify type checking when it's not broken anymore:
    // https://github.com/samchon/typia/issues/1604#issuecomment-3360602946
    // Although might need to wait for TS Go port to be finished, since Typia uses TS interal APIs.
    const gameError: GameError = (exception as PwJsApiErrorObject).error as GameError
    printGameErrorExceptionMessage(gameError)
  } else {
    sendGlobalChatMessage(GENERAL_CONSTANTS.GENERIC_ERROR)
  }
}

function printGameErrorExceptionMessage(gameError: GameError) {
  const chatExceptionMessage = `ERROR! ${gameError.message}`
  if (gameError.playerId !== null) {
    sendPrivateChatMessage(chatExceptionMessage, gameError.playerId)
  } else {
    sendGlobalChatMessage(chatExceptionMessage)
  }
}

export function handleException(exception: unknown): void {
  if (usePwClientStore().isConnected) {
    handleInGameException(exception)
  } else {
    console.error(exception)
    const trueExceptionMessage = getTrueExceptionMessage(exception)
    MessageService.error(trueExceptionMessage)
  }
}
