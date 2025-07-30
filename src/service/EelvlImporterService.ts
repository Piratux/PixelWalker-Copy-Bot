import { ByteArray } from '@/class/ByteArray.ts'
import { EelvlBlockId } from '@/gen/EelvlBlockId.ts'
import type { BlockArg } from 'pw-js-world'
import { Block, DeserialisedStructure } from 'pw-js-world'
import { EelvlBlock } from '@/type/EelvlBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import { EelvlFileHeader } from '@/type/WorldData.ts'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { getBlockLayer, placeWorldDataBlocks } from '@/service/WorldService.ts'
import { getPwBlocksByEelvlParameters, getPwGameWorldHelper } from '@/store/PWClientStore.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { cloneDeep } from 'lodash-es'
import { pwCheckEditWhenImporting } from '@/service/PWClientService.ts'
import { TOTAL_PW_LAYERS } from '@/constant/General.ts'
import { MessageService } from '@/service/MessageService.ts'
import { hasEelvlBlockOneIntParameter, isEelvlNpc } from '@/service/EelvlUtilService.ts'
import { EelvlLayer } from '@/enum/EelvlLayer.ts'

export function getImportedFromEelvlData(fileData: ArrayBuffer): DeserialisedStructure {
  const bytes = new ByteArray(new Uint8Array(fileData))
  bytes.uncompress()

  const world = {} as EelvlFileHeader
  world.ownerName = bytes.readUTF()
  world.name = bytes.readUTF()
  world.width = bytes.readInt()
  world.height = bytes.readInt()
  world.gravMultiplier = bytes.readFloat()
  world.backgroundColor = bytes.readUnsignedInt()
  world.description = bytes.readUTF()
  world.isCampaign = bytes.readBoolean()
  world.crewId = bytes.readUTF()
  world.crewName = bytes.readUTF()
  world.crewStatus = bytes.readInt()
  world.minimapEnabled = bytes.readBoolean()
  world.ownerId = bytes.readUTF()

  const pwMapWidth = getPwGameWorldHelper().width
  const pwMapHeight = getPwGameWorldHelper().height

  const pwBlock3DArray: [Block[][], Block[][], Block[][]] = [[], [], []]
  for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
    pwBlock3DArray[layer] = []
    for (let x = 0; x < pwMapWidth; x++) {
      pwBlock3DArray[layer][x] = []
      for (let y = 0; y < pwMapHeight; y++) {
        pwBlock3DArray[layer][x][y] = new Block(0)
      }
    }
  }

  while (bytes.hashposition < bytes.length) {
    const eelvlBlockId = bytes.readInt()
    const eelvlLayer = bytes.readInt()
    const blockPositions = readPositionsByteArrays(bytes)
    const eelvlBlock: EelvlBlock = readEelvlBlock(bytes, eelvlBlockId)

    if ((eelvlBlockId as EelvlBlockId) === EelvlBlockId.EMPTY) {
      continue
    }

    const pwBlock: Block = mapBlockIdEelvlToPw(eelvlBlock, eelvlLayer)
    const pwLayer = getBlockLayer(pwBlock.bId)
    for (const pos of blockPositions) {
      if (pos.x >= 0 && pos.y >= 0 && pos.x < pwMapWidth && pos.y < pwMapHeight) {
        pwBlock3DArray[pwLayer][pos.x][pos.y] = cloneDeep(pwBlock)
      }
    }
  }

  return new DeserialisedStructure(pwBlock3DArray, { width: pwMapWidth, height: pwMapHeight })
}

export async function importFromEelvl(fileData: ArrayBuffer) {
  if (!pwCheckEditWhenImporting(getPwGameWorldHelper())) {
    return
  }

  const worldData = getImportedFromEelvlData(fileData)

  const success = await placeWorldDataBlocks(worldData, vec2(0, 0))

  let message: string
  if (success) {
    message = 'Finished importing world.'
    sendGlobalChatMessage(message)
    MessageService.success(message)
  } else {
    message = 'ERROR! Failed to import world.'
    sendGlobalChatMessage(message)
    MessageService.error(message)
  }
}

function readEelvlBlock(bytes: ByteArray, eelvlBlockId: number) {
  const eelvlBlock = {} as EelvlBlock

  switch (eelvlBlockId as EelvlBlockId) {
    case EelvlBlockId.PORTAL_VISIBLE_LEFT:
    case EelvlBlockId.PORTAL_INVISIBLE_LEFT:
      eelvlBlock.intParameter = bytes.readInt()
      eelvlBlock.portalId = bytes.readInt()
      eelvlBlock.portalTarget = bytes.readInt()
      break
    case EelvlBlockId.SIGN_NORMAL:
      eelvlBlock.signText = bytes.readUTF().replaceAll('\\n', '\n')
      eelvlBlock.signType = bytes.readInt()
      break
    case EelvlBlockId.PORTAL_WORLD:
      eelvlBlock.worldPortalTargetWorldId = bytes.readUTF()
      eelvlBlock.worldPortalTargetSpawnPointId = bytes.readInt()
      break
    case EelvlBlockId.LABEL:
      eelvlBlock.labelText = bytes.readUTF()
      eelvlBlock.labelTextColor = bytes.readUTF()
      eelvlBlock.labelWrapLength = bytes.readInt()
      break
    default:
      if (hasEelvlBlockOneIntParameter(eelvlBlockId)) {
        eelvlBlock.intParameter = bytes.readInt()
      } else if (isEelvlNpc(eelvlBlockId)) {
        eelvlBlock.npcName = bytes.readUTF()
        eelvlBlock.npcMessage1 = bytes.readUTF()
        eelvlBlock.npcMessage2 = bytes.readUTF()
        eelvlBlock.npcMessage3 = bytes.readUTF()
      }
  }

  eelvlBlock.blockId = eelvlBlockId
  return eelvlBlock
}

function readPositionsByteArrays(bytes: ByteArray): vec2[] {
  const positions: vec2[] = []
  let length: number
  const positionsX: ByteArray = new ByteArray(0)
  const positionsY: ByteArray = new ByteArray(0)

  length = bytes.readUnsignedInt()
  bytes.readBytes(positionsX, 0, length)
  length = bytes.readUnsignedInt()
  bytes.readBytes(positionsY, 0, length)

  for (let i: number = 0; i < positionsX.length / 2; i++) {
    positions.push(vec2(positionsX.readUnsignedShort(), positionsY.readUnsignedShort()))
  }

  return positions
}

function createBlock(pwBlockName: PwBlockName, args?: BlockArg[]): Block {
  return new Block(pwBlockName, args)
}

function mapBlockIdEelvlToPw(eelvlBlock: EelvlBlock, eelvlLayer: EelvlLayer): Block {
  switch (eelvlBlock.blockId as EelvlBlockId) {
    case EelvlBlockId.COIN_GOLD_DOOR:
      return createBlock(PwBlockName.COIN_GOLD_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.COIN_GOLD_GATE:
      return createBlock(PwBlockName.COIN_GOLD_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.COIN_BLUE_DOOR:
      return createBlock(PwBlockName.COIN_BLUE_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.COIN_BLUE_GATE:
      return createBlock(PwBlockName.COIN_BLUE_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.EFFECTS_JUMP_HEIGHT:
      return getEelvlToPwEffectsJumpHeightBlock(eelvlBlock)
    case EelvlBlockId.EFFECTS_FLY:
      return createBlock(PwBlockName.EFFECTS_FLY, [eelvlBlock.intParameter === 1])
    case EelvlBlockId.EFFECTS_SPEED:
      return getEelvlToPwEffectsSpeedBlock(eelvlBlock)
    case EelvlBlockId.EFFECTS_INVULNERABILITY:
      return createBlock(PwBlockName.EFFECTS_INVULNERABILITY, [eelvlBlock.intParameter === 1])
    case EelvlBlockId.EFFECTS_CURSE:
      return createBlock(PwBlockName.EFFECTS_CURSE, [eelvlBlock.intParameter!])
    case EelvlBlockId.EFFECTS_ZOMBIE:
      return createBlock(PwBlockName.EFFECTS_ZOMBIE, [eelvlBlock.intParameter!])
    case EelvlBlockId.EFFECTS_GRAVITYFORCE:
      return getEelvlToPwEffectsGravityForceBlock(eelvlBlock)
    case EelvlBlockId.EFFECTS_MULTI_JUMP:
      return getEelvlToPwEffectsMultiJumpBlock(eelvlBlock)
    case EelvlBlockId.TOOL_PORTAL_WORLD_SPAWN:
      return createBlock(PwBlockName.TOOL_PORTAL_WORLD_SPAWN, [eelvlBlock.intParameter!])
    case EelvlBlockId.SIGN_NORMAL:
      switch (eelvlBlock.signType) {
        case 0:
          return createBlock(PwBlockName.SIGN_NORMAL, [eelvlBlock.signText!])
        case 2:
          return createBlock(PwBlockName.SIGN_RED, [eelvlBlock.signText!])
        case 1:
          return createBlock(PwBlockName.SIGN_BLUE, [eelvlBlock.signText!])
        case 3:
          return createBlock(PwBlockName.SIGN_GOLD, [eelvlBlock.signText!])
        default:
          return createBlock(PwBlockName.SIGN_GREEN, [eelvlBlock.signText!])
      }
    case EelvlBlockId.PORTAL_VISIBLE_LEFT:
      return getEelvlToPwPortalBlock(eelvlBlock)
    case EelvlBlockId.PORTAL_INVISIBLE_LEFT:
      return getEelvlToPwPortalBlock(eelvlBlock)
    case EelvlBlockId.PORTAL_WORLD:
      return createBlock(PwBlockName.PORTAL_WORLD, [
        eelvlBlock.worldPortalTargetWorldId!,
        eelvlBlock.worldPortalTargetSpawnPointId!,
      ])
    case EelvlBlockId.SWITCH_LOCAL_TOGGLE:
      return createBlock(PwBlockName.SWITCH_LOCAL_TOGGLE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_LOCAL_ACTIVATOR:
      return getEelvlToPwSwitchActivatorBlock(eelvlBlock, PwBlockName.SWITCH_LOCAL_ACTIVATOR)
    case EelvlBlockId.SWITCH_LOCAL_DOOR:
      return createBlock(PwBlockName.SWITCH_LOCAL_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_LOCAL_GATE:
      return createBlock(PwBlockName.SWITCH_LOCAL_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_GLOBAL_TOGGLE:
      return createBlock(PwBlockName.SWITCH_GLOBAL_TOGGLE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_GLOBAL_ACTIVATOR:
      return getEelvlToPwSwitchActivatorBlock(eelvlBlock, PwBlockName.SWITCH_GLOBAL_ACTIVATOR)
    case EelvlBlockId.SWITCH_GLOBAL_DOOR:
      return createBlock(PwBlockName.SWITCH_GLOBAL_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_GLOBAL_GATE:
      return createBlock(PwBlockName.SWITCH_GLOBAL_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.HAZARD_DEATH_DOOR:
      return createBlock(PwBlockName.HAZARD_DEATH_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.HAZARD_DEATH_GATE:
      return createBlock(PwBlockName.HAZARD_DEATH_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.NOTE_DRUM:
      return getEelvlToPwNoteBlock(eelvlBlock, PwBlockName.NOTE_DRUM)
    case EelvlBlockId.NOTE_PIANO:
      return getEelvlToPwNoteBlock(eelvlBlock, PwBlockName.NOTE_PIANO)
    case EelvlBlockId.NOTE_GUITAR:
      return getEelvlToPwNoteBlock(eelvlBlock, PwBlockName.NOTE_GUITAR)
    // TODO: Awaiting fix
    case EelvlBlockId.BORDER_GLOW_CUP_LEFT:
      switch (eelvlBlock.intParameter) {
        case 1:
          return createBlock(PwBlockName.BORDER_GLOW_CUP_RIGHT)
        case 2:
          return createBlock(PwBlockName.BORDER_GLOW_CUP_BOTTOM)
        case 3:
          return createBlock(PwBlockName.BORDER_GLOW_CUP_LEFT)
        case 0:
          return createBlock(PwBlockName.BORDER_GLOW_CUP_TOP)
        default:
          return createBlock(PwBlockName.EMPTY)
      }
    // TODO: Awaiting fix
    case EelvlBlockId.BORDER_GLOW_STRAIGHT_HORIZONTAL:
      switch (eelvlBlock.intParameter) {
        case 1:
          return createBlock(PwBlockName.BORDER_GLOW_STRAIGHT_HORIZONTAL)
        case 0:
          return createBlock(PwBlockName.BORDER_GLOW_STRAIGHT_VERTICAL)
        default:
          return createBlock(PwBlockName.EMPTY)
      }
    // NOTE: PW Devs will not fix this
    case EelvlBlockId.CHRISTMAS_GIFT_HALF_RED:
      return createBlock(PwBlockName.CHRISTMAS_GIFT_HALF_RED)
    // NOTE: PW Devs will not fix this
    case EelvlBlockId.CHRISTMAS_GIFT_HALF_GREEN:
      return createBlock(PwBlockName.CHRISTMAS_GIFT_HALF_GREEN)
    // NOTE: PW Devs will not fix this
    case EelvlBlockId.CHRISTMAS_GIFT_HALF_WHITE:
      return createBlock(PwBlockName.CHRISTMAS_GIFT_HALF_WHITE)
    // NOTE: PW Devs will not fix this
    case EelvlBlockId.CHRISTMAS_GIFT_HALF_BLUE:
      return createBlock(PwBlockName.CHRISTMAS_GIFT_HALF_BLUE)
    // NOTE: PW Devs will not fix this
    case EelvlBlockId.CHRISTMAS_GIFT_HALF_YELLOW:
      return createBlock(PwBlockName.CHRISTMAS_GIFT_HALF_YELLOW)
    case EelvlBlockId.OUTERSPACE_SIGN_GREEN:
      return createBlock(PwBlockName.OUTERSPACE_SIGN_GREEN, [''])

    default: {
      const eelvlBlockName = EelvlBlockId[eelvlBlock.blockId]
      if (eelvlBlockName === undefined) {
        return createMissingBlockSign(`Unknown Block ID: ${eelvlBlock.blockId}`)
      }

      const pwBlock = getPwBlocksByEelvlParameters().get(
        eelvlBlock.intParameter === undefined ? [eelvlBlock.blockId] : [eelvlBlock.blockId, eelvlBlock.intParameter],
      )

      if (pwBlock !== undefined) {
        return new Block(pwBlock.Id)
      }

      const pwBlockMorph0 = getPwBlocksByEelvlParameters().get(
        eelvlBlock.intParameter === undefined ? [eelvlBlock.blockId] : [eelvlBlock.blockId, 0],
      )

      if (pwBlockMorph0 !== undefined) {
        return createUnknownParameterBlockSign(
          `Unknown block parameter. Name: ${eelvlBlockName}, parameter: ${eelvlBlock.intParameter}`,
        )
      }

      if (eelvlLayer !== EelvlLayer.BACKGROUND) {
        return createMissingBlockSign(`Missing PixelWalker block: ${eelvlBlockName}`)
      } else {
        return createBlock(PwBlockName.EMPTY)
      }
    }
  }
}

function createMissingBlockSign(message: string): Block {
  return createBlock(PwBlockName.SIGN_NORMAL, [message])
}

export function createUnknownParameterBlockSign(message: string): Block {
  return createBlock(PwBlockName.SIGN_GREEN, [message])
}

function getEelvlToPwEffectsJumpHeightBlock(eelvlBlock: EelvlBlock): Block {
  const jumpHeight = eelvlBlock.intParameter
  switch (jumpHeight) {
    case 2:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [2])
    case 0:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [3])
    case 1:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [6])
    default:
      return createUnknownParameterBlockSign(
        `Unknown block parameter. Name: ${PwBlockName.EFFECTS_JUMP_HEIGHT}, parameter: ${jumpHeight}`,
      )
  }
}

function getEelvlToPwEffectsSpeedBlock(eelvlBlock: EelvlBlock): Block {
  const speed = eelvlBlock.intParameter
  switch (speed) {
    case 2:
      return createBlock(PwBlockName.EFFECTS_SPEED, [60])
    case 0:
      return createBlock(PwBlockName.EFFECTS_SPEED, [100])
    case 1:
      return createBlock(PwBlockName.EFFECTS_SPEED, [150])
    default:
      return createUnknownParameterBlockSign(
        `Unknown block parameter. Name: ${PwBlockName.EFFECTS_SPEED}, parameter: ${speed}`,
      )
  }
}

function getEelvlToPwEffectsGravityForceBlock(eelvlBlock: EelvlBlock): Block {
  const gravityForce = eelvlBlock.intParameter
  switch (gravityForce) {
    case 1:
      return createBlock(PwBlockName.EFFECTS_GRAVITYFORCE, [15])
    case 0:
      return createBlock(PwBlockName.EFFECTS_GRAVITYFORCE, [100])
    default:
      return createUnknownParameterBlockSign(
        `Unknown block parameter. Name: ${PwBlockName.EFFECTS_GRAVITYFORCE}, parameter: ${gravityForce}`,
      )
  }
}

function getEelvlToPwEffectsMultiJumpBlock(eelvlBlock: EelvlBlock): Block {
  let jumpCount = eelvlBlock.intParameter!
  if (jumpCount === 1000) {
    jumpCount = -1 // PW uses -1 as infinite jumps
  }
  return createBlock(PwBlockName.EFFECTS_MULTI_JUMP, [jumpCount])
}

function getEelvlToPwPortalBlock(eelvlBlock: EelvlBlock): Block {
  const rotation = eelvlBlock.intParameter!
  let pwBlockName
  const portalId = eelvlBlock.portalId!
  const portalTarget = eelvlBlock.portalTarget!
  const eelvlBlockId = eelvlBlock.blockId as EelvlBlockId
  switch (rotation) {
    case 1:
      pwBlockName =
        eelvlBlockId === EelvlBlockId.PORTAL_VISIBLE_LEFT
          ? PwBlockName.PORTAL_VISIBLE_LEFT
          : PwBlockName.PORTAL_INVISIBLE_LEFT
      break
    case 2:
      pwBlockName =
        eelvlBlockId === EelvlBlockId.PORTAL_VISIBLE_LEFT
          ? PwBlockName.PORTAL_VISIBLE_UP
          : PwBlockName.PORTAL_INVISIBLE_UP
      break
    case 3:
      pwBlockName =
        eelvlBlockId === EelvlBlockId.PORTAL_VISIBLE_LEFT
          ? PwBlockName.PORTAL_VISIBLE_RIGHT
          : PwBlockName.PORTAL_INVISIBLE_RIGHT
      break
    case 0:
      pwBlockName =
        eelvlBlockId === EelvlBlockId.PORTAL_VISIBLE_LEFT
          ? PwBlockName.PORTAL_VISIBLE_DOWN
          : PwBlockName.PORTAL_INVISIBLE_DOWN
      break
    default:
      pwBlockName =
        eelvlBlockId === EelvlBlockId.PORTAL_VISIBLE_LEFT
          ? PwBlockName.PORTAL_VISIBLE_LEFT
          : PwBlockName.PORTAL_INVISIBLE_LEFT
      break
  }
  return createBlock(pwBlockName, [portalId.toString(), portalTarget.toString()])
}

function getEelvlToPwNoteBlock(eelvlBlock: EelvlBlock, pwBlockName: PwBlockName): Block {
  let noteValue = eelvlBlock.intParameter as number
  if (pwBlockName === PwBlockName.NOTE_PIANO) {
    noteValue += 27
  }
  const noteBuffer = Buffer.from([noteValue])

  return createBlock(pwBlockName, [noteBuffer])
}

function getEelvlToPwSwitchActivatorBlock(eelvlBlock: EelvlBlock, pwBlockName: PwBlockName): Block {
  return createBlock(pwBlockName, [eelvlBlock.intParameter!, 0])
}
