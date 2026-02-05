// Source: https://github.com/stdlib-js/number-uint32-base-to-int32/blob/main/lib/main.js
export function uint32ToInt32(x: number) {
  return x | 0
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

// Shift operation for numbers in JS operates on signed 32-bit integers.
// This function uses BigInt to perform shift operation on unsigned integers correctly.
export function shiftLeft(value: number, shift: number): number {
  return Number(BigInt(value) << BigInt(shift))
}
