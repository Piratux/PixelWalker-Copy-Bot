import { describe, test } from 'vitest'
import { vec2 } from '@basementuniverse/vec'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { createLabel } from '@/core/util/Labels.ts'
import { runSelectLabelCommandTest } from '@/test/RuntimeTestsUtil.ts'

describe('.smartpaste (labels)', { concurrent: false }, () => {
  test.each([
    { repeat: '2 2', positions: [vec2(3, 39), vec2(35, 7), vec2(35, 39)] },
    { repeat: '2 2 1 3', positions: [vec2(3, 87), vec2(51, 7), vec2(51, 87)] },
    { repeat: '-2 -2', positions: [vec2(99, 71), vec2(67, 103), vec2(67, 71)] },
  ])('.smartpaste $repeat repeats label text and colour unchanged', async ({ repeat, positions }) => {
    const label = createLabel({
      position: repeat.includes('-') ? vec2(99, 103) : vec2(3, 7),
      text: 'Portal 1a',
      color: 0xff123456,
    })
    const from = repeat.includes('-') ? vec2(6, 6) : vec2(0, 0)
    await runSelectLabelCommandTest(
      [label],
      [label, ...positions.map((position) => ({ ...label, position }))],
      from,
      vec2.add(from, vec2(1, 1)),
      async () => {
        await commandReceived(`.smartpaste ${repeat}`, getPwGameWorldHelper().botPlayerId)
      },
    )
  })
})
