import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, Point } from 'pw-js-world'
import { BomBotSpecialBomb } from '@/bombot/enum/BomBotSpecialBomb.ts'

export interface BomBotSpecialBombData {
  equipPos: Point
  type: BomBotSpecialBomb
  blocks: WorldBlock[]
  bombRemoveBlocks: WorldBlock[]
  icon: Block
}
