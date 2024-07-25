import globals from 'globals';

import eslint_js from '@eslint/js';
import eslint_config_prettier from 'eslint-config-prettier';
import eslint_plugin_import from 'eslint-plugin-import';
import eslint_plugin_jest from 'eslint-plugin-jest';
import arrayFunc from 'eslint-plugin-array-func';
import * as regexpPlugin from 'eslint-plugin-regexp';
import perfectionist from 'eslint-plugin-perfectionist';

import eslint_plugin_jsdoc from 'eslint-plugin-jsdoc';

export default [
  eslint_js.configs.recommended,
  eslint_config_prettier,
  arrayFunc.configs.all,
  regexpPlugin.configs['flat/recommended'],
  perfectionist.configs['recommended-natural'],
  eslint_plugin_jsdoc.configs['flat/recommended'],
  {
    files: ['test/**/*.test.{m,c,}js'],
    ...eslint_plugin_jest.configs['flat/recommended'],
    rules: {
      ...eslint_plugin_jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    },
  },
  {
    plugins: {
      import: eslint_plugin_import,
      jsdoc: eslint_plugin_jsdoc,
    },
    ignores: ['pnpm-lock.yaml', 'dist/**'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },
    },
    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },
    rules: {
      'jsdoc/check-access': 2,
      'jsdoc/check-alignment': 2,
      'jsdoc/check-examples': 0,
      'jsdoc/check-indentation': 2,
      'jsdoc/check-line-alignment': 2,
      'jsdoc/check-param-names': [
        'error',
        {
          checkRestProperty: true,
          enableFixer: false,
          allowExtraTrailingParamDocs: false,
          checkDestructured: true,
          useDefaultObjectProperties: false,
          disableExtraPropertyReporting: false,
          disableMissingParamChecks: false,
        },
      ],
      'jsdoc/check-property-names': [
        'error',
        {
          enableFixer: true,
        },
      ],
      'jsdoc/check-syntax': 2,
      'jsdoc/check-tag-names': [
        'error',
        {
          definedTags: ['internal'],
          enableFixer: true,
          jsxTags: false,
          typed: false,
        },
      ],
      'jsdoc/check-types': 2,
      'jsdoc/check-values': 2,
      'jsdoc/empty-tags': 2,
      'jsdoc/implements-on-classes': 2,
      'jsdoc/informative-docs': 2,
      'jsdoc/match-description': [
        'error',
        {
          nonemptyTags: true,
        },
      ],
      'jsdoc/match-name': 0,
      'jsdoc/multiline-blocks': [
        'error',
        {
          noZeroLineText: true,
          noFinalLineText: true,
          noSingleLineBlocks: true,
          singleLineTags: ['type'],
          noMultilineBlocks: false,
        },
      ],
      'jsdoc/no-bad-blocks': [
        'error',
        {
          preventAllMultiAsteriskBlocks: true,
        },
      ],
      'jsdoc/no-blank-block-descriptions': 2,
      'jsdoc/no-blank-blocks': [
        'error',
        {
          enableFixer: true,
        },
      ],
      'jsdoc/no-defaults': [
        'error',
        {
          noOptionalParamNames: true,
        },
      ],
      'jsdoc/no-missing-syntax': [
        'error',
        {
          contexts: [
            {
              context: 'any',
            },
          ],
        },
      ],
      'jsdoc/no-multi-asterisks': [
        'error',
        {
          allowWhitespace: true,
          preventAtMiddleLines: true,
          preventAtEnd: true,
        },
      ],
      'jsdoc/no-restricted-syntax': 0,
      'jsdoc/no-types': 0,
      'jsdoc/no-undefined-types': [
        'error',
        {
          definedTypes: [
            'AsyncIterable',
            'Iterable',
            'IterableIterator',
            'Iterator',
            'PromiseLike',
            'PromiseWithResolvers',
            'PropertyDescriptor',
            'TypedArray',
          ],
          markVariablesAsUsed: true,
          disableReporting: false,
        },
      ],
      'jsdoc/require-asterisk-prefix': 2,
      'jsdoc/require-description': [
        'error',
        {
          exemptedBy: [],
          descriptionStyle: 'any',
          checkConstructors: true,
          checkGetters: true,
          checkSetters: true,
        },
      ],
      'jsdoc/require-description-complete-sentence': 0, // fails for colons
      'jsdoc/require-example': 0, // disabled during heavy development, TODO: re-enable
      'jsdoc/require-file-overview': 0, // disabled during heavy development, TODO: re-enable
      'jsdoc/require-hyphen-before-param-description': ['error', 'always'],
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: {
            // ArrowFunctionExpression: true,
            ClassDeclaration: true,
            // ClassExpression: true,
            FunctionDeclaration: true,
            // FunctionExpression: true,
            MethodDefinition: true,
          },
          exemptEmptyConstructors: false,
          exemptEmptyFunctions: false,
          checkConstructors: true,
          checkGetters: true,
          checkSetters: true,
        },
      ],
      'jsdoc/require-param': [
        'error',
        {
          checkRestProperty: true,
          checkConstructors: true,
          checkGetters: true,
          checkSetters: true,
          checkDestructured: true,
          checkDestructuredRoots: false,
          useDefaultObjectProperties: true,
        },
      ],
      'jsdoc/require-param-description': 2,
      'jsdoc/require-param-name': 2,
      'jsdoc/require-param-type': 2,
      'jsdoc/require-property': 2,
      'jsdoc/require-property-description': 2,
      'jsdoc/require-property-name': 2,
      'jsdoc/require-property-type': 2,
      'jsdoc/require-returns': [
        'error',
        {
          checkConstructors: false,
          checkGetters: true,
          forceRequireReturn: true,
          forceReturnsWithAsync: true,
        },
      ],
      'jsdoc/require-returns-check': [
        'error',
        {
          exemptGenerators: false,
          exemptAsync: true, // BUG in eslint-plugin-jsdoc
          reportMissingReturnForUndefinedTypes: false,
        },
      ],
      'jsdoc/require-returns-description': 2,
      'jsdoc/require-returns-type': 2,
      'jsdoc/require-throws': 2,
      'jsdoc/require-yields': [
        'error',
        {
          forceRequireYields: true,
          withGeneratorTag: true,
          next: false,
          forceRequireNext: false,
          nextWithGeneratorTag: false,
        },
      ],
      'jsdoc/require-yields-check': [
        'error',
        {
          checkGeneratorsOnly: false,
          next: true,
        },
      ],
      'jsdoc/sort-tags': 0,
      'jsdoc/tag-lines': 0,
      'jsdoc/text-escaping': 0,
      'jsdoc/valid-types': [
        'error',
        {
          allowEmptyNamepaths: false,
        },
      ],
    },
  },
];
