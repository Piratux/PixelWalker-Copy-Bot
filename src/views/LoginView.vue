<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import PiCardContainer from '@/components/PiCardContainer.vue'
import PiTextField from '@/components/PiTextField.vue'
import PiButton from '@/components/PiButton.vue'
import { VForm } from 'vuetify/components'
import { useRouter } from 'vue-router'
import { getPwApiClient, getPwGameClient, usePWClientStore } from '@/stores/PWClientStore.ts'
import { getWorldIdIfUrl } from '@/services/WorldIdExtractorService.ts'
import { PWApiClient, PWGameClient } from 'pw-js-api'
import { pwAuthenticate, pwJoinWorld } from '@/services/PWClientService.ts'
import { registerCallbacks } from '@/services/PacketHandlerService.ts'
import { BotViewRoute } from '@/router/Routes.ts'
import { withLoading } from '@/services/LoaderProxyService.ts'
import PiOverlay from '@/components/PiOverlay.vue'

const loadingOverlay = ref(false)
const email = ref('')
const password = ref('')
const worldId = ref('')
const secretEditKey = ref('')
const form = ref<VForm>()

const router = useRouter()
const PWClientStore = usePWClientStore()

const devViewEnabled = computed(() => import.meta.env.VITE_DEV_VIEW === 'TRUE')

watch(worldId, () => {
  worldId.value = getWorldIdIfUrl(worldId.value)
})

async function onConnectButtonClick() {
  await withLoading(loadingOverlay, async () => {
    PWClientStore.worldId = worldId.value
    PWClientStore.email = email.value
    PWClientStore.password = password.value
    PWClientStore.secretEditKey = secretEditKey.value
    if (!(await form.value!.validate()).valid) {
      return
    }

    PWClientStore.setPwApiClient(new PWApiClient(email.value, password.value))

    await pwAuthenticate(getPwApiClient())

    PWClientStore.setPwGameClient(new PWGameClient(getPwApiClient()))

    registerCallbacks()

    await pwJoinWorld(getPwGameClient(), worldId.value)

    PWClientStore.initBlocks(await getPwApiClient().getListBlocks())

    await router.push({ name: BotViewRoute.name })
  })
}

function setDefaultWorldIdButtonClicked() {
  worldId.value = import.meta.env.VITE_DEFAULT_WORLD_ID
}
</script>

<template>
  <PiOverlay :loading="loadingOverlay"></PiOverlay>
  <PiCardContainer>
    <v-form ref="form" autocomplete="on" validate-on="submit lazy" @submit.prevent="onConnectButtonClick">
      <v-col>
        <v-row>
          <PiTextField v-model="email" :required="true" label="Email"></PiTextField>
        </v-row>
        <v-row>
          <PiTextField v-model="password" :required="true" label="Password" type="password"></PiTextField>
        </v-row>
        <v-row>
          <PiTextField v-model="worldId" :required="true" hint="World ID or World URL" label="World ID"></PiTextField>
        </v-row>
        <v-row>
          <PiTextField v-model="secretEditKey" label="Secret Edit Key (Optional)"></PiTextField>
        </v-row>
        <v-row> To use this bot, you need to use PixelWalker login credentials.</v-row>
        <v-row>
          Although this site does not collect login credential information, to feel safer, you can create second
          PixelWalker account just for the bot.
        </v-row>
        <v-row>
          <PiButton color="green" type="submit">Connect</PiButton>
        </v-row>
        <v-row>
          <PiButton v-if="devViewEnabled" color="blue" @click="setDefaultWorldIdButtonClicked"
            >Set default world id
          </PiButton>
        </v-row>
      </v-col>
    </v-form>
  </PiCardContainer>
</template>

<style scoped></style>
