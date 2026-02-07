import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface ShiftBotWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
}

export type PlayerShiftBotWorldData = Map<number, ShiftBotWorldData>

export function createShiftBotWorldData(playerId: number): ShiftBotWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
  }
}
