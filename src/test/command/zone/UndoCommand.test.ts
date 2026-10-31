import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest, verifyExpectedZones } from '@/test/RuntimeTestsUtil.ts'

describe('.undo (zones)', { concurrent: false }, () => {
  test.each([1, 2, 10])('.undo %i removes pasted zones', async (count) => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const firstPaste = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    const secondPaste = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(4, 5)]) })
    const expected = count === 1 ? [zone, firstPaste] : [zone]
    await runSelectZoneCommandTest([zone], expected, vec2(0, 0), vec2(0, 0), async (botData) => {
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await verifyExpectedZones([zone, firstPaste, secondPaste])
      await commandReceived(`.undo ${count}`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test.each([1, 2, 10])('.undo %i restores moved zones', async (count) => {
    const zone = createZone({
      membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]),
      hue: 215,
      playerLightRadius: 16,
    })
    const firstMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    const secondMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(4, 5)]) })
    await runSelectZoneCommandTest(
      [zone],
      count === 1 ? [firstMove] : [zone],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        const playerId = getPwGameWorldHelper().botPlayerId
        await commandReceived('.move', playerId)
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
        await verifyExpectedZones([firstMove])
        await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
        await verifyExpectedZones([secondMove])
        await commandReceived(`.undo ${count}`, playerId)
      },
    )
  })

  test.each([1, 2])('Moving after undo %i uses the restored zone history', async (count) => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const firstMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    const secondMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(4, 5)]) })
    const finalMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(6, 7)]) })
    await runSelectZoneCommandTest([zone], [finalMove], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await verifyExpectedZones([firstMove])
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await verifyExpectedZones([secondMove])
      await commandReceived(`.undo ${count}`, playerId)
      await verifyExpectedZones(count === 1 ? [firstMove] : [zone])
      await pasteBlocksLabelsAndZones(botData, vec2(6, 7))
      await verifyExpectedZones([finalMove])
      await commandReceived('.redo', playerId)
    })
  })

  test('Undoing multiple moves of identical zones preserves their count', async () => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const firstMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(2, 3)]) })
    const secondMove = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([vec2(4, 5)]) })
    await runSelectZoneCommandTest([zone, zone], [zone, zone], vec2(0, 0), vec2(0, 0), async (botData) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived('.move', playerId)
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      await verifyExpectedZones([firstMove, firstMove])
      await pasteBlocksLabelsAndZones(botData, vec2(4, 5))
      await verifyExpectedZones([secondMove, secondMove])
      await commandReceived('.undo 2', playerId)
    })
  })

  test('Undo with no history leaves zones unchanged', async () => {
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    await runSelectZoneCommandTest([zone], [zone], vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived('.undo', getPwGameWorldHelper().botPlayerId)
    })
  })
})
