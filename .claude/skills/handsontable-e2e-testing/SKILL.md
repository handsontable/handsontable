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
- **Theme layout:** `getLoadedTheme()`, `getThemeLayout()` (see `.ai/TESTING.md`)
- Full list in `test/helpers/common.js`.

## Theme-specific expected values

Use `const layout = getThemeLayout()` (token-backed, from `test/helpers/themeLayoutFromTokens.js`). Prefer primitives (`layout.defaultDataRowHeight`, `layout.overlayHeight()`, …), formulas (for example `layout.defaultDataRowHeight + 29`, `Math.max(30, layout.firstRenderedRowDefaultHeight)`), and named **`layout.e2e*()`** / **`layout.e2eGcr_*()`** helpers for scenario-specific triplets. Add new helpers in `themeLayoutFromTokens.js` (they may call **`pickByDensity` internally**); lock numeric triplets in **`test/helpers/__tests__/themeLayoutFromTokens.unit.js`**. **Do not** call **`getThemeLayout().pickByDensity(...)`** from spec files. For inner Handsontable editor lists (dropdown / handsontable / autocomplete), use global **`expectInnerHandsontableEditorListClientBoxMatchesSettings()`** from `test/helpers/common.js`. For **`getEditedCellRect`**, use **`expectGetEditedCellRectFromPartial((L) => L.e2eGcr_*(...))`** so width/height come from the live TD. For dropdown placement vs the cell, use **`getBoundingClientRect()`** vs `editor.TD` where possible instead of absolute document offsets.

**Do not** branch on `getLoadedTheme()` in spec files for pixel expectations. Helpers use **`layout.densityLevel`** (`compact` / `default` / `comfortable`) inside `themeLayoutFromTokens.js`. Adding a theme registers `THEME_TOKENS` + `THEME_DENSITY` only; extend `e2e*` methods there if a new density needs different regression math. For mixed matchers (for example `toBeGreaterThan` on one density and `toEqual` on others), use **`layout.densityLevel`** in the spec or a small local helper.

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
- **With theme:** `npm run test:e2e --testPathPattern=<regex> --theme=horizon --prefix handsontable` (available themes: `classic`, `main`, `horizon`; default when `--theme` is omitted: `main`)
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
