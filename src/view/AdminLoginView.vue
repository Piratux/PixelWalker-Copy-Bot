<script lang="ts" setup>
import { onMounted } from 'vue'
import { RouteName } from '@/router/RouteName.ts'
import { useRouter } from 'vue-router'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'

const router = useRouter()

onMounted(async () => {
  usePwClientStore().isAdminModeOn = true
  await router.push({ name: RouteName.LOGIN })
})
</script>

<template>
  <div></div>
</template>
