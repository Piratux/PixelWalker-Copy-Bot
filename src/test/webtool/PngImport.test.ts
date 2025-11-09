import { describe, test } from 'vitest'
import { getPwApiClient } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData, getDataFromPngFile } from '@/test/RuntimeTestsUtil.ts'
import { getAnotherWorldBlocks } from '@/core/service/WorldService.ts'
import piratuxPfpPngFile from '@/test/resources/piratux-pfp.png?url'

describe.sequential('PNG Import', () => {
  test('PNG Import Quantized', { timeout: 60_000 }, async () => {
    const piratuxProfilePictureQuantizedWorldId = '1sjs9llu6t76p6u'
    const expectedData = await getAnotherWorldBlocks(piratuxProfilePictureQuantizedWorldId, getPwApiClient())
    const receivedData = await getDataFromPngFile(piratuxPfpPngFile, true)

    compareDeserialisedStructureData(receivedData, expectedData)
  })
})
