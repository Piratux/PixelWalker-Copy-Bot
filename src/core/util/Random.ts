// [min, max)
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export function getRandomArrayElement<T>(array: T[]): T {
  const randomIndex = getRandomInt(0, array.length)
  return array[randomIndex]
}
