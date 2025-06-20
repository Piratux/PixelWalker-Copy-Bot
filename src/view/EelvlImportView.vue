<script lang="ts" setup>
import { ref } from 'vue'
import { FileImportAsArrayBufferResult, getFileAsArrayBuffer } from '@/service/FileService.ts'
import { sendGlobalChatMessage } from '@/service/ChatMessageService.ts'
import { importFromEelvl } from '@/service/EelvlImporterService.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'

const loadingOverlay = ref(false)

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
    await importFromEelvl(result.data)
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
        <v-tooltip :disabled="usePWClientStore().isConnected" location="bottom" text="Requires connecting the bot">
          <template #activator="{ props }">
            <div style="width: 100%" v-bind="props">
              <PiButton :disabled="!usePWClientStore().isConnected" color="blue" @click="onImportEelvlButtonClick"
                >Import from EELVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
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
