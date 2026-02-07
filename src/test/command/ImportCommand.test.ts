import { describe, expect, test } from 'vitest'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { Block, LayerType } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { runSelectCommandTest } from '@/test/RuntimeTestsUtil.ts'
import { commandReceived } from '@/bot/copybot/service/PacketHandlerCopyBotService.ts'
import {
  createFailedToJoinWorldErrorString,
  createImportCommandDestinationAreaOutOfBoundsError,
  createImportCommandSourceAreaOutOfBoundsError,
} from '@/bot/copybot/service/CopyBotErrorService.ts'
import { GameError } from '@/core/class/GameError.ts'

describe.sequential('.import', () => {
  test('.import 8nqftm1t0j43121 2 5 4 3 2 5 (corner select)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = []
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(2, 3), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(2, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WATER) },
      { pos: vec2(3, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(4, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(
      inputBlocks,
      expectedOutputBlocks,
      vec2(0, 0),
      vec2(0, 0),
      async () => await commandReceived('.import 8nqftm1t0j43121 2 5 4 3 2 5', playerId),
    )
  })

  test('.import 8nqftm1t0j43121 4 5 1 2 4 5 (mask + skipair + import)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    const inputBlocks: WorldBlock[] = [
      { pos: vec2(1, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(2, 3), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GREEN_BG) },
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(2, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WASTE) },
      { pos: vec2(3, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(3, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(3, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
    ]
    const expectedOutputBlocks: WorldBlock[] = [
      { pos: vec2(1, 2), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(2, 3), layer: LayerType.Background, block: new Block(PwBlockName.BASIC_GRAY_BG) },
      { pos: vec2(2, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(2, 5), layer: LayerType.Overlay, block: new Block(PwBlockName.LIQUID_WASTE) },
      { pos: vec2(3, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(3, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
      { pos: vec2(4, 3), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 4), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GREEN) },
      { pos: vec2(4, 5), layer: LayerType.Foreground, block: new Block(PwBlockName.BASIC_GRAY) },
    ]
    await runSelectCommandTest(inputBlocks, expectedOutputBlocks, vec2(0, 0), vec2(0, 0), async () => {
      await commandReceived('.mask foreground background', playerId)
      await commandReceived('.skipair', playerId)
      await commandReceived('.import 8nqftm1t0j43121 4 5 1 2 4 5', playerId)
    })
  })

  test('.import a (non existing world id)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    await expect(async () => {
      await commandReceived('.import a', playerId)
    }).rejects.toThrowError(createFailedToJoinWorldErrorString('a'))
    await expect(async () => {
      await commandReceived('.import a', playerId)
    }).rejects.toThrowError(GameError)
  })

  test('.import (partial import too big area selected)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 25 24 0 0', playerId)
    }).rejects.toThrowError(createImportCommandSourceAreaOutOfBoundsError(playerId, 0, 0, 25, 24, 0, 0, 24, 24))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 24 25 0 0', playerId)
    }).rejects.toThrowError(createImportCommandSourceAreaOutOfBoundsError(playerId, 0, 0, 24, 25, 0, 0, 24, 24))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 -1 0 24 24 0 0', playerId)
    }).rejects.toThrowError(createImportCommandSourceAreaOutOfBoundsError(playerId, -1, 0, 24, 24, 0, 0, 24, 24))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 -1 24 24 0 0', playerId)
    }).rejects.toThrowError(createImportCommandSourceAreaOutOfBoundsError(playerId, 0, -1, 24, 24, 0, 0, 24, 24))
  })

  test('.import (partial import destination area too big)', async () => {
    const playerId = getPwGameWorldHelper().botPlayerId
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 24 24 -1 0', playerId)
    }).rejects.toThrowError(createImportCommandDestinationAreaOutOfBoundsError(playerId, -1, 0, 25, 25))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 24 24 0 -1', playerId)
    }).rejects.toThrowError(createImportCommandDestinationAreaOutOfBoundsError(playerId, 0, -1, 25, 25))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 24 24 176 175', playerId)
    }).rejects.toThrowError(createImportCommandDestinationAreaOutOfBoundsError(playerId, 176, 175, 25, 25))
    await expect(async () => {
      await commandReceived('.import 8nqftm1t0j43121 0 0 24 24 175 176', playerId)
    }).rejects.toThrowError(createImportCommandDestinationAreaOutOfBoundsError(playerId, 175, 176, 25, 25))
  })
})
