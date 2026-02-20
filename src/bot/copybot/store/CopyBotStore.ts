import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'

interface CopyBotStore {
  playerCopyBotData: Map<number, CopyBotData>
}

const store = createCopyBotStore()

function createCopyBotStore(): CopyBotStore {
  return {
    // TODO: periodically remove entries for players who left world (though it takes little data)
    playerCopyBotData: new Map(),
  }
}

export function resetCopyBotStore() {
  Object.assign(store, createCopyBotStore())
}

export function useCopyBotStore(): CopyBotStore {
  return store
}
