import { WorldZone } from '@/core/type/WorldZone.ts'

interface ZoneStore {
  zonePasteQueue: Map<string, WorldZone>
  globalZoneCounter: number
}

const store = createZoneStore()

function createZoneStore(): ZoneStore {
  return {
    zonePasteQueue: new Map(),
    globalZoneCounter: 0,
  }
}

export function resetZoneStore() {
  Object.assign(store, createZoneStore())
}

export function useZoneStore(): ZoneStore {
  return store
}
