import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { ZoneMembership } from 'pw-js-world'
import { ProtoGen } from 'pw-js-api'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createZone } from '@/core/util/Zones.ts'
import { runSelectZoneCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.paste (zones)', { concurrent: false }, () => {
  test('Preserves irregular membership and zone settings', async () => {
    const zone = createZone({
      membershipRle: ZoneMembership.fromPositions([vec2(0, 1), vec2(1, 0), vec2(1, 1)]),
      priority: 7,
      hue: 215,
      vision: ProtoGen.ZoneVision.ON,
      visionCombine: ProtoGen.ZoneVision.OFF,
      visionOutside: ProtoGen.ZoneVision.ON,
      hasVisionColor: true,
      visionColor: 0x123456,
      cameraModeX: ProtoGen.ZoneCameraMode.LOCK,
      cameraModeY: ProtoGen.ZoneCameraMode.FOLLOW,
      cameraTarget: ProtoGen.ZoneCameraTarget.PART,
      cameraMovement: ProtoGen.ZoneCameraMovement.SMOOTH,
      lighting: ProtoGen.ZoneLighting.ON,
      lightColor: 0x654321,
      lightFeatherTop: 3,
      lightMarginLeft: 2,
      playerLight: ProtoGen.ZonePlayerLight.ON,
      playerLightRadius: 64,
      playerLightStrength: 75,
      playerLightColor: 0x456789,
      fog: ProtoGen.ZoneFog.ON,
      fogColor: 0xabcdef,
      fogOpacity: 40,
      fogDensity: 20,
      fogDirection: 180,
      fogSpeed: 30,
      distortion: ProtoGen.ZoneDistortion.ON,
      distortionStrength: 25,
      distortionScale: 20,
      distortionSpeed: 10,
    })
    const pasted = createZone({
      ...zone,
      membershipRle: ZoneMembership.fromPositions([vec2(2, 4), vec2(3, 3), vec2(3, 4)]),
    })
    await runSelectZoneCommandTest([zone], [zone, pasted], vec2(0, 0), vec2(1, 1), async (botData) => {
      await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
    })
  })

  test.each([
    { repeat: '3 1', positions: [vec2(3, 2), vec2(5, 2)] },
    { repeat: '1 3', positions: [vec2(1, 4), vec2(1, 6)] },
    { repeat: '2 2', positions: [vec2(1, 4), vec2(3, 2), vec2(3, 4)] },
    { repeat: '-3 1', positions: [vec2(4, 6), vec2(2, 6)] },
    { repeat: '1 -3', positions: [vec2(6, 4), vec2(6, 2)] },
    { repeat: '-2 -2', positions: [vec2(6, 4), vec2(4, 6), vec2(4, 4)] },
    { repeat: '2 2 1 3', positions: [vec2(1, 7), vec2(4, 2), vec2(4, 7)] },
    { repeat: '-2 -2 1 3', positions: [vec2(6, 1), vec2(3, 6), vec2(3, 1)] },
  ])('.paste $repeat repeats zones without duplicating the source', async ({ repeat, positions }) => {
    const from = repeat.includes('-') ? vec2(6, 6) : vec2(1, 2)
    const zone = createZone({ membershipRle: ZoneMembership.fromPositions([from]), playerLightRadius: 16 })
    const copies = positions.map((position) =>
      createZone({ ...zone, membershipRle: ZoneMembership.fromPositions([position]) }),
    )
    await runSelectZoneCommandTest([zone], [zone, ...copies], from, vec2.add(from, vec2(1, 1)), async () => {
      await commandReceived(`.paste ${repeat}`, getPwGameWorldHelper().botPlayerId)
    })
  })

  test.each([
    { from: vec2(2, 3), to: vec2(3, 4), destination: vec2(6, 7) },
    { from: vec2(3, 3), to: vec2(2, 4), destination: vec2(7, 7) },
    { from: vec2(2, 4), to: vec2(3, 3), destination: vec2(6, 8) },
    { from: vec2(3, 4), to: vec2(2, 3), destination: vec2(7, 8) },
  ])('Supports selection corners $from to $to', async ({ from, to, destination }) => {
    const zone = createZone({
      membershipRle: ZoneMembership.fromPositions([vec2(2, 3), vec2(3, 4)]),
      playerLightRadius: 16,
    })
    const pasted = createZone({
      ...zone,
      membershipRle: ZoneMembership.fromPositions([vec2(6, 7), vec2(7, 8)]),
    })
    await runSelectZoneCommandTest([zone], [zone, pasted], from, to, async (botData) => {
      await pasteBlocksLabelsAndZones(botData, destination)
    })
  })

  test.each([
    { destination: vec2(199, 199), positions: [vec2(199, 199)] },
    { destination: vec2(-1, -1), positions: [vec2(0, 0)] },
  ])('Clips zone membership at $destination to the world boundaries', async ({ destination, positions }) => {
    const zone = createZone({
      membershipRle: ZoneMembership.fromPositions([vec2(1, 1), vec2(2, 2)]),
      playerLightRadius: 16,
    })
    const pasted = createZone({ ...zone, membershipRle: ZoneMembership.fromPositions(positions) })
    await runSelectZoneCommandTest([zone], [zone, pasted], vec2(1, 1), vec2(2, 2), async (botData) => {
      await pasteBlocksLabelsAndZones(botData, destination)
    })
  })
})
