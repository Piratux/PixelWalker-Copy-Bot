import { PlayerIOClient } from '@/playerio-lib'
import { EerBlockEntry } from '@/type/EerBlockEntry.ts'
import { EerBlockId } from '@/gen/EerBlockId.ts'
import { hasEerBlockOneIntParameter, isEerNpc } from '@/service/EerUtilService.ts'
import { GameError } from '@/class/GameError.ts'
import { EelvlBlockId, EelvlBlockIdKeys } from '@/gen/EelvlBlockId.ts'
import { ByteArray } from '@/class/ByteArray.ts'
import { vec2 } from '@basementuniverse/vec'
import { EelvlLayer } from '@/enum/EelvlLayer.ts'
import { writePositionsByteArrays } from '@/service/EelvlExporterService.ts'
import { EerLayer } from '@/enum/EerLayer.ts'
import { EelvlFileHeader } from '@/type/WorldData.ts'
import { createUnknownParameterBlockSign, importFromEelvl } from '@/service/EelvlImporterService.ts'
import { writeEeelvlFileHeader } from '@/service/EelvlUtilService.ts'
import { WorldBlock } from '@/type/WorldBlock.ts'
import { Block } from 'pw-js-world'
import { PwBlockName } from '@/gen/PwBlockName.ts'
import { placeMultipleBlocks } from '@/service/WorldService.ts'
import { getPwBlocksByEerParameters, getPwBlocksByPwName } from '@/store/PWClientStore.ts'

interface EerBlock {
  type: number
  layer: 0 | 1
  x?: number[]
  y?: number[]
  x1?: number[]
  y1?: number[]
  colour?: number
  target?: number
  rotation?: number
  text?: string
  signtype?: number
  text_color?: string
  wrapLength?: number
  id?: number
  goal?: number
  mes1?: string
  mes2?: string
  mes3?: string
  name?: string
}

interface EerWorld {
  type: number
  width: number
  height: number
  owner: string
  plays: number
  name: string
  worldDescription: string
  curseLimit: number
  zombieLimit: number
  backgroundColor: number
  worlddata: EerBlock[]
  HideLobby: number
  friendsOnly: number
  visible: boolean
  Favorites: number
  Likes: number
  Crew: string
}

async function getPIOClient() {
  const client = await PlayerIOClient.authenticate('everybody-edits-v226-5ugofmmni06qbc11k5tqq', 'public', {
    username: 'guest',
    password: 'guest',
  })
  console.log('Successfully logged in as guest')
  return client
}

function getEerBlockIntParameter(eerBlock: EerBlock) {
  if (eerBlock.rotation !== undefined) {
    return eerBlock.rotation
  } else if (eerBlock.goal !== undefined) {
    return eerBlock.goal
  } else if (eerBlock.id !== undefined) {
    return eerBlock.id
  } else {
    return undefined
  }
}

function getBlockArgs(eerBlockId: number, eerBlock: EerBlock): EerBlockEntry {
  switch (eerBlockId as EerBlockId) {
    case EerBlockId.PORTAL_VISIBLE_LEFT:
    case EerBlockId.PORTAL_INVISIBLE_LEFT:
      return [eerBlock.rotation, eerBlock.id, eerBlock.target]
    case EerBlockId.SIGN_NORMAL:
      return [eerBlock.text, eerBlock.signtype]
    case EerBlockId.PORTAL_WORLD:
      return [eerBlock.target, eerBlock.id]
    case EerBlockId.LABEL:
      return [eerBlock.text, eerBlock.text_color, eerBlock.wrapLength]
    default:
      if (hasEerBlockOneIntParameter(eerBlockId)) {
        const eerBlockIntParameter = getEerBlockIntParameter(eerBlock)
        if (eerBlockIntParameter === undefined) {
          throw new GameError(`EER block ${EerBlockId[eerBlockId as EerBlockId]} has no int parameter`)
        }
        return [eerBlockIntParameter]
      } else if (isEerNpc(eerBlockId)) {
        return [eerBlock.name, eerBlock.mes1, eerBlock.mes2, eerBlock.mes3]
      } else {
        return []
      }
  }
}

function placeUnknownBlockSign(bytes: ByteArray, eerBlockId: number, positions: vec2[]): void {
  bytes.writeInt(EelvlBlockId.SIGN_NORMAL)
  bytes.writeInt(EelvlLayer.FOREGROUND)
  writePositionsByteArrays(bytes, positions)
  bytes.writeUTF(`Unknown EER block ID: ${eerBlockId}`)
  bytes.writeInt(1)
}

function placeErrorBlockSign(bytes: ByteArray, eerBlockId: number, positions: vec2[]): void {
  bytes.writeInt(EelvlBlockId.SIGN_NORMAL)
  bytes.writeInt(EerLayer.FOREGROUND)
  writePositionsByteArrays(bytes, positions)
  bytes.writeUTF(`ERROR! Block should be properly converted! EER block ID: ${eerBlockId}`)
  bytes.writeInt(2)
}

// Take care of EER blocks that are not in EELVL, but are in PW.
// Or not in PW, but we still want to place better alternative than sign claiming missing block.
function tryConvertEerBlockToPwBlock(eerBlock: EerBlock): Block[] | null {
  const eerBlockId = eerBlock.type as EerBlockId
  const eerBlockIntParameter = getEerBlockIntParameter(eerBlock)
  switch (eerBlockId) {
    case EerBlockId.EFFECTS_GRAVITYFORCE:
      const gravityForce = eerBlockIntParameter
      switch (gravityForce) {
        case 1:
          return [new Block(PwBlockName.EFFECTS_GRAVITYFORCE, [15])]
        case 2:
          return [new Block(PwBlockName.EFFECTS_GRAVITYFORCE, [150])]
        case 0:
          return [new Block(PwBlockName.EFFECTS_GRAVITYFORCE, [100])]
        default:
          return [
            createUnknownParameterBlockSign(
              `Unknown block parameter. PalleteId: ${PwBlockName.EFFECTS_GRAVITYFORCE}, EER parameter: ${gravityForce}`,
            ),
          ]
      }
    // BEGIN NEW PASTEL CODE
    case EerBlockId.PASTEL_BLACK_BG:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x000000])] // Black
    case EerBlockId.PASTEL_GRAY_BG:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x9c9c9c])] // Gray
    case EerBlockId.PASTEL_WHITE_BG:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xffffff])] // White
    // END NEW PASTEL CODE
    // BEGIN SOLID FOREGROUND CODE
    case EerBlockId.SOLID_FOREGROUND_WHITE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xffffff]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_LIGHT_GRAY:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x808080]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_DARK_GRAY:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x5a5a5a]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_BLACK:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x000000]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_RED:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xff0000]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_ORANGE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xff6a00]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_YELLOW:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xffd400]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_LIME:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xc0ff00]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_GREEN:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x56ff00]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_TEAL:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x00ff7e]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_CYAN:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x00ffe8]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_LIGHT_BLUE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x00acff]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_DARK_BLUE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x1300ff]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_PURPLE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7d00ff]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_MAGENTA:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xe700ff]), new Block(PwBlockName.SECRET_INVISIBLE)]
    case EerBlockId.SOLID_FOREGROUND_PINK:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0xff00ad]), new Block(PwBlockName.SECRET_INVISIBLE)]
    // END SOLID FOREGROUND CODE
    // BEGIN SOLID BACKGROUND CODE
    case EerBlockId.SOLID_BACKGROUND_WHITE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7f7f7f])]
    case EerBlockId.SOLID_BACKGROUND_LIGHT_GRAY:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x404040])]
    case EerBlockId.SOLID_BACKGROUND_DARK_GRAY:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x2d2d2d])]
    case EerBlockId.SOLID_BACKGROUND_BLACK:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x000000])]
    case EerBlockId.SOLID_BACKGROUND_RED:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7f0000])]
    case EerBlockId.SOLID_BACKGROUND_ORANGE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7f3500])]
    case EerBlockId.SOLID_BACKGROUND_YELLOW:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7f6a00])]
    case EerBlockId.SOLID_BACKGROUND_LIME:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x607f00])]
    case EerBlockId.SOLID_BACKGROUND_GREEN:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x2b7f00])]
    case EerBlockId.SOLID_BACKGROUND_TEAL:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x007f3f])]
    case EerBlockId.SOLID_BACKGROUND_CYAN:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x007f74])]
    case EerBlockId.SOLID_BACKGROUND_LIGHT_BLUE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x00567f])]
    case EerBlockId.SOLID_BACKGROUND_DARK_BLUE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x09007f])]
    case EerBlockId.SOLID_BACKGROUND_PURPLE:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x3e007f])]
    case EerBlockId.SOLID_BACKGROUND_MAGENTA:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x73007f])]
    case EerBlockId.SOLID_BACKGROUND_PINK:
      return [new Block(PwBlockName.CUSTOM_SOLID_BG, [0x7f0056])]
    // END SOLID BACKGROUND CODE
    default:
      const pwBlock = getPwBlocksByEerParameters().get(
        eerBlockIntParameter === undefined ? [eerBlockId] : [eerBlockId, eerBlockIntParameter],
      )

      if (pwBlock !== undefined) {
        return [new Block(pwBlock.PaletteId.toUpperCase())]
      }

      const pwBlockMorph0 = getPwBlocksByEerParameters().get(
        eerBlockIntParameter === undefined ? [eerBlockId] : [eerBlockId, 0],
      )

      if (pwBlockMorph0 !== undefined) {
        return [
          createUnknownParameterBlockSign(
            `Unknown block parameter. PalleteId: ${pwBlockMorph0.PaletteId.toUpperCase()}, EER parameter: ${eerBlockIntParameter}`,
          ),
        ]
      }
      return null
  }
}

function getImportedFromEerAsEelvlAndPwData(eerWorld: EerWorld): [Buffer, WorldBlock[]] {
  const world: EelvlFileHeader = {
    ownerName: eerWorld.owner ?? 'Unknown',
    name: eerWorld.name ?? 'Untitled world',
    width: eerWorld.width,
    height: eerWorld.height,
    gravMultiplier: 1,
    backgroundColor: eerWorld.backgroundColor ?? 0,
    description: eerWorld.worldDescription ?? '',
    isCampaign: false,
    crewId: '',
    crewName: eerWorld.Crew ?? '',
    crewStatus: 0,
    minimapEnabled: true,
    ownerId: 'owner ID',
  }
  const bytes: ByteArray = new ByteArray(0)
  writeEeelvlFileHeader(bytes, world)

  const worldBlocks: WorldBlock[] = []

  for (const eerBlock of eerWorld.worlddata) {
    const eerBlockId: number = eerBlock.type
    const eerLayer: number = eerBlock.layer
    const positions = getPositionsAsVec2Array(eerBlock)

    const pwBlocks = tryConvertEerBlockToPwBlock(eerBlock)
    if (pwBlocks !== null) {
      for (const pos of positions) {
        for (const pwBlock of pwBlocks) {
          worldBlocks.push({
            block: pwBlock,
            pos: pos,
            layer: getPwBlocksByPwName()[pwBlock.name].Layer,
          })
        }
      }
      continue
    }

    if (!(eerBlockId in EerBlockId)) {
      if ((eerLayer as EerLayer) === EerLayer.FOREGROUND) {
        placeUnknownBlockSign(bytes, eerBlockId, positions)
      }
      continue
    }

    const eerBlockName = EerBlockId[eerBlockId as EerBlockId]
    if (!(eerBlockName in EelvlBlockId)) {
      if ((eerLayer as EerLayer) === EerLayer.FOREGROUND) {
        placeErrorBlockSign(bytes, eerBlockId, positions)
      }
      continue
    }

    const eelvlBlockId = EelvlBlockId[eerBlockName as EelvlBlockIdKeys]
    bytes.writeInt(eelvlBlockId)
    bytes.writeInt(eerLayer)
    writePositionsByteArrays(bytes, positions)
    const blockArgs = getBlockArgs(eerBlockId, eerBlock)

    for (const blockArg of blockArgs) {
      if (typeof blockArg === 'string') {
        bytes.writeUTF(blockArg)
      } else if (typeof blockArg === 'number') {
        bytes.writeInt(blockArg)
      } else {
        console.error('block: ', eerBlock)
        console.error(`EelvlBlockId: ${EelvlBlockId[eerBlockId as EelvlBlockId]}`)
        console.error(`EerBlockId: ${EerBlockId[eerBlockId as EerBlockId]}`)
        throw new GameError(`Unexpected type in key. Value: ${blockArg}, type: ${typeof blockArg}`)
      }
    }
  }

  bytes.compress()

  return [bytes.buffer, worldBlocks]
}

function getPositionsAsVec2Array(data: EerBlock): vec2[] {
  const vec2Array: vec2[] = []
  if (data.x && data.y) {
    for (let k = 0; k < data.x.length; k += 2) {
      const xVal = (data.x[k] << 8) + data.x[k + 1]
      const yVal = (data.y[k] << 8) + data.y[k + 1]
      vec2Array.push(vec2(xVal, yVal))
    }
  }
  if (data.x1 && data.y1) {
    vec2Array.push(...data.x1.map((x, i) => vec2(x, data.y1![i])))
  }
  return vec2Array
}

export async function importFromEer(eerRoomId: string) {
  const client = await getPIOClient()
  const worldMeta = await client.bigDB.load('Worlds', eerRoomId)
  const world: EerWorld = worldMeta!.dbCurrent as EerWorld
  console.log('worldMeta: ', worldMeta)

  // TODO: check if worlddata exists, because if not, it means world has not been edited/saved?
  const [eelvlData, pwData] = getImportedFromEerAsEelvlAndPwData(world)
  await importFromEelvl(eelvlData)
  await placeMultipleBlocks(pwData)
}
