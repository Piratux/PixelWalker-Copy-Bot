import { Block, LayerType, Point } from 'pw-js-world'

export interface WorldBlock {
  pos: Point
  layer: LayerType
  block: Block
}
