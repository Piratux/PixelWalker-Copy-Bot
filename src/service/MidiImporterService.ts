import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
// import { getBlockId, placeLayerDataBlocks } from '@/service/WorldService.ts'
import { getBlockId, placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PWClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { pwCheckEditWhenImporting } from '@/service/PWClientService.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { MessageService } from '@/service/MessageService.ts'
import { Midi } from '@tonejs/midi'
import { PwBlockName } from '@/gen/PwBlockName'

export async function importFromMidi(fileData: ArrayBuffer) {
  if (!pwCheckEditWhenImporting(getPwGameWorldHelper())) {
    return
  }

  // getImportedFromMidiData(fileData)
  // return  
  const worldData = getImportedFromMidiData(fileData)

  let message: string
  if (worldData === null) {
    message = 'ERROR! Failed to get midi data.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
    return
  }

  const success = await placeWorldDataBlocks(worldData, vec2(0, 0))
  // const success = await placeLayerDataBlocks(worldData, vec2(0, 0), LayerType.Foreground)

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

// Main PNG importer function
export function getImportedFromMidiData(fileData: ArrayBuffer): DeserialisedStructure|null {
  const pwMapWidth = getPwGameWorldHelper().width;
  const pwMapHeight = getPwGameWorldHelper().height;

  const portal_height = 1

  const pwBlock3DArray: [Block[][], Block[][], Block[][]] = [[], [], []];
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    pwBlock3DArray[layer] = [];
    for (let x = 0; x < pwMapWidth; x++) {
      pwBlock3DArray[layer][x] = [];
      for (let y = 0; y < pwMapHeight; y++) {
        // if (x === 0 || y === 0 || x === (pwMapWidth-1) || y === (pwMapHeight-1)) {
        //   // pwBlock3DArray[layer][x][y] = new Block(getBlockId(PwBlockName.BASIC_GREEN));
        // } else {
        //   pwBlock3DArray[layer][x][y] = new Block(0);
        // }
        pwBlock3DArray[layer][x][y] = new Block(0);
      }
    }
  }

  pwBlock3DArray[LayerType.Foreground][0][0] = new Block(getBlockId(PwBlockName.TOOL_SPAWN_LOBBY));
  pwBlock3DArray[LayerType.Foreground][0][1] = new Block(getBlockId(PwBlockName.BOOST_DOWN));
  pwBlock3DArray[LayerType.Overlay][0][1] = new Block(getBlockId(PwBlockName.LIQUID_MUD));
  pwBlock3DArray[LayerType.Overlay][0][2] = new Block(getBlockId(PwBlockName.LIQUID_WATER));
  pwBlock3DArray[LayerType.Foreground][0][2] = new Block(getBlockId(PwBlockName.TOOL_GOD_MODE_ACTIVATOR));

  const midi = new Midi(fileData)
  if (midi.header.tempos.length === 1) {
    const notes = processMidiFile(midi)
    const columnHeight = pwMapHeight - 2 - portal_height; // Leave 1 block at top and bottom
    let last_x = 0;

    // Object.entries(notes).forEach(([key]) => {
    Object.entries(notes).forEach(([key, value]) => {
      const spot = Number(key) + 100; // This is the distance along the music track

      // Determine which column (x) and row (y) the block should go in
      const x = Math.floor(spot / columnHeight); // column index
      const y = (spot % columnHeight) + 1; // vertical position, +1 to avoid top portal

      if (
        x >= 0 && x < pwMapWidth &&
        y >= 0 && y < pwMapHeight
      ) {
        const blockId = getBlockId((value.type === "piano") ? PwBlockName.NOTE_PIANO : PwBlockName.NOTE_GUITAR);

        // Split notes into groups of 5
        for (let i = 0; i < value.notes.length; i += 5) {
          const noteGroup = value.notes.slice(i, i + 5);
          const targetY = y + Math.floor(i / 5);

          // Only place if the spot is empty
          if (
            targetY < pwMapHeight &&
            pwBlock3DArray[LayerType.Foreground][x][targetY].bId === 0
          ) {
            pwBlock3DArray[LayerType.Foreground][x][targetY] = new Block(blockId, [Buffer.from(noteGroup)]);
            // Place background color blocks for each note in the group
          }
        }
        value.notes.forEach((note, idx) => {
          const [r, g, b] = getRGBfromNote(note);
          if (y + idx < pwMapHeight) {
            pwBlock3DArray[LayerType.Background][x][y + idx] = new Block(getBlockId(PwBlockName.CUSTOM_SOLID_BG), [(b + (g << 8) + (r << 16))]);
          }
        });
        last_x = Math.max(last_x, x)
      } else {
        // Optionally log or handle out-of-bounds notes
        console.warn(`Note at x=${x}, y=${y} is out of bounds and will be skipped.`);
      }
    });
    for (let x = 0; x <= last_x; x++) {
      // pwBlock3DArray[LayerType.Background][x][0] = new Block(getBlockId(PwBlockName.BRICK_RED_BG));
      // pwBlock3DArray[LayerType.Background][x][199 - portal_height] = new Block(getBlockId(PwBlockName.BRICK_RED_BG));
      if (x < (pwMapWidth-1)) {
        if (x !== 0) {
          pwBlock3DArray[LayerType.Foreground][x][0] = new Block(getBlockId(PwBlockName.PORTAL), [3, x, x]);
        }
        if (x < (pwMapWidth-1)) {
          pwBlock3DArray[LayerType.Foreground][x][199 - portal_height] = new Block(getBlockId(PwBlockName.PORTAL), [3, 0, x+1]);
        }      
      }
    }
    
  }
  else {
    const message = "Theres more than one tempo, this bot is not advanced enough for that yet."
    sendGlobalChatMessage(message)
    MessageService.error(message)
    return null
  }
  return new DeserialisedStructure(pwBlock3DArray, { width: pwMapWidth, height: pwMapHeight });
}

export function processMidiFile(midi: Midi): { [distance: number]: { type: string, notes: number[] } } {
  const write_notes: { [distance: number]: { type: string, notes: number[] } } = {};
  const default_speed = 13.55; 
  const multiplier = default_speed * (100/16);
  let highest_time = 0

  midi.tracks.map(track => {
    const notes = track.notes;
    const family = track.instrument.family;

    // guitars are supported because it requires strange note mappings.
    if (family === "piano") {
      notes.forEach(note => {
        if (highest_time <= note.time) {
          highest_time = note.time
        }
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

export function getRGBfromNote(note: number): [number, number, number] {
  const hue = (note % 12) * (360 / 13);
  const saturation = 100;
  const lightness = (Math.floor(note / 12) * (65 / 8)) + 15;

  return hslToRgb(hue / 360, saturation / 100, lightness / 100)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
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