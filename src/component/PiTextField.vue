<template>
  <v-text-field
    :rules="[(v) => !!v || !props.required || 'Field mandatory.', ...props.rules]"
    :required="props.required"
  />
</template>

<script setup lang="ts">
import type { VTextField } from 'vuetify/components'

// https://stackoverflow.com/a/77201828
type UnwrapReadonlyArray<A> = A extends readonly (infer I)[] ? I : A
type ValidationRule = UnwrapReadonlyArray<VTextField['rules']>

interface Props {
  required?: boolean
  rules?: ValidationRule[]
}

const props = withDefaults(defineProps<Props>(), { required: false, rules: () => [] })
</script>
