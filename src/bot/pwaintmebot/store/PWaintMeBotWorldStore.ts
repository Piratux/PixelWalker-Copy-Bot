import { PWaintMeBotState } from '@/bot/pwaintmebot/enum/PWaintMeBotState.ts'
import {
  PWaintMeMapData,
  PWaintMeMapEntry,
  PWaintMePaletteEntry,
  PWaintMePlayerStats,
} from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'

interface PWaintMeBotWorldStore {
  currentState: PWaintMeBotState
  everySecondUpdateIsRunning: boolean
  queuedPlayers: Set<number>
  afkPlayers: Set<number>
  playerStats: Map<string, PWaintMePlayerStats>
  maps: Map<string, PWaintMeMapEntry>
  savedMaps: Map<string, PWaintMeMapData>
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
  savedMaps: new Map(),
  palette: new Map(),
  lastActivePlayerCount: -1,
}

export function usePWaintMeBotWorldStore(): PWaintMeBotWorldStore {
  return store
}
