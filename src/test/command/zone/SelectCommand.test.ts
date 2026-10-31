import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { createZone } from '@/core/util/Zones.ts'
import { compareZoneData, runSelectZoneCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('Selection (zones)', { concurrent: false }, () => {
  test.each([
    { from: vec2(1, 2), to: vec2(2, 3) },
    { from: vec2(2, 2), to: vec2(1, 3) },
    { from: vec2(1, 3), to: vec2(2, 2) },
    { from: vec2(2, 3), to: vec2(1, 2) },
  ])('Selects only fully contained zones from $from to $to', async ({ from, to }) => {
    const selected = createZone({
      playerLightRadius: 16,
      membershipRle: ZoneMembership.fromPositions([vec2(1, 2), vec2(2, 2), vec2(2, 3)]),
    })
    const inputZones = [
      selected,
      createZone({ membershipRle: ZoneMembership.fromPositions([vec2(0, 2), vec2(1, 2)]), playerLightRadius: 16 }),
      createZone({ membershipRle: ZoneMembership.fromPositions([vec2(1, 1), vec2(1, 2)]), playerLightRadius: 16 }),
      createZone({ membershipRle: ZoneMembership.fromPositions([vec2(2, 3), vec2(3, 3)]), playerLightRadius: 16 }),
      createZone({ membershipRle: ZoneMembership.fromPositions([vec2(2, 3), vec2(2, 4)]), playerLightRadius: 16 }),
    ]
    await runSelectZoneCommandTest(inputZones, inputZones, from, to, (botData) => {
      compareZoneData(botData.selectedZones, [selected])
    })
  })

  test('Empty zones and zones outside the selection are not selected', async () => {
    const inputZones = [
      createZone({ playerLightRadius: 16 }),
      createZone({ membershipRle: ZoneMembership.fromPositions([vec2(8, 8)]), playerLightRadius: 16 }),
    ]
    await runSelectZoneCommandTest(inputZones, inputZones, vec2(0, 0), vec2(1, 1), (botData) => {
      compareZoneData(botData.selectedZones, [])
    })
  })
})
