import { Block, LayerType, Point } from 'pw-js-world'

export type WorldBlock = {
  pos: Point
  layer: LayerType
  block: Block
}
