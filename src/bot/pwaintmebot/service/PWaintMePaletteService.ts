import { PWAINTME_TEAMS } from '@/bot/pwaintmebot/constant/General.ts'
import { usePWaintMeBotWorldStore } from '@/bot/pwaintmebot/store/PWaintMeBotWorldStore.ts'
import { PWaintMeTeam } from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'
import { getPwBlocks } from '@/core/store/PwClientStore.ts'

export function initPWaintMePalette(): void {
  const palette = usePWaintMeBotWorldStore().palette
  palette.clear()
  const families = new Map<string, { id: number; color: string; layer: number }[]>()
  const pattern =
    /^(BASIC|BEVELED|CHECKER|HALFBLOCKS|ONEWAY|BRICK|TILES|GLASS|MINERALS|PLASTIC|CANVAS|MINE_CRYSTAL|WINDOW|NORMAL|DARK|PASTEL|CAVE)_(WHITE|GRAY|BLACK|RED|ORANGE|YELLOW|GREEN|CYAN|BLUE|MAGENTA|BROWN|OLIVE|TEAL|PURPLE|LIME|TAN|PINK)((?:_(?:LEFT|TOP|RIGHT|BOTTOM))?)(_BG)?$/
  for (const block of getPwBlocks()) {
    const match = pattern.exec(block.PaletteId)
    if (match === null) {
      continue
    }
    const key = `${match[1]}${match[3]}${match[4] ?? ''}`
    const family = families.get(key) ?? []
    family.push({ id: block.Id, color: match[2].toLowerCase(), layer: block.Layer })
    families.set(key, family)
  }
  for (const family of families.values()) {
    const variants = new Map<PWaintMeTeam, number>()
    for (const team of PWAINTME_TEAMS) {
      const aliases =
        team === 'magenta' ? ['purple', 'pink'] : team === 'cyan' ? ['teal'] : team === 'yellow' ? ['olive'] : []
      const block =
        family.find((entry) => entry.color === team) ?? family.find((entry) => aliases.includes(entry.color))
      if (block !== undefined) {
        variants.set(team, block.id)
      }
    }
    for (const block of family) {
      const team = PWAINTME_TEAMS.find((candidate) => variants.get(candidate) === block.id)
      palette.set(block.id, { color: team ?? block.color, layer: block.layer, variants })
    }
  }
}
