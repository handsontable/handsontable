---
name: visual-testing
path: visual-tests/**
description: Use when writing Playwright visual regression tests or adding a demo route for one - covers the decision rule (what earns a capture, and that a visual spec is in addition to a Playwright assertion), the custom tablePage fixture, the screenshot workflow, reg-suit comparison, and the demo routes in examples/next/visual-tests/
---

# Visual Regression Testing with Playwright

## Overview

Visual tests live in `visual-tests/` and use Playwright with TypeScript. Screenshots are compared against golden records by reg-suit to detect visual regressions. There are two workflows: (a) add a visual test for a demo route that already exists, and (b) add a new `/<feature>-demo` route to the js demo in `examples/next/visual-tests/js/demo/` (the `creating-visual-test-examples` skill) and write a visual test for it. Nothing in the visual suite serves `examples/next/docs/` — that tree is the documentation examples.

## Decision rule

A screenshot proves pixels only. Capture one screenshot per distinct visual state, assert that state first, and keep the DOM and API facts (focus, selection, data, "the menu opened") as Playwright assertions in `tests/e2e` — a visual spec is in addition to, never instead of them. The canonical paragraph, the measured numbers behind it, and why a new feature gets its own demo route (and what that costs in wrapper coverage) are `visual-tests/AGENTS.md` → Decision rule. Read it before writing the spec.

## Custom Fixture: `tablePage`

Import the custom test runner instead of the default Playwright `test`. `visualTest` is how a spec registers, and a bare `test(` in a spec is a lint error:

```typescript
import { visualTest, expect } from '../../../src/test-runner';
```

The `tablePage` fixture (defined in `visual-tests/src/test-runner.ts`) automatically:

1. Navigates to the demo page.
2. Waits for the page to load and the table to appear.
3. Disables CSS animations and transitions for consistent screenshots.
4. Before every capture, waits out the scrollbar-clearance band and clears a stray native text selection — which is why an element capture is a clipped `tablePage.screenshot()`, never `locator.screenshot()`.

The fixture provides a standard Playwright `Page` object, so all Playwright APIs work as expected.

## Test Naming

Use `__filename` as the first argument. The runner auto-generates the test title from the file path. File names should be kebab-case and describe the visual state being captured (e.g., `apply-active-class-name-nested-header.spec.ts`).

## Screenshot Workflow

Every test follows this pattern: reach a visual state, assert it, capture it once. A second capture is a second visual state, never a second angle on the same one.

```typescript
import { visualTest, expect } from '../../../src/test-runner';
import { helpers } from '../../../src/helpers';
import { selectCell } from '../../../src/page-helpers';

visualTest(__filename, {
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ tablePage }) => {
  const cell = await selectCell(0, 2);

  // One visual state: the focused cell. Assert it before the capture — a screenshot on the line
  // after `click()` records whichever half of the transition the runner reached.
  await cell.click();
  await expect(cell).toHaveClass(/current/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
```

Always use `helpers.screenshotPath()` for the `path` argument. It auto-generates unique, deterministic file names based on the test file path, browser, framework, and screenshot index. Using any other naming approach will break the comparison, which matches screenshots by path.

The `visualTest()` declaration names the variants the spec renders on, and the golden set is the sum of every spec's declaration intersected with the tier. The shape above is the default for a new spec — two themes, one browser, no wrapper — and it is the one to start from: it costs two goldens per capture rather than the five every spec written before the declaration costs. Add `CLASSIC` to `themes` when the spec is about the bare delivery path (where the core inlines the main theme stylesheet), a `horizon` theme when the pixels being judged are theme tokens rather than geometry, and a wrapper only with a `wrappersReason` saying what the wrapper render proves that the js render does not — each wrapper is one more golden per capture. The tooling reads either layout, but write one key per line as the example does: the default on a single line is 121 characters, one over the package's `max-len`, so a spec that inlines it fails lint even though the declaration is correct. `visual-tests/AGENTS.md` → Variant declaration has the axes and the two invariants.

## Test Organization

- `visual-tests/tests/js-only/` -- Tests that run only against the vanilla JS demo, usually on their own `/<feature>-demo` route.
- `visual-tests/tests/multi-frameworks/` -- Tests that run against the JS, React, Angular, and Vue demos. They photograph the shared `/` grid and never navigate.
- `visual-tests/tests/cross-browser/` -- Tests that verify rendering on Chromium, Firefox, and WebKit.

The directory decides which Playwright config runs the spec; the declaration decides which variants it renders inside that config. `wrappers: []` keeps a spec off the wrapper baselines, a non-empty `wrappers` list needs a `wrappersReason`, and `browsers` only ever names more than `chromium` under `cross-browser/`. A spec never calls `test.skip()` to scope itself — that is a lint error, and `visualTest()` emits the skip from the declaration instead.

## Navigating to Custom Pages

For tests targeting a specific demo route (not the default `/` grid), use the `goto` fixture:

```typescript
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

A route exists on the js demo only (the wrapper demos serve `/`; react and angular also serve `/scenario-grid`, and no spec navigates there), so a spec that navigates is js-only by construction. The trade-off for wrapper coverage is in the decision rule.

## Available Helpers

- **`visual-tests/src/helpers.ts`** -- `screenshotPath()`, `selectors` (CSS selectors for table parts), `findCell()`, `cssPath()`, `setBaseUrl()` / `getFullUrl()`.
- **`visual-tests/src/page-helpers.ts`** -- `selectCell()`, `openEditor()`, `openContextMenu()`, `createSelection()`, `openHeaderDropdownMenu()`, `filterByValue()`, `filterByCondition()`, `scrollTableToTheBottom()`, and more. Capture through `tablePage.screenshot({ path: helpers.screenshotPath() })`; that is the one capture form.

## Running Tests

Check `visual-tests/package.json` for available scripts. Configuration files:

- `visual-tests/playwright.config.ts` -- Default config.
- `visual-tests/playwright-cross-browser.config.ts` -- Cross-browser config.

What CI renders depends on the tier (`VISUAL_TIERS` in `visual-tests/src/config.mjs`; the reasoning and the measured numbers are in `visual-tests/AGENTS.md`, Tiers):

- A pull request renders the `pr` tier: the vanilla JS specs on Chromium with the `main` and `main-dark` themes, plus a wrapper only when that wrapper's own `wrappers/<pkg>/` tree changed. No horizon themes, no bare "classic" run, no Firefox or WebKit.
- Horizon, the classic delivery path, Firefox, and WebKit are rendered by the develop seed (`visual-seed.yml`) minutes after a merge; when the merge changed any of them, the seed comments the list on the merged pull request, and those renders become the golden records. The wrappers are rendered for real only by the weekday nightly (`visual-nightly.yml`; the seed copies the js render into their goldens), which goes red on any difference from the seed outside the visual quarantine (`visual-tests/visual-quarantine.json`) — a wrapper drifting from js, a flaky or poisoned golden, or a commit whose seed never landed. A theme-only regression shows in the seed's comment, never as a red nightly.
- A pull request that touches `visual-tests/**` or `examples/next/visual-tests/**` renders everything (the `full` tier), so a spec or demo change is proven on every variant before it merges.
- Locally, `VISUAL_TIER=pr npm run build && VISUAL_TIER=pr npm run test` (from `visual-tests/`) renders what a pull request renders and skips the wrapper installs; pass the same `VISUAL_TIER=pr` to `npm run compare`. A bare `npm run test` on a feature branch still renders everything. Running a visual spec is never a git or agent hook — the enforcement map in `.ai/LOCAL-ENFORCEMENT.md` says why.

## Demo Routes

A new feature gets its own `/<feature>-demo` route on the js demo's Navigo router (`examples/next/visual-tests/js/demo/src/index.js`) backed by a `src/demos/<feature>/` module — the `creating-visual-test-examples` skill has the structure. Never extend the shared `/` grid: every spec that photographs it re-captures on every variant, and its config must stay identical across all four framework demos.

## Common Mistakes

- Not using `helpers.screenshotPath()` -- breaks screenshot matching, which is purely path-based.
- Capturing on the line after `click()` / `press()` / `type()` with nothing asserted in between -- the golden records whichever half of the transition the runner reached. Assert the state first (`toBeFocused()`, `toBeVisible()`, `toHaveClass()`); the Determinism section of `visual-tests/AGENTS.md` lists the shapes that have flaked.
- A second screenshot of the same visual state -- one capture per state; a second capture is a second state.
- `locator.screenshot()` -- a lint error; it bypasses the fixture's settle and selection clear. Clip a `tablePage.screenshot()` instead.
- A fixed delay (`waitForTimeout()`, `setTimeout`) -- a lint error; wait for the condition.
- Placing JS-only tests in `multi-frameworks/` or vice versa.
- Adding a feature to the shared `/` demo instead of its own route.
