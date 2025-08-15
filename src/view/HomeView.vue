<script lang="ts" setup>
import { ref } from 'vue'
import { getPwGameWorldHelper, usePwClientStore } from '@/store/PwClientStore.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'

const worldId = ref<string>(usePwClientStore().worldId)
const worldName = ref<string>(getPwGameWorldHelper()?.meta?.title ?? '') // TODO: find a way to not require using '?' in getPwGameWorldHelper()?
</script>

<template>
  <PiCardContainer>
    <v-col v-if="usePwClientStore().isConnected">
      <v-row>
        <h3>Connected to {{ `'${worldName}'` }}</h3>
      </v-row>
      <v-row>
        <a :href="`https://pixelwalker.net/world/${worldId}`" target="_blank">{{
          `https://pixelwalker.net/world/${worldId}`
        }}</a></v-row
      >
    </v-col>
    <v-col v-else>
      <v-row>
        <h3>Connect bot to PixelWalker world to use it</h3>
      </v-row>
    </v-col>
  </PiCardContainer>
  <PiCardContainer>
    <v-col>
      <v-row><h3>General info</h3></v-row>
      <v-row>This page lets you host Copy Bot for PixelWalker.</v-row>
      <v-row>In addition, it contains collection of useful tools.</v-row>
      <v-row><br /></v-row>
      <v-row><h3>Feature overview</h3></v-row>
      <v-row>Features accessible via commands:</v-row>
      <v-row>
        <ul>
          <li>Copy/paste selected region</li>
          <li>Move selected region</li>
          <li>Mask blocks when pasting (such as only pasting background blocks)</li>
          <li>
            Repeated paste of selected region
            <ul>
              <li>
                Smart repeated paste - switches/portals/etc. get auto incremented based on placed pattern (useful for
                building switch worlds)
              </li>
            </ul>
          </li>
          <li>Undo/redo blocks placed by bot</li>
          <li>Import PixelWalker worlds via link</li>
          <li>Replace all selected blocks</li>
          <li>Perform math operations with selected block parameters (ex.: add 5 to all counters)</li>
        </ul>
      </v-row>
      <v-row><br /></v-row>
      <v-row>Features accessible via bot page:</v-row>
      <v-row>
        <ul>
          <li>Export PixelWalker world to .eelvl file</li>
          <li>Import PixelWalker world from .eelvl file</li>
          <li>Import PixelWalker world from .midi file (piano notes only for now)</li>
          <li>Import PixelWalker world from .png file</li>
          <li>Import PixelWalker world from EER (Everybody Edits Rewritten) world</li>
        </ul>
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
