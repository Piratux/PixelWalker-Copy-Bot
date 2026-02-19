import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'

export interface BArenaBotPlayerWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
}

export function createBArenaBotWorldData(playerId: number): BArenaBotPlayerWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
  }
}
