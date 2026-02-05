import everyEelvlBlockEelvlFile from '@/test/resources/every-eelvl-block.eelvl?url'
import { describe, test } from 'vitest'
import { getPwApiClient } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData, compareLabelData, getDataFromEelvlFile } from '@/test/RuntimeTestsUtil.ts'
import { getAnotherWorldData } from '@/core/service/WorldService.ts'

describe.sequential('EELVL Import', () => {
  test('EELVL Import (from .eelvl file)', { timeout: 60_000 }, async () => {
    const testEelvlImportWorldId = 'r0ed3a956087328'
    const expectedData = await getAnotherWorldData(testEelvlImportWorldId, getPwApiClient())
    const receivedData = await getDataFromEelvlFile(everyEelvlBlockEelvlFile)

    compareDeserialisedStructureData(receivedData.blocks, expectedData.blocks)
    compareLabelData(receivedData.labels, Array.from(expectedData.labels.values()))
  })
})
