import { BomBotPowerUp } from '@/bot/bombot/enum/BomBotPowerUp.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { BomBotSpecialBomb } from '@/bot/bombot/enum/BomBotSpecialBomb.ts'
import { BomBotBombType } from '@/bot/bombot/enum/BomBotBombType.ts'

export interface BomBotPlayerWorldData {
  username: string // Because when player leaves, we can't obtain username from id anymore in PWGameWorldHelper.getPlayer()
  wins: number
  plays: number
  informedHowToPlaceBombOnce: boolean
  lastTimeUpPressedMs: number
  powerUpSelected: BomBotPowerUp | null
  specialBombSelected: BomBotSpecialBomb | null
  bombTypeChosen: BomBotBombType
}

export function createBomBotWorldData(playerId: number): BomBotPlayerWorldData {
  return {
    username: getPwGameWorldHelper().getPlayer(playerId)?.username ?? 'UNKNOWN',
    wins: 0,
    plays: 0,
    informedHowToPlaceBombOnce: false,
    lastTimeUpPressedMs: 0,
    powerUpSelected: null,
    specialBombSelected: null,
    bombTypeChosen: BomBotBombType.NORMAL,
  }
}
