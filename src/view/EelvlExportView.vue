<script lang="ts" setup>
import { ref } from 'vue'
import { exportToEelvl } from '@/service/EelvlExporterService.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiButton from '@/component/PiButton.vue'
import { createAsyncCallback } from '@/util/Promise.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { usePWClientStore } from '@/store/PWClientStore.ts'

const loadingOverlay = ref(false)

async function onExportEelvlButtonClick() {
  await withLoading(
    loadingOverlay,
    createAsyncCallback(() => {
      exportToEelvl()
    }),
  )
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
              <PiButton :disabled="!usePWClientStore().isConnected" color="blue" @click="onExportEelvlButtonClick">
                Export to EELVL
              </PiButton>
            </div>
          </template>
        </v-tooltip>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
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
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
