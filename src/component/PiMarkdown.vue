<script setup lang="ts">
import { computed } from 'vue'
import markdownit from 'markdown-it'

import 'github-markdown-css/github-markdown.css'

interface Props {
  markdownRaw: string
}

const props = defineProps<Props>()
const markdownParser = markdownit()

const compiledMarkdown = computed(() => markdownParser.render(props.markdownRaw))
</script>

<template>
  <div class="markdown-body" v-html="compiledMarkdown" />
</template>
