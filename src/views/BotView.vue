<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getPwGameClient, getPwGameWorldHelper, usePWClientStore } from '@/stores/PWClientStore.ts'
import { useRouter } from 'vue-router'
import { LoginViewRoute } from '@/router/Routes.ts'
import { exportToEelvl } from '@/services/EelvlExporterService.ts'
import { exportToPwlvl } from '@/services/PwlvlExporterService.ts'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/services/FileService.ts'
import { sendGlobalChatMessage } from '@/services/ChatMessageService.ts'
import { importFromEelvl } from '@/services/EelvlImporterService.ts'
import { importFromPwlvl } from '@/services/PwlvlImporterService.ts'
import { withLoading } from '@/services/LoaderProxyService.ts'
import PiCardContainer from '@/components/PiCardContainer.vue'
import PiButton from '@/components/PiButton.vue'
import { createAsyncCallback } from '@/utils/Promise.ts'
import PiOverlay from '@/components/PiOverlay.vue'

const loadingOverlay = ref(false)

const PWClientStore = usePWClientStore()
const router = useRouter()

const importEelvlFileInput = ref<HTMLInputElement>()
const importPwlvlFileInput = ref<HTMLInputElement>()

const devViewEnabled = computed(() => import.meta.env.VITE_DEV_VIEW === 'TRUE')

const worldId = ref<string>(PWClientStore.worldId)
const worldName = ref<string>(getPwGameWorldHelper().meta?.title ?? '')

async function onDisconnectButtonClick() {
  await withLoading(loadingOverlay, async () => {
    getPwGameClient().disconnect(false)

    PWClientStore.setPwGameClient(undefined)
    PWClientStore.setPwApiClient(undefined)
    PWClientStore.worldId = ''
    PWClientStore.email = ''
    PWClientStore.password = ''
    PWClientStore.secretEditKey = ''
    await router.push({ name: LoginViewRoute.name })
  })
}

async function onExportEelvlButtonClick() {
  await withLoading(
    loadingOverlay,
    createAsyncCallback(() => {
      exportToEelvl()
    }),
  )
}

function onImportEelvlButtonClick() {
  importEelvlFileInput.value!.click()
}

async function onExportPwlvlButtonClick() {
  await withLoading(
    loadingOverlay,
    createAsyncCallback(() => {
      exportToPwlvl()
    }),
  )
}

function onImportPwlvlButtonClick() {
  importPwlvlFileInput.value!.click()
}

async function onEelvlFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    sendGlobalChatMessage(`Importing world from ${result.file.name}`)
    await importFromEelvl(result.data)
  })
}

async function onPwlvlFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    sendGlobalChatMessage(`Importing world from ${result.file.name}`)
    await importFromPwlvl(result.data)
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>
  <PiCardContainer>
    <v-col>
      <v-row>
        <h3>Connected to {{ `'${worldName}'` }}</h3>
      </v-row>
      <v-row>
        <a :href="`https://pixelwalker.net/world/${worldId}`" target="_blank">{{
          `https://pixelwalker.net/world/${worldId}`
        }}</a></v-row
      >
      <v-row>
        <PiButton color="red" @click="onDisconnectButtonClick">Disconnect</PiButton>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>Usage info</h3></v-row>
      <v-row>Type .help in world to learn usage.</v-row>
      <v-row
        >Bot runs fully in browser. So for best experience, keep this tab focused if possible. Otherwise, browser may
        decide to throttle the bot, which may lead to bot becoming unresponsive.
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row>
        <PiButton color="blue" @click="onExportEelvlButtonClick">Export to EELVL</PiButton>
      </v-row>
      <v-row>
        <input
          ref="importEelvlFileInput"
          accept=".eelvl"
          style="display: none"
          type="file"
          @change="onEelvlFileChange"
        />
        <PiButton color="blue" @click="onImportEelvlButtonClick">Import from EELVL</PiButton>
      </v-row>
      <v-row>
        <PiButton v-if="devViewEnabled" color="blue" @click="onExportPwlvlButtonClick">Export to PWLVL</PiButton>
      </v-row>
      <v-row>
        <input
          ref="importPwlvlFileInput"
          accept=".pwlvl"
          style="display: none"
          type="file"
          @change="onPwlvlFileChange"
        />
        <PiButton v-if="devViewEnabled" color="blue" @click="onImportPwlvlButtonClick">Import from PWLVL</PiButton>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>Export info</h3></v-row>
      <v-row>
        EELVL doesn't have:
        <ul>
          <li>Climbable horizontal chains and rope.</li>
          <li>
            Local/global switch activator block. EELVL has limited version of this, that is equivalent to switch
            activator, that always sets switch state to off. If switch activator is set to off, it'll be replaced with
            EELVL equivalent. If switch activator is set to on, it'll be replaced with normal sign that contains switch
            id and on/off value.
          </li>
          <li>Local/global switch resetter block.</li>
          <li>
            Multiple notes per music block - in EELVL it's limited to 1. If there is 1 note, it's replaced with note.
            Otherwise, replaced with text sign containing notes.
          </li>
          <li>Cyan and magenta spikes.</li>
          <li>Generic yellow face smile/frown block.</li>
          <li>
            All 4 rotation variants of corner decorations. Usually it has just 2 rotation variants (like snow, web,
            beach sand, etc.).
          </li>
          <li>Green sign.</li>
          <li>Purple mineral block.</li>
          <li>Plate with cake chocolate and pie cherry.</li>
          <li>
            A use for world portal. There is no way to enter PixelWalker world id and then open browser to join it. So
            it's always replaced with world id pointing to "Current" with id 1.
          </li>
          <li>A use for world portal spawn. Same as world portal, so id always replaced with 1.</li>
          <li>Hex Backgrounds.</li>
          <li>Counter blocks.</li>
          <li>Orange, yellow, cyan and purple canvas foreground blocks.</li>
          <li>Bronze and silver colours of gilded block pack</li>
          <li>
            Multiple layers: some blocks like water or fog are placed on overlay layer. If there are blocks in overlay
            and foreground layer, blocks in overlay layer are not exported
          </li>
        </ul>
      </v-row>
      <v-row>All missing blocks are replaced with sign (except for backgrounds).</v-row>
      <v-row>
        <br />
        Fun fact: Signs only let you enter 140 characters in EE: Offline. But it will happily accept EELVL file which
        has sign with more than 140 characters and will correctly show in game.
      </v-row>

      <v-row>
        <h3><br />Import info</h3></v-row
      >
      <v-row>
        PixelWalker doesn't have:
        <ul>
          <li>Block for picked up gold/blue coin [110, 111].</li>
          <li>Timed gate/door [156, 157].</li>
          <li>Trophy [223, 478 - 480, 484 - 486, 1540 - 1542].</li>
          <li>Label [1000].</li>
          <li>Poison effect [1584].</li>
          <li>Gold gate/door [200, 201].</li>
          <li>Fireworks decoration [1581].</li>
          <li>Golden easter egg decoration [1591].</li>
          <li>Green space decoration [1603].</li>
          <li>Shadow [1596, 1605 - 1617].</li>
          <li>NPC [1550 - 1559, 1569 - 1579].</li>
          <li>Zombie and curse effect duration is limited to 720 seconds, but in EELVL limit is 999 seconds.</li>
        </ul>
      </v-row>
      <v-row>All missing blocks replaced with signs of block name.</v-row>
      <v-row>Note: Numbers in [] brackets represent EELVL block ids.</v-row>
    </v-col>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
