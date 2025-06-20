import { BotData } from '@/type/BotData.ts'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { convertDeserializedStructureToWorldBlocks, getBlockAt, placeMultipleBlocks } from '@/service/WorldService.ts'
import { sendPrivateChatMessage } from '@/service/ChatMessageService.ts'
import { DeserialisedStructure } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'

const MAX_UNDO_REDO_STACK_LENGTH = 100

export function addUndoItemWorldBlock(botData: BotData, newBlocks: WorldBlock[]) {
  botData.redoStack = []
  if (botData.undoStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoStack.shift()
  }
  const undoRedoItem = {
    newBlocks: newBlocks,
    oldBlocks: getOldBlocks(newBlocks),
  }
  botData.undoStack.push(undoRedoItem)
}

export function addUndoItemDeserializedStructure(botData: BotData, blocks: DeserialisedStructure, offsetPos: vec2 = vec2(0,0)) {
  const worldBlocks = convertDeserializedStructureToWorldBlocks(blocks, offsetPos)
  addUndoItemWorldBlock(botData, worldBlocks)
}

// TODO: this could be improved by smartly merging blocks as opposed to doing undo one by one
export function performUndo(botData: BotData, playerId: number, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.redoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.oldBlocks)
  }
  sendPrivateChatMessage(`Undo performed ${i} time(s).`, playerId)
}

// TODO: this could be improved by smartly merging blocks as opposed to doing redo one by one
export function performRedo(botData: BotData, playerId: number, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.undoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.newBlocks)
  }
  sendPrivateChatMessage(`Redo performed ${i} time(s).`, playerId)
}

function getOldBlocks(newBlocks: WorldBlock[]): WorldBlock[] {
  return newBlocks.map((newBlock) => ({
    block: getBlockAt(newBlock.pos, newBlock.layer),
    layer: newBlock.layer,
    pos: newBlock.pos,
  }))
}
