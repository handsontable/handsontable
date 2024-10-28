/* eslint-disable global-require */
module.exports = {
  configs: {
    recommended: {
      plugins: ['handsontable'],
      rules: {
        'handsontable/restricted-module-imports': 'off',
      }
    }
  },
  rules: {
    'restricted-module-imports': require('./rules/restricted-module-imports'),
  },
};
