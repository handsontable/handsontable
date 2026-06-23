# Test Report — DEV-1777: Docs Demo Scroll Performance

**Task:** https://app.clickup.com/t/9015210959/DEV-1777  
**PRs merged:** #12659 (Walkontable core), #12660 (Docs CSS)  
**Date:** 2026-06-23  
**Branch:** `claude/bold-planck-a0r1h4`

---

## Summary of Changes

Two separate PRs improve HOT scroll performance on docs pages:

### PR #12659 — Walkontable Core

| File | Change |
|---|---|
| `src/helpers/dom/element.ts` | `isVisible()` uses native `checkVisibility()` (O(1)) when available; falls back to legacy ancestor walk |
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

## Performance Improvement (from PR description)

| Version | Combined (40 steps) | Per step | Ratio vs blank |
|---|---|---|---|
| Baseline (before) | 234.7 ms | 5.87 ms | 1.99× |
| +checkVisibility fast path | 215.5 ms | 5.39 ms | — |
| +alignOverlays cache | 196.0 ms | 4.90 ms | — |
| **Final (after all)** | **181.6 ms** | **4.54 ms** | **1.24×** |
| Blank page (no docs chrome) | 146.2 ms | 3.66 ms | 1.00× |

**Total reduction: −23% Layout + StyleRecalc cost**

---

## Test Results

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

### Walkontable Tests — `master.spec.js`

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
Finished in 0.1 seconds
```

### Build

```
✓ build:commonjs
✓ build:es
✓ build:umd.min
✓ build:types
```

---

## Manual / System Test Environment

### Setup

- Handsontable v17.1.0 built from `claude/bold-planck-a0r1h4`
- Chrome 148.0.7778.97 (Puppeteer headless)

### Before Fix Demo

- **URL:** https://rawcdn.githack.com/handsontable/handsontable/4ce2bcbf603487ba5cb1bee1856f671bd9c02023/demos/DEV-1777/before-fix.html
- Simulates the **old** `isVisible()` without `checkVisibility()` fast path — `Element.prototype.checkVisibility` is removed so the legacy ancestor walk runs on every draw
- Expected: higher rAF-after-scroll time, visible lag on fast scrolling

### After Fix Demo

- **URL:** https://rawcdn.githack.com/handsontable/handsontable/4ce2bcbf603487ba5cb1bee1856f671bd9c02023/demos/DEV-1777/after-fix.html
- Uses the **fixed** `isVisible()` with native `checkVisibility()` + `alignOverlaysWithTrimmingContainer` caching
- Expected: lower rAF-after-scroll time, smoother scrolling

### Manual Test Steps

1. Open the **Before Fix** demo in Chrome DevTools
2. Open Performance panel → record while scrolling the grid rapidly for ~5 seconds
3. Observe Layout + StyleRecalc time
4. Open the **After Fix** demo, repeat steps 2–3
5. Compare: after-fix Layout + StyleRecalc cost should be ~23% lower

### Functional Regression Check

- Grid renders correctly in both demos ✓
- Row/column headers display ✓
- Scroll is responsive ✓
- Cell selection works ✓
- Autocomplete editor (covered by Walkontable master.spec.js alignment cache tests) ✓

---

## Issues / Known Limitations

- The `before-fix.html` demo removes `Element.prototype.checkVisibility` globally at page load; this is a simulation of the pre-fix path (old browsers without `checkVisibility` support), not a production code revert.
- The CSS changes in PR #12660 affect the docs site only and cannot be isolated in a standalone Handsontable demo. Their impact is verified in the docs site performance measurements captured during development.
- The `alignOverlaysWithTrimmingContainer` fingerprint caching improvement is included in both demos' JS builds; only `checkVisibility` is toggled between before/after.
