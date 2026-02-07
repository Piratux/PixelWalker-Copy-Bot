import { describe, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived, pasteBlocks } from '@/bot/copybot/service/PacketHandlerCopyBotService.ts'

describe.sequential('.redo', () => {
  test('.redo', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(0, 0), async (botData) => {
      await pasteBlocks(botData, vec2(2, 3))
      await commandReceived('.undo', playerId)
      await commandReceived(ctx.task.name, playerId)
    })
  })

  test('.redo 2', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(0, 0), async (botData) => {
      await pasteBlocks(botData, vec2(2, 3))
      await pasteBlocks(botData, vec2(2, 4))
      await pasteBlocks(botData, vec2(2, 5))
      await commandReceived('.undo 2', playerId)
      await commandReceived(ctx.task.name, playerId)
    })
  })
})
