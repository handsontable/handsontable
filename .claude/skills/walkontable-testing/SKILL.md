---
name: walkontable-testing
path: handsontable/src/3rdparty/walkontable/**
description: Use when writing tests for the Walkontable rendering engine - has its own separate test pipeline, runner, and configuration distinct from main Handsontable E2E tests
---

# Testing the Walkontable Rendering Engine

> Walkontable follows the same freeze as the main suite. Its Playwright home is `tests/e2e/walkontable/` (page objects in `tests/fixtures/pages/walkontable/`). Maintenance edits to existing `*.spec.js` are allowed; new or flaky walkontable tests go to Playwright (the presence gate blocks a new walkontable `*.spec.js`). In CI the legacy Jasmine/Puppeteer walkontable job and the Playwright e2e job run in parallel. This guide is for maintaining the frozen Jasmine specs.

## Separate test pipeline

- **Run:** `npm run test:walkontable --prefix handsontable` (the `test/spec/` specs). `test:e2e` does not pick them up.
- **Location:** `src/3rdparty/walkontable/test/`
  - `test/spec/`: Jasmine + Puppeteer with a separate Rspack config and bootstrap. Only `test:walkontable` runs them.
  - `test/unit/`: Jest tests for calculators, filters, renderers, utilities (48 `*.unit.ts`/`*.unit.js` files). The core `jest.config.js` picks them up, so `npm run test:unit` and the core `Unit / test` CI job run them, and `test:walkontable` does not.

## Writing tests

- `it()` callbacks that call rendering APIs are `async` and `await` those calls.
- Tests are organized by subsystem (`overlay/`, `scroll/`, `selection/`, `renderer/`, `table/`, `viewport.spec.js`); place new ones in the matching directory.

## What to cover

- **Frozen rows and columns:** the 6 overlay types are the most fragile part; include frozen scenarios for overlay positioning and sync.
- **Viewport calculations:** small containers that clip, containers larger than the data, dynamic resize.
- **Scroll synchronization:** horizontal and vertical scroll keep frozen overlays aligned.
- **Large datasets:** 10k+ rows. Populate arrays with `forEach`; `arr.push(...largeArray)` overflows the stack.

## Common mistakes

- Running Walkontable tests via `test:e2e`.
- Changing the test bootstrap or Rspack config without confirming `test/spec/` passes under `test:walkontable` and `test/unit/` under the core `test:unit`.
- Clearing an inline overflow longhand with jQuery: `$el.css('overflow-x', '')` leaves an inline `overflow-x` in this harness, so the "clip removed" branch asserts against the wrong layout. Write `el.style.overflowX = ''` and assert the intermediate fact (`getComputedStyle(el).overflowX === 'visible'`) before the behavior.
- Trusting the spec count. A failing spec whose `expected`/`actual` was a cyclic object (`toBe(window)`, `toEqual([overlay, ...])`) used to be dropped at the Puppeteer bridge (`Running 16 specs.`, then `15 specs, 0 failures`, exit 0; the `getOverlays` spec sat like that from #12951). `test/helpers/jasmine-bridge-reporter.js` now reports it as a failure (`[unserializable Window]`). If a count comes up short, compare the `Running N specs.` line with the summary via `npm run test:walkontable -- --testPathPattern=<file> --verbose`.
- Turning on `rowHeightsUniform`/`columnWidthsUniform` in a bare Walkontable spec and asserting scrollbar-dependent row/column counts: the bare harness overflows content without a real scrollbar while the single-pass layout snapshot predicts one, so they diverge. Assert the snapshot booleans directly, or use a fixture that renders a real scrollbar.
