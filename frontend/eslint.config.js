import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'scripts/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // allow any — will be typed in Fase 3
      '@typescript-eslint/no-explicit-any': 'warn',
      // prop mutation pre-existing — will be refactored in Fase 3
      'vue/no-mutating-props': 'warn',
      // unused vars: allow _ prefix for intentionally ignored bindings
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // empty catch blocks are intentional in several places
      'no-empty': 'warn',
      // vue formatting rules — purely stylistic, not errors
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
)
