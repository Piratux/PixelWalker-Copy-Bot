import { Block, DeserialisedStructure, Point } from 'pw-js-world'

export type PWaintMeTeam = 'red' | 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow'
export type PWaintMeMode = 'normal' | 'team_battle' | 'egg_hunt' | 'painter_party' | 'boom_blitz_boss'
export type PWaintMeModifier = 'none' | 'fly' | 'speed' | 'multijump'
export type PWaintMePowerUp =
  'mega_bomb' | 'cross_strike' | 'freezing_beam' | 'dimension_flip' | 'super_brush' | 'prison_party'

export interface PWaintMePlayerRoundData {
  username: string
  team: PWaintMeTeam
  blocksPainted: number
  baseRadius: number
  brushUntil: number
}

export interface PWaintMePlayerStats {
  wins: number
  dailyWins: number
  dailyWinsDate: string
  roundsPlayed: number
  totalBlocksPainted: number
  lastPlayed: string
  colorWins: Map<PWaintMeTeam, number>
}

export interface PWaintMeMapBlock {
  x: number
  y: number
  paletteId: string
  // JSON block arguments use the SDK's named-field format.
  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  args: Record<string, string | number | boolean | number[]>
}

export interface PWaintMeMapData {
  name: string
  author: string
  layers: PWaintMeMapBlock[][]
}

export interface PWaintMeMapEntry {
  name: string
  author: string
  blocks: DeserialisedStructure
  spawnPoints: Point[]
}

export interface PWaintMePaletteEntry {
  color: string
  layer: number
  variants: Map<PWaintMeTeam, number>
}

export interface PWaintMePendingEffect {
  playerId: number
  effect: string
  value: number
  expiresAt: number
}

export interface PWaintMeSnapshotBlock {
  x: number
  y: number
  layer: number
  block: Block
}
