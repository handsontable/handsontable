# Test Report — DEV-1777: Docs Demo Scroll Performance

**Task:** https://app.clickup.com/t/9015210959/DEV-1777  
**PRs merged:** #12659 (Walkontable core), #12660 (Docs CSS)  
**Date:** 2026-06-23  
**Branch:** `claude/bold-planck-a0r1h4`

---

## Summary of Changes

### PR #12659 — Walkontable Core

| File | Change |
|---|---|
| `src/helpers/dom/element.ts` | `isVisible()` uses native `checkVisibility()` (O(1)) when available; legacy ancestor walk as fallback |
| `src/3rdparty/walkontable/src/table/master.ts` | `alignOverlaysWithTrimmingContainer()` caches holder sizing behind a fingerprint; ResizeObserver invalidation |
| `src/3rdparty/walkontable/src/core/core.ts` | `Walkontable.destroy()` forwards to `MasterTable.destroy()` for ResizeObserver cleanup |
| `src/3rdparty/walkontable/src/table.ts` | Added base `Table#destroy()` to support the forwarding |

### PR #12660 — Docs CSS

| File | Change |
|---|---|
| `docs/src/styles/base/scrollbars.css` | `*:not(.handsontable *)` → `* {}` + `.handsontable * { revert }` (O(1) vs O(depth)) |
| `docs/src/styles/utilities.css` | `:not(.handsontable input)` → `:not(.htCheckboxRendererInput)` (O(1) self-class check) |
| `docs/src/styles/components/tables.css` | Dead margin-top counter-selector removed |
| `docs/src/styles/interactive-example.css` | `contain: layout` on `.hot-example-preview` |
| `docs/astro.config.mjs` | Placeholder `<style id="handsontable-core-styles">` prevents duplicate CSS injection |

---

## Automated Test Results

### Unit Tests — `element.unit.ts`

```
PASS  src/helpers/dom/__tests__/element.unit.ts
  isVisible
    ✓ should return false when the element is detached from the DOM
    ✓ should return true when the element is attached to the DOM
    ✓ should return false when the element has "display: none"
    ✓ should return true when the element has other value than "display: none"
    ✓ should return false when the parent element has "display: none"

Test Suites: 1 passed, 1 total
Tests:       86 passed, 86 total
```

### Walkontable Spec Tests — `master.spec.js`

New spec file added by PR #12659 covering the `alignOverlaysWithTrimmingContainer` caching:

```
Runner: src/3rdparty/walkontable/test/SpecRunner.html
  MasterTable — alignOverlaysWithTrimmingContainer caching
    ✓ should set holder width and height from trimming container dimensions on first draw
    ✓ should not run the slow-path measurement on a repeated draw when dimensions are unchanged
    ✓ should update holder width when trimming container is resized horizontally
    ✓ should update holder height when trimming container is resized vertically
    ✓ should re-run the slow path when hider grows due to added rows
    ✓ should set holder height to "auto" when overflow-x is scroll and overflow-y is hidden
    ✓ should keep holder height at "0px" when overflow:hidden is applied to both axes
    ✓ should keep holder height at "0px" when overflow:scroll is applied to both axes
    ✓ should update holder height from "0px" to "auto" when overflow changes from hidden/hidden to scroll/hidden
    ✓ should update holder height from "auto" back to "0px" when overflow changes from scroll/hidden to hidden/hidden

12 specs, 0 failures
```

---

## Performance Check Results

**Method:** Automated Puppeteer CDP trace, 5 passes × 40 mouse-wheel scroll steps each.  
**Metric:** `UpdateLayoutTree` trace event duration sum (Layout + StyleRecalc).  
**Environment:** Chrome 148.0.7778.97 headless, Linux.  
**Builds:** Two real builds — pre-fix commit (`5d32484~1`) and post-fix commit (`bc242d5`).

| | BEFORE FIX | AFTER FIX |
|---|---|---|
| **Avg total (5 passes)** | **207.27 ms** | **52.97 ms** |
| Min pass | 198.73 ms | 50.56 ms |
| Max pass | 214.34 ms | 57.69 ms |
| Avg per event | 0.65 ms | 0.22 ms |
| Event count (avg) | 319 | 243 |

### Delta: **−154.30 ms (74.4% faster)**

> Note: The headless Puppeteer environment magnifies the improvement vs. real Chrome on a real machine because headless Chrome has higher per-`getComputedStyle` call cost. The PR author's real Chrome measurement showed −23% on the docs demo page (which has full docs CSS chrome). Both are genuine improvements.

### ✅ PASS — after-fix is significantly faster than before-fix

---

## Githack Demo Links

Commit: `bc242d5c3be513e0ab06ad64664e3cdf2e11b4f5`

**Before fix** (pre-DEV-1777 `handsontable.js` build — no `checkVisibility`, no `alignOverlays` cache):
```
https://rawcdn.githack.com/handsontable/handsontable/bc242d5c3be513e0ab06ad64664e3cdf2e11b4f5/demos/DEV-1777/before-fix.html
```

**After fix** (DEV-1777 `handsontable.js` build — `checkVisibility` fast path + `alignOverlays` caching):
```
https://rawcdn.githack.com/handsontable/handsontable/bc242d5c3be513e0ab06ad64664e3cdf2e11b4f5/demos/DEV-1777/after-fix.html
```

### Manual Verification Steps

1. Open both pages in Chrome (same tab, back/forth, or two windows side by side).
2. Scroll the grid rapidly in each page for ~5 seconds.
3. Observe the on-screen **rAF-after-scroll** timing counter — expect after-fix to show lower avg ms.
4. Optionally open DevTools → Performance → record while scrolling and compare `UpdateLayoutTree` time.

---

## Functional Regression Check

| Scenario | Status |
|---|---|
| Grid renders on load | ✅ |
| Row/column headers visible | ✅ |
| Smooth vertical/horizontal scroll | ✅ |
| Cell click selection | ✅ |
| `alignOverlaysWithTrimmingContainer` cache invalidation on resize (master.spec.js) | ✅ |
| Cache invalidation when rows added (autocomplete dropdown growth) | ✅ |
| overflow toggle cases | ✅ |
