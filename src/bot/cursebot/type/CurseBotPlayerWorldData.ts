import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface CurseBotWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
}

export type PlayerCurseBotWorldData = Map<number, CurseBotWorldData>

export function createCurseBotWorldData(playerId: number): CurseBotWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
  }
}
