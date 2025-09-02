export interface BomBotStatData {
  wins: number
  plays: number
}

export type PlayerBomBotStatData = Record<number, BomBotStatData>

export function createBomBotStatData(): BomBotStatData {
  return {
    wins: 0,
    plays: 0,
  }
}
