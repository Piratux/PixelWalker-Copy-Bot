<script lang="ts" setup>
import { ref } from 'vue'
import { exportToEelvl } from '@/webtool/eelvl/service/EelvlExporterService.ts'
import { withLoading } from '@/core/util/LoaderProxy.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import { createAsyncCallback } from '@/core/util/Promise.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'
import MissingBlockInfoTextArea from '@/component/MissingBlockInfoTextArea.vue'
import PiMarkdown from '@/component/PiMarkdown.vue'
import eelvlExportViewMarkdown from '@/view/md/EelvlExportView.md?raw'

const loadingOverlay = ref(false)
const missingBlocks = ref<MissingBlockInfo[]>([])

async function onExportEelvlButtonClick() {
  await withLoading(
    loadingOverlay,
    createAsyncCallback(() => {
      missingBlocks.value = exportToEelvl()
    }),
  )
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
              <PiButton :disabled="!usePwClientStore().isConnected" color="blue" @click="onExportEelvlButtonClick">
                Export to EELVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <MissingBlockInfoTextArea :missing-blocks="missingBlocks" label="Blocks that couldn't be converted" />
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <PiMarkdown :markdown-raw="eelvlExportViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
