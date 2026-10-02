import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { WorldZone } from '@/core/type/WorldZone.ts'
import { deleteZones, getBlockAt, placeMultipleBlocks, placeZones } from '@/core/service/WorldService.ts'
import { sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'

const MAX_UNDO_REDO_STACK_LENGTH = 100

export function addUndoItemBlock(botData: CopyBotData, newBlocks: WorldBlock[]) {
  botData.redoStack = []
  if (botData.undoStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoStack.shift()
  }
  botData.undoStack.push({
    newBlocks,
    oldBlocks: getOldBlocks(newBlocks),
  })
}

export function addUndoItemZone(botData: CopyBotData, newZones: WorldZone[], oldZones: WorldZone[] = []) {
  botData.redoZoneStack = []
  if (botData.undoZoneStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoZoneStack.shift()
  }
  botData.undoZoneStack.push({
    newZones,
    oldZones,
  })
}

// TODO: this could be improved by smartly merging blocks as opposed to doing undo one by one
export function performUndoBlocks(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.redoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.oldBlocks)
  }
  return i
}

// TODO: this could be improved by smartly merging blocks as opposed to doing redo one by one
export function performRedoBlocks(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    botData.undoStack.push(undoRedoItem)
    void placeMultipleBlocks(undoRedoItem.newBlocks)
  }
  return i
}

export function performUndoZones(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoZoneStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    applyUndoRedoZones(undoRedoItem.oldZones, undoRedoItem.newZones)
    if (botData.lastMovedZones === undoRedoItem.newZones) {
      botData.lastMovedZones = undoRedoItem.oldZones
    }
    botData.redoZoneStack.push(undoRedoItem)
  }
  return i
}

export function performRedoZones(botData: CopyBotData, count: number) {
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoZoneStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    applyUndoRedoZones(undoRedoItem.newZones, undoRedoItem.oldZones)
    if (botData.lastMovedZones === undoRedoItem.oldZones) {
      botData.lastMovedZones = undoRedoItem.newZones
    }
    botData.undoZoneStack.push(undoRedoItem)
  }
  return i
}

function getOldBlocks(newBlocks: WorldBlock[]): WorldBlock[] {
  return newBlocks.map((newBlock) => ({
    block: getBlockAt(newBlock.pos, newBlock.layer),
    layer: newBlock.layer,
    pos: newBlock.pos,
  }))
}

function applyUndoRedoZones(oldZones: WorldZone[], newZones: WorldZone[]) {
  deleteZones(newZones)

  const restoredZones = placeZones(oldZones)
  // Move history entries share zone references, so keep their generated names current after restoration.
  for (let i = 0; i < oldZones.length; i++) {
    oldZones[i].zone = restoredZones[i].zone
  }
}

export function performUndo(botData: CopyBotData, playerId: number, count: number) {
  const blockUndoCount = performUndoBlocks(botData, count)
  const zoneUndoCount = performUndoZones(botData, count)
  sendPrivateChatMessage(`Undo performed ${blockUndoCount} block time(s) and ${zoneUndoCount} zone time(s).`, playerId)
}

export function performRedo(botData: CopyBotData, playerId: number, count: number) {
  const blockRedoCount = performRedoBlocks(botData, count)
  const zoneRedoCount = performRedoZones(botData, count)
  sendPrivateChatMessage(`Redo performed ${blockRedoCount} block time(s) and ${zoneRedoCount} zone time(s).`, playerId)
}
