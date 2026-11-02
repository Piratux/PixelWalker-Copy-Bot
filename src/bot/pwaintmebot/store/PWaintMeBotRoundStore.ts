import {
  PWaintMeMapEntry,
  PWaintMeMode,
  PWaintMeModifier,
  PWaintMePendingEffect,
  PWaintMePlayerRoundData,
  PWaintMeSnapshotBlock,
  PWaintMeTeam,
} from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'

interface PWaintMeBotRoundStore {
  players: Map<number, PWaintMePlayerRoundData>
  secondsLeft: number
  elapsedSeconds: number
  mode: PWaintMeMode
  modifier: PWaintMeModifier
  bossTeam: PWaintMeTeam | undefined
  bossSupernovaUsed: boolean
  lastPowerUpWasDebuff: boolean
  coins: Map<string, { x: number; y: number }>
  pendingEffects: PWaintMePendingEffect[]
  snapshot: PWaintMeSnapshotBlock[]
  map: PWaintMeMapEntry | undefined
}

function createPWaintMeBotRoundStore(): PWaintMeBotRoundStore {
  return {
    players: new Map(),
    secondsLeft: 0,
    elapsedSeconds: 0,
    mode: 'normal',
    modifier: 'none',
    bossTeam: undefined,
    bossSupernovaUsed: false,
    lastPowerUpWasDebuff: false,
    coins: new Map(),
    pendingEffects: [],
    snapshot: [],
    map: undefined,
  }
}

const store = createPWaintMeBotRoundStore()

export function resetPWaintMeBotRoundStore(): void {
  Object.assign(store, createPWaintMeBotRoundStore())
}

export function usePWaintMeBotRoundStore(): PWaintMeBotRoundStore {
  return store
}
