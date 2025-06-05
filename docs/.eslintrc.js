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
    '**/guides/**/*.tsx',
    '**/public/scripts/prebuilt-umd/*.*',
    // FIXME: this is a workaround for the issue with the vuepress theme on jsnation 2025ś
    '.vuepress/theme/components/Navbar.vue'
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
