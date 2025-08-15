import eslintConfigPrettier from 'eslint-config-prettier/flat'

import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

// TODO: Consider moving to Oxlint or Biome in the future to improve linting speed.
//  At the time of writing (2025-08-15), Oxlint and Biome has poor Vue and type checked rules support.
export default defineConfigWithVueTs(
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,
  vueTsConfigs.stylisticTypeChecked,
  {
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],
    },
  },
  eslintConfigPrettier,
)
