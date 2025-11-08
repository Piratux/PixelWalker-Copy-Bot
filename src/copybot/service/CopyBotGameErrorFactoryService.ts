import { GameError } from '@/core/class/GameError.ts'

export function createUnrecognisedMaskModeError(arg: string, playerId: number): GameError {
  return new GameError(
    `Unrecognised mask mode '${arg}'. Valid modes: default, background, foreground, overlay, nonair`,
    playerId,
  )
}
