import { beforeEach, describe, test } from 'vitest'
import { getPwApiClient } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData } from '@/test/RuntimeTestsUtil.ts'
import { clearWorld } from '@/core/service/PwClientService.ts'
import { getAnotherWorldBlocks } from '@/core/service/WorldService.ts'
import { getExportedToEelvlData } from '@/webtool/eelvl/service/EelvlExporterService.ts'
import { getImportedFromEelvlData } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import { bufferToArrayBuffer } from '@/core/util/Buffers.ts'

describe.sequential('EELVL Export', () => {
  beforeEach(async () => {
    await clearWorld()
  })

  test('EELVL Export (with EELVL Import)', { timeout: 60_000 }, async () => {
    const testEelvlExportWorldId = 'ra9285102d4a41a'
    const expectedData = await getAnotherWorldBlocks(testEelvlExportWorldId, getPwApiClient())

    const everyBlockWorldId = 'ewki341n7ve153l'
    const everyBlockWorldData = await getAnotherWorldBlocks(everyBlockWorldId, getPwApiClient())

    // NOTE: Ideally, 2 .eelvl files should be compared here.
    // Or even better, test for each individual block should be done.
    // However both of those approaches require too much work and maintenance with each update.
    // So we will stick with less robust test, that should catch at least some issues if there are any.
    const eelvlExportResult = getExportedToEelvlData(everyBlockWorldData)
    const eelvlImportResult = getImportedFromEelvlData(bufferToArrayBuffer(eelvlExportResult.byteBuffer))
    const receivedData = eelvlImportResult.blocks

    compareDeserialisedStructureData(receivedData, expectedData)
  })
})
