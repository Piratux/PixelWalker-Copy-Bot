import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { compareLabelData, runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { useLabelStore } from '@/core/store/LabelStore.ts'

describe('.redo (labels)', { concurrent: false }, () => {
  test.each([1, 2, 10])('.redo %i restores pasted labels', async (count) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Redo paste' })
    const firstPaste = { ...label, position: vec2(35, 55) }
    const secondPaste = { ...label, position: vec2(67, 87) }
    const expectedLabels = count === 1 ? [label, firstPaste] : [label, firstPaste, secondPaste]
    await runSelectLabelCommandTest([label], expectedLabels, vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await commandReceived('.undo 2', playerId)
      await commandReceived(`.redo ${count}`, playerId)
    })
  })

  test.each([1, 2])('.redo %i restores moved labels', async (count) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Redo move' })
    const expected = { ...label, position: count === 1 ? vec2(35, 55) : vec2(67, 87) }
    await runSelectLabelCommandTest([label], [expected], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await commandReceived('.undo 2', playerId)
      await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
      await commandReceived(`.redo ${count}`, playerId)
    })
  })

  test('Moving after redo uses the restored move history', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Move after redo' })
    await runSelectLabelCommandTest(
      [label],
      [{ ...label, position: vec2(99, 119) }],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        const playerId = getPwGameWorldHelper().botPlayerId
        await commandReceived('.move', playerId)
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
        await commandReceived('.undo', playerId)
        await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
        await commandReceived('.redo', playerId)
        await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
        compareLabelData([...getPwGameWorldHelper().labels.values()], [{ ...label, position: vec2(35, 55) }])
        await pasteBlocksLabelsAndZones(botData, vec2(6, 7))
      },
    )
  })

  test('Redo with no history leaves labels unchanged', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'No history' })
    await runSelectLabelCommandTest([label], [label], vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived('.redo', getPwGameWorldHelper().botPlayerId)
    })
  })
})
