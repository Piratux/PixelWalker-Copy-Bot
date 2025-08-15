import everyBlockEelvlFile from '@/test/resources/every-block.eelvl?url'
import everyBlockExportedEelvlPwlvlFile from '@/test/resources/every-block-exported-eelvl.pwlvl?url'
import everyBlockOriginalPwlvlFile from '@/test/resources/every-block-original.pwlvl?url'
import piratuxPfpQuantizedPwlvlFile from '@/test/resources/piratux-pfp-quantized.pwlvl?url'
import piratuxPfpUnquantizedPwlvlFile from '@/test/resources/piratux-pfp-unquantized.pwlvl?url'
import piratuxPfpPngFile from '@/test/resources/piratux-pfp.png?url'
import thomasBergersenAuraPianoPwlvlFile from '@/test/resources/Thomas_Bergersen-Aura_Piano.pwlvl?url'
import thomasBergersenAuraPianoMidFile from '@/test/resources/Thomas_Bergersen-Aura_Piano.mid?url'
import { getImportedFromEelvlData } from '@/service/EelvlImporterService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { getExportedToEelvlData } from '@/service/EelvlExporterService.ts'
import {
  compareDeserialisedStructureData,
  getDataFromEelvlFile,
  getDataFromMidiFile,
  getDataFromPngFile,
  getDataFromPwlvlFile,
  placePwLvlblocks,
} from '@/test/RuntimeTestsUtil.ts'
import { getAllWorldBlocks, pwAuthenticate, pwJoinWorld } from '@/service/PwClientService.ts'
import { getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/store/PwClientStore.ts'
import { CustomBotEvents, PWApiClient, PWGameClient, WorldEventNames } from 'pw-js-api'
import { PWGameWorldHelper } from 'pw-js-world'
import waitUntil from 'async-wait-until'
import { bufferToArrayBuffer } from '@/util/Buffers.ts'

export async function performRuntimeTests() {
  sendGlobalChatMessage('[TEST] Performing runtime tests...')
  const tests = [
    testMapUpdateFromWorldBlockPlacedPacket,
    testMapUpdateFromPlayerInitPacket,
    testEelvlImport,
    testEelvlExportWithEelvlData,
    testEelvlExportWithPwlvlData,
    testPngImportQuantized,
    testPngImportUnquantized,
    testMidiImport,
  ]
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    try {
      await test()
      const msg = `[TEST] ${i + 1}/${tests.length} PASSED ${test.name}`
      sendGlobalChatMessage(msg)
    } catch (e) {
      const msg = `[TEST] ${i + 1}/${tests.length} FAILED ${test.name}`
      sendGlobalChatMessage(msg)
      console.error(msg, e)
      return
    }
  }
  sendGlobalChatMessage(`[TEST] ALL TESTS PASSED`)
}

async function testEelvlImport() {
  const expectedData = await getDataFromPwlvlFile(everyBlockExportedEelvlPwlvlFile)
  const receivedData = await getDataFromEelvlFile(everyBlockEelvlFile)

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testEelvlExportWithEelvlData() {
  const expectedData = await getDataFromPwlvlFile(everyBlockExportedEelvlPwlvlFile)

  const [exportEelvlDataBuffer] = getExportedToEelvlData(expectedData)
  const receivedData = getImportedFromEelvlData(bufferToArrayBuffer(exportEelvlDataBuffer))

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testEelvlExportWithPwlvlData() {
  const pwlvlData = await getDataFromPwlvlFile(everyBlockOriginalPwlvlFile)

  const [exportPwlvlDataBuffer] = getExportedToEelvlData(pwlvlData)
  const receivedData = getImportedFromEelvlData(bufferToArrayBuffer(exportPwlvlDataBuffer))

  const expectedData = await getDataFromPwlvlFile(everyBlockExportedEelvlPwlvlFile)

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testMapUpdateFromWorldBlockPlacedPacket() {
  const expectedData = await placePwLvlblocks(everyBlockOriginalPwlvlFile)
  const receivedData = getAllWorldBlocks(getPwGameWorldHelper())

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testMapUpdateFromPlayerInitPacket() {
  const expectedData = await placePwLvlblocks(everyBlockOriginalPwlvlFile)

  getPwGameClient().disconnect(false)

  const pwApiClient = new PWApiClient(usePwClientStore().email, usePwClientStore().password)

  await pwAuthenticate(pwApiClient)

  const worldId = usePwClientStore().worldId

  const pwGameClient = new PWGameClient(pwApiClient)
  const pwGameWorldHelper = new PWGameWorldHelper()

  let initReceived = false
  pwGameClient.addHook(pwGameWorldHelper.receiveHook).addCallback('playerInitPacket', async () => {
    pwGameClient.send('playerInitReceived')

    const receivedData = getAllWorldBlocks(pwGameWorldHelper)
    compareDeserialisedStructureData(receivedData, expectedData)
    pwGameClient.disconnect(false)

    const eventName: WorldEventNames | keyof CustomBotEvents = 'playerInitPacket'

    const playerInitPacketReceived = () => {
      getPwGameClient().removeCallback(eventName, playerInitPacketReceived)
      initReceived = true
    }

    getPwGameClient().addCallback(eventName, playerInitPacketReceived)

    await pwJoinWorld(getPwGameClient(), worldId)
  })

  await pwJoinWorld(pwGameClient, worldId)
  await waitUntil(() => initReceived, { timeout: 30000, intervalBetweenAttempts: 1000 })
}

async function testPngImportQuantized() {
  const expectedData = await getDataFromPwlvlFile(piratuxPfpQuantizedPwlvlFile)
  const receivedData = await getDataFromPngFile(piratuxPfpPngFile, true)

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testPngImportUnquantized() {
  const expectedData = await getDataFromPwlvlFile(piratuxPfpUnquantizedPwlvlFile)
  const receivedData = await getDataFromPngFile(piratuxPfpPngFile, false)

  compareDeserialisedStructureData(receivedData, expectedData)
}

async function testMidiImport() {
  const expectedData = await getDataFromPwlvlFile(thomasBergersenAuraPianoPwlvlFile)
  const receivedData = await getDataFromMidiFile(thomasBergersenAuraPianoMidFile)

  compareDeserialisedStructureData(receivedData!, expectedData)
}
