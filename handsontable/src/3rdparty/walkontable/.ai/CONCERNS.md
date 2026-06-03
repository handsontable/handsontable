# Walkontable Rendering Engine — Concerns

This is the engine-specific subset of the core concerns doc (`handsontable/.ai/CONCERNS.md`). Items are grouped under their original categories from that doc, copied verbatim.

## Tech Debt

**Walkontable DAO Layer (Data Access Objects):**
- Issue: The Walkontable rendering engine uses a DAO (Data Access Object) pattern with deeply nested getter properties that should be replaced with proper dependency injection (IOC). Over 20 TODO comments across Walkontable files acknowledge this debt.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.ts`, `handsontable/src/3rdparty/walkontable/src/core/core.ts`, `handsontable/src/3rdparty/walkontable/src/table.ts`
- Impact: Makes Walkontable difficult to test in isolation, creates tight coupling between components, and hinders refactoring. Every overlay, table, and viewport component reaches through DAOs rather than receiving dependencies explicitly.
- Fix approach: Introduce constructor-based dependency injection. Replace DAO getter objects with direct parameter passing. Start with `createScrollDao()` and `getTableDao()` in `_base.ts`.

## Performance Bottlenecks

**Walkontable Filter Object Recreation:**
- Problem: `rowFilter` and `columnFilter` are set to `null` and recreated on every render pass instead of updating state in place. Two TODO comments acknowledge this.
- Files: `handsontable/src/3rdparty/walkontable/src/table.ts`
- Cause: The filter objects are recreated rather than having their state updated incrementally.
- Improvement path: Refactor filter objects to support state updates without full reconstruction.

## Fragile Areas

**Overlay System (Walkontable):**
- Files: `handsontable/src/3rdparty/walkontable/src/overlays.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/top.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/inlineStart.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/bottom.ts`
- Why fragile: The overlay system manages 6 overlay types (top, bottom, left, and 3 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. Lazy creation of corner overlays adds initialization complexity.
- Safe modification: Test with combinations of `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`. Test RTL layout. Verify no visual artifacts at overlay boundaries.
- Test coverage: Walkontable has its own test pipeline (`npm run test:walkontable`), separate from the main E2E tests.

## Test Coverage Gaps

**Walkontable DAO Layer:**
- What's not tested: The DAO objects in `_base.ts` are not unit tested. They are exercised only indirectly through higher-level integration tests.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.ts`
- Risk: Refactoring the DAO layer could break property access patterns without test detection.
- Priority: Medium (blocks the DAO refactoring effort).
