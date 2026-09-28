// The Playwright determinism ban this tier shares with `tests/.eslintrc.cjs`: no `waitForFunction()`
// without an explicit `{ polling }`. The default polls on `requestAnimationFrame`, which a loaded
// machine starves, so the wait times out on a healthy page. Same three selectors and the same message
// as the functional tier, so the tiers judge the same shapes — `tests/.eslintrc.cjs` is the copy to
// update first when one changes. The third selector only matches TypeScript syntax; on the `.mjs`
// helpers it is harmless and kept so the block stays a verbatim copy.
const WAIT_FOR_FUNCTION_POLLING = 'waitForFunction() needs an explicit polling interval — pass `undefined, '
  + '{ polling: 100 }` (or another interval) as the options argument. The default polls on requestAnimationFrame, '
  + 'which parallel workers starve, so a healthy page times out with nothing wrong on it. See tests/AGENTS.md '
  + '(Determinism).';
const WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS = [
  {
    selector: 'CallExpression[callee.property.name="waitForFunction"][arguments.length<3]',
    message: WAIT_FOR_FUNCTION_POLLING,
  },
  {
    selector: 'CallExpression[callee.property.name="waitForFunction"] > ObjectExpression.arguments:nth-child(3)'
      + ':not(:has(Property[key.name="polling"], Property[key.value="polling"]))',
    message: WAIT_FOR_FUNCTION_POLLING,
  },
  {
    selector: 'CallExpression[callee.property.name="waitForFunction"]'
      + ' > :matches(TSAsExpression, TSSatisfiesExpression, TSTypeAssertion).arguments:nth-child(3)'
      + ' > ObjectExpression.expression:not(:has(Property[key.name="polling"], Property[key.value="polling"]))',
    message: WAIT_FOR_FUNCTION_POLLING,
  },
];
// A rule setting replaces the inherited one rather than merging with it, so the airbnb list every
// `.ts` file gets today (`for..in`, `for..of`, labels, `with`) is spread in first.
const AIRBNB_RESTRICTED_SYNTAX = require('eslint-config-airbnb-base/rules/style')
  .rules['no-restricted-syntax'].slice(1);

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
        }],
        'no-restricted-syntax': ['error', ...AIRBNB_RESTRICTED_SYNTAX, ...WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS],
      }
    },
    {
      files: ['*.mjs'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'import/extensions': 'off',
        // The `lib/` helpers drive the page too (`scroll-utils.mjs` waits on the index mapper), so
        // the polling ban applies here as well.
        'no-restricted-syntax': [
          'error',
          'ForInStatement',
          'LabeledStatement',
          'WithStatement',
          ...WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS,
        ],
      }
    },
  ],
};
