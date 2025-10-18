import { AlertService } from '@/core/service/AlertService.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'
import { GENERAL_CONSTANTS } from '@/core/constant/General.ts'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { GameError } from '@/core/class/GameError.ts'

interface PwJsApiErrorObject {
  type: string
  error: unknown
}

function getGameError(exception: unknown): GameError | null {
  if (exception instanceof GameError) {
    return exception
  } else if ((exception as PwJsApiErrorObject).error instanceof GameError) {
    // Consider using Typia to simplify type checking when it's not broken anymore:
    // https://github.com/samchon/typia/issues/1604#issuecomment-3360602946
    // Although might need to wait for TS Go port to be finished, since Typia uses TS interal APIs.
    return (exception as PwJsApiErrorObject).error as GameError
  }
  return null
}

function printGameErrorMessageInChat(gameError: GameError) {
  if (!usePwClientStore().isConnected) {
    return
  }

  const chatExceptionMessage = `ERROR! ${gameError.message}`
  if (gameError.playerId !== null) {
    sendPrivateChatMessage(chatExceptionMessage, gameError.playerId)
  } else {
    sendGlobalChatMessage(chatExceptionMessage)
  }
}

export function handleException(exception: unknown): void {
  const gameError = getGameError(exception)
  if (gameError) {
    printGameErrorMessageInChat(gameError)
  } else if (exception instanceof Error) {
    console.error(exception)
    AlertService.error(exception.message)
  } else {
    console.error(exception)
    AlertService.error(GENERAL_CONSTANTS.GENERIC_ERROR)
  }
}
