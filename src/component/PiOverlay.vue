<template>
  <v-overlay :model-value="props.loading" :opacity="0.5" :persistent="true" class="align-center justify-center">
    <v-progress-circular indeterminate size="64"></v-progress-circular>
  </v-overlay>
</template>

<script lang="ts" setup>
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>
