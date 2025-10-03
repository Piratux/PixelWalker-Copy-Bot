import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { GENERAL_CONSTANTS, TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { Block, DeserialisedStructure, PWGameWorldHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { getPwApiClient, getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import waitUntil, { TimeoutError } from 'async-wait-until'
import { registerCopyBotCallbacks } from '@/copybot/service/PacketHandlerCopyBotService.ts'
import ManyKeysMap from 'many-keys-map'
import { EER_MAPPINGS } from '@/eer/block/EerMappings.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { registerBomBotCallbacks } from '@/bombot/service/PacketHandlerBomBotService.ts'
import { CallbackEntry } from '@/core/type/CallbackEntry.ts'
import { MessageService } from '@/core/service/MessageService.ts'
import { GameError } from '@/core/class/GameError.ts'
import { useEelvlClientStore } from '@/eelvl/store/EelvlClientStore.ts'
import { useEerClientStore } from '@/eer/store/EerClientStore.ts'

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
    throw new Error('Failed to join world. Check world ID. ' + (e as Error).message)
  }
}

function initPwBlocks(blocks: ListBlockResult[]) {
  usePwClientStore().blocks = []
  usePwClientStore().blocksByPwId = {}
  usePwClientStore().blocksByPwName = {}

  blocks.forEach((block) => {
    usePwClientStore().blocks.push(block)
    usePwClientStore().blocksByPwId[block.Id] = block
    usePwClientStore().blocksByPwName[block.PaletteId] = block
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

export async function initPwClasses(botType: BotType) {
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

export function createEmptyBlocks(pwGameWorldHelper: PWGameWorldHelper): DeserialisedStructure {
  const width = pwGameWorldHelper.width
  const height = pwGameWorldHelper.height
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

export async function clearWorld(): Promise<void> {
  const emptyBlocks = createEmptyBlocks(getPwGameWorldHelper())
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
    await waitUntil(() => hasPlayerEditPermission(getPwGameWorldHelper(), getPwGameWorldHelper().botPlayerId), {
      timeout: 5000,
      intervalBetweenAttempts: 1000,
    })
  } catch (error) {
    if (error instanceof TimeoutError) {
      sendGlobalChatMessage('ERROR! Entered secret edit key is incorrect')
    } else {
      sendGlobalChatMessage(GENERAL_CONSTANTS.GENERIC_ERROR)
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

export function getAllWorldBlocks(pwGameWorldHelper: PWGameWorldHelper): DeserialisedStructure {
  return pwGameWorldHelper.sectionBlocks(0, 0, pwGameWorldHelper.width - 1, pwGameWorldHelper.height - 1)
}

export function hotReloadCallbacks(callbacks: CallbackEntry[]) {
  const client = getPwGameClient()
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
}

export function handlePlaceBlocksResult(success: boolean) {
  let message: string
  if (success) {
    message = 'Successfully finished placing all blocks.'
    sendGlobalChatMessage(message)
    MessageService.success(message)
  } else {
    throw new GameError('Failed to place all blocks.')
  }
}
