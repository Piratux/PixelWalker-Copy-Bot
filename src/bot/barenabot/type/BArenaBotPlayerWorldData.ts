import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface BArenaBotWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
}

export type PlayerBArenaBotWorldData = Map<number, BArenaBotWorldData>

export function createBArenaBotWorldData(playerId: number): BArenaBotWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
  }
}
