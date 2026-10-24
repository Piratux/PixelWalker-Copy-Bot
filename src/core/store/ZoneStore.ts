import { Zone } from 'pw-js-world'

interface ZoneStore {
  zonePasteQueue: Map<string, Zone>
  pendingZoneAreaEdits: Map<string, Set<string>>
  globalZoneCounter: number
}

const store = createZoneStore()

function createZoneStore(): ZoneStore {
  return {
    zonePasteQueue: new Map(),
    pendingZoneAreaEdits: new Map(),
    globalZoneCounter: 0,
  }
}

export function resetZoneStore() {
  Object.assign(store, createZoneStore())
}

export function useZoneStore(): ZoneStore {
  return store
}
