import { beforeAll, describe, expect, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ILabel } from 'pw-js-world'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwApiClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { getAnotherWorldData } from '@/core/service/WorldService.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { compareLabelData, runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { useLabelStore } from '@/core/store/LabelStore.ts'

const WORLD_ID = '8nqftm1t0j43121'

describe('.import (labels)', { concurrent: false }, () => {
  let importedLabels: ILabel[] = []

  beforeAll(async () => {
    const { labels } = await getAnotherWorldData(WORLD_ID, getPwApiClient())
    const sourceLabels = [...labels.values()]
      .filter(({ position }) => position.x >= 160 && position.x < 400 && position.y >= 0 && position.y < 176)
      .map((label) => label.toJSON())
    expect(sourceLabels.length, 'The source world must contain labels in tiles 10 0 through 24 10').toBeGreaterThan(0)
    // Every corner selection places the source area's top-left tile (10, 0) at (3, 4).
    importedLabels = sourceLabels.map((label) => ({
      ...label,
      position: vec2(label.position.x - 112, label.position.y + 64),
    }))
  }, 20_000)

  test.each([
    { coordinates: '10 0 24 10 3 4' },
    { coordinates: '24 0 10 10 17 4' },
    { coordinates: '10 10 24 0 3 14' },
    { coordinates: '24 10 10 0 17 14' },
  ])('.import $coordinates preserves label contents and pixel offsets', async ({ coordinates }) => {
    const existing = createLabel({ position: vec2(5, 5), text: 'Existing label' })
    const expectedLabels = [existing, ...importedLabels]

    await runSelectLabelCommandTest([existing], expectedLabels, vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived(`.import ${WORLD_ID} ${coordinates}`, getPwGameWorldHelper().botPlayerId)
      compareLabelData([...getPwGameWorldHelper().labels.values()], expectedLabels)
    })
  })

  test('Partial import respects a disabled label mask', async () => {
    const existing = createLabel({ position: vec2(5, 5), text: 'Existing label' })
    await runSelectLabelCommandTest([existing], [existing], vec2(0, 0), vec2(0, 0), async (botData) => {
      botData.maskLabelEnabled = false
      await commandReceived(`.import ${WORLD_ID} 10 0 24 10 3 4`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test('Partial import can be undone and redone without removing existing labels', async () => {
    const existing = createLabel({ position: vec2(5, 5), text: 'Existing label' })
    const expectedLabels = [existing, ...importedLabels]

    await runSelectLabelCommandTest([existing], expectedLabels, vec2(0, 0), vec2(0, 0), async () => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived(`.import ${WORLD_ID} 10 0 24 10 3 4`, playerId)
      compareLabelData([...getPwGameWorldHelper().labels.values()], expectedLabels)
      await commandReceived('.undo', playerId)
      compareLabelData([...getPwGameWorldHelper().labels.values()], [existing])
      await commandReceived('.redo', playerId)
      await workerWaitUntil(() => useLabelStore().totalLabelsLeftToReceive === 0)
      compareLabelData([...getPwGameWorldHelper().labels.values()], expectedLabels)
    })
  })
})
