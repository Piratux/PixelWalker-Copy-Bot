import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { BomBotPowerup } from '@/bombot/enum/BomBotPowerup.ts'
import { Point } from 'pw-js-world'

export interface BomBotPowerupData {
  equipPos: Point
  type: BomBotPowerup
  blocks: WorldBlock[]
}
