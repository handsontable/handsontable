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
        'plugin:react-hooks/recommended',
      ],
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'react-hooks'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        // Editor lifecycle stubs (open/close/focus) and test doubles are intentionally
        // empty - real bodies come from a class field or are asserted separately.
        '@typescript-eslint/no-empty-function': ['error', { allow: ['methods', 'arrowFunctions', 'functions'] }],
        // As in handsontable/.eslintrc.js: TS + closures make this rule redundant, and it
        // false-positives on hooks/callbacks that close over a later-declared state setter.
        'no-use-before-define': 'off',
      },
    },
    {
      files: ['test/**'],
      env: { jest: true },
      rules: {
        // As in handsontable/.eslintrc.js's *.unit.js/*.unit.ts/*.spec.js override: test helpers
        // and inline test components don't carry the same documentation obligation as library code.
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-param-type': 'off',
        'jsdoc/require-returns': 'off',
        // As in handsontable/.eslintrc.js's test/** override: sequential poll loops
        // (`for (...) { await sleep(0); }`) are a deliberate, idiomatic test pattern here.
        'no-await-in-loop': 'off',
      },
    },
  ],
};
