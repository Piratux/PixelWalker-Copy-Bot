import { GameError } from '@/core/class/GameError.ts'
import { Colour } from '@/core/type/Colour.ts'

export function createUnrecognisedMaskModeError(arg: string, playerId: number): GameError {
  return new GameError(
    `Unrecognised mask mode '${arg}'. Valid modes: default, background, foreground, overlay`,
    playerId,
  )
}

export function createPortalIdTooLongErrorString(portalId: string): string {
  return `Computed portal ID is longer than 5 characters, which cannot be placed: '${portalId}'`
}

export function createColourOutOfBoundsErrorString(colour: Colour): string {
  return `Computed colour components are not all in [0, 255] range, which cannot be placed: r:${colour.r}, g:${colour.g}, b:${colour.b}`
}

export function createFailedToJoinWorldErrorString(worldId: string): string {
  return `Failed to join world with ID '${worldId}'.`
}

export function createImportCommandSourceAreaOutOfBoundsError(
  playerId: number,
  srcFromX: number,
  srcFromY: number,
  srcToX: number,
  srcToY: number,
  minSrcFromX: number,
  minSrcFromY: number,
  maxSrcToX: number,
  maxSrcToY: number,
): GameError {
  return new GameError(
    `Invalid specified source bounds. Entered bounds were '${srcFromX} ${srcFromY} ${srcToX} ${srcToY}', but maximum allowed bounds are '${minSrcFromX} ${minSrcFromY} ${maxSrcToX} ${maxSrcToY}'.`,
    playerId,
  )
}

export function createImportCommandDestinationAreaOutOfBoundsError(
  playerId: number,
  destToX: number,
  destToY: number,
  pasteSizeX: number,
  pasteSizeY: number,
): GameError {
  return new GameError(
    `Pasted area would be placed at pos (${destToX}, ${destToY}) with size (${pasteSizeX}, ${pasteSizeY}), but that's outside world bounds`,
    playerId,
  )
}
