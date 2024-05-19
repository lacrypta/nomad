import globals from 'globals';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
  {
    plugins: { import: importPlugin },
    ignores: ['pnpm-lock.yaml', 'dist/**'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        project: './etc/tsconfig.eslint.json',
      },
    },
    rules: {
      'prefer-const': [
        'error',
        {
          ignoreReadBeforeAssign: true,
        },
      ],
    },
  },
);
