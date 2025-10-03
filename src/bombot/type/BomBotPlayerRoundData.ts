export interface BomBotRoundData {
  powerupsLeft: number
}

export type PlayerBomBotRoundData = Record<number, BomBotRoundData>

export function createBomBotRoundData(): BomBotRoundData {
  return {
    powerupsLeft: 3,
  }
}
