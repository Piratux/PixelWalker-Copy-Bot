import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { WorldZone } from '@/core/type/WorldZone.ts'

interface CopyBotStore {
  playerCopyBotData: Map<number, CopyBotData>
  zonePasteQueue: Map<string, WorldZone>
  globalZoneCounter: number
}

const store = createCopyBotStore()

function createCopyBotStore(): CopyBotStore {
  return {
    // TODO: periodically remove entries for players who left world (though it takes little data)
    playerCopyBotData: new Map(),
    zonePasteQueue: new Map(),
    globalZoneCounter: 0,
  }
}

export function resetCopyBotStore() {
  Object.assign(store, createCopyBotStore())
}

export function useCopyBotStore(): CopyBotStore {
  return store
}
