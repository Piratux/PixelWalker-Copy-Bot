import { PWaintMeBotState } from '@/bot/pwaintmebot/enum/PWaintMeBotState.ts'
import { PWaintMeMapEntry, PWaintMePaletteEntry, PWaintMePlayerStats } from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'

interface PWaintMeBotWorldStore {
  currentState: PWaintMeBotState
  everySecondUpdateIsRunning: boolean
  queuedPlayers: Set<number>
  afkPlayers: Set<number>
  playerStats: Map<string, PWaintMePlayerStats>
  maps: Map<string, PWaintMeMapEntry>
  palette: Map<number, PWaintMePaletteEntry>
  lastActivePlayerCount: number
}

const store: PWaintMeBotWorldStore = {
  currentState: PWaintMeBotState.STOPPED,
  everySecondUpdateIsRunning: false,
  queuedPlayers: new Set(),
  afkPlayers: new Set(),
  playerStats: new Map(),
  maps: new Map(),
  palette: new Map(),
  lastActivePlayerCount: -1,
}

export function usePWaintMeBotWorldStore(): PWaintMeBotWorldStore {
  return store
}
