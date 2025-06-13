<template>
  <PiButton color="yellow" @click="openChangelog">Changelog {{ changelogLatestVersionLine }}</PiButton>
</template>

<script lang="ts" setup>
import PiButton from '@/component/PiButton.vue'
import { onMounted, ref } from 'vue'

const changelogLocation = '/Pixel-Walker-Copy-Bot/changelog.txt'
const changelogLatestVersionLine = ref('')

onMounted(async () => {
  const response = await fetch(changelogLocation)
  const text = await response.text()
  changelogLatestVersionLine.value = "v" +text.split('\n')[2].split(" ")[2]
})

const openChangelog = () => {
  window.open(changelogLocation)
}
</script>
