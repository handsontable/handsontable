# RELEASE-656 — Test Report

**Task:** App - Undo/Redo → Undo - Checkbox Multi-Selection Delete
**ClickUp:** https://app.clickup.com/t/86caadmxa (RELEASE-656, release list `18.0`)
**Covered by PR:** [#12153](https://github.com/handsontable/handsontable/pull/12153) — *Fix undo restore for mixed checkbox multi-selection delete* (merged into `develop`)

**Version under test:** `handsontable@18.0.0`
**Commit:** `f32bcd2` (branch `claude/release-656-testing-nqal9r`)
**Date:** 2026-07-01
**Environment:** Node v22.22.2, pnpm 10.30.2, Chrome 148 (Puppeteer, headless), theme `ht-theme-main`

---

## Scope

What to test (from the task): **Undo restore for mixed checkbox multi-select delete.**

The fix touches two code paths, both confirmed present in 18.0.0:

- `handsontable/src/core.ts` — `emptySelectedCells()` clamps the cleared range to the
  actual grid bounds (`fromRow/toRow/fromColumn/toColumn`) and bails out on an empty
  range, so header coordinates from a ctrl/cmd+A-style selection are not pushed as changes.
- `handsontable/src/renderers/checkboxRenderer/checkboxRenderer.ts` — the Delete/Backspace
  flow now funnels a mixed multi-layer selection through a single batched
  `setDataAtCell(allChanges)` call when unchecking, so checkbox cells become
  `false` (`uncheckedTemplate`) and non-checkbox cells become `null` in one undoable action.

---

## Results summary

| Layer | Suite | Result |
|---|---|---|
| Unit | `plugins/undoRedo/__tests__/actions/dataChange.unit.js` | ✅ 3 / 3 passed |
| E2E | `renderers/checkboxRenderer/__tests__/keyboardShortcuts/deleteOrBackspace.spec.js` | ✅ 21 / 21 passed |
| E2E | `plugins/undoRedo/__tests__/selection.spec.js` | ✅ 17 / 17 passed |
| System (manual, browser) | Mixed checkbox multi-selection delete + undo | ✅ PASS (all 7 checklist items) |

**Overall: PASS.** No regressions observed.

---

## 1. Automated tests

### Unit — `dataChange.unit.js`
```
UndoRedo -> DataChange action
  ✓ should restore all data after undoing clear of overlapping non-consecutive ranges
  ✓ should batch layered ctrl/cmd+A-like delete into one setDataAtCell (checkbox shortcut path)
  ✓ should not register header coordinates when clearing a ctrl/cmd+A-like selection
Test Suites: 1 passed, 1 total   Tests: 3 passed, 3 total
```

### E2E — `checkboxRenderer/.../deleteOrBackspace.spec.js`
```
21 specs, 0 failures
```
Includes the new case *"should set checkbox cells to uncheckedTemplate when deleting mixed
multi-layer selection"* (asserts data → `[[null,null,false],…]` and no `noValue` class).

### E2E — `undoRedo/selection.spec.js`
```
17 specs, 0 failures
```
Includes the three new regression cases for overlapping / non-consecutive / ctrl+A + inner
ctrl-click selections restoring full data on undo.

> Note: unit runs emit a `console.warn` about missing `ht-theme-main` stylesheets — expected
> in the jsdom unit environment (no CSS loaded) and unrelated to the tested behavior.

---

## 2. System / manual test

**Environment built:** UMD bundle (`dist/handsontable.full.js`) + `styles/`, loaded in a real
Chrome via `manual_checkbox_delete_demo.html`, driven with `manual_test_driver.mjs` (Puppeteer).

**Fixture:** 3 columns — `car` (text), `year` (numeric), `available` (checkbox); 4 rows,
2 checkboxes initially checked (Volvo, Chrysler).

**Steps and observations:**

| # | Checklist item | Action | Observed | Verdict |
|---|---|---|---|---|
| 1 | Select multiple rows with checkbox | `selectAll()` over grid incl. checkbox column | full grid selected | ✅ |
| 2 | Mix of different selection types | add inner ctrl/cmd layer `selectCells([[0,0,3,2],[1,1,1,1]])` | 2 selection layers | ✅ |
| 3 | Delete rows | press `Delete` | data → `[[null,null,false] ×4]`; checkbox cells `false`, others `null`; **1** undo action; **0** `noValue` checkboxes | ✅ |
| 4 | Press Undo (Ctrl+Z) | press `Ctrl+Z` | single undo | ✅ |
| 5 | Rows restored | — | data === original `[["Nissan",2016,false],["Volvo",2019,true],["Chrysler",2020,true],["Toyota",2021,false]]` | ✅ |
| 6 | Selection restored | — | selection === `[[0,0,3,2],[1,1,1,1]]` (both layers) | ✅ |
| 7 | Data integrity OK | deep-equal check | full match, checkboxes re-checked correctly | ✅ |

`==== OVERALL: PASS ====`

**Screenshots** (in scratchpad): `step0-initial.png`, `step3-after-delete.png`, `step4-after-undo.png`
— visually confirm: 2 checked boxes → all cleared/unchecked (no indeterminate `noValue` state,
selection preserved) → fully restored with selection highlight after undo.

---

## Conclusion

RELEASE-656 (undo restore for mixed checkbox multi-select delete) behaves correctly on
`handsontable@18.0.0`. Delete on a mixed multi-layer selection unchecks checkbox cells to
`false`, clears other cells to `null`, records exactly one undo action with no stray header
coordinates and no `noValue` artifact, and a single Ctrl+Z fully restores both data and
selection. All automated unit + E2E suites tied to the fix pass, and the manual browser
walkthrough passes every checklist item. **No issues found.**
