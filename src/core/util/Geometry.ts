import { vec2 } from '@basementuniverse/vec'

export function isPosInsideArea(pos: vec2, areaTopLeft: vec2, areaSize: vec2): boolean {
  return (
    pos.x >= areaTopLeft.x &&
    pos.x < areaTopLeft.x + areaSize.x &&
    pos.y >= areaTopLeft.y &&
    pos.y < areaTopLeft.y + areaSize.y
  )
}
