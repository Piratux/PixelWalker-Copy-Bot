import { WorldBlock } from '@/type/WorldBlock.ts'

export interface UndoRedoItem {
  oldBlocks: WorldBlock[]
  newBlocks: WorldBlock[]
}
