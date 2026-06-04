import { defineConfig } from 'oxlint'
import base from '../../oxlint.config.ts'

export default defineConfig({
  extends: [base],
  ignorePatterns: [
    '.output',
    '.wxt',
    'node_modules',
  ],
  overrides: [
    {
      files: [
        'src/entrypoints/popup/main.ts',
        'src/entrypoints/content-search.content/index.ts',
      ],
      rules: {
        'import/no-unassigned-import': 'off',
      },
    },
  ],
})
