import { WorldBlock } from '@/core/type/WorldBlock.ts'

export interface CopyBotUndoRedoItem {
  oldBlocks: WorldBlock[]
  newBlocks: WorldBlock[]
}
