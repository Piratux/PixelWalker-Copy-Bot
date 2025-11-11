import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import {
  createEmptyBlocksFullWorldSize,
  handlePlaceBlocksResult,
  requireBotEditPermission,
} from '@/core/service/PwClientService.ts'
import { Midi } from '@tonejs/midi'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { uniq } from 'lodash-es'

type NoteMap = Map<number, { type: string; notes: number[] }>

export async function importFromMidi(fileData: ArrayBuffer, showColors: boolean) {
  requireBotEditPermission(getPwGameWorldHelper())

  const worldData = getImportedFromMidiData(fileData, showColors)

  if (worldData === null) {
    throw new Error('This midi has no piano notes')
  }

  const success = await placeWorldDataBlocks(worldData)
  handlePlaceBlocksResult(success)
}

export function getImportedFromMidiData(fileData: ArrayBuffer, showColors: boolean): DeserialisedStructure | null {
  const pwMapWidth = getPwGameWorldHelper().width
  const pwMapHeight = getPwGameWorldHelper().height

  const blocks = createEmptyBlocksFullWorldSize(getPwGameWorldHelper())

  // These blocks create a spawner, and a set of boosts that get you to the max falling speed pretty fast
  blocks.blocks[LayerType.Foreground][0][0] = new Block(PwBlockName.TOOL_SPAWN_LOBBY)
  blocks.blocks[LayerType.Foreground][0][1] = new Block(PwBlockName.BOOST_DOWN)
  blocks.blocks[LayerType.Overlay][0][1] = new Block(PwBlockName.LIQUID_MUD)
  blocks.blocks[LayerType.Overlay][0][2] = new Block(PwBlockName.LIQUID_WATER)
  blocks.blocks[LayerType.Foreground][0][2] = new Block(PwBlockName.TOOL_GOD_MODE_ACTIVATOR)

  const midi = new Midi(fileData)
  const notes = processMidiFile(midi)
  if (Object.keys(notes).length === 0) {
    return null
  }
  const lastX = writeNotes(notes, blocks, pwMapWidth, pwMapHeight, showColors)
  for (let x = 0; x <= lastX; x++) {
    if (x < pwMapWidth - 1) {
      if (x !== 0) {
        blocks.blocks[LayerType.Foreground][x][0] = new Block(PwBlockName.PORTAL_VISIBLE_DOWN, [
          x.toString(),
          x.toString(),
        ])
      }
      if (x < pwMapWidth - 1) {
        blocks.blocks[LayerType.Foreground][x][pwMapHeight - 2] = new Block(PwBlockName.PORTAL_VISIBLE_DOWN, [
          '0',
          (x + 1).toString(),
        ])
      }
    }
  }
  return new DeserialisedStructure(blocks.blocks, { width: pwMapWidth, height: pwMapHeight })
}

function writeNotes(
  notes: NoteMap,
  blocks: DeserialisedStructure,
  pwMapWidth: number,
  pwMapHeight: number,
  showColors: boolean,
): number {
  const columnHeight = pwMapHeight - 3 // Leave 1 block at top and bottom
  let lastX = 0
  // its worth noting that this doesn't account for time taken to travel between portals, but otherwise it's pretty seamless.
  for (const [key, value] of notes) {
    const spot = key + 100 // This is the distance along the music track

    // Determine which column (x) and row (y) the block should go in
    const x = Math.floor(spot / columnHeight) // column index
    const y = (spot % columnHeight) + 1 // vertical position, +1 to avoid top portal

    if (x >= 0 && x < pwMapWidth && y >= 0 && y < pwMapHeight) {
      // Split notes into groups of 5
      for (let i = 0; i < value.notes.length; i += 5) {
        const noteGroup = uniq(value.notes.slice(i, i + 5).sort((a, b) => a - b))
        const targetY = y + Math.floor(i / 5)

        // Only place if the spot is empty
        if (targetY < pwMapHeight && blocks.blocks[LayerType.Foreground][x][targetY].bId === 0) {
          blocks.blocks[LayerType.Foreground][x][targetY] = new Block(PwBlockName.NOTE_PIANO, [Buffer.from(noteGroup)])
          // Place background color blocks for each note in the group
        }
      }
      // Shows each note's colors, can only be turned on in dev mode
      if (showColors) {
        value.notes.forEach((note, idx) => {
          const [r, g, b] = getRGBFromNote(note)
          if (y + idx < pwMapHeight) {
            blocks.blocks[LayerType.Background][x][y + idx] = new Block(PwBlockName.CUSTOM_SOLID_BG, [
              b + (g << 8) + (r << 16),
            ])
          }
        })
      }
      lastX = Math.max(lastX, x)
    } else {
      sendGlobalChatMessage(`ERROR! Note at x=${x}, y=${y} is out of bounds. Stopping.`)
      break
    }
  }
  return lastX
}

function processMidiFile(midi: Midi): NoteMap {
  const writeNotes: NoteMap = new Map()
  const defaultSpeed = 13.55 // This is the default falling speed at 100% gravity in the form of pixels/tick.
  const multiplier = defaultSpeed * (100 / 16) // This is the conversion rate from pixels/tick to blocks/second. (16 pixels = 1 block, 100 ticks = 1 second)
  let highestTime = 0

  midi.tracks.forEach((track) => {
    const notes = track.notes
    const family = track.instrument.family

    // guitars are not supported (yet) because it requires strange note mappings.
    if (family === 'piano') {
      notes.forEach((note) => {
        if (highestTime <= note.time) {
          highestTime = note.time
        }
        // Notes beyond these points don't exist on normal 88-note keyboards, such as in pixelwalker.
        if (note.midi < 21 || note.midi > 108) return

        const distance = Math.round(note.time * multiplier)

        const entry = writeNotes.get(distance)
        if (entry === undefined) {
          writeNotes.set(distance, {
            type: family,
            notes: [note.midi - 21],
          })
        } else {
          if (entry.type !== family) {
            console.warn(`Block type conflict at distance ${distance}`)
            return
          }
          // Only push if it doesn't already exist at that point. Prevents 2 of the same note at the same block.
          if (!entry.notes.includes(note.midi - 21)) {
            entry.notes.push(note.midi - 21)
          }
        }
      })
    } else {
      console.warn('Missing instrument family: ', family)
    }
  })

  return writeNotes
}

function getRGBFromNote(note: number): [number, number, number] {
  const hue = (note % 12) * (360 / 13)
  const saturation = 100
  const lightness = Math.floor(note / 12) * (65 / 8) + 15

  return hslToRgb(hue / 360, saturation / 100, lightness / 100)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hueToRgb(p, q, h + 1 / 3)
    g = hueToRgb(p, q, h)
    b = hueToRgb(p, q, h - 1 / 3)
  }

  return [roundClamp(r * 255, 0, 255), roundClamp(g * 255, 0, 255), roundClamp(b * 255, 0, 255)]
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function roundClamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(Math.round(value), max))
}
