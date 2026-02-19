import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface ShiftBotPlayerWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
}

export function createShiftBotWorldData(playerId: number): ShiftBotPlayerWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
  }
}
