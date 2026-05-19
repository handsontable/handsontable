# Codebase Concerns

## Tech Debt

**Walkontable DAO Layer (Data Access Objects):**
- Issue: The Walkontable rendering engine uses a DAO (Data Access Object) pattern with deeply nested getter properties that should be replaced with proper dependency injection (IOC). Over 20 TODO comments across Walkontable files acknowledge this debt.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.js`, `handsontable/src/3rdparty/walkontable/src/core/core.js`, `handsontable/src/3rdparty/walkontable/src/table.js`
- Impact: Makes Walkontable difficult to test in isolation, creates tight coupling between components, and hinders refactoring. Every overlay, table, and viewport component reaches through DAOs rather than receiving dependencies explicitly.
- Fix approach: Introduce constructor-based dependency injection. Replace DAO getter objects with direct parameter passing. Start with `createScrollDao()` and `getTableDao()` in `_base.js`.

**Broken Plugin Initialization Abstraction (#6806):**
- Issue: Multiple plugins contain explicit workarounds for a broken plugin initialization order. Plugins must guard against uninitialized state (`!this.hot.view`) and force `updatePlugin()` calls during `enablePlugin()`.
- Files: `handsontable/src/plugins/nestedHeaders/nestedHeaders.js`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js`
- Impact: Every new plugin that depends on rendering state risks hitting the same initialization timing bug. The workarounds obscure the actual plugin lifecycle and make the code fragile.
- Fix approach: Refactor the plugin initialization sequence in `handsontable/src/plugins/base/base.js` and the core plugin registry to guarantee that `this.hot.view` is available before `enablePlugin()` is called. Remove all `#6806` workarounds once fixed.

**EventManager Shared Listener Array:**
- Issue: `EventManager` mutates an external object's `eventListeners` array, and all `EventManager` instances sharing the same context share the same listener list.
- Files: `handsontable/src/eventManager.js`
- Impact: Makes it hard to reason about listener ownership. Clearing one manager's listeners requires filtering by manager identity, which is inefficient and error-prone.
- Fix approach: Each `EventManager` instance should maintain its own listener list. Provide a central registry only for debugging/leak detection purposes.

**Redundant Render Cycle Calls:**
- Issue: Several plugins independently trigger operations that should be batched per render cycle. The TODO comments are explicit: "Should call once per render cycle, currently fired separately in different plugins."
- Files: `handsontable/src/plugins/hiddenColumns/hiddenColumns.js`, `handsontable/src/plugins/autoColumnSize/autoColumnSize.js`, `handsontable/src/plugins/autoRowSize/autoRowSize.js`
- Impact: Unnecessary re-renders degrade performance, especially with large datasets. Each redundant call triggers layout recalculations.
- Fix approach: Consolidate these operations into a single per-render-cycle hook. Use the existing `batchRender()` / `suspendRender()` / `resumeRender()` infrastructure to coalesce these calls.

**core.js Monolith:**
- Issue: `core.js` is covering initialization, data manipulation, rendering coordination, selection management, and the entire public API surface. Functions use `this` binding via closure (constructor function pattern), not class syntax.
- Files: `handsontable/src/core.js`
- Impact: Any change to core behavior requires understanding the entire file. High risk of unintended side effects. The large number of eslint-disable comments indicates code that does not conform to the project's own standards.
- Fix approach: Extract logical groups into separate modules (data operations, rendering coordination, public API facade). The existing `handsontable/src/core/` directory already contains some extractions (`hooks/`, `coordsMapper/`); continue this pattern.

**NestedRows ManualRowMove Reimplementation:**
- Issue: The `rowMoveController.js` in `nestedRows` contains three TODO comments about "mocking real work" of the `ManualRowMove` plugin and reimplementing its internal function.
- Files: `handsontable/src/plugins/nestedRows/utils/rowMoveController.js`
- Impact: Logic duplication between `NestedRows` and `ManualRowMove` plugins. Bugs fixed in one may not be fixed in the other.
- Fix approach: Extract shared row-move logic into a reusable utility or expose the necessary methods from `ManualRowMove` as a proper API.

**CustomBorders Plugin Bugs:**
- Issue: Test files contain 14+ TODO comments documenting behaviors that "look like a bug." Tests explicitly assert buggy values with comments like "I would expect false" or "I think this should be 5 * 5." One test is flagged as flaky.
- Files: `handsontable/src/plugins/customBorders/__tests__/customBorders.spec.js`, `handsontable/src/plugins/customBorders/__tests__/hidingColumns.spec.js`
- Impact: Tests encode known-wrong behavior. When these bugs are fixed, the tests will break, creating confusion about whether the fix is correct.
- Fix approach: File issues for each documented bug. Replace TODO comments with issue references. Fix bugs and update test assertions.

**DOMPurify Deprecation In Progress:**
- Issue: The built-in DOMPurify-based HTML sanitization is deprecated and scheduled for removal in the next major release. A migration path to a user-provided `sanitizer` option exists but the old path is still the default.
- Files: `handsontable/src/helpers/dom/element.js`, `handsontable/src/helpers/string.js`
- Impact: `dompurify` remains a runtime dependency (listed in `package.json` dependencies). Until removal, bundle size includes DOMPurify even when users provide a custom sanitizer.
- Fix approach: Complete the migration in the next major release. Remove `dompurify` from `dependencies`. Make `sanitizer` option required or provide a lightweight built-in default.

## Known Bugs

**CustomBorders Enable/Disable State Mismatch:**
- Symptoms: `getPlugin('customBorders').isEnabled()` returns `true` when it should be `false` (and vice versa) after certain `updateSettings()` calls.
- Files: `handsontable/src/plugins/customBorders/__tests__/customBorders.spec.js`
- Trigger: Initialize with `customBorders: true`, then call `updateSettings({ customBorders: false })`.
- Workaround: None documented.

**CustomBorders Border Count Incorrect:**
- Symptoms: `countVisibleCustomBorders()` and `countCustomBorders()` return values that do not match expected counts. For a 5x5 selection, the test expects `10 * 5` borders and notes "I think this should be 5 * 5."
- Files: `handsontable/src/plugins/customBorders/__tests__/customBorders.spec.js`
- Trigger: Apply custom borders to a cell range and count rendered border elements.
- Workaround: Redundant invisible borders are rendered in the DOM.

**Flaky CustomBorders Test:**
- Symptoms: `getCellMeta(0, 0).borders` is sometimes `undefined`, causing `Cannot read property 'hasOwnProperty' of undefined`.
- Files: `handsontable/src/plugins/customBorders/__tests__/customBorders.spec.js`
- Trigger: Race condition in test setup; timing-dependent.
- Workaround: Retry the test.

## Security Considerations

**HTML Sanitization Transition Period:**
- Risk: During the DOMPurify deprecation transition, HTML content injected via `innerHTML` is sanitized by default using DOMPurify. If a user passes `sanitizer: false` or a weak custom sanitizer, XSS is possible in cell content.
- Files: `handsontable/src/helpers/dom/element.js`, `handsontable/src/helpers/string.js`
- Current mitigation: DOMPurify is the default sanitizer. The `fastInnerHTML` function checks for HTML characters before applying innerHTML.
- Recommendations: Document clearly that `sanitizer: false` disables XSS protection. Add a console warning when sanitizer is set to a non-function falsy value. Consider keeping a lightweight built-in sanitizer after DOMPurify removal.

**innerHTML Usage in Template Literal Tag:**
- Risk: The `templateLiteralTag.js` helper uses `template.innerHTML` to parse tagged template literals. If user-supplied data flows into the template, it could introduce XSS.
- Files: `handsontable/src/helpers/templateLiteralTag.js`
- Current mitigation: The function is used internally for UI element construction, not directly with user data.
- Recommendations: Add a comment documenting that this function must not be used with unsanitized user input. Consider using `DOMParser` or `textContent` where possible.

**innerHTML in Mixed Helper:**
- Risk: `helpers/mixed.js` uses `messageNode.innerHTML` to render domain-specific messages.
- Files: `handsontable/src/helpers/mixed.js`
- Current mitigation: The messages are internally generated string templates, not user input.
- Recommendations: Switch to `textContent` or DOM API construction to eliminate the innerHTML call entirely.

## Performance Bottlenecks

**Spread Operator with Potentially Large Arrays:**
- Problem: At least 28 instances of `array.push(...otherArray)` exist in production source code. With arrays of 10k+ elements, this causes stack overflow due to argument count limits.
- Files: `handsontable/src/dataMap/metaManager/metaLayers/cellMeta.js`, `handsontable/src/plugins/nestedRows/nestedRows.js`, `handsontable/src/plugins/nestedRows/ui/collapsing.js`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js`, `handsontable/src/plugins/hiddenRows/contextMenuItem/showRow.js`, `handsontable/src/plugins/hiddenColumns/contextMenuItem/showColumn.js`, `handsontable/src/core.js`
- Cause: `Function.prototype.apply` (which spread desugars to) has a maximum argument count (~65k in V8, lower in other engines).
- Improvement path: Replace `arr.push(...largeArr)` with `for` or `forEach` loops in all code paths that may handle large datasets. Priority: `cellMeta.js` handles per-cell metadata and scales with table size.

**Walkontable Filter Object Recreation:**
- Problem: `rowFilter` and `columnFilter` are set to `null` and recreated on every render pass instead of updating state in place. Two TODO comments acknowledge this.
- Files: `handsontable/src/3rdparty/walkontable/src/table.js`
- Cause: The filter objects are recreated rather than having their state updated incrementally.
- Improvement path: Refactor filter objects to support state updates without full reconstruction.

**Limited requestAnimationFrame Batching:**
- Problem: `requestAnimationFrame` is used in only 7 source files, primarily in `autoRowSize`, `autoColumnSize`, and the overlay system. Scroll events and resize operations in other areas may not be batched.
- Files: `handsontable/src/helpers/feature.js`, `handsontable/src/utils/interval.js`, `handsontable/src/3rdparty/walkontable/src/overlays.js`, `handsontable/src/plugins/autoRowSize/autoRowSize.js`, `handsontable/src/plugins/autoColumnSize/autoColumnSize.js`
- Cause: Not all rendering-triggering events are routed through a rAF-based scheduler.
- Improvement path: Introduce a central render scheduler that batches all render-triggering events through `requestAnimationFrame`.

## Fragile Areas

**Selection + MergeCells Interaction:**
- Files: `handsontable/src/selection/highlight/visualSelection.js`, `handsontable/src/selection/selection.js`, `handsontable/src/plugins/mergeCells/mergeCells.js`
- Why fragile: Visual selection coordinate adjustments interact with MergeCells coordinate adjustments in overlapping ways. TODO comments indicate uncertainty about the correct responsibility boundary. The `selection.clear()` method has a TODO noting that `selectedByColumnHeader` and `selectedByRowHeader` collections should be cleared but are not.
- Safe modification: When modifying selection logic, test all combinations of: merged cells, hidden rows/columns, frozen rows/columns, and navigable headers. Run both `selectAll` and `selectCells` spec suites.
- Test coverage: Extensive E2E tests exist but the visual selection highlight logic is under-tested at the unit level.

**NestedHeaders + CollapsibleColumns:**
- Files: `handsontable/src/plugins/nestedHeaders/nestedHeaders.js`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.js`
- Why fragile: Both plugins contain workarounds for the broken plugin initialization abstraction (#6806). `NestedHeaders` has 4 workaround sites, `CollapsibleColumns` has 3. These workarounds involve conditional state checks and forced `updatePlugin()` calls that mask timing issues.
- Safe modification: Always test with both plugins enabled simultaneously. Verify expand/collapse behavior with hidden columns. Run the full `collapsibleColumns.spec.js` and `hidingColumns.spec.js` in nested headers.
- Test coverage: Good E2E coverage exists but the workarounds themselves are not directly tested.

**Overlay System (Walkontable):**
- Files: `handsontable/src/3rdparty/walkontable/src/overlays.js`, `handsontable/src/3rdparty/walkontable/src/overlay/top.js`, `handsontable/src/3rdparty/walkontable/src/overlay/inlineStart.js`, `handsontable/src/3rdparty/walkontable/src/overlay/bottom.js`
- Why fragile: The overlay system manages 6 overlay types (top, bottom, left, and 3 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. Lazy creation of corner overlays adds initialization complexity.
- Safe modification: Test with combinations of `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`. Test RTL layout. Verify no visual artifacts at overlay boundaries.
- Test coverage: Walkontable has its own test pipeline (`npm run test:walkontable`), separate from the main E2E tests.

## Scaling Limits

**Cell Metadata Storage:**
- Current capacity: Linear growth with row * column count.
- Limit: The `cellMeta.js` layer uses `push(...values())` to collect metadata, which risks stack overflow at large scales (50k+ rows with many columns).
- Scaling path: Replace spread-based collection with iterative approach. Consider lazy metadata initialization.

## Dependencies at Risk

**moment.js (pinned at 2.30.1):**
- Risk: moment.js is in maintenance mode (no new features). The library is 67KB minified and has known issues with tree-shaking. It is used in 22 source files across date editors, validators, renderers, and filter conditions.
- Impact: Bundle size penalty. The deprecation of `dateFormat` string options (using moment format patterns) is already underway.
- Migration plan: The codebase is migrating date handling away from moment-based string formats. Complete the migration by removing all moment.js imports and replacing with a user-configurable date formatting approach or a lightweight alternative.

**numbro (pinned at 2.5.0):**
- Risk: numbro is used in 5 files for numeric formatting. The `numericFormat.pattern` and `numericFormat.culture` options using numbro are deprecated.
- Impact: Bundle size; numbro adds significant weight for locale-aware number formatting.
- Migration plan: The deprecation of numbro-based formatting is documented in `handsontable/src/dataMap/metaManager/metaSchema.js` (line 4098). Complete migration to native `Intl.NumberFormat`.

**TypeScript 3.8.2:**
- Risk: TypeScript 3.8 is severely outdated (released March 2020). The `.d.ts` type definitions in `handsontable/types/` are limited to TS 3.8 features.
- Impact: Cannot use modern TypeScript features in type definitions (template literal types, conditional types improvements, etc.). Users with newer TS versions may encounter compatibility issues.
- Migration plan: Upgrade the TypeScript dev dependency and modernize type definitions incrementally. Test against multiple TS versions.

**@typescript-eslint/parser and plugin (^4.33.0):**
- Risk: Version 4.x is several major versions behind current (8.x). Compatibility with newer ESLint versions is limited.
- Impact: Cannot adopt new linting rules and may miss detection of new TypeScript anti-patterns.
- Migration plan: Upgrade alongside ESLint (currently ^7.25.0, also outdated).

**ESLint ^7.25.0:**
- Risk: ESLint 7 is end-of-life. Current stable is ESLint 9. The flat config format is not adopted.
- Impact: Missing newer rule categories. Community plugin ecosystem is moving to ESLint 8/9.
- Migration plan: Migrate to ESLint 9 flat config. Update `@typescript-eslint` packages simultaneously.

**Jest ^27.5.1 and jasmine-core ^3.4.0:**
- Risk: Jest 27 is two major versions behind current (30). Jasmine 3.4 is significantly behind current (5.x).
- Impact: Missing performance improvements, better error messages, and modern testing features (e.g., better async handling in Jest 29+).
- Migration plan: Upgrade Jest to 29+ (requires updating `babel-jest` and potentially test configuration). Evaluate Jasmine upgrade separately due to API changes.

**@handsontable/pikaday (^1.0.0):**
- Risk: A forked date picker library maintained by Handsontable. The `dateEditor` is being deprecated (string-based `dateFormat` with Pikaday). Only 6 source files reference it.
- Impact: Maintenance burden for a forked dependency.
- Migration plan: Complete the date editor modernization. Remove Pikaday dependency when the legacy date editor path is removed.

## Missing Critical Features

**No Centralized Render Scheduler:**
- Problem: Rendering is triggered from multiple points (plugins, core, selection) without a central coordinator. The `batchRender()`/`suspendRender()`/`resumeRender()` API exists but is opt-in and used in only 4 source files.
- Blocks: Predictable rendering performance. Plugins must individually manage render batching.

**No Plugin Integration Testing Framework:**
- Problem: Plugin interactions (e.g., `MergeCells` + `HiddenColumns` + `NestedHeaders`) are tested via E2E specs but lack a structured integration test approach. Each combination must be manually tested.
- Blocks: Confident refactoring of plugin initialization. The broken initialization abstraction (#6806) persists partly because testing all combinations is expensive.

## Test Coverage Gaps

**TouchScroll Plugin:**
- What's not tested: The `touchScroll` plugin has 2 source files and 0 test files. Touch-specific scrolling behavior is entirely untested.
- Files: `handsontable/src/plugins/touchScroll/`
- Risk: Touch scrolling regressions on mobile browsers go undetected.
- Priority: Medium (mobile usage is increasing).

**Walkontable DAO Layer:**
- What's not tested: The DAO objects in `_base.js` are not unit tested. They are exercised only indirectly through higher-level integration tests.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.js`
- Risk: Refactoring the DAO layer could break property access patterns without test detection.
- Priority: Medium (blocks the DAO refactoring effort).

**Visual Selection Highlight Internals:**
- What's not tested: The coordinate adjustment logic in `visualSelection.js` with MergeCells interaction has TODO comments but no dedicated unit tests.
- Files: `handsontable/src/selection/highlight/visualSelection.js`
- Risk: Selection highlight bugs with merged cells in hidden row/column scenarios.
- Priority: High (user-visible behavior).

**Event Manager Scope Filtering:**
- What's not tested: The scope-based event filtering logic lacks unit tests for the multi-instance same-context scenario.
- Files: `handsontable/src/eventManager.js`
- Risk: Memory leaks when multiple EventManager instances share a context and are destroyed in unexpected order.
- Priority: Medium.
