<template>
  <v-textarea v-if="missingBlocks.length > 0" :label="label" :model-value="resultText" readonly></v-textarea>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { MissingBlockInfo } from '@/webtool/eelvl/type/MissingBlockInfo.ts'

const resultText = ref('')

interface Props {
  missingBlocks: MissingBlockInfo[]
  label: string
}

const props = defineProps<Props>()

watch(
  () => props.missingBlocks,
  () => {
    resultText.value = props.missingBlocks
      .toSorted((a, b) => {
        if (a.pos.y !== b.pos.y) {
          return a.pos.y - b.pos.y
        }
        return a.pos.x - b.pos.x
      })
      .map((block) => `${JSON.stringify(block.pos)}; ${block.info}`)
      .join('\n')
  },
)
</script>
