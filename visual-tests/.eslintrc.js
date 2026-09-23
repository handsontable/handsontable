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
// in its bare and titled forms only: the two-argument conditional form (`test.skip(condition, why)`) is
// what `visualTest()` in `src/test-runner.ts` emits from a spec's variant declaration, so it stays legal
// here. A spec no longer writes one itself — see SPEC_DECLARATION_RESTRICTIONS below.
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
      + 'remove it; the conditional `test.skip(condition, why)` form that `visualTest()` emits from a '
      + 'variant declaration stays legal. A parked test carries `// eslint-disable-next-line '
      + 'no-restricted-syntax -- DEV-1234: <why>` naming the owning task.',
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
// Visual-only, so it is kept out of the two blocks above, which stay verbatim copies of `tests/.eslintrc.cjs`:
// a functional spec asserts, so it has no capture to guard. A capture on the statement straight after a
// pointer or keyboard primitive photographs whichever half of the transition the runner reached — the
// focus move a Tab starts, the highlight a click paints on the next frame. The filters family is where that
// was measured, so its 28 sites were repaired when this landed (assert the state, then capture: 28 of 28
// captures byte-identical before and after, locally); the other 100 wear a tracked disable line.
//
// esquery 1.7.0 (ESLint 8.57.1): `A + B` reports B when A is the statement right before it, so the message
// lands on the capture line, which is where the disable line goes. Three traps, all measured. The relative
// `:has(> X)` form parses and matches NOTHING, with no error: a first draft written that way reported 0 sites
// where there are 128. `~` fires on ANY earlier sibling, so it cannot express "nothing asserted in between"
// and is not a broader `+`. And the capture half must be the statement's OWN call, read through attribute
// paths: a descendant `:has()` there also matches a whole `visualTest(…)` statement whose body captures, so
// a test that acts followed by a test that captures reported the second test call itself (2 false sites in
// cross-browser/copy-paste.spec.ts). The action half keeps the descendant form on purpose — an action
// nested inside the previous statement (`await Promise.all([… click() …])`) still acted.
//
// Adjacency sees the previous statement only. A comment between the action and the capture does not break
// it (comments are not AST siblings); a neutral statement does (`const box = …`, 1 site of 211 when this was
// measured with the page helpers counted), and so does a tracked `waitForTimeout()`, which shields 18
// captures today — they start firing when those sleeps are replaced, so the disable line moves, it does not
// disappear. Page helpers are deliberately not enumerated: a renamed helper would silently leave the list,
// and the helpers that act without asserting (25 of the 48 exported from `src/page-helpers.ts` on 2026-09-23)
// are their own follow-up, each ending on the state it produced.
//
// Primitives only, and all of them: the pointer and keyboard methods of a locator, plus any call on
// `page.mouse`, `page.keyboard` or `page.touchscreen`. The names past the seven the spec listed (`tap`,
// `pressSequentially`, `clear`, `check`, `uncheck`, `setChecked`, `selectOption`) matched 0 extra sites
// when this landed; they are here so the modern spellings of the same action are not a way around it.
//
// One rule id, one severity: `no-restricted-syntax` cannot be `warn` for this selector and `error` for the
// sleep bans, and a disable line on a capture silences every selector on that line (harmless — a
// `tablePage.screenshot()` is the one statement none of the others can match). Measured 2026-09-23: 128 of
// 274 captures in 50 of 112 specs — 61 multi-frameworks, 59 js-only, 8 cross-browser; 0 in `src/`.
const CAPTURE = ':matches(ExpressionStatement[expression.argument.callee.property.name="screenshot"], '
  + 'ExpressionStatement[expression.callee.property.name="screenshot"])';
const POINTER_OR_KEYBOARD_METHOD = '/^(click|dblclick|tap|hover|press|pressSequentially|type|fill|clear|check'
  + '|uncheck|setChecked|selectOption|dragTo)$/';
const CAPTURE_RESTRICTIONS = [
  {
    selector: `ExpressionStatement:has(CallExpression[callee.property.name=${POINTER_OR_KEYBOARD_METHOD}]) `
      + `+ ${CAPTURE}, `
      + 'ExpressionStatement:has(CallExpression[callee.object.property.name=/^(mouse|keyboard|touchscreen)$/]) '
      + `+ ${CAPTURE}`,
    message: 'A capture straight after a pointer or keyboard action photographs whichever half of the '
      + 'transition the runner reached. Assert the state the screenshot is meant to show first — `await '
      + 'expect(locator).toBeFocused()` / `.toBeVisible()` / `.toBeHidden()` / `.toHaveClass()` — or call a '
      + 'page helper that does. A tracked exception carries `// eslint-disable-next-line no-restricted-syntax '
      + '-- DEV-1234: <why>`. See visual-tests/AGENTS.md (Determinism).',
  },
];
// The two shapes a spec must not write once `visualTest()` exists, scoped to `tests/**/*.spec.ts` so the
// conditional skip stays legal in `src/`, which is where it is emitted from now. A bare `test()` renders on
// every variant the tier launches and states nothing, which is how the golden set grew from 1646 to 1676
// records in nine days with no number to review; a spec-side `test.skip()` is the ad hoc scoping the
// declaration replaces, and the two together would fight — a file-scope modifier applies to every test in
// the file, so a hand-written skip beside a declaration COMBINES with the one `visualTest()` emits: the
// file renders only what both allow, which can be nothing, and the declaration stops describing what
// renders. `tests/cross-browser/merging.spec.ts` is the one exception: it parks a
// test that renders nothing and already carries its own disable line.
const SPEC_DECLARATION_RESTRICTIONS = [
  {
    selector: 'CallExpression[callee.type="Identifier"][callee.name="test"]',
    message: 'Declare the variants with visualTest(title, { themes, browsers, wrappers }, fn) instead of '
      + 'test() — a bare test() renders on every variant the tier launches and says so nowhere, so nothing '
      + 'can derive or review the golden count. '
      + 'See visual-tests/AGENTS.md (Guardrails against bloat and flakes).',
  },
  {
    selector: 'CallExpression[callee.object.name="test"][callee.property.name="skip"]',
    message: 'A spec does not call test.skip() to scope itself — name the variants in its visualTest() '
      + 'declaration and visualTest() emits the skip. A hand-written skip beside a declaration applies at '
      + 'file scope too, so the two combine: the file renders only what both allow, which can be nothing, '
      + 'and the declaration stops describing what renders. A parked test carries '
      + '`// eslint-disable-next-line no-restricted-syntax -- DEV-1234: <why>`.',
  },
];
// The statement a spec's docblock belongs to, and the ticket it has to name: a ClickUp id or a GitHub issue.
// The regex is matched against the block's main description, so a ticket in a trailing tag does not count.
const SPEC_TEST_CALL = 'ExpressionStatement > CallExpression[callee.name=/^(test|visualTest)$/]';
const SPEC_DOCBLOCK_TICKET = '[\\s\\S]*(\\b(DEV|PRO|SU)-\\d+\\b|#\\d{4,})[\\s\\S]*';
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
          ...CAPTURE_RESTRICTIONS,
        ],
      }
    },
    {
      // Everything a spec must not write, on top of the `*.ts` rules above. One entry on purpose: the
      // capture-adjacency and docblock rules land in this same entry, so a spec is judged by one glob.
      files: ['tests/**/*.spec.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          ...AIRBNB_RESTRICTED_SYNTAX,
          ...WAIT_FOR_FUNCTION_POLLING_RESTRICTIONS,
          ...DETERMINISM_RESTRICTIONS,
          ...CAPTURE_RESTRICTIONS,
          ...SPEC_DECLARATION_RESTRICTIONS,
        ],
        // Every test call carries a docblock that says what its capture proves and names the ticket that
        // owns it, so a red golden has an owner and a stale spec has a stated reason to exist. When this
        // landed, 91 of the 115 calls had no block, none of the 24 that had one named a ticket, and six of
        // those were copies of one filters spec's sentence, pasted onto specs about something else.
        //
        // Setting `contexts` does not cost the function rule: the plugin's option schema defaults
        // `require.FunctionDeclaration` to true, so a function in a spec still needs its block (measured,
        // and pinned by behavior in the self-test, since reading the option back sees the default). The
        // context names `visualTest` as well as `test`: after the variant declaration renamed every call,
        // a `callee.name="test"` selector matched nothing and the rule was silently off (measured). A
        // looped spec (`urls.forEach(url => { visualTest(…) })`) gets one block per inner call, which is
        // where the jsdoc plugin attaches it.
        'jsdoc/require-jsdoc': ['error', {
          contexts: [SPEC_TEST_CALL],
        }],
        'jsdoc/match-description': ['error', {
          mainDescription: SPEC_DOCBLOCK_TICKET,
          message: 'The spec docblock says what the capture proves and names the ticket that owns it '
            + '(DEV-1234, or a GitHub issue as #12345). See visual-tests/AGENTS.md (Determinism).',
          contexts: [SPEC_TEST_CALL],
        }],
      }
    },
    {
      // Same treatment the root config gives `scripts/**/*.mjs`: Node ESM needs
      // the file extension on relative imports, which the base config forbids.
      // `test/` holds the lint config's own self-test, which imports ESLint.
      files: ['lib/**/*.mjs', 'test/**/*.mjs'],
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
