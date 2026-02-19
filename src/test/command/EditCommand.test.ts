import { describe, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'

describe.sequential('.edit', () => {
  test('.edit add 5', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [10]) },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.SWITCH_LOCAL_ACTIVATOR, { enabled: false, switch_id: 1 }),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [15]) },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.SWITCH_LOCAL_ACTIVATOR, { enabled: false, switch_id: 6 }),
      },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.edit sub 5', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [10]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [5]) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.edit mul 5', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [10]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [50]) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.edit div 5', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [10]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.edit name green red', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_RED) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
  test('.edit id 2 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(1) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(2) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(1) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(3) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(1, 0), () =>
      commandReceived(ctx.task.name, playerId),
    )
  })
})
