import { BomBotPowerup } from '@/enum/BomBotPowerup.ts'

export interface BomBotWorldData {
  wins: number
  plays: number
  informedHowToPlaceBombOnce: boolean
  lastTimeUpPressedMs: number
  powerupSelected: BomBotPowerup | null
  powerupEquippedOnce: boolean
}

export type PlayerBomBotWorldData = Record<number, BomBotWorldData>

export function createBomBotWorldData(): BomBotWorldData {
  return {
    wins: 0,
    plays: 0,
    informedHowToPlaceBombOnce: false,
    lastTimeUpPressedMs: 0,
    powerupSelected: null,
    powerupEquippedOnce: false,
  }
}
