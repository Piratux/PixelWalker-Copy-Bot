import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.smartpaste (zones)', { concurrent: false }, () => {
  test.each([
    { repeat: '2 2', positions: [vec2(0, 2), vec2(2, 0), vec2(2, 2)] },
    { repeat: '2 2 1 3', positions: [vec2(0, 5), vec2(3, 0), vec2(3, 5)] },
    { repeat: '-2 -2', positions: [vec2(6, 4), vec2(4, 6), vec2(4, 4)] },
  ])('.smartpaste $repeat repeats zone settings unchanged', async ({ repeat, positions }) => {
    const from = repeat.includes('-') ? vec2(6, 6) : vec2(0, 0)
    const zone = createZone({
      membershipRle: ZoneMembership.fromPositions([from]),
      priority: 7,
      hue: 215,
      playerLightRadius: 16,
    })
    const copies = positions.map((position) =>
      createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([position]) }),
    )
    await runSelectZoneCommandTest([zone], [zone, ...copies], from, vec2.add(from, vec2(1, 1)), async () => {
      await commandReceived(`.smartpaste ${repeat}`, getPwGameWorldHelper().botPlayerId)
    })
  })
})
