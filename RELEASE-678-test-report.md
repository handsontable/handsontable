# RELEASE-678 — App: Scroll & Positioning — Test Report

**Task:** [RELEASE-678](https://app.clickup.com/t/86caadn1z) (Release 18.0 QA)
**Date:** 2026-07-01
**Tested version:** `handsontable@18.0.0`
**Branch:** `claude/test-release-678-k76thz` (based on `develop`)
**Environment:** Node 22.22.2, pnpm 10.30.2, headless Chrome 148 (Puppeteer)

## Scope

Two fixes shipped for 18.0:

| Area | PR | Change |
|---|---|---|
| Scroll hooks — position change detection | [#12151](https://github.com/handsontable/handsontable/pull/12151) | `afterScrollVertically` / `afterScrollHorizontally` no longer fire when the axis position is unchanged |
| Pagination — caret alignment | [#12205](https://github.com/handsontable/handsontable/pull/12205) | 1px left-caret misalignment fixed by correcting the `arrowLeft` icon SVG path |

**Note on the current version:** since both PRs merged, the affected source files were migrated from `.js` to `.ts`. Both fixes are present in the current codebase:
- Scroll dedup logic → `handsontable/src/3rdparty/walkontable/src/overlays.ts` (`#didVerticalScrollPositionChange`, `#didHorizontalScrollPositionChange`, `#cacheScrollCallbackPositions`).
- `arrowLeft` icon → corrected path `M9.49268 11.2929L6.19978 8.00001L9.49268 4.70712` in `main.ts` and `horizon.ts`, and in the built `styles/ht-theme-*.css` (`.ht-page-prev::before`).

## Result summary

| Test | Type | Result |
|---|---|---|
| Scroll hook deduplication | Unit (Jest) | ✅ 3/3 pass |
| Scroll hook `afterScroll*` behavior | E2E (Jasmine/Puppeteer) | ✅ 0 failures |
| Scroll hook manual behavior (all checklist items) | System (Puppeteer + full bundle) | ✅ pass |
| Pagination caret alignment | System (Puppeteer + full bundle, visual + geometry) | ✅ pass |

No console errors were produced during the manual run.

---

## 1. Unit tests (PR #12151)

Command (from `handsontable/`):
```
npm_config_testPathPattern=src/__tests__/tableView.unit.js npm run test:unit
```
File: `handsontable/src/__tests__/tableView.unit.js` — suite **"Overlays scroll hook deduplication"**.

```
PASS src/__tests__/tableView.unit.js
  Overlays scroll hook deduplication
    ✓ should emit `afterScrollVertically` once when Walkontable vertical scroll fires twice at the same position
    ✓ should emit `afterScrollHorizontally` once when Walkontable horizontal scroll fires twice at the same position
    ✓ should keep vertical and horizontal deduplication independent
Tests: 3 passed, 3 total
```
(Harmless `console.warn` about theme name appears because CSS is not loaded under jsdom — not a failure.)

**Pagination (PR #12205):** the *merged* diff contains only the icon SVG change and the changelog — no unit test file was included in the final merge, so there is no pagination unit test to run. Covered by the system test below instead.

## 2. E2E tests (PR #12151)

Commands (from `handsontable/`):
```
npm run build:umd
npm_config_testPathPattern=scrollHooks.spec.js npm run test:e2e.dump
npm_config_testPathPattern=scrollHooks.spec.js npm run test:e2e.puppeteer
```
File: `handsontable/src/__tests__/core/scrollHooks.spec.js` (3 test cases):
- should not emit `afterScrollVertically` / `afterScroll` when vertical scroll fires without vertical position change
- should not emit `afterScrollHorizontally` / `afterScroll` when horizontal scroll fires without horizontal position change
- should still emit axis-specific hooks once after duplicate scroll on the other axis

Runner output:
```
Runner: test/E2ERunner-ccc5abb7.html (testPathPattern: scrollHooks.spec.js, theme: main)
8 specs, 0 failures
Finished in 0.4 seconds
```

## 3. System / manual test

A standalone demo page (`release-678-demo.html`) using the built `dist/handsontable.full.js` + `styles/ht-theme-main.css` was driven with Puppeteer against real Chrome. It runs two grids: one with `afterScroll*` hooks logging, and one with the `pagination` plugin enabled.

### 3a. Scroll hooks — position change detection

Deltas measured per action (hook fire counts):

| Action | Δ vertical | Δ horizontal | Δ afterScroll | Expected | Verdict |
|---|---|---|---|---|---|
| Scroll DOWN to row 60 | 1 | 0 | 1 | vertical FIRES | ✅ |
| Scroll UP to row 0 | 1 | 0 | 1 | vertical FIRES | ✅ |
| Scroll to TOP again (no change) | 0 | 0 | 0 | DOESN'T FIRE | ✅ |
| Scroll to BOTTOM row 199 | 1 | 0 | 1 | vertical FIRES | ✅ |
| Scroll past BOTTOM (no change) | 0 | 0 | 0 | DOESN'T FIRE | ✅ |
| Scroll RIGHT to col 40 | 0 | 1 | 1 | horizontal FIRES | ✅ |
| Scroll RIGHT again (no change) | 0 | 0 | 0 | DOESN'T FIRE | ✅ |

Maps directly to the task checklist:
- ✅ Scroll down — hook FIRES
- ✅ Scroll back up — hook FIRES
- ✅ Try to scroll past bottom edge — hook DOESN'T FIRE (position unchanged)
- ✅ Try to scroll past top edge — hook DOESN'T FIRE
- ✅ Hook called only for actual position changes
- ✅ (extra) vertical and horizontal deduplication are independent

### 3b. Pagination — caret alignment

Rendered `-webkit-mask-image` paths read from the live DOM:

- Prev caret (`.ht-page-prev`, arrowLeft): `M9.49268 11.2929L6.19978 8.00001L9.49268 4.70712` — **corrected path present**.
- Next caret (`.ht-page-next`, arrowRight, reference): `M6.64648 10.9393L9.93938 7.64644L6.64648 4.35354`.

Geometry check (16×16 viewBox) — mirror symmetry of the chevron tip between left and right carets, and vertical centering of the left caret:

| Metric | Old (before fix) | New (current) |
|---|---|---|
| Left-tip horizontal asymmetry vs right caret | 0.586 px | 0.139 px |
| Left-tip vertical offset from center (y=8) | −0.354 px | 0.000 px |

The left caret now mirrors the right caret (asymmetry reduced from ~0.6px to ~0.14px) and is vertically centered. All four navigation buttons render as identical 26×26 boxes with evenly spaced, centered carets.

Checklist:
- ✅ Open pagination plugin (grid renders "Page 1 of 6", "1 - 10 of 55")
- ✅ Left/right caret buttons present and centered/aligned
- ✅ No 1px offset left or right (left caret mirror-symmetric with right)
- ✅ Spacing symmetrical

Screenshot (`pagination-carets.png`, carets zoomed 6×, red = button box) confirms `«  ‹ … ›  »` are centered within their boxes.

## Conclusion

Both fixes behave as intended on `handsontable@18.0.0`. All automated tests pass (unit 3/3, E2E 0 failures) and all manual checklist items for scroll hooks and pagination caret alignment are satisfied. **No regressions or issues found.**

### Artifacts
- `release-678-demo.html` — manual test page (scroll hooks + pagination)
- `drive.mjs` — Puppeteer driver
- `results.json` — machine-readable measurements
- `pagination-carets.png`, `full-page.png` — screenshots
