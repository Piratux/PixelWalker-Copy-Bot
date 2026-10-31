import { DeserialisedStructure, ILabel } from 'pw-js-world'
import { AssertionError, deepStrictEqual } from 'node:assert'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { getImportedFromEelvlData } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import {
  deleteWorldLabels,
  placeLabels,
  placeMultipleBlocks,
  placeWorldDataBlocks,
} from '@/core/service/WorldService.ts'
import { createEmptyBlocks } from '@/core/service/PwClientService.ts'
import { getImportedFromPngData } from '@/webtool/png/service/PngImporterService.ts'
import { getImportedFromMidiData } from '@/webtool/midi/service/MidiImporterService.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived, getBotData, selectBlocks } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { Promisable } from '@/core/util/Promise.ts'
import { CopyBotData } from '@/bot/copybot/type/CopyBotData.ts'
import { expect } from 'vitest'
import { EelvlImportResult } from '@/webtool/eelvl/type/EelvlImportResult.ts'
import { useLabelStore } from '@/core/store/LabelStore.ts'
import { cloneDeep } from 'lodash-es'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'

export function compareDeserialisedStructureData(
  receivedData: DeserialisedStructure,
  expectedData: DeserialisedStructure,
) {
  const mismatches: string[] = []
  deepStrictEqual(receivedData.width, expectedData.width)
  deepStrictEqual(receivedData.height, expectedData.height)
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    for (let y = 0; y < Math.max(receivedData.height, expectedData.height); y++) {
      for (let x = 0; x < Math.max(receivedData.width, expectedData.width); x++) {
        const receivedBlock = receivedData.blocks[layer]?.[x]?.[y]
        const expectedBlock = expectedData.blocks[layer]?.[x]?.[y]
        try {
          deepStrictEqual(receivedBlock, expectedBlock)
        } catch (error) {
          if (!(error instanceof AssertionError)) {
            throw error
          }
          mismatches.push(
            `ERROR! Block at ${x}, ${y} on layer ${layer} is not equal.\nGot (${receivedBlock?.name}):\n${JSON.stringify(receivedBlock)}.\nExpected (${expectedBlock?.name}):\n${JSON.stringify(expectedBlock)}`,
          )
        }
      }
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Structure comparison failed with ${mismatches.length} mismatch(es):\n\n${mismatches.join('\n\n')}`)
  }
}

export function compareLabelData(receivedData: ILabel[], expectedData: ILabel[]) {
  deepStrictEqual(receivedData.length, expectedData.length, new Error(`ERROR! Label count is not equal.`))
  receivedData.sort((a, b) =>
    a.position.x !== b.position.x ? a.position.x - b.position.x : a.position.y - b.position.y,
  )
  expectedData.sort((a, b) =>
    a.position.x !== b.position.x ? a.position.x - b.position.x : a.position.y - b.position.y,
  )
  for (let i = 0; i < receivedData.length; i++) {
    // We are not interested in outer type here
    const receivedLabel = { ...receivedData[i] }
    const expectedLabel = { ...expectedData[i] }

    // ... and we are not interested in comparing ids as they're generated
    // Normalize both objects because fixtures may omit id while server labels include it.
    receivedLabel.id = undefined
    expectedLabel.id = undefined

    deepStrictEqual(
      receivedLabel,
      expectedLabel,
      new Error(
        `ERROR! Label with ID ${expectedLabel.id} is not equal.\nGot:\n${JSON.stringify(receivedLabel)}.\nExpected:\n${JSON.stringify(expectedLabel)}`,
      ),
    )
  }
}

export async function getDataFromEelvlFile(fileUrl: string): Promise<EelvlImportResult> {
  const fileRaw = await fetch(fileUrl)
  const fileArrayBuffer = await fileRaw.arrayBuffer()
  return getImportedFromEelvlData(fileArrayBuffer)
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
  const currentBlocks = getPwGameWorldHelper().sectionArea(0, 0, areaSize.x - 1, areaSize.y - 1)
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
  const playerId = getPwGameWorldHelper().botPlayerId
  // Imports use masks rather than the selection, so disable label and zone imports too.
  await commandReceived('.mask background foreground overlay', playerId)
  selectArea(selectFrom, selectTo)

  const botData = getBotData(playerId)
  // Block-only tests must stay isolated even when a command re-enables the default masks.
  botData.selectedLabels = []
  botData.selectedZones = []
  await command(botData)

  verifyExpectedBlocks(expectedOutputBlocks, testAreaSize)
}

export async function runSelectLabelCommandTest(
  inputLabels: ILabel[],
  expectedOutputLabels: ILabel[],
  selectFrom: vec2,
  selectTo: vec2,
  command: (botData: CopyBotData) => Promisable<void>,
) {
  const originalLabels = cloneDeep([...getPwGameWorldHelper().labels.values()])
  const playerId = getPwGameWorldHelper().botPlayerId

  try {
    deleteWorldLabels([...getPwGameWorldHelper().labels.values()])
    await placeLabels(inputLabels)
    await commandReceived('.mask label', playerId)
    selectArea(selectFrom, selectTo)

    const botData = getBotData(playerId)
    // Default masks may be enabled in a label test without pasting live blocks or zones.
    botData.selectedBlocks = []
    botData.selectedZones = []
    await command(botData)
    await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)

    compareLabelData([...getPwGameWorldHelper().labels.values()], cloneDeep(expectedOutputLabels))
  } finally {
    // Restoring labels must also wait for pending placements after a failed assertion.
    await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
    deleteWorldLabels([...getPwGameWorldHelper().labels.values()])
    await placeLabels(originalLabels)
  }
}
