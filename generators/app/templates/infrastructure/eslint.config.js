const { fixupConfigRules } = require('@eslint/compat'),
  js = require('@eslint/js'),
  { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = [
  ...fixupConfigRules(
    compat.extends('eslint:recommended', 'plugin:node/recommended', 'plugin:jest/recommended', 'plugin:import/recommended')
  ),
  {
    languageOptions: {
      globals: {
        ...require('eslint-plugin-jest').environments.globals.globals
      },
      ecmaVersion: 'latest',
      sourceType: 'commonjs'
    },
    files: ['**/*.js'],
    rules: {
      'node/exports-style': ['error', 'module.exports'],
      'node/file-extension-in-import': ['error', 'always'],
      'node/prefer-global/buffer': ['error', 'always'],
      'node/prefer-global/console': ['error', 'always'],
      'node/prefer-global/process': ['error', 'always'],
      'node/prefer-global/url-search-params': ['error', 'always'],
      'node/prefer-global/url': ['error', 'always'],
      'node/prefer-promises/dns': 'error',
      'node/prefer-promises/fs': 'error',
      'node/no-unpublished-require': 0,
      'no-unused-vars': [
        1,
        {
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['**/__tests__/**/*.js'],
    rules: {
      'node/no-unpublished-require': 0
    }
  }
]
