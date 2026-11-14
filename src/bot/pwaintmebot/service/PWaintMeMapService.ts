import { Block, DeserialisedStructure, LayerType, Point } from 'pw-js-world'
import allowedBlocks from '@/bot/pwaintmebot/data/AllowedBlocks.json'
import { PWAINTME_ARENA, PWAINTME_MAP_SIZE } from '@/bot/pwaintmebot/constant/General.ts'
import { PWaintMeMapData, PWaintMeMapEntry } from '@/bot/pwaintmebot/type/PWaintMeBotData.ts'
import { usePWaintMeBotWorldStore } from '@/bot/pwaintmebot/store/PWaintMeBotWorldStore.ts'
import { createEmptyBlocks } from '@/core/service/PwClientService.ts'
import { getPwApiClient, getPwBlocksByPwName, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import {
  getAnotherWorldBlocks,
  getAnotherWorldData,
  getDeserialisedStructureSection,
  placeWorldDataBlocks,
} from '@/core/service/WorldService.ts'
import { placeBotWorld } from '@/core/service/BotWorldService.ts'
import { GameError } from '@/core/class/GameError.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { vec2 } from '@basementuniverse/vec'

const allowed = new Set(allowedBlocks)
const mapSignNames = new Set<string>([
  PwBlockName.SIGN_NORMAL,
  PwBlockName.SIGN_RED,
  PwBlockName.SIGN_GREEN,
  PwBlockName.SIGN_BLUE,
  PwBlockName.SIGN_GOLD,
])

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export function isPWaintMeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parsePWaintMeMap(value: unknown): PWaintMeMapData {
  if (
    !isPWaintMeObject(value) ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    value.name.length > 40 ||
    typeof value.author !== 'string' ||
    value.author.trim().length === 0 ||
    value.author.length > 30 ||
    !Array.isArray(value.layers) ||
    value.layers.length !== 3
  ) {
    throw new GameError('Invalid PWaintMe map metadata or layers.')
  }
  const layers: PWaintMeMapData['layers'] = []
  for (const layer of value.layers) {
    if (!Array.isArray(layer) || layer.length > PWAINTME_MAP_SIZE ** 2) {
      throw new GameError(`Invalid layer in PWaintMe map "${value.name}".`)
    }
    const entries: PWaintMeMapData['layers'][number] = []
    const positions = new Set<string>()
    for (const entry of layer) {
      if (
        !isPWaintMeObject(entry) ||
        typeof entry.x !== 'number' ||
        typeof entry.y !== 'number' ||
        !Number.isInteger(entry.x) ||
        !Number.isInteger(entry.y) ||
        entry.x < 0 ||
        entry.y < 0 ||
        entry.x >= PWAINTME_MAP_SIZE ||
        entry.y >= PWAINTME_MAP_SIZE ||
        typeof entry.paletteId !== 'string' ||
        !isPWaintMeObject(entry.args)
      ) {
        throw new GameError(`Invalid block in PWaintMe map "${value.name}".`)
      }
      const paletteId = entry.paletteId.toUpperCase()
      if (!allowed.has(paletteId)) {
        throw new GameError(`PWaintMe maps cannot contain ${paletteId}.`)
      }
      const key = `${entry.x},${entry.y}`
      if (positions.has(key)) {
        throw new GameError(`Duplicate block position in PWaintMe map "${value.name}".`)
      }
      positions.add(key)
      const args: PWaintMeMapData['layers'][number][number]['args'] = {}
      for (const [name, arg] of Object.entries(entry.args)) {
        if (typeof arg === 'string' || typeof arg === 'boolean' || (typeof arg === 'number' && Number.isFinite(arg))) {
          args[name] = arg
        } else if (
          Array.isArray(arg) &&
          arg.every((byte: unknown) => typeof byte === 'number' && Number.isInteger(byte) && byte >= 0 && byte <= 255)
        ) {
          args[name] = arg.map((byte: number) => byte)
        } else {
          throw new GameError(`Invalid ${name} field in PWaintMe map "${value.name}".`)
        }
      }
      entries.push({ x: entry.x, y: entry.y, paletteId, args })
    }
    layers.push(entries)
  }
  return { name: value.name.trim(), author: value.author.trim(), layers }
}

export function createPWaintMeMap(data: PWaintMeMapData): PWaintMeMapEntry {
  const blocks = createEmptyBlocks(vec2(PWAINTME_MAP_SIZE, PWAINTME_MAP_SIZE))
  const spawnPoints: Point[] = []
  for (const [layer, entries] of data.layers.entries()) {
    for (const entry of entries) {
      const catalogBlock = getPwBlocksByPwName().get(entry.paletteId)
      if (catalogBlock === undefined) {
        throw new GameError(`PWaintMe map "${data.name}" uses an unavailable block: ${entry.paletteId}.`)
      }
      if (catalogBlock.Layer !== layer) {
        throw new GameError(`PWaintMe map "${data.name}" places ${entry.paletteId} on the wrong layer.`)
      }
      const args = Object.fromEntries(
        Object.entries(entry.args).map(([name, arg]) => [name, Array.isArray(arg) ? new Uint8Array(arg) : arg]),
      )
      blocks.blocks[layer][entry.x][entry.y] = new Block(catalogBlock.Id, args)
      if (layer === 1 && entry.args.portal_id === 'start') {
        spawnPoints.push({ x: PWAINTME_ARENA.minX + entry.x, y: PWAINTME_ARENA.minY + entry.y })
      }
    }
  }
  if (spawnPoints.length === 0) {
    for (let y = 1; y < PWAINTME_MAP_SIZE - 1 && spawnPoints.length === 0; y++) {
      for (let x = 1; x < PWAINTME_MAP_SIZE - 1; x++) {
        if (blocks.blocks[LayerType.Foreground][x][y].bId === 0) {
          spawnPoints.push({ x: PWAINTME_ARENA.minX + x, y: PWAINTME_ARENA.minY + y })
          break
        }
      }
    }
  }
  if (spawnPoints.length === 0) {
    throw new GameError(`PWaintMe map "${data.name}" has no spawn position.`)
  }
  return { name: data.name, author: data.author, blocks, spawnPoints }
}

export async function loadPWaintMeMapWorld(): Promise<void> {
  sendGlobalChatMessage('Loading PWaintMe maps...')
  const blocks = await getAnotherWorldBlocks('mtpisfgitt9pd6a', getPwApiClient())
  loadPWaintMeMaps(blocks)
}

export function loadPWaintMeMaps(world: DeserialisedStructure): void {
  const store = usePWaintMeBotWorldStore()
  const maps = new Map<string, PWaintMeMapEntry>()
  const foreground = world.blocks[LayerType.Foreground]
  const spacing = PWAINTME_MAP_SIZE + 2
  for (let x = 3; x + PWAINTME_MAP_SIZE <= foreground.length; x += spacing) {
    for (let y = 3; y + PWAINTME_MAP_SIZE <= foreground[x].length; y += spacing) {
      const sign = foreground[x][y - 1]
      if (!mapSignNames.has(sign.name)) {
        continue
      }
      const text = sign.args.text
      if (typeof text !== 'string' || text.split('\n').length !== 3) {
        throw new GameError(`Expected a three-line PWaintMe map sign at (${x},${y - 1}).`)
      }
      const [name, , author] = text.split('\n')
      const blocks = getDeserialisedStructureSection(world, x, y, x + PWAINTME_MAP_SIZE - 1, y + PWAINTME_MAP_SIZE - 1)
      const data = serialisePWaintMeMap(name, author, blocks)
      const key = getPWaintMeMapKey(data.name)
      if (maps.has(key)) {
        throw new GameError(`Duplicate PWaintMe map name "${data.name}" at (${x},${y}).`)
      }
      maps.set(key, createPWaintMeMap(data))
    }
  }
  if (maps.size === 0) {
    throw new GameError('No PWaintMe maps found in world mtpisfgitt9pd6a.')
  }
  store.maps = maps
}

export function getPWaintMeMapKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
}

function serialisePWaintMeMap(name: string, author: string, blocks: DeserialisedStructure): PWaintMeMapData {
  const layers: PWaintMeMapData['layers'] = [[], [], []]
  for (let layer = 0; layer < 3; layer++) {
    for (let x = 0; x < PWAINTME_MAP_SIZE; x++) {
      for (let y = 0; y < PWAINTME_MAP_SIZE; y++) {
        const block = blocks.blocks[layer][x][y]
        if (block.bId === 0) {
          continue
        }
        const args: PWaintMeMapData['layers'][number][number]['args'] = {}
        for (const [key, value] of Object.entries(block.args)) {
          if (value !== undefined) {
            args[key] = value instanceof Uint8Array ? Array.from(value) : value
          }
        }
        layers[layer].push({ x, y, paletteId: block.name, args })
      }
    }
  }
  return parsePWaintMeMap({ name, author, layers })
}

export function requireMapPosition(position: Point): void {
  const helper = getPwGameWorldHelper()
  if (
    !Number.isInteger(position.x) ||
    !Number.isInteger(position.y) ||
    position.x < 0 ||
    position.y < 0 ||
    position.x + PWAINTME_MAP_SIZE > helper.width ||
    position.y + PWAINTME_MAP_SIZE > helper.height
  ) {
    throw new GameError('The selected 50x50 area must be inside the world.')
  }
}

export async function placePWaintMeMap(
  map: PWaintMeMapEntry,
  position: Point = vec2(PWAINTME_ARENA.minX, PWAINTME_ARENA.minY),
): Promise<void> {
  requireMapPosition(position)
  if (!(await placeWorldDataBlocks(map.blocks, position))) {
    throw new GameError(`Failed to place PWaintMe map "${map.name}".`)
  }
}

export async function placePWaintMeWorld(): Promise<void> {
  sendGlobalChatMessage('Loading PWaintMe world...')
  const pwaintmeMapWorldId = 'ojh39rpwmcr5xz4'
  const world = await getAnotherWorldData(pwaintmeMapWorldId, getPwApiClient())
  await placeBotWorld(world, 'PWaintMe')
}
