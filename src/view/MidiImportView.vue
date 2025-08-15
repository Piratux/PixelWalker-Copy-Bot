<script lang="ts" setup>
import { ref } from 'vue'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromMidi } from '@/service/MidiImporterService'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePwClientStore } from '@/store/PwClientStore.ts'
import { isEnvDevViewEnabled } from '@/util/Environment.ts'

const loadingOverlay = ref(false)

const importMidiFileInput = ref<HTMLInputElement>()

const showColors = ref(false)

const devViewEnabled = isEnvDevViewEnabled()

function onImportMidiButtonClick() {
  importMidiFileInput.value!.click()
}

async function onMidiFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    sendGlobalChatMessage(`Importing midi from ${result.file.name}`)
    await importFromMidi(result.data, showColors.value)
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>

  <PiCardContainer>
    <v-col>
      <v-row class="align-center" style="gap: 0.5rem; flex-wrap: nowrap; white-space: nowrap">
        <input ref="importMidiFileInput" accept=".mid" style="display: none" type="file" @change="onMidiFileChange" />
        <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%; display: flex; gap: 0.5rem" v-bind="props">
              <PiButton
                :disabled="!usePwClientStore().isConnected"
                color="blue"
                style="flex: 1 1 auto; min-width: 0; display: inline-flex"
                @click="onImportMidiButtonClick"
              >
                Import Midi
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
      <v-row>
        <v-checkbox
          v-if="devViewEnabled"
          v-model="showColors"
          :disabled="!usePwClientStore().isConnected"
          color="green"
          hide-details
          style="margin-bottom: -1rem; margin-left: 1rem"
          label="DEV: Show Colors"
          @click="showColors = !showColors"
        />
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>Import info</h3></v-row>
      <v-row> MIDI is a file format that stores music note data. </v-row>
      <v-row> Here you can import a MIDI file's piano tracks to PixelWalker.</v-row>
    </v-col>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
