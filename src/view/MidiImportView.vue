<script lang="ts" setup>
import { ref } from 'vue'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromMidi } from '@/service/MidiImporterService'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'

const loadingOverlay = ref(false)

const importMidiFileInput = ref<HTMLInputElement>()

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
    await importFromMidi(result.data)
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>

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
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton
                :disabled="!usePWClientStore().isConnected" 
                color="blue"
                @click="onImportMidiButtonClick"
              >
                Import Midi
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
      <v-row>
        <v-col>
          Imports a MIDI file's piano tracks into a world.
        </v-col>
      </v-row>
    </v-col>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
