module.exports = {
  extends: ['../../.eslintrc.js'],
  rules: {
    'no-restricted-globals': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
  },
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/recommended',
      ],
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
    },
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      extends: [
        'plugin:vue/vue3-essential',
        '@vue/typescript/recommended'
      ],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
      },
    },
  ],
};
