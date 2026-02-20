import { CopyBotState } from '@/bot/copybot/enum/CopyBotState.ts'
import { Point } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import { CopyBotUndoRedoItem } from '@/bot/copybot/type/CopyBotUndoRedoItem.ts'

export interface CopyBotData {
  botState: CopyBotState
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
  skipAirEnabled: boolean
  replacedByLastMoveOperationBlocks: WorldBlock[]
  undoStack: CopyBotUndoRedoItem[]
  redoStack: CopyBotUndoRedoItem[]
  snakeModeEnabled: boolean
  snakeModeTime: number
  snakeModeCurrentOffset: number
  snakeModeHideClock: boolean
}

export function createBotData(): CopyBotData {
  return {
    botState: CopyBotState.NONE,
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
    skipAirEnabled: false,
    replacedByLastMoveOperationBlocks: [],
    undoStack: [],
    redoStack: [],
    snakeModeEnabled: false,
    snakeModeTime: 0,
    snakeModeCurrentOffset: 0,
    snakeModeHideClock: false,
  }
}
