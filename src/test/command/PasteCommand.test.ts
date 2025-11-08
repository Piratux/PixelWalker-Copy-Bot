import { describe, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived } from '@/copybot/service/PacketHandlerCopyBotService.ts'

describe.sequential('.paste', () => {
  test('.paste 3 1', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste 2 2', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste 2 2 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste -3 1', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(2, 0),
      vec2(2, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste 1 -3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 2),
      vec2(0, 2),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste -2 -2', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(1, 1),
      vec2(1, 1),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste -2 -2 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(2, 4),
      vec2(2, 4),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.paste 3 2 (block mix)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 3), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(2, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 3), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(1, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 7), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(2, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(2, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(3, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(3, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(4, 3), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(4, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(4, 7), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(5, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(5, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(6, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(6, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(7, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(7, 3), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(7, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(7, 7), layer: LayerType.Background, block: new Block(PwBlockName.MONSTER_SCALES_RED_LIGHT_BG) },
      { pos: vec2(8, 1), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(8, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(2, 3),
      async () => await commandReceived('.paste 3 2', playerId),
    )
  })
})
