<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>
  <v-app-bar color="primary">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>PixelWalker copy bot</v-toolbar-title>
    <v-btn v-if="!usePwClientStore().isConnected" icon @click="onConnectButtonClick">
      <v-icon icon="mdi-login"></v-icon>
      <v-tooltip activator="parent">Connect</v-tooltip>
    </v-btn>
    <v-btn v-else icon @click="onDisconnectButtonClick">
      <v-icon color="red" icon="mdi-logout"></v-icon>
      <v-tooltip activator="parent">Disconnect</v-tooltip>
    </v-btn>
  </v-app-bar>
  <v-navigation-drawer v-model="drawer" :permanent="showDrawer">
    <v-list color="primary">
      <div v-for="item in MENU_ITEMS" :key="item.text">
        <v-list-item link @click="handleRouting(item.routeName)">
          <v-list-item-title>{{ item.text }}</v-list-item-title>
        </v-list-item>
      </div>
      <v-list-item v-if="devViewEnabled" link @click="handleRouting(RouteName.DEV)">
        <v-list-item-title>Developer tools</v-list-item-title>
      </v-list-item>
      <v-list-item link @click="openChangelog">
        <v-list-item-title>Changelog</v-list-item-title>
      </v-list-item>
    </v-list>
    <template #append>
      <div class="text-center">{{ changelogLatestVersionLine }}</div>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { MENU_ITEMS } from '@/core/constant/MenuItems.ts'
import { useRoute, useRouter } from 'vue-router'
import { isEnvDevViewEnabled } from '@/core/util/Environment.ts'
import { getPwGameClient, usePwClientStore } from '@/core/store/PwClientStore.ts'
import { resetAllStores } from '@/plugin/ResetStore.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { RouteName } from '@/router/RouteName.ts'

const router = useRouter()
const route = useRoute()

const changelogLocation = '/PixelWalker-Copy-Bot/changelog.txt'
const changelogLatestVersionLine = ref('')

const devViewEnabled = isEnvDevViewEnabled()

const loadingOverlay = ref(false)

const windowWidth = ref(window.innerWidth)
onMounted(() => {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
})

onMounted(async () => {
  const response = await fetch(changelogLocation)
  const text = await response.text()
  changelogLatestVersionLine.value = text.split('\n')[2]
})

async function handleRouting(routeName: string) {
  if (route.name !== routeName) {
    await router.push({ name: routeName })
  }
}

const showDrawer = computed(() => {
  return windowWidth.value >= 800
})

const drawer = showDrawer.value ? ref(true) : ref(false)

function openChangelog() {
  window.open(changelogLocation)
}

async function onConnectButtonClick() {
  await handleRouting(adminModeEnabled() ? RouteName.ADMIN_LOGIN : RouteName.LOGIN)
}

async function onDisconnectButtonClick() {
  getPwGameClient().disconnect(false)

  const adminModeOn = adminModeEnabled()

  resetAllStores()

  await handleRouting(adminModeOn ? RouteName.ADMIN_LOGIN : RouteName.LOGIN)
}

function adminModeEnabled() {
  return usePwClientStore().isAdminModeOn
}
</script>
