import globals from 'globals';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import arrayFunc from 'eslint-plugin-array-func';
import * as regexpPlugin from 'eslint-plugin-regexp';
import perfectionistNatural from 'eslint-plugin-perfectionist/configs/recommended-natural';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
  sonarjs.configs.recommended,
  arrayFunc.configs.all,
  regexpPlugin.configs['flat/recommended'],
  perfectionistNatural,
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
