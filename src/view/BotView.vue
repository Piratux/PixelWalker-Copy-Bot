<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getPwGameClient, getPwGameWorldHelper, usePWClientStore } from '@/store/PWClientStore.ts'
import { useRouter } from 'vue-router'
import { LoginViewRoute } from '@/router/Routes.ts'
import { exportToEelvl } from '@/service/EelvlExporterService.ts'
import { exportToPwlvl } from '@/service/PwlvlExporterService.ts'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromEelvl } from '@/service/EelvlImporterService.ts'
import { importFromPng } from '@/service/PngImporterService.ts'
import { importFromMidi } from '@/service/MidiImporterService.ts'
import { importFromPwlvl } from '@/service/PwlvlImporterService.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import { createAsyncCallback } from '@/util/Promise.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { resetAllStores } from '@/plugin/ResetStore.ts'
import PiChangelogButton from '@/component/PiChangelogButton.vue'

const loadingOverlay = ref(false)
const router = useRouter()

const importEelvlFileInput = ref<HTMLInputElement>()
const importPngFileInput = ref<HTMLInputElement>()
const importMidiFileInput = ref<HTMLInputElement>()
const importPwlvlFileInput = ref<HTMLInputElement>()

const devViewEnabled = computed(() => import.meta.env.VITE_DEV_VIEW === 'TRUE')

const worldId = ref<string>(usePWClientStore().worldId)
const worldName = ref<string>(getPwGameWorldHelper().meta?.title ?? '')

const quantizePng = ref(true)

const tab = ref(0)

async function onDisconnectButtonClick() {
  await withLoading(loadingOverlay, async () => {
    getPwGameClient().disconnect(false)

    resetAllStores()

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

function onImportPngButtonClick() {
  importPngFileInput.value!.click()
}

function onImportMidiButtonClick() {
  importMidiFileInput.value!.click()
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

async function onPngFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    if (quantizePng.value) {
      sendGlobalChatMessage(`Importing optimized background from ${result.file.name}`)
    } else {
      sendGlobalChatMessage(`Importing background from ${result.file.name}`)
    }
    await importFromPng(result.data, quantizePng.value)
  })
}

async function onMidiFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    // sendGlobalChatMessage(`Importing midi from ${result.file.name}`)
    sendGlobalChatMessage(`Importing test midi.`)
    await importFromMidi(result.data)
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
  <!-- Header -->
  <div class="header-bar">
    <div class="header-title">
      <h2>Pixel Walker Bot</h2>
    </div>
    <div class="header-actions">
      <PiChangelogButton />
      <PiButton color="red" @click="onDisconnectButtonClick">Disconnect</PiButton>
    </div>
  </div>
  <!-- Tabs Layout -->
   
  <v-row class="tabs-root">
      <v-tabs
        v-model="tab"
        center-active
        bg-color="blue"
        direction="vertical"
        color="black"
        style="height: 100%; min-width: 180px;"
      >
        <div style="background:white; color:black; padding:20px; margin-right: -1px;">
        <h2>World</h2>
        Connected to '{{ worldName }}'<br>
        <a :href="`https://pixelwalker.net/world/${worldId}`" target="_blank">
          {{ `https://pixelwalker.net/world/${worldId}` }}
        </a>
        </div>
        <v-tab>Export EELVL</v-tab>
        <v-tab>Import EELVL</v-tab>
        <v-tab>Import Image</v-tab>
        <v-tab>Import Midi</v-tab>
        <v-tab v-if="devViewEnabled">Export PWLVL</v-tab>
        <v-tab v-if="devViewEnabled">Import PWLVL</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab" style="flex: 1 1 0;">
        <!-- Export EELVL Tab -->
        <v-tabs-window-item>
          <PiCardContainer>
            <v-col>
              <v-row>
                <PiButton color="blue" @click="onExportEelvlButtonClick">Export to EELVL</PiButton>
              </v-row>
              <v-row>
                <v-col>
                  <br />
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
                </v-col>
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
        <!-- Import EELVL Tab -->
        <v-tabs-window-item>
          <PiCardContainer>
            <v-col>
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
                <v-col>
                  <br />
                  <v-row>
                    <h3>Import info</h3>
                  </v-row>
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
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
        <!-- Import Image Tab -->
        <v-tabs-window-item>
          <PiCardContainer>
            <v-col>
              <v-row class="align-center" style="gap: 0.5rem; flex-wrap: nowrap; white-space: nowrap;">
                <input
                  ref="importPngFileInput"
                  accept=".png"
                  style="display: none"
                  type="file"
                  @change="onPngFileChange"
                />
                <PiButton
                  color="green"
                  style="flex: 1 1 0; min-width: 0; display: inline-flex; padding: 0 12px;"
                  @click="onImportPngButtonClick"
                >
                  Import PNG Background
                </PiButton>
                <PiButton
                  :color="quantizePng ? 'green' : 'grey'"
                  :outlined="!quantizePng"
                  :title="'Quantize image colors (speed up image placement)'"
                  style="flex: 0 0 auto; min-width: 0; width: auto; display: inline-flex; padding: 0 8px;"
                  @click="quantizePng = !quantizePng"
                >
                  Optimize
                </PiButton>
              </v-row>
              <v-row>
                <v-col>
                  Import a PNG image as the world background. "Optimize" will quantize colors for faster placement.
                </v-col>
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
        <!-- Import Midi Tab -->
        <v-tabs-window-item>
          <PiCardContainer>
            <v-col>
              <v-row class="align-center" style="gap: 0.5rem; flex-wrap: nowrap; white-space: nowrap;">
                <input
                  ref="importMidiFileInput"
                  accept=".mid"
                  style="display: none"
                  type="file"
                  @change="onMidiFileChange"
                />
                <PiButton
                  color="green"
                  style="flex: 1 1 0; min-width: 0; display: inline-flex; padding: 0 12px;"
                  @click="onImportMidiButtonClick"
                >
                  Import Midi
                </PiButton>
                <!-- <PiButton
                  :color="quantizePng ? 'green' : 'grey'"
                  :outlined="!quantizePng"
                  :title="'Quantize image colors (speed up image placement)'"
                  style="flex: 0 0 auto; min-width: 0; width: auto; display: inline-flex; padding: 0 8px;"
                  @click="quantizePng = !quantizePng"
                >
                  Optimize
                </PiButton> -->
              </v-row>
              <v-row>
                <v-col>
                  Import a PNG image as the world background. "Optimize" will quantize colors for faster placement.
                </v-col>
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
        <!-- Export PWLVL Tab (dev only) -->
        <v-tabs-window-item v-if="devViewEnabled">
          <PiCardContainer>
            <v-col>
              <v-row>
                <PiButton color="blue" @click="onExportPwlvlButtonClick">Export to PWLVL</PiButton>
              </v-row>
              <v-row>
                <v-col>
                  Export your current world to the PWLVL format (dev only).
                </v-col>
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
        <!-- Import PWLVL Tab (dev only) -->
        <v-tabs-window-item v-if="devViewEnabled">
          <PiCardContainer>
            <v-col>
              <v-row>
                <input
                  ref="importPwlvlFileInput"
                  accept=".pwlvl"
                  style="display: none"
                  type="file"
                  @change="onPwlvlFileChange"
                />
                <PiButton color="blue" @click="onImportPwlvlButtonClick">Import from PWLVL</PiButton>
              </v-row>
              <v-row>
                <v-col>
                  Import a PWLVL file into your current world (dev only).
                </v-col>
              </v-row>
            </v-col>
          </PiCardContainer>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-row>
</template>

<style scoped>
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #23272f;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 0; /* allow flex children to shrink */
  /* margin:0% removed */
}
.header-title h2 {
  margin: 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  min-width: 0; /* allow flex children to shrink */
}
.header-actions > * {
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tabs-root {
  display: flex;
  /* height: calc(100vh - 70px); */
  min-height: 0;
}
.main-tabs {
  /* Optional: style your tabs */
  border-bottom: 1px solid #333;  
}
.main-tabs-window {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 1rem;
}
.tab-pane {
  max-width: 900px;
  margin: 0 auto;
}
.left-pane, .right-pane {
  flex: 1 1 0;
  min-width: 0;
  overflow-y: auto;
  padding: 1rem;
}
.left-pane {
  border-right: 1px solid #333;
  max-width: 30%;
  /* background: #23272f; */
}
.right-pane {
  background: #1a1d22;
}
@media (max-width: 900px) {
  .main-split {
    flex-direction: column;
  }
  .left-pane, .right-pane {
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #333;
  }
}
ul {
  padding-left: 2rem;
}
</style>
