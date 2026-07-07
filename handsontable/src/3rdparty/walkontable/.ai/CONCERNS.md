# Walkontable Rendering Engine — Concerns

This is the engine-specific subset of the core concerns doc (`handsontable/.ai/CONCERNS.md`). Items are grouped under their original categories from that doc, copied verbatim.

## Performance Bottlenecks

**Walkontable Filter Object Recreation:**
- Problem: `rowFilter` and `columnFilter` are recreated on every full draw instead of updating state in place.
- Files: `handsontable/src/3rdparty/walkontable/src/table/drawCycle.ts` (filter creation moved here with the draw-cycle extraction)
- Cause: The filter objects are recreated rather than having their state updated incrementally.
- Improvement path: Refactor filter objects to support state updates without full reconstruction.

## Fragile Areas

**Overlay System (Walkontable):**
- Files: `handsontable/src/3rdparty/walkontable/src/overlay/overlays.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/regions/topOverlay.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/regions/inlineStartOverlay.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/regions/bottomOverlay.ts`
- Why fragile: The overlay system manages 6 overlay types (top, bottom, left, and 3 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. Lazy creation of corner overlays adds initialization complexity.
- Safe modification: Test with combinations of `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`. Test RTL layout. Verify no visual artifacts at overlay boundaries.
- Test coverage: Walkontable has its own test pipeline (`npm run test:walkontable`), separate from the main E2E tests.

## Gotchas

**The internal size calculator is 1px short — compensate for it, but NOT for the external one:**
- The engine's own (internal) row/column size calculators are off by **1px** (border rounding under the classic content-box theme). Any sizing derived from them must add a `+1` compensation, or the last row/column and the hider come out 1px short and a scrollbar flickers on/off at the exact-fit boundary.
- **But the external calculator must NOT get that `+1`.** When `AutoRowSize` / `AutoColumnSize` are enabled they measure exact content sizes off-screen via their own ghost table and already account for the border. Adding the internal `+1` on top would **double-compensate** and misalign the overlays/hider.
- The switch is the `externalRowCalculator` WoT setting (`true` when `AutoRowSize` is enabled — set in `tableView.ts`). Code paths that apply the compensation gate on it:
  - `overlay/spreaderSize.ts` `adjustElementsSize()` — `hiderHeightComp = wtSettings.getSetting('externalRowCalculator') ? 0 : 1` folded into the proposed hider height.
  - `axisSizing/oversizedRows.ts` `markOversizedRows()` — the whole method early-returns when `externalRowCalculator` is `true`; on the internal path it applies the content-box border compensation (`borderCompensation` / `firstRowBorderCompensation` / the `+1` on non-border-box). See also the shared `axisSizing/boxModel.ts` helper.
- **When adding any new sizing/compensation logic, keep this split:** compensate on the internal path, skip it when the external calculator (AutoRowSize/AutoColumnSize) owns the sizes.

## Test Coverage Gaps

**Single-pass layout solver (`viewport/boxLayout/`):**
- What's covered: `resolveLayout()` has a dedicated Jest fix-point suite (scrollbar states × forced/hidden overflow × window mode × RTL).
- What's thin: the wiring that feeds it (`gatherLayoutInput.ts`) and its interaction with the `singlePassLayout` escape hatch (off for `mergeCells`, and window-mode fallback to DOM measurement) are exercised only through the integration suites.
- Files: `handsontable/src/3rdparty/walkontable/src/viewport/boxLayout/`.
- Priority: Medium.
