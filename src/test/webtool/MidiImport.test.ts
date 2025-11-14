import { describe, test } from 'vitest'
import { getPwApiClient } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData, getDataFromMidiFile } from '@/test/RuntimeTestsUtil.ts'
import { getAnotherWorldBlocks } from '@/core/service/WorldService.ts'
import midFile from '@/test/resources/Seven_nation_army_-_The_White_Stripes.mid?url'

describe.sequential('MIDI Import', () => {
  test('Seven nation army - The White Stripes (piano, guitar and drums)', { timeout: 60_000 }, async () => {
    // Exported from MuseScore to MIDI: https://musescore.com/user/7599011/scores/4063111
    const midiWorldId = 'r0815f256fce3dd'
    const expectedData = await getAnotherWorldBlocks(midiWorldId, getPwApiClient())
    const receivedData = await getDataFromMidiFile(midFile)

    compareDeserialisedStructureData(receivedData, expectedData)
  })
})
