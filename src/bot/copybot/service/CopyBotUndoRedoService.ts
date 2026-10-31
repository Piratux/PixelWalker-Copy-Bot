import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { ILabel, Zone } from 'pw-js-world'
import {
  deleteWorldLabels,
  deleteZones,
  getBlockAt,
  placeLabels,
  placeMultipleBlocks,
  placeZones,
} from '@/core/service/WorldService.ts'
import { sendPrivateChatMessage } from '@/core/service/ChatMessageService.ts'
import { CopyBotUndoRedoLabelItem } from '@/bot/copybot/type/CopyBotUndoRedoLabelItem.ts'
import { labelsHaveSameContent } from '@/core/util/Labels.ts'
import { handleException } from '@/core/util/Exception.ts'

const MAX_UNDO_REDO_STACK_LENGTH = 100

export function addUndoItem(
  botData: CopyBotData,
  newBlocks: WorldBlock[],
  newZones: Zone[],
  oldZones: Zone[],
  newLabels: ILabel[] = [],
  oldLabels: ILabel[] = [],
) {
  addUndoItemBlock(botData, newBlocks)
  addUndoItemZone(botData, newZones, oldZones)
  addUndoItemLabel(botData, newLabels, oldLabels)
}

function addUndoItemBlock(botData: CopyBotData, newBlocks: WorldBlock[]) {
  botData.redoStack = []
  if (botData.undoStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoStack.shift()
  }
  botData.undoStack.push({
    newBlocks,
    oldBlocks: getOldBlocks(newBlocks),
  })
}

function addUndoItemZone(botData: CopyBotData, newZones: Zone[], oldZones: Zone[]) {
  botData.redoZoneStack = []
  if (botData.undoZoneStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoZoneStack.shift()
  }
  botData.undoZoneStack.push({
    newZones,
    oldZones,
  })
}

function addUndoItemLabel(botData: CopyBotData, newLabels: ILabel[], oldLabels: ILabel[]) {
  botData.redoLabelStack = []
  if (botData.undoLabelStack.length >= MAX_UNDO_REDO_STACK_LENGTH) {
    botData.undoLabelStack.shift()
  }
  botData.undoLabelStack.push({
    newLabels,
    oldLabels,
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

export function performUndoLabels(botData: CopyBotData, count: number) {
  const items = [...botData.undoLabelStack].reverse().filter((_, i) => i < count)
  const { newLabels, oldLabels } = getUndoRedoLabels(
    items.map((item) => ({ newLabels: item.oldLabels, oldLabels: item.newLabels })),
  )
  applyUndoRedoLabels(newLabels, oldLabels)
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.undoLabelStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    if (botData.lastMovedLabels === undoRedoItem.newLabels) {
      botData.lastMovedLabels = undoRedoItem.oldLabels
    }
    botData.redoLabelStack.push(undoRedoItem)
  }
  return i
}

export function performRedoLabels(botData: CopyBotData, count: number) {
  const items = [...botData.redoLabelStack].reverse().filter((_, i) => i < count)
  const { newLabels, oldLabels } = getUndoRedoLabels(items)
  applyUndoRedoLabels(newLabels, oldLabels)
  let i = 0
  for (; i < count; i++) {
    const undoRedoItem = botData.redoLabelStack.pop()
    if (undoRedoItem === undefined) {
      break
    }
    if (botData.lastMovedLabels === undoRedoItem.oldLabels) {
      botData.lastMovedLabels = undoRedoItem.newLabels
    }
    botData.undoLabelStack.push(undoRedoItem)
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

function getUndoRedoLabels(items: CopyBotUndoRedoLabelItem[]): CopyBotUndoRedoLabelItem {
  const restoredLabels: ILabel[] = []
  const removedLabels: ILabel[] = []
  // Cancel intermediate label placements so multi-action undo/redo needs no server round trips.
  for (const item of items) {
    for (const label of item.oldLabels) {
      const restoredIndex = restoredLabels.findIndex((restoredLabel) => labelsHaveSameContent(restoredLabel, label))
      if (restoredIndex === -1) {
        removedLabels.push(label)
      } else {
        restoredLabels.splice(restoredIndex, 1)
      }
    }
    restoredLabels.push(...item.newLabels)
  }
  return { newLabels: restoredLabels, oldLabels: removedLabels }
}

function applyUndoRedoLabels(oldLabels: ILabel[], newLabels: ILabel[]) {
  if (oldLabels.length === 0 && newLabels.length === 0) {
    return
  }
  deleteWorldLabels(newLabels)

  // Keep shared move-history references pointing at the restored label snapshots.
  void placeLabels(oldLabels).catch(handleException)
}

function applyUndoRedoZones(oldZones: Zone[], newZones: Zone[]) {
  deleteZones(newZones)

  const restoredZones = placeZones(oldZones)
  // Move history entries share zone references, so keep their generated names current after restoration.
  for (let i = 0; i < oldZones.length; i++) {
    Object.assign(oldZones[i], restoredZones[i])
  }
}

export function performUndo(botData: CopyBotData, playerId: number, count: number) {
  performUndoLabels(botData, count)
  const blockUndoCount = performUndoBlocks(botData, count)
  performUndoZones(botData, count)
  sendPrivateChatMessage(`Undo performed ${blockUndoCount} time(s).`, playerId)
}

export function performRedo(botData: CopyBotData, playerId: number, count: number) {
  performRedoLabels(botData, count)
  const blockRedoCount = performRedoBlocks(botData, count)
  performRedoZones(botData, count)
  sendPrivateChatMessage(`Redo performed ${blockRedoCount} time(s).`, playerId)
}
