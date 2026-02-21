import { ByteArray } from 'playerioclient'
import { EelvlBlockId } from '@/webtool/eelvl/gen/EelvlBlockId.ts'
import { Block, BlockArg, DeserialisedStructure, ILabel, LayerType, TextAlignment } from 'pw-js-world'
import { EelvlBlock } from '@/webtool/eelvl/type/EelvlBlock.ts'
import { vec2 } from '@basementuniverse/vec'
import { EelvlFileHeader } from '@/webtool/eelvl/type/EelvlFileHeader.ts'
import { PwBlockName } from '@/core/gen/PwBlockName.ts'
import { getBlockLayer, placeWorldDataBlocks, replaceAllLabels } from '@/core/service/WorldService.ts'
import { getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { cloneDeep } from 'lodash-es'
import { handlePlaceBlocksResult, requireBotEditPermission } from '@/core/service/PwClientService.ts'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import {
  getEelvlToPwDrumTypeMap,
  hasEelvlBlockOneIntParameter,
  isEelvlNpc,
} from '@/webtool/eelvl/service/EelvlUtilService.ts'
import { EelvlLayer } from '@/webtool/eelvl/enum/EelvlLayer.ts'
import { useEelvlClientStore } from '@/webtool/eelvl/store/EelvlClientStore.ts'
import { EelvlImportResult } from '@/webtool/eelvl/type/EelvlImportResult.ts'
import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'
import { colourToUint32, hexStringToColour } from '@/core/util/Colours.ts'

export function getImportedFromEelvlData(fileData: ArrayBuffer): EelvlImportResult {
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

  const labels: ILabel[] = []
  const missingBlocks: MissingBlockInfo[] = []

  while (bytes.hashposition < bytes.length) {
    const eelvlBlockId = bytes.readInt()
    const eelvlLayer = bytes.readInt()
    const blockPositions = readPositionsByteArrays(bytes)
    const eelvlBlock: EelvlBlock = readEelvlBlock(bytes, eelvlBlockId)

    if ((eelvlBlockId as EelvlBlockId) === EelvlBlockId.EMPTY) {
      continue
    }

    const pwBlockOrLabelOrMissingBlockInfo: Block | ILabel | string = mapBlockIdEelvlToPw(eelvlBlock, eelvlLayer)
    let pwBlock: Block
    if (typeof pwBlockOrLabelOrMissingBlockInfo === 'string') {
      pwBlock = createMissingBlockSign(pwBlockOrLabelOrMissingBlockInfo)
      for (const pos of blockPositions) {
        missingBlocks.push({ pos: pos, info: pwBlockOrLabelOrMissingBlockInfo })
      }
    } else if (pwBlockOrLabelOrMissingBlockInfo instanceof Block) {
      pwBlock = pwBlockOrLabelOrMissingBlockInfo
    } else {
      for (const pos of blockPositions) {
        const PW_MAX_LABELS_IN_WORLD = 50
        if (labels.length < PW_MAX_LABELS_IN_WORLD) {
          const gridAdjustedPos = vec2.mul(pos, vec2(16, 16))
          const offsetPos = vec2.add(gridAdjustedPos, vec2(3, 3))
          const flooredPos = vec2.map(offsetPos, Math.floor)
          // NOTE: Font in PW labels differ from EE labels, so this is best effort to make it look similar
          labels.push({ ...pwBlockOrLabelOrMissingBlockInfo, position: flooredPos })
        } else if (pos.x >= 0 && pos.y >= 0 && pos.x < pwMapWidth && pos.y < pwMapHeight) {
          pwBlock3DArray[LayerType.Foreground][pos.x][pos.y] = createMissingBlockSign(
            `Label limit of ${PW_MAX_LABELS_IN_WORLD} reached. Label text: ${eelvlBlock.labelText}`,
          )
        }
      }
      continue
    }
    const pwLayer = getBlockLayer(pwBlock.bId)
    for (const pos of blockPositions) {
      if (pos.x >= 0 && pos.y >= 0 && pos.x < pwMapWidth && pos.y < pwMapHeight) {
        pwBlock3DArray[pwLayer][pos.x][pos.y] = cloneDeep(pwBlock)
      }
    }
  }

  const deserialisedStructure = new DeserialisedStructure(pwBlock3DArray, { width: pwMapWidth, height: pwMapHeight })
  applyWorldBackground(deserialisedStructure, pwMapWidth, pwMapHeight, world.backgroundColor)
  return {
    blocks: deserialisedStructure,
    labels: labels,
    missingBlocks: missingBlocks,
  }
}

function applyWorldBackground(
  deserialisedStructure: DeserialisedStructure,
  pwMapWidth: number,
  pwMapHeight: number,
  backgroundColor: number,
) {
  if (backgroundColor === 0) {
    return
  }

  backgroundColor = backgroundColor & 0xffffff // Remove transparency

  for (let x = 0; x < pwMapWidth; x++) {
    for (let y = 0; y < pwMapHeight; y++) {
      const hasBackground = deserialisedStructure.blocks[LayerType.Background][x][y].bId !== 0
      if (!hasBackground) {
        deserialisedStructure.blocks[LayerType.Background][x][y] = new Block(PwBlockName.CUSTOM_SOLID_BG, [
          backgroundColor,
        ])
      }
    }
  }
}

export async function importFromEelvl(fileData: ArrayBuffer): Promise<MissingBlockInfo[]> {
  requireBotEditPermission(getPwGameWorldHelper())

  const eelvlImportResult = getImportedFromEelvlData(fileData)
  const success = await placeWorldDataBlocks(eelvlImportResult.blocks)
  handlePlaceBlocksResult(success)
  replaceAllLabels(eelvlImportResult.labels)

  return eelvlImportResult.missingBlocks
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

  for (let i = 0; i < positionsX.length / 2; i++) {
    positions.push(vec2(positionsX.readUnsignedShort(), positionsY.readUnsignedShort()))
  }

  return positions
}

export function createBlock(pwBlockName: PwBlockName, args?: BlockArg[]): Block {
  return new Block(pwBlockName, args)
}

function mapBlockIdEelvlToPw(eelvlBlock: EelvlBlock, eelvlLayer: EelvlLayer): Block | ILabel | string {
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
    case EelvlBlockId.EFFECTS_POISON:
      return createBlock(PwBlockName.EFFECTS_POISON, [eelvlBlock.intParameter!])
    case EelvlBlockId.EFFECTS_GRAVITY_FORCE:
      return getEelvlToPwEffectsGravityForceBlock(eelvlBlock)
    case EelvlBlockId.EFFECTS_MULTI_JUMP:
      return getEelvlToPwEffectsMultiJumpBlock(eelvlBlock)
    case EelvlBlockId.TOOL_PORTAL_WORLD_SPAWN:
      return createBlock(PwBlockName.TOOL_PORTAL_WORLD_SPAWN, [eelvlBlock.intParameter!.toString()])
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
      return new Block(PwBlockName.PORTAL_WORLD, {
        target: eelvlBlock.worldPortalTargetWorldId!,
        spawn_id: '', // Avoiding error: "INFO: Invalid block: You do not have permission to specify a spawn ID for worlds you don't own."
      })
    case EelvlBlockId.SWITCH_LOCAL_TOGGLE:
      return createBlock(PwBlockName.SWITCH_LOCAL_TOGGLE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_LOCAL_ACTIVATOR:
      return getEelvlToPwSwitchActivatorBlock(eelvlBlock, true)
    case EelvlBlockId.SWITCH_LOCAL_DOOR:
      return createBlock(PwBlockName.SWITCH_LOCAL_DOOR, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_LOCAL_GATE:
      return createBlock(PwBlockName.SWITCH_LOCAL_GATE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_GLOBAL_TOGGLE:
      return createBlock(PwBlockName.SWITCH_GLOBAL_TOGGLE, [eelvlBlock.intParameter!])
    case EelvlBlockId.SWITCH_GLOBAL_ACTIVATOR:
      return getEelvlToPwSwitchActivatorBlock(eelvlBlock, false)
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
    // It doesn't matter which one is time door and which one is time gate as they're symmetrical
    case EelvlBlockId.TIMEDOOR:
      return new Block(PwBlockName.TIME_DOOR, {
        time: 500,
        offset: 500,
        hide_clock: false,
      })
    case EelvlBlockId.TIMEGATE:
      return new Block(PwBlockName.TIME_DOOR, {
        time: 500,
        offset: 0,
        hide_clock: false,
      })
    case EelvlBlockId.LABEL:
      return getEelvlToPwLabel(eelvlBlock)
    // NOTE: This is not 1 to 1 mapping
    case EelvlBlockId.FIREWORKS:
      return new Block(PwBlockName.FIREWORKS, {
        start_color: 16711680,
        fade_to_color: 16777215,
        shape: 0,
        size_max: 8,
      })
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

    default: {
      const eelvlBlockName = EelvlBlockId[eelvlBlock.blockId]
      if (eelvlBlockName === undefined) {
        return `Unknown Block ID: ${eelvlBlock.blockId}`
      }

      const pwBlock = useEelvlClientStore().blocksByParameters.get(
        eelvlBlock.intParameter === undefined ? [eelvlBlock.blockId] : [eelvlBlock.blockId, eelvlBlock.intParameter],
      )

      if (pwBlock !== undefined) {
        if (pwBlock.Fields !== undefined && pwBlock.Fields.length > 0) {
          const args = {}
          for (const field of pwBlock.Fields) {
            if (field.DefaultValue === undefined) {
              switch (field.Type) {
                case 'String':
                  // @ts-expect-error args is dynamic
                  args[field.Name] = ''
                  break
                case 'Int32':
                case 'UInt32':
                  // @ts-expect-error args is dynamic
                  args[field.Name] = 0
                  break
                case 'Boolean':
                  // @ts-expect-error args is dynamic
                  args[field.Name] = false
                  break
                default:
                  break
              }
            } else {
              if (pwBlock.PaletteId.startsWith('BORDER_') && field.Name === 'color') {
                // @ts-expect-error args is dynamic
                args[field.Name] = 0
              } else {
                // @ts-expect-error args is dynamic
                args[field.Name] = field.DefaultValue
              }
            }
          }
          return new Block(pwBlock.Id, args)
        } else {
          return new Block(pwBlock.Id)
        }
      }

      const pwBlockMorph0 = useEelvlClientStore().blocksByParameters.get(
        eelvlBlock.intParameter === undefined ? [eelvlBlock.blockId] : [eelvlBlock.blockId, 0],
      )

      if (pwBlockMorph0 !== undefined) {
        return `Unknown block parameter. Name: ${eelvlBlockName}, parameter: ${eelvlBlock.intParameter}`
      }

      if (isEelvlNpc(eelvlBlock.blockId)) {
        return `Missing PixelWalker block: ${eelvlBlockName},\nnpcName: ${eelvlBlock.npcName},\nmessage1: ${eelvlBlock.npcMessage1},\nmessage2: ${eelvlBlock.npcMessage2},\nmessage3: ${eelvlBlock.npcMessage3}`
      }

      if (eelvlLayer !== EelvlLayer.BACKGROUND) {
        return `Missing PixelWalker block: ${eelvlBlockName}`
      } else {
        return createBlock(PwBlockName.EMPTY)
      }
    }
  }
}

function createMissingBlockSign(message: string): Block {
  return createBlock(PwBlockName.SIGN_NORMAL, [message])
}

function getEelvlToPwEffectsJumpHeightBlock(eelvlBlock: EelvlBlock): Block | string {
  const jumpHeight = eelvlBlock.intParameter
  switch (jumpHeight) {
    case 2:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [75])
    case 0:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [100])
    case 1:
      return createBlock(PwBlockName.EFFECTS_JUMP_HEIGHT, [130])
    default:
      return `Unknown block parameter. Name: ${PwBlockName.EFFECTS_JUMP_HEIGHT}, parameter: ${jumpHeight}`
  }
}

function getEelvlToPwEffectsSpeedBlock(eelvlBlock: EelvlBlock): Block | string {
  const speed = eelvlBlock.intParameter
  switch (speed) {
    case 2:
      return createBlock(PwBlockName.EFFECTS_SPEED, [60])
    case 0:
      return createBlock(PwBlockName.EFFECTS_SPEED, [100])
    case 1:
      return createBlock(PwBlockName.EFFECTS_SPEED, [150])
    default:
      return `Unknown block parameter. Name: ${PwBlockName.EFFECTS_SPEED}, parameter: ${speed}`
  }
}

function getEelvlToPwEffectsGravityForceBlock(eelvlBlock: EelvlBlock): Block | string {
  const gravityForce = eelvlBlock.intParameter
  switch (gravityForce) {
    case 1:
      return createBlock(PwBlockName.EFFECTS_GRAVITY_FORCE, [15])
    case 0:
      return createBlock(PwBlockName.EFFECTS_GRAVITY_FORCE, [100])
    default:
      return `Unknown block parameter. Name: ${PwBlockName.EFFECTS_GRAVITY_FORCE}, parameter: ${gravityForce}`
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

function getEelvlToPwNoteBlock(eelvlBlock: EelvlBlock, pwBlockName: PwBlockName): Block | string {
  let noteValue = eelvlBlock.intParameter!
  if (pwBlockName === PwBlockName.NOTE_PIANO) {
    noteValue += 27
  }
  if (pwBlockName === PwBlockName.NOTE_DRUM) {
    if (getEelvlToPwDrumTypeMap().get(noteValue) === undefined) {
      return `Unknown block parameter. Name: ${pwBlockName}, parameter: ${noteValue}`
    }
    noteValue = getEelvlToPwDrumTypeMap().get(noteValue)!
  }
  const noteBuffer = Uint8Array.from([noteValue])

  return createBlock(pwBlockName, [noteBuffer])
}

function getEelvlToPwSwitchActivatorBlock(eelvlBlock: EelvlBlock, isLocal: boolean): Block {
  const switchId = eelvlBlock.intParameter!
  if (switchId === 1000) {
    const pwBlockName = isLocal ? PwBlockName.SWITCH_LOCAL_RESETTER : PwBlockName.SWITCH_GLOBAL_RESETTER
    return createBlock(pwBlockName, [false])
  }

  const pwBlockName = isLocal ? PwBlockName.SWITCH_LOCAL_ACTIVATOR : PwBlockName.SWITCH_GLOBAL_ACTIVATOR
  return createBlock(pwBlockName, [false, eelvlBlock.intParameter!])
}

function getEelvlToPwLabel(eelvlBlock: EelvlBlock): ILabel {
  return {
    id: '', // TODO: Waiting for fix
    position: vec2(0, 0), // Position set elsewhere
    text: eelvlBlock.labelText!,
    color: colourToUint32({ ...hexStringToColour(eelvlBlock.labelTextColor!), a: 255 }),
    maxWidth: -1,
    shadow: true,
    textAlignment: TextAlignment.LEFT,
    fontSize: 12,
    characterSpacing: 0,
    lineSpacing: 0,
    renderLayer: LayerType.Foreground,
    shadowColor: colourToUint32({ r: 0, g: 0, b: 0, a: 50 }),
    shadowOffsetX: 1,
    shadowOffsetY: 1,
  }
}
