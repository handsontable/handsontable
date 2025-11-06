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
  ],
  rules: {
    'no-restricted-globals': 'off',
    'import/no-unresolved': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-param': 'off',
  },
  overrides: [
    {
      files: ['*.mjs'],
      rules: {
        'import/extensions': 'off'
      }
    },
    {
      files: ['SvgFrameworkIcons.vue', 'Navbar.vue', '.vuepress/3rdparty-scripts.js'],
      rules: {
        'max-len': 'off'
      }
    }
  ]
};
