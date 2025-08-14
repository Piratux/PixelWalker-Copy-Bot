import { BotState } from '@/enum/BotState.ts'
import { Point } from 'pw-js-world'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import { UndoRedoItem } from '@/type/UndoRedoItem.ts'

export interface BotData {
  botState: BotState
  selectedFromPos: Point
  selectedToPos: Point
  selectedBlocks: WorldBlock[]
  selectionSize: Point
  selectionLocalTopLeftPos: Point
  selectionLocalBottomRightPos: Point
  repeatVec: Point
  spacingVec: Point
  smartRepeatEnabled: boolean
  moveEnabled: boolean
  moveOperationPerformedOnce: boolean
  maskForegroundEnabled: boolean
  maskBackgroundEnabled: boolean
  maskOverlayEnabled: boolean
  replacedByLastMoveOperationBlocks: WorldBlock[]
  undoStack: UndoRedoItem[]
  redoStack: UndoRedoItem[]
}

export type PlayerBotData = Record<number, BotData>

export function createBotData(): BotData {
  return {
    botState: BotState.NONE,
    selectedFromPos: vec2(0, 0),
    selectedToPos: vec2(0, 0),
    selectedBlocks: [],
    selectionSize: vec2(1, 1),
    selectionLocalTopLeftPos: vec2(0, 0),
    selectionLocalBottomRightPos: vec2(1, 1),
    repeatVec: vec2(1, 1),
    spacingVec: vec2(0, 0),
    smartRepeatEnabled: false,
    moveEnabled: false,
    moveOperationPerformedOnce: false,
    maskForegroundEnabled: true,
    maskBackgroundEnabled: true,
    maskOverlayEnabled: true,
    replacedByLastMoveOperationBlocks: [],
    undoStack: [],
    redoStack: [],
  }
}
