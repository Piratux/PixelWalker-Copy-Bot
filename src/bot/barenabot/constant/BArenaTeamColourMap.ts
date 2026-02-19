import { BArenaTeam } from '@/bot/barenabot/enum/BArenaTeam.ts'
import { Colour } from '@/core/type/Colour.ts'

export const BArenaTeamColourMap = new Map<BArenaTeam, Colour>([
  [BArenaTeam.RED, { r: 255, g: 66, b: 0, a: 255 }],
  [BArenaTeam.BLUE, { r: 0, g: 180, b: 255, a: 255 }],
])
