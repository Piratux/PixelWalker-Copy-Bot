import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { compareLabelData, runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.move (labels)', { concurrent: false }, () => {
  test.each([1, 2])('.move (%i placements)', async (count) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Moved' })
    const untouched = createLabel({ position: vec2(80, 80), text: 'Untouched' })
    await runSelectLabelCommandTest(
      [label, untouched],
      [{ ...label, position: vec2(3 + count * 16, 7 + count * 16) }, untouched],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
        for (let i = 1; i <= count; i++) {
          await pasteBlocksLabelsAndZones(botData, vec2(i, i))
        }
      },
    )
  })

  test('Moving onto the source does not duplicate labels', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Same position' })
    await runSelectLabelCommandTest([label], [label], vec2(0, 0), vec2(0, 0), async (botData) => {
      await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
      await pasteBlocksLabelsAndZones(botData, vec2(0, 0))
    })
  })

  test('Moving identical labels preserves their count', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Duplicate' })
    const moved = { ...label, position: vec2(35, 55) }
    await runSelectLabelCommandTest([label, label], [moved, moved], vec2(0, 0), vec2(0, 0), async (botData) => {
      await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })

  test('Repeated move placements replace only the last moved copies', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Repeated move' })
    await runSelectLabelCommandTest(
      [label],
      [{ ...label, position: vec2(35, 55) }],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        const playerId = getPwGameWorldHelper().botPlayerId
        await commandReceived('.move', playerId)
        await commandReceived('.paste 2 1', playerId)
        compareLabelData([...getPwGameWorldHelper().labels.values()], [label, { ...label, position: vec2(19, 7) }])
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      },
    )
  })
})
