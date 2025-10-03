import { WorldBlock } from '@/core/type/WorldBlock.ts'

export interface UndoRedoItem {
  oldBlocks: WorldBlock[]
  newBlocks: WorldBlock[]
}
