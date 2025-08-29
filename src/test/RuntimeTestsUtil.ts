import { DeserialisedStructure } from 'pw-js-world'
import { getImportedFromPwlvlData } from '@/service/PwlvlImporterService.ts'
import { deepStrictEqual } from 'node:assert'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { getImportedFromEelvlData } from '@/service/EelvlImporterService.ts'
import { placeWorldDataBlocks } from '@/service/WorldService.ts'
import { GameError } from '@/class/GameError.ts'
import { pwClearWorld } from '@/service/PwClientService.ts'
import { getImportedFromPngData } from '@/service/PngImporterService.ts'
import { getImportedFromMidiData } from '@/service/MidiImporterService.ts'

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
  return getImportedFromEelvlData(fileArrayBuffer)
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
  await pwClearWorld()

  const expectedData = await getDataFromPwlvlFile(fileUrl)
  const success = await placeWorldDataBlocks(expectedData)
  if (!success) {
    throw new GameError('Failed to place all blocks')
  }

  return expectedData
}
