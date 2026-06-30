---
type: reference
title: Changelog 18.0
metaTitle: Changelog 18.0 - JavaScript Data Grid | Handsontable
description: See the full history of changes made to Handsontable 18.0 in each minor and patch release.
permalink: /changelog-18
canonicalUrl: /changelog-18
react:
  metaTitle: Changelog 18.0 - React Data Grid | Handsontable
angular:
  metaTitle: Changelog 18.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Changelog 18.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

These are the release notes for Handsontable 18.x.

## 18.0.0

Released on June 30th, 2026

For more information about this release, see:

<div class="boxes-list gray">

- [Blog post (18.0.0)](https://handsontable.com/blog/handsontable-18.0.0-a-typescript-core-a-new-layout-system-and-a-faster-lighter-grid)
- [Documentation (18.0)](https://handsontable.com/docs/18.0)
- [Migration guide (17.1 → 18.0)](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md)

</div>

#### Added
- **Breaking change**: Added wrapper layout slots and a `layout` option to control the order of UI elements rendered around the grid (pagination, dialog). The license notification always renders last in the bottom area and is not orderable. Built-in UI now mounts into dedicated wrapper containers, which changes the root DOM structure. [#12094](https://github.com/handsontable/handsontable/issues/12094)
- Re-exported `CellMeta`, `CellProperties`, `ColumnSettings`, `GridSettings` and other public types as named top-level imports from `handsontable` and `handsontable/base`. [#11240](https://github.com/handsontable/handsontable/issues/11240)
- Added `hashRevealDelay` option to the password cell type, which briefly shows each typed character before masking it. [#12491](https://github.com/handsontable/handsontable/issues/12491)
- Added the `visibleWhen` nested-header option (`'collapsed'`, `'expanded'`, `'always'`) that lets you choose which columns of a collapsible group stay visible when the group is collapsed or expanded. [#12776](https://github.com/handsontable/handsontable/issues/12776)

#### Changed
- **Breaking change**: Migrated Handsontable core source from JavaScript to TypeScript [#12011](https://github.com/handsontable/handsontable/issues/12011)
- **Breaking change**: Renamed the `--ht-wrapper-border-radius` theme variable to `--ht-border-radius` (token `wrapperBorderRadius` to `borderRadius`) and removed the `--ht-wrapper-border-width` and `--ht-wrapper-border-color` variables (tokens `wrapperBorderWidth` and `wrapperBorderColor`). [#12775](https://github.com/handsontable/handsontable/issues/12775)
- Dragging a selection past the viewport edge now scrolls the viewport and extends the selection to the newly-scrolled cells. [#12344](https://github.com/handsontable/handsontable/issues/12344)
- Improved getSourceData() performance when called repeatedly inside the cells function or custom renderers. [#12480](https://github.com/handsontable/handsontable/issues/12480)
- Improved scroll performance by caching overlay alignment calculations and using native visibility checks. [#12659](https://github.com/handsontable/handsontable/issues/12659)
- Upgraded ESLint to 8.57 and @typescript-eslint to v8; enabled type-aware TypeScript lint rules (`no-explicit-any`, `consistent-type-imports`, `no-floating-promises`, `no-misused-promises`). The `no-unsafe-assignment` and `no-unsafe-return` rules are active at warning level pending incremental cleanup. [#12664](https://github.com/handsontable/handsontable/issues/12664)
- Improved TypeScript type annotations in built-in renderers and internal Core methods for strict-mode compatibility. [#12722](https://github.com/handsontable/handsontable/issues/12722)
- Strengthened the TypeScript type of the cell-properties parameter in all built-in renderers, editors, and validators from Record<string, unknown> to the canonical CellProperties interface. [#12726](https://github.com/handsontable/handsontable/issues/12726)
- Included Walkontable in the main tsconfig.json type-check program and reduced as unknown escape-hatch casts in Walkontable from 68 to 10 (-85%) by using generics, union types, and direct structural assignments. [#12734](https://github.com/handsontable/handsontable/issues/12734)
- Added typing for the `handsontable` cell type configuration and the `getValue` setting. [#12763](https://github.com/handsontable/handsontable/issues/12763)
- Changed the Notification plugin to render its toasts in the grid's overlay layer. [#12777](https://github.com/handsontable/handsontable/issues/12777)
- Angular: Modernized the Angular wrapper to align with Angular 17–19, simplify setup, reduce dependencies, and clean up tooling. [#12451](https://github.com/handsontable/handsontable/issues/12451)
- Angular: Added support for installing Angular 16 through 22, without the --force flag [#12752](https://github.com/handsontable/handsontable/issues/12752)
- Reduced memory usage and improved initialization time for large datasets by no longer materializing cell metadata for every cell during source data validation. [#12847](https://github.com/handsontable/handsontable/pull/12847)

#### Removed
- **Breaking change**: Removed the numbro, moment.js, DOMPurify, and @handsontable/pikaday dependencies. [#12689](https://github.com/handsontable/handsontable/issues/12689)
- **Breaking change**: Removed the deprecated `PersistentState` plugin, its `persistentState` option, and the `persistentStateSave`, `persistentStateLoad`, and `persistentStateReset` hooks. Deprecated `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, and `loadManualRowHeights()` — these now no-op and will be removed in the next major release. [#12727](https://github.com/handsontable/handsontable/pull/12727)
- **Breaking change**: Removed the deprecated Core-level undo/redo methods (`hot.undo()`, `hot.redo()`, `hot.clearUndo()`, `hot.isUndoAvailable()`, `hot.isRedoAvailable()`, `hot.undoRedo`). Use `hot.getPlugin('undoRedo')` instead. [#12728](https://github.com/handsontable/handsontable/issues/12728)

#### Fixed
- Fixed the React and Vue 3 wrappers hiding the table when `height: '100%'` was set inside a fixed-height parent. [#12445](https://github.com/handsontable/handsontable/issues/12445)
- Fixed cell selection re-triggering on every scroll gesture on mobile devices. [#12450](https://github.com/handsontable/handsontable/issues/12450)
- Fixed a bug where placing Handsontable inside a container with `overflow-y: hidden` and no explicit height caused the container to expand to the browser's CSS height limit (~2²⁵ px). [#12453](https://github.com/handsontable/handsontable/issues/12453)
- Fixed `alter('remove_row', null, N)` not removing the last rows when rows were trimmed. [#12460](https://github.com/handsontable/handsontable/issues/12460)
- Fixed `nestedHeaders` overriding `colWidths` with measured header label widths when `autoColumnSize` is explicitly disabled [#12465](https://github.com/handsontable/handsontable/issues/12465)
- Fixed the select cell editor losing its scroll-tracking behavior after being closed and reopened. [#12468](https://github.com/handsontable/handsontable/issues/12468)
- Fixed sort order for date and intl-date cell type values in the "Filter by value" dropdown. [#12471](https://github.com/handsontable/handsontable/issues/12471)
- Fixed a sub-pixel gap at the grid bottom at non-integer browser zoom levels and misalignment between the master table and the bottom overlay when `fixedRowsBottom` is configured. [#12472](https://github.com/handsontable/handsontable/issues/12472)
- Fixed the date filter "before" and "after" conditions including the boundary date in results. [#12473](https://github.com/handsontable/handsontable/issues/12473)
- Fixed `clear()` selecting all cells after the table data is cleared. [#12477](https://github.com/handsontable/handsontable/issues/12477)
- Fixed column sorting not working for boolean data when the column type is set to `text`. [#12479](https://github.com/handsontable/handsontable/issues/12479)
- Fixed numeric cell type incorrectly parsing dot-thousands values in European locales (e.g. `7.000` stored as 7 instead of 7000 with `de-DE` locale). [#12482](https://github.com/handsontable/handsontable/issues/12482)
- Fixed an infinite loop when pasting a value that cannot be auto-corrected into a date cell with `correctFormat: true` and `allowInvalid: false`. [#12483](https://github.com/handsontable/handsontable/issues/12483)
- Fixed date and time format correction being overwritten when pasting data alongside columns with async autocomplete validators. [#12485](https://github.com/handsontable/handsontable/issues/12485)
- Fixed the select cell type not preserving the order of numeric selectOptions values. [#12487](https://github.com/handsontable/handsontable/issues/12487)
- Fixed pasting cells from Apple Numbers losing bare mid-cell quote characters and splitting into multiple rows. [#12488](https://github.com/handsontable/handsontable/issues/12488)
- Fixed `columnSummary` to include cells calculated by the `formulas` plugin in sum, min, max, average and count results. [#12489](https://github.com/handsontable/handsontable/issues/12489)
- Fixed option `dragToScroll` [#12490](https://github.com/handsontable/handsontable/issues/12490)
- Fixed an issue where the active cell flipped to the top-start corner after autofill, causing `getSelected` to report incorrect start/end coordinates. The selection direction now matches the drag direction (like Google Sheets and Excel). [#12498](https://github.com/handsontable/handsontable/issues/12498)
- Fixed undo not restoring merged cells after a row containing or overlapping a merged area was removed. [#12499](https://github.com/handsontable/handsontable/issues/12499)
- Fixed the text renderer showing a placeholder instead of the value 0. [#12505](https://github.com/handsontable/handsontable/issues/12505)
- Fixed the dropdown/autocomplete editor overflowing the table's right boundary when `trimDropdown` is set to `false`. [#12506](https://github.com/handsontable/handsontable/issues/12506)
- Fixed merged cells not following their data when columns or rows are reordered with `manualColumnMove`, `manualRowMove`, or `manualColumnFreeze`. Merges now translate with the underlying data; merges whose physical span becomes non-contiguous after a reorder auto-split into smaller merges, and any single-cell fragment left behind is dropped. [#12508](https://github.com/handsontable/handsontable/issues/12508)
- Fixed the `handsontable` cell type editor closing unexpectedly when using filters or dropdown menu on the inner Handsontable instance. [#12510](https://github.com/handsontable/handsontable/issues/12510)
- Fixed the loading overlay resetting the grid scroll position to the top when no cell was selected before showing the overlay. [#12514](https://github.com/handsontable/handsontable/issues/12514)
- Fixed manual column and row resize handle position after scrolling when `preventOverflow` is set. [#12515](https://github.com/handsontable/handsontable/issues/12515)
- Fixed the table visually overflowing the configured `width` when `height` was not set. [#12517](https://github.com/handsontable/handsontable/pull/12517)
- Fixed Prevent crash when Handsontable is initialized inside a hidden container, rowsRenderCalculator and columnsRenderCalculator on Viewport are never assigned and remain undefined. [#12533](https://github.com/handsontable/handsontable/issues/12533)
- Fixed HTML entity decoding in autocomplete/dropdown when allowHtml is false [#12553](https://github.com/handsontable/handsontable/issues/12553)
- Fixed `allowEmpty: false` being ignored in the autocomplete cell type when `strict` mode is disabled. [#12555](https://github.com/handsontable/handsontable/issues/12555)
- Fixed autofill being silently blocked when object-typed cells contain undefined-valued properties or have different key insertion order. [#12556](https://github.com/handsontable/handsontable/issues/12556)
- Fixed `selectCell()` and `selectCells()` so that calling them with `changeListener` set to `false` no longer moves the browser focus away from an externally focused input, textarea, select, or contenteditable element. [#12557](https://github.com/handsontable/handsontable/issues/12557)
- Fixed the `beforeValidate`, `afterValidate`, and `postAfterValidate` hooks receiving the data accessor function instead of the visual column index when `columns[i].data` is a function. [#12560](https://github.com/handsontable/handsontable/issues/12560)
- Fixed `getSourceData()` and `getData()` returning incorrect values when the `formulas` plugin was used together with an initial `manualColumnMove` (or `manualRowMove`) configuration. [#12561](https://github.com/handsontable/handsontable/issues/12561)
- Fixed custom editor object values with a different schema being silently discarded by populateFromArray. [#12562](https://github.com/handsontable/handsontable/issues/12562)
- Fixed `beforeColumnResize` and `beforeRowResize` hook return values being ignored during drag resize. [#12566](https://github.com/handsontable/handsontable/issues/12566)
- Fixed formulas not being evaluated for array-of-arrays datasets when the `columns` option skips physical column indexes. [#12569](https://github.com/handsontable/handsontable/issues/12569)
- Fixed a memory leak caused by ThemeManager not unsubscribing from the shared theme object on destroy. [#12570](https://github.com/handsontable/handsontable/issues/12570)
- Fixed viewport scroll jump when Ctrl+clicking a selected cell to deselect it. [#12574](https://github.com/handsontable/handsontable/issues/12574)
- Fixed a memory leak where IntersectionObserver instances were not properly disconnected when `document.body` had zero height. [#12578](https://github.com/handsontable/handsontable/issues/12578)
- Fixed a crash when calling `setSourceDataAtCell()` inside the `afterLoadData()` hook during initialization. [#12585](https://github.com/handsontable/handsontable/issues/12585)
- Fixed context menu items in object form (e.g. `add_child`, `detach_from_parent`) not rendering plugin-provided callbacks and translated labels. [#12586](https://github.com/handsontable/handsontable/issues/12586)
- Fixed page scroll jump when inserting or removing a row/column near the bottom of the page on a grid with no fixed height. [#12587](https://github.com/handsontable/handsontable/issues/12587)
- Fixed NestedRows context menu "Insert row above/below" destroying sibling branches on a deeply-nested leaf. [#12590](https://github.com/handsontable/handsontable/issues/12590)
- Fixed the browser page scrolling to the grid when `dataProvider` loads rows for the first time into an empty grid with `emptyDataState` enabled. [#12591](https://github.com/handsontable/handsontable/issues/12591)
- Fixed a crash when `updateSettings` was called from the `beforeContextMenuShow` or `beforeDropdownMenuShow` hook. [#12593](https://github.com/handsontable/handsontable/issues/12593)
- Fixed the comment editor rendering off-screen on narrow viewports such as mobile portrait. [#12594](https://github.com/handsontable/handsontable/issues/12594)
- Fixed nested headers rendering incorrectly when manualColumnMove and hiddenColumns are combined. [#12610](https://github.com/handsontable/handsontable/issues/12610)
- Fixed the Comments plugin not showing the popup when the first row of object data has fewer keys than the columns declared via `dataSchema` or `columns`. [#12611](https://github.com/handsontable/handsontable/issues/12611)
- Fixed the "Filter by value" list not showing newly added values after `updateData` is called while a filter is active. [#12613](https://github.com/handsontable/handsontable/issues/12613)
- Fixed the `afterFormulasValuesUpdate` hook and `getDataAtCell` returning raw HyperFormula numerics for formula cells of type `time` or `date`. [#12618](https://github.com/handsontable/handsontable/issues/12618)
- Fixed `Filter by value` selection being lost in dependent column when editing an earlier filtered column [#12620](https://github.com/handsontable/handsontable/issues/12620)
- Fixed column widths widening for merged cells after `loadData` when `autoColumnSize` is enabled. [#12622](https://github.com/handsontable/handsontable/issues/12622)
- Fixed `scrollViewportTo()` not scrolling when a constrained dimension (`height` or `width`) is combined with the matching `preventOverflow` value. [#12624](https://github.com/handsontable/handsontable/issues/12624)
- Fixed column sorting permuting rows pinned by `fixedRowsTop` or `fixedRowsBottom`, which previously corrupted absolute-address formulas in footer rows. [#12627](https://github.com/handsontable/handsontable/pull/12627)
- Fixed undoing row removal to restore all source-data fields, including columns that are not exposed via the `columns` configuration. [#12629](https://github.com/handsontable/handsontable/issues/12629)
- Fixed nested headers not expanding column widths to content after resetting `colWidths` to `undefined` via `updateSettings`. [#12630](https://github.com/handsontable/handsontable/issues/12630)
- Adjusted TypeScript source code to comply with strict: true compiler option. [#12635](https://github.com/handsontable/handsontable/issues/12635)
- Fixed checkbox cells not toggling on mobile touch when disableVisualSelection is 'current' or true. [#12637](https://github.com/handsontable/handsontable/issues/12637)
- Fixed Ctrl/Cmd+click selection highlight jumping between cells when `disableVisualSelection` is set to a non-`false` value. [#12638](https://github.com/handsontable/handsontable/pull/12638)
- Fixed pasting a single cell from Excel erasing the cell below the paste target when a custom `sanitizer` strips the HTML. [#12640](https://github.com/handsontable/handsontable/issues/12640)
- Fixed autofill and paste skipping a row or column that was hidden and then shown again, when `hiddenRows`/`hiddenColumns` had `copyPasteEnabled` set to `false`. [#12647](https://github.com/handsontable/handsontable/issues/12647)
- Fixed a TypeError thrown when the StretchColumns ResizeObserver callback fires while the table view is not yet available. [#12655](https://github.com/handsontable/handsontable/issues/12655)
- Made the published TypeScript definitions compatible with TypeScript 5.1+. [#12658](https://github.com/handsontable/handsontable/issues/12658)
- Fixed resize handles moving out of sync during manual resize and after double-click auto-sizing. [#12675](https://github.com/handsontable/handsontable/issues/12675)
- Fixed the setDataAtCell TypeScript signature so the documented array form setDataAtCell(changes, source) type-checks again [#12685](https://github.com/handsontable/handsontable/issues/12685)
- Fixed broken and ambiguous type declarations in the published npm package for ESM and CJS consumers. [#12696](https://github.com/handsontable/handsontable/issues/12696)
- Fixed private `indexSyncer` module leaking through the package exports wildcard pattern. [#12724](https://github.com/handsontable/handsontable/issues/12724)
- Removed stale hand-written type-cast interfaces in the Filters plugin (DropdownMenuPluginInterface, DropdownMenuInterface, MenuFocusNavigatorInterface) and replaced them with canonical types. [#12725](https://github.com/handsontable/handsontable/issues/12725)
- Fixed additive `Ctrl`/`Cmd`+click selection not working in a Handsontable instance rendered inside a separate iframe (or any instance that was not the first one created). [#12737](https://github.com/handsontable/handsontable/issues/12737)
- Fixed rows in frozen columns becoming misaligned with the rest of the grid when column headers wrap onto multiple lines. [#12741](https://github.com/handsontable/handsontable/issues/12741)
- Fixed the middle mouse button (scroll wheel) not starting the browser's native autoscroll when clicked over the grid on Windows and Linux. [#12754](https://github.com/handsontable/handsontable/issues/12754)
- Fixed Page Up and Page Down not scrolling the master viewport to align with the frozen rows overlay. [#12755](https://github.com/handsontable/handsontable/issues/12755)
- Fixed multiple code quality issues reported by SonarCloud static analysis. [#12761](https://github.com/handsontable/handsontable/issues/12761)
- Improved the performance of locale-aware text comparisons (search, filtering, sorting, autocomplete, and checkbox rendering) on large datasets. [#12762](https://github.com/handsontable/handsontable/issues/12762)
- Fixed nested headers not staying aligned with the grid body when hiding or collapsing columns, made them follow column insertion and removal, made collapsing a group take effect (and stay collapsed) even when one of its columns is already hidden, and stopped column removal from leaving the selection on a hidden column (it now moves to the nearest visible one). [#12766](https://github.com/handsontable/handsontable/pull/12766)
- Fixed filter menu components being wrongly hidden when dropdownMenu starts with a '---------' separator. [#12781](https://github.com/handsontable/handsontable/issues/12781)
- Fixed cell meta set with `setCellMeta` (for example, `readOnly`) being reset by `updateSettings`. [#12811](https://github.com/handsontable/handsontable/issues/12811)
- Reduced memory usage during scrolling and fixed potential out-of-memory errors on very large datasets. [#12844](https://github.com/handsontable/handsontable/pull/12844)
- Vue: Fixed a Vue 3 wrapper crash on cell edit when `contextMenu` or `dropdownMenu` had `uiContainer` set to a DOM element under the Vue mount root. [#12475](https://github.com/handsontable/handsontable/issues/12475)
- React: Fixed React component renderers being unmounted and visibly cleared on every grid render after a cell edit. [#12494](https://github.com/handsontable/handsontable/issues/12494)
- React: Fixed an issue where `HotColumn` children removed from a `HotTable` left phantom columns behind in the React wrapper. [#12596](https://github.com/handsontable/handsontable/issues/12596)
- Angular: Fixed subscription leak, missing EmbeddedViewRef cleanup, repeated registerRenderer calls, wrong constructor.name, incorrect prop type, missing null guard in ngOnDestroy, premature editor destruction, redundant double-destroy of already-swept renderer refs, and stale editor reuse when a different column takes an index. [#12657](https://github.com/handsontable/handsontable/issues/12657)

## Related

- [Migrating from 17.1 to 18.0](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md)
