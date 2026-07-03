/* eslint-disable global-require */
module.exports = {
  configs: {
    recommended: {
      plugins: ['handsontable'],
      rules: {
        'handsontable/restricted-module-imports': 'off',
        'handsontable/require-async-in-it': 'off',
        'handsontable/no-native-error-throw': 'off',
      }
    }
  },
  rules: {
    'restricted-module-imports': require('./rules/restricted-module-imports'),
    'require-async-in-it': require('./rules/require-async-in-it'),
    'require-await': require('./rules/require-await'),
    'no-native-error-throw': require('./rules/no-native-error-throw'),
    'no-direct-dom-geometry-read': require('./rules/no-direct-dom-geometry-read'),
  },
};
