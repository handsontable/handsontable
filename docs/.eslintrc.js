module.exports = {
  extends: ['../.eslintrc.js'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  rules: {
    'no-restricted-globals': 'off',
    'import/no-unresolved': 'off'
  },
  overrides: [
    {
      files: ['*.mjs'],
      rules: {
        'import/extensions': 'off'
      }
    }
  ]
};
