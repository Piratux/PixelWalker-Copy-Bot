<script lang="ts" setup>
import PiAppNavigation from '@/component/PiAppNavigation.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const currentRouteName = computed(() => {
  return route.name
})
</script>

<template>
  <v-app>
    <PiAppNavigation v-if="currentRouteName !== 'login'" />
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
