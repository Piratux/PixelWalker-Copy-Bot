<script setup lang="ts">
import PiMarkdown from '@/component/PiMarkdown.vue'
import notFoundViewMarkdown from '@/view/md/NotFoundView.md?raw'
</script>

<template>
  <PiMarkdown :markdown-raw="notFoundViewMarkdown" />
</template>
