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

## 18.1.0

Released on TODO

For more information about this release, see:

<div class="boxes-list gray">

- [Blog post (18.1.0)](https://handsontable.com/blog/handsontable-18.1.0-shadow-dom-support-for-salesforce-and-web-components-a-faster-grid-and-a-new-demo-playground)
- [Documentation (18.1)](https://handsontable.com/docs/18.1)
- [Migration guide (18.0 → 18.1)](@/guides/upgrade-and-migration/migrating-from-18.0-to-18.1/migrating-from-18.0-to-18.1.md)

</div>

#### Added
- Added the `modifySinglePassLayout` hook, which forces the previous measure-then-render layout path for a table. [#12951](https://github.com/handsontable/handsontable/pull/12951)
- Added the `selectionHandles` option, which shows draggable handles at each edge midpoint of a selected range for resizing the selection, and the `moveCells` option for moving a cell selection to a new location by dragging its border. [#13076](https://github.com/handsontable/handsontable/pull/13076)
- Added Persian language RTL direction support. [#13101](https://github.com/handsontable/handsontable/issues/13101)
- Added support for entitlement license keys, and made a missing or invalid license key block the grid with a modal that cannot be closed. [#13106](https://github.com/handsontable/handsontable/pull/13106)
- Added the `intl-datetime` cell type, with a native date-time picker, `Intl.DateTimeFormat` display via the new `dateTimeFormat` option, and column sorting, filtering, and Excel export support. [#13151](https://github.com/handsontable/handsontable/issues/13151)
- Added the `preserveNumericLiteral` option to the numeric cell type, which keeps the exact value you type in the cell editor (preserving trailing decimal zeros and large-number precision). [#13170](https://github.com/handsontable/handsontable/pull/13170)
- Added the `colorScheme` and `density` options, which set the color scheme and the spacing of the grid without declaring a theme. [#13205](https://github.com/handsontable/handsontable/pull/13205)
- Added a public API to the `NestedRows` plugin for collapsing and expanding parent rows: `collapseAll()`, `expandAll()`, `collapseParent()`, `expandParent()`, `toggleParent()`, `getCollapsedParents()`, `isParentCollapsed()`, `isParent()`, `getRowLevel()`, `getRowParent()`, `countChildren()`, `expandToRow()`, and `expandToLevel()`, plus the new `beforeRowCollapse`, `afterRowCollapse`, `beforeRowExpand`, and `afterRowExpand` hooks. The plugin also no longer loses its collapsed rows on an `updateSettings()` call, and no longer throws when asked for the index, parent, or nesting level of a row object held from before a `loadData()` or `updateData()` call. [#13206](https://github.com/handsontable/handsontable/pull/13206)
- Added the `formulas.hyperlinks` option, which renders cells holding a `HYPERLINK` formula as clickable links. [#13223](https://github.com/handsontable/handsontable/pull/13223)
- Added the `SanitizerContext` type, which lists the write surfaces the `sanitizer` option receives. [#13240](https://github.com/handsontable/handsontable/pull/13240)

#### Changed
- Reduced memory usage when scrolling large datasets by releasing cell metadata for rows scrolled out of the viewport. [#12854](https://github.com/handsontable/handsontable/pull/12854)
- Improved the performance of sorting, filtering, and row/column hiding on large datasets by speeding up internal index translation. [#12880](https://github.com/handsontable/handsontable/pull/12880)
- Improved initialization time for large date-typed datasets by validating ISO dates arithmetically instead of constructing a `Date` object for every cell. [#12881](https://github.com/handsontable/handsontable/pull/12881)
- Improved initial render time and memory usage for large datasets with uniform row heights and column widths. [#12884](https://github.com/handsontable/handsontable/pull/12884)
- Improved filtering performance on large datasets by writing the row-trimming state in a single bulk operation instead of scanning and updating it row by row. [#12886](https://github.com/handsontable/handsontable/pull/12886)
- Improved vertical scrolling performance for grids with pinned bottom rows (`fixedRowsBottom`). [#12894](https://github.com/handsontable/handsontable/issues/12894)
- Improved the performance of sorting, filtering, hiding, and inserting/removing rows/columns on large datasets by removing redundant per-operation work in the index translation layer. [#12898](https://github.com/handsontable/handsontable/pull/12898)
- Improved the performance of the internal hooks (events) dispatch: each hook's callbacks are now stored in a linked list, and removing a hook frees it immediately instead of accumulating skipped entries that were iterated over on every run. [#12925](https://github.com/handsontable/handsontable/pull/12925)
- The grid now renders in a single pass, predicting whether scrollbars will appear instead of rendering, measuring, and re-rendering. The `mergeCells` plugin keeps the previous path, and the `modifySinglePassLayout` hook opts out of it. [#12951](https://github.com/handsontable/handsontable/pull/12951)
- Improved vertical scrolling performance by skipping the column header re-render when the column layout is unchanged. [#12987](https://github.com/handsontable/handsontable/pull/12987)
- Improved vertical scrolling performance by re-rendering only the rows entering the viewport and reusing the rows that stay. [#12995](https://github.com/handsontable/handsontable/pull/12995)
- Improved scrolling performance for grids embedded in complex pages by keeping the rendered cells in place during scroll instead of re-inserting them. [#13020](https://github.com/handsontable/handsontable/pull/13020)
- Improved scrolling smoothness: the `auto` mode of `viewportRowRenderingOffset` and `viewportColumnRenderingOffset` now extends the rendered viewport dynamically in the scroll direction, so consecutive scroll steps reuse already-rendered cells. [#13055](https://github.com/handsontable/handsontable/issues/13055)
- Improved the performance and memory usage of the cell meta storage. Reading cell settings stays fast on large grids. Memory used by settings of scrolled-away rows is released. Bulk operations - sorting, copying, pasting, filling, exporting, validation, checkbox toggling, and automatic size sampling - no longer permanently cache settings for every visited cell. Added the `getCellMetaTransient()` method for reading the effective cell configuration without caching it. [#13063](https://github.com/handsontable/handsontable/pull/13063)
- Improved memory usage of read-only cell settings lookups. The context menu, filters dropdown, formulas synchronization, data type detection, column summaries, and clearing large selections no longer permanently cache settings for every visited cell. [#13068](https://github.com/handsontable/handsontable/pull/13068)
- Improved scroll-to-row performance on large grids: keyboard navigation and `scrollViewportTo` near the bottom of the dataset now compute the scroll offset in constant time instead of summing every row height from the top. [#13075](https://github.com/handsontable/handsontable/issues/13075)
- Improved performance of copy, autofill, bulk edits, header resize, and custom borders on large selections by replacing linear membership scans with set-based lookups. [#13077](https://github.com/handsontable/handsontable/issues/13077)
- Improved rendering performance of grids with wrapped or content-sized rows: the row-height cache is no longer rebuilt on every render, edit, or scroll step when row heights have not changed, and rebuilds triggered by newly measured rows now scale with the number of taller rows instead of the total row count. [#13078](https://github.com/handsontable/handsontable/issues/13078)
- Improved index-map performance: writing an unchanged value into scalar-valued index maps (hiding, trimming, order sequence, and the automatic or manual row/column size maps) no longer rebuilds the index caches. [#13080](https://github.com/handsontable/handsontable/issues/13080)
- Improved the performance of the MergeCells plugin: scrolling, extending large selections, and moving the focus with the keyboard no longer slow down with the grid or selection size. [#13083](https://github.com/handsontable/handsontable/issues/13083)
- Improved Formulas plugin performance on large grids: faster rendering and sorting through cached index translations, and bulk row/column removals now issue batched engine calls. [#13085](https://github.com/handsontable/handsontable/issues/13085)
- Improved sorting performance on large datasets: date and time columns no longer re-parse values on every comparison, and text columns no longer re-lowercase values on every comparison. [#13087](https://github.com/handsontable/handsontable/issues/13087)
- Improved Filters plugin performance: batch changes into a filtered column update the filter list once per column instead of once per changed cell, importing conditions updates once per column instead of once per condition, and applying filters no longer re-reads rows already rejected by earlier columns. [#13090](https://github.com/handsontable/handsontable/issues/13090)
- Improved the performance of bulk grid alterations: removing many rows or columns, inserting multiple columns, pasting data that extends the grid, and edits with the `minSpareCols` or `minCols` options on large datasets. [#13091](https://github.com/handsontable/handsontable/issues/13091)
- Improved `getColHeader` performance: the index translation derived from the `columns` function is now cached instead of being rebuilt on every call, which also speeds up grid initialization and `updateSettings` on grids with many columns. [#13096](https://github.com/handsontable/handsontable/issues/13096)
- Improved sizing plugins performance: AutoColumnSize measures only the changed cells on edits instead of rescanning whole columns, its background width sweep is budgeted and runs on browser idle time, AutoRowSize reuses the cached header height on selection-driven renders, and a multi-column resize triggers one height recalculation instead of one per column. [#13097](https://github.com/handsontable/handsontable/issues/13097)
- Changed how touch opens the cell editor on devices that report both touch and mouse input, such as iPad: a double-tap opens it (taps up to 1 second apart), and a single tap on an already selected cell no longer opens it as it did in 18.0.0, where duplicated mouse events after the tap triggered the double-click. [#13306](https://github.com/handsontable/handsontable/pull/13306)

#### Removed
- Removed leftover Pikaday styles from the themes. [#13156](https://github.com/handsontable/handsontable/pull/13156)

#### Fixed
- Fixed a `Sheet size limit exceeded` error thrown when grids sharing one HyperFormula instance used different `maxRows` values. The grid's `maxRows` and `maxCols` no longer limit the engine, so an oversized insert is now capped at the limit instead of being rejected. [#10672](https://github.com/handsontable/handsontable/issues/10672)
- Fixed a bug where dragging a selection handle to the edge of the grid on a mobile device did not scroll the viewport, so the selection stopped growing at the last visible cell. [#11658](https://github.com/handsontable/handsontable/issues/11658)
- Fixed the `columnSummary` plugin misbehaving when another plugin trimmed rows (for example a collapsed `nestedRows` group): false out-of-bounds warnings, results written into the wrong row, a crash when the destination row was hidden, and hidden summary rows being counted as data by other summaries. [#11674](https://github.com/handsontable/handsontable/issues/11674)
- Fixed the "filter by value" list dropping the values that the column's own filter condition filtered out, which made them impossible to select again. [#12226](https://github.com/handsontable/handsontable/issues/12226)
- Fixed open menus (context menu, dropdown menu, and filters) becoming detached from the grid when a scrollable parent container or the grid viewport was scrolled. Menus now follow their anchor and close when it scrolls out of view. [#12719](https://github.com/handsontable/handsontable/issues/12719)
- Fixed a nested header bug where a wide column group's label jumped while scrolling horizontally. [#12783](https://github.com/handsontable/handsontable/issues/12783)
- Fixed an error thrown by `countRowHeaders()` and `countColHeaders()` when they were called while the table view was unavailable (during initialization or after the instance was destroyed). [#12790](https://github.com/handsontable/handsontable/pull/12790)
- Fixed merged cells breaking after filtering, `trimRows`/`nestedRows` collapse, or sorting — merges now stay whole and follow the visible rows. [#12792](https://github.com/handsontable/handsontable/issues/12792)
- Fixed nested headers not following the data when moving columns; labels now travel with their columns, a group split across non-adjacent columns renders as separate banners, and a collapsed group either follows the move or expands when the move would split it. [#12793](https://github.com/handsontable/handsontable/issues/12793)
- Fixed nested column headers ignoring `stopImmediatePropagation()` called in the `beforeOnCellMouseOver` hook, so a header drag-selection can now be blocked the same way as for regular column headers. [#12794](https://github.com/handsontable/handsontable/issues/12794)
- Fixed stale cell metadata left behind after unmerging cells, which made `toHTML()` output extra cells. [#12798](https://github.com/handsontable/handsontable/issues/12798)
- Fixed undo not restoring merged cells after removing a column that overlapped a merge. [#12801](https://github.com/handsontable/handsontable/issues/12801)
- Fixed missing selection border edges and active header highlight accents along frozen-pane boundaries (`fixedRowsTop` / `fixedRowsBottom` / `fixedColumnsStart`). [#12802](https://github.com/handsontable/handsontable/issues/12802)
- Fixed context menu inserting two rows instead of one when tapping "Insert row above" or "Insert row below" on iPad (Safari). [#12804](https://github.com/handsontable/handsontable/issues/12804)
- Fixed `multiselect` cell type displaying a neighbouring column's value after moving the column with `manualColumnMove`. [#12827](https://github.com/handsontable/handsontable/issues/12827)
- Fixed a bug where Ctrl/Cmd+clicking an already-selected cell in a multi-cell selection caused the active highlight to jump to a different cell [#12841](https://github.com/handsontable/handsontable/pull/12841)
- Reduced memory usage when filtering large datasets: the Filters plugin no longer permanently retains a cell meta object for every source row of each filtered column. [#12878](https://github.com/handsontable/handsontable/pull/12878)
- Fixed an error thrown when removing a frozen column while using the legacy fixedColumnsLeft option. [#12883](https://github.com/handsontable/handsontable/pull/12883)
- Fixed the `multiselect` cell type so its option filtering folds case in a locale-aware way, consistent with the `autocomplete` editor, for Turkish, Azeri, and Lithuanian locales. [#12902](https://github.com/handsontable/handsontable/issues/12902)
- Fixed the horizon theme row header background color not cascading from headerRowBackgroundColor for even rows. [#12908](https://github.com/handsontable/handsontable/issues/12908)
- Restored the `multiSelect` camelCase alias for the MultiSelect cell type, so both `multiselect` and `multiSelect` resolve to the same cell type. [#12921](https://github.com/handsontable/handsontable/pull/12921)
- Fixed a load-time slowdown where `loadData()` and `updateData()` resolved cell metadata for the entire dataset when a `cells` function was configured, even with no validators defined. [#12933](https://github.com/handsontable/handsontable/issues/12933)
- Fixed the `multiselect` cell type not firing `beforeChange` and `afterChange` (or running validation) when a value was removed by clicking the chip's X icon. [#12968](https://github.com/handsontable/handsontable/issues/12968)
- Fixed date filter conditions returning no results by rendering native date and time inputs in the filter menu instead of free-text fields. [#12976](https://github.com/handsontable/handsontable/issues/12976)
- Fixed an autofill bug where dragging the fill handle of the last column slightly diagonally, past the table's edge, drew the fill border but did not apply the values. [#12997](https://github.com/handsontable/handsontable/pull/12997)
- Fixed the `modifyCopyableRange` hook's type declaration to reflect that its return value is used. [#13022](https://github.com/handsontable/handsontable/pull/13022)
- Fixed the `ContextMenu.SEPARATOR` constant missing from the TypeScript type declarations. [#13037](https://github.com/handsontable/handsontable/issues/13037)
- Fixed a doubled separator line under the "Filter by value" list in the dropdown menu. [#13047](https://github.com/handsontable/handsontable/pull/13047)
- Fixed removing rows throwing a "Maximum call stack size exceeded" error on grids with roughly 125,000 rows or more. [#13070](https://github.com/handsontable/handsontable/pull/13070)
- Fixed the `Events` type resolving every hook callback to `any`, so callbacks typed through `Events[hookName]` and `addHook` now get correct parameter types and autocomplete. [#13079](https://github.com/handsontable/handsontable/issues/13079)
- Restored the horizon theme alternating stripe on even row headers, which stopped showing after the even row header background was made to cascade from headerRowBackgroundColor. [#13084](https://github.com/handsontable/handsontable/issues/13084)
- Fixed a grid configured with a `width` and no `height` collapsing vertically. Relative widths (`100%`, percentages, viewport units, `calc()` with them) keep scrolling horizontally with the window, while definite pixel/`em` widths clip to their box. [#13104](https://github.com/handsontable/handsontable/issues/13104)
- Fixed autofill dragging near vertically merged cells — the fill handle can now target rows inside a merged band in a neighboring column instead of jumping past the whole merge. [#13105](https://github.com/handsontable/handsontable/pull/13105)
- Fixed an error thrown on touch devices when the grid was destroyed while a momentum scroll was still coasting. [#13120](https://github.com/handsontable/handsontable/issues/13120)
- Fixed custom editors created with `editorFactory` throwing an error when `shortcuts` were defined without `shortcutsGroup`. [#13130](https://github.com/handsontable/handsontable/issues/13130)
- Fixed an error thrown on every focus change when the grid failed to initialize. [#13131](https://github.com/handsontable/handsontable/pull/13131)
- Fixed a failed `fetchRows` call in the `dataProvider` plugin surfacing as an unhandled promise rejection. [#13133](https://github.com/handsontable/handsontable/issues/13133)
- Fixed the autocomplete editor and several internal utilities using `Array.prototype.toSorted` and `Array.prototype.at`, which are not available in every browser the library declares support for. [#13139](https://github.com/handsontable/handsontable/pull/13139)
- Fixed an `Error: TR was expected to be rendered but is not` thrown when a `beforeDraw` hook cancels a render after the rendered row range has already advanced. [#13141](https://github.com/handsontable/handsontable/pull/13141)
- Fixed a spurious scrollbar appearing when a cell in the last column or row was selected in a grid with frozen columns or rows — the fill handle now stays inside the viewport instead of overflowing it. [#13143](https://github.com/handsontable/handsontable/issues/13143)
- Fixed the `Formulas` plugin leaving its internal redo state active after a redo operation, which made the plugin treat subsequent operations as undo/redo replay. [#13148](https://github.com/handsontable/handsontable/pull/13148)
- Fixed the grid's cell styling (borders, padding, background, box-sizing, and corner radius) leaking into a table or other element rendered inside a cell. [#13150](https://github.com/handsontable/handsontable/issues/13150)
- Fixed several `CustomBorders` bugs: borders now follow their cell when rows or columns are inserted, removed, or moved (and stay removable from the context menu afterward), and ranges defined with a top-level `border` object - including overlapping ranges - now render with the configured width, color, and style. Also added the `customBordersProgressive` option, which applies a large `customBorders` configuration in background batches so the grid renders immediately, together with the `afterCustomBordersUpdate` hook that fires once all custom borders have been applied. [#13166](https://github.com/handsontable/handsontable/issues/13166)
- Fixed the license notification bar content overflowing on grids narrower than 300px. [#13167](https://github.com/handsontable/handsontable/pull/13167)
- Fixed Handsontable errors not carrying their identifying cause on Safari below 15. [#13176](https://github.com/handsontable/handsontable/pull/13176)
- Fixed rows losing their alignment when the tallest cell in a row was in a frozen column. [#13178](https://github.com/handsontable/handsontable/pull/13178)
- Fixed a formula cell staying marked as invalid after an undo or redo restored a correct value. [#13182](https://github.com/handsontable/handsontable/pull/13182)
- Fixed being unable to move a column by dragging its header while column sorting is enabled. Sorting by clicking a header now happens on mouse up instead of mouse down, and only the header label and its sort indicator sort on click. A click on a column header no longer fires `beforeColumnMove` and `afterColumnMove`, which previously ran even though no column moved. [#13184](https://github.com/handsontable/handsontable/pull/13184)
- Fixed mobile selection handles not being visible on touch devices. [#13185](https://github.com/handsontable/handsontable/pull/13185)
- Fixed the full bundle failing to load on pages with an AMD loader present (RequireJS, SharePoint). [#13187](https://github.com/handsontable/handsontable/issues/13187)
- Fixed an error thrown when a grid initialized in a hidden container was destroyed right as it became visible. [#13190](https://github.com/handsontable/handsontable/pull/13190)
- Fixed `autoRowSize` and `autoColumnSize` measuring cells without the styling applied through their `className` and without the formatting applied by the renderer's own `valueFormatter`, which left the row headers misaligned with the data cells. [#13191](https://github.com/handsontable/handsontable/pull/13191)
- Fixed grid interactions inside Shadow DOM and sandboxed hosts such as Salesforce Lightning Web Components: the cell editor no longer closes when clicked, copy and paste work, focus is released when it leaves the grid, outside clicks clear the selection, and the grid's internal z-index values no longer paint above the host page UI. [#13194](https://github.com/handsontable/handsontable/pull/13194)
- Fixed the dropdown and autocomplete editor list rendering narrower than the edited column when `trimDropdown` is set to `false`. [#13197](https://github.com/handsontable/handsontable/pull/13197)
- Fixed the `fixedRowsTop`, `fixedRowsBottom`, and `fixedColumnsStart` options losing their value after undoing a row or column insertion, which un-pinned a frozen row or column. [#13200](https://github.com/handsontable/handsontable/pull/13200)
- Fixed autofill dragging near horizontally merged cells — the fill handle can now target columns inside a merged band in a row below the merge instead of snapping back to the merge anchor. [#13201](https://github.com/handsontable/handsontable/pull/13201)
- Fixed the autocomplete and dropdown option list collapsing to zero height, hiding every option, when less than one option of space was left below the edited cell. [#13202](https://github.com/handsontable/handsontable/pull/13202)
- Fixed misaligned column headers and frozen columns, and a grid that filled its container only after a click, when it was created in a container that had no size yet. [#13208](https://github.com/handsontable/handsontable/pull/13208)
- Fixed a memory leak where each `loadData()` or `updateData()` call added another formula engine sheet, so repeated data loads kept slowing the grid down. [#13215](https://github.com/handsontable/handsontable/pull/13215)
- Fixed the autofill fill handle being cut in half at the bottom freeze line. [#13220](https://github.com/handsontable/handsontable/pull/13220)
- Fixed a bug where the `afterSelectionEnd` and `afterSelectionEndByProp` hooks fired twice when selecting rows or columns by dragging over their headers. [#7133](https://github.com/handsontable/handsontable/issues/7133)
- Vue: Fixed the Vue 3 wrapper not updating the grid when `HotColumn` components were added, removed, or reordered dynamically. [#12800](https://github.com/handsontable/handsontable/issues/12800)
- React: Fixed a memory leak in the React wrapper where the portal containers used by component-based renderers were retained for every scrolled cell instead of being released once a cell left the viewport. [#12895](https://github.com/handsontable/handsontable/pull/12895)
- React: Fixed missing TypeScript autocomplete and type checking for `<HotTable>` and `<HotColumn>` props. [#13007](https://github.com/handsontable/handsontable/issues/13007)
- Angular: Fixed custom editor shortcut groups in the Angular wrapper. [#13160](https://github.com/handsontable/handsontable/pull/13160)
- Fixed the grid no longer responding to keyboard shortcuts after clicking focusable plugin UI placed in the grid's layout slots (for example, pagination controls). [#13243](https://github.com/handsontable/handsontable/pull/13243)
- Fixed an open cell editor staying visible over an unrelated row, and committing to a row you could no longer see, when the edited cell was hidden - for example by turning a Pagination page or hiding its row or column. [#13245](https://github.com/handsontable/handsontable/pull/13245)
- Fixed an expired trial license key not blocking the grid when the key carried the `no-ui-warns` flag. [#13312](https://github.com/handsontable/handsontable/pull/13312)

#### Security
- Fixed pasted HTML being able to run scripts, and applied the `sanitizer` option to the surfaces that previously skipped it. [#13236](https://github.com/handsontable/handsontable/pull/13236)
- Fixed the `dialog` plugin interpolating an unvalidated `template.id` into the dialog's `id` attribute, and the `loading` plugin rendering its `title` and `description` options as HTML. Those two `loading` options now render as text, so markup passed in them shows up literally instead of being interpreted; use `icon` for markup. The button `type` option of the `dialog`, `emptyDataState`, and `notification` plugins is now resolved where the markup is built. [#13242](https://github.com/handsontable/handsontable/pull/13242)

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
- **Breaking change**: Angular: Updated Angular peer dependency minimum version to 19 in `@handsontable/angular-wrapper` [#1836](https://github.com/handsontable/handsontable/pull/1836)
- Dragging a selection past the viewport edge now scrolls the viewport and extends the selection to the newly-scrolled cells. [#12344](https://github.com/handsontable/handsontable/issues/12344)
- Improved getSourceData() performance when called repeatedly inside the cells function or custom renderers. [#12480](https://github.com/handsontable/handsontable/issues/12480)
- Improved scroll performance by caching overlay alignment calculations and using native visibility checks. [#12659](https://github.com/handsontable/handsontable/issues/12659)
- Upgraded ESLint to 8.57 and @typescript-eslint to v8; enabled type-aware TypeScript lint rules (`no-explicit-any`, `consistent-type-imports`, `no-floating-promises`, `no-misused-promises`). The `no-unsafe-assignment` and `no-unsafe-return` rules are active at warning level pending incremental cleanup. [#12664](https://github.com/handsontable/handsontable/issues/12664)
- Improved TypeScript type annotations in built-in renderers and internal Core methods for strict-mode compatibility. [#12722](https://github.com/handsontable/handsontable/issues/12722)
- Strengthened the TypeScript type of the cell-properties parameter in all built-in renderers, editors, and validators from Record<string, unknown> to the canonical CellProperties interface. [#12726](https://github.com/handsontable/handsontable/issues/12726)
- Included Walkontable in the main tsconfig.json type-check program and reduced as unknown escape-hatch casts in Walkontable from 68 to 10 (-85%) by using generics, union types, and direct structural assignments. [#12734](https://github.com/handsontable/handsontable/issues/12734)
- Added typing for the `handsontable` cell type configuration and the `getValue` setting. [#12763](https://github.com/handsontable/handsontable/issues/12763)
- Changed the Notification plugin to render its toasts in the grid's overlay layer. [#12777](https://github.com/handsontable/handsontable/issues/12777)
- Angular: Added support for installing Angular 16 through 22, without the --force flag [#12752](https://github.com/handsontable/handsontable/issues/12752)
- Reduced memory usage and improved initialization time for large datasets by no longer materializing cell metadata for every cell during source data validation. [#12847](https://github.com/handsontable/handsontable/pull/12847)

#### Removed
- **Breaking change**: Removed the numbro, moment.js, DOMPurify, and @handsontable/pikaday dependencies. [#12689](https://github.com/handsontable/handsontable/issues/12689)
- **Breaking change**: Removed the deprecated `PersistentState` plugin, its `persistentState` option, and the `persistentStateSave`, `persistentStateLoad`, and `persistentStateReset` hooks. Deprecated `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, and `loadManualRowHeights()` — these now no-op and will be removed in the next major release. Removed from the source tree; the published 17.0 release already shipped without it (see [#12015](https://github.com/handsontable/handsontable/pull/12015)). [#12727](https://github.com/handsontable/handsontable/pull/12727)
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
- Fixed a crash when calling `setSourceDataAtCell()` inside the `afterLoadData()` hook during initialization. [#12585](https://github.com/handsontable/handsontable/issues/12585)
- Fixed context menu items in object form (e.g. `add_child`, `detach_from_parent`) not rendering plugin-provided callbacks and translated labels. [#12586](https://github.com/handsontable/handsontable/issues/12586)
- Fixed page scroll jump when inserting or removing a row/column near the bottom of the page on a grid with no fixed height. [#12587](https://github.com/handsontable/handsontable/issues/12587)
- Fixed NestedRows context menu "Insert row above/below" destroying sibling branches on a deeply-nested leaf. [#12590](https://github.com/handsontable/handsontable/issues/12590)
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
