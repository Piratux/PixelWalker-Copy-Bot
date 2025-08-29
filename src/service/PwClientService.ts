import { ListBlockResult, PWApiClient, PWGameClient } from 'pw-js-api'
import { GENERAL_CONSTANTS, TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { Block, DeserialisedStructure, PWGameWorldHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwApiClient, getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/store/PwClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/service/ChatMessageService.ts'
import { GameError } from '@/class/GameError.ts'
import waitUntil, { TimeoutError } from 'async-wait-until'
import { registerCopyBotCallbacks } from '@/service/PacketHandlerServiceCopyBot.ts'
import ManyKeysMap from 'many-keys-map'
import { EER_MAPPINGS } from '@/eer/EerMappings.ts'
import { BotType } from '@/enum/BotType.ts'
import { registerBomBotCallbacks } from '@/service/PacketHandlerServiceBomBot.ts'
import { CallbackEntry } from '@/type/CallbackEntry.ts'

export async function pwAuthenticate(pwApiClient: PWApiClient): Promise<void> {
  const authenticationResult = await pwApiClient.authenticate()

  if ('token' in authenticationResult) {
    return
  }

  if ('message' in authenticationResult) {
    throw new GameError(authenticationResult.message)
  } else {
    throw new GameError(GENERAL_CONSTANTS.GENERIC_ERROR)
  }
}

export async function pwJoinWorld(pwGameClient: PWGameClient, worldId: string): Promise<void> {
  try {
    await pwGameClient.joinWorld(worldId)
  } catch (e) {
    throw new GameError('Failed to join world. Check world ID. ' + (e as Error).message)
  }
}

function initPwBlocks(blocks: ListBlockResult[]) {
  blocks = blocks
    .sort((a, b) => a.Id - b.Id)
    .map((block) => ({
      ...block,
      PaletteId: block.PaletteId.toUpperCase(),
    }))

  usePwClientStore().blocks = []
  usePwClientStore().blocksByPwId = {}
  usePwClientStore().blocksByPwName = {}
  usePwClientStore().blocksByEelvlParameters = new ManyKeysMap()

  blocks.forEach((block) => {
    usePwClientStore().blocks.push(block)
    usePwClientStore().blocksByPwId[block.Id] = block
    usePwClientStore().blocksByPwName[block.PaletteId] = block
    if (block.LegacyId !== undefined) {
      if (block.LegacyMorph !== undefined) {
        block.LegacyMorph.forEach((morph) => {
          // When there are multiple values in block.LegacyMorph, it means that multiple morph values represent exact same block.
          // Only laser blocks in EELVL have multiple morphs.
          usePwClientStore().blocksByEelvlParameters.set([block.LegacyId!, morph], block)
        })
      } else {
        usePwClientStore().blocksByEelvlParameters.set([block.LegacyId], block)
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
          usePwClientStore().blocksByEerParameters.set([block.LegacyId!, morph], block)
        })
      } else {
        usePwClientStore().blocksByEerParameters.set([block.LegacyId], block)
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

  await pwAuthenticate(getPwApiClient())

  usePwClientStore().pwGameClient = new PWGameClient(getPwApiClient())
  usePwClientStore().pwGameWorldHelper = new PWGameWorldHelper()

  if (botType === BotType.COPY_BOT) {
    registerCopyBotCallbacks()
  } else if (botType === BotType.BOM_BOT) {
    registerBomBotCallbacks()
  }

  await pwJoinWorld(getPwGameClient(), usePwClientStore().worldId)

  initPwBlocks(await getPwApiClient().getListBlocks())
  initEerBlocks(EER_MAPPINGS)
}

export function pwCreateEmptyBlocks(pwGameWorldHelper: PWGameWorldHelper): DeserialisedStructure {
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

export async function pwClearWorld(): Promise<void> {
  const emptyBlocks = pwCreateEmptyBlocks(getPwGameWorldHelper())
  await placeWorldDataBlocks(emptyBlocks)
}

export function pwUserHasEditAccess(pwGameWorldHelper: PWGameWorldHelper, playerId: number): boolean {
  return pwGameWorldHelper.getPlayer(playerId)?.rights.canEdit === true
}

export async function pwEnterEditKey(pwGameClient: PWGameClient, secretEditKey: string): Promise<void> {
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
    await waitUntil(() => pwUserHasEditAccess(getPwGameWorldHelper(), getPwGameWorldHelper().botPlayerId), {
      timeout: 5000,
      intervalBetweenAttempts: 1000,
    })
  } catch (error) {
    if (error instanceof TimeoutError) {
      sendGlobalChatMessage('ERROR! Entered secret edit key is incorrect')
    } else {
      console.error('Unexpected error:', error)
    }
  }
}

export function pwCheckEdit(pwGameWorldHelper: PWGameWorldHelper, playerId: number): boolean {
  if (!pwUserHasEditAccess(pwGameWorldHelper, playerId)) {
    sendPrivateChatMessage('ERROR! You do not have edit access.', playerId)
    return false
  }

  if (!pwUserHasEditAccess(pwGameWorldHelper, pwGameWorldHelper.botPlayerId)) {
    sendPrivateChatMessage('ERROR! Bot does not have edit access.', playerId)
    return false
  }

  return true
}

export function pwCheckEditWhenImporting(pwGameWorldHelper: PWGameWorldHelper): boolean {
  if (!pwUserHasEditAccess(pwGameWorldHelper, pwGameWorldHelper.botPlayerId)) {
    sendGlobalChatMessage('ERROR! Bot does not have edit access.')
    return false
  }

  return true
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

export function playerInitPacketReceived() {
  getPwGameClient().send('playerInitReceived')
  void pwEnterEditKey(getPwGameClient(), usePwClientStore().secretEditKey)
}
