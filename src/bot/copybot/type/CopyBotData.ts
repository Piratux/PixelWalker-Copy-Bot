import { CopyBotState } from '@/bot/copybot/enum/CopyBotState.ts'
import { ILabel, Point, Zone } from 'pw-js-world'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import { CopyBotUndoRedoItem } from '@/bot/copybot/type/CopyBotUndoRedoItem.ts'
import { CopyBotUndoRedoZoneItem } from '@/bot/copybot/type/CopyBotUndoRedoZoneItem.ts'
import { CopyBotUndoRedoLabelItem } from '@/bot/copybot/type/CopyBotUndoRedoLabelItem.ts'

export interface CopyBotData {
  botState: CopyBotState
  selectedFromPos: Point
  selectedToPos: Point
  selectedBlocks: WorldBlock[]
  selectedZones: Zone[]
  selectedLabels: ILabel[]
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
  maskZoneEnabled: boolean
  maskLabelEnabled: boolean
  skipAirEnabled: boolean
  replacedByLastMoveOperationBlocks: WorldBlock[]
  lastMovedZones: Zone[] | null
  lastMovedLabels: ILabel[] | null
  undoStack: CopyBotUndoRedoItem[]
  redoStack: CopyBotUndoRedoItem[]
  undoZoneStack: CopyBotUndoRedoZoneItem[]
  redoZoneStack: CopyBotUndoRedoZoneItem[]
  undoLabelStack: CopyBotUndoRedoLabelItem[]
  redoLabelStack: CopyBotUndoRedoLabelItem[]
  snakeModeEnabled: boolean
  snakeModeTime: number
  snakeModeCurrentOffset: number
  snakeModeHideClock: boolean
  isEnabled: boolean
}

export function createBotData(): CopyBotData {
  return {
    botState: CopyBotState.NONE,
    selectedFromPos: vec2(0, 0),
    selectedToPos: vec2(0, 0),
    selectedBlocks: [],
    selectedZones: [],
    selectedLabels: [],
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
    maskZoneEnabled: true,
    maskLabelEnabled: true,
    skipAirEnabled: false,
    replacedByLastMoveOperationBlocks: [],
    lastMovedZones: null,
    lastMovedLabels: null,
    undoStack: [],
    redoStack: [],
    undoZoneStack: [],
    redoZoneStack: [],
    undoLabelStack: [],
    redoLabelStack: [],
    snakeModeEnabled: false,
    snakeModeTime: 0,
    snakeModeCurrentOffset: 0,
    snakeModeHideClock: false,
    isEnabled: true,
  }
}
