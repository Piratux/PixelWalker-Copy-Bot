import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.mask (labels)', { concurrent: false }, () => {
  test.each([
    { mode: 'label', enabled: true },
    { mode: 'default', enabled: true },
    { mode: 'foreground label', enabled: true },
    { mode: 'background', enabled: false },
    { mode: 'foreground', enabled: false },
    { mode: 'overlay', enabled: false },
    { mode: 'zone', enabled: false },
  ])('.mask $mode', async ({ mode, enabled }) => {
    const label = createLabel({ position: vec2(3, 7), text: 'Masked' })
    const expectedLabels = enabled ? [label, { ...label, position: vec2(35, 55) }] : [label]
    await runSelectLabelCommandTest([label], expectedLabels, vec2(0, 0), vec2(0, 0), async (botData) => {
      await commandReceived(`.mask ${mode}`, getPwGameWorldHelper().botPlayerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })

  test('A disabled label mask does not remove labels in move mode', async () => {
    const label = createLabel({ position: vec2(3, 7), text: 'Not moved' })
    await runSelectLabelCommandTest([label], [label], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await commandReceived('.mask foreground', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })
})
