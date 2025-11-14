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
import { MidiDrum } from '@/webtool/midi/enum/MidiDrum.ts'
import { PwDrumNoteType } from '@/core/enum/PwDrumNoteType.ts'
import { PwInstrument } from '@/webtool/midi/enum/PwInstrument.ts'
import { Note } from '@tonejs/midi/dist/Note'

type Distance = number
type PwMappedNote = number
type NoteMap = Map<Distance, Map<PwInstrument, Set<PwMappedNote>>>

export async function importFromMidi(fileData: ArrayBuffer, showColors: boolean) {
  requireBotEditPermission(getPwGameWorldHelper())

  const worldData = getImportedFromMidiData(fileData, showColors)

  const success = await placeWorldDataBlocks(worldData)
  handlePlaceBlocksResult(success)
}

function placePortals(lastX: number, pwMapWidth: number, pwMapHeight: number, blocks: DeserialisedStructure) {
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
}

export function getImportedFromMidiData(fileData: ArrayBuffer, showColors: boolean): DeserialisedStructure {
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
  if (notes.size === 0) {
    throw new Error('This midi has no notes that can be mapped to Pixelwalker instruments.')
  }

  const lastX = writeNotes(notes, blocks, pwMapWidth, pwMapHeight, showColors)
  placePortals(lastX, pwMapWidth, pwMapHeight, blocks)
  return new DeserialisedStructure(blocks.blocks, { width: pwMapWidth, height: pwMapHeight })
}

function getNotePos(spot: number, columnHeight: number) {
  const x = Math.floor(spot / columnHeight) // column index
  const y = (spot % columnHeight) + 1 // vertical position, +1 to avoid top portal
  return { x, y }
}

function showNoteInColor(x: number, y: number, noteGroup: number[], blocks: DeserialisedStructure) {
  const [r, g, b] = getRGBFromNotes(noteGroup)
  blocks.blocks[LayerType.Background][x][y] = new Block(PwBlockName.CUSTOM_SOLID_BG, [b + (g << 8) + (r << 16)])
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
  for (const [distance, instrumentMapNotes] of notes) {
    const spot = distance + 100 // This is the distance along the music track

    for (const [instrument, notes] of instrumentMapNotes) {
      let maxNotesInSingleBlock
      let blockName
      switch (instrument) {
        case PwInstrument.PIANO:
          maxNotesInSingleBlock = 5
          blockName = PwBlockName.NOTE_PIANO
          break
        case PwInstrument.GUITAR:
          maxNotesInSingleBlock = 6
          blockName = PwBlockName.NOTE_GUITAR
          break
        case PwInstrument.DRUMS:
          maxNotesInSingleBlock = 3
          blockName = PwBlockName.NOTE_DRUM
          break
        default:
          throw new Error('Unhandled instrument family')
      }

      for (let i = 0; i < notes.size; i += maxNotesInSingleBlock) {
        const noteGroup = Array.from(notes)
          .sort((a, b) => a - b)
          .slice(i, i + maxNotesInSingleBlock)

        const MAX_OFFSET_ATTEMPTS = 3
        for (let offset = 0; offset < MAX_OFFSET_ATTEMPTS; offset++) {
          const { x, y } = getNotePos(spot + offset, columnHeight)
          if (blocks.blocks[LayerType.Foreground][x][y].bId !== 0) {
            continue
          }

          if (x < 0 && x >= pwMapWidth && y < 0 && y >= pwMapHeight) {
            sendGlobalChatMessage(`ERROR! Note at x=${x}, y=${y} is out of bounds. Stopping.`)
            return lastX
          }
          lastX = Math.max(lastX, x)

          blocks.blocks[LayerType.Foreground][x][y] = new Block(blockName, [Buffer.from(noteGroup)])

          // Shows each note's colors, can only be turned on in dev mode
          if (showColors) {
            showNoteInColor(x, y, noteGroup, blocks)
          }
          break
        }
      }
    }
  }

  return lastX
}

function getMidiDrumToPwDrumNoteMap(): Map<number, number> {
  const result = new Map<number, number>()
  result.set(MidiDrum.BASS_DRUM_1_C2, PwDrumNoteType.KICK)
  result.set(MidiDrum.BASS_DRUM_2_B1, PwDrumNoteType.KICK)
  result.set(MidiDrum.LOW_FLOOR_TOM_F2, PwDrumNoteType.KICK)

  result.set(MidiDrum.HIGH_TOM_D3, PwDrumNoteType.TOM_1)
  result.set(MidiDrum.HI_MID_TOM_C3, PwDrumNoteType.TOM_2)
  result.set(MidiDrum.LOW_MID_TOM_B2, PwDrumNoteType.TOM_3)
  result.set(MidiDrum.HIGH_FLOOR_TOM_G2, PwDrumNoteType.TOM_3)
  result.set(MidiDrum.LOW_TOM_A2, PwDrumNoteType.TOM_4)

  result.set(MidiDrum.CLOSED_HI_HAT_F_2, PwDrumNoteType.HIHAT_1)
  result.set(MidiDrum.PEDAL_HI_HAT_G_2, PwDrumNoteType.HIHAT_2)
  result.set(MidiDrum.OPEN_HI_HAT_A_2, PwDrumNoteType.HIHAT_4)

  result.set(MidiDrum.SIDE_STICK_C_2, PwDrumNoteType.SNARE_2)
  result.set(MidiDrum.ACOUSTIC_SNARE_D2, PwDrumNoteType.SNARE_2)
  result.set(MidiDrum.ELECTRIC_SNARE_E2, PwDrumNoteType.SNARE_2)

  result.set(MidiDrum.CRASH_CYMBAL_1_C_3, PwDrumNoteType.CRASH_1)
  result.set(MidiDrum.CRASH_CYMBAL_2_A3, PwDrumNoteType.CRASH_2)

  result.set(MidiDrum.CHINA_CYMBAL_E3, PwDrumNoteType.RIDE)
  result.set(MidiDrum.SPLASH_CYMBAL_G3, PwDrumNoteType.RIDE)
  result.set(MidiDrum.RIDE_CYMBAL_1_D_3, PwDrumNoteType.RIDE)
  result.set(MidiDrum.RIDE_CYMBAL_2_B3, PwDrumNoteType.RIDE)
  result.set(MidiDrum.RIDE_BELL_F3, PwDrumNoteType.RIDE_BELL)

  result.set(MidiDrum.HAND_CLAP, PwDrumNoteType.CLAP)
  result.set(MidiDrum.SHAKER_A_5, PwDrumNoteType.SHACKER)
  result.set(MidiDrum.COWBELL_G_3, PwDrumNoteType.COWBELL)
  return result
}

function getMidiPianoToPwPianoNoteMap(): Map<number, number> {
  // Notes beyond these points don't exist on normal 88-note keyboards, such as in Pixelwalker.
  const result = new Map<number, number>()
  for (let i = 21; i <= 108; i++) {
    result.set(i, i - 21)
  }
  return result
}

function getMidiGuitarToPwGuitarNoteMap(): Map<number, number> {
  const result = new Map<number, number>()
  result.set(40, 43)
  result.set(41, 44)
  result.set(42, 45)
  result.set(43, 46)
  result.set(44, 47)
  result.set(45, 48)

  result.set(46, 38)
  result.set(47, 39)
  result.set(48, 40)
  result.set(49, 41)
  result.set(50, 42)

  result.set(51, 32)
  result.set(52, 33)
  result.set(53, 34)
  result.set(54, 35)
  result.set(55, 36)

  result.set(56, 27)
  result.set(57, 28)
  result.set(58, 29)
  result.set(59, 30)

  result.set(60, 21)
  result.set(61, 22)
  result.set(62, 23)
  result.set(63, 24)
  result.set(64, 25)

  result.set(65, 1)
  result.set(66, 2)
  result.set(67, 3)
  result.set(68, 4)
  result.set(69, 5)
  result.set(70, 6)
  result.set(71, 7)
  result.set(72, 8)
  result.set(73, 9)
  result.set(74, 10)
  result.set(75, 11)
  result.set(76, 12)
  result.set(77, 13)
  result.set(78, 14)
  result.set(79, 15)
  result.set(80, 16)
  result.set(81, 17)
  result.set(82, 18)
  result.set(83, 19)
  return result
}

function getEncounteredNoteSet(notes: Note[]) {
  const encounteredNoteSet = new Set<number>()
  notes.forEach((note) => {
    encounteredNoteSet.add(note.midi)
  })
  return encounteredNoteSet
}

function adjustOctaveGuitar(notes: Note[]) {
  const encounteredNotes = Array.from(getEncounteredNoteSet(notes)).sort((a, b) => a - b)

  const minNote = encounteredNotes[0]
  const maxNote = encounteredNotes[encounteredNotes.length - 1]
  const encounteredRange = maxNote - minNote

  const pwGuitarMinNote = 40
  const pwGuitarMaxNote = 83
  const guitarIntervalRange = pwGuitarMaxNote - pwGuitarMinNote

  if (encounteredRange > guitarIntervalRange) {
    console.warn('Guitar notes exceed supported range of [40; 83].')
    return
  }

  let octaveShift = 0
  if (minNote < pwGuitarMinNote) {
    // Avoids infinite loop
    for (let i = 0; i < 5; i++) {
      if (minNote + octaveShift * 12 < pwGuitarMinNote) {
        octaveShift += 1
      }
      if (maxNote + octaveShift * 12 > pwGuitarMaxNote) {
        octaveShift -= 1
      }
    }
  }

  if (octaveShift !== 0) {
    notes.forEach((note) => {
      note.midi += octaveShift * 12
    })
    console.log(`Adjusted guitar notes ${octaveShift > 0 ? 'up' : 'down'} by ${Math.abs(octaveShift)} octaves.`)
  }
}

function processMidiFile(midi: Midi): NoteMap {
  const writeNotes: NoteMap = new Map()
  const defaultSpeed = 13.55 // This is the default falling speed at 100% gravity in the form of pixels/tick.
  const multiplier = defaultSpeed * (100 / 16) // This is the conversion rate from pixels/tick to blocks/second. (16 pixels = 1 block, 100 ticks = 1 second)
  let highestTime = 0

  midi.tracks.forEach((track) => {
    const notes = track.notes
    const family = track.instrument.family

    // Midi files may contain empty tracks
    // Some people use them as comments or to store metadata
    if (notes.length === 0) {
      return
    }

    const INSTRUMENT_FAMILY_PIANO = 'piano'
    const INSTRUMENT_FAMILY_CHROMATIC_PERCUSSION = 'chromatic percussion' // XYLOPHONE
    const INSTRUMENT_FAMILY_ENSEMBLE = 'ensemble' // VIOLIN

    const INSTRUMENT_FAMILY_GUITAR = 'guitar'
    const INSTRUMENT_FAMILY_BASS = 'bass'

    const INSTRUMENT_FAMILY_DRUMS = 'drums'

    if (
      ![
        INSTRUMENT_FAMILY_PIANO,
        INSTRUMENT_FAMILY_GUITAR,
        INSTRUMENT_FAMILY_BASS,
        INSTRUMENT_FAMILY_DRUMS,
        INSTRUMENT_FAMILY_CHROMATIC_PERCUSSION,
        INSTRUMENT_FAMILY_ENSEMBLE,
      ].includes(family)
    ) {
      console.warn('Skipping unsupported instrument family: ', family)
      return
    }

    console.log(
      `Track "${family} - ${track.instrument.name}", encountered unique notes: `,
      Array.from(getEncounteredNoteSet(notes))
        .sort((a, b) => a - b)
        .toString(),
    )

    let pwInstrument
    switch (family) {
      case INSTRUMENT_FAMILY_PIANO:
      case INSTRUMENT_FAMILY_CHROMATIC_PERCUSSION:
      case INSTRUMENT_FAMILY_ENSEMBLE:
        pwInstrument = PwInstrument.PIANO
        break
      case INSTRUMENT_FAMILY_GUITAR:
      case INSTRUMENT_FAMILY_BASS:
        pwInstrument = PwInstrument.GUITAR
        adjustOctaveGuitar(notes)
        break
      case INSTRUMENT_FAMILY_DRUMS:
        pwInstrument = PwInstrument.DRUMS
        break
      default:
        console.warn('Skipping unsupported instrument family: ', family)
        return
    }

    notes.forEach((note) => {
      if (highestTime <= note.time) {
        highestTime = note.time
      }

      let mappedNote
      switch (pwInstrument) {
        case PwInstrument.PIANO:
          mappedNote = getMidiPianoToPwPianoNoteMap().get(note.midi)
          break
        case PwInstrument.GUITAR:
          mappedNote = getMidiGuitarToPwGuitarNoteMap().get(note.midi)
          break
        case PwInstrument.DRUMS:
          mappedNote = getMidiDrumToPwDrumNoteMap().get(note.midi)
          break
        default:
          throw new Error('Unhandled instrument family')
      }

      if (mappedNote === undefined) {
        return
      }

      const distance = Math.round(note.time * multiplier)

      const distanceEntry = writeNotes.get(distance)
      if (distanceEntry === undefined) {
        writeNotes.set(distance, new Map())
      }

      const pwInstrumentEntry = writeNotes.get(distance)!.get(pwInstrument)
      if (pwInstrumentEntry === undefined) {
        writeNotes.get(distance)!.set(pwInstrument, new Set())
      }

      writeNotes.get(distance)!.get(pwInstrument)!.add(mappedNote)
    })
  })

  return writeNotes
}

function getRGBFromNote(note: number): [number, number, number] {
  const hue = (note % 12) * (360 / 13)
  const saturation = 100
  const lightness = Math.floor(note / 12) * (65 / 8) + 15

  return hslToRgb(hue / 360, saturation / 100, lightness / 100)
}

function getRGBFromNotes(notes: number[]): [number, number, number] {
  let rTotal = 0
  let gTotal = 0
  let bTotal = 0

  notes.forEach((note) => {
    const [r, g, b] = getRGBFromNote(note)
    rTotal += r
    gTotal += g
    bTotal += b
  })

  return [Math.floor(rTotal % 256), Math.floor(gTotal % 256), Math.floor(bTotal % 256)]
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
