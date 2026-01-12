module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true, // Needed for Electron main process variables
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    // Suppress errors for React 17+ where import React is not needed
    'react/react-in-jsx-scope': 'off',
    // Allow 'any' types if necessary, though avoiding them is better
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};