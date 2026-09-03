// ESLint config for the Playwright test tier (tests/e2e, tests/visual).
// CommonJS (.cjs) because this package is "type": "module" and ESLint's
// legacy config loader requires CJS.
//
// This tier is greenfield — there is no legacy debt to baseline — so the
// determinism bans ship at `error`, not `warn`. A fixed delay or a
// `networkidle` wait must never enter a Playwright spec: wait for a
// condition (a web-first assertion, a locator state) instead.
//
// Scope is deliberately minimal: the @typescript-eslint PARSER (so `.ts`
// specs parse) plus core `no-restricted-syntax` bans. It does NOT pull in
// eslint-plugin-playwright — that richer ruleset is a new third-party
// dependency and is gated on the team-discussion required by the
// minimal-dependency policy (see tests/README.md).
const WAIT_FOR_FUNCTION_POLLING = 'waitForFunction() needs an explicit polling interval — pass `undefined, '
  + '{ polling: 100 }` (or another interval) as the options argument. The default polls on requestAnimationFrame, '
  + 'which parallel workers starve, so a healthy page times out with nothing wrong on it. See tests/AGENTS.md '
  + '(Determinism).';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='waitForTimeout']",
        message: 'No fixed page.waitForTimeout() — wait for a condition (a web-first assertion or a locator state). See .claude/skills/handsontable-playwright-e2e/references/determinism.md.',
      },
      {
        selector: "CallExpression[callee.name='sleep']",
        message: 'No fixed sleep() delay — wait for a condition instead. See .claude/skills/handsontable-playwright-e2e/references/determinism.md.',
      },
      {
        selector: "Literal[value='networkidle']",
        message: "No 'networkidle' wait — it is flaky and deprecated for web apps. Assert on a locator or response instead. See .claude/skills/handsontable-playwright-e2e/references/determinism.md.",
      },
      {
        selector: "CallExpression[callee.property.name='only']",
        message: 'No focused test (.only) — it silently drops the rest of the suite so the run is green while most tests never run. Remove the focus. See the test-writing-discipline skill.',
      },
      {
        selector: "CallExpression[callee.property.name='skip']",
        message: 'No skipped test (.skip) — a skipped test proves nothing. Fix the test or the code, or remove it. See the test-writing-discipline skill.',
      },
      {
        selector: "CallExpression[callee.property.name='fixme']",
        message: 'test.fixme() parks a known product bug and is allowed ONLY with an eslint-disable line naming the tracking task (`// eslint-disable-next-line no-restricted-syntax -- DEV-1234: <why>`), so the exception stays counted and attributable. See tests/AGENTS.md.',
      },
      {
        // Three shapes of the same miss: no options argument, an options literal without `polling`, and
        // that literal wrapped in a type assertion (`as`, `satisfies`, `<T>`). Only a plain options
        // VARIABLE is not judged; a spread is flagged too, because the rule asks the call site to be
        // explicit about the interval.
        selector: "CallExpression[callee.property.name='waitForFunction'][arguments.length<3]",
        message: WAIT_FOR_FUNCTION_POLLING,
      },
      {
        selector: "CallExpression[callee.property.name='waitForFunction'] > ObjectExpression.arguments:nth-child(3)"
          + ":not(:has(Property[key.name='polling'], Property[key.value='polling']))",
        message: WAIT_FOR_FUNCTION_POLLING,
      },
      {
        selector: "CallExpression[callee.property.name='waitForFunction']"
          + " > :matches(TSAsExpression, TSSatisfiesExpression, TSTypeAssertion).arguments:nth-child(3)"
          + " > ObjectExpression.expression:not(:has(Property[key.name='polling'], Property[key.value='polling']))",
        message: WAIT_FOR_FUNCTION_POLLING,
      },
    ],
  },
};
