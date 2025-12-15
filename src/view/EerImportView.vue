<script lang="ts" setup>
import { ref } from 'vue'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import PiTextField from '@/component/PiTextField.vue'
import { VForm } from 'vuetify/components'
import { withLoading } from '@/core/util/LoaderProxy.ts'
import { sendGlobalChatMessage } from '@/core/service/ChatMessageService.ts'
import { importFromEer } from '@/webtool/eer/service/EerImporterService.ts'

const form = ref<VForm>()

const loadingOverlay = ref(false)
const eerRoomId = ref('')

async function onImportEerButtonClick() {
  if (!(await form.value!.validate()).valid) {
    return
  }
  await withLoading(loadingOverlay, async () => {
    sendGlobalChatMessage(`Importing world from ${eerRoomId.value}`)
    await importFromEer(eerRoomId.value)
  })
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>

  <PiCardContainer>
    <v-form ref="form" validate-on="submit lazy" @submit.prevent="onImportEerButtonClick">
      <v-col>
        <v-row>
          <PiTextField v-model="eerRoomId" :required="true" label="EER Room ID (type /roomid to get it)"></PiTextField>
        </v-row>
        <v-row>
          <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
            <template #activator="{ props }">
              <div style="width: 100%" v-bind="props">
                <PiButton :disabled="!usePwClientStore().isConnected" color="green" type="submit"
                  >Import from EER
                </PiButton>
              </div>
            </template>
          </v-tooltip>
        </v-row>
      </v-col>
    </v-form>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>Import info</h3></v-row>
      <v-row> Everybody Edits Rewritten (EER) is a flash based continuation of Everybody Edits (EE). </v-row>
      <v-row> Here you can import EER worlds to PixelWalker, by entering EER room id. </v-row>
      <v-row> You can obtain it by joining EER world and typing /roomid in chat. </v-row>
    </v-col>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
