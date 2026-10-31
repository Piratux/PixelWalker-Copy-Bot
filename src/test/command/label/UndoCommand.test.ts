import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { compareLabelData, runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { useLabelStore } from '@/core/store/LabelStore.ts'

describe('.undo (labels)', { concurrent: false }, () => {
  test.each([1, 2, 10])('.undo %i removes pasted labels', async (count) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Undo paste' })
    const expectedLabels = count === 1 ? [label, { ...label, position: vec2(35, 55) }] : [label]
    await runSelectLabelCommandTest([label], expectedLabels, vec2(0, 0), vec2(0, 0), async (botData) => {
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await commandReceived(`.undo ${count}`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test.each([1, 2])('.undo %i restores moved labels', async (count) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Undo move' })
    const expected = count === 1 ? { ...label, position: vec2(35, 55) } : label
    await runSelectLabelCommandTest([label], [expected], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await commandReceived(`.undo ${count}`, playerId)
    })
  })

  test('Moving after undo uses the restored labels and server IDs', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Move after undo' })
    await runSelectLabelCommandTest(
      [label],
      [{ ...label, position: vec2(99, 119) }],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        const playerId = getPwGameWorldHelper().botPlayerId
        await commandReceived('.move', playerId)
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
        await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
        await commandReceived('.undo', playerId)
        await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
        compareLabelData([...getPwGameWorldHelper().labels.values()], [{ ...label, position: vec2(35, 55) }])
        await pasteBlocksLabelsAndZones(botData, vec2(6, 7))
        await commandReceived('.redo', playerId)
      },
    )
  })

  test('Undo with no history leaves labels unchanged', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'No history' })
    await runSelectLabelCommandTest([label], [label], vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived('.undo', getPwGameWorldHelper().botPlayerId)
    })
  })
})
