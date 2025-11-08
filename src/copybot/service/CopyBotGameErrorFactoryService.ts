import { GameError } from '@/core/class/GameError.ts'

export function createUnrecognisedMaskModeError(arg: string, playerId: number): GameError {
  return new GameError(
    `Unrecognised mask mode '${arg}'. Valid modes: default, background, foreground, overlay, nonair`,
    playerId,
  )
}

export function createPortalIdTooLongErrorString(portalId: string): string {
  return `Computed portal ID is longer than 5 characters, which cannot be placed: '${portalId}'`
}
