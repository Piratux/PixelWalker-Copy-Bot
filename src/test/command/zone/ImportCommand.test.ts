import { beforeAll, describe, expect, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { Zone, ZoneMembership } from 'pw-js-world'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwApiClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { getAnotherWorldData } from '@/core/service/WorldService.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest, verifyExpectedZones } from '@/test/RuntimeTestsUtil.ts'

const WORLD_ID = '8nqftm1t0j43121'

describe('.import (zones)', { concurrent: false }, () => {
  let sourceZones: Zone[] = []
  let importedZones: Zone[] = []

  beforeAll(async () => {
    const { zones } = await getAnotherWorldData(WORLD_ID, getPwApiClient())
    sourceZones = [...zones.values()].filter((zone) => {
      const positions = zone.membershipRle.toPositions()
      return positions.length > 0 && positions.every(({ x, y }) => x >= 0 && x <= 11 && y >= 14 && y <= 24)
    })
    expect(sourceZones.length, 'The source world must contain zones in tiles 0 14 through 11 24').toBeGreaterThan(0)
    // Every corner selection places the source area's top-left tile (0, 14) at (3, 4).
    importedZones = sourceZones.map((zone) =>
      createZone({
        ...zone,
        membershipRle: ZoneMembership.fromPositions(
          zone.membershipRle.toPositions().map(({ x, y }) => vec2(x + 3, y - 10)),
        ),
      }),
    )
  }, 20_000)

  test.each([
    { coordinates: '0 14 11 24 3 4' },
    { coordinates: '11 14 0 24 14 4' },
    { coordinates: '0 24 11 14 3 14' },
    { coordinates: '11 24 0 14 14 14' },
  ])('.import $coordinates preserves zone membership and settings', async ({ coordinates }) => {
    const existing = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    await runSelectZoneCommandTest([existing], [existing, ...importedZones], vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived(`.import ${WORLD_ID} ${coordinates}`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test('Partial import respects a disabled zone mask', async () => {
    const existing = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    await runSelectZoneCommandTest([existing], [existing], vec2(0, 0), vec2(0, 0), async (botData) => {
      botData.maskZoneEnabled = false
      await commandReceived(`.import ${WORLD_ID} 0 14 11 24 3 4`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test('Partial import excludes zones that are only partly selected', async () => {
    const zone = sourceZones.find((candidate) => candidate.membershipRle.toPositions().length > 1)
    if (zone === undefined) {
      throw new Error('The source world must contain a multi-tile zone to test partial selection.')
    }
    const position = zone.membershipRle.toPositions()[0]
    const expectedZones = sourceZones
      .filter((candidate) =>
        candidate.membershipRle.toPositions().every(({ x, y }) => x === position.x && y === position.y),
      )
      .map((candidate) => createZone({ ...candidate, membershipRle: ZoneMembership.fromPositions([vec2(3, 4)]) }))

    await runSelectZoneCommandTest([], expectedZones, vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived(
        `.import ${WORLD_ID} ${position.x} ${position.y} ${position.x} ${position.y} 3 4`,
        getPwGameWorldHelper().botPlayerId,
      )
    })
  })

  test('Partial import can be undone and redone without removing existing zones', async () => {
    const existing = createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 0)]), playerLightRadius: 16 })
    const expectedZones = [existing, ...importedZones]
    await runSelectZoneCommandTest([existing], expectedZones, vec2(0, 0), vec2(0, 0), async () => {
      const playerId = getPwGameWorldHelper().botPlayerId
      await commandReceived(`.import ${WORLD_ID} 0 14 11 24 3 4`, playerId)
      await verifyExpectedZones(expectedZones)
      await commandReceived('.undo', playerId)
      await verifyExpectedZones([existing])
      await commandReceived('.redo', playerId)
    })
  })
})
