# Test Report — DEV-1796

**Task:** TypeError: Cannot read property 'isHorizontallyScrollableByWindow' of undefined  
**Date:** 2026-06-23  
**Branch:** `claude/dazzling-ritchie-99dahv`

---

## Bug Summary

A `TypeError` was thrown inside the `StretchColumns` plugin's `ResizeObserver` callback when `hot.view` was `undefined` at the time the `requestAnimationFrame` callback executed (race condition during initialization or teardown).

**Error:**
```
TypeError: Cannot read property 'isHorizontallyScrollableByWindow' of undefined
    at ? (/docs/_astro/registry.4fU0qdeL.js:34:17565)
```

**Root cause:** The ResizeObserver callback in `stretchColumns.ts` used:
```js
// BEFORE — buggy:
if (!this.hot?.view.isHorizontallyScrollableByWindow()) {
```
Optional chaining was applied to `hot` but **not** to `view`. If `hot.view` is `undefined`, accessing `.isHorizontallyScrollableByWindow()` throws a TypeError.

---

## Fix

**Commit:** `5e2113d` (DEV-1772: Fix TypeScript strict mode errors, PR #12635)  
**File:** `handsontable/src/plugins/stretchColumns/stretchColumns.ts`

```js
// AFTER — fixed:
if (!this.hot?.view?.isHorizontallyScrollableByWindow()) {
```

Added `?.` optional chaining on `view` as well. When `view` is `undefined`, the expression short-circuits to `undefined` (falsy) instead of throwing.

Same pattern also applied to calls inside the callback body:
```js
// BEFORE:
this.hot.view.adjustElementsSize();
this.hot.refreshDimensions();

// AFTER:
this.hot?.view?.adjustElementsSize();
this.hot?.refreshDimensions();
```

---

## Test Coverage

### E2E Regression Test (added in PR #12655)

**File:** `handsontable/src/plugins/stretchColumns/__tests__/stretchColumns.spec.js`

**Test name:** `should not throw when the ResizeObserver fires while hot.view is not yet available`

The test:
1. Initializes Handsontable with `stretchH: 'all'`
2. Waits for animation frames to settle
3. Sets `hot.view = undefined` to simulate the race condition
4. Triggers a body resize to queue a ResizeObserver callback
5. Waits for the ResizeObserver + rAF to execute
6. Verifies no error is thrown

### E2E Test Results

```
Runner: test/E2ERunner-44b38c6f.html (testPathPattern: stretchColumns, theme: main)
36 specs, 0 failures
Finished in 1 second
```

All 36 `stretchColumns` E2E tests pass, including the new regression test.

---

## Manual Testing — Githack Demos

### Before Fix
Demonstrates the TypeError by simulating the pre-fix code pattern (`hot?.view.isHorizontallyScrollableByWindow()` without `?.` on `view`):

**URL:** https://rawcdn.githack.com/handsontable/handsontable/687e1abe1090ff20f4a1f64fc1a938afc1abd791/demos/DEV-1796/before-fix.html

**Expected:** Red error banner — `TypeError: Cannot read properties of undefined (reading 'isHorizontallyScrollableByWindow')`

### After Fix
Demonstrates the fixed code pattern (`hot?.view?.isHorizontallyScrollableByWindow()` with `?.` on both):

**URL:** https://rawcdn.githack.com/handsontable/handsontable/687e1abe1090ff20f4a1f64fc1a938afc1abd791/demos/DEV-1796/after-fix.html

**Expected:** Green success banner — `No TypeError — fix works correctly!`

---

## Result

| Check | Status |
|---|---|
| Root cause identified | ✅ |
| Fix present in codebase | ✅ (`5e2113d`) |
| E2E regression test added | ✅ (`b75dead`, PR #12655) |
| E2E tests passing (36/36) | ✅ |
| Before/after demo pages | ✅ |
