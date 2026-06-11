module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: ['plugin:vue/vue3-recommended', 'eslint:recommended', '@vue/eslint-config-typescript'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['dist', 'node_modules'],
};
