<script lang="ts" setup>
import { ref } from 'vue'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/core/service/FileService.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { importFromEelvl } from '@/webtool/eelvl/service/EelvlImporterService.ts'
import { withLoading } from '@/core/util/LoaderProxy.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import MissingBlockInfoTextArea from '@/component/MissingBlockInfoTextArea.vue'
import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'
import PiMarkdown from '@/component/PiMarkdown.vue'
import eelvlImportViewMarkdown from '@/view/md/EelvlImportView.md?raw'

const loadingOverlay = ref(false)
const missingBlocks = ref<MissingBlockInfo[]>([])

const importEelvlFileInput = ref<HTMLInputElement>()

function onImportEelvlButtonClick() {
  importEelvlFileInput.value!.click()
}

async function onEelvlFileChange(event: Event) {
  await withLoading(loadingOverlay, async () => {
    const result: FileImportAsArrayBufferResult | null = await getFileAsArrayBuffer(event)
    if (!result) {
      return
    }
    sendGlobalChatMessage(`Importing world from ${result.file.name}`)
    missingBlocks.value = await importFromEelvl(result.data)
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>
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
        <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePwClientStore().isConnected" color="blue" @click="onImportEelvlButtonClick"
                >Import from EELVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <MissingBlockInfoTextArea label="Blocks that couldn't be converted" :missing-blocks="missingBlocks" />
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <PiMarkdown :markdown-raw="eelvlImportViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
