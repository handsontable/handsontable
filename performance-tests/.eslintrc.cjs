module.exports = {
  extends: [
    '../.eslintrc.js',
    'plugin:import/typescript'
  ],
  parserOptions: {
    requireConfigFile: false,
  },
  rules: {
    'import/no-unresolved': 'off',
    // Performance test tooling code -- JSDoc is not required for every internal helper.
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/valid-types': 'off',
    // Loose null checks (== null) are idiomatic for "null or undefined" in JS tooling.
    'no-eq-null': 'off',
    // Not core library code -- `console` and `window` usage is expected.
    'no-restricted-globals': 'off',
    'no-console': 'off',
    // Sequential await in loops is intentional (measure one iteration at a time).
    'no-await-in-loop': 'off',
    // Destructured parameters can legitimately shadow the outer function parameter name.
    'no-shadow': 'off',
    // Mixed operators in math expressions (e.g. (v - mean) ** 2) are readable as-is.
    'no-mixed-operators': 'off',
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'import/extensions': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error', {
          functions: false,
          classes: false,
          variables: true,
          typedefs: false
        }]
      }
    },
    {
      files: ['*.mjs'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import/extensions': 'off',
        'no-restricted-syntax': [
          'error',
          'ForInStatement',
          'LabeledStatement',
          'WithStatement',
        ],
      }
    },
  ],
};
