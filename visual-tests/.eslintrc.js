// The Playwright determinism ban this tier shares with `tests/.eslintrc.cjs`: no `waitForFunction()`
// without an explicit `{ polling }`. The default polls on `requestAnimationFrame`, which a loaded
// machine starves, so the wait times out on a healthy page. Same three selectors and the same message
// as the functional tier, so the tiers judge the same shapes — `tests/.eslintrc.cjs` is the copy to
// update first when one changes. The third selector only matches TypeScript syntax; it is harmless
// on plain JavaScript and kept so the block stays a verbatim copy.
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
        // The Playwright code of this tier (`src/`, `tests/`) is TypeScript; `lib/` and `scripts/`
        // drive no page, so the ban is scoped here.
        'no-restricted-syntax': ['error', ...AIRBNB_RESTRICTED_SYNTAX, ...WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS],
      }
    },
    {
      // Same treatment the root config gives `scripts/**/*.mjs`: Node ESM needs
      // the file extension on relative imports, which the base config forbids.
      files: ['lib/**/*.mjs'],
      rules: {
        'import/extensions': [
          'error',
          'never',
          {
            js: ['error', 'always'],
            mjs: ['error', 'always'],
            json: ['error', 'always'],
          }
        ],
        'no-restricted-globals': 'off',
        'no-console': 'off',
      }
    }
  ]
};
