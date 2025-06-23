import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { getBlockId, placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PWClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { pwCheckEditWhenImporting, pwCreateEmptyBlocks } from '@/service/PWClientService.ts'
import { MessageService } from '@/service/MessageService.ts'
import { Midi } from '@tonejs/midi'
import { PwBlockName } from '@/gen/PwBlockName'

export async function importFromMidi(fileData: ArrayBuffer, showColors: boolean) {
  if (!pwCheckEditWhenImporting(getPwGameWorldHelper())) {
    return
  }

  const worldData = getImportedFromMidiData(fileData, showColors)

  let message: string
  if (worldData === null) {
    message = 'ERROR! This midi has no piano notes.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
    return
  }

  const success = await placeWorldDataBlocks(worldData, vec2(0, 0))

  if (success) {
    message = 'Finished importing midi.'
    sendGlobalChatMessage(message)
    MessageService.success(message)
  } else {
    message = 'ERROR! Failed to import midi.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
  }
}

function getImportedFromMidiData(fileData: ArrayBuffer, showColors: boolean): DeserialisedStructure|null {
  const pwMapWidth = getPwGameWorldHelper().width;
  const pwMapHeight = getPwGameWorldHelper().height;

  const blocks = pwCreateEmptyBlocks(getPwGameWorldHelper())

  // These blocks create a spawner, and a set of boosts that get you to the max falling speed pretty fast
  blocks.blocks[LayerType.Foreground][0][0] = new Block(getBlockId(PwBlockName.TOOL_SPAWN_LOBBY));
  blocks.blocks[LayerType.Foreground][0][1] = new Block(getBlockId(PwBlockName.BOOST_DOWN));
  blocks.blocks[LayerType.Overlay][0][1] = new Block(getBlockId(PwBlockName.LIQUID_MUD));
  blocks.blocks[LayerType.Overlay][0][2] = new Block(getBlockId(PwBlockName.LIQUID_WATER));
  blocks.blocks[LayerType.Foreground][0][2] = new Block(getBlockId(PwBlockName.TOOL_GOD_MODE_ACTIVATOR));

  const midi = new Midi(fileData)
  const notes = processMidiFile(midi)
  if (Object.keys(notes).length === 0) {
    return null
  }
  const last_x = writeNotes(notes, blocks, pwMapWidth, pwMapHeight, showColors)
  for (let x = 0; x <= last_x; x++) {
    if (x < (pwMapWidth-1)) {
      if (x !== 0) {
        blocks.blocks[LayerType.Foreground][x][0] = new Block(getBlockId(PwBlockName.PORTAL), [3, x, x]);
      }
      if (x < (pwMapWidth-1)) {
        blocks.blocks[LayerType.Foreground][x][pwMapHeight - 2] = new Block(getBlockId(PwBlockName.PORTAL), [3, 0, x+1]);
      }      
    }
  }
  return new DeserialisedStructure(blocks.blocks, { width: pwMapWidth, height: pwMapHeight });
}

function writeNotes(
  notes: { [distance: number]: { type: string, notes: number[] } },
  blocks: DeserialisedStructure,
  pwMapWidth: number,
  pwMapHeight: number,
  showColors: boolean
): number {
  const columnHeight = pwMapHeight - 3; // Leave 1 block at top and bottom
  let last_x = 0;
  // its worth noting that this doesnt account for time taken to travel between portals, but otherwise its pretty seamless.
  const entries = Object.entries(notes);
  for (let entryIdx = 0; entryIdx < entries.length; entryIdx++) {
    const [key, value] = entries[entryIdx];
    const spot = Number(key) + 100; // This is the distance along the music track

    // Determine which column (x) and row (y) the block should go in
    const x = Math.floor(spot / columnHeight); // column index
    const y = (spot % columnHeight) + 1; // vertical position, +1 to avoid top portal

    if (
      x >= 0 && x < pwMapWidth &&
      y >= 0 && y < pwMapHeight
    ) {
      // Split notes into groups of 5
      for (let i = 0; i < value.notes.length; i += 5) {
        const noteGroup = value.notes.slice(i, i + 5);
        const targetY = y + Math.floor(i / 5);

        // Only place if the spot is empty
        if (
          targetY < pwMapHeight &&
          blocks.blocks[LayerType.Foreground][x][targetY].bId === 0
        ) {
          blocks.blocks[LayerType.Foreground][x][targetY] = new Block(PwBlockName.NOTE_PIANO, [Buffer.from(noteGroup)]);
          // Place background color blocks for each note in the group
        }
      }
      // Shows each note's colors, can only be turned on in dev mode
      if (showColors) {
        value.notes.forEach((note, idx) => {
          const [r, g, b] = getRGBfromNote(note);
          if (y + idx < pwMapHeight) {
            blocks.blocks[LayerType.Background][x][y + idx] = new Block(getBlockId(PwBlockName.CUSTOM_SOLID_BG), [(b + (g << 8) + (r << 16))]);
          }
        });
      }
      last_x = Math.max(last_x, x)
    } else {
      const message = `ERROR! Note at x=${x}, y=${y} is out of bounds. Stopping.`
      sendGlobalChatMessage(message)
      MessageService.error(message)
      break
    }
  }
  return last_x
}

function processMidiFile(midi: Midi): { [distance: number]: { type: string, notes: number[] } } {
  const write_notes: { [distance: number]: { type: string, notes: number[] } } = {};
  const default_speed = 13.55; // This is the default falling speed at 100% gravity in the form of pixels/tick.
  const multiplier = default_speed * (100/16); // This is the conversion rate from pixels/tick to blocks/second. (16 pixels = 1 block, 100 ticks = 1 second)
  let highest_time = 0

  midi.tracks.map(track => {
    const notes = track.notes;
    const family = track.instrument.family;

    // guitars are not supported (yet) because it requires strange note mappings.
    if (family === "piano") {
      notes.forEach(note => {
        if (highest_time <= note.time) {
          highest_time = note.time
        }
        // Notes beyond these points don't exist on normal 88-note keyboards, such as in pixelwalker.
        if (note.midi < 21 || note.midi > 108) return;

        const distance = Math.round(note.time * multiplier);

        if (!write_notes[distance]) {
          write_notes[distance] = {
            type: family,
            notes: [note.midi - 21],
          };
        } else {
          const entry = write_notes[distance];
          if (entry.type !== family) {
            console.warn(`Block type conflict at distance ${distance}`);
            return;
          }
          entry.notes.push(note.midi - 21);
        }
      });
    } else {
      console.warn("Missing instrument family: ", family)
    }
  });

  return write_notes
}

function getRGBfromNote(note: number): [number, number, number] {
  const hue = (note % 12) * (360 / 13);
  const saturation = 100;
  const lightness = (Math.floor(note / 12) * (65 / 8)) + 15;

  return hslToRgb(hue / 360, saturation / 100, lightness / 100)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }

  return [roundClamp(r * 255, 0, 255), roundClamp(g * 255, 0, 255), roundClamp(b * 255, 0, 255)];
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function roundClamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(Math.round(value), max));
}