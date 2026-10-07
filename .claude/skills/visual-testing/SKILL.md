---
name: visual-testing
path: visual-tests/**
description: Use when writing Playwright visual regression tests or adding a demo route for one - covers the decision rule (what earns a capture, and that a visual spec is in addition to a Playwright assertion), the custom tablePage fixture, the screenshot workflow, reg-suit comparison, and the demo routes in examples/next/visual-tests/
---

# Visual Regression Testing with Playwright

Visual tests live in `visual-tests/` (Playwright + TypeScript); reg-suit compares screenshots against golden records. Two workflows: (a) add a visual test for an existing demo route, (b) add a new `/<feature>-demo` route to the js demo in `examples/next/visual-tests/js/demo/` (the `creating-visual-test-examples` skill) and write the test for it. `examples/next/docs/` is the documentation examples tree and the visual suite does not serve it.

## Decision rule

A screenshot proves pixels only. Capture one screenshot per distinct visual state, assert that state first, and keep the DOM and API facts (focus, selection, data, "the menu opened") as Playwright assertions in `tests/e2e` – a visual spec is in addition to, never instead of them. The canonical paragraph, the measured numbers, and why a new feature gets its own demo route (and its wrapper-coverage cost) are `visual-tests/AGENTS.md` → Decision rule. Read it before writing the spec.

## Custom fixture: `tablePage`

Import the custom runner. `visualTest` registers a spec; a bare `test(` is a lint error:

```typescript
import { visualTest, expect } from '../../../src/test-runner';
```

The `tablePage` fixture (`visual-tests/src/test-runner.ts`) navigates to the demo page, waits for the table, disables CSS animations and transitions, and before every capture waits out the scrollbar-clearance band and clears a stray native text selection. So an element capture is a clipped `tablePage.screenshot()`.

## Test naming

First argument is `__filename`; the runner builds the title from the path. File names are kebab-case and describe the visual state (`apply-active-class-name-nested-header.spec.ts`).

## Screenshot workflow

Reach a visual state, assert it, capture it once. A second capture is a second visual state.

```typescript
import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

/**
 * Checks that the focused cell renders its current-cell highlight. Owned by DEV-<number>.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  // One visual state: the focused cell. Assert it before the capture; a screenshot on the line
  // after `click()` records whichever half of the transition the runner reached.
  await cell.click();
  await expect(cell).toHaveClass(/current/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

Every test call carries a docblock that says what its capture proves and names the owning ticket: a ClickUp ID in the `DEV-`, `PRO-` or `SU-` space, or a GitHub issue of four or more digits as `#12345`. Both halves are lint errors when missing (`jsdoc/require-jsdoc`, `jsdoc/require-description`, `jsdoc/match-description`); `DEV-<number>` above is a placeholder the lint rejects, so a copy fails until it names a real owner. A capture on the statement straight after a click, key press, or other pointer/keyboard action is a lint error at the capture.

Use `helpers.screenshotPath()` for `path`: it generates the deterministic file names (test file path, browser, framework, screenshot index) that the path-based comparison matches on.

The `visualTest()` declaration names the variants the spec renders on; the golden set is the sum of every spec's declaration intersected with the tier. Start from the default shown above (two themes, one browser, no wrapper): two goldens per capture, against five for specs written before the declaration.

- Add `CLASSIC` to `themes` when the spec is about the bare delivery path (the core inlines the main theme stylesheet).
- Add a `horizon` theme when the pixels judged are theme tokens rather than geometry.
- Add a wrapper only with a `wrappersReason` saying what the wrapper render proves that the js render does not; each wrapper is one more golden per capture.
- Use `themes: ['main']` alone only for a look check whose behavior a functional test asserts on every theme: name that `tests/e2e` spec (or the Jasmine spec under `handsontable/src`) in the docblock, in backticks; the declaration sweep checks the file exists.
- Write one declaration key per line as the example does: on a single line the default is 121 characters, one over the package's `max-len`.

`visual-tests/AGENTS.md` → Variant declaration has the axes and the two invariants.

## Test organization

- `visual-tests/tests/js-only/`: vanilla JS demo only, usually on its own `/<feature>-demo` route.
- `visual-tests/tests/multi-frameworks/`: JS, React, Angular, and Vue demos. They photograph the shared `/` grid and never navigate.
- `visual-tests/tests/cross-browser/`: Chromium, Firefox, and WebKit.

The directory decides which Playwright config runs the spec; the declaration decides which variants it renders inside that config. `wrappers: []` keeps a spec off the wrapper baselines, a non-empty `wrappers` list needs a `wrappersReason`, and `browsers` names more than `chromium` only under `cross-browser/`. `visualTest()` emits the skip from the declaration; scope a spec through it (a `test.skip()` in a spec is a lint error).

## Navigating to custom pages

For a demo route other than `/`, use the `goto` fixture:

```typescript
/**
 * Checks that the my-feature demo renders its grid. Owned by DEV-<number>.
 */
visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto(
    helpers.setBaseUrl('/my-feature-demo').getFullUrl()
  );
  await expect(tablePage.locator(helpers.selectors.mainTable)).toBeVisible();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

A route exists on the js demo only, so a spec that navigates is js-only by construction (wrapper trade-off: decision rule).

## Helpers

- `visual-tests/src/helpers.ts`: `screenshotPath()`, `selectors`, `findCell()`, `cssPath()`, `setBaseUrl()` / `getFullUrl()`.
- `visual-tests/src/page-helpers.ts`: `selectCell()`, `openEditor()`, `openContextMenu()`, `createSelection()`, `openHeaderDropdownMenu()`, `filterByValue()`, `filterByCondition()`, `scrollTableToTheBottom()`, and more. Capture through `tablePage.screenshot({ path: helpers.screenshotPath() })`, the one capture form.

## Running tests

Scripts: `visual-tests/package.json`. Configs: `visual-tests/playwright.config.ts` (default), `visual-tests/playwright-cross-browser.config.ts`.

What CI renders depends on the tier (`VISUAL_TIERS` in `visual-tests/src/config.mjs`; reasoning and numbers in `visual-tests/AGENTS.md`, Tiers):

- A pull request renders the `pr` tier: vanilla JS specs on Chromium with the `main` and `main-dark` themes, plus a wrapper only when that wrapper's own `wrappers/<pkg>/` tree changed.
- Horizon, the classic delivery path, Firefox, and WebKit are rendered by the develop seed (`visual-seed.yml`) after a merge and become the golden records; when the merge changed any of them, the seed comments the list on the merged pull request. The wrappers are rendered for real only by the weekday nightly (`visual-nightly.yml`; the seed copies the js render into their goldens), which goes red on any difference from the seed outside `visual-tests/visual-quarantine.json`. A theme-only regression shows in the seed's comment, not as a red nightly.
- A pull request that touches `visual-tests/**` or `examples/next/visual-tests/**` renders everything (the `full` tier).
- Locally, `VISUAL_TIER=pr npm run build && VISUAL_TIER=pr npm run test` (from `visual-tests/`) renders what a pull request renders and skips the wrapper installs; pass the same `VISUAL_TIER=pr` to `npm run compare`. A bare `npm run test` on a feature branch renders everything. Visual specs run outside git and agent hooks; `.ai/LOCAL-ENFORCEMENT.md` has the enforcement map.

## Demo routes

A new feature gets its own `/<feature>-demo` route on the js demo's Navigo router (`examples/next/visual-tests/js/demo/src/index.js`) backed by a `src/demos/<feature>/` module (structure: `creating-visual-test-examples` skill). The shared `/` grid stays unchanged: every spec that photographs it re-captures on every variant, and its config must stay identical across all four framework demos.

## Common mistakes

- A page helper call between an action and the capture silences the capture lint whether or not the helper asserts, so check that it does: 25 of the 48 exported helpers in `src/page-helpers.ts` call a pointer or keyboard action and no `expect()` or wait (2026-09-23). The Determinism section of `visual-tests/AGENTS.md` lists the shapes that have flaked.
- Assert the state first with `toBeFocused()`, `toBeVisible()`, `toBeHidden()`, or `toHaveClass()`.
- JS-only tests belong in `js-only/`, multi-framework tests in `multi-frameworks/`.
