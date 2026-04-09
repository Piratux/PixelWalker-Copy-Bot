import { Colour } from '@/core/type/Colour.ts'
import { clamp, shiftLeft } from '@/core/util/Numbers.ts'

export function uint32ToColour(colour: number): Colour {
  return {
    a: (colour >> 24) & 0xff,
    r: (colour >> 16) & 0xff,
    g: (colour >> 8) & 0xff,
    b: colour & 0xff,
  }
}

export function colourToUint32(colour: Colour): number {
  if (
    clamp(colour.r, 0, 255) !== colour.r ||
    clamp(colour.g, 0, 255) !== colour.g ||
    clamp(colour.b, 0, 255) !== colour.b ||
    (colour.a !== undefined && clamp(colour.a, 0, 255) !== colour.a)
  ) {
    throw new Error(
      `Colour values must be between 0 and 255. Received r:${colour.r}, g:${colour.g}, b:${colour.b}${colour.a !== undefined ? `, a:${colour.a}` : ''}`,
    )
  }
  const alpha = colour.a !== undefined ? shiftLeft(colour.a, 24) : 0
  return colour.b + (colour.g << 8) + (colour.r << 16) + alpha
}

export function hexStringToColour(colour: string): Colour {
  const a = 0

  // Parse "#RRGGBB" as "#RRGGBB"
  if (/^#([0-9A-Fa-f]{6})$/.test(colour)) {
    const r = parseInt(colour.slice(1, 3), 16)
    const g = parseInt(colour.slice(3, 5), 16)
    const b = parseInt(colour.slice(5, 7), 16)
    return { r, g, b, a }
  }

  // Parse "#RGGBB" as "#0RRGGBB"
  if (/^#([0-9A-Fa-f]{5})$/.test(colour)) {
    const r = parseInt(colour.slice(1, 2), 16)
    const g = parseInt(colour.slice(2, 4), 16)
    const b = parseInt(colour.slice(4, 6), 16)
    return { r, g, b, a }
  }

  // Parse "#GGBB" as "#00GGBB"
  if (/^#([0-9A-Fa-f]{4})$/.test(colour)) {
    const g = parseInt(colour.slice(1, 3), 16)
    const b = parseInt(colour.slice(3, 5), 16)
    return { r: 0, g, b, a }
  }

  // Parse "#GBB" as "#000GBB"
  if (/^#([0-9A-Fa-f]{3})$/.test(colour)) {
    const g = parseInt(colour.slice(1, 2), 16)
    const b = parseInt(colour.slice(2, 4), 16)
    return { r: 0, g, b, a }
  }

  // Parse "#BB" as "#0000BB"
  if (/^#([0-9A-Fa-f]{2})$/.test(colour)) {
    const b = parseInt(colour.slice(1, 3), 16)
    return { r: 0, g: 0, b, a }
  }

  // Parse "#B" as "#00000B"
  if (/^#([0-9A-Fa-f])$/.test(colour)) {
    const b = parseInt(colour.slice(1, 2), 16)
    return { r: 0, g: 0, b, a }
  }

  return { r: 255, g: 255, b: 255, a }
}
