<script lang="ts" setup>
import PiCardContainer from '@/component/PiCardContainer.vue'
import { getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import { computed, onMounted, ref } from 'vue'
import PiButton from '@/component/PiButton.vue'
import { LayerType, Point } from 'pw-js-world'
import { blockIsPortal } from '@/core/service/WorldService.ts'
import { vec2 } from '@basementuniverse/vec'
import { GameError } from '@/core/class/GameError.ts'
import { requireBotAsWorldOwner, requirePlayerAndBotEditPermission } from '@/core/service/PwClientService.ts'
import { sendRawMessage } from '@/core/service/ChatMessageService.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'

onMounted(() => {
  if (usePwClientStore().isConnected) {
    updatePortalDataItems()
  }
})

function updatePortalDataItems() {
  const portalMap = new Map<string, Point[]>()
  items.value.length = 0

  const blocks = getPwGameWorldHelper().blocks
  const width = getPwGameWorldHelper().width
  const height = getPwGameWorldHelper().height

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const block = blocks[LayerType.Foreground][x][y]
      if (blockIsPortal(block.name)) {
        const fromIdToTargetId = `${block.args[0] as string} -> ${block.args[1] as string}`
        mapGetOrInsert(portalMap, fromIdToTargetId, []).push(vec2(x, y))
      }
    }
  }

  items.value = Array.from(portalMap.entries())
    .map(([fromIdToTargetId, positions]) => ({
      fromIdToTargetId,
      positions,
    }))
    .sort((a, b) => a.fromIdToTargetId.localeCompare(b.fromIdToTargetId))
}

function getOwnerPlayerId(): number {
  for (const [playerId, player] of getPwGameWorldHelper().players) {
    if (player.isWorldOwner && playerId !== getPwGameWorldHelper().botPlayerId) {
      return playerId
    }
  }

  throw new GameError('No world owner player found')
}

function teleportPlayer(pos: Point) {
  requireBotAsWorldOwner()

  const playerId = getOwnerPlayerId()
  requirePlayerAndBotEditPermission(getPwGameWorldHelper(), playerId)

  for (const [playerId, player] of getPwGameWorldHelper().players) {
    if (player.isWorldOwner && playerId !== getPwGameWorldHelper().botPlayerId) {
      sendRawMessage(`/tp #${playerId} ${pos.x} ${pos.y}`)
      break
    }
  }
}

interface PortalItem {
  fromIdToTargetId: string
  positions: Point[]
}

const totalPortalCount = computed<number>(() => {
  let total = 0
  for (const item of items.value) {
    total += item.positions.length
  }
  return total
})

const expanded = computed<string[]>(() => items.value.map((item) => item.fromIdToTargetId))

const items = ref<PortalItem[]>([])
const headers = [{ text: 'ID -> Target ID', value: 'fromIdToTargetId' }]
const search = ref('')
</script>

<template>
  <PiCardContainer>
    <h2>Portal list</h2>
    <v-text-field
      v-model="search"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      hide-details
      single-line
      :disabled="!usePwClientStore().isConnected"
    ></v-text-field>
    <p>Total portals: {{ totalPortalCount }}</p>
    <v-tooltip :disabled="usePwClientStore().isConnected" location="bottom" text="Requires connecting the bot">
      <template #activator="{ props }">
        <div style="width: 100%; display: flex; gap: 0.5rem" v-bind="props">
          <PiButton
            :disabled="!usePwClientStore().isConnected"
            prepend-icon="mdi-refresh"
            color="blue"
            @click="updatePortalDataItems"
            >Refresh</PiButton
          >
        </div>
      </template>
    </v-tooltip>

    <v-data-table
      v-model:expanded="expanded"
      :items="items"
      :headers="headers"
      item-value="fromIdToTargetId"
      :search="search"
      show-expand
      hide-default-header
      density="compact"
    >
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-row>
              <v-col v-for="pos in item.positions" :key="`${pos.x}:${pos.y}`" cols="4" sm="2">
                <PiButton color="green" min-width="6em" @click="teleportPlayer(pos)">
                  {{ pos.x }}:{{ pos.y }}
                </PiButton>
              </v-col>
            </v-row>
          </td>
        </tr>
      </template>
    </v-data-table>
  </PiCardContainer>
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
</style>
