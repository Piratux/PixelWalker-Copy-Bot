import { describe, expect, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived, pasteBlocks } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import { createUnrecognisedMaskModeError } from '@/copybot/service/CopyBotErrorService.ts'

describe.sequential('.mask', () => {
  test('.mask default', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(0, 1), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(2, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(2, 0), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(0, 1))
    })
  })

  test('.mask background', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(0, 1), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(2, 0), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(0, 1))
    })
  })

  test('.mask foreground', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(2, 0), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(0, 1))
    })
  })

  test('.mask overlay', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(2, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(2, 0), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(0, 1))
    })
  })

  test('.mask background foreground', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(0, 1), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(2, 0), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(0, 1))
    })
  })

  test('.mask default nonair', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
      { pos: vec2(2, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
      { pos: vec2(3, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
      { pos: vec2(2, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
      { pos: vec2(2, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_BLUE) },
      { pos: vec2(3, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 1), async (botData) => {
      await commandReceived(ctx.task.name, playerId)
      await pasteBlocks(botData, vec2(2, 1))
    })
  })

  test('Unknown modes throw error', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    await expect(() => commandReceived(`.mask default nnair`, playerId)).rejects.toThrowError(
      createUnrecognisedMaskModeError('nnair', playerId),
    )
  })
})
