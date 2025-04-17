module.exports = {
  extends: ['../.eslintrc.js'],
  parser: '@babel/eslint-parser',
  plugins: [
    'handsontable',
  ],
  rules: {
    'handsontable/restricted-module-imports': [
      'error',
      '**/cellTypes',
      '**/cellTypes/?(index)',
      '**/editors',
      '**/editors/?(index)',
      '**/i18n',
      '**/i18n/?(index)',
      '**/plugins',
      '**/plugins/?(index)',
      '**/renderers',
      '**/renderers/?(index)',
      '**/validators',
      '**/validators/?(index)',
    ],
    'handsontable/require-async-in-it': 'error',
  },
  overrides: [
    {
      files: [
        'test/**',
        'src/3rdparty/walkontable/test/**',
        '*.unit.js',
        '*.spec.js',
        'src/plugins/**/__tests__/helpers/**',
      ],
      rules: {
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': [
          'error',
          { ignore: ['handsontable', 'walkontable'] }
        ],
        'no-restricted-globals': [
          'error',
          'fit',
          'fdescribe'
        ],
        'no-undef': 'off',
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'error',
      }
    },
    {
      files: ['*.unit.js', '*.spec.js'],
      rules: {
        'no-undef': 'off',
        'jsdoc/require-description-complete-sentence': 'off',
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns': 'off',
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'error',
      }
    },
    {
      files: ['*.unit.js'],
      rules: {
        'handsontable/require-async-in-it': 'off',
      }
    },
  ],
};
