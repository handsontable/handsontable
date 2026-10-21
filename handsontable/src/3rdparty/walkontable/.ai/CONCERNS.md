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
- Why fragile: The overlay system manages 8 overlay types (top, bottom, inline-start, inline-end, and 4 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. The corners and the three end clones are all built eagerly and only hidden while they have nothing to draw, so an idle clone still takes part in the initialization and in the layout signature.
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

**Directional overscan invariants (`viewport/calculatorFactory.ts`):**
- The scroll-direction band overscan (the `viewport*RenderingOffset: 'auto'` mode; see RENDERING-LIFECYCLE §4) has four invariants that specs pin — breaking any of them reintroduces a subtle scroll bug:
  - **Overscan appliers run BEFORE the band stabilizers.** Reversed order double-pads the band on a scroll-direction flip (the stabilizer locks in the old overscan, then the applier adds a new one).
  - **A zero-delta draw must never INVENT an overscan side.** When the other axis scrolled, the recomputed band keeps an existing overscan side only if a recorded side offset is **greater than 1** — the `'auto'` override adds at most 1 per side and clamps to 0 at dataset edges, so offset asymmetry alone proves nothing. Getting this wrong silently overscans the row axis on horizontal scrolls (or vice versa) and inflates every draw.
  - **Start-side growth must recompute `startPosition`** from the axis prefix-sum cache (`rowHeightCache` / `columnWidthCache` `.getOffset()`), or the band renders at the wrong pixel (a pixel-parity spec against `draw(false)` pins this).
  - **The band's side offsets must stay truthful** (grow with the applied overscan) — the `viewport*RenderingThreshold` containment padding caps against them.
- The caps (`COLUMN_BAND_OVERSCAN_MAX = 8`, `ROW_BAND_OVERSCAN_MAX = 4`) are perceptual tuning, not correctness: they keep every band-crossing stall in the mild 40–50 ms class instead of rarer ~60 ms catches. When retuning, sync the numbers in the `viewport{Row,Column}RenderingOffset` JSDoc (`src/dataMap/metaManager/metaSchema.ts`).
- Specs: `test/spec/scroll/stationary{Columns,Rows}BandOverscan.spec.js` and `test/unit/viewport/calculatorFactory.unit.js`. Spec-writing traps: pixel-parity comparisons must use CONTENT space (a `draw(false)` may move the holder's scroll position) and a target row fully inside the viewport; walkontable RTL specs need `rtlMode: true` in the walkontable settings (a `dir="rtl"` attribute alone is not read by the engine).

**Shift + wheel on a touchpad (`resolveWheelDeltas` keeps its exact-zero test):**
- Setup: a demo that logs every `wheel` event over a grid and the axis the grid scrolled, https://demos.handsontable.com/d/2a482xa5ec (Handsontable 18.1.2, so it predates the Shift swap). Edge/Chrome 154, Windows 11, devicePixelRatio 1.5, one precision touchpad of unknown model. `1/2` below means `deltaX`/`deltaY`.
- Straight vertical swipes with Shift held: 4 swipes, 328 events, `deltaX` 0 on every event. One swipe had Shift pressed mid-inertia, and `deltaX` stayed 0 on the events after the press. Horizontal swipe with Shift: about 92 events, `deltaY` 0 on every event.
- Diagonal swipe with Shift held: one capture, 184 events in three bursts. 167 events have `deltaX` ≠ 0 and it scales with `deltaY` (typical pairs 1/1, 1/2, 2/1, 4/5, the largest 27/32), so it is real diagonal movement, not jitter. 14 events have `deltaX` 0 with `deltaY` ≠ 0, and 3 more are 0/0 end events.
- Why not `|deltaX| < |deltaY|`: on that diagonal swipe it is true for 52 of 184 events (28%) and false for 132. Strict `<` never swaps an equal pair such as 2/2 either, so neighboring events of one swipe would go to different axes within milliseconds.
- Warts of the exact-zero test, both from per-event decisions: the 14 `deltaX` 0 events inside a diagonal swipe move to the columns, and when Shift is pressed during inertia, every event after the press has `deltaX` 0, so the rest of the fling scrolls the columns. Whether the browser does the same natively was not measured.
- Not measured: what Edge does natively with Shift and a touchpad swipe with the grid out of the way (the recorded `deltaX` is 0 either way, so the log cannot tell, and this is the question that decides whether the swap changes native behavior on Windows the way it would on macOS), Firefox, a Linux touchpad, a second Windows touchpad, other diagonal directions. To measure, open the demo in the browser and press Clear, perform the gesture, then Copy JSON.

## Test Coverage Gaps

**Single-pass layout solver (`viewport/boxLayout/`):**
- What's covered: `resolveLayout()` has a dedicated Jest fix-point suite (scrollbar states × forced/hidden overflow × window mode × RTL).
- What's thin: the wiring that feeds it (`gatherLayoutInput.ts`) and its interaction with the `singlePassLayout` escape hatch (off for `mergeCells`, and window-mode fallback to DOM measurement) are exercised only through the integration suites.
- Files: `handsontable/src/3rdparty/walkontable/src/viewport/boxLayout/`.
- Priority: Medium.

**Per-axis prediction (`viewport/boxLayout/` + `overlay/axisOwner.ts`):**
- What's covered: the split-owner layout (an element owning one axis, the window the other – a definite `width` with no `height`) is a measured mode; `viewport.spec.js`, `master.spec.js`, `overlay.spec.js`, and `tests/e2e/width-window-scroll.spec.ts` pin its geometry.
- What's thin: the layout snapshot still carries one `scrollMode` for both axes (`gatherLayoutInput.ts`), so the single-pass solver never runs for a split layout and every draw there measures the DOM. A per-axis `scrollMode` would let the prediction cover it; nothing asserts the cost today.
- Files: `handsontable/src/3rdparty/walkontable/src/viewport/boxLayout/gatherLayoutInput.ts`, `resolveLayout.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/axisOwner.ts`.
- Priority: Low.
