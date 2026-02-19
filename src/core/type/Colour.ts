export interface Colour {
  r: number
  g: number
  b: number
  a?: number
}

export const Colours = {
  RED: { r: 255, g: 0, b: 0, a: 255 },
  GREEN: { r: 0, g: 255, b: 0, a: 255 },
  BLUE: { r: 0, g: 0, b: 255, a: 255 },
  YELLOW: { r: 255, g: 255, b: 0, a: 255 },
  CYAN: { r: 0, g: 255, b: 255, a: 255 },
  MAGENTA: { r: 255, g: 0, b: 255, a: 255 },
  WHITE: { r: 255, g: 255, b: 255, a: 255 },
  BLACK: { r: 0, g: 0, b: 0, a: 255 },
}
