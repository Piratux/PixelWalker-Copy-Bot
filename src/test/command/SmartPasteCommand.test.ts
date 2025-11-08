import { describe, expect, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import { GameError } from '@/core/class/GameError.ts'
import { createPortalIdTooLongErrorString } from '@/copybot/service/CopyBotErrorService.ts'

describe.sequential('.smartpaste', () => {
  test('.smartpaste 3 1', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste 2 2', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [4]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste 2 2 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [4]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste -3 1', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(2, 0),
      vec2(2, 0),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste 1 -3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 2),
      vec2(0, 2),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste -2 -2', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [4]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(1, 1),
      vec2(1, 1),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste -2 -2 1 3', async (ctx) => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [1]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(0, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [4]) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(2, 4),
      vec2(2, 4),
      async () => await commandReceived(ctx.task.name, playerId),
    )
  })

  test('.smartpaste 2 2 (portals)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1', '10']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '20']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3', '30']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1', '10']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '20']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3', '30']),
      },
      {
        pos: vec2(1, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['4', '40']),
      },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 3 2 (block mix)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(1, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1', '0']) },
      { pos: vec2(2, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '0']) },
      { pos: vec2(5, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '0']) },
      { pos: vec2(5, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(0, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(1, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(2, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1', '0']) },
      { pos: vec2(2, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1', '0']) },
      { pos: vec2(3, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(3, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(4, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(5, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '0']) },
      { pos: vec2(5, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2', '0']) },
      { pos: vec2(6, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(6, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(7, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [2]) },
      { pos: vec2(7, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [3]) },
      { pos: vec2(8, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3', '0']) },
      { pos: vec2(8, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3', '0']) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(2, 1),
      async () => await commandReceived('.smartpaste 3 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters 1a)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1a', '1a']) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3a', '3a']) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2a', '2a']) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1a', '1a']) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3a', '3a']) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2a', '2a']) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['4a', '4a']) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters a1)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a1', 'a1']) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a3', 'a3']) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a2', 'a2']) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a1', 'a1']) },
      { pos: vec2(0, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a3', 'a3']) },
      { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a2', 'a2']) },
      { pos: vec2(1, 1), layer: LayerType.Foreground, block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a4', 'a4']) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters a1a)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a1a', 'a1a']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a3a', 'a3a']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a2a', 'a2a']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a1a', 'a1a']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a3a', 'a3a']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a2a', 'a2a']),
      },
      {
        pos: vec2(1, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a4a', 'a4a']),
      },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters 1a1)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1a1', '1a1']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3a3', '3a3']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2a2', '2a2']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['1a1', '1a1']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3a3', '3a3']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['2a2', '2a2']),
      },
      {
        pos: vec2(1, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['4a4', '4a4']),
      },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters 3ab1c)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3ab1c', '3ab1c']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['5ab3c', '5ab3c']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['7ab2c', '7ab2c']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['3ab1c', '3ab1c']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['5ab3c', '5ab3c']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['7ab2c', '7ab2c']),
      },
      {
        pos: vec2(1, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['9ab4c', '9ab4c']),
      },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters a15b3)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a15b3', 'a15b3']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a45b4', 'a45b4']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a30b5', 'a30b5']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a15b3', 'a15b3']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a45b4', 'a45b4']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a30b5', 'a30b5']),
      },
      {
        pos: vec2(1, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['a60b6', 'a60b6']),
      },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.smartpaste 2 2', playerId),
    )
  })

  test('.smartpaste 2 2 (portals with letters aaaa7, aaaa8, aaaa9 -> aaaa10 throws, due to 5 char portal id limit)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      {
        pos: vec2(0, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['aaaa7', 'aaaa7']),
      },
      {
        pos: vec2(0, 1),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['aaaa9', 'aaaa9']),
      },
      {
        pos: vec2(1, 0),
        layer: LayerType.Foreground,
        block: new Block(PwBlockName.PORTAL_VISIBLE_LEFT, ['aaaa8', 'aaaa8']),
      },
    ]
    const expectedOutputBlocks: WorldBlock[] = []
    await expect(async () => {
      await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(0, 0), async () => {
        await commandReceived('.smartpaste 2 2', playerId)
      })
    }).rejects.toThrowError(new GameError(createPortalIdTooLongErrorString('aaaa10'), playerId))
  })
})
