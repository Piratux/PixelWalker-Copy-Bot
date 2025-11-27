import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { GENERIC_CHAT_ERROR, TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { Block, DeserialisedStructure, PWGameWorldHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { getPwApiClient, getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { registerCopyBotCallbacks } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import ManyKeysMap from 'many-keys-map'
import { EER_MAPPINGS } from '@/webtool/eer/block/EerMappings.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { registerBomBotCallbacks } from '@/bombot/service/PacketHandlerBomBotService.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { AlertService } from '@/core/service/AlertService.ts'
import { GameError } from '@/core/class/GameError.ts'
import { useEelvlClientStore } from '@/webtool/eelvl/store/EelvlClientStore.ts'
import { useEerClientStore } from '@/webtool/eer/store/EerClientStore.ts'
import { vec2 } from '@basementuniverse/vec'
import { TimeoutError, workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'
import { createFailedToJoinWorldErrorString } from '@/copybot/service/CopyBotErrorService.ts'

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

function initPwBlocks(blocks: ListBlockResult[]) {
  usePwClientStore().blocks = []
  usePwClientStore().blocksByPwId = new Map()
  usePwClientStore().blocksByPwName = new Map()

  blocks.forEach((block) => {
    usePwClientStore().blocks.push(block)
    usePwClientStore().blocksByPwId.set(block.Id, block)
    usePwClientStore().blocksByPwName.set(block.PaletteId, block)
  })
}

function initEelvlBlocks(blocks: ListBlockResult[]) {
  useEelvlClientStore().blocksByParameters = new ManyKeysMap()

  blocks.forEach((block) => {
    if (block.LegacyId !== undefined) {
      if (block.LegacyMorph !== undefined) {
        block.LegacyMorph.forEach((morph) => {
          // When there are multiple values in block.LegacyMorph, it means that multiple morph values represent exact same block.
          // Only laser blocks in EELVL have multiple morphs.
          useEelvlClientStore().blocksByParameters.set([block.LegacyId!, morph], block)
        })
      } else {
        useEelvlClientStore().blocksByParameters.set([block.LegacyId], block)
      }
    }
  })
}

function initEerBlocks(eerBlocks: ListBlockResult[]) {
  eerBlocks.forEach((block) => {
    if (block.LegacyId !== undefined) {
      if (block.LegacyMorph !== undefined) {
        block.LegacyMorph.forEach((morph) => {
          // When there are multiple values in block.LegacyMorph, it means that multiple morph values represent exact same block.
          // Only laser blocks in EELVL have multiple morphs.
          useEerClientStore().blocksByParameters.set([block.LegacyId!, morph], block)
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
  usePwClientStore().worldId = worldId
  usePwClientStore().email = email
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
    registerCopyBotCallbacks()
  } else if (botType === BotType.BOM_BOT) {
    registerBomBotCallbacks()
  }

  await joinWorld(getPwGameClient(), usePwClientStore().worldId)

  const pwBlocks = await getPwBlocks()
  initPwBlocks(pwBlocks)
  initEelvlBlocks(pwBlocks)
  initEerBlocks(EER_MAPPINGS)

  usePwClientStore().roomType = (await getPwApiClient().getRoomTypes())[0] ?? ''

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

export function createEmptyBlocksFullWorldSize(pwGameWorldHelper: PWGameWorldHelper): DeserialisedStructure {
  return createEmptyBlocks(vec2(pwGameWorldHelper.width, pwGameWorldHelper.height))
}

export async function clearWorld(): Promise<void> {
  const emptyBlocks = createEmptyBlocksFullWorldSize(getPwGameWorldHelper())
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
    await workerWaitUntil(() => hasPlayerEditPermission(getPwGameWorldHelper(), getPwGameWorldHelper().botPlayerId), {
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

function hasPlayerEditPermission(pwGameWorldHelper: PWGameWorldHelper, playerId: number): boolean {
  return pwGameWorldHelper.getPlayer(playerId)?.rights.canEdit === true
}

export function requirePlayerEditPermission(pwGameWorldHelper: PWGameWorldHelper, playerId: number): void {
  if (!hasPlayerEditPermission(pwGameWorldHelper, playerId)) {
    throw new GameError('You do not have edit access.', playerId)
  }
}

export function requireBotEditPermission(pwGameWorldHelper: PWGameWorldHelper): void {
  if (!hasPlayerEditPermission(pwGameWorldHelper, pwGameWorldHelper.botPlayerId)) {
    throw new GameError('Bot does not have edit access.')
  }
}

export function requirePlayerAndBotEditPermission(pwGameWorldHelper: PWGameWorldHelper, playerId: number): void {
  requirePlayerEditPermission(pwGameWorldHelper, playerId)
  requireBotEditPermission(pwGameWorldHelper)
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
  return pwGameWorldHelper.sectionBlocks(0, 0, pwGameWorldHelper.width - 1, pwGameWorldHelper.height - 1)
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

export function handlePlaceBlocksResult(success: boolean): void {
  let message: string
  if (success) {
    message = 'Successfully finished placing all blocks.'
    sendGlobalChatMessage(message)
    AlertService.success(message)
  } else {
    throw new GameError('Failed to place all blocks.')
  }
}
