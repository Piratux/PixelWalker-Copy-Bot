import { afterAll, beforeAll, describe, test } from 'vitest'
import { getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { createPinia, setActivePinia } from 'pinia'
import { initPwClasses } from '@/core/service/PwClientService.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { commandReceived, pasteBlocks } from '@/copybot/service/PacketHandlerCopyBotService.ts'

describe.sequential('Tests', () => {
  beforeAll(async () => {
    console.log(import.meta.env.VITE_DEFAULT_WORLD_ID)
    console.log('Initializing Pinia and Pw Classes for test...')

    setActivePinia(createPinia())

    await initPwClasses(
      import.meta.env.VITE_TEST_RUN_PW_WORLD_ID!,
      import.meta.env.VITE_TEST_RUN_PW_ACCOUNT_EMAIL!,
      import.meta.env.VITE_TEST_RUN_PW_ACCOUNT_PASSWORD!,
      '',
      BotType.COPY_BOT,
    )

    if (getPwGameWorldHelper().width < 200 || getPwGameWorldHelper().height < 200) {
      throw new Error('To perform tests, world must be at least 200x200 size.')
    }
  })

  afterAll(() => {
    console.log('Disconnecting PwGameClient and resetting stores after test...')
    getPwGameClient().disconnect(false)

    // NOTE: Could not get this to work, because .$reset() call in "pinia._s.forEach((store) => store.$reset())" errors out for some reason
    // resetAllStores()
  })

  describe.sequential('.edit', () => {
    test('.edit add 5', async (ctx) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      const inputBlocks: WorldBlock[] = [
        { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
        { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [10]) },
      ]
      const expectedOutputBlocks: WorldBlock[] = [
        { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
        { pos: vec2(1, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.SWITCH_LOCAL_DOOR, [15]) },
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
  })

  describe.sequential('.undo', () => {
    test('.undo', async (ctx) => {
      const playerId = getPwGameWorldHelper().botPlayerId
      const inputBlocks: WorldBlock[] = [
        { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      ]
      const expectedOutputBlocks: WorldBlock[] = [
        { pos: vec2(0, 0), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      ]
      await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(0, 0), async (botData) => {
        await pasteBlocks(botData, vec2(2, 3))
        await commandReceived(ctx.task.name, playerId)
      })
    })

    test('.undo 2', async (ctx) => {
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
        await pasteBlocks(botData, vec2(2, 4))
        await pasteBlocks(botData, vec2(2, 5))
        await commandReceived(ctx.task.name, playerId)
      })
    })
  })

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
})
