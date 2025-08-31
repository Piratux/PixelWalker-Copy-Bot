// Source: https://github.com/stdlib-js/number-uint32-base-to-int32/blob/main/lib/main.js
export function uint32ToInt32(x: number) {
  return x | 0
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}
