# Codebase Concerns

## Tech Debt

**Walkontable DAO Layer (Data Access Objects):**
- Issue: The Walkontable rendering engine uses a DAO (Data Access Object) pattern with deeply nested getter properties that should be replaced with proper dependency injection (IOC). Over 20 TODO comments across Walkontable files acknowledge this debt.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.ts`, `handsontable/src/3rdparty/walkontable/src/core/core.ts`, `handsontable/src/3rdparty/walkontable/src/table.ts`
- Impact: Makes Walkontable difficult to test in isolation, creates tight coupling between components, and hinders refactoring. Every overlay, table, and viewport component reaches through DAOs rather than receiving dependencies explicitly.
- Fix approach: Introduce constructor-based dependency injection. Replace DAO getter objects with direct parameter passing. Start with `createScrollDao()` and `getTableDao()` in `_base.ts`.

**Broken Plugin Initialization Abstraction (#6806):**
- Issue: Multiple plugins contain explicit workarounds for a broken plugin initialization order. Plugins must guard against uninitialized state (`!this.hot.view`) and force `updatePlugin()` calls during `enablePlugin()`.
- Files: `handsontable/src/plugins/nestedHeaders/nestedHeaders.ts`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.ts`
- Impact: Every new plugin that depends on rendering state risks hitting the same initialization timing bug. The workarounds obscure the actual plugin lifecycle and make the code fragile.
- Fix approach: Refactor the plugin initialization sequence in `handsontable/src/plugins/base/base.ts` and the core plugin registry to guarantee that `this.hot.view` is available before `enablePlugin()` is called. Remove all `#6806` workarounds once fixed.

**EventManager Shared Listener Array:**
- Issue: `EventManager` mutates an external object's `eventListeners` array, and all `EventManager` instances sharing the same context share the same listener list.
- Files: `handsontable/src/eventManager.ts`
- Impact: Makes it hard to reason about listener ownership. Clearing one manager's listeners requires filtering by manager identity, which is inefficient and error-prone.
- Fix approach: Each `EventManager` instance should maintain its own listener list. Provide a central registry only for debugging/leak detection purposes.

**Redundant Render Cycle Calls:**
- Issue: Several plugins independently trigger operations that should be batched per render cycle. The TODO comments are explicit: "Should call once per render cycle, currently fired separately in different plugins."
- Files: `handsontable/src/plugins/hiddenColumns/hiddenColumns.ts`, `handsontable/src/plugins/autoColumnSize/autoColumnSize.ts`, `handsontable/src/plugins/autoRowSize/autoRowSize.ts`
- Impact: Unnecessary re-renders degrade performance, especially with large datasets. Each redundant call triggers layout recalculations.
- Fix approach: Consolidate these operations into a single per-render-cycle hook. Use the existing `batchRender()` / `suspendRender()` / `resumeRender()` infrastructure to coalesce these calls.

**core.ts Monolith:**
- Issue: `core.ts` is covering initialization, data manipulation, rendering coordination, selection management, and the entire public API surface. Functions use `this` binding via closure (constructor function pattern), not class syntax.
- Files: `handsontable/src/core.ts`
- Impact: Any change to core behavior requires understanding the entire file. High risk of unintended side effects. The large number of eslint-disable comments indicates code that does not conform to the project's own standards.
- Fix approach: Extract logical groups into separate modules (data operations, rendering coordination, public API facade). The existing `handsontable/src/core/` directory already contains some extractions (`hooks/`, `coordsMapper/`); continue this pattern.

**NestedRows ManualRowMove Reimplementation:**
- Issue: The `rowMoveController.ts` in `nestedRows` contains three TODO comments about "mocking real work" of the `ManualRowMove` plugin and reimplementing its internal function.
- Files: `handsontable/src/plugins/nestedRows/utils/rowMoveController.ts`
- Impact: Logic duplication between `NestedRows` and `ManualRowMove` plugins. Bugs fixed in one may not be fixed in the other.
- Fix approach: Extract shared row-move logic into a reusable utility or expose the necessary methods from `ManualRowMove` as a proper API.

**CustomBorders Plugin Bugs:**
- Issue: Test files contain 14+ TODO comments documenting behaviors that "look like a bug." Tests explicitly assert buggy values with comments like "I would expect false" or "I think this should be 5 * 5." One test is flagged as flaky.
- Files: `handsontable/src/plugins/customBorders/__tests__/customBorders.spec.js`, `handsontable/src/plugins/customBorders/__tests__/hidingColumns.spec.js`
- Impact: Tests encode known-wrong behavior. When these bugs are fixed, the tests will break, creating confusion about whether the fix is correct.
- Fix approach: File issues for each documented bug. Replace TODO comments with issue references. Fix bugs and update test assertions.

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

**No Built-in HTML Sanitizer (Post-DOMPurify Removal):**
- Risk: DOMPurify was removed in v18.0. HTML content injected via `innerHTML` is no longer sanitized by default. If a user does not provide a `sanitizer` option, HTML cell content is rendered unsanitized and XSS is possible. This is the documented v18.0 contract, not a defect; see the `sanitizer` JSDoc and the security guide.
- Files: `handsontable/src/utils/sanitizer.ts` (the resolver every sink goes through), `handsontable/src/helpers/dom/element.ts` (`fastInnerHTML`)
- Current mitigation: every sink resolves the option through `getSanitizer()`/`sanitizeHTML()` in `utils/sanitizer.ts` and binds the missing-sanitizer warning to `hot.rootElement`, so a grid warns once no matter how many surfaces write raw HTML. Covered surfaces and their context strings: `'header'` (including nested headers and the ghost table that measures them), `'password'`, `'contextMenu'`, `'selectEditor'`, `'dialog'`, `'notification'`, `'CopyPaste.paste'`.
- Deliberate exclusions: the `html` cell type (`renderers/htmlRenderer`) and `allowHtml` autocomplete/dropdown sources both pass `false`, meaning raw and silent. PR #7368 (2020) disabled sanitizing for them on purpose, and it held through the DOMPurify era, so a configured sanitizer has never reached them. Whether it should is an open product question. Do not "fix" it as a bug: it is a behavior change under `.ai/BREAKING-CHANGES.md`.
- Recommendations: keep new HTML sinks going through `utils/sanitizer.ts` rather than reading `getSettings().sanitizer` inline, and give each one its own context string so the warning names it.
- Not a sanitizer surface: a consumer **outside** the DOM — a file, the clipboard, later a printer or an assistive label — goes through `utils/textExtractor.ts` (`extractText(hot, value, 'Plugin.surface')`) and the grid-level `textExtractor` option instead. Routing one through `sanitizer` looks right and is wrong: a sanitizer returns HTML *source*, so plain headers come back entity-encoded (`R&D` → `R&amp;D`), and an allowlist sanitizer returns `<b>Bold</b>` unchanged. The built-in extraction still calls the configured sanitizer first, under the DOM surface the content belongs to, because a sanitizer may delete text rather than unwrap it. Measured on issue #4088; the full rationale is in the `handsontable/AGENTS.md` bullet.

**Clipboard Paste Parses Into an Inert Document:**
- Risk: `htmlToGridSettings()` used to write pasted markup into a detached `<div>` of the live document. Detached is not inert: the owning document has a browsing context, so `<img src=x onerror>` in a paste payload loaded and executed.
- Files: `handsontable/src/utils/parseTable.ts`, `handsontable/src/plugins/copyPaste/copyPaste.ts`
- Current mitigation: the string path parses with `DOMParser.parseFromString()`, which has no browsing context, so nothing loads or runs while the markup is read. Both clipboard branches (`text/html` and the private `application/ht-source-data-json-html`) are sanitized under `'CopyPaste.paste'`.
- Recommendations: never `importNode` the parsed nodes back into the live document, which would make them live again. Keep every downstream read on that document read-only.
- Closed in the same class: `Core#toTableElement()` used to write `instanceToHTML()` output into a live-document element with `insertAdjacentHTML`, so a `colHeaders` entry containing markup executed there. It now builds the table through `instanceToTableElement()` (`utils/parseTable.ts`), which constructs nodes and writes header text through `textContent`, so nothing is parsed and the header carries no execution path. `instanceToHTML()` still exists for `toHTML()`, which returns a string rather than a node and now sanitizes headers.

**innerHTML in internal UI construction:**
- Risk: the `html` tagged template parsed its result with `template.innerHTML`, and `helpers/mixed.ts` wrote license messages through `messageNode.innerHTML`.
- Files: `handsontable/src/helpers/templateLiteralTag.ts`, `handsontable/src/helpers/mixed.ts`
- Current mitigation: both are gone. Internal UI is built as a `TemplateSpec` through `buildTemplate()` (`helpers/dom/template.ts`), and the license messages are rendered from a part list with `createTextNode` / `createElement` / `textContent`. The `html` tag was deleted; only `toSingleLine` remains in `templateLiteralTag.ts`.
- Recommendations: never reintroduce an HTML string for library-authored UI. Every parse entry point is also a Trusted Types sink, so a string there breaks any page enforcing `require-trusted-types-for 'script'`, not only the XSS case.

**The `<template>` parse in the built-in text extractor:**
- Risk: `extractDisplayText()` assigns to `template.innerHTML` to read the text a header renders as.
- Files: `handsontable/src/utils/textExtractor.ts`
- Current mitigation: the content is the user's own header, gated on the same `HTML_CHARACTERS` predicate `fastInnerHTML` uses, and the configured `sanitizer` runs before the parse. The parse happens in a `<template>`, whose content belongs to an inert document, so nothing loads or runs. It is reachable only when the user sets `textExtractor: true`; an extractor function of their own never reaches it. A `TrustedHTML` from the sanitizer passes to the sink unmodified.
- Recommendations: do not swap it for `stripTags()`. That scans characters instead of parsing, so it drops everything from a `<` onwards and would silently mangle a header such as `'Loaded 5 < 10 rows'` on the export path.

## Performance Bottlenecks

**Spread Operator with Potentially Large Arrays:**
- Problem: At least 28 instances of `array.push(...otherArray)` exist in production source code. With arrays of 10k+ elements, this causes stack overflow due to argument count limits.
- Files: `handsontable/src/dataMap/metaManager/metaLayers/cellMeta.ts`, `handsontable/src/plugins/nestedRows/nestedRows.ts`, `handsontable/src/plugins/nestedRows/ui/collapsing.ts`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.ts`, `handsontable/src/plugins/hiddenRows/contextMenuItem/showRow.ts`, `handsontable/src/plugins/hiddenColumns/contextMenuItem/showColumn.ts`, `handsontable/src/core.ts`
- Cause: `Function.prototype.apply` (which spread desugars to) has a maximum argument count (~65k in V8, lower in other engines).
- Improvement path: Replace `arr.push(...largeArr)` with `for` or `forEach` loops in all code paths that may handle large datasets. Priority: `cellMeta.ts` handles per-cell metadata and scales with table size.

**Walkontable Filter Object Recreation:**
- Problem: `rowFilter` and `columnFilter` are set to `null` and recreated on every render pass instead of updating state in place. Two TODO comments acknowledge this.
- Files: `handsontable/src/3rdparty/walkontable/src/table.ts`
- Cause: The filter objects are recreated rather than having their state updated incrementally.
- Improvement path: Refactor filter objects to support state updates without full reconstruction.

**Limited requestAnimationFrame Batching:**
- Problem: `requestAnimationFrame` is used in only 7 source files, primarily in `autoRowSize`, `autoColumnSize`, and the overlay system. Scroll events and resize operations in other areas may not be batched.
- Files: `handsontable/src/helpers/feature.ts`, `handsontable/src/utils/interval.ts`, `handsontable/src/3rdparty/walkontable/src/overlays.ts`, `handsontable/src/plugins/autoRowSize/autoRowSize.ts`, `handsontable/src/plugins/autoColumnSize/autoColumnSize.ts`
- Cause: Not all rendering-triggering events are routed through a rAF-based scheduler.
- Improvement path: Introduce a central render scheduler that batches all render-triggering events through `requestAnimationFrame`.

## Fragile Areas

**Selection + MergeCells Interaction:**
- Files: `handsontable/src/selection/highlight/visualSelection.ts`, `handsontable/src/selection/selection.ts`, `handsontable/src/plugins/mergeCells/mergeCells.ts`
- Why fragile: Visual selection coordinate adjustments interact with MergeCells coordinate adjustments in overlapping ways. TODO comments indicate uncertainty about the correct responsibility boundary. The `selection.clear()` method has a TODO noting that `selectedByColumnHeader` and `selectedByRowHeader` collections should be cleared but are not.
- Safe modification: When modifying selection logic, test all combinations of: merged cells, hidden rows/columns, frozen rows/columns, and navigable headers. Run both `selectAll` and `selectCells` spec suites.
- Test coverage: Extensive E2E tests exist but the visual selection highlight logic is under-tested at the unit level.

**NestedHeaders + CollapsibleColumns:**
- Files: `handsontable/src/plugins/nestedHeaders/nestedHeaders.ts`, `handsontable/src/plugins/collapsibleColumns/collapsibleColumns.ts`
- Why fragile: Both plugins contain workarounds for the broken plugin initialization abstraction (#6806). `NestedHeaders` has 4 workaround sites, `CollapsibleColumns` has 3. These workarounds involve conditional state checks and forced `updatePlugin()` calls that mask timing issues.
- Safe modification: Always test with both plugins enabled simultaneously. Verify expand/collapse behavior with hidden columns. Run the full `collapsibleColumns.spec.js` and `hidingColumns.spec.js` in nested headers.
- Test coverage: Good E2E coverage exists but the workarounds themselves are not directly tested.

**Overlay System (Walkontable):**
- Files: `handsontable/src/3rdparty/walkontable/src/overlays.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/top.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/inlineStart.ts`, `handsontable/src/3rdparty/walkontable/src/overlay/bottom.ts`
- Why fragile: The overlay system manages 6 overlay types (top, bottom, left, and 3 corners) with complex positioning logic. TODO comments indicate a workaround for `innerBorderTop` that is documented to be clearable only after SVG borders are merged. Lazy creation of corner overlays adds initialization complexity.
- Safe modification: Test with combinations of `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`. Test RTL layout. Verify no visual artifacts at overlay boundaries.
- Test coverage: Walkontable has its own test pipeline (`npm run test:walkontable`), separate from the main E2E tests.

## Scaling Limits

**Cell Metadata Storage:**
- Current capacity: Linear growth with row * column count.
- Limit: The `cellMeta.ts` layer uses `push(...values())` to collect metadata, which risks stack overflow at large scales (50k+ rows with many columns).
- Scaling path: Replace spread-based collection with iterative approach. Consider lazy metadata initialization.

## Dependencies at Risk

**Jest ^27.5.1 and jasmine-core ^3.4.0:**
- Risk: Jest 27 is two major versions behind current (30). Jasmine 3.4 is significantly behind current (5.x).
- Impact: Missing performance improvements, better error messages, and modern testing features (e.g., better async handling in Jest 29+).
- Migration plan: Upgrade Jest to 29+ (requires updating `babel-jest` and potentially test configuration). Evaluate Jasmine upgrade separately due to API changes.

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
- What's not tested: The DAO objects in `_base.ts` are not unit tested. They are exercised only indirectly through higher-level integration tests.
- Files: `handsontable/src/3rdparty/walkontable/src/core/_base.ts`
- Risk: Refactoring the DAO layer could break property access patterns without test detection.
- Priority: Medium (blocks the DAO refactoring effort).

**Visual Selection Highlight Internals:**
- What's not tested: The coordinate adjustment logic in `visualSelection.ts` with MergeCells interaction has TODO comments but no dedicated unit tests.
- Files: `handsontable/src/selection/highlight/visualSelection.ts`
- Risk: Selection highlight bugs with merged cells in hidden row/column scenarios.
- Priority: High (user-visible behavior).

**Event Manager Scope Filtering:**
- What's not tested: The scope-based event filtering logic lacks unit tests for the multi-instance same-context scenario.
- Files: `handsontable/src/eventManager.ts`
- Risk: Memory leaks when multiple EventManager instances share a context and are destroyed in unexpected order.
- Priority: Medium.
