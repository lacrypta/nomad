import globals from 'globals';

import eslint_js from '@eslint/js';
import eslint_config_prettier from 'eslint-config-prettier';
import eslint_plugin_import from 'eslint-plugin-import';
import eslint_plugin_jest from 'eslint-plugin-jest';
import sonarjs from 'eslint-plugin-sonarjs';
import arrayFunc from 'eslint-plugin-array-func';
import * as regexpPlugin from 'eslint-plugin-regexp';
import perfectionistNatural from 'eslint-plugin-perfectionist/configs/recommended-natural';

import tseslint from 'typescript-eslint';
import eslint_plugin_tsdoc from 'eslint-plugin-tsdoc';

export default tseslint.config(
  eslint_js.configs.recommended,
  eslint_config_prettier,
  sonarjs.configs.recommended,
  arrayFunc.configs.all,
  regexpPlugin.configs['flat/recommended'],
  perfectionistNatural,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['test/**/*.test.{m,c,}ts'],
    ...eslint_plugin_jest.configs['flat/recommended'],
    rules: {
      ...eslint_plugin_jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    },
  },
  {
    plugins: {
      import: eslint_plugin_import,
      tsdoc: eslint_plugin_tsdoc,
    },
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
