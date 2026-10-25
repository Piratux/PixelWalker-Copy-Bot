import { CataloggedBlock, ListBlockResult, ProtoGen, PWApiClient, PWCatalog, PWGameClient } from 'pw-js-api'
import { GENERIC_CHAT_ERROR, TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { Block, DeserialisedStructure, Point, PWGameWorldHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import {
  getPwApiClient,
  getPwGameClient,
  getPwGameWorldHelper,
  resetPwClientStore,
  usePwClientStore,
} from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { registerCopyBotCallbacks } from '@/bot/copybot/service/CopyBotPacketHandlerService.ts'
import { EER_MAPPINGS, EerListBlockResult } from '@/webtool/eer/block/EerMappings.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { registerBomBotCallbacks } from '@/bot/bombot/service/BomBotPacketHandlerService.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { useAlertStore } from '@/core/store/AlertStore.ts'
import { GameError } from '@/core/class/GameError.ts'
import { resetEelvlClientStore, useEelvlClientStore } from '@/webtool/eelvl/store/EelvlClientStore.ts'
import { resetEerClientStore, useEerClientStore } from '@/webtool/eer/store/EerClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { TimeoutError, workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { createFailedToJoinWorldErrorString } from '@/bot/copybot/service/CopyBotErrorService.ts'
import { registerCurseBotCallbacks } from '@/bot/cursebot/service/CurseBotPacketHandlerService.ts'
import { registerShiftBotCallbacks } from '@/bot/shiftbot/service/ShiftBotPacketHandlerService.ts'
import { registerBArenaBotCallbacks } from '@/bot/barenabot/service/BArenaBotPacketHandlerService.ts'
import { resetCopyBotStore } from '@/bot/copybot/store/CopyBotStore.ts'
import { resetZoneStore, useZoneStore } from '@/core/store/ZoneStore.ts'
import { resetLabelStore, useLabelStore } from '@/core/store/LabelStore.ts'

export async function authenticate(pwApiClient: PWApiClient): Promise<void> {
  const authenticationResult = await pwApiClient.authenticate()

  if ('token' in authenticationResult) {
    return
  }

  if ('message' in authenticationResult) {
    throw new Error(authenticationResult.message)
  } else {
    throw new Error()
  }
}

export async function joinWorld(pwGameClient: PWGameClient, worldId: string): Promise<void> {
  try {
    await pwGameClient.joinWorld(worldId)
  } catch (e) {
    throw new Error(createFailedToJoinWorldErrorString(worldId) + ' ' + (e as Error).message)
  }
}

function initPwBlocks(blocks: ListBlockResult[], catallogedBlocks: CataloggedBlock[]) {
  usePwClientStore().blocks = []
  usePwClientStore().blocksByPwId = new Map()
  usePwClientStore().blocksByPwName = new Map()
  usePwClientStore().catallogedBlocks = []

  blocks.forEach((block) => {
    usePwClientStore().blocks.push(block)
    usePwClientStore().blocksByPwId.set(block.Id, block)
    usePwClientStore().blocksByPwName.set(block.PaletteId, block)
  })
  catallogedBlocks.forEach((block) => {
    usePwClientStore().catallogedBlocks.push(block)
  })
}

function initEelvlBlocks(blocks: ListBlockResult[]) {
  resetEelvlClientStore()

  blocks.forEach((block) => {
    Object.entries(block.LegacyMorphs).forEach(([legacyId, morphs]) => {
      if (Array.isArray(morphs)) {
        morphs.forEach((morph) => {
          useEelvlClientStore().blocksByParameters.set([Number(legacyId), morph], block)
        })
      } else {
        useEelvlClientStore().blocksByParameters.set([Number(legacyId)], block)
      }
    })
  })
}

function initEerBlocks(eerBlocks: EerListBlockResult[]) {
  resetEerClientStore()

  eerBlocks.forEach((block) => {
    if (block.LegacyId !== undefined) {
      if (block.LegacyMorph !== undefined) {
        block.LegacyMorph.forEach((morph) => {
          useEerClientStore().blocksByParameters.set([block.LegacyId, morph], block)
        })
      } else {
        useEerClientStore().blocksByParameters.set([block.LegacyId], block)
      }
    }
  })
}

export async function initPwClasses(
  worldId: string,
  email: string,
  password: string,
  secretEditKey: string,
  botType: BotType,
) {
  resetPwClientStore()
  resetZoneStore()
  resetLabelStore()

  usePwClientStore().worldId = worldId
  usePwClientStore().email = email.toLowerCase() // Login page in PW lowercases email before sending to server
  usePwClientStore().password = password
  usePwClientStore().secretEditKey = secretEditKey
  usePwClientStore().botType = botType

  usePwClientStore().pwApiClient = new PWApiClient(usePwClientStore().email, usePwClientStore().password, {
    endpoints: {
      Api: import.meta.env.VITE_PW_API_URL,
      GameHTTP: import.meta.env.VITE_PW_GAME_HTTP_URL,
      GameWS: import.meta.env.VITE_PW_GAME_WS_URL,
    },
  })

  await authenticate(getPwApiClient())

  usePwClientStore().pwGameClient = new PWGameClient(getPwApiClient())
  usePwClientStore().pwGameWorldHelper = new PWGameWorldHelper()

  if (botType === BotType.COPY_BOT) {
    resetCopyBotStore()
    registerCopyBotCallbacks()
  } else if (botType === BotType.BOM_BOT) {
    registerBomBotCallbacks()
  } else if (botType === BotType.CURSE_BOT) {
    registerCurseBotCallbacks()
  } else if (botType === BotType.SHIFT_BOT) {
    registerShiftBotCallbacks()
  } else if (botType === BotType.BARENA_BOT) {
    registerBArenaBotCallbacks()
  }

  await joinWorld(getPwGameClient(), usePwClientStore().worldId)

  const pwBlocks = await getPwBlocks()
  const pwCatallogedBlocks = await PWCatalog.getBlocks()
  initPwBlocks(pwBlocks, pwCatallogedBlocks)
  initEelvlBlocks(pwBlocks)
  initEerBlocks(EER_MAPPINGS)

  await workerWaitUntil(() => usePwClientStore().isConnected, {
    timeout: 5000,
    intervalBetweenAttempts: 1000,
  })
}

async function getPwBlocks(): Promise<ListBlockResult[]> {
  const blocks = await getPwApiClient().getListBlocks()

  return blocks
    .sort((a, b) => a.Id - b.Id)
    .map((block) => ({
      ...block,
      PaletteId: block.PaletteId.toUpperCase(),
    }))
}

export function createEmptyBlocks(size: vec2): DeserialisedStructure {
  const width = size.x
  const height = size.y
  const pwBlock3DArray: [Block[][], Block[][], Block[][]] = [[], [], []]
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    pwBlock3DArray[layer] = []
    for (let x = 0; x < width; x++) {
      pwBlock3DArray[layer][x] = []
      for (let y = 0; y < height; y++) {
        pwBlock3DArray[layer][x][y] = new Block(0)
      }
    }
  }
  return new DeserialisedStructure(pwBlock3DArray, { width: width, height: height })
}

export function createEmptyBlocksFullWorldSize(): DeserialisedStructure {
  const pwGameWorldHelper = getPwGameWorldHelper()
  return createEmptyBlocks(vec2(pwGameWorldHelper.width, pwGameWorldHelper.height))
}

export async function clearWorld(): Promise<void> {
  const emptyBlocks = createEmptyBlocksFullWorldSize()
  await placeWorldDataBlocks(emptyBlocks)
}

export async function enterEditKey(pwGameClient: PWGameClient, secretEditKey: string): Promise<void> {
  if (secretEditKey === '') {
    return
  }

  if (!getPwGameWorldHelper().meta!.hasSecretEditKey) {
    sendGlobalChatMessage('ERROR! This world has no secret edit key')
    return
  }

  pwGameClient.send('playerEnterSecretEditKeyPacket', {
    secretEditKey: secretEditKey,
  })

  try {
    await workerWaitUntil(() => hasPlayerEditPermission(getPwGameWorldHelper().botPlayerId), {
      timeout: 5000,
      intervalBetweenAttempts: 1000,
    })
  } catch (error) {
    if (error instanceof TimeoutError) {
      sendGlobalChatMessage('ERROR! Entered secret edit key is incorrect')
    } else {
      sendGlobalChatMessage(GENERIC_CHAT_ERROR)
      console.error('Unexpected error:', error)
    }
  }
}

function hasPlayerEditPermission(playerId: number): boolean {
  return getPwGameWorldHelper().getPlayer(playerId)?.rights.canEdit === true
}

export function requirePlayerEditPermission(playerId: number): void {
  if (!hasPlayerEditPermission(playerId)) {
    throw new GameError('You do not have edit access.', playerId)
  }
}

export function requireBotEditPermission(): void {
  if (!hasPlayerEditPermission(getPwGameWorldHelper().botPlayerId)) {
    throw new GameError('Bot does not have edit access.')
  }
}

export function requirePlayerAndBotEditPermission(playerId: number): void {
  requirePlayerEditPermission(playerId)
  requireBotEditPermission()
}

export function requireBotAsWorldOwner(): void {
  for (const [playerId, player] of getPwGameWorldHelper().players) {
    if (player.isWorldOwner && playerId === getPwGameWorldHelper().botPlayerId) {
      return
    }
  }

  throw new GameError("Bot must be world owner, because otherwise /tp command doesn't work.")
}

export function getAllWorldBlocks(pwGameWorldHelper: PWGameWorldHelper): DeserialisedStructure {
  return pwGameWorldHelper.sectionArea(0, 0, pwGameWorldHelper.width - 1, pwGameWorldHelper.height - 1)
}

export function hotReloadCallbacks(callbacks: CallbackEntry[]) {
  const client = getPwGameClient()
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!client) {
    return
  }

  for (const cb of callbacks) {
    client.removeCallback(cb.name)
    client.addCallback(cb.name, cb.fn)
  }
  const date = new Date(Date.now())
  const message = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] Hot reloaded.`
  console.log(message)
  sendGlobalChatMessage(message)
}

export function commonPlayerInitPacketReceived() {
  getPwGameClient().send('playerInitReceived')
  void enterEditKey(getPwGameClient(), usePwClientStore().secretEditKey)
  usePwClientStore().isConnected = true
}

export function clearPendingPlacements(): void {
  usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket = 0
  usePwClientStore().unsuccessfullyPlacedBlockPackets.clear()
  usePwClientStore().placementCompletionPending = false
  usePwClientStore().placementCompletionAnnounced = false
  useZoneStore().zonePasteQueue.clear()
  useZoneStore().pendingZoneAreaEdits.clear()
}

export function handlePlaceBlocksResult(success: boolean): void {
  if (success) {
    if (!usePwClientStore().placementCompletionAnnounced) {
      usePwClientStore().placementCompletionPending = true
      announcePlacementIfComplete()
    }
  } else {
    usePwClientStore().placementCompletionPending = false
    throw new GameError('Failed to place all blocks.')
  }
}

export function announcePlacementIfComplete(): void {
  if (
    !usePwClientStore().placementCompletionPending ||
    usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket > 0 ||
    useZoneStore().zonePasteQueue.size > 0 ||
    useZoneStore().pendingZoneAreaEdits.size > 0 ||
    useLabelStore().totalLabelsLeftToReceive > 0
  ) {
    return
  }

  usePwClientStore().placementCompletionPending = false
  usePwClientStore().placementCompletionAnnounced = true
  const message = 'Successfully finished placing all blocks, labels and zones.'
  sendGlobalChatMessage(message)
  useAlertStore().success(message)
}

export function updateAwaitedWorldBlockPlacedPackets(data: ProtoGen.WorldBlockPlacedPacket) {
  // Not really reliable, but good enough
  if (usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket > 0) {
    usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket -= data.positions.length
    if (usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket <= 0) {
      usePwClientStore().totalBlocksLeftToReceiveFromWorldBlockPlacedPacket = 0
    }

    const sortedPositions = data.positions
      .map((pos) => ({ x: pos.x, y: pos.y }))
      .sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y))
    const packetKey = JSON.stringify({ blockId: data.blockId, positions: sortedPositions })
    usePwClientStore().unsuccessfullyPlacedBlockPackets.delete(packetKey)
    announcePlacementIfComplete()
  }
}

function getOwnerPlayerId(): number {
  for (const [playerId, player] of getPwGameWorldHelper().players) {
    if (player.isWorldOwner && playerId !== getPwGameWorldHelper().botPlayerId) {
      return playerId
    }
  }

  throw new GameError('No world owner player found')
}

export function teleportPlayer(pos: Point) {
  requireBotAsWorldOwner()

  const playerId = getOwnerPlayerId()
  requirePlayerAndBotEditPermission(playerId)

  for (const [playerId, player] of getPwGameWorldHelper().players) {
    if (player.isWorldOwner && playerId !== getPwGameWorldHelper().botPlayerId) {
      sendRawMessage(`/tp #${playerId} ${pos.x} ${pos.y}`)
      break
    }
  }
}
