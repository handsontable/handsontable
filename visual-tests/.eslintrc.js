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
// The rest of the functional tier's determinism bans (`tests/.eslintrc.cjs`), carried here at `error`
// too. A visual spec has no assertion of its own — the screenshot is the assertion — so a fixed delay
// before a capture photographs whichever half of a transition the runner reached; the two flake shapes
// DEV-2797 measured in CI (a scrollbar-clearance band created on the frame after a click, a filters
// input focused on a 10 ms timer) are exactly that. The 2024 import carries fixed sleeps at 40-odd
// sites; each one now wears an eslint-disable line naming the task, the convention `tests/AGENTS.md`
// uses for `test.fixme`, so the debt is counted and greppable while it is paid down. `.skip` is banned
// in its bare and titled forms only: the two-argument conditional form (`test.skip(condition, why)`)
// is how the js-only specs and the chromium-only clipboard specs declare their variant, and it stays.
const DETERMINISM_RESTRICTIONS = [
  {
    selector: 'CallExpression[callee.property.name="waitForTimeout"]',
    message: 'No fixed page.waitForTimeout() before a capture — wait for the state the screenshot is meant '
      + 'to show (`await expect(locator).toBeFocused()` / `.toBeVisible()` / `.toHaveClass()`, or a page '
      + 'helper that waits for it). A tracked exception carries `// eslint-disable-next-line '
      + 'no-restricted-syntax -- DEV-1234: <why>`. See visual-tests/AGENTS.md (Determinism).',
  },
  {
    selector: 'CallExpression[callee.name="sleep"]',
    message: 'No fixed sleep() delay — wait for a condition instead. See visual-tests/AGENTS.md (Determinism).',
  },
  {
    // The global timer only: bare `setTimeout(`, `window.setTimeout(`, and `globalThis.setTimeout(` —
    // the usual disguise is a timer inside `page.evaluate` once `waitForTimeout` is banned.
    // `test.setTimeout(ms)` sets a budget, not a wait, and must stay legal.
    selector: 'CallExpression[callee.name="setTimeout"], '
      + 'CallExpression[callee.object.name="window"][callee.property.name="setTimeout"], '
      + 'CallExpression[callee.object.name="globalThis"][callee.property.name="setTimeout"]',
    message: 'No setTimeout() in a spec, a fixture or a page helper — a fixed timer is not a wait, wherever '
      + 'it lives. Wait on the DOM state instead. See visual-tests/AGENTS.md (Determinism).',
  },
  {
    selector: 'Literal[value="networkidle"]',
    message: 'No "networkidle" wait — it is flaky and deprecated for web apps. Wait for the table or the '
      + 'element instead. See visual-tests/AGENTS.md (Determinism).',
  },
  {
    selector: 'CallExpression[callee.property.name="only"]',
    message: 'No focused test (.only) — it silently drops the rest of the suite so the run is green while '
      + 'most captures never render. Remove the focus.',
  },
  {
    // Bare `skip()`, or a titled test whose body is the second argument — `test.skip(__filename, fn)`
    // is the form this tier would actually write. The conditional form's second argument is the
    // reason string, so it is left alone.
    selector: 'CallExpression[callee.property.name="skip"][arguments.length<2], '
      + 'CallExpression[callee.property.name="skip"]'
      + '[arguments.1.type=/^(ArrowFunctionExpression|FunctionExpression)$/]',
    message: 'No skipped test (.skip) — a skipped capture proves nothing and its golden lingers. Fix it or '
      + 'remove it; the conditional `test.skip(condition, why)` form that scopes a spec to a framework or '
      + 'browser stays legal. A parked test carries `// eslint-disable-next-line no-restricted-syntax -- '
      + 'DEV-1234: <why>` naming the owning task.',
  },
  {
    // `locator.screenshot()` (or `elementHandle.screenshot()`) skips the wrapper in src/test-runner.ts that
    // waits out the scrollbar-clearance band and clears a stray native selection before every capture.
    selector: 'CallExpression[callee.property.name="screenshot"][callee.object.type="Identifier"]'
      + '[callee.object.name!=/^(tablePage|page)$/], '
      + 'CallExpression[callee.property.name="screenshot"][callee.object.type="CallExpression"]'
      + '[callee.object.callee.name!="getPageInstance"], '
      + 'CallExpression[callee.property.name="screenshot"][callee.object.type="MemberExpression"]',
    message: 'Capture through tablePage.screenshot() (or page.screenshot()) — an element screenshot bypasses '
      + 'the settle wait and the selection clear the fixture applies before every capture. Clip the page '
      + 'capture instead: tablePage.screenshot({ path, clip: await locator.boundingBox() }).',
  },
  {
    selector: 'CallExpression[callee.property.name="fixme"]',
    message: 'test.fixme() parks a known product bug and is allowed ONLY with an eslint-disable line naming '
      + 'the tracking task (`// eslint-disable-next-line no-restricted-syntax -- DEV-1234: <why>`).',
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
        'no-restricted-syntax': [
          'error',
          ...AIRBNB_RESTRICTED_SYNTAX,
          ...WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS,
          ...DETERMINISM_RESTRICTIONS,
        ],
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
