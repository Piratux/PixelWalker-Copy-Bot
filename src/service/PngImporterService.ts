import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { getBlockId, placeLayerDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PWClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { pwCheckEditWhenImporting } from '@/service/PWClientService.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { MessageService } from '@/service/MessageService.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { PNG } from 'pngjs'

export async function importFromPng(fileData: ArrayBuffer, quantize = true) {
  if (!pwCheckEditWhenImporting(getPwGameWorldHelper())) {
    return
  }

  const worldData = getImportedFromPngData(fileData, quantize)

  const success = await placeLayerDataBlocks(worldData, vec2(0, 0), LayerType.Background)

  let message: string
  if (success) {
    message = 'Finished importing image.'
    sendGlobalChatMessage(message)
    MessageService.success(message)
  } else {
    message = 'ERROR! Failed to import image.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
  }
}

// Main PNG importer function
export function getImportedFromPngData(fileData: ArrayBuffer, quantize = true): DeserialisedStructure {
  let buffer = Buffer.from(new Uint8Array(fileData));
  const IEND = Buffer.from([0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
  const iendIndex = buffer.indexOf(IEND);
  if (iendIndex !== -1) {
    buffer = buffer.slice(0, iendIndex + IEND.length);
  }
  const png = PNG.sync.read(buffer);

  const pwMapWidth = getPwGameWorldHelper().width;
  const pwMapHeight = getPwGameWorldHelper().height;

  // optimizing the color-palette here could be improved a LOT, but it works.
  let quantize_amt = 1;
  if (quantize) {
    const MAX_COLORS = 1024;
    const uniqueColors = new Set<number>();
    while (quantize_amt <= 64) {
      uniqueColors.clear();
      for (let x = 0; x < png.width; x++) {
        for (let y = 0; y < png.height; y++) {
          const idx = (png.width * y + x) << 2;
          let r = png.data[idx];
          let g = png.data[idx + 1];
          let b = png.data[idx + 2];
          r = Math.round(r / quantize_amt) * quantize_amt;
          g = Math.round(g / quantize_amt) * quantize_amt;
          b = Math.round(b / quantize_amt) * quantize_amt;
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          const hex = b + (g << 8) + (r << 16);
          uniqueColors.add(hex);
        }
      }
      if (uniqueColors.size <= MAX_COLORS) break;
      quantize_amt *= 2;
    }
  }

  // 1. Group locations by color
  const colorMap: Record<string, Array<[number, number]>> = {};

  for (let x = 0; x < pwMapWidth; x++) {
    for (let y = 0; y < pwMapHeight; y++) {
      if (x < png.width && y < png.height) {
        const idx = (png.width * y + x) << 2;
        let r = png.data[idx];
        let g = png.data[idx + 1];
        let b = png.data[idx + 2];

        // Quantize color to reduce unique colors. We do this to minimize placing time.
        r = Math.round(r / quantize_amt) * quantize_amt;
        g = Math.round(g / quantize_amt) * quantize_amt;
        b = Math.round(b / quantize_amt) * quantize_amt;

        // Clamp to [0, 255]
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        const hex = b + (g << 8) + (r << 16);
        if (!colorMap[hex]) colorMap[hex] = [];
        colorMap[hex].push([x, y]);
      }
    }
  }

  const pwBlock3DArray: [Block[][], Block[][], Block[][]] = [[], [], []];
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    pwBlock3DArray[layer] = [];
    for (let x = 0; x < pwMapWidth; x++) {
      pwBlock3DArray[layer][x] = [];
      for (let y = 0; y < pwMapHeight; y++) {
        pwBlock3DArray[layer][x][y] = new Block(0);
      }
    }
  }

  for (const [hex, locations] of Object.entries(colorMap)) {
    const block = new Block(getBlockId(PwBlockName.CUSTOM_SOLID_BG), [hex]);
    for (const [x, y] of locations) {
      pwBlock3DArray[LayerType.Background][x][y] = block;
    }
  }

  return new DeserialisedStructure(pwBlock3DArray, { width: pwMapWidth, height: pwMapHeight });
}