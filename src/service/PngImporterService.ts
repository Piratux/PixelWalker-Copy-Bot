import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { placeLayerDataBlocks } from '@/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/store/PwClientStore.ts'
import { createEmptyBlocks, handlePlaceBlocksResult, requireBotEditPermission } from '@/service/PwClientService.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { PNG } from 'pngjs'

export async function importFromPng(fileData: ArrayBuffer, quantize = true) {
  requireBotEditPermission(getPwGameWorldHelper())

  const worldData = getImportedFromPngData(fileData, quantize)
  const success = await placeLayerDataBlocks(worldData, vec2(0, 0), LayerType.Background)
  handlePlaceBlocksResult(success)
}

export function getImportedFromPngData(fileData: ArrayBuffer, quantize = true): DeserialisedStructure {
  let buffer = Buffer.from(new Uint8Array(fileData))
  const IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
  const iendIndex = buffer.indexOf(IEND)
  if (iendIndex !== -1) {
    buffer = buffer.subarray(0, iendIndex + IEND.length)
  }
  const png = PNG.sync.read(buffer)

  const pwMapWidth = getPwGameWorldHelper().width
  const pwMapHeight = getPwGameWorldHelper().height

  // optimizing the color-palette here could be improved a LOT, but it works.
  let quantizeAmt = 1
  if (quantize) {
    const MAX_COLORS = 1024
    const uniqueColors = new Set<number>()
    while (quantizeAmt <= 64) {
      uniqueColors.clear()
      for (let x = 0; x < png.width; x++) {
        for (let y = 0; y < png.height; y++) {
          const idx = (png.width * y + x) << 2
          const alpha = png.data[idx + 3]
          const r = quantizeAndClamp(png.data[idx], quantizeAmt, alpha)
          const g = quantizeAndClamp(png.data[idx + 1], quantizeAmt, alpha)
          const b = quantizeAndClamp(png.data[idx + 2], quantizeAmt, alpha)
          const hex = b + (g << 8) + (r << 16)
          uniqueColors.add(hex)
        }
      }
      if (uniqueColors.size <= MAX_COLORS) break
      quantizeAmt *= 2
    }
  }

  // 1. Group locations by color
  const colorMap = new Map<number, [number, number][]>()

  for (let x = 0; x < pwMapWidth; x++) {
    for (let y = 0; y < pwMapHeight; y++) {
      if (x < png.width && y < png.height) {
        const idx = (png.width * y + x) << 2
        const alpha = png.data[idx + 3]
        const r = quantizeAndClamp(png.data[idx], quantizeAmt, alpha)
        const g = quantizeAndClamp(png.data[idx + 1], quantizeAmt, alpha)
        const b = quantizeAndClamp(png.data[idx + 2], quantizeAmt, alpha)
        const hex = b + (g << 8) + (r << 16)

        if (!colorMap.has(hex)) {
          colorMap.set(hex, [])
        }
        colorMap.get(hex)!.push([x, y])
      }
    }
  }

  const blocks = createEmptyBlocks(getPwGameWorldHelper())

  for (const [hex, locations] of colorMap) {
    const block = new Block(PwBlockName.CUSTOM_SOLID_BG, [hex])
    for (const [x, y] of locations) {
      blocks.blocks[LayerType.Background][x][y] = block
    }
  }

  return blocks
}

function quantizeAndClamp(value: number, quantizeAmt: number, alpha: number): number {
  // Blend with black based on alpha
  const blended = Math.round((value * alpha) / 255)
  return Math.max(0, Math.min(255, Math.round(blended / quantizeAmt) * quantizeAmt))
}
