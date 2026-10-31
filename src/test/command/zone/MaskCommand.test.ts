import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.mask (zones)', { concurrent: false }, () => {
  test.each([
    { mode: 'zone', enabled: true },
    { mode: 'default', enabled: true },
    { mode: 'foreground zone', enabled: true },
    { mode: 'background', enabled: false },
    { mode: 'foreground', enabled: false },
    { mode: 'overlay', enabled: false },
    { mode: 'label', enabled: false },
  ])('.mask $mode', async ({ mode, enabled }) => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const pasted = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    await runSelectZoneCommandTest(
      [zone],
      enabled ? [zone, pasted] : [zone],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        await commandReceived(`.mask ${mode}`, getPwGameWorldHelper().botPlayerId)
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      },
    )
  })

  test('A disabled zone mask does not remove zones in move mode', async () => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    await runSelectZoneCommandTest([zone], [zone], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await commandReceived('.mask label', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })
})
