import { PWApiClient, PWGameClient } from 'pw-js-api'
import { GENERAL_CONSTANTS, TOTAL_PW_LAYERS } from '@/constants/General.ts'
import { Block, DeserialisedStructure, PWGameWorldHelper } from 'pw-js-world'
import { placeWorldDataBlocks } from '@/services/WorldService.ts'
import { vec2 } from '@basementuniverse/vec'
import { getPwGameWorldHelper } from '@/stores/PWClientStore.ts'
import { sendGlobalChatMessage, sendPrivateChatMessage } from '@/services/ChatMessageService.ts'
import { GameError } from '@/classes/GameError.ts'

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
  await placeWorldDataBlocks(emptyBlocks, vec2(0, 0))
}

export function pwUserHasEditAccess(pwGameWorldHelper: PWGameWorldHelper, playerId: number): boolean {
  return pwGameWorldHelper.getPlayer(playerId)?.rights.canEdit === true
}

export function pwEnterEditKey(pwGameClient: PWGameClient, secretEditKey: string|null): boolean {
  if (secretEditKey === null) {
    return false
  }
  pwGameClient.send('playerEnterSecretEditKeyPacket', {
    secretEditKey: secretEditKey,
  })
  return true
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
