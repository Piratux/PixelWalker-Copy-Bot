import { vec2 } from '@basementuniverse/vec'

interface GridRectangle {
  x: number
  y: number
  width: number
  height: number
}

export function getGridRectangles(grid: boolean[][]): GridRectangle[] {
  const height = grid.length
  const width = grid[0]?.length ?? 0

  function scan(vertical: boolean): GridRectangle[] {
    const rectangles: GridRectangle[] = []
    let previousRuns = new Map<string, GridRectangle>()
    const lineCount = vertical ? width : height
    const lineLength = vertical ? height : width

    for (let line = 0; line < lineCount; line++) {
      const currentRuns = new Map<string, GridRectangle>()
      let offset = 0
      while (offset < lineLength) {
        if (!(vertical ? grid[offset][line] : grid[line][offset])) {
          offset++
          continue
        }

        const start = offset
        while (offset < lineLength && (vertical ? grid[offset][line] : grid[line][offset])) {
          offset++
        }
        const length = offset - start
        const key = `${start},${length}`
        let rectangle = previousRuns.get(key)
        if (rectangle === undefined) {
          rectangle = {
            x: vertical ? line : start,
            y: vertical ? start : line,
            width: vertical ? 1 : length,
            height: vertical ? length : 1,
          }
          rectangles.push(rectangle)
        } else if (vertical) {
          rectangle.width++
        } else {
          rectangle.height++
        }
        currentRuns.set(key, rectangle)
      }
      previousRuns = currentRuns
    }
    return rectangles
  }

  const horizontalRectangles = scan(false)
  if (horizontalRectangles.length <= 1) {
    return horizontalRectangles
  }
  const verticalRectangles = scan(true)
  return verticalRectangles.length < horizontalRectangles.length ? verticalRectangles : horizontalRectangles
}

export function isPosInsideArea(pos: vec2, areaTopLeft: vec2, areaSize: vec2): boolean {
  return (
    pos.x >= areaTopLeft.x &&
    pos.x < areaTopLeft.x + areaSize.x &&
    pos.y >= areaTopLeft.y &&
    pos.y < areaTopLeft.y + areaSize.y
  )
}
