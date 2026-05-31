<script lang="ts" setup>
import { ref } from 'vue'
import { getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiMarkdown from '@/component/PiMarkdown.vue'
import homeViewMarkdown from '@/view/md/HomeView.md?raw'

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
      <PiMarkdown :markdown-raw="homeViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
