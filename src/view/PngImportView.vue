<script lang="ts" setup>
import { ref } from 'vue'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromPng } from '@/service/PngImporterService'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'

const loadingOverlay = ref(false)

const importPngFileInput = ref<HTMLInputElement>()

const quantizePng = ref(true)

function onImportPngButtonClick() {
  importPngFileInput.value!.click()
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
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>

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
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%; display: flex; gap: 0.5rem" v-bind="props">
              <PiButton
                :disabled="!usePWClientStore().isConnected" 
                color="blue"
                style="flex: 1 1 auto; min-width: 0; display: inline-flex"
                @click="onImportPngButtonClick"
              >
                Import PNG Background
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
      <v-row>
        <v-checkbox
          v-model=quantizePng
          :disabled="!usePWClientStore().isConnected"
          color="green"
          label="Optimize colors for faster placement"
          hide-details
          style="margin-bottom: -1rem; margin-left: 1rem"
          @click="quantizePng = !quantizePng"
        />
      </v-row>
      <v-row>
        <v-col>
          Import a PNG image as the world background.
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
