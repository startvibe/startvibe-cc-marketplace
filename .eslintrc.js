module.exports = {
  env: {
    browser: false,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // Must be last to disable conflicting rules
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.min.js',
    'coverage/',
    '.husky/_/',
  ],
};
