import everyBlockEelvlFile from '@/test/resources/every-block.eelvl?url'
import everyBlockExportedEelvlPwlvlFile from '@/test/resources/every-block-exported-eelvl.pwlvl?url'
import everyBlockOriginalPwlvlFile from '@/test/resources/every-block-original.pwlvl?url'
import piratuxPfpQuantizedPwlvlFile from '@/test/resources/piratux-pfp-quantized.pwlvl?url'
import piratuxPfpUnquantizedPwlvlFile from '@/test/resources/piratux-pfp-unquantized.pwlvl?url'
import piratuxPfpPngFile from '@/test/resources/piratux-pfp.png?url'
import thomasBergersenAuraPianoPwlvlFile from '@/test/resources/Thomas_Bergersen-Aura_Piano.pwlvl?url'
import thomasBergersenAuraPianoMidFile from '@/test/resources/Thomas_Bergersen-Aura_Piano.mid?url'
import { getImportedFromEelvlData } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { getExportedToEelvlData } from '@/webtool/eelvl/service/EelvlExporterService.ts'
import {
  compareDeserialisedStructureData,
  getDataFromEelvlFile,
  getDataFromMidiFile,
  getDataFromPngFile,
  getDataFromPwlvlFile,
} from '@/test/RuntimeTestsUtil.ts'
import { bufferToArrayBuffer } from '@/core/util/Buffers.ts'

export async function performRuntimeTests() {
  sendGlobalChatMessage('[TEST] Performing runtime tests...')
  const tests = [
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

  const eelvlExportResult = getExportedToEelvlData(expectedData)
  const eelvlImportResult = getImportedFromEelvlData(bufferToArrayBuffer(eelvlExportResult.byteBuffer))

  compareDeserialisedStructureData(eelvlImportResult.blocks, expectedData)
}

async function testEelvlExportWithPwlvlData() {
  const pwlvlData = await getDataFromPwlvlFile(everyBlockOriginalPwlvlFile)

  const eelvlExportResult = getExportedToEelvlData(pwlvlData)
  const eelvlImportResult = getImportedFromEelvlData(bufferToArrayBuffer(eelvlExportResult.byteBuffer))

  const expectedData = await getDataFromPwlvlFile(everyBlockExportedEelvlPwlvlFile)

  compareDeserialisedStructureData(eelvlImportResult.blocks, expectedData)
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

  compareDeserialisedStructureData(receivedData, expectedData)
}
