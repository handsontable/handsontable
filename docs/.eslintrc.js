module.exports = {
  extends: ['../.eslintrc.js'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    sourceType: 'module'
  },
  ignorePatterns: [
    '**/guides/**/*.js',
    '**/guides/**/*.ts',
    '**/guides/**/*.jsx',
    '**/guides/**/*.tsx'
  ],
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
    },
    {
      files: ['SvgFrameworkIcons.vue'],
      rules: {
        'max-len': 'off'
      }
    }
  ]
};
