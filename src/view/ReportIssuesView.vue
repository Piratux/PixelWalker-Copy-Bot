<script setup lang="ts">
import PiCardContainer from '@/component/PiCardContainer.vue'
import PiMarkdown from '@/component/PiMarkdown.vue'
import reportIssuesViewMarkdown from '@/view/md/ReportIssuesView.md?raw'
</script>

<template>
  <PiCardContainer>
    <v-col>
      <PiMarkdown :markdown-raw="reportIssuesViewMarkdown" />
    </v-col>
  </PiCardContainer>
</template>
