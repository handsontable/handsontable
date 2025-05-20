/* eslint-disable global-require */
module.exports = {
  configs: {
    recommended: {
      plugins: ['handsontable'],
      rules: {
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'off',
      }
    }
  },
  rules: {
    'restricted-module-imports': require('./rules/restricted-module-imports'),
    'require-async-in-it': require('./rules/require-async-in-it'),
    'require-await': require('./rules/require-await'),
  },
};
