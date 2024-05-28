import globals from 'globals';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import arrayFunc from 'eslint-plugin-array-func';
import * as regexpPlugin from 'eslint-plugin-regexp';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
  sonarjs.configs.recommended,
  arrayFunc.configs.all,
  regexpPlugin.configs['flat/recommended'],
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
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
