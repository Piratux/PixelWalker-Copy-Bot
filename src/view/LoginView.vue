<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiTextField from '@/component/PiTextField.vue'
import PiButton from '@/component/PiButton.vue'
import { VForm } from 'vuetify/components'
import { useRouter } from 'vue-router'
import { usePWClientStore } from '@/store/PWClientStore.ts'
import { getWorldIdIfUrl } from '@/service/WorldIdExtractorService.ts'
import { initPwClasses } from '@/service/PWClientService.ts'
import { HomeViewRoute } from '@/router/Routes.ts'
import { withLoading } from '@/service/LoaderProxyService.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { getEnvDefaultWorldId } from '@/util/Environment.ts'

const loadingOverlay = ref(false)
const email = ref('')
const password = ref('')
const worldId = ref('')
const secretEditKey = ref('')
const form = ref<VForm>()

const router = useRouter()

const devViewEnabled = computed(() => import.meta.env.VITE_DEV_VIEW === 'TRUE')

watch(worldId, () => {
  worldId.value = getWorldIdIfUrl(worldId.value)
})

async function onConnectButtonClick() {
  await withLoading(loadingOverlay, async () => {
    if (!(await form.value!.validate()).valid) {
      return
    }

    usePWClientStore().worldId = worldId.value
    usePWClientStore().email = email.value
    usePWClientStore().password = password.value
    usePWClientStore().secretEditKey = secretEditKey.value

    await initPwClasses()

    await router.push({ name: HomeViewRoute.name })
    usePWClientStore().isConnected = true
  })
}

function setDefaultWorldIdButtonClicked() {
  worldId.value = getEnvDefaultWorldId()
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
