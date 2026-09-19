import { WorldZone } from '@/core/type/WorldZone.ts'

export interface CopyBotUndoRedoZoneItem {
  oldZones: WorldZone[]
  newZones: WorldZone[]
}
