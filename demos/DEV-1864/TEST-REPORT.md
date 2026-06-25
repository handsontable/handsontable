# Test Report — DEV-1864: Fix SonarCloud BLOCKER and HIGH severity issues

**PR:** [#12761](https://github.com/handsontable/handsontable/pull/12761)  
**Merged:** 2026-06-12  
**Test date:** 2026-06-25  
**Branch tested:** `develop` (post-merge)

---

## Summary of Changes

This PR fixed 13 SonarCloud static-analysis issues across 55+ files:

| Rule | Description | Files Affected |
|------|-------------|----------------|
| S3516 | Methods always returning same value | columnSorting, nestedRows |
| S3735 | `void` operator misuse (discards return value) | core, selection, highlight (30+ sites) |
| S7761 | `getAttribute`/`setAttribute` → `dataset` API | core, copyPaste |
| S7740 | `this`-alias → arrow functions | nestedHeaders, stateManager |
| S2004 | Extract helpers to reduce nesting | core, object, dataProvider |
| S7768 | `insertBefore`/`replaceChild` → `.before()`/`.replaceWith()` | walkontable/table, directDomRendererAdapter |
| S1186 | Document intentionally empty methods | base, table |
| S7724 | ESLint-disable comments must name the rule | mixed, jquery |
| S1994 | `for/in` loop with unrelated increment | dataMap |
| S7767 | Bitwise `>> 0` → `Math.trunc` | autoColumnSize, autoRowSize |
| S7746 | Remove unnecessary `Promise.resolve` wrappers | dataProvider |
| S4621 | Remove duplicate type union members | themes/types |
| S3776 | Reduce cognitive complexity (extract private helpers) | 55 files |

**Follow-up fixes within the same PR:**
- Regression: `Math.trunc(undefined)` returns `NaN` → added `Number.isFinite` guard
- Restored `return false` in Enter key shortcuts (removed by accident via `void` elimination)
- Fixed invalid JSDoc tuple type in `mergeCells` renderer

---

## Unit Tests

**Command:** `npm --prefix handsontable run test:unit`

| Test Suite | Tests | Result |
|-----------|-------|--------|
| sortFunction/checkbox.unit.ts | ✓ | PASS |
| sortFunction/default.unit.ts | ✓ | PASS |
| sortFunction/numeric.unit.ts | ✓ | PASS |
| sortFunction/date.unit.ts | ✓ | PASS |
| sortFunction/time.unit.ts | ✓ | PASS |
| dataMap (12 suites) | 209 tests | PASS |
| helpers (23 suites) | 467 tests | PASS |
| nestedRows/utils | 4 tests | PASS |
| autofill/mergeCells | 9 tests | PASS |
| **Total** | **2848 tests, 261 suites** | **ALL PASS** |

---

## E2E Tests

**Command:** `npm --prefix handsontable run test:e2e -- --testPathPattern=<plugin>`

| Plugin | Specs | Failures | Notes |
|--------|-------|----------|-------|
| columnSorting | 269 | 0 | — |
| autoColumnSize | 60 | 0 | — |
| autoRowSize | 53 | 0 | 1 pending (pre-existing) |
| autofill | 248 | 0 | 2 pending (pre-existing) |
| nestedRows | 48 | 0 | — |
| collapsibleColumns | 115 | 0 | — |

---

## Manual / System Tests

### Test 1 — autoColumnSize: syncLimit NaN regression (S7767)

**Scenario:** `autoColumnSize: true` with no explicit `syncLimit` (defaults to `undefined`).

| Step | Before fix (regression) | After fix |
|------|------------------------|-----------|
| `getSyncCalculationLimit()` returns | `NaN` | `0` (finite, safe) |
| `NaN >= 0` sync phase | Skipped (false) | Runs |
| Column widths on first paint | Wrong (default narrow widths) | Correct (content-fitted) |
| Visual flash on load | YES — columns resize after async calculation | NO — correct widths on first render |

**Reproduction:** See `before-fix.html` (patches prototype to simulate regression) vs `after-fix.html`.

---

### Test 2 — columnSorting sort functions (S3516)

**Scenario:** Sort a column containing checkbox cell type values mixed with empty cells.

| Step | Result |
|------|--------|
| Sort ascending with `true`/`false` values | ✓ `false` rows sort before `true` rows |
| Sort descending | ✓ `true` rows sort before `false` rows |
| Empty cells sort with `sortEmptyCells: false` | ✓ Empty cells stay at bottom |
| Empty cells sort with `sortEmptyCells: true` | ✓ Empty cells sort to front (asc) |
| Bad values (non-template) mixed in | ✓ Fall back to default comparator |

All columnSorting E2E tests: **269 specs, 0 failures**.

---

### Test 3 — dataMap column insertion (S1994)

**Scenario:** Call `hot.alter('insert_col_start', 2, 3)` to insert 3 columns starting at index 2.

| Step | Result |
|------|--------|
| Correct number of columns created (3) | ✓ |
| Data source structure intact | ✓ |
| Visual columns match source columns | ✓ |

The `for` loop counter refactoring (moving `numberOfCreatedCols++` to the loop header update) is functionally equivalent. No behavioral change detected.

---

### Test 4 — Hooks system (S3735 / S3776)

**Scenario:** Verify hooks `beforeSelectionHighlightSet`, `afterSelectAll`, `insertRowRequire` fire correctly.

The `void` operator removal from local-hook callbacks and `#runHandlers` extraction had no visible behavioral impact on selection, row insertion, or modification hooks.

---

## Regression Risks

| Area | Risk | Assessment |
|------|------|------------|
| `autoColumnSize` with `syncLimit: undefined` | HIGH (NaN regression) | **Fixed within PR** |
| `autoRowSize` with `syncLimit: undefined` | HIGH (same bug) | **Fixed within PR** |
| Enter key shortcuts | MEDIUM (return false removed by void change) | **Restored within PR** |
| Column sorting (all types) | LOW (refactoring only, 269 E2E tests pass) | OK |
| dataMap column insertion | LOW (loop refactoring only) | OK |
| Walkontable DOM ops | LOW (`.before()`/`.replaceWith()` are standard equivalents) | OK |

---

## Conclusion

**All 2848 unit tests and all targeted E2E tests pass.** The PR is safe to ship. The two regressions introduced mid-development (NaN in `getSyncCalculationLimit` and lost `return false` in Enter shortcuts) were identified and fixed before the PR was merged.
