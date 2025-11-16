<script lang="ts" setup>
import PiAppNavigation from '@/component/PiAppNavigation.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useUiStore } from '@/core/store/UiStore.ts'
import { RouteName } from '@/router/RouteName.ts'

const route = useRoute()
const currentRouteName = computed(() => {
  return route.name
})
</script>

<template>
  <v-app>
    <PiAppNavigation v-if="currentRouteName !== RouteName.LOGIN" />
    <v-main>
      <v-container fluid>
        <v-alert
          v-for="(alert, index) in useUiStore().alerts"
          :key="index"
          :closable="alert.closable"
          :text="alert.text"
          :type="alert.type"
          class="mb-2"
          variant="tonal"
        ></v-alert>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
