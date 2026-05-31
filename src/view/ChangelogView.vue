<script setup lang="ts">
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiMarkdown from '@/component/PiMarkdown.vue'
import changelogViewMarkdown from '../../public/ChangelogView.md?raw'
</script>

<template>
  <PiCardContainer>
    <v-col>
      <PiMarkdown :markdown-raw="changelogViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
