import { Block, BufferReader, createBlockPackets, DeserialisedStructure, Point, SendableBlockPacket, LayerType } from 'pw-js-world'
import {
  getPwBlocksByPwId,
  getPwBlocksByPwName,
  getPwGameClient,
  getPwGameWorldHelper,
  usePWClientStore,
} from '@/store/PWClientStore.ts'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { sleep } from '@/util/Sleep.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep } from 'lodash-es'

export function getBlockAt(pos: Point, layer: number): Block {
  try {
    return getPwGameWorldHelper().getBlockAt(pos.x, pos.y, layer)
  } catch {
    return new Block(0)
  }
}

export async function placeMultipleBlocks(worldBlocks: WorldBlock[]) {
  if (worldBlocks.length === 0) {
    return
  }

  const packets = createBlockPackets(worldBlocks)

  return await placePackets(packets, worldBlocks.length)
}

export async function placeWorldDataBlocks(worldData: DeserialisedStructure, pos: Point): Promise<boolean> {
  const packets: SendableBlockPacket[] = worldData.toPackets(pos.x, pos.y)

  return await placePackets(packets, worldData.width * worldData.height * TOTAL_PW_LAYERS)
}

export async function placeLayerDataBlocks(worldData: DeserialisedStructure, pos: Point, layer: LayerType): Promise<boolean> {
  const packets: SendableBlockPacket[] = worldData.toPackets(pos.x, pos.y).filter(packet => (packet.layer as LayerType) === layer)

  return await placePackets(packets, worldData.width * worldData.height * 1)
}

async function placePackets(packets: SendableBlockPacket[], blockCount: number): Promise<boolean> {
  // TODO: use packet count instead of block count
  usePWClientStore().totalBlocksLeftToReceiveFromWorldImport = blockCount
  let lastTotalBlocksLeftToReceiveFromWorldImportValue = usePWClientStore().totalBlocksLeftToReceiveFromWorldImport

  for (const packet of packets) {
    placeBlockPacket(packet)
  }

  const TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR = 5
  let total_attempts = 0
  while (total_attempts < TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR) {
    if (usePWClientStore().totalBlocksLeftToReceiveFromWorldImport === 0) {
      return true
    }

    if (
      usePWClientStore().totalBlocksLeftToReceiveFromWorldImport === lastTotalBlocksLeftToReceiveFromWorldImportValue
    ) {
      total_attempts++
    } else {
      total_attempts = 0
    }

    lastTotalBlocksLeftToReceiveFromWorldImportValue = usePWClientStore().totalBlocksLeftToReceiveFromWorldImport

    await sleep(1000)
  }
  return false
}

function updateBlockMap(blockPacket: SendableBlockPacket) {
  const { positions, layer, blockId, extraFields } = blockPacket

  const args = extraFields ? Block.deserializeArgs(BufferReader.from(extraFields)) : undefined

  for (let i = 0, len = positions.length; i < len; i++) {
    const { x, y } = positions[i]

    getPwGameWorldHelper().blocks[layer][x][y] = new Block(blockId, args)
  }
}

export function placeBlockPacket(blockPacket: SendableBlockPacket) {
  getPwGameClient().send('worldBlockPlacedPacket', blockPacket)

  // By updating block map immediately ourselves, we make a compromise here.
  // Positives:
  // - We see block placements as instant (simplifies code in many places)
  // Negatives:
  // - Not being able to see old and new block difference in worldBlockPlacedPacketReceived when blocks are placed by bot (but we don't process these anyway)
  // - If we send invalid blocks, we assume that they're valid (server should immediately close socket connection so shouldn't cause issues)
  updateBlockMap(blockPacket)
}

export function getBlockName(pwBlockId: number): PwBlockName {
  return getPwBlocksByPwId()[pwBlockId].PaletteId.toUpperCase() as PwBlockName
}

export function getBlockId(pwBlockName: PwBlockName): number {
  return getPwBlocksByPwName()[pwBlockName].Id
}

export function convertDeserializedStructureToWorldBlocks(
  blocks: DeserialisedStructure,
  pos: vec2 = vec2(0, 0),
): WorldBlock[] {
  const resultBlocks: WorldBlock[] = []
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    for (let y = 0; y < blocks.height; y++) {
      for (let x = 0; x < blocks.width; x++) {
        const worldBlock = {
          block: cloneDeep(blocks.blocks[layer][x][y]),
          layer: layer,
          pos: vec2(x + pos.x, y + pos.y),
        }
        resultBlocks.push(worldBlock)
      }
    }
  }
  return resultBlocks
}
