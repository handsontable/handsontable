// ESLint config for the Playwright test tier (tests/e2e, tests/visual).
// CommonJS (.cjs) because this package is "type": "module" and ESLint's
// legacy config loader requires CJS.
//
// This tier is greenfield — there is no legacy debt to baseline — so the
// determinism bans ship at `error`, not `warn`. A fixed delay (`waitForTimeout`,
// `sleep`, a `setTimeout` — including one hidden inside `page.evaluate`) or a
// `networkidle` wait must never enter a Playwright spec: wait for a condition
// (a web-first assertion, a locator state, `expect.poll` on a data probe) instead.
//
// Scope is deliberately minimal: the @typescript-eslint PARSER (so `.ts`
// specs parse) plus core `no-restricted-syntax` bans. It does NOT pull in
// eslint-plugin-playwright — that richer ruleset is a new third-party
// dependency and is gated on the team-discussion required by the
// minimal-dependency policy (see tests/README.md).
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
        // The global timer only: bare `setTimeout(`, `window.setTimeout(`, and `globalThis.setTimeout(` —
        // the usual disguise is a timer inside `page.evaluate` once `waitForTimeout` is banned. The member
        // form is pinned to the global object on purpose: Playwright's `test.setTimeout(ms)` and
        // `testInfo.setTimeout(ms)` set a budget, not a wait, and must stay legal.
        selector: "CallExpression[callee.name='setTimeout'], CallExpression[callee.object.name='window'][callee.property.name='setTimeout'], CallExpression[callee.object.name='globalThis'][callee.property.name='setTimeout']",
        message: 'No setTimeout() in a spec — a fixed timer is not a wait. Poll a data probe with expect.poll, or use a web-first assertion. A justified exception (a scheduling barrier, never a duration) carries the same eslint-disable line as test.fixme below, naming the owning task, so it stays counted and attributable. See tests/AGENTS.md.',
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
    ],
  },
};
