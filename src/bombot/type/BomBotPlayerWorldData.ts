import { BomBotPowerup } from '@/bombot/enum/BomBotPowerup.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface BomBotWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
  informedHowToPlaceBombOnce: boolean
  lastTimeUpPressedMs: number
  powerupSelected: BomBotPowerup | null
  powerupEquippedOnce: boolean
}

export type PlayerBomBotWorldData = Record<number, BomBotWorldData>

export function createBomBotWorldData(playerId: number): BomBotWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
    informedHowToPlaceBombOnce: false,
    lastTimeUpPressedMs: 0,
    powerupSelected: null,
    powerupEquippedOnce: false,
  }
}
