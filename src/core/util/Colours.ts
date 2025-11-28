import { Colour } from '@/core/type/Colour.ts'
import { clamp } from '@/core/util/Numbers.ts'

export function uint32ToColour(colour: number): Colour {
  return {
    r: (colour >> 16) & 0xff,
    g: (colour >> 8) & 0xff,
    b: colour & 0xff,
  }
}

export function colourToUint32(colour: Colour): number {
  if (
    clamp(colour.r, 0, 255) !== colour.r ||
    clamp(colour.g, 0, 255) !== colour.g ||
    clamp(colour.b, 0, 255) !== colour.b
  ) {
    throw new Error(`Colour values must be between 0 and 255. Received r:${colour.r}, g:${colour.g}, b:${colour.b}`)
  }
  return colour.b + (colour.g << 8) + (colour.r << 16)
}
