import { POWER_UP_COUNT, SPECIAL_BOMB_COUNT } from '@/bombot/constant/General.ts'

export interface BomBotRoundData {
  powerUpsLeft: number
  specialBombsLeft: number
}

export type PlayerBomBotRoundData = Record<number, BomBotRoundData>

export function createBomBotRoundData(): BomBotRoundData {
  return {
    powerUpsLeft: POWER_UP_COUNT,
    specialBombsLeft: SPECIAL_BOMB_COUNT,
  }
}
