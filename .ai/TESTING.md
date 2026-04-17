# Testing Patterns

## Test Framework

**Runner:**
- Jest for unit tests (configured in `handsontable/jest.config.js`)
- Jasmine with Puppeteer for E2E tests (browser-based, headless Chrome via `test/scripts/run-puppeteer.mjs`)
- Separate test runner for Walkontable (`npm run test:walkontable`)
- Test runner: `jest-jasmine2` (not the default Jest runner)

**Assertion Library:**
- Jest's built-in `expect()` for unit tests
- Jasmine's `expect()` for E2E tests
- Custom matchers from `test/helpers/custom-matchers.js` (shared between unit and E2E)

**Run Commands:**
```bash
# From handsontable/ directory:
npm run test:unit                  # Run all Jest unit tests (~216 files)
npm run test:e2e                   # Build + run Jasmine E2E tests (~946 spec files)
npm run test:walkontable           # Run Walkontable-specific tests
npm run test:e2e.watch             # Watch mode for E2E tests
npm run test:types                 # TypeScript type checking only
npm run test                       # Full pipeline: lint + unit + types + walkontable + e2e + production

# From monorepo root (pnpm):
pnpm --filter handsontable run test:unit
pnpm --filter handsontable run test:e2e

# Run specific unit test pattern (must be run from handsontable/ directory):
npm run test:unit --testPathPattern=cellMeta

# Run specific E2E test pattern (must be run from handsontable/ directory):
# The pattern is baked into the Rspack bundle at dump time via __ENV_ARGS__.testPathPattern.
# rspack.config.js copies the lowercase npm_config_testpathpattern to npm_config_testPathPattern
# so the standard npm --key=value syntax works.
# Step 1: rebuild the test bundle with the pattern (skips full UMD build):
npm run test:e2e.dump --testPathPattern=filters
# Step 2: run puppeteer against the filtered bundle:
npm run test:e2e.puppeteer
# Or, to do both in one command (also rebuilds UMD bundles):
npm run test:e2e --testPathPattern=filters
# NOTE: changing the pattern requires re-running test:e2e.dump — the pattern is compiled in.
# NOTE: when invoking the two steps separately, pass --testPathPattern AND --theme to BOTH
# commands. Each `npm run` is a separate npm process with its own env; puppeteer computes
# the same hash as dump to locate the runner HTML, so the flags must match.

# Coverage:
npm run test:unit -- --coverage
```

**Parallel E2E runs:**
`test:e2e.dump` hashes `--testPathPattern` + `--theme` into a short `runId`. Each run's bundle and runner HTML are suffixed with that ID, so runs with different inputs do not clobber each other:

- Webpack output: `handsontable/test/dist/main.entry.<runId>.js`
- Per-run Puppeteer runner: `handsontable/test/E2ERunner-<runId>.html`
- Generic dev runner (always regenerated alongside): `handsontable/test/E2ERunner.html`

`run-puppeteer.mjs` computes the same hash from `npm_config_testpathpattern` / `npm_config_theme` and opens the matching HTML. It also binds the local HTTP server to the first free port starting at `8086` (retries on `EADDRINUSE`, up to 100 ports), so each concurrent run gets its own port. Any number of `npm run test:e2e --testPathPattern=<X>` invocations with distinct patterns (or themes) can run in parallel without further configuration -- the practical limit is machine resources, not the tooling.

The helper that derives the hash lives in `handsontable/.config/helper/run-id.js` -- used by both the Rspack config and the Puppeteer script so they stay in lockstep.

**Test Environment:**
- Unit tests: jsdom (JavaScript DOM implementation)
- E2E tests: Puppeteer with real headless Chrome
- Default Jasmine timeout: 15000ms (set in `test/bootstrap.js`)

## Test File Organization

**Location:**
- **Unit tests**: Co-located with source in `src/**/__tests__/` directories
- **E2E core tests**: `handsontable/test/e2e/` (top-level core tests)
- **E2E core API tests**: `handsontable/test/e2e/core/` (per-method tests like `selectCell.spec.js`)
- **E2E settings tests**: `handsontable/test/e2e/settings/` (per-setting tests like `colWidths.spec.js`)
- **Plugin E2E tests**: `src/plugins/{pluginName}/__tests__/` (alongside plugin source)

**Naming:**
- Unit tests: `{feature}.unit.js` (e.g., `cellMeta.unit.js`, `dataFilter.unit.js`)
- E2E tests: `{Feature}.spec.js` or `Core_{feature}.spec.js` (e.g., `Core_dataSchema.spec.js`, `filters.spec.js`)
- Type tests: `*.types.ts` in `test/types/`

**Structure Examples:**
```
src/dataMap/metaManager/metaLayers/
├── cellMeta.js
├── columnMeta.js
├── globalMeta.js
├── tableMeta.js
└── __tests__/
    ├── cellMeta.unit.js
    ├── columnMeta.unit.js
    ├── globalMeta.unit.js
    └── tableMeta.unit.js
```

```
src/plugins/filters/
├── filters.js
├── index.js
├── conditionCollection.js
└── __tests__/
    ├── filters.spec.js
    ├── filtersUI.spec.js
    ├── conditionCollection.unit.js
    ├── dataFilter.unit.js
    ├── filters.types.ts
    ├── helpers/
    │   ├── fixtures.js          # Test data factories
    │   └── utils.js             # Plugin-specific helpers (auto-loaded)
    ├── hooks/
    ├── methods/
    ├── component/
    └── a11y/
```

```
test/e2e/
├── Core_dataSchema.spec.js      # Core feature tests
├── Core_render.spec.js
├── core/                         # Per-method API tests
│   ├── selectCell.spec.js
│   ├── getData.spec.js
│   └── alter/
├── settings/                     # Per-setting tests
│   ├── colWidths.spec.js
│   ├── fixedColumnsStart.spec.js
│   └── validator.spec.js
├── hooks/                        # Hook-specific tests
└── i18n/                         # Internationalization tests
```

## Test Structure

**E2E Suite Organization (Jasmine) -- Standard Boilerplate:**
```javascript
describe('MyPlugin', () => {
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
    handsontable({
      data: createSpreadsheetData(5, 5),
      myPlugin: true,
    });

    await selectCell(0, 0);

    expect(getDataAtCell(0, 0)).toBe('A1');
  });
});
```

**Critical patterns:**
- `beforeEach` uses `function()` (not arrow) to access `this` for `$container`
- `afterEach` always calls `destroy()` then `this.$container.remove()`
- `it()` callbacks must be `async` in `*.spec.js` (ESLint enforced)
- All HOT API calls must be `await`-ed (ESLint enforced)
- No imports needed for test helpers -- they are global

**Unit Test Structure (Jest):**
```javascript
import GlobalMeta from '../globalMeta';
import ColumnMeta from '../columnMeta';
import CellMeta from '../cellMeta';
import { registerAllCellTypes } from '../../../../cellTypes';

registerAllCellTypes();

describe('CellMeta', () => {
  it('should reflect changes when global meta properties changed', () => {
    const globalMeta = new GlobalMeta();
    const columnMeta = new ColumnMeta(globalMeta);
    const meta = new CellMeta(columnMeta);

    globalMeta.getMeta().copyable = false;

    expect(meta.getMeta(2, 0)).toHaveProperty('copyable', false);
  });
});
```

**Key differences between unit and E2E tests:**
- Unit tests use explicit imports; E2E tests use global helpers
- Unit tests are synchronous; E2E tests must be async
- Unit tests test classes/functions in isolation; E2E tests create full HOT instances

## Async Testing

**E2E Tests Must Be `async`:**
Enforced by ESLint rule `handsontable/require-async-in-it` in `*.spec.js` (applies to `it()`, `it.flaky()`, and `fit.flaky()` calls):

```javascript
// CORRECT
it('should do something', async() => {
  handsontable(config);
  await render();
  await selectCell(0, 0);
  expect(getDataAtCell(0, 0)).toBe('A1');
});

// INCORRECT -- ESLint error
it('should do something', () => {
  handsontable(config);
  render(); // Must be await-ed
});
```

**Flaky Test Retries:**
Use `it.flaky()` (or `fit.flaky()`) to mark tests that fail intermittently due to timing or environment issues. The test is retried up to 3 times before reporting a failure. Between retries, any existing Handsontable instance is destroyed and the container is cleaned up.

```javascript
it.flaky('should handle a timing-sensitive operation', async() => {
  handsontable({ data: createSpreadsheetData(5, 5) });
  await selectCell(0, 0);
  expect(getDataAtCell(0, 0)).toBe('A1');
});
```

The test description is prefixed with `[flaky]` in CI output for visibility. Defined in `test/helpers/it-themes-extension.js`.

**HOT Methods Requiring `await` (from `handsontable/.eslintrc.js`):**

Core API: `alter`, `clear`, `deselectCell`, `emptySelectedCells`, `listen`, `loadData`, `populateFromArray`, `refreshDimensions`, `render`, `scrollToFocusedCell`, `scrollViewportTo`, `unlisten`

Selection: `selectAll`, `selectCell`, `selectColumns`, `selectRows`

Data mutation: `setDataAtCell`, `setDataAtRowProp`, `spliceCellsMeta`, `spliceCol`, `spliceRow`

Settings: `updateData`, `updateSettings`, `useTheme`

Validation: `validateCell`, `validateCells`, `validateColumns`, `validateRows`

Rendering control: `suspendExecution`, `suspendRender`

Scroll helpers: `scrollViewportVertically`, `scrollViewportHorizontally`, `scrollWindowTo`, `scrollWindowBy`

Context menu: `contextMenu`, `selectContextMenuOption`, `openContextSubmenuOption`, `selectContextSubmenuOption`

Dropdown menu: `dropdownMenu`, `selectDropdownMenuOption`, `openDropdownSubmenuOption`, `openDropdownByConditionMenu`, `selectDropdownByConditionMenuOption`

Column/row operations: `resizeColumn`, `resizeRow`, `moveSecondDisplayedRowBeforeFirstRow`, `moveFirstDisplayedRowAfterSecondRow`, `swapDisplayedColumns`

Mouse events: `simulateTouch`, `triggerTouchEvent`, `mouseDown`, `mouseOver`, `mouseUp`, `mouseClick`, `contextMenuEvent`, `simulateClick`, `mouseDoubleClick`, `mouseRightDown`, `mouseRightUp`

Keyboard events: `keyDownUp`, `keyDown`, `keyUp`

**Scroll-Awaiting Pattern (`test/helpers/utils.js`):**
Many helpers (e.g., `selectCell`, `scrollViewportTo`, `selectAll`) are wrapped with `waitOnScroll()`, which returns a Promise that resolves after any triggered scroll completes. This is why they must be `await`-ed.

**Delay Pattern:**
```javascript
await sleep(100); // Wait for async validation or animation
await sleep(200); // Wait for dropdown menus to render
```

**Unit tests are synchronous:** `handsontable/require-async-in-it` and `handsontable/require-await` are both off for `*.unit.js`.

## Mocking

**Framework:** Mocks provided via Jest config and test bootstrap

**Available Mocks** in `test/__mocks__/`:
- `resizeObserverMock.js` -- `ResizeObserverMock` class with no-op `observe()`, `unobserve()`, `disconnect()`
- `intersectionObserverMock.js` -- `IntersectionObserverMock` class
- `styleMock.js` -- Returns empty object `{}` for CSS/SCSS imports (Jest `moduleNameMapper`)
- `cssPolyfill.js` -- CSS polyfill mock

**Mock Setup in `test/bootstrap.js`:**
```javascript
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';

beforeAll(() => {
  window.IntersectionObserver = window.IntersectionObserver ?? IntersectionObserverMock;
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverMock;
});
```

**Spy Pattern for Hooks:**
```javascript
const onAfterValidate = jasmine.createSpy('onAfterValidate');

handsontable({
  data: arrayOfObjects(),
  columns: [{ data: 'id', validator(value, cb) { cb(true); } }],
  afterValidate: onAfterValidate
});

await setDataAtCell(2, 0, 123);
await sleep(100);

expect(onAfterValidate).toHaveBeenCalledWith(true, 123, 2, 'id');
```

**What to Mock:**
- Browser APIs not in jsdom (ResizeObserver, IntersectionObserver)
- CSS imports (handled by styleMock.js)
- Callbacks and hooks (use Jasmine spies)

**What NOT to Mock:**
- Core Handsontable code and logic
- Plugin implementations
- Selection and rendering engine
- Data mutation and state management

## Fixtures and Factories

**Test Data Creation:**
```javascript
// Generate spreadsheet data with cell coordinates as values
const data = createSpreadsheetData(5, 5);
// Returns: [['A1', 'B1', 'C1', ...], ['A2', 'B2', 'C2', ...], ...]

handsontable({
  data: createSpreadsheetData(10, 10),
  colHeaders: true
});
```

**Plugin-Specific Test Data:**
Plugins define their own fixtures in `src/plugins/{name}/__tests__/helpers/fixtures.js`:
```javascript
// Example: src/plugins/filters/__tests__/helpers/fixtures.js
export function getDataForFilters() { /* ... */ }
export function getColumnsForFilters() { /* ... */ }
```

**Auto-Loading of Plugin Helpers:**
`test/helpers/index.js` uses `require.context` to auto-discover and export all files in `src/plugins/**/helpers/*.js` to the global scope:
```javascript
[
  require.context('./../../src/plugins', true, /^\.\/.*\/helpers\/.*\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    exportToWindow(req(key));
  });
});
```

**Location Summary:**
- `test/helpers/common.js` -- Core test helpers (HOT API wrappers, data factories)
- `test/helpers/mouseEvents.js` -- Mouse event simulation
- `test/helpers/keyboardEvents.js` -- Keyboard event simulation
- `test/helpers/asciiTable.js` -- ASCII table generation for selection assertions
- `test/helpers/custom-matchers.js` -- Custom Jasmine/Jest matchers
- `test/helpers/utils.js` -- `waitOnScroll()` decorator and utilities
- `test/helpers/focusNavigator.js` -- Focus navigation helpers
- `test/helpers/htmlNormalize.js` -- HTML normalization for assertions
- `test/helpers/it-themes-extension.js` -- Theme-specific and flaky test extensions
- `src/plugins/{name}/__tests__/helpers/` -- Plugin-specific test data and utilities

## Custom Matchers

**From `test/helpers/custom-matchers.js`:**

- `toBeInArray(expected)` -- Check if value is in an array
- `toBeFunction()` -- Check if value is a function
- `toEqualCellRange(pattern)` -- Compact cell range comparison:
  ```javascript
  expect(hot.getSelectedRangeLast()).toEqualCellRange('highlight: 3,2 from: 3,2 to: 5,5');
  expect(hot.getSelectedRange()).toEqualCellRange([
    'highlight: 2,3 from: 1,2 to: 4,4',
    'highlight: 3,2 from: 3,2 to: 5,5',
  ]);
  ```
- `toBeVisible()` -- Check CSS visibility/display of element
- `toBeAroundValue(expected, diff)` -- Fuzzy numeric comparison within margin
- `toBeVisibleAsSelection()` -- ASCII table-based selection visualization assertion

**ASCII Table Selection Testing** (from `test/helpers/asciiTable.js`):
Tests selection patterns by rendering an ASCII representation of the table's selection state using symbols like `#` (current), `0` (area), `r` (row), `c` (column).

## Coverage

**Requirements:** No enforced minimum coverage target

**View Coverage:**
```bash
npm run test:unit -- --coverage    # Show coverage after Jest run
```

**Coverage Output:**
- Formats: json, lcov, clover
- Location: `handsontable/coverage/`
- Covers only `src/` directory

**Coverage Goals:**
- Aim for 100% coverage of new or modified code
- Test all possible states including edge cases

## Test Types

**Unit Tests (`*.unit.js`):**
- Framework: Jest with jsdom (`jest-jasmine2` runner)
- Location: `src/**/__tests__/`
- Scope: Individual functions and classes in isolation
- Synchronous (no async/await required)
- Explicit imports needed
- ~216 test files

**E2E Tests (`*.spec.js`):**
- Framework: Jasmine with Puppeteer (headless Chrome)
- Location: `test/e2e/` and `src/plugins/{name}/__tests__/`
- Scope: Full HOT instances with real DOM rendering
- Must be async with await on HOT API calls
- Global helpers available (no imports needed)
- ~946 spec files

**Type Tests (`*.types.ts`):**
- Tool: tsc (TypeScript compiler only)
- Location: `test/types/`
- Purpose: Verify TypeScript type definitions in `handsontable/types/`

**Walkontable Tests:**
- Separate test pipeline (`npm run test:walkontable`)
- Location: `src/3rdparty/walkontable/test/`
- Has its own spec runner (`SpecRunner.html`)
- Do not mix with main E2E tests

**Visual Regression Tests:**
- Framework: Playwright
- Location: `visual-tests/`
- Config: `visual-tests/playwright.config.ts` and `playwright-cross-browser.config.ts`
- Screenshots stored in `visual-tests/screenshots/`

## Plugin Testing Requirements

**Test against all lifecycle states:**
```javascript
// 1. Enable via settings
it('should enable plugin when option is true', async() => {
  handsontable({ data: createSpreadsheetData(5, 5), myPlugin: true });
  expect(getPlugin('myPlugin').isEnabled()).toBe(true);
});

// 2. Disable via updateSettings
it('should disable plugin via updateSettings', async() => {
  handsontable({ data: createSpreadsheetData(5, 5), myPlugin: true });
  await updateSettings({ myPlugin: false });
  expect(getPlugin('myPlugin').isEnabled()).toBe(false);
});

// 3. Enable/disable programmatically
it('should re-enable after programmatic disable', async() => {
  handsontable({ data: createSpreadsheetData(5, 5), myPlugin: true });
  getPlugin('myPlugin').disablePlugin();
  await render();
  getPlugin('myPlugin').enablePlugin();
  await render();
  expect(getPlugin('myPlugin').isEnabled()).toBe(true);
});
```

## Large Dataset Testing

When fixing bugs or adding features handling data arrays, include tests with **50k+ rows** to catch stack overflow and performance issues:
```javascript
it('should handle 50k rows without stack overflow', () => {
  const largeData = createSpreadsheetData(50000, 10);
  largeData.forEach(row => processRow(row)); // forEach, not spread
  expect(largeData.length).toBe(50000);
});
```

## Selection Testing

Test non-consecutive selections, header selections, and active layers:
```javascript
it('should maintain selections after render', async() => {
  handsontable(config);
  await selectCell(0, 0);
  await keyDown('ctrl');
  await selectCell(2, 2);
  await keyUp('ctrl');
  await render();
  const selected = getSelected();
  expect(selected.length).toBe(2);
});
```

## Global Test Helpers Reference

**HOT API Helpers** (from `test/helpers/common.js`, available globally):
- Instance: `handsontable(options)`, `getInstance()`, `destroy()`, `spec()`
- Rendering: `render()`, `refreshDimensions()`
- Selection: `selectCell()`, `selectCells()`, `selectColumns()`, `selectRows()`, `selectAll()`, `deselectCell()`
- Data read: `getData()`, `getDataAtCell()`, `getDataAtCol()`, `getDataAtRow()`, `getSourceData()`
- Data write: `setDataAtCell()`, `setDataAtRowProp()`, `loadData()`, `updateData()`, `clear()`
- Settings: `updateSettings()`, `getSettings()`, `useTheme()`
- Cell info: `getCell()`, `getCellMeta()`, `getCellEditor()`, `getCellRenderer()`, `getCellValidator()`
- Plugins: `getPlugin(name)`
- Counts: `countRows()`, `countCols()`, `countRenderedRows()`, `countRenderedCols()`
- Structure: `alter()`, `spliceCol()`, `spliceRow()`, `spliceCellsMeta()`
- Validation: `validateCell()`, `validateCells()`, `validateColumns()`, `validateRows()`
- Headers: `getColHeader()`, `getRowHeader()`, `countColHeaders()`, `countRowHeaders()`
- Scrolling: `scrollViewportTo()`, `scrollToFocusedCell()`
- Coordinates: `toPhysicalRow()`, `toPhysicalColumn()`, `toVisualRow()`, `toVisualColumn()`

**Data Generation:**
- `createSpreadsheetData(rows, cols)` -- Grid with coordinates as values ('A1', 'B2', etc.)

**Async Utilities:**
- `sleep(delay = 100)` -- Promise-based delay
- `promisfy(fn)` -- Convert callback to Promise

**DOM Event Helpers** (from `test/helpers/mouseEvents.js`):
- `mouseDown(element, button, eventProps)`
- `mouseUp(element, button, eventProps)`
- `mouseOver(element, button, eventProps)`
- `mouseClick(element, button, eventProps)`
- `mouseMove(element, button, eventProps)`
- `contextMenuEvent(element)`
- `simulateClick(element, buttonKey, eventProps)` -- Full click sequence (mousedown + mouseup + click + focus)
- `mouseDoubleClick(element, buttonKey, eventProps)`
- `mouseRightDown(element)`, `mouseRightUp(element)`

**Keyboard Event Helpers** (from `test/helpers/keyboardEvents.js`):
- `keyDown(key)` -- Simulate keydown event
- `keyUp(key)` -- Simulate keyup event
- `keyDownUp(key)` -- Simulate full keydown+keyup sequence
- Key names: `'enter'`, `'esc'`, `'tab'`, `'arrowdown'`, `'arrowup'`, `'arrowleft'`, `'arrowright'`, `'ctrl'`, `'shift'`, `'space'`, `'backspace'`, `'delete'`, etc.

## Bootstrap and Setup

**Test Bootstrap** (`handsontable/test/bootstrap.js`):
- Sets Jasmine timeout to 15000ms
- Polyfills `ResizeObserver` and `IntersectionObserver` if missing
- Exports global test helpers via `exportToGlobal()`
- Imports custom matchers

**E2E Bootstrap** (`handsontable/test/helpers/index.js`):
- Imports and runs `test/bootstrap.js`
- Exports all helpers from `common.js`, `mouseEvents.js`, `keyboardEvents.js` to `window`
- Auto-discovers and exports all plugin test helpers via `require.context`

**E2E Common Bootstrap** (`handsontable/test/helpers/common.js`):
- Provides `beforeEach`/`afterEach` for scroll reset and spec context management
- Wraps `$.fn.handsontable` to auto-inject theme in E2E tests
- Contains `handsontableMethodFactory()` that creates global wrappers for all HOT instance methods
- Some methods (scroll-related) are wrapped with `waitOnScroll()` from `test/helpers/utils.js`

**Jest Configuration** (`handsontable/jest.config.js`):
```javascript
{
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/test/bootstrap.js'],
  testRegex: '\\.unit\\.js$',
  testRunner: 'jest-jasmine2',
  moduleNameMapper: {
    '^handsontable(.*)$': '<rootDir>/src$1',
    '^walkontable(.*)$': '<rootDir>/src/3rdparty/walkontable/src$1',
    '\\.(css|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
  }
}
```
