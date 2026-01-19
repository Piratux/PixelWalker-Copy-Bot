<script lang="ts" setup>
import PiCardContainer from '@/component/PiCardContainer.vue'
import { vec2 } from '@basementuniverse/vec'
import { teleportPlayer } from '@/core/service/PwClientService.ts'
import { getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import PiButton from '@/component/PiButton.vue'
import { onMounted, ref } from 'vue'

const worldId = ref<string>('')
const minimapUrl = ref<string>('')

function onImageClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()
  // x and y normalised in [0, 1] range
  const clickPos = vec2((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
  const mapSize = vec2(getPwGameWorldHelper().width, getPwGameWorldHelper().height)
  const teleportPos = vec2.mul(clickPos, mapSize)
  const roundedTeleportPos = vec2.map(teleportPos, Math.round)

  teleportPlayer(roundedTeleportPos)
}

function updateImage() {
  minimapUrl.value = `https://server.pixelwalker.net/worlds/${worldId.value}/minimap?cacheBust=` + Date.now()
}

onMounted(() => {
  worldId.value = usePwClientStore().worldId
  updateImage()
})
</script>

<template>
  <PiCardContainer>
    <h2>Minimap teleporter</h2>
    <p>Click anywhere on minimap to teleport.</p>

    <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
      <template #activator="{ props }">
        <div style="width: 100%; display: flex; gap: 0.5rem" v-bind="props">
          <PiButton
            :disabled="!usePwClientStore().isConnected"
            prepend-icon="mdi-refresh"
            color="blue"
            @click="updateImage"
            >Refresh minimap</PiButton
          >
        </div>
      </template>
    </v-tooltip>
  </PiCardContainer>
  <v-img v-if="usePwClientStore().isConnected" :src="minimapUrl" @click="onImageClick"></v-img>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
/*For some reason scrollbars randomly appear and disappear on v-data-table when expanding items.*/
:deep(.v-table__wrapper) {
  overflow: hidden;
}
/*Make minimap image pixelated instead of blurry*/
:deep(.v-img__img) {
  image-rendering: pixelated;
}
</style>
