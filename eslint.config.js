const tseslint = require('typescript-eslint');
const eslintPluginImport = require('eslint-plugin-import');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'uploads',
      'client/public',
      'miniapp',
      '.agents',
      'eslint.config.js',
      '**/*.config.js',
      '**/*.config.cjs',
      '.stylelintrc.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['server/**/*.ts', 'shared/**/*.ts'],
    plugins: { import: eslintPluginImport },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/no-extraneous-dependencies': 'error',
      'no-console': 'off',
    },
  },
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
