import { afterAll, beforeAll, describe, test } from 'vitest'
import { getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { flipCommandReceived } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import { createPinia, setActivePinia } from 'pinia'
import { initPwClasses } from '@/core/service/PwClientService.ts'
import { BotType } from '@/core/enum/BotType.ts'

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
  describe.sequential('.flip', () => {
    test('.flip h', async () => {
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
        flipCommandReceived(['h'], playerId),
      )
    })
    test('.flip v', async () => {
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
        flipCommandReceived(['v'], playerId),
      )
    })
  })
})
