---
name: handsontable-e2e-testing
description: Use when writing or modifying Jasmine/Puppeteer E2E tests (*.spec.js) for Handsontable, or when a bug fix or feature change needs E2E test coverage - covers the standard boilerplate, global test helpers, async/await requirements, mouse and keyboard event simulation, and plugin lifecycle testing patterns
---

# Handsontable E2E Testing Guide

## Standard boilerplate (MUST follow)

Every E2E test file must use this structure exactly:

```js
describe('MyFeature', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should do something', async() => {
    handsontable({ data: createSpreadsheetData(5, 5) });
    await selectCell(0, 0);
    expect(getDataAtCell(0, 0)).toBe('A1');
  });
});
```

## Critical rules (ESLint enforced)

- ALL `it()` callbacks MUST be `async`.
- HOT API calls MUST be `await`-ed (~50+ methods).
- Forgetting either causes flaky tests.

## Global helpers (NO imports needed)

These are injected automatically. Do not import them manually.

- **Instance:** `handsontable()`, `destroy()`, `updateSettings()`, `render()`
- **Data:** `createSpreadsheetData()`, `getDataAtCell()`, `getData()`, `setDataAtCell()`
- **Selection:** `selectCell()`, `selectCells()`, `getSelected()`
- **DOM:** `getCell()`, `spec()`, `hot()`
- **Plugins:** `getPlugin()`
- Full list in `test/helpers/common.js`.

## Event simulation

- **Mouse:** `mouseDown()`, `mouseUp()`, `mouseOver()`, `mouseClick()`, `mouseDoubleClick()` from `test/helpers/mouseEvents.js`
- **Keyboard:** `keyDown()`, `keyUp()`, `keyDownUp()` from `test/helpers/keyboardEvents.js`
- **Touch:** `triggerTouchEvent(type, target)`, `simulateTouch(target)` from `test/helpers/common.js`
  - `triggerTouchEvent('touchstart', element)` / `triggerTouchEvent('touchend', element)` — dispatches a single touch event
  - `simulateTouch(element)` — full Android sequence: touchstart → touchend → mousedown → mouseup → click (with `preventDefault` handling)
  - Both must be `await`-ed in spec files

### Testing touch / mobile behavior

When testing touch interactions (editors opening on double-tap, outside-click after touch, etc.):

```js
it('should open editor on double-tap', async() => {
  handsontable({ data: createSpreadsheetData(5, 5) });

  const cell = getCell(0, 0);

  // First tap — select
  await triggerTouchEvent('touchstart', cell);
  await triggerTouchEvent('touchend', cell);
  // Second tap — open editor
  await triggerTouchEvent('touchstart', cell);
  await triggerTouchEvent('touchend', cell);

  // Assert editor opened
});
```

Use `simulateTouch(target)` when you need to test the full Android event sequence including synthetic mouse events.

## Flaky test handling

Use `it.flaky()` for timing-sensitive tests (auto-retries up to 3 times).

## What to test for plugins

- Enable via settings: `handsontable({ myPlugin: true })`
- Disable via `updateSettings({ myPlugin: false })`
- Programmatic: `getPlugin('myPlugin').enablePlugin()` / `.disablePlugin()`
- Non-consecutive selections and header selections.
- Coordinate system edge cases (physical vs visual vs renderable).

## Run commands

- **All:** `npm run test:e2e --prefix handsontable`
- **Targeted:** `npm run test:e2e --testPathPattern=<regex> --prefix handsontable` -- the pattern is matched against test file paths during the Rspack `.dump` step (e.g. `collapsibleColumns`, `ghostTable`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- **With theme:** `npm run test:e2e --testPathPattern=<regex> --theme=horizon --prefix handsontable` (available themes: `classic`, `main`, `horizon`; default when `--theme` is omitted: `main`)
- **Rebuild first:** The E2E runner loads `dist/handsontable.js`. After changing `src/**`, run `npm run build --prefix handsontable` before running E2E tests.

**Important:** Do NOT use `--` before `--testPathPattern`. The flag is consumed by npm during the `.dump` step (Rspack build), not by Puppeteer. Using `npm run test:e2e -- --testPathPattern=...` passes it only to the Puppeteer runner, which doesn't support it.

**Parallel runs:** Multiple `npm run test:e2e --testPathPattern=<X>` invocations with different patterns (or themes) can run simultaneously. The dump step hashes `testPathPattern + theme` into a short run ID and writes per-run artifacts (`test/dist/main.entry.<runId>.js` and `test/E2ERunner-<runId>.html`), and the Puppeteer runner picks its own free port starting at `8086` (retries up to 100 ports). Nothing special needs to be passed -- just launch the commands; the practical limit is machine resources, not the tooling.

**Iterating on a single area:** Prefer `test:e2e.watch` -- it leaves the dev server running and re-bundles + re-runs on every source change, so you don't have to stop and restart between edits:

```bash
npm run test:e2e.watch --testPathPattern=filters --theme=horizon
```

Under the hood it spawns the regular Rspack dump in `--watch` mode and reopens the browser page, reusing the generic `test/E2ERunner.html` (no run ID needed -- the dump and puppeteer halves share one npm process, so the flags propagate automatically).

**One-shot run:** Use the combined `npm run test:e2e --testPathPattern=<regex> --theme=<theme>` -- a single npm invocation passes the flags to both dump and puppeteer via env, so there's no risk of a mismatch.

**Split dump + puppeteer** (what CI does): if you invoke the two steps in separate `npm run` commands, pass `--testPathPattern` AND `--theme` to **both**. Each `npm run` is its own npm process with its own env, and the Puppeteer script recomputes the same hash as dump to find the runner HTML -- a mismatch fails with "Runner HTML not found at ...". `.github/workflows/test.yml` is the canonical example; the same rule applies to `test:production.dump` + `test:e2e.puppeteer`.

A generic `test/E2ERunner.html` (no run ID) is always regenerated alongside the per-run variant for developer manual testing in a browser. Specs that inject iframes with relative CSS paths (e.g. `afterRefreshDimensions`, `Selection`) rely on the runner living in `test/`, which is why the per-run HTML stays there too.

## Test location

- **Plugin tests:** `src/plugins/{name}/__tests__/*.spec.js`
- **Core/hook tests:** `test/e2e/` and `test/e2e/hooks/`

## Gold standard test organization

See `src/plugins/pagination/__tests__/` for reference -- separate dirs for options, methods, hooks, and strategies.

## Common mistakes

- Forgetting `async` on `it()` callbacks.
- Importing helpers manually (they are globals).
- Not testing the `updateSettings()` cycle.
- Missing edge cases: large datasets, coordinate boundaries, enable/disable cycles.
- Not testing both keyboard navigation modes (spreadsheet + data grid).

Reference `.ai/TESTING.md` for full testing docs. Key files: `test/helpers/common.js`, `test/helpers/mouseEvents.js`, `test/helpers/keyboardEvents.js`.
