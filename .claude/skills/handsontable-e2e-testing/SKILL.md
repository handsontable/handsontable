---
name: handsontable-e2e-testing
description: Use ONLY when maintaining the FROZEN legacy Jasmine/Puppeteer E2E suite (*.spec.js) – editing an existing spec, or migrating a broken one to Playwright. NOT for new E2E: new E2E is Playwright, use the `handsontable-playwright-e2e` skill. Covers the legacy boilerplate, async/await rules, global helpers, event simulation, and theme-agnostic assertions.
---

# Handsontable E2E testing (legacy Jasmine/Puppeteer, frozen)

> **This suite is frozen.** New E2E is **Playwright**: use the `handsontable-playwright-e2e` skill and put specs in `tests/e2e/`. This guide covers *maintaining* existing `*.spec.js` files. The presence gate blocks a newly added `*.spec.js`, and appending three or more new `it` blocks to a modified frozen spec draws its non-blocking `frozen-suite-growth` advisory (state the justification in the PR if the frozen tier is right). Migrate a broken or flaky legacy spec to Playwright.

## Boilerplate

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

ESLint enforces: every `it()` callback is `async`, and every HOT API call (~50+ methods) is `await`-ed.

## Global helpers

Injected automatically; full list in `test/helpers/common.js`.

- **Instance:** `handsontable()`, `destroy()`, `updateSettings()`, `render()`
- **Data:** `createSpreadsheetData()`, `getDataAtCell()`, `getData()`, `setDataAtCell()`
- **Structure:** `countCols()`, `countRows()`, `alter()`
- **Selection:** `selectCell()`, `selectCells()`, `getSelected()`, `getSelectedRange()`
- **DOM:** `getCell()`, `spec()`, `hot()`
- **Plugins:** `getPlugin()`
- **Theme layout:** `getLoadedTheme()`, `getThemeLayout()` (see `handsontable/.ai/TESTING.md`)
- **Iframe `doc.write` theme CSS:** `getE2eThemeStylesheetLinkTagsHtml()` (all themes), `getE2eThemeStylesheetLinkTagHtml(key)`, `getE2eNormalizeStylesheetLinkTagHtml()` from `common.js`; the theme list is `E2E_REGISTERED_THEME_KEYS` in `themeLayoutFromTokens.js`, auto-discovered from `src/themes/theme/index.ts`.

Write the bare global (`countCols()`, `await alter('remove_col', 2, 1)`) instead of `hot().countCols()`. The mutating globals (`alter()`, `setDataAtCell()`, `selectCell()`, ...) auto-render and must be `await`-ed. Use `hot()` only for a method with no bare-global wrapper.

## Theme-agnostic assertions

Every test passes under every theme. Build expectations from `const layout = getThemeLayout()` (token-backed, from `test/helpers/themeLayoutFromTokens.js`: token primitives, `overlayHeight` / `verticalScrollForRow` helpers, and scenario helpers such as `e2eGcrEditedCellOuterHeight`, `e2eManualRowResizerPositionFixedTopMasterFourthRow`) or from live DOM measurements. `themeLayoutFromTokens(themeName)` reads `density` and `tokens` from `handsontable/src/themes/theme/<name>.ts`, so a density change propagates to all tests. Density triplets (`{ compact: N, default: N, comfortable: N }`) are not used anywhere.

For a value that is not token-derivable (text shaping, autosize widths, pixel rounding):

- **Plugin API reads:** `hot().getColWidth(col)`, `hot().getRowHeight(row)`, `hot().getPlugin('autoColumnSize').getColumnWidth(col)`
- **DOM measurements:** `getCell(r, c).offsetWidth/offsetHeight`, `$el.getBoundingClientRect()`, `window.getComputedStyle(el).padding*`
- **Relational assertions:** `toBeGreaterThan(previousValue)`, `toBeLessThanOrEqual(containerWidth)`
- **Tolerance:** `toBeAroundValue(expected, 2)` or `expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)`

Viewport helpers (globals from `common.js`):

- `expectedVisibleRows(containerHeight, colHeaderRows = 1)`: number of fully visible data rows
- `expectedLastFullyVisibleRow(containerHeight, colHeaderRows = 1)`: 0-based index of the last fully visible row
- `containerHeightForRows(rowCount, colHeaderRows = 1)`: height that guarantees exactly `rowCount` fully visible rows (use it instead of hardcoded `height: 200`)
- `scaleHeight(mainThemeHeight)` / `scaleHeightWithScrollbar(mainThemeHeight)`: scale a main-theme pixel height to the current theme's row height
- `getPaginationContainerHeight()`: live pagination bar height

Order of preference: (1) a named `layout.e2e*()` helper when a shared formula exists, (2) a direct formula in primitives (`layout.defaultDataRowHeight + layout.cellBorderWidth`), (3) a DOM/plugin-API read, (4) a relational assertion. Express theme differences through `layout` primitives, which already vary per theme.

**Adding a new theme:** the `handsontable-css-dev` skill has the four-layer token process. E2E-specific steps: (1) tokens at `src/themes/static/variables/tokens/<name>.ts`, (2) colors at `src/themes/static/variables/colors/<name>.ts`, (3) icons at `src/themes/static/variables/icons/<name>.ts` (or reuse one), (4) CSS source `src/themes/static/css/theme/ht-theme-<name>.css` + `-no-icons.css` variant, (5) theme module `src/themes/theme/<name>.ts` exporting `{ name, density, icons, colors, tokens }`, (6) re-export from `src/themes/theme/index.ts`, (7) add new token keys to the `VALID_TOKEN_KEYS` allow-list in `src/themes/engine/utils/validation.ts`, (8) add new token keys to the `TokenKey` union in `src/themes/types.ts`, (9) add E2E matrix jobs in `.github/workflows/test.yml`. `themeLayoutFromTokens.js`, `common.js`, and specs need no edits.

Details: `handsontable/.ai/TESTING.md` ("Data-Driven Theme Assertions").

## Event simulation

- **Mouse:** `mouseDown()`, `mouseUp()`, `mouseOver()`, `mouseClick()`, `mouseDoubleClick()` from `test/helpers/mouseEvents.js`
- **Keyboard:** `keyDown()`, `keyUp()`, `keyDownUp()` from `test/helpers/keyboardEvents.js`
- **Touch** (from `test/helpers/common.js`, `await` both): `triggerTouchEvent(type, target)` dispatches a single event (`'touchstart'` / `'touchend'`); `simulateTouch(target)` runs the full Android sequence touchstart, touchend, mousedown, mouseup, click (with `preventDefault` handling). A double-tap is two `touchstart` + `touchend` pairs on the same cell.

## Waiting in an edited spec (hard rules)

A broken or flaky spec migrates to Playwright; these rules cover an edit you must make in place.

- **Pin the viewport before a rendered-DOM count assertion.** `countRenderedRows()`, `countRenderedCols()`, and any `tbody tr` count depend on the container size, which varies per theme and machine. Size the container with `containerHeightForRows(n)` or `scrollViewportTo()` the target into view first.
- **Use `waitUntil(condition, timeout)` instead of `sleep()` and `waitForNextAnimationFrames()`.** It is a spec global from `test/helpers/common.js`: it polls every frame and rejects with a named reason when the state never arrives. `waitForNextAnimationFrames()` is a fixed sleep in frames (at most 2 real frames, `normalizeFrameCount` caps it, plus 16 ms padding per requested frame). Every `sleep()` call warns (`handsontable/no-fixed-sleep-in-spec`, warn level); the diff-scoped ratchet (`.github/scripts/lint-ratchet.mjs`, at pre-push and in the CI `Lint / core` job, since 2026-09-07) fails a NEW one on an added line.
- **Migrate a spec that needs `it.flaky()`** instead of adding retries: new `it.flaky()` sites are lint-warned (`handsontable/no-new-it-flaky`), and the same ratchet fails one on an added line.

## What to test for plugins

- Enable via settings: `handsontable({ myPlugin: true })`
- Disable via `updateSettings({ myPlugin: false })`
- Programmatic: `getPlugin('myPlugin').enablePlugin()` / `.disablePlugin()`
- Non-consecutive selections and header selections.
- Coordinate system edge cases (physical vs visual vs renderable).

## Run commands

- **All:** `npm run test:e2e --prefix handsontable`
- **Targeted:** `npm run test:e2e --prefix handsontable --testPathPattern=<regex>`, matched against test file paths during the Rspack `.dump` step (e.g. `collapsibleColumns`, `ghostTable`, `textEditor`, `nestedHeaders/__tests__/hidingColumns`)
- **Read the spec count of a targeted run.** A pattern that matches nothing still ends `5 specs, 0 failures` with exit 0 (measured on four no-match patterns in DEV-2911). `test/e2e/index.js` tests the pattern (case-insensitive) against webpack context keys, relative to `handsontable/src/` or `handsontable/test/e2e/`: use `./validators/dropdownValidator/__tests__/dropdownValidator.spec.js`, not `src/validators/...`. Use one plain pattern per command with no shell characters: `scripts/run.mjs` passes it to `sh -c` unquoted, so `(a|b)` is a syntax error and `a\|b` reaches the regex as a literal `\|` (`validat` covers every validator and validation spec).
- **With theme:** add `--theme=horizon` (available: `classic`, `main`, `horizon`; default `main`).
- **Rebuild first:** the runner loads `dist/handsontable.js`; run `npm run build --prefix handsontable` after changing `src/**`.

**Parallel runs:** invocations with different patterns or themes can run simultaneously. The dump step hashes `testPathPattern + theme` into a run ID and writes `test/dist/main.entry.<runId>.js` and `test/E2ERunner-<runId>.html`; the Puppeteer runner picks its own free port starting at `8086`.

**Iterating on one area:** `test:e2e.watch` keeps the dev server running and re-bundles and re-runs on every source change:

```bash
npm run test:e2e.watch --prefix handsontable --testPathPattern=filters --theme=horizon
```

**Split dump + puppeteer** (what CI does): pass `--testPathPattern` AND `--theme` to **both** `npm run` commands. The Puppeteer script recomputes the dump's hash to find the runner HTML, and a mismatch fails with "Runner HTML not found at ...". `.github/workflows/test.yml` is the canonical example; the same applies to `test:production.dump` + `test:e2e.puppeteer`. The one-shot `npm run test:e2e` passes the flags to both halves itself.

A generic `test/E2ERunner.html` (no run ID) is regenerated alongside the per-run variant for manual browser testing. Specs that inject iframes with relative CSS paths (e.g. `afterRefreshDimensions`, `Selection`) rely on the runner living in `test/`, which is why the per-run HTML stays there too.

## Debugging (capturing values from the browser)

Specs run in a headless browser. The Puppeteer runner (`test/scripts/run-puppeteer.mjs`) forwards **only** console messages whose text starts with `DEBUG`, printed as `[BROWSER] <text>`:

```js
console.log(`DEBUG state ${JSON.stringify({ labels: getColHeaders(), count: countCols() })}`);
```

Filter the run output: `npm run test:e2e --prefix handsontable --testPathPattern=<regex> 2>&1 | grep DEBUG`.

- `JSON.stringify` omits keys whose value is `undefined`; use `String(value)` to distinguish `undefined`/`false`/`null`.
- `expect(actual).toEqual('SENTINEL')` also works: assertion diffs always reach the terminal.

## Test location

Specs live under `src/` next to the code they test. **The spec filename matches the method, hook, or setting name exactly** (`getSourceData.spec.js`, `afterChange.spec.js`, `height.spec.js`).

| What is tested | Directory |
|---|---|
| Core method (e.g., `getSourceData`) | `src/__tests__/core/<methodName>.spec.js` |
| Hook (e.g., `afterChange`) | `src/__tests__/hooks/<hookName>.spec.js` |
| Setting (e.g., `height`) | `src/__tests__/settings/<settingName>.spec.js` |
| Plugin | `src/plugins/{name}/__tests__/*.spec.js` |
| Keyboard shortcuts | `src/shortcuts/__tests__/keyboardShortcuts/<name>.spec.js` |
| i18n | `src/i18n/__tests__/<name>.spec.js` |
| Mobile-specific | `src/__tests__/mobile/<name>.spec.js` |

`test/e2e/` is no longer the home for spec files.

Reference organization: `src/plugins/pagination/__tests__/` (separate dirs for options, methods, hooks, strategies).

## Common mistakes

- Using the `hot().` form instead of the bare global.
- Importing helpers manually (they are globals).
- Skipping the `updateSettings()` cycle.
- Missing edge cases: large datasets, coordinate boundaries, enable/disable cycles.
- Testing only one keyboard navigation mode: cover both spreadsheet and data grid.
- Trusting the spec count. Before the bridge reporter sanitized failed expectations (`test/helpers/jasmine-bridge-reporter.js`, shared with the Walkontable runner), a failing spec with a cyclic `expected` or `actual` (`toBe(window)`, `toEqual([overlay, ...])`) was dropped: `Running N specs.` in `--verbose` mode, `N-1 specs, 0 failures` at the end, exit 0. The bridge now reports it as a failure (`[unserializable Window]`); if a count comes up short, compare the `Running N specs.` line against the summary with `npm run test:e2e -- --testPathPattern=<file> --verbose`.
- Throwing inside a `describe` body. Jasmine turns it into a suite-level failure the runner does not report, and every later spec in that block never registers. `it.skip()` does exactly this (Jasmine has no `it.skip`) and hid five specs of `nestedHeaders/__tests__/rowspan.spec.js`. After editing a spec file, the spec count of a `--testPathPattern` run must equal the file's `it(` calls **plus 5**, because every run carries the 5 `MemoryLeakTest` specs; a count equal to the `it(` calls is 5 short.

Full testing docs: `handsontable/.ai/TESTING.md`. Key files: `test/helpers/common.js`, `test/helpers/mouseEvents.js`, `test/helpers/keyboardEvents.js`.
