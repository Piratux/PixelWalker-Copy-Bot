import { describe, test } from 'vitest'
import { getPwApiClient } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData, getDataFromMidiFile } from '@/test/RuntimeTestsUtil.ts'
import { getAnotherWorldBlocks } from '@/core/service/WorldService.ts'
import resurectionPPKMidFile from '@/test/resources/ResuRection-PPK.mid?url'

describe.sequential('MIDI Import', () => {
  test('Resurection - PPK', { timeout: 60_000 }, async () => {
    // Exported from MuseScore to MIDI: https://musescore.com/user/36900198/scores/6802158
    const resurectionPPKWorldId = 'r0815f256fce3dd'
    const expectedData = await getAnotherWorldBlocks(resurectionPPKWorldId, getPwApiClient())
    const receivedData = await getDataFromMidiFile(resurectionPPKMidFile)

    compareDeserialisedStructureData(receivedData, expectedData)
  })
})
