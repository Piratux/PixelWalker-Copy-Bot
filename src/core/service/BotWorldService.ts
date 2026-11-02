import { vec2 } from '@basementuniverse/vec'
import { Block, DeserialisedStructure, LayerType } from 'pw-js-world'
import { GameError } from '@/core/class/GameError.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { getPwGameClient, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { placeMultipleBlocks, placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'

// Maps retain their original coordinates; padding only fills the area outside their bounds.
export async function placeBotWorld(blocks: DeserialisedStructure, botName: string): Promise<void> {
  const helper = getPwGameWorldHelper()
  if (blocks.width > helper.width || blocks.height > helper.height) {
    throw new GameError(`Bot map (${blocks.width}x${blocks.height}) is larger than the world.`)
  }
  const fillBlock = new Block(PwBlockName.GENERIC_BLACK_TRANSPARENT)
  const outsideBlocks: WorldBlock[] = []
  for (let x = 0; x < helper.width; x++) {
    for (let y = x < blocks.width ? blocks.height : 0; y < helper.height; y++) {
      outsideBlocks.push({ pos: vec2(x, y), layer: LayerType.Foreground, block: fillBlock })
    }
  }
  if (!(await placeMultipleBlocks(outsideBlocks))) {
    throw new GameError('Failed to fill the area outside the bot map.')
  }
  if (!(await placeWorldDataBlocks(blocks))) {
    throw new GameError('Failed to place the bot map.')
  }
  const meta = helper.meta
  if (meta === null) {
    throw new GameError('Cannot rename the world because its metadata is unavailable.')
  }
  const title = `${botName} [ON]`
  getPwGameClient().send('worldMetaUpdatePacket', {
    meta: { ...meta, title },
  })
  await workerWaitUntil(() => helper.meta?.title === title, {
    timeout: 5000,
    intervalBetweenAttempts: 100,
  })
}
