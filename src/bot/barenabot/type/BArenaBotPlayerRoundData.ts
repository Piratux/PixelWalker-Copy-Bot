import { vec2 } from '@basementuniverse/vec'
import { BArenaTeam } from '@/bot/barenabot/enum/BArenaTeam.ts'

export interface BArenaPlayerBotRoundData {
  blockTypeId: number
  pos: vec2
  moveDirection: vec2
  team: BArenaTeam
  moveCooldownInTicks: number
  gunCooldownInTicks: number
  lastMoveDirection: vec2 // used to know which direction to shoot projectile
  holdingShootKey: boolean
  playerIsAfk: boolean
}
