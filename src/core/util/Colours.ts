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
  if (
    ![
      /^#([0-9A-Fa-f]{6})$/.test(colour),
      /^#([0-9A-Fa-f]{5})$/.test(colour),
      /^#([0-9A-Fa-f]{4})$/.test(colour),
      /^#([0-9A-Fa-f]{3})$/.test(colour),
      /^#([0-9A-Fa-f]{2})$/.test(colour),
      /^#([0-9A-Fa-f])$/.test(colour),
    ].includes(true)
  ) {
    throw new Error(`Invalid colour format: ${colour}. Expected formats: #RRGGBB, #RGGBB, #GGBB, #GBB, #BB, #B.`)
  }

  const processedColourString: string = [colour]
    .map((colour) => colour.slice(1))
    .map((colour) => colour.padStart(6, '0'))[0]

  const r = parseInt(processedColourString.slice(0, 2), 16)
  const g = parseInt(processedColourString.slice(2, 4), 16)
  const b = parseInt(processedColourString.slice(4, 6), 16)
  const a = 0
  return { r, g, b, a }
}
