<script lang="ts" setup>
import { ref } from 'vue'
import { exportToPwlvl } from '@/service/PwlvlExporterService.ts'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromPwlvl } from '@/service/PwlvlImporterService.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import { createAsyncCallback } from '@/util/Promise.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'

const loadingOverlay = ref(false)

const importPwlvlFileInput = ref<HTMLInputElement>()

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
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePWClientStore().isConnected" color="blue" @click="onExportPwlvlButtonClick">
                Export to PWLVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
      <v-row>
        <input
          ref="importPwlvlFileInput"
          accept=".pwlvl"
          style="display: none"
          type="file"
          @change="onPwlvlFileChange"
        />
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePWClientStore().isConnected" color="blue" @click="onImportPwlvlButtonClick">
                Import from PWLVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>PWLVL Import/Export info</h3></v-row>
      <v-row>
        I'm not a fan of PWLVL format, because it's inefficient and I haven't checked how it would handle backwards
        compatibility.
        <br />
        There exists .import command, and this is only needed for automated runtime tests.
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
