import { vec2 } from '@basementuniverse/vec'
import { BArenaTeam } from '@/bot/barenabot/enum/BArenaTeam.ts'

export interface BArenaBotProjectileRoundData {
  pos: vec2
  moveDirection: vec2
  team: BArenaTeam // which team player shot the projectile
  moveCooldownInTicks: number
  playerId: number // which player shot the projectile
}
