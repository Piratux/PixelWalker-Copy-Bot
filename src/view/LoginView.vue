<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiTextField from '@/component/PiTextField.vue'
import PiButton from '@/component/PiButton.vue'
import { VForm } from 'vuetify/components'
import { useRouter } from 'vue-router'
import { getWorldIdIfUrl } from '@/core/util/WorldIdExtractor.ts'
import { initPwClasses } from '@/core/service/PwClientService.ts'
import { withLoading } from '@/core/util/LoaderProxy.ts'
import PiOverlay from '@/component/PiOverlay.vue'
import { getEnvDefaultWorldId } from '@/core/util/Environment.ts'
import { BotType } from '@/core/enum/BotType.ts'
import { RouteName } from '@/router/RouteName.ts'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { PWApiClient } from 'pw-js-api'
import { LAST_TESTED_PW_VERSION } from '@/core/constant/General.ts'
import { AlertService } from '@/core/service/AlertService.ts'

const loadingOverlay = ref(false)
const email = ref('')
const password = ref('')
const worldId = ref('')
const secretEditKey = ref('')
const botType = ref(BotType.COPY_BOT)
const botTypeItems = [
  { title: 'Copy Bot', value: BotType.COPY_BOT },
  { title: 'BomBot', value: BotType.BOM_BOT },
  { title: 'CurseBot', value: BotType.CURSE_BOT },
  { title: 'ShiftBot', value: BotType.SHIFT_BOT },
  { title: 'BArena Bot', value: BotType.BARENA_BOT },
]
const form = ref<VForm>()

const router = useRouter()

const devViewEnabled = computed(() => import.meta.env.VITE_DEV_VIEW === 'TRUE')
const adminViewEnabled = computed(() => devViewEnabled.value || usePwClientStore().isAdminModeOn)

watch(worldId, () => {
  worldId.value = getWorldIdIfUrl(worldId.value)
})

async function onConnectButtonClick() {
  if (!(await form.value!.validate()).valid) {
    return
  }
  await withLoading(loadingOverlay, async () => {
    await initPwClasses(worldId.value, email.value, password.value, secretEditKey.value, botType.value)

    await router.push({ name: RouteName.HOME })
  })
}

onMounted(() => {
  void showWarningAlertIfCurrentPWVersionIsUntested()
})

async function showWarningAlertIfCurrentPWVersionIsUntested() {
  const version = await PWApiClient.getVersion()
  if (version !== LAST_TESTED_PW_VERSION) {
    AlertService.warning('Bot was not tested with latest PixelWalker version, so it may not work or work incorrectly')
  }
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
        <v-row v-if="adminViewEnabled">
          <v-select v-model="botType" :items="botTypeItems" label="Bot type"></v-select>
        </v-row>
        <v-row> To use this bot, you need to use PixelWalker login credentials.</v-row>
        <v-row>
          Although this site does not collect login credential information, to feel safer, you can create second
          PixelWalker account just for the bot.
        </v-row>
        <v-row>
          <PiButton color="green" type="submit">Connect</PiButton>
        </v-row>
        <v-row v-if="devViewEnabled">
          <PiButton color="blue" @click="setDefaultWorldIdButtonClicked">Set default world id </PiButton>
        </v-row>
      </v-col>
    </v-form>
  </PiCardContainer>
</template>

<style scoped></style>
