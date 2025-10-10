import {
  Block,
  BufferReader,
  createBlockPackets,
  DeserialisedStructure,
  LayerType,
  Point,
  PWGameWorldHelper,
  SendableBlockPacket,
} from 'pw-js-world'
import {
  getPwBlocksByPwId,
  getPwBlocksByPwName,
  getPwGameClient,
  getPwGameWorldHelper,
  usePwClientStore,
} from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { sleep } from '@/core/util/Sleep.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep } from 'lodash-es'
import { PWApiClient, PWGameClient } from 'pw-js-api'
import { authenticate, getAllWorldBlocks, joinWorld } from '@/core/service/PwClientService.ts'
import { handleException } from '@/core/util/Exception.ts'
import waitUntil from 'async-wait-until'
import { clamp } from '@/core/util/Numbers.ts'

export function getBlockAt(pos: Point, layer: number): Block {
  try {
    return getPwGameWorldHelper().getBlockAt(pos.x, pos.y, layer)
  } catch {
    return new Block(0)
  }
}

export async function placeMultipleBlocks(worldBlocks: WorldBlock[]): Promise<boolean> {
  if (worldBlocks.length === 0) {
    return true
  }

  const packets = createBlockPackets(worldBlocks)

  return await placePackets(packets, worldBlocks.length)
}

export async function placeWorldDataBlocks(
  worldData: DeserialisedStructure,
  pos: Point = vec2(0, 0),
): Promise<boolean> {
  const packets: SendableBlockPacket[] = worldData.toPackets(pos.x, pos.y)

  return await placePackets(packets, worldData.width * worldData.height * TOTAL_PW_LAYERS)
}

export async function placeWorldDataBlocksUsingPattern(
  worldData: DeserialisedStructure,
  pos: Point = vec2(0, 0),
  blocksPlacedPerPositionSpeed = 50,
): Promise<void> {
  blocksPlacedPerPositionSpeed = clamp(blocksPlacedPerPositionSpeed, 1, 50)

  const delayBetweenPlacementsMs = Math.ceil(1000 / blocksPlacedPerPositionSpeed)

  const worldDataWidth = worldData.width
  const worldDataHeight = worldData.height

  for (let x = 0; x < worldDataWidth; x++) {
    for (let y = 0; y < worldDataHeight; y++) {
      const blocksToPlace: WorldBlock[] = []
      for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
        const block = worldData.blocks[layer][x][y]
        blocksToPlace.push({
          block: block,
          layer: layer,
          pos: vec2(x + pos.x, y + pos.y),
        })
      }

      void placeMultipleBlocks(blocksToPlace)
      await sleep(delayBetweenPlacementsMs)
    }
  }
}

export async function placeLayerDataBlocks(
  worldData: DeserialisedStructure,
  pos: Point,
  layer: LayerType,
): Promise<boolean> {
  const packets: SendableBlockPacket[] = worldData
    .toPackets(pos.x, pos.y)
    .filter((packet) => (packet.layer as LayerType) === layer)

  return await placePackets(packets, worldData.width * worldData.height)
}

async function placePackets(packets: SendableBlockPacket[], blockCount: number): Promise<boolean> {
  // TODO: use packet count instead of block count
  usePwClientStore().totalBlocksLeftToReceiveFromWorldImport = blockCount
  let lastTotalBlocksLeftToReceiveFromWorldImportValue = usePwClientStore().totalBlocksLeftToReceiveFromWorldImport

  for (const packet of packets) {
    placeBlockPacket(packet)
  }

  const TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR = 5
  let totalAttempts = 0
  while (totalAttempts < TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR) {
    if (usePwClientStore().totalBlocksLeftToReceiveFromWorldImport === 0) {
      return true
    }

    if (
      usePwClientStore().totalBlocksLeftToReceiveFromWorldImport === lastTotalBlocksLeftToReceiveFromWorldImportValue
    ) {
      totalAttempts++
    } else {
      totalAttempts = 0
    }

    lastTotalBlocksLeftToReceiveFromWorldImportValue = usePwClientStore().totalBlocksLeftToReceiveFromWorldImport

    await sleep(1000)
  }
  return false
}

function updateBlockMap(blockPacket: SendableBlockPacket) {
  const { positions, layer, blockId, extraFields } = blockPacket

  const args = extraFields ? Block.deserializeArgs(BufferReader.from(extraFields)) : undefined

  for (let i = 0, len = positions.length; i < len; i++) {
    const { x, y } = positions[i]

    // TODO: maybe consider doing PR that filters position to be within map bounds in createBlockPackets
    if (x < 0 || x >= getPwGameWorldHelper().width || y < 0 || y >= getPwGameWorldHelper().height) {
      continue
    }

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

export function getBlockIdFromString(name: string): number | undefined {
  const block = getPwBlocksByPwName()[name as PwBlockName]
  if (!block) {
    return undefined
  }
  return block.Id
}

export function getBlockLayer(pwBlockId: number): LayerType {
  return getPwBlocksByPwId()[pwBlockId].Layer as LayerType
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

export function blockIsPortal(pwBlockName: PwBlockName | string): boolean {
  return [
    PwBlockName.PORTAL_VISIBLE_DOWN,
    PwBlockName.PORTAL_VISIBLE_LEFT,
    PwBlockName.PORTAL_VISIBLE_RIGHT,
    PwBlockName.PORTAL_VISIBLE_UP,
    PwBlockName.PORTAL_INVISIBLE_DOWN,
    PwBlockName.PORTAL_INVISIBLE_LEFT,
    PwBlockName.PORTAL_INVISIBLE_RIGHT,
    PwBlockName.PORTAL_INVISIBLE_UP,
  ].includes(pwBlockName as PwBlockName)
}

export function portalIdToNumber(portalId: string): number | undefined {
  const portalIdIsInteger = /^\d{1,5}$/.test(portalId)
  const portalIdHasNoLeadingZeros = portalId === parseInt(portalId).toString()
  return portalIdIsInteger && portalIdHasNoLeadingZeros ? parseInt(portalId) : undefined
}

export async function getAnotherWorldBlocks(worldId: string): Promise<DeserialisedStructure | null> {
  const pwApiClient = new PWApiClient(usePwClientStore().email, usePwClientStore().password)

  await authenticate(pwApiClient)

  const pwGameClient = new PWGameClient(pwApiClient)
  const pwGameWorldHelper = new PWGameWorldHelper()

  let copyFromAnotherWorldFinished = false
  let blocksResult: DeserialisedStructure | null = null

  pwGameClient.addHook(pwGameWorldHelper.receiveHook).addCallback('playerInitPacket', () => {
    try {
      pwGameClient.send('playerInitReceived')

      blocksResult = getAllWorldBlocks(pwGameWorldHelper)
    } catch (e) {
      handleException(e)
    } finally {
      pwGameClient.disconnect(false)
      copyFromAnotherWorldFinished = true
    }
  })

  await joinWorld(pwGameClient, worldId)

  await waitUntil(() => copyFromAnotherWorldFinished, { timeout: 10000, intervalBetweenAttempts: 1000 })
  return blocksResult
}

// Inclusive on both ends
export function getDeserialisedStructureSection(
  blocks: DeserialisedStructure,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): DeserialisedStructure {
  if (startX > endX) {
    throw new Error('Starting X is greater than ending X')
  }
  if (startY > endY) {
    throw new Error('Starting Y is greater than ending Y')
  }

  const blocksResult = new DeserialisedStructure([[], [], []], { width: endX - startX + 1, height: endY - startY + 1 })
  for (let l = 0; l < TOTAL_PW_LAYERS; l++) {
    for (let x = startX, width = Math.min(endX, blocks.blocks[l].length); x <= width; x++) {
      blocksResult.blocks[l][x - startX] = []
      for (let y = startY, height = Math.min(endY, blocks.blocks[l][x].length); y <= height; y++) {
        blocksResult.blocks[l][x - startX][y - startY] = blocks.blocks[l][x][y].clone()
      }
    }
  }
  return blocksResult
}

// Inclusive on both ends
export function getDeserialisedStructureSectionVec2(
  blocks: DeserialisedStructure,
  startPos: vec2,
  endPos: vec2,
): DeserialisedStructure {
  return getDeserialisedStructureSection(blocks, startPos.x, startPos.y, endPos.x, endPos.y)
}

export function applyPosOffsetForBlocks(offsetPos: Point, worldBlocks: WorldBlock[]) {
  return worldBlocks.map((worldBlock) => {
    const clonedBlock = cloneDeep(worldBlock)
    clonedBlock.pos = vec2.add(clonedBlock.pos, offsetPos)
    return clonedBlock
  })
}

// Merges blocks into bigger WorldBlock[], but gives priority to blocks_top
export function mergeWorldBlocks(blocksBottom: WorldBlock[], blocksTop: WorldBlock[]) {
  const emptyBlocksMap = new Map<string, WorldBlock>()
  for (const emptyBlock of blocksTop) {
    const key = `${emptyBlock.pos.x},${emptyBlock.pos.y},${emptyBlock.layer}`
    emptyBlocksMap.set(key, emptyBlock)
  }

  const filteredBlocksBottom = blocksBottom.filter((block) => {
    const key = `${block.pos.x},${block.pos.y},${block.layer}`
    return !emptyBlocksMap.has(key)
  })

  return filteredBlocksBottom.concat(blocksTop)
}
