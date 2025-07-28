<script lang="ts" setup>
import { ref } from 'vue'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'
import { PlayerIOClient } from '@/playerio-lib'
import { EelvlFileHeader } from '@/type/WorldData.ts'
import { ByteArray } from '@/class/ByteArray.ts'
import { vec2 } from '@basementuniverse/vec'
import { EelvlBlockId, EelvlBlockIdKeys } from '@/gen/EelvlBlockId.ts'
import { GameError } from '@/class/GameError.ts'
import { importFromEelvl } from '@/service/EelvlImporterService.ts'
import { writePositionsByteArrays } from '@/service/EelvlExporterService.ts'
import { EerBlockId } from '@/gen/EerBlockId.ts'
import PiTextField from '@/component/PiTextField.vue'
import { VForm } from 'vuetify/components'
import { EerBlockEntry } from '@/type/EerBlockEntry.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import { hasEerBlockOneIntParameter, isEerNpc } from '@/service/EerUtilService.ts'
import { EerLayer } from '@/enum/EerLayer.ts'
import { EelvlLayer } from '@/enum/EelvlLayer.ts'

const eerRoomId = ref('PWvIah2iVBdEI') // all blocks
// const eerRoomId = ref('PWOkI6DDRcdEI') // 25x25 test world

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

const loadingOverlay = ref(false)

async function getPIOClient() {
  const client = await PlayerIOClient.authenticate('everybody-edits-v226-5ugofmmni06qbc11k5tqq', 'public', {
    username: 'guest',
    password: 'guest',
  })
  console.log('Successfully logged in as guest')
  return client
}

function getBlockArgs(eerBlockId: number, eerBlock: EerBlock): EerBlockEntry {
  switch (eerBlockId as EerBlockId) {
    case EerBlockId.PORTAL_VISIBLE_LEFT:
    case EerBlockId.PORTAL_INVISIBLE_LEFT:
      return [eerBlock.rotation, eerBlock.id, eerBlock.target]
    case EerBlockId.SIGN_NORMAL:
      return [eerBlock.text, eerBlock.signtype]
    case EerBlockId.PORTAL_WORLD:
      // return [EerBlock.worldPortalTargetWorldId, EerBlock.worldPortalTargetSpawnPointId]
      return ['test', 0]
    case EerBlockId.LABEL:
      return [eerBlock.text, eerBlock.text_color, eerBlock.wrapLength]
    default:
      if (hasEerBlockOneIntParameter(eerBlockId)) {
        if (eerBlock.rotation !== undefined) {
          return [eerBlock.rotation]
        } else if (eerBlock.goal !== undefined) {
          return [eerBlock.goal]
        } else if (eerBlock.id !== undefined) {
          return [eerBlock.id]
        } else {
          throw new GameError(`EER block ${EerBlockId[eerBlockId as EelvlBlockId]} has no parameters`)
        }
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

function getExportedToEERData(eerWorld: EerWorld): Buffer {
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
  bytes.writeUTF(world.ownerName)
  bytes.writeUTF(world.name)
  bytes.writeInt(world.width)
  bytes.writeInt(world.height)
  bytes.writeFloat(world.gravMultiplier)
  bytes.writeUnsignedInt(world.backgroundColor)
  bytes.writeUTF(world.description)
  bytes.writeBoolean(world.isCampaign)
  bytes.writeUTF(world.crewId)
  bytes.writeUTF(world.crewName)
  bytes.writeInt(world.crewStatus)
  bytes.writeBoolean(world.minimapEnabled)
  bytes.writeUTF(world.ownerId)

  for (const block of eerWorld.worlddata) {
    const eerBlockId: number = block.type
    const eerLayer: number = block.layer
    const positions = getPositionsAsVec2Array(block)
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
    const blockArgs = getBlockArgs(eerBlockId, block)

    try {
      for (const blockArg of blockArgs) {
        if (typeof blockArg === 'string') {
          bytes.writeUTF(blockArg)
        } else if (typeof blockArg === 'number') {
          bytes.writeInt(blockArg)
        } else {
          console.error('block: ', block)
          console.error(`EelvlBlockId: ${EelvlBlockId[eerBlockId as EelvlBlockId]}`)
          console.error(`EerBlockId: ${EerBlockId[eerBlockId as EerBlockId]}`)
          throw new GameError(`Unexpected type in key. Value: ${blockArg}, type: ${typeof blockArg}`)
        }
      }
    } catch (e) {
      console.error('Error while writing block args: ', e)
      console.error('Block: ', block)
      console.error(`EelvlBlockId: ${EelvlBlockId[eerBlockId as EelvlBlockId]}`)
      console.error(`EerBlockId: ${EerBlockId[eerBlockId as EerBlockId]}`)
      throw e
    }
  }

  bytes.compress()

  return bytes.buffer
}

function getPositionsAsVec2Array(data: EerBlock): vec2[] {
  if (data.x && data.y) {
    const positions: vec2[] = []
    for (let k = 0; k < data.x.length; k += 2) {
      const xVal = (data.x[k] << 8) + data.x[k + 1]
      const yVal = (data.y[k] << 8) + data.y[k + 1]
      positions.push(vec2(xVal, yVal))
    }
    return positions
  } else if (data.x1 && data.y1) {
    return data.x1.map((x, i) => vec2(x, data.y1![i]))
  }

  throw new Error('Unknown position array')
}

async function getEERdata() {
  const client = await getPIOClient()
  const worldMeta = await client.bigDB.load('Worlds', eerRoomId.value)
  const world: EerWorld = worldMeta!.dbCurrent as EerWorld
  console.log('worldMeta: ', worldMeta)

  // TODO: check if worlddata exists, because if not, it means world has not been edited/saved?
  const eelvlData = getExportedToEERData(world)
  await importFromEelvl(eelvlData)
}

async function onImportEerButtonClick() {
  await withLoading(loadingOverlay, async () => {
    await getEERdata()
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>

  <PiCardContainer>
    <v-form ref="form" validate-on="submit lazy" @submit.prevent="onImportEerButtonClick">
      <v-col>
        <v-row>
          <PiTextField v-model="eerRoomId" :required="true" label="EER Room ID (type /roomid to get it)"></PiTextField>
        </v-row>
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePWClientStore().isConnected" color="green" type="submit"
                >Import from EER
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-col>
    </v-form>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
