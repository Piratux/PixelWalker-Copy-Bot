<script lang="ts" setup>
import { ref } from 'vue'
import { getPwGameWorldHelper, usePWClientStore } from '@/store/PWClientStore.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'

const worldId = ref<string>(usePWClientStore().worldId)
const worldName = ref<string>(getPwGameWorldHelper()?.meta?.title ?? '') // TODO: find a way to not require using '?' in getPwGameWorldHelper()?
</script>

<template>
  <PiCardContainer>
    <v-col v-if="usePWClientStore().isConnected">
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
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
</style>
