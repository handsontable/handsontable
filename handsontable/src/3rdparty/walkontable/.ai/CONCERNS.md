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
- Files: `handsontable/src/3rdparty/walkontable/src/overlay/overlays.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/topOverlay.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/inlineStartOverlay.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/bottomOverlay.ts`
- Why fragile: The overlay system manages 6 overlay types (top, bottom, left, and 3 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. Lazy creation of corner overlays adds initialization complexity.
- Safe modification: Test with combinations of `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`. Test RTL layout. Verify no visual artifacts at overlay boundaries.
- Test coverage: Walkontable has its own test pipeline (`npm run test:walkontable`), separate from the main E2E tests.

## Test Coverage Gaps

**Walkontable DAO Layer:**
- What's not tested: The DAO objects in `_base.ts` are not unit tested. They are exercised only indirectly through higher-level integration tests.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.ts`
- Risk: Refactoring the DAO layer could break property access patterns without test detection.
- Priority: Medium (blocks the DAO refactoring effort).
