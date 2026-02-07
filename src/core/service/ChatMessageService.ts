import { getPwGameClient } from '@/core/store/PwClientStore.ts'

/**
 * Shows a toast message which appears at the top temporarily.
 * @param message - The message to display.
 * @param playerIdOrSelector - Player id (number) or selector (e.g. @a[team=red]).
 * @param [durationSeconds] - How long the toast should be shown. Default is 3 seconds. Min is 0.5 seconds. Max is 60 seconds.
 * @param [icon] - Icon to display. Only free icons are displayed from https://fontawesome.com/search?ic=free-collection
 */
export function sendToastMessage(
  message: string,
  playerIdOrSelector: number | string,
  icon?: string,
  durationSeconds = 3,
) {
  if (typeof playerIdOrSelector === 'number') {
    playerIdOrSelector = `#${playerIdOrSelector}`
  }

  // Escape with double quotes
  message = message.replace(/"/g, '""')

  console.log(`/toast ${playerIdOrSelector} "${message}" ${durationSeconds} ${icon ?? ''}`)
  sendRawMessage(`/toast ${playerIdOrSelector} "${message}" ${durationSeconds * 1000} ${icon ?? ''}`)
}

export function sendPrivateChatMessage(message: string, playerId: number) {
  sendRawMessage(`/pm #${playerId} [BOT] ${message}`)
}

export function sendGlobalChatMessage(message: string) {
  sendRawMessage(`[BOT] ${message}`)
}

export function sendRawMessage(message: string) {
  // TODO: Check how message length is calculated with UTF symbols now being allowed
  let finalMessage = message
  if (finalMessage.length > 150) {
    console.error(`ERROR! Trying to send message '${message}'. Message too long. Max message length is 150 characters`)
    finalMessage = 'ERROR! Message too long!'
  }
  getPwGameClient().send('playerChatPacket', {
    message: finalMessage,
  })
}
