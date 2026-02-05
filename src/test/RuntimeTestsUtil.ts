import { DeserialisedStructure } from 'pw-js-world'
import { deepStrictEqual } from 'node:assert'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { getImportedFromEelvlData } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import { placeMultipleBlocks, placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { createEmptyBlocks } from '@/core/service/PwClientService.ts'
import { getImportedFromPngData } from '@/webtool/png/service/PngImporterService.ts'
import { getImportedFromMidiData } from '@/webtool/midi/service/MidiImporterService.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { getBotData, selectBlocks } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import { Promisable } from '@/core/util/Promise.ts'
import { CopyBotData } from '@/copybot/type/CopyBotData.ts'
import { toRaw } from 'vue'
import { expect } from 'vitest'

export function compareDeserialisedStructureData(
  receivedData: DeserialisedStructure,
  expectedData: DeserialisedStructure,
) {
  deepStrictEqual(receivedData.width, expectedData.width)
  deepStrictEqual(receivedData.height, expectedData.height)
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    for (let x = 0; x < receivedData.width; x++) {
      for (let y = 0; y < receivedData.height; y++) {
        const receivedBlock = receivedData.blocks[layer][x][y]
        const expectedBlock = expectedData.blocks[layer][x][y]
        deepStrictEqual(
          receivedBlock,
          expectedBlock,
          new Error(
            `ERROR! Block at ${x}, ${y} on layer ${layer} is not equal.\nGot (${receivedBlock.name}):\n${JSON.stringify(receivedBlock)}.\nExpected (${expectedBlock.name}):\n${JSON.stringify(expectedBlock)}`,
          ),
        )
      }
    }
  }
}

export async function getDataFromEelvlFile(fileUrl: string): Promise<DeserialisedStructure> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromEelvlData(fileArrayBuffer).blocks
}

export async function getDataFromPngFile(fileUrl: string, quantized: boolean): Promise<DeserialisedStructure> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromPngData(fileArrayBuffer, quantized)
}

export async function getDataFromMidiFile(fileUrl: string): Promise<DeserialisedStructure> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromMidiData(fileArrayBuffer, false)
}

export function verifyExpectedBlocks(expectedOutputBlocks: WorldBlock[], areaSize = vec2(10, 10)) {
  const currentBlocks = toRaw(getPwGameWorldHelper()).sectionArea(0, 0, areaSize.x - 1, areaSize.y - 1)
  const expectedBlocks = createEmptyBlocks(areaSize)
  for (const worldBlock of expectedOutputBlocks) {
    expectedBlocks.blocks[worldBlock.layer][worldBlock.pos.x][worldBlock.pos.y] = worldBlock.block
  }

  compareDeserialisedStructureData(currentBlocks, expectedBlocks)
}

export function selectArea(from: vec2, to: vec2) {
  const playerId = getPwGameWorldHelper().botPlayerId
  const botData = getBotData(playerId)

  selectBlocks(botData, from, playerId)
  selectBlocks(botData, to, playerId)
}

export async function runSelectCommandTest(
  inputBlocks: WorldBlock[],
  expectedOutputBlocks: WorldBlock[],
  selectFrom: vec2,
  selectTo: vec2,
  command: (botData: CopyBotData) => Promisable<void>,
) {
  const testAreaSize = vec2(10, 10)
  const clearTestAreaBlocks = createEmptyBlocks(testAreaSize)

  await expect(placeWorldDataBlocks(clearTestAreaBlocks), 'Failed to place world data blocks').resolves.toBe(true)

  await placeMultipleBlocks(inputBlocks)
  selectArea(selectFrom, selectTo)

  const playerId = getPwGameWorldHelper().botPlayerId
  const botData = getBotData(playerId)
  await command(botData)

  verifyExpectedBlocks(expectedOutputBlocks, testAreaSize)
}
