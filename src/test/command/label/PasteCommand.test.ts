import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { LayerType, TextAlignment } from 'pw-js-world'
import { commandReceived, pasteBlocksLabelsAndZones } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.paste (labels)', { concurrent: false }, () => {
  test('Preserves pixel offsets and label formatting', async () => {
    const label = createLabel({
      position: vec2(3, 7),
      text: 'Styled\nlabel',
      color: 0xff123456,
      maxWidth: -1,
      shadow: false,
      textAlignment: TextAlignment.LEFT,
      fontSize: 16,
      characterSpacing: 2,
      lineSpacing: 5,
      renderLayer: LayerType.Overlay,
      shadowColor: 0xff654321,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      outline: true,
      outlineColor: 0xffabcdef,
      outlineWidth: 2,
    })
    await runSelectLabelCommandTest(
      [label],
      [label, { ...label, position: vec2(35, 55) }],
      vec2(0, 0),
      vec2(1, 1),
      async (botData) => {
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      },
    )
  })

  test.each([
    { repeat: '3 1', positions: [vec2(33, 34), vec2(65, 34)] },
    { repeat: '1 3', positions: [vec2(1, 66), vec2(1, 98)] },
    { repeat: '2 2', positions: [vec2(1, 66), vec2(33, 34), vec2(33, 66)] },
    { repeat: '-3 1', positions: [vec2(65, 98), vec2(33, 98)] },
    { repeat: '1 -3', positions: [vec2(97, 66), vec2(97, 34)] },
    { repeat: '-2 -2', positions: [vec2(97, 66), vec2(65, 98), vec2(65, 66)] },
    { repeat: '2 2 1 3', positions: [vec2(1, 114), vec2(49, 34), vec2(49, 114)] },
    { repeat: '-2 -2 1 3', positions: [vec2(97, 18), vec2(49, 98), vec2(49, 18)] },
  ])('.paste $repeat repeats labels without duplicating the source', async ({ repeat, positions }) => {
    const negative = repeat.includes('-')
    const label = createLabel({ position: negative ? vec2(97, 98) : vec2(1, 34), text: 'Repeat' })
    const from = negative ? vec2(6, 6) : vec2(0, 2)
    const to = vec2.add(from, vec2(1, 1))
    await runSelectLabelCommandTest(
      [label],
      [label, ...positions.map((position) => ({ ...label, position }))],
      from,
      to,
      async () => {
        await commandReceived(`.paste ${repeat}`, getPwGameWorldHelper().botPlayerId)
      },
    )
  })

  test.each([
    { from: vec2(2, 3), to: vec2(3, 4), destination: vec2(6, 7), expected: vec2(101, 119) },
    { from: vec2(3, 3), to: vec2(2, 4), destination: vec2(7, 7), expected: vec2(101, 119) },
    { from: vec2(2, 4), to: vec2(3, 3), destination: vec2(6, 8), expected: vec2(101, 119) },
    { from: vec2(3, 4), to: vec2(2, 3), destination: vec2(7, 8), expected: vec2(101, 119) },
  ])('Supports selection corners $from to $to', async ({ from, to, destination, expected }) => {
    const label = createLabel({ position: vec2(37, 55), text: 'Corner' })
    await runSelectLabelCommandTest([label], [label, { ...label, position: expected }], from, to, async (botData) => {
      await pasteBlocksLabelsAndZones(botData, destination)
    })
  })

  test('Pasting over an existing label keeps both labels', async () => {
    const source = createLabel({ position: vec2(3, 7), text: 'Source' })
    const destination = createLabel({ position: vec2(35, 55), text: 'Destination' })
    await runSelectLabelCommandTest(
      [source, destination],
      [source, destination, { ...source, position: destination.position }],
      vec2(0, 0),
      vec2(0, 0),
      async (botData) => {
        await pasteBlocksLabelsAndZones(botData, vec2(2, 3))
      },
    )
  })

  test('Clips label anchors outside the world', async () => {
    const inside = createLabel({ position: vec2(31, 31), text: 'Inside' })
    const outside = createLabel({ position: vec2(32, 32), text: 'Outside' })
    await runSelectLabelCommandTest(
      [inside, outside],
      [inside, outside, { ...inside, position: vec2(3199, 3199) }],
      vec2(1, 1),
      vec2(2, 2),
      async (botData) => {
        await pasteBlocksLabelsAndZones(botData, vec2(199, 199))
      },
    )
  })

  test('Skips labels with negative destination anchors', async () => {
    const outside = createLabel({ position: vec2(16, 16), text: 'Outside' })
    const inside = createLabel({ position: vec2(32, 32), text: 'Inside' })
    await runSelectLabelCommandTest(
      [outside, inside],
      [outside, inside, { ...inside, position: vec2(0, 0) }],
      vec2(1, 1),
      vec2(2, 2),
      async (botData) => {
        await pasteBlocksLabelsAndZones(botData, vec2(-1, -1))
      },
    )
  })
})
