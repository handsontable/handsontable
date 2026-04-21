---
name: handsontable-e2e-testing
description: Use when writing or modifying Jasmine/Puppeteer E2E tests (*.spec.js) for Handsontable, or when a bug fix or feature change needs E2E test coverage. Covers standard boilerplate, async/await rules, global helpers, event simulation, plugin lifecycle patterns, and writing theme-agnostic assertions that pass under all themes without branching on theme name.
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
- **Iframe `doc.write` theme CSS:** `getE2eThemeStylesheetLinkTagsHtml()` (all themes), `getE2eThemeStylesheetLinkTagHtml(key)`, `getE2eNormalizeStylesheetLinkTagHtml()` -- from `common.js`; theme list is `E2E_REGISTERED_THEME_KEYS` in `themeLayoutFromTokens.js`, auto-discovered from `src/themes/theme/index.js` (add a theme there and the list updates automatically).
- Full list in `test/helpers/common.js`.

## Theme-agnostic assertions

Every test must pass under every theme. Never branch on `getLoadedTheme()` or hardcode per-theme pixel values in specs -- use `getThemeLayout()` token helpers or live DOM measurements instead.

Use `const layout = getThemeLayout()` (token-backed; merged API from `test/helpers/themeLayoutFromTokens.js`, which exposes token primitives, `overlayHeight` / `verticalScrollForRow` helpers, and scenario-specific `e2e*` regression helpers with descriptive names like `e2eGcrEditedCellOuterHeight`, `e2eManualRowResizerPositionFixedTopMasterFourthRow`, etc.).

**Entry point:** `themeLayoutFromTokens(themeName)` reads `density` and `tokens` from `handsontable/src/themes/theme/<name>.js`. Changing a theme's `density` in that module propagates to all tests automatically.

**Fundamental rule:** All expectations must be pure expressions over tokens + density tokens + sizing tokens, or derived from live DOM measurements. Numeric density triplets (`{ compact: N, default: N, comfortable: N }`) are not used anywhere.

**When a value is not token-derivable** (text shaping, autosize widths, pixel rounding), compute it from the live DOM or assert a relational property instead of branching on the theme:

- **Plugin API reads:** `hot().getColWidth(col)`, `hot().getRowHeight(row)`, `hot().getPlugin('autoColumnSize').getColumnWidth(col)`
- **DOM measurements:** `getCell(r, c).offsetWidth/offsetHeight`, `$el.getBoundingClientRect()`, `window.getComputedStyle(el).padding*`
- **Relational assertions:** `toBeGreaterThan(previousValue)`, `toBeLessThanOrEqual(containerWidth)`
- **Tolerance-based comparisons:** `toBeAroundValue(expected, 2)` or `expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)`

**Viewport helpers (all globals from `common.js`):**

- `expectedVisibleRows(containerHeight, colHeaderRows = 1)` -- number of fully visible data rows
- `expectedLastFullyVisibleRow(containerHeight, colHeaderRows = 1)` -- 0-based index of the last fully visible row
- `containerHeightForRows(rowCount, colHeaderRows = 1)` -- height that guarantees exactly `rowCount` fully visible rows (prefer this over hardcoded `height: 200`)
- `scaleHeight(mainThemeHeight)` / `scaleHeightWithScrollbar(mainThemeHeight)` -- scale a main-theme pixel height proportionally to the current theme's row height (useful when porting tests that used a fixed height)
- `getPaginationContainerHeight()` -- measures the live pagination bar height; theme/density/token independent

Prefer, in order: (1) named `layout.e2e*()` helpers when a shared formula exists (e.g. `layout.e2eGcrEditedCellOuterHeight()`), (2) a direct formula in primitives (`layout.defaultDataRowHeight + layout.cellBorderWidth`), (3) a DOM/plugin-API read, (4) a relational assertion. **Do not** branch on `layout.densityLevel` or theme name in specs -- the primitives already vary per theme.

**Adding a new theme:** See the `handsontable-css-dev` skill for the full four-layer token process. E2E-specific steps: (1) tokens JS at `src/themes/static/variables/tokens/<name>.js`, (2) colors JS at `src/themes/static/variables/colors/<name>.js`, (3) icons JS at `src/themes/static/variables/icons/<name>.js` (or reuse an existing one), (4) CSS source `src/themes/static/css/theme/ht-theme-<name>.css` + `-no-icons.css` variant, (5) theme module `src/themes/theme/<name>.js` exporting `{ name, density, icons, colors, tokens }`, (6) re-export from `src/themes/theme/index.js`, (7) add any new token keys to the `VALID_TOKEN_KEYS` allow-list in `src/themes/engine/utils/validation.js`, (8) add any new token keys to the `TokenKey` union in `types/themes.d.ts`, (9) add E2E matrix jobs in `.github/workflows/test.yml`. No edits needed to `themeLayoutFromTokens.js`, `common.js`, or any spec file -- auto-discovery handles the rest.

**Do not** branch on `getLoadedTheme()` in spec files for pixel expectations. Every test should run under every theme.

See `.ai/TESTING.md` ("Data-Driven Theme Assertions") for full details and all available metrics.

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
