import {
  Block,
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
  getPwBotType,
  getPwGameClient,
  getPwGameWorldHelper,
  usePwClientStore,
} from '@/core/store/PwClientStore.ts'
import { WorldBlock } from '@/core/type/WorldBlock.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { sleep } from '@/core/util/Sleep.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { vec2 } from '@basementuniverse/vec'
import { cloneDeep, shuffle } from 'lodash-es'
import { PWApiClient, PWGameClient } from 'pw-js-api'
import { authenticate, getAllWorldBlocks, joinWorld } from '@/core/service/PwClientService.ts'
import { handleException } from '@/core/util/Exception.ts'
import { GameError } from '@/core/class/GameError.ts'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { toRaw } from 'vue'
import { BotType } from '@/core/enum/BotType.ts'

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

export async function placeWorldDataBlocksUsingColumnsLeftToRightPattern(
  worldData: DeserialisedStructure,
  pos: Point = vec2(0, 0),
): Promise<void> {
  const BLOCKS_PLACED_PER_POSITION_SPEED = 50
  const delayBetweenPlacementsMs = Math.ceil(1000 / BLOCKS_PLACED_PER_POSITION_SPEED)

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

export async function placeWorldDataBlocksUsingRandomPositionsPattern(
  blocks: WorldBlock[],
  maxAirPositionsPerPacket = 200,
): Promise<void> {
  const PACKET_BATCHES_PLACED_PER_SECOND_SPEED = 20

  const delayBetweenPlacementsMs = Math.ceil(1000 / PACKET_BATCHES_PLACED_PER_SECOND_SPEED)

  const shuffledBlocks = shuffle(blocks)
  const packets = createBlockPackets(shuffledBlocks)
  const splitPackets: SendableBlockPacket[] = []

  for (const packet of packets) {
    let splitPacket: SendableBlockPacket = cloneDeep(packet)
    splitPacket.positions = []
    for (const pos of packet.positions) {
      splitPacket.positions.push(pos)
      if (packet.blockId !== 0 || splitPacket.positions.length >= maxAirPositionsPerPacket) {
        splitPackets.push(splitPacket)
        splitPacket = cloneDeep(packet)
        splitPacket.positions = []
      }
    }
    if (splitPacket.positions.length > 0) {
      splitPackets.push(splitPacket)
    }
  }

  const randomIndexes = shuffle(Array.from(Array(splitPackets.length).keys()))

  const TOTAL_PACKETS_TO_PLACE_PER_BATCH = 10

  // This batch mechanism is only needed because short sleeps (<10ms) take too long (take roughly ~20ms).
  for (let i = 0; i < randomIndexes.length; i++) {
    const idx = randomIndexes[i]
    placeBlockPacket(splitPackets[idx])
    if (i % TOTAL_PACKETS_TO_PLACE_PER_BATCH === 0) {
      await sleep(delayBetweenPlacementsMs)
    }
  }

  // We are not tracking when packets will be placed, so we do optimistic sleep here to try not to interfere with other block place awaits.
  await sleep(1000)
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
  usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket = blockCount
  let lasttotalBlocksLeftToReceiveFromWorldBlockPlacedPacketValue =
    usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket

  usePwClientStore().unsuccessfullyPlacedBlockPackets.clear()
  for (const packet of packets) {
    const sortedPositions = packet.positions
      .map((pos) => ({ x: pos.x, y: pos.y }))
      .sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y))
    const packetKey = JSON.stringify({ blockId: packet.blockId, positions: sortedPositions })
    usePwClientStore().unsuccessfullyPlacedBlockPackets.set(packetKey, packet)
  }

  for (const packet of packets) {
    placeBlockPacket(packet)
  }

  const TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR = 50
  let totalAttempts = 0
  while (totalAttempts < TOTAL_WAIT_ATTEMPTS_BEFORE_ASSUMING_ERROR) {
    if (usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket === 0) {
      return true
    }

    if (
      usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket ===
      lasttotalBlocksLeftToReceiveFromWorldBlockPlacedPacketValue
    ) {
      totalAttempts++
    } else {
      totalAttempts = 0
    }

    lasttotalBlocksLeftToReceiveFromWorldBlockPlacedPacketValue =
      usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket

    await sleep(100)
  }

  if (getPwBotType() === BotType.COPY_BOT) {
    console.error('Failed to place all blocks. Printing packets that could not be placed:')
    console.error(toRaw(usePwClientStore().unsuccessfullyPlacedBlockPackets))
  }

  return false
}

function updateBlockMap(blockPacket: SendableBlockPacket) {
  const { positions, layer, blockId, fields } = blockPacket

  for (let i = 0, len = positions.length; i < len; i++) {
    const { x, y } = positions[i]

    // TODO: maybe consider doing PR that filters position to be within map bounds in createBlockPackets
    if (x < 0 || x >= getPwGameWorldHelper().width || y < 0 || y >= getPwGameWorldHelper().height) {
      continue
    }

    getPwGameWorldHelper().blocks[layer][x][y] = new Block(blockId, Block.parseArgFields(fields))
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
  return getPwBlocksByPwId().get(pwBlockId)!.PaletteId.toUpperCase() as PwBlockName
}

export function getBlockIdFromString(name: string): number | undefined {
  const block = getPwBlocksByPwName().get(name)
  if (block === undefined) {
    return undefined
  }
  return block.Id
}

export function getBlockLayer(pwBlockId: number): LayerType {
  return getPwBlocksByPwId().get(pwBlockId)!.Layer as LayerType
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

// Example:
// - Input: "12a3b"
// - Output: [12, 'a', 3, 'b']
export function portalIdToNumberAndStringArray(portalId: string): (number | string)[] {
  const result: (number | string)[] = []
  let currentNumberStr = ''
  for (const char of portalId) {
    if (/\d/.test(char)) {
      currentNumberStr += char
    } else {
      if (currentNumberStr.length > 0) {
        result.push(parseInt(currentNumberStr))
        currentNumberStr = ''
      }
      result.push(char)
    }
  }
  if (currentNumberStr.length > 0) {
    result.push(parseInt(currentNumberStr))
  }
  return result
}

// Example:
// - Input: [12, 'a', 3, 'b'], [5, 'a', 30, 'b']
// - Output: true
// Example 2:
// - Input: [12, 'a', 3, 'b'], [5, 'a', 'b', 30]
// - Output: true
export function numberAndStringArrayTypesMatch(array1: (number | string)[], array2: (number | string)[]): boolean {
  if (array1.length !== array2.length) {
    return false
  }

  for (let i = 0; i < array1.length; i++) {
    if (typeof array1[i] !== typeof array2[i]) {
      return false
    }
  }

  return true
}

export async function getAnotherWorldBlocks(worldId: string, pwApiClient: PWApiClient): Promise<DeserialisedStructure> {
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

  try {
    await joinWorld(pwGameClient, worldId)
  } catch (e) {
    throw new GameError((e as Error).message)
  }

  await workerWaitUntil(() => copyFromAnotherWorldFinished, { timeout: 10000, intervalBetweenAttempts: 1000 })
  if (blocksResult === null) {
    throw new GameError(`Getting blocks from another world took too long. World ID: ${worldId}`)
  }
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
