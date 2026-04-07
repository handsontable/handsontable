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

- **Mouse:** `mouseDown()`, `mouseUp()`, `mouseOver()` from `test/helpers/mouseEvents.js`
- **Keyboard:** `keyDown()`, `keyUp()`, `keyDownUp()` from `test/helpers/keyboardEvents.js`

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
- **Targeted:** `npm run test:e2e --testPathPattern=<regex> --prefix handsontable` -- the pattern is matched against test file paths (e.g. `collapsibleColumns`, `ghostTable`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- **With theme:** `npm run test:e2e --testPathPattern=<regex> --theme=horizon --prefix handsontable` (available themes: `classic`, `main`, `horizon`)
- **Rebuild first:** The E2E runner loads `dist/handsontable.js`. After changing `src/**`, run `npm run build --prefix handsontable` before running E2E tests.

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
