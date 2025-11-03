import { DeserialisedStructure } from 'pw-js-world'
import { getImportedFromPwlvlData } from '@/pwlvl/service/PwlvlImporterService.ts'
import { deepStrictEqual } from 'node:assert'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { getImportedFromEelvlData } from '@/eelvl/service/EelvlImporterService.ts'
import { placeMultipleBlocks, placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { clearWorld, createEmptyBlocks } from '@/core/service/PwClientService.ts'
import { getImportedFromPngData } from '@/png/service/PngImporterService.ts'
import { getImportedFromMidiData } from '@/midi/service/MidiImporterService.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { getBotData, selectBlocks } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import { Promisable } from '@/core/util/Promise.ts'

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

export async function getDataFromPwlvlFile(fileUrl: string): Promise<DeserialisedStructure> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromPwlvlData(fileArrayBuffer)
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

export async function getDataFromMidiFile(fileUrl: string): Promise<DeserialisedStructure | null> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromMidiData(fileArrayBuffer, false)
}

// Returns blocks loaded from fileUrl
export async function placePwLvlblocks(fileUrl: string): Promise<DeserialisedStructure> {
  await clearWorld()

  const expectedData = await getDataFromPwlvlFile(fileUrl)
  const success = await placeWorldDataBlocks(expectedData)
  if (!success) {
    throw new Error('Failed to place all blocks')
  }

  return expectedData
}

export function verifyExpectedBlocks(expectedOutputBlocks: WorldBlock[], areaSize = vec2(10, 10)) {
  const currentBlocks = getPwGameWorldHelper().sectionBlocks(0, 0, areaSize.x - 1, areaSize.y - 1)
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
  command: () => Promisable<void>,
) {
  const testAreaSize = vec2(10, 10)
  const clearTestAreaBlocks = createEmptyBlocks(testAreaSize)
  await placeWorldDataBlocks(clearTestAreaBlocks)

  await placeMultipleBlocks(inputBlocks)
  selectArea(selectFrom, selectTo)
  await command()

  verifyExpectedBlocks(expectedOutputBlocks, testAreaSize)
}
