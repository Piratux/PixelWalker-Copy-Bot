<script lang="ts" setup>
import { ref } from 'vue'
import { exportToPwlvl } from '@/webtool/pwlvl/service/PwlvlExporterService.ts'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/core/service/FileService.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { importFromPwlvl } from '@/webtool/pwlvl/service/PwlvlImporterService.ts'
import { withLoading } from '@/core/util/LoaderProxy.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import { createAsyncCallback } from '@/core/util/Promise.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import PiMarkdown from '@/component/PiMarkdown.vue'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import devViewMarkdown from '@/view/md/DevView.md?raw'

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
        <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePwClientStore().isConnected" color="blue" @click="onExportPwlvlButtonClick">
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
        <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePwClientStore().isConnected" color="blue" @click="onImportPwlvlButtonClick">
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
      <PiMarkdown :markdown-raw="devViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
