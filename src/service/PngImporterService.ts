import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { getBlockId, placeLayerDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PWClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { pwCheckEditWhenImporting, pwCreateEmptyBlocks } from '@/service/PWClientService.ts'
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

export function getImportedFromPngData(fileData: ArrayBuffer, quantize = true): DeserialisedStructure {
  let buffer = Buffer.from(new Uint8Array(fileData));
  const IEND = Buffer.from([0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82]);
  const iendIndex = buffer.indexOf(IEND);
  if (iendIndex !== -1) {
    buffer = buffer.subarray(0, iendIndex + IEND.length);
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
          const alpha = png.data[idx + 3];
          const r = quantizeAndClamp(png.data[idx], quantize_amt, alpha);
          const g = quantizeAndClamp(png.data[idx + 1], quantize_amt, alpha);
          const b = quantizeAndClamp(png.data[idx + 2], quantize_amt, alpha);
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
        const alpha = png.data[idx + 3];
        const r = quantizeAndClamp(png.data[idx], quantize_amt, alpha);
        const g = quantizeAndClamp(png.data[idx + 1], quantize_amt, alpha);
        const b = quantizeAndClamp(png.data[idx + 2], quantize_amt, alpha);
        const hex = b + (g << 8) + (r << 16);
        if (!colorMap[hex]) colorMap[hex] = [];
        colorMap[hex].push([x, y]);
      }
    }
  }

  const blocks = pwCreateEmptyBlocks(getPwGameWorldHelper())

  for (const [hex, locations] of Object.entries(colorMap)) {
    const block = new Block(getBlockId(PwBlockName.CUSTOM_SOLID_BG), [hex]);
    for (const [x, y] of locations) {
      blocks.blocks[LayerType.Background][x][y] = block;
    }
  }

  return blocks;
}

function quantizeAndClamp(value: number, quantize_amt: number, alpha: number): number {
  // Blend with black based on alpha
  const blended = Math.round((value * alpha) / 255);
  return Math.max(0, Math.min(255, Math.round(blended / quantize_amt) * quantize_amt));
}