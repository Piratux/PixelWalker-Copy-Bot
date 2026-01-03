// returns dividend % divisor in range [0, divisor)
export function modulo(dividend: number, divisor: number): number {
  return ((dividend % divisor) + divisor) % divisor
}
