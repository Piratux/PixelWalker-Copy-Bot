import { PWaintMePowerUp, PWaintMeTeam } from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'

export const PWAINTME_TEAMS: PWaintMeTeam[] = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow']
export const PWAINTME_ARENA = { minX: 75, minY: 75, maxX: 124, maxY: 124 }
export const PWAINTME_SPAWN = { x: 105, y: 64 }
export const PWAINTME_PRISON = { x: 81, y: 152 }
export const PWAINTME_MAP_SIZE = 50
export const PWAINTME_ROUND_SECONDS = 60
export const PWAINTME_POWER_UPS: PWaintMePowerUp[] = [
  'mega_bomb',
  'cross_strike',
  'freezing_beam',
  'dimension_flip',
  'super_brush',
  'prison_party',
]
export const PWAINTME_DEBUFFS: PWaintMePowerUp[] = ['freezing_beam', 'dimension_flip', 'prison_party']
