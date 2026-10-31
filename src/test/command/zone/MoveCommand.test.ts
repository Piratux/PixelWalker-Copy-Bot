import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest, verifyExpectedZones } from '@/test/RuntimeTestsUtil.ts'

describe('.move (zones)', { concurrent: false }, () => {
  test.each([1, 2])('.move (%i placements) moves only selected zones', async (count) => {
    const zone = createZone({
      playerLightRadius: 16,
      membershipRle: ZoneMembership.fromPositions([vec2(0, 1), vec2(1, 0), vec2(1, 1)]),
    })
    const untouched = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(8, 8)]), playerLightRadius: 16 })
    const moved = createZone({
      ...zone,
      membershipRle: ZoneMembership.fromPositions([
        vec2(count, count + 1),
        vec2(count + 1, count),
        vec2(count + 1, count + 1),
      ]),
    })
    await runSelectZoneCommandTest([zone, untouched], [moved, untouched], vec2(0, 0), vec2(1, 1), async (botData) => {
      await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
      for (let i = 1; i <= count; i++) {
        await pasteBlocksLabelsAndZones(botData, vec2(i, i))
        await verifyExpectedZones([
          createZone({
            ...zone,
            membershipRle: ZoneMembership.fromPositions([vec2(i, i + 1), vec2(i + 1, i), vec2(i + 1, i + 1)]),
          }),
          untouched,
        ])
      }
    })
  })

  test('Moving onto the source does not duplicate zones', async () => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    await runSelectZoneCommandTest([zone], [zone], vec2(0, 0), vec2(0, 0), async (botData) => {
      await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
      await pasteBlocksLabelsAndZones(botData, vec2(0, 0))
    })
  })

  test('Moving identical zones preserves their count', async () => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const moved = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    await runSelectZoneCommandTest([zone, zone], [moved, moved], vec2(0, 0), vec2(0, 0), async (botData) => {
      await commandReceived('.move', getPwGameWorldHelper().botPlayerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })
})
