import { Block, Point } from 'pw-js-world'
import { LayerType } from 'pw-js-world'

export type WorldBlock = {
  pos: Point
  layer: LayerType
  block: Block
}
