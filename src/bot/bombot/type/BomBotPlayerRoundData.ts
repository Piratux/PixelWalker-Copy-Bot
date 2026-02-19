import { POWER_UP_COUNT, SPECIAL_BOMB_COUNT } from '@/bot/bombot/constant/General.ts'

export interface BomBotPlayerRoundData {
  powerUpsLeft: number
  specialBombsLeft: number
}

export function createBomBotRoundData(): BomBotPlayerRoundData {
  return {
    powerUpsLeft: POWER_UP_COUNT,
    specialBombsLeft: SPECIAL_BOMB_COUNT,
  }
}
