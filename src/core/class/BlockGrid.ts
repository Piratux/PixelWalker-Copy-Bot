import { vec2 } from '@basementuniverse/vec'
import { Block, LayerType } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'

export class BlockGrid {
  gridOffset: vec2
  gridSize: vec2
  grid: Block[] = []
  layer: LayerType

  // If playerId is provided, error is intended to be sent as private chat message to that player
  constructor(gridSize: vec2, layer: LayerType, gridOffset?: vec2) {
    this.gridSize = gridSize
    this.layer = layer
    this.gridOffset = gridOffset ?? vec2(0, 0)
  }

  initialiseGrid(): void {
    for (let i = 0; i < this.gridSize.x * this.gridSize.y; i++) {
      this.grid.push(new Block(0))
    }
  }

  getBlock(pos: vec2): Block | null {
    const gridPos = vec2.sub(pos, this.gridOffset)
    if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.gridSize.x || gridPos.y >= this.gridSize.y) {
      return null
    }
    const index = gridPos.y * this.gridSize.x + gridPos.x
    return this.grid[index] ?? null
  }

  setBlock(pos: vec2, block: Block): void {
    const gridPos = vec2.sub(pos, this.gridOffset)
    if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.gridSize.x || gridPos.y >= this.gridSize.y) {
      return
    }
    const index = gridPos.y * this.gridSize.x + gridPos.x
    this.grid[index] = block
  }

  setAllBlock(block: Block): void {
    for (let i = 0; i < this.gridSize.x * this.gridSize.y; i++) {
      this.grid[i] = block
    }
  }

  toWorldBlocks(): WorldBlock[] {
    const worldBlocks: WorldBlock[] = []
    for (let y = 0; y < this.gridSize.y; y++) {
      for (let x = 0; x < this.gridSize.x; x++) {
        const index = y * this.gridSize.x + x
        const block = this.grid[index]
        worldBlocks.push({
          pos: vec2.add(vec2(x, y), this.gridOffset),
          block,
          layer: this.layer,
        })
      }
    }
    return worldBlocks
  }
}
