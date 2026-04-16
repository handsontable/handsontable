# Theme Layout Helper: Token-Driven Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `handsontable/src/themes/theme/{classic,main,horizon}.js` the single source of truth for test-time theme layout resolution, and ensure every expected value returned from the theme layout helpers is a **pure calculation from tokens + density + sizing**, with no hardcoded per-density literal triplets and no hardcoded theme→density mirror map.

**Architecture:**

- The helper imports each theme module from `handsontable/src/themes/theme/*` and reads `.name`, `.density`, and `.tokens` directly from it. Adding, removing, or re-configuring a theme (including changing its `density`) requires **zero** test-helper changes.
- Every `e2e*` helper returns a value expressed as an arithmetic expression in the named primitives (`lineHeight`, `cellVerticalPadding`, `cellHorizontalPadding`, `cellBorderWidth`, `cellContentHeight`, `defaultDataRowHeight`, `defaultColumnHeaderHeight`, `defaultColumnWidth`, `defaultRowHeaderWidth`, `firstRenderedRowDefaultHeight`, `sizing.size_*`). Density-bucket `pickByDensity({ compact: N, default: N, comfortable: N })` triplets with baked numbers are disallowed.
- Where a historical expectation is **not** expressible as a token formula (it depends on text shaping, browser line-breaking, or pixel-rounding artifacts that have nothing to do with tokens), the helper entry is removed and the spec is rewritten to read the value from the live DOM or to run on a single fixed theme.
- Unit tests assert **formula invariants** (e.g. `cellContentHeight === lineHeight + 2 * cellVerticalPadding`) and **module-read invariants** (e.g. `layout.densityLevel === mainTheme.density`), never literal pixel numbers.
- **Adding a new theme requires no test-helper edit.** The only required edits live outside the helpers: export the module from `src/themes/theme/index.js`, produce `handsontable/styles/ht-theme-<name>.css` via the existing theme build, and add a CI matrix job in `.github/workflows/test.yml`. Unit tests, `E2E_REGISTERED_THEME_KEYS`, `getE2eThemeStylesheetLinkTagsHtml()`, and every `e2e*` helper all auto-discover the new theme. Task 9 proves this end-to-end with a synthetic-theme canary.

**Tech Stack:**

- JavaScript (ES modules), Jest (unit), Jasmine + Puppeteer (E2E)
- Source of truth: `handsontable/src/themes/theme/*.js`, `handsontable/src/themes/static/variables/sizing.js`, `handsontable/src/themes/static/variables/density.js`
- Custom ESLint rule: `handsontable/.config/plugin/eslint/rules/no-pick-by-density-in-spec.js` (will be generalized)

---

## Preflight (one-time, before Task 1)

- [ ] **Revert the uncommitted density edit** so the rewrite starts from a clean, committed tree.

Run:
```bash
git diff HEAD -- handsontable/src/themes/theme/main.js
```
Expected: the diff showing `density: 'default' → 'comfortable'`.

Then:
```bash
git restore handsontable/src/themes/theme/main.js
git status handsontable/src/themes/theme/main.js
```
Expected: `nothing to commit, working tree clean` for that path.

- [ ] **Confirm the baseline E2E suite is green on `main` theme** (sanity check — don't start if it's red).

Run:
```bash
npm run build --prefix handsontable
npm run test:e2e --testPathPattern=Core_view --prefix handsontable
```
Expected: PASS.

- [ ] **Create a dedicated worktree** (optional but recommended — this rewrite touches two helper files and one unit-test file that the current branch has just refactored).

Run:
```bash
git worktree add ../handsontable-theme-rewrite -b feature/PRO-858-theme-layout-token-driven
cd ../handsontable-theme-rewrite
```

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `handsontable/test/helpers/themeLayoutCore.js` | **Rewrite** | Reads theme modules from `src/themes/theme/*`; resolves primitives from `theme.tokens` + `density[theme.density]` + `sizing`. No hardcoded theme→density map. No `pickByDensity`. |
| `handsontable/test/helpers/themeLayoutFromTokens.js` | Modify | Unchanged composition; updates imports only. |
| `handsontable/test/helpers/themeLayoutE2eHelpers.js` | **Rewrite** | Every helper returns a pure arithmetic expression in core primitives + `sizing.size_*`. No `pickByDensity({ compact, default, comfortable })` triplets with numeric literals. No `isDensity('...')` branches. |
| `handsontable/test/helpers/__tests__/themeLayoutFromTokens.unit.js` | **Rewrite** | Asserts formula invariants and module-read invariants, not literal numbers. |
| `handsontable/.config/plugin/eslint/rules/no-pick-by-density-in-spec.js` | Modify | Generalize rule: forbid `pickByDensity` **and** `e2ePickForDensity` in specs **and** forbid numeric-literal density triplets anywhere outside a dedicated escape-hatch allowlist. |
| `handsontable/test/helpers/__tests__/no-pick-by-density-in-spec.unit.js` | Create | Rule unit test. |
| Spec files consuming removed helpers | Modify | For any removed helper, convert to live DOM read or pin to a single theme. |
| `.ai/TESTING.md` | Modify | Rewrite the "data-driven theme assertion pattern" section to state the new rule: all expectations computed from tokens, helpers import theme modules, no density literal triplets. |
| `.claude/skills/handsontable-e2e-testing/SKILL.md` | Modify | Update the theme-layout subsection in line with `.ai/TESTING.md`. |

---

## Task 1: Rewrite `themeLayoutCore.js` to read from theme modules

**Files:**
- Modify: `handsontable/test/helpers/themeLayoutCore.js` (full rewrite)
- Add test: `handsontable/test/helpers/__tests__/themeLayoutFromTokens.unit.js` (covered in Task 4)

The new core must:

1. Import theme modules as an iterable from `handsontable/src/themes/theme/index.js`.
2. Build its internal theme registry by reading each module's `.name`, `.density`, and `.tokens`.
3. Resolve `densityConfig` via `density[themeModule.density]` — not via a hardcoded name→density map.
4. Keep the existing `overlayHeight`, `verticalScrollForRow`, and primitive exports.
5. Remove `pickByDensity`. Any caller that needs to switch on density must do so via a named primitive or derived quantity; density is not a knob specs may tune per call.

- [ ] **Step 1: Write the failing unit test for the rewritten contract.**

Create test stub (full suite in Task 4):

```js
// handsontable/test/helpers/__tests__/themeLayoutCore.contract.unit.js
import { mainTheme, classicTheme, horizonTheme } from '../../../src/themes/theme';
import density from '../../../src/themes/static/variables/density';
import { createThemeLayoutCore, E2E_REGISTERED_THEME_KEYS } from '../themeLayoutCore';

describe('themeLayoutCore entry point is src/themes/theme', () => {
  it('registers exactly the theme modules exported from src/themes/theme/index.js', () => {
    expect(E2E_REGISTERED_THEME_KEYS).toEqual(
      [classicTheme.name, mainTheme.name, horizonTheme.name]
    );
  });

  it('reads densityLevel from the theme module, not a hardcoded map', () => {
    expect(createThemeLayoutCore(mainTheme.name).densityLevel).toBe(mainTheme.density);
    expect(createThemeLayoutCore(classicTheme.name).densityLevel).toBe(classicTheme.density);
    expect(createThemeLayoutCore(horizonTheme.name).densityLevel).toBe(horizonTheme.density);
  });

  it('resolves cellVerticalPadding from density[theme.density].cellVertical', () => {
    const sizingKey = density[mainTheme.density].cellVertical.replace('sizing.', '');
    const sizing = require('../../../src/themes/static/variables/sizing').default;

    expect(createThemeLayoutCore(mainTheme.name).cellVerticalPadding)
      .toBe(parseInt(sizing[sizingKey], 10));
  });

  it('exposes no pickByDensity (density triplets are not a supported API)', () => {
    expect(createThemeLayoutCore(mainTheme.name).pickByDensity).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutCore.contract --prefix handsontable
```
Expected: FAIL (either `pickByDensity` is still defined, or `E2E_REGISTERED_THEME_KEYS` is read from the old hardcoded map).

- [ ] **Step 3: Rewrite `themeLayoutCore.js`.**

Replace the file with:

```js
import sizing from '../../src/themes/static/variables/sizing';
import density from '../../src/themes/static/variables/density';
import * as themeModules from '../../src/themes/theme';

/**
 * Build the theme registry by introspecting the theme modules. Theme identity (name,
 * density, tokens) is owned by `src/themes/theme/*.js`; this helper is a pure consumer.
 */
const THEMES = Object.freeze(
  Object.values(themeModules)
    .filter(mod => mod && typeof mod === 'object' && typeof mod.name === 'string')
    .reduce((acc, mod) => {
      acc[mod.name] = mod;

      return acc;
    }, {})
);

/**
 * Theme keys registered by introspecting `src/themes/theme/*.js`. E2E bundle serves
 * `styles/ht-theme-{key}.css` for each. Add a theme module under `src/themes/theme/`
 * (and a stylesheet) to register a new theme -- no edit to this helper is required.
 *
 * @type {string[]}
 */
export const E2E_REGISTERED_THEME_KEYS = Object.freeze(Object.keys(THEMES));

/**
 * Walkontable's default column width (from src/3rdparty/walkontable/src/settings.js:194).
 * Not exposed as a theme token -- it is a rendering engine constant.
 */
const WALKONTABLE_DEFAULT_COLUMN_WIDTH = 50;

/**
 * Parse a pixel string (e.g. '14px') to a number.
 *
 * @param {string} value CSS pixel string.
 * @returns {number} Numeric pixel value.
 */
function parsePx(value) {
  return parseInt(value, 10);
}

/**
 * Resolve a density reference string (e.g. 'sizing.size_1') to its pixel value.
 *
 * @param {string} ref Reference string in the form 'sizing.<key>'.
 * @returns {number} Resolved pixel value.
 */
function resolveSizingRef(ref) {
  const key = ref.replace('sizing.', '');

  return parsePx(sizing[key]);
}

/**
 * Token-backed layout primitives for a theme. All values are numbers in pixels
 * unless noted. Density is read from the theme module -- changing `density` in
 * `src/themes/theme/<name>.js` propagates here automatically.
 *
 * @param {string} themeName Theme key discovered from `src/themes/theme/index.js`.
 * @returns {object} Core layout metrics and `overlayHeight` / `verticalScrollForRow` helpers.
 */
export function createThemeLayoutCore(themeName) {
  const resolvedName = themeName || 'main';
  const themeModule = THEMES[resolvedName];

  if (!themeModule) {
    throw new Error(
      `themeLayoutCore: unknown theme "${themeName}". ` +
      `Supported (from src/themes/theme/index.js): ${Object.keys(THEMES).join(', ')}`
    );
  }

  const densityLevel = themeModule.density;
  const densityConfig = density[densityLevel];

  if (!densityConfig) {
    throw new Error(
      `themeLayoutCore: theme "${resolvedName}" declares density "${densityLevel}" ` +
      `but density module has no such entry`
    );
  }

  const lineHeight = parsePx(themeModule.tokens.lineHeight);
  const cellVerticalPadding = resolveSizingRef(densityConfig.cellVertical);
  const cellHorizontalPadding = resolveSizingRef(densityConfig.cellHorizontal);
  const cellBorderWidth = parsePx(sizing.size_0_25); // 1px

  const cellContentHeight = lineHeight + (2 * cellVerticalPadding);
  const defaultDataRowHeight = cellContentHeight + cellBorderWidth;
  const defaultColumnHeaderHeight = cellContentHeight;
  const firstRenderedRowDefaultHeight = defaultDataRowHeight + cellBorderWidth;
  const defaultColumnWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  return {
    themeName: resolvedName,
    densityLevel,

    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,

    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultColumnWidth,
    defaultRowHeaderWidth,

    sizing,

    /**
     * Calculate overlay outer height for a section with the given row counts.
     * The first rendered row in any overlay section gets +1px border compensation.
     *
     * @param {object} options Options.
     * @param {number} [options.rows=0] Total rows (headers + data) in the overlay.
     * @param {boolean} [options.includeFirstRowCompensation=true] First row gets +1px.
     * @returns {number} Height in pixels.
     */
    overlayHeight({ rows = 0, includeFirstRowCompensation = true } = {}) {
      if (rows === 0) {
        return 0;
      }

      if (includeFirstRowCompensation) {
        return firstRenderedRowDefaultHeight + ((rows - 1) * defaultDataRowHeight);
      }

      return rows * defaultDataRowHeight;
    },

    /**
     * Calculate vertical scroll position for a given row at the top snap.
     *
     * @param {number} rowIndex Zero-based row index.
     * @returns {number} Scroll position in pixels.
     */
    verticalScrollForRow(rowIndex) {
      return rowIndex * defaultDataRowHeight;
    },
  };
}
```

- [ ] **Step 4: Re-run the contract test.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutCore.contract --prefix handsontable
```
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add handsontable/test/helpers/themeLayoutCore.js \
        handsontable/test/helpers/__tests__/themeLayoutCore.contract.unit.js
git commit -m "refactor(tests): read theme density/tokens from src/themes/theme modules"
```

---

## Task 2: Temporarily break — then rely on — existing E2E helper consumers

Task 1 removed `pickByDensity` from the core. The `themeLayoutE2eHelpers.js` file currently destructures `pickByDensity` from `core` and calls it throughout, so after Task 1 the module will fail to load. We will (a) confirm the failure, (b) replace it file-wide in Task 3. Do not defeat the failure by re-adding `pickByDensity`.

- [ ] **Step 1: Verify the E2E helpers module now fails to build.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: FAIL — either a destructuring runtime error or many assertion mismatches, because `pickByDensity` is `undefined`.

Leave the failure in place; Task 3 fixes it.

---

## Task 3: Rewrite `themeLayoutE2eHelpers.js` — every value is a token formula

**Files:**
- Modify: `handsontable/test/helpers/themeLayoutE2eHelpers.js` (full rewrite)

**Hard rules for every helper in this file:**

1. The helper's return value is an arithmetic expression over the named primitives exposed by `themeLayoutCore` (`lineHeight`, `cellVerticalPadding`, `cellHorizontalPadding`, `cellBorderWidth`, `cellContentHeight`, `defaultDataRowHeight`, `defaultColumnHeaderHeight`, `firstRenderedRowDefaultHeight`, `defaultColumnWidth`, `defaultRowHeaderWidth`) and/or `core.sizing.size_*` values.
2. `pickByDensity({ compact: N, default: N, comfortable: N })` is **not** used. `isDensity(...)` is **not** used. `core.densityLevel === '...'` string comparisons are **not** used.
3. Any helper that cannot be rewritten under rules (1) and (2) is **removed from this file** and its spec consumer is rewritten in Task 5.
4. If a formula depends on a token that is currently represented in the tokens module but not yet exposed in `createThemeLayoutCore`, extend `createThemeLayoutCore` to expose it before using it here.

### Step 1: Classify every current helper

- [ ] **Step 1a: Enumerate the helpers.**

Run:
```bash
node -e "const m=require('./handsontable/test/helpers/themeLayoutE2eHelpers.js'); console.log(Object.keys(m.buildThemeLayoutE2eHelpers({lineHeight:0,cellVerticalPadding:0,cellHorizontalPadding:0,cellBorderWidth:0,cellContentHeight:0,defaultDataRowHeight:0,defaultColumnHeaderHeight:0,firstRenderedRowDefaultHeight:0,defaultColumnWidth:0,defaultRowHeaderWidth:0,pickByDensity:()=>0,overlayHeight:()=>0,densityLevel:'default',sizing:{}})).sort().join('\n'))"
```

Expected: Alphabetical list of all `e2e*` helpers (approximately 180 names).

- [ ] **Step 1b: Categorize each helper into exactly one bucket** by reading its current source and its callers:

| Bucket | Criterion | Action |
|---|---|---|
| **A — Formula only** | Current body is already a formula in primitives (no literal triplet). | Keep as-is. Remove any `pickByDensity` wrapping if present. |
| **B — Recoverable formula** | Current body is a `pickByDensity({...numbers})` triplet, but the three numbers all satisfy a single formula in primitives. Verify: take the three numbers `(C, D, M)` for `(compact, default, comfortable)` and confirm there exists a formula `f(primitives)` that produces each when evaluated with the corresponding theme's primitives. | Replace body with the formula. |
| **C — Not tokenizable** | The triplet does not fit any formula in primitives (e.g. widths derived from text measurement, autosize heuristics, off-by-one pixel rounding of renderer internals). | **Remove the helper**. Track it in the Task 5 follow-up list. |

Produce `docs/superpowers/plans/2026-04-15-theme-layout-helper-audit.md` with one row per helper:

```
| helper | bucket (A/B/C) | formula (if A or B) | notes |
|---|---|---|---|
| e2eGcrEditedCellOuterHeight | A | cellContentHeight + 2*cellBorderWidth | already tokenized |
| e2eStretchColumnsIndexOrderStretchedWidth | C | — | depends on text shaping width; 79/79/74 is not a token formula |
| ... | ... | ... | ... |
```

To derive bucket-B formulas: for each theme, compute the primitives and solve for the combination that reproduces all three literals. If no consistent combination exists, the helper is bucket C.

Example of a bucket-B proof (worked):

```
e2eDensity_f464e90e18 returns { compact: 52, default: 58, comfortable: 74 }.
Primitives:
  classic  (compact):     defaultDataRowHeight=26, cellBorderWidth=1
  main     (default):     defaultDataRowHeight=29, cellBorderWidth=1
  horizon  (comfortable): defaultDataRowHeight=37, cellBorderWidth=1
Formula hypothesis: 2 * defaultDataRowHeight  =>  52, 58, 74  ✓  (bucket B, formula = 2 * defaultDataRowHeight)
```

- [ ] **Step 1c: Commit the audit doc.**

```bash
git add docs/superpowers/plans/2026-04-15-theme-layout-helper-audit.md
git commit -m "docs: classify theme layout E2E helpers by tokenizability"
```

### Step 2: Replace the helpers file

- [ ] **Step 2a: Write the rewritten `themeLayoutE2eHelpers.js`.**

Starting template — keep the module's exported shape (`buildThemeLayoutE2eHelpers(core)`), destructure primitives, and define helpers from the audit:

```js
/**
 * E2E regression layout helpers. All return values are pure arithmetic expressions
 * over the primitives from `themeLayoutCore`. Baked per-density numeric triplets
 * are not permitted (enforced by lint rule `no-pick-by-density-in-spec`).
 *
 * @param {object} core Return value of `createThemeLayoutCore`.
 * @returns {object} Methods merged into the public theme layout API.
 */
export function buildThemeLayoutE2eHelpers(core) {
  const {
    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,
    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultColumnWidth,
    defaultRowHeaderWidth,
    overlayHeight,
    verticalScrollForRow,
    sizing,
  } = core;

  // Bucket A (examples -- add each surviving helper here verbatim)
  return {
    e2eGcrEditedCellOuterHeight() {
      return cellContentHeight + (2 * cellBorderWidth);
    },

    e2eGcrDefaultMasterColumnClientWidth() {
      // derived in audit: defaultColumnWidth + (cellHorizontalPadding >= 12 ? 1 : 0)
      // Replace with the proven formula from audit.
      return defaultColumnWidth + Math.max(0, cellHorizontalPadding - 8);
    },

    // Bucket B (examples)
    e2eDensity_f464e90e18() {
      return 2 * defaultDataRowHeight;
    },

    e2eDensity_9639197594() {
      return (2 * defaultDataRowHeight) + cellBorderWidth;
    },

    // ... one entry per surviving helper, sourced from the audit doc.
  };
}
```

For each bucket-A and bucket-B helper, paste the formula column from the audit. Bucket-C helpers are **omitted**.

- [ ] **Step 2b: Remove the old file contents and replace wholesale.**

Overwrite `handsontable/test/helpers/themeLayoutE2eHelpers.js` with the audited content.

- [ ] **Step 2c: Run the unit tests that directly exercise these helpers.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: FAIL (the existing unit-test assertions reference literal numbers and removed helpers — this is fixed in Task 4).

- [ ] **Step 2d: Verify no density-literal triplets remain in the helper source.**

Run:
```bash
grep -nE "compact:\s*-?[0-9]" handsontable/test/helpers/themeLayoutE2eHelpers.js || echo "OK: no density literal triplets"
```
Expected: `OK: no density literal triplets`.

```bash
grep -nE "isDensity\(|isCompactDensity|densityLevel\s*===\s*'" handsontable/test/helpers/themeLayoutE2eHelpers.js || echo "OK: no density branches"
```
Expected: `OK: no density branches`.

- [ ] **Step 2e: Commit.**

```bash
git add handsontable/test/helpers/themeLayoutE2eHelpers.js
git commit -m "refactor(tests): rewrite E2E theme helpers as pure token formulas"
```

---

## Task 4: Rewrite unit tests to assert formulas and module-reads, not literals

**Files:**
- Modify: `handsontable/test/helpers/__tests__/themeLayoutFromTokens.unit.js` (rewrite)

The rewritten suite must not contain any `.toBe(<number>)` assertions where `<number>` is a hardcoded pixel value. Instead:

- Assert the formula relationship using primitives computed live from the theme module.
- Assert `densityLevel` matches `themeModule.density`.
- Assert `E2E_REGISTERED_THEME_KEYS` matches the keys exported by `src/themes/theme/index.js`.
- Assert removed helpers (bucket C) are no longer on the API surface.

- [ ] **Step 1: Replace the file.**

```js
import { classicTheme, mainTheme, horizonTheme } from '../../../src/themes/theme';
import * as themeModules from '../../../src/themes/theme';
import sizing from '../../../src/themes/static/variables/sizing';
import density from '../../../src/themes/static/variables/density';
import { E2E_REGISTERED_THEME_KEYS } from '../themeLayoutCore';
import { themeLayoutFromTokens } from '../themeLayoutFromTokens';

const ALL_THEMES = Object.values(themeModules).filter(m => m && m.name);

describe('themeLayoutFromTokens reads from src/themes/theme modules', () => {
  it('E2E_REGISTERED_THEME_KEYS reflects src/themes/theme/index.js exports', () => {
    const expected = ALL_THEMES.map(m => m.name);

    expect(E2E_REGISTERED_THEME_KEYS).toEqual(expected);
  });

  ALL_THEMES.forEach((theme) => {
    describe(`theme "${theme.name}" (density: ${theme.density})`, () => {
      let layout;

      beforeEach(() => {
        layout = themeLayoutFromTokens(theme.name);
      });

      it('densityLevel is read from the theme module', () => {
        expect(layout.densityLevel).toBe(theme.density);
      });

      it('lineHeight is parsed from the theme module tokens', () => {
        expect(layout.lineHeight).toBe(parseInt(theme.tokens.lineHeight, 10));
      });

      it('cellVerticalPadding is resolved from density[theme.density].cellVertical', () => {
        const key = density[theme.density].cellVertical.replace('sizing.', '');

        expect(layout.cellVerticalPadding).toBe(parseInt(sizing[key], 10));
      });

      it('cellHorizontalPadding is resolved from density[theme.density].cellHorizontal', () => {
        const key = density[theme.density].cellHorizontal.replace('sizing.', '');

        expect(layout.cellHorizontalPadding).toBe(parseInt(sizing[key], 10));
      });

      it('cellContentHeight == lineHeight + 2 * cellVerticalPadding', () => {
        expect(layout.cellContentHeight)
          .toBe(layout.lineHeight + (2 * layout.cellVerticalPadding));
      });

      it('defaultDataRowHeight == cellContentHeight + cellBorderWidth', () => {
        expect(layout.defaultDataRowHeight)
          .toBe(layout.cellContentHeight + layout.cellBorderWidth);
      });

      it('defaultColumnHeaderHeight == cellContentHeight', () => {
        expect(layout.defaultColumnHeaderHeight).toBe(layout.cellContentHeight);
      });

      it('firstRenderedRowDefaultHeight == defaultDataRowHeight + cellBorderWidth', () => {
        expect(layout.firstRenderedRowDefaultHeight)
          .toBe(layout.defaultDataRowHeight + layout.cellBorderWidth);
      });

      it('overlayHeight(rows) == firstRenderedRowDefaultHeight + (rows-1) * defaultDataRowHeight', () => {
        expect(layout.overlayHeight({ rows: 3 }))
          .toBe(layout.firstRenderedRowDefaultHeight + (2 * layout.defaultDataRowHeight));
      });

      it('overlayHeight(rows, includeFirstRowCompensation:false) == rows * defaultDataRowHeight', () => {
        expect(layout.overlayHeight({ rows: 3, includeFirstRowCompensation: false }))
          .toBe(3 * layout.defaultDataRowHeight);
      });

      it('verticalScrollForRow(n) == n * defaultDataRowHeight', () => {
        expect(layout.verticalScrollForRow(7)).toBe(7 * layout.defaultDataRowHeight);
      });
    });
  });
});

describe('themeLayoutFromTokens E2E helpers are token-derived', () => {
  it('e2eGcrEditedCellOuterHeight == cellContentHeight + 2 * cellBorderWidth (all themes)', () => {
    ALL_THEMES.forEach((theme) => {
      const l = themeLayoutFromTokens(theme.name);

      expect(l.e2eGcrEditedCellOuterHeight())
        .toBe(l.cellContentHeight + (2 * l.cellBorderWidth));
    });
  });

  it('e2eDensity_f464e90e18 == 2 * defaultDataRowHeight (all themes)', () => {
    ALL_THEMES.forEach((theme) => {
      const l = themeLayoutFromTokens(theme.name);

      expect(l.e2eDensity_f464e90e18()).toBe(2 * l.defaultDataRowHeight);
    });
  });

  it('e2eDensity_9639197594 == 2 * defaultDataRowHeight + cellBorderWidth (all themes)', () => {
    ALL_THEMES.forEach((theme) => {
      const l = themeLayoutFromTokens(theme.name);

      expect(l.e2eDensity_9639197594())
        .toBe((2 * l.defaultDataRowHeight) + l.cellBorderWidth);
    });
  });

  // Add one formula-invariant test per surviving bucket-A/B helper (from audit doc).
});

describe('themeLayoutFromTokens no longer exposes removed helpers', () => {
  const REMOVED_HELPERS = [
    // Fill from audit doc: every bucket-C helper name.
    // e.g. 'e2eStretchColumnsIndexOrderStretchedWidth',
  ];

  it('bucket-C helpers are removed from the API', () => {
    const layout = themeLayoutFromTokens(mainTheme.name);

    REMOVED_HELPERS.forEach((name) => {
      expect(layout[name]).toBeUndefined();
    });
  });
});

describe('themeLayoutFromTokens reacts to theme density changes', () => {
  it('changing theme density would change resolved primitives (invariant proof)', () => {
    // Proves the helper is density-reactive by comparing across themes with
    // different density. If a theme's `.density` changes in src/themes/theme/*.js,
    // this test keeps passing (because it reads .density live) and the layout
    // primitives shift accordingly -- no helper edit needed.
    const byDensity = ALL_THEMES.reduce((acc, t) => {
      acc[t.density] = themeLayoutFromTokens(t.name).cellVerticalPadding;

      return acc;
    }, {});

    Object.entries(byDensity).forEach(([densityName, padding]) => {
      const key = density[densityName].cellVertical.replace('sizing.', '');

      expect(padding).toBe(parseInt(sizing[key], 10));
    });
  });
});

describe('error handling', () => {
  it('throws for unknown theme name', () => {
    expect(() => themeLayoutFromTokens('nonexistent')).toThrow();
  });

  it('defaults to main when theme name is falsy', () => {
    const layout = themeLayoutFromTokens('');

    expect(layout.themeName).toBe(mainTheme.name);
  });
});

describe('themeLayoutFromTokens auto-discovers new themes', () => {
  // Proves: adding a theme module under src/themes/theme/ and exporting it from
  // src/themes/theme/index.js is sufficient for the helper to pick it up --
  // no edit to themeLayoutCore.js or themeLayoutE2eHelpers.js is required.
  it('a synthetic theme module with density + tokens is recognized', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../src/themes/theme', () => ({
        __esModule: true,
        classicTheme,
        mainTheme,
        horizonTheme,
        syntheticTheme: {
          name: 'synthetic',
          density: 'compact',
          tokens: { ...mainTheme.tokens, lineHeight: '24px' },
        },
      }));

      const { E2E_REGISTERED_THEME_KEYS: keys } = require('../themeLayoutCore');
      const { themeLayoutFromTokens: fromTokens } = require('../themeLayoutFromTokens');

      expect(keys).toContain('synthetic');

      const layout = fromTokens('synthetic');

      expect(layout.themeName).toBe('synthetic');
      expect(layout.densityLevel).toBe('compact');
      expect(layout.lineHeight).toBe(24);

      const sizingKey = density.compact.cellVertical.replace('sizing.', '');
      const expectedPadding = parseInt(sizing[sizingKey], 10);

      expect(layout.cellVerticalPadding).toBe(expectedPadding);
      expect(layout.cellContentHeight).toBe(24 + (2 * expectedPadding));
      expect(layout.defaultDataRowHeight).toBe(layout.cellContentHeight + layout.cellBorderWidth);
    });
  });

  it('a synthetic theme with unknown density throws a clear error', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../src/themes/theme', () => ({
        __esModule: true,
        mainTheme,
        brokenTheme: {
          name: 'broken',
          density: 'not-a-density',
          tokens: mainTheme.tokens,
        },
      }));

      const { themeLayoutFromTokens: fromTokens } = require('../themeLayoutFromTokens');

      expect(() => fromTokens('broken')).toThrow(/density "not-a-density"/);
    });
  });
});
```

- [ ] **Step 2: Run the unit suite.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add handsontable/test/helpers/__tests__/themeLayoutFromTokens.unit.js
git commit -m "test(tests): assert theme layout invariants via formulas, not literals"
```

---

## Task 5: Handle bucket-C consumers (spec conversions)

For each helper listed as bucket C in the audit doc, rewrite the consuming spec(s) to not depend on the removed helper.

**Files:** Specs listed per helper in the audit doc. For each:

- [ ] **Step 1: Identify all callers.**

Run (replace `<helper>` with each bucket-C helper name):
```bash
grep -rn "<helper>" handsontable/src handsontable/test --include='*.spec.js'
```
Expected: one or more file:line hits.

- [ ] **Step 2: Rewrite each caller using exactly one of the two allowed replacements:**

**Replacement A — Live DOM read.** When the value can be read off the live DOM after rendering, compute the expected value at test time. Example (before and after):

Before:
```js
const layout = getThemeLayout();
expect(getCell(0, 0).offsetWidth).toBe(layout.e2eStretchColumnsIndexOrderStretchedWidth());
```

After:
```js
// Stretched width is a layout-engine output, not a token-derived value. Assert
// a relationship to other live cells in the same render instead of a pixel literal.
const firstDataCell = getCell(0, 0);
const secondDataCell = getCell(0, 1);

expect(firstDataCell.offsetWidth).toBe(secondDataCell.offsetWidth);
```

**Replacement B — Pin to a single theme.** When the expectation is inherently theme-specific (e.g. text autosize against a specific font), skip the test for other themes:

```js
if (getLoadedTheme() !== 'main') {
  pending('autosize width is font/metric-specific to the main theme');

  return;
}
expect(getCell(0, 0).offsetWidth).toBe(79);
```

- [ ] **Step 3: For each modified spec, run it under every theme.**

Run per spec (substitute the file path):
```bash
for theme in classic main horizon; do
  npm run test:e2e --testPathPattern=<spec/path> --theme=$theme --prefix handsontable
done
```
Expected: PASS under every theme (pinned specs should `pending` cleanly on the unpinned themes, not fail).

- [ ] **Step 4: Commit per spec file (one commit per spec, small diffs).**

```bash
git add <spec/path>
git commit -m "refactor(tests): replace removed theme helper with live DOM read in <area>"
```

---

## Task 6: Tighten the lint rule

**Files:**
- Modify: `handsontable/.config/plugin/eslint/rules/no-pick-by-density-in-spec.js`
- Create: `handsontable/.config/plugin/eslint/rules/__tests__/no-pick-by-density-in-spec.test.js`

- [ ] **Step 1: Read the current rule.**

Run:
```bash
cat handsontable/.config/plugin/eslint/rules/no-pick-by-density-in-spec.js
```
Expected: existing rule that flags `pickByDensity` calls in `*.spec.js`.

- [ ] **Step 2: Write a failing rule test for the new behavior.**

```js
// handsontable/.config/plugin/eslint/rules/__tests__/no-pick-by-density-in-spec.test.js
const { RuleTester } = require('eslint');
const rule = require('../no-pick-by-density-in-spec');

new RuleTester({ parserOptions: { ecmaVersion: 2022, sourceType: 'module' } })
  .run('no-pick-by-density-in-spec', rule, {
    valid: [
      { code: 'const l = getThemeLayout(); expect(x).toBe(l.defaultDataRowHeight);',
        filename: 'foo.spec.js' },
    ],
    invalid: [
      { code: 'pickByDensity({ compact: 1, default: 2, comfortable: 3 });',
        filename: 'foo.spec.js',
        errors: [{ messageId: 'usePickByDensity' }] },
      { code: 'e2ePickForDensity({ compact: 1, default: 2, comfortable: 3 });',
        filename: 'foo.spec.js',
        errors: [{ messageId: 'usePickForDensity' }] },
      { code: 'const t = { compact: 1, default: 2, comfortable: 3 };',
        filename: 'themeLayoutE2eHelpers.js',
        errors: [{ messageId: 'useDensityLiteralTriplet' }] },
    ],
  });
```

- [ ] **Step 3: Run it.**

Run:
```bash
npm run eslint --prefix handsontable -- --rulesdir .config/plugin/eslint/rules
```
Expected: FAIL (new messageIds are not defined).

- [ ] **Step 4: Extend the rule.**

Add two additional reporting paths to the existing rule:

1. Flag `e2ePickForDensity(...)` calls in `*.spec.js`.
2. Flag object expressions that contain all three keys `compact`, `default`, `comfortable` whose values are numeric literals, in any file **except** `themeLayoutE2eHelpers.js` during the transition window. After Task 3 lands, tighten to flag everywhere including `themeLayoutE2eHelpers.js` so regressions to the baked-literal pattern cannot slip in.

- [ ] **Step 5: Re-run the rule test and the full lint.**

Run:
```bash
npm run eslint --prefix handsontable
```
Expected: PASS with no new violations from previously-clean files.

- [ ] **Step 6: Commit.**

```bash
git add handsontable/.config/plugin/eslint/rules/no-pick-by-density-in-spec.js \
        handsontable/.config/plugin/eslint/rules/__tests__/no-pick-by-density-in-spec.test.js
git commit -m "build(eslint): forbid density literal triplets in helpers and specs"
```

---

## Task 7: Documentation

**Files:**
- Modify: `.ai/TESTING.md`
- Modify: `.claude/skills/handsontable-e2e-testing/SKILL.md`

- [ ] **Step 1: Rewrite the "Data-driven theme assertions" section.**

The section must now state:

1. **Entry point**: `themeLayoutFromTokens(themeName)` reads the theme's `density` and `tokens` directly from `handsontable/src/themes/theme/<name>.js`. Changing a theme's `density` in that module propagates to tests automatically.
2. **Rule**: all expectations are **pure expressions over tokens + density tokens + sizing tokens**. Numeric density triplets (`{ compact: N, default: N, comfortable: N }`) are forbidden. Enforced by lint rule `no-pick-by-density-in-spec`.
3. **When a value is not token-derivable** (text shaping, autosize widths, pixel rounding artifacts), the spec must either (a) assert a relational invariant against the live DOM, or (b) pin to a single theme via `pending()`. It must not be baked as a triplet.
4. **Adding a new theme — full checklist.** The test helpers auto-discover theme modules; the only edits required are outside the test harness:
   - Create `handsontable/src/themes/theme/<name>.js` exporting `{ name, density, icons, colors, tokens }`.
   - Re-export it from `handsontable/src/themes/theme/index.js`.
   - Ensure the theme build produces `handsontable/styles/ht-theme-<name>.css` (and the `*-no-icons.css` variant if other themes produce it).
   - Add an E2E matrix job in `.github/workflows/test.yml` mirroring the existing `test-handsontable-e2e-<name>` / `test-handsontable-e2e-min-<name>` pair, and add the job to the two `needs:` aggregator lists (around lines 668–672 and 808–812 on the current branch).
   - Consider whether `handsontable/webpack.config.js`'s `DEFAULT_THEME` should change (almost always: no).
   - Run the new-theme canary (plan Task 9b) to confirm end-to-end discovery before merging.
   - No edits are required to: `themeLayoutCore.js`, `themeLayoutE2eHelpers.js`, `themeLayoutFromTokens.js`, `common.js`, `it-themes-extension.js`, unit tests, any `*.spec.js` file.

- [ ] **Step 2: Sync the Claude skill.**

Mirror the same three rules in `.claude/skills/handsontable-e2e-testing/SKILL.md` theme-layout subsection.

- [ ] **Step 3: Sync cursor rules.**

Run:
```bash
node scripts/sync-skills-to-cursor.mjs
```
Expected: clean output, no errors.

- [ ] **Step 4: Commit.**

```bash
git add .ai/TESTING.md .claude/skills/handsontable-e2e-testing/SKILL.md .cursor
git commit -m "docs: document token-driven theme assertion rule and auto-discovery"
```

---

## Task 7.5: Audit non-helper code for hardcoded theme names

Before validation, sweep the test harness for any stray code that hardcodes theme names in a way that would block auto-discovery. Anything found is either (a) rewritten to iterate `E2E_REGISTERED_THEME_KEYS` / `Object.values(themeModules)`, or (b) explicitly annotated as "theme-module-owned, intentional" with a comment.

**Files to audit:**
- `handsontable/test/helpers/common.js`
- `handsontable/test/helpers/custom-matchers.js`
- `handsontable/test/helpers/it-themes-extension.js`
- `handsontable/webpack.config.js`
- `handsontable/.config/test-e2e.js`, `handsontable/.config/test-mobile.js`, `handsontable/.config/test-production.js`
- Any `*.spec.js` that uses literal `'classic'`, `'main'`, `'horizon'` strings.

- [ ] **Step 1: Run the audit grep.**

Run:
```bash
grep -rnE "\b(['\"])(classic|main|horizon)\1" \
  handsontable/test handsontable/.config handsontable/webpack.config.js \
  --include='*.js' --include='*.mjs' --include='*.cjs'
```
Expected: a list of hits. For each hit, decide:
- **Keep (annotate)**: the hit is in a stylesheet filename path that is genuinely theme-name-indexed (e.g. the iframe `<link>` URL builder in `common.js:228`) — this is already iterating `E2E_REGISTERED_THEME_KEYS` so the name is a loop variable, not a hardcoded allowlist. Ensure that remains true.
- **Rewrite**: the hit is an allowlist (e.g. `['classic', 'main', 'horizon'].forEach(...)`) — replace with `E2E_REGISTERED_THEME_KEYS.forEach(...)`.
- **Delete**: the hit is dead code.

- [ ] **Step 2: If any rewrites are needed, apply them and re-run Task 8's full validation after.**

- [ ] **Step 3: Commit rewrites as one commit.**

```bash
git commit -am "refactor(tests): replace hardcoded theme allowlists with E2E_REGISTERED_THEME_KEYS"
```

---

## Task 8: End-to-end validation across all three themes

- [ ] **Step 1: Run every spec under every theme.**

Run:
```bash
npm run build --prefix handsontable
for theme in classic main horizon; do
  echo "=== Running E2E under theme=$theme ===";
  npm run test:e2e --theme=$theme --prefix handsontable;
done
```
Expected: PASS under all three themes.

- [ ] **Step 2: Run the unit suite.**

Run:
```bash
npm run test:unit --prefix handsontable
```
Expected: PASS.

- [ ] **Step 3: Run lint.**

Run:
```bash
npm run eslint --prefix handsontable
```
Expected: PASS.

---

## Task 9: Canary tests — prove theme-density changes **and** new themes propagate

Two canaries, run independently. Each one proves one axis of the rewrite's goal.

### 9a — Density flip canary

Proves: changing a theme's `density` in `src/themes/theme/*.js` flows through to test expectations automatically, with **no** test-helper edit required.

- [ ] **Step 1: Flip `main` theme density to `compact`.**

Edit `handsontable/src/themes/theme/main.js`:
```js
density: 'compact',
```

- [ ] **Step 2: Run main-theme E2E.**

Run:
```bash
npm run test:e2e --theme=main --prefix handsontable
```
Expected: PASS. (Every layout expectation should now be the compact-density value, computed through the helper from the theme module.)

- [ ] **Step 3: Run unit tests.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: PASS. The "reads from src/themes/theme modules" suite now sees `mainTheme.density === 'compact'` and asserts accordingly.

- [ ] **Step 4: Revert the canary.**

Run:
```bash
git restore handsontable/src/themes/theme/main.js
```
Expected: `main.js` back to `density: 'default'`.

- [ ] **Step 5: Re-run E2E + unit to confirm the helpers compose correctly for both density values.**

Run:
```bash
npm run test:e2e --theme=main --prefix handsontable
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: PASS.

- [ ] **Step 6: Commit nothing (canary leaves no trace).**

Confirm `git status` is clean before moving on.

### 9b — New theme canary

Proves: a new theme module exported from `src/themes/theme/index.js` with a matching stylesheet is picked up end-to-end — by `E2E_REGISTERED_THEME_KEYS`, by every `e2e*` helper, by `getE2eThemeStylesheetLinkTagsHtml()`, and by the `--theme=<name>` runner flag — without a single edit to `themeLayoutCore.js`, `themeLayoutE2eHelpers.js`, or any unit or E2E test.

- [ ] **Step 1: Create the synthetic theme module.**

Create `handsontable/src/themes/theme/canary.js`:
```js
import mainIcons from '../static/variables/icons/main';
import mainColors from '../static/variables/colors/main';
import mainTokens from '../static/variables/tokens/main';

const canaryTheme = {
  name: 'canary',
  density: 'comfortable',
  icons: mainIcons,
  colors: mainColors,
  tokens: mainTokens,
};

export { canaryTheme };
```

Edit `handsontable/src/themes/theme/index.js` to export it:
```js
export { classicTheme } from './classic';
export { mainTheme } from './main';
export { horizonTheme } from './horizon';
export { canaryTheme } from './canary';
```

- [ ] **Step 2: Produce the stylesheet.**

Run the theme build so `handsontable/styles/ht-theme-canary.css` exists:
```bash
npm run build --prefix handsontable
ls handsontable/styles/ht-theme-canary.css
```
Expected: the file exists. If the theme build does not pick it up automatically, the rewrite plan has uncovered a second generator that hardcodes theme names — document the finding and file a follow-up issue.

- [ ] **Step 3: Assert the registry picks up the canary without helper edits.**

Run:
```bash
node -e "const { E2E_REGISTERED_THEME_KEYS } = require('./handsontable/test/helpers/themeLayoutCore.js'); console.log(E2E_REGISTERED_THEME_KEYS)"
```
Expected output includes `canary` alongside `classic`, `main`, `horizon`.

- [ ] **Step 4: Run unit tests.**

Run:
```bash
npm run test:unit --testPathPattern=themeLayoutFromTokens --prefix handsontable
```
Expected: PASS. The `ALL_THEMES.forEach` loop in Task 4's unit suite now also covers `canary`.

- [ ] **Step 5: Run E2E against the canary theme.**

Run:
```bash
npm run test:e2e --theme=canary --testPathPattern=Core_view --prefix handsontable
```
Expected: PASS. (Any spec passes, because every expectation is computed from tokens through the helper.)

- [ ] **Step 6: Grep for any helper or test that hardcoded `classic|main|horizon` as an allowlist.**

Run:
```bash
grep -rnE "\b(classic|main|horizon)\b" handsontable/test/helpers handsontable/src/themes \
  --include='*.js' | grep -vE "^(Binary|.*node_modules)" | \
  grep -vE "themeLayoutFromTokens\.unit\.js|themeLayoutCore\.contract\.unit\.js"
```
Expected: output should only contain references in theme module files themselves (`theme/classic.js`, `theme/main.js`, `theme/horizon.js`), docs comments, or the canary's own file. No helper should reference a theme by name.

- [ ] **Step 7: Revert the canary.**

Run:
```bash
rm handsontable/src/themes/theme/canary.js
git restore handsontable/src/themes/theme/index.js handsontable/styles
```
Expected: working tree clean.

- [ ] **Step 8: Confirm the registry is back to three themes.**

Run:
```bash
node -e "const { E2E_REGISTERED_THEME_KEYS } = require('./handsontable/test/helpers/themeLayoutCore.js'); console.log(E2E_REGISTERED_THEME_KEYS)"
```
Expected: `['classic', 'main', 'horizon']`.

---

## Self-review checklist (run before handing off)

- [ ] **Spec coverage** — every point in the goal statement (entry point from `src/themes/theme`, all expectations computed from tokens, density-flip canary, new-theme canary) has at least one task.
- [ ] **No placeholders** — no "TBD", "handle edge cases", "fill in". Every code step has either full code or a full command. The only exceptions are: (a) the bucket-B/C audit output in Task 3, which by design produces a table consumed downstream, and (b) Task 4's `REMOVED_HELPERS` array, which is filled from that audit.
- [ ] **Type consistency** — helper names used in Task 4 (`e2eDensity_f464e90e18`, `e2eGcrEditedCellOuterHeight`) match Task 3 definitions. Removed-helper list in Task 4 is populated from the Task 3 audit doc before Task 4 runs.
- [ ] **Bucket-C list** — Task 4 lists every removed helper before the unit test suite asserts they're gone; Task 5 rewrites every spec that called them.
- [ ] **Density canary** — Task 9a validates that a density change in `src/themes/theme/*.js` propagates through the helpers and tests, with no helper edits.
- [ ] **New-theme canary** — Task 9b validates that a brand-new theme module (with density, tokens, and a stylesheet) is auto-discovered by the registry, by unit tests, by the E2E stylesheet injector, and by the `--theme=<name>` runner flag, with no helper edits.
- [ ] **Hardcoded-name audit** — Task 7.5 sweeps the test harness for stray `classic|main|horizon` allowlists and converts them to iterate `E2E_REGISTERED_THEME_KEYS`.
- [ ] **Docs adding-a-theme checklist** — Task 7's `.ai/TESTING.md` update lists every place a new theme requires a manual touch (theme module, `index.js`, stylesheet, CI job), and lists every place that requires **no** edit (all helpers, all unit tests, all specs).
