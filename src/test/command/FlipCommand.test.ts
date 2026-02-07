import { describe, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived } from '@/bot/copybot/service/PacketHandlerCopyBotService.ts'

describe.sequential('.flip', () => {
  test('.flip h', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 2), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.flip v', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 2), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
})
