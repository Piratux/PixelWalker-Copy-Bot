<template>
  <v-app-bar color="primary">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>PixelWalker copy bot</v-toolbar-title>
    <v-btn v-if="!usePWClientStore().isConnected" icon @click="handleRouting(LoginViewRoute.name)">
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
        <v-list-item link @click="handleRouting(item.link)">
          <v-list-item-title>{{ item.text }}</v-list-item-title>
        </v-list-item>
      </div>
      <v-list-item v-if="devViewEnabled" link @click="handleRouting(DevViewRoute.path)">
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
import { MENU_ITEMS } from '@/constant/MenuItems.ts'
import { useRoute, useRouter } from 'vue-router'
import { DevViewRoute, LoginViewRoute } from '@/router/Routes.ts'
import { isEnvDevViewEnabled } from '@/util/Environment.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import { getPwGameClient, usePWClientStore } from '@/store/PWClientStore.ts'
import { resetAllStores } from '@/plugin/ResetStore.ts'

const router = useRouter()
const route = useRoute()
const routePath = computed(() => route.path)

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

async function handleRouting(path: string | undefined) {
  if (path && routePath.value !== path) {
    await router.push({ path })
  }
}

const showDrawer = computed(() => {
  return windowWidth.value >= 800
})

const drawer = showDrawer.value ? ref(true) : ref(false)

function openChangelog() {
  window.open(changelogLocation)
}

async function onDisconnectButtonClick() {
  await withLoading(loadingOverlay, async () => {
    getPwGameClient().disconnect(false)

    resetAllStores()

    await router.push({ name: LoginViewRoute.name })
  })
}
</script>
