import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { BomBotPowerUp } from '@/bombot/enum/BomBotPowerUp.ts'
import { Point } from 'pw-js-world'

export interface BomBotPowerUpData {
  equipPos: Point
  type: BomBotPowerUp
  blocks: WorldBlock[]
}
