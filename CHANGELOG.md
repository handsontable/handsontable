# Handsontable changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- This file should generally be updated automatically using our changelog script. See `.changelogs/README.md` for more information. -->

<!-- UNVERSIONED -->

## [19.0.0-rc9] - 2026-11-25

### Added
- **Breaking change**: Added treegrid accessibility to the NestedRows plugin: tree attributes on rows, Ctrl/Cmd+arrow keys on a row header to expand, collapse, or move to the parent row, and screen reader announcements. On a row header, Ctrl/Cmd+arrow keys no longer jump to the edge of the row, and Enter no longer toggles while an overlay covers the grid. [#13759](https://github.com/handsontable/handsontable/pull/13759)
- **Breaking change**: The `Loading` plugin now needs the `Dialog` plugin registered: `new Handsontable()` throws an error without it, where the loading overlay used to show nothing. Register `Dialog` alongside `Loading`. Added `dist/manifest.json` to the package: a list of every feature, the license token that names it, and the features it needs. [#14094](https://github.com/handsontable/handsontable/pull/14094)
- Added the FormulaBuilder plugin: a formula bar, an inline formula editor with colored references, cell/range/header reference picking, autocomplete, function help, and formula error indicators. DragToScroll no longer starts auto-scrolling on a mouse press that an earlier listener stopped with `stopImmediatePropagation()`, and the autocomplete, dropdown, and multiselect cell arrows ignore such a press too. [#13172](https://github.com/handsontable/handsontable/pull/13172)
- Added the `preserveTextValue` cell meta option that makes the `Formulas` plugin pass values of `text`-type cells to the calculation engine as strings, preserving leading zeros of number-like values. Aligning the escaping across every write path also changed how `loadData()`, `updateData()`, `updateSettings()`, and `setSourceDataAtCell()` feed `date`-type cells to the engine: non-ISO date-like values (for example `'123'`, `'12:30'`, or `'TRUE'`) now reach the engine as text instead of a number, a time fraction, or a boolean, a `type` set only through the `cells()` function now applies on those paths, and those paths now call the `cells()` function and the `beforeGetCellMeta` and `afterGetCellMeta` hooks once per non-formula text cell. The same work fixes the plugin addressing the wrong engine row from `setSourceDataAtCell()` on a sorted or moved grid, writing `#REF!` over a formula whose target still existed and reading a cell's `valueGetter` from the wrong row or column when detaching a row with the `NestedRows` plugin, and reading the autofill source cell's configuration from another cell when rows or columns were trimmed or moved. [#13213](https://github.com/handsontable/handsontable/pull/13213)
- Added a searchable matrix of which configuration levels each option takes effect at, and the same information to every option in the API reference. [#13305](https://github.com/handsontable/handsontable/pull/13305)
- Added the `clearManualSizes()` method to the `ManualRowResize` and `ManualColumnResize` plugins, and the `clearManualSize()` method to `ManualRowResize`, which `ManualColumnResize` already had. They discard the sizes stored by manual resizing, for one row or column or for all of them. [#13307](https://github.com/handsontable/handsontable/pull/13307)
- Added the `textExtractor` option, which writes column and row headers to an exported file, and column headers to the clipboard, as the text the grid displays instead of their raw HTML. [#13308](https://github.com/handsontable/handsontable/pull/13308)
- Added the `renderMode` option, which lets a grid, column, or cell skip repainting cells that did not change since their last render, together with the `markCellChanged()` and `markAllCellsChanged()` methods, and made the selection pass update only the cells whose selection state changed. Under `'onChange'`, a vertical scroll paints only the rows that enter the rendered area; with merged cells, the cells of the merged blocks repaint too. [#13384](https://github.com/handsontable/handsontable/pull/13384)
- Added the `SheetsBar` plugin — a tab bar for switching between sheets of a multi-sheet workbook — and the `getManualSize()`, `getManualSizes()`, and `setManualSizes()` methods to the `ManualColumnResize` and `ManualRowResize` plugins. [#13409](https://github.com/handsontable/handsontable/pull/13409)
- Added the `autoLink` option, which renders the URLs, email addresses, and phone numbers in cell values as clickable links, with a `strict: false` mode that also links bare domains and email addresses; `formulas.hyperlinks` now also accepts a `{ target, schemes }` object, and the Formulas plugin's `registerShortcuts()` and `unregisterShortcuts()` methods are deprecated no-ops because the Alt+Enter link shortcut is a core grid shortcut. [#13448](https://github.com/handsontable/handsontable/pull/13448)
- Added a `sortFixedRows` option to the `ColumnSorting` and `MultiColumnSorting` plugins. It defaults to `false`, which keeps the rows frozen by `fixedRowsTop` and `fixedRowsBottom` out of sorting, as in 18.0.0. Set it to `true` to sort the whole dataset, including both frozen areas. The option is grid-level only. [#13456](https://github.com/handsontable/handsontable/pull/13456)
- Added two ways to narrow what the `Filters` plugin covers. The new `filterFixedRows` option, set to `false`, keeps the rows frozen by `fixedRowsTop` and `fixedRowsBottom` out of filtering: they are never hidden by a filter, and their values are no longer listed under `Filter by value`. Setting `filters` to `false` for a column in the `columns` option now hides that column's filter controls in its dropdown menu. [#13522](https://github.com/handsontable/handsontable/pull/13522)
- Added the `ImportFile` plugin, which loads an `.xlsx` workbook into the grid through the ExcelJS engine: cell values and inferred types with their number, date, and time formats, dropdown sources, formulas, merged cells, frozen panes, hidden rows and columns, column widths and row heights, read-only cells from sheet protection, comments, nested headers, and, with `importStyles`, alignment, font, fill, and borders. Features the engine cannot read are reported in one console warning per call. The `ExportFile` plugin's XLSX writer now shares the same engine adapter: date and time cells export the Excel number format derived from their `dateFormat` and `timeFormat` options (a cell using the default options and the default `en-US` locale now writes `mm/dd/yyyy` and `hh:mm AM/PM` instead of `mm-dd-yy` and `h:mm:ss`; a date cell follows its `locale`, so `de-DE` writes `dd.mm.yyyy`), formula cells carry their column's number format and a cached result, sheet names are sanitized, `compression: false` writes an uncompressed archive, a formula reference qualified with a sheet name (`Rates!A1`) is written and read back unshifted (a known limitation when the referenced sheet is exported in the same workbook with headers, see the export guide), a rendered cell's font color is exported from the cell itself while a cell outside the viewport is read from its classes only, and a rendered font color inherited from a container-scoped CSS variable is no longer written to the file. `batch()`, `batchRender()`, and `batchExecution()` now resume rendering and execution when the wrapped callback throws, instead of leaving the grid suspended. [#13551](https://github.com/handsontable/handsontable/pull/13551)
- Added the `refetchAfterCreate` option to `dataProvider`. Set it to `false` to skip the automatic `fetchRows` refetch after a successful `onRowsCreate` and apply the server response to the grid yourself, for example to keep a newly inserted row on the current page while the grid is sorted. [#13563](https://github.com/handsontable/handsontable/pull/13563)
- Added the `filterValueComparator` option to set a custom order of the values in the Filters plugin's "Filter by value" list, per column or for the whole grid. [#13585](https://github.com/handsontable/handsontable/pull/13585)
- Added the `getCellDependents` and `getCellPrecedents` methods to the Formulas plugin. [#13594](https://github.com/handsontable/handsontable/pull/13594)
- Added a `showFormulas()`/`hideFormulas()` toggle to the [`Formulas`](https://handsontable.com/docs/javascript-data-grid/api/formulas/) plugin, so a formula cell can display its formula text instead of its calculated value, and a `Ctrl`+`` ` `` shortcut that toggles it. [#13611](https://github.com/handsontable/handsontable/pull/13611)
- Added a built-in XLSX engine, so `importFile: true` and `exportFile: true` read and write `.xlsx` files without ExcelJS; `engines: { xlsx: ExcelJS }` keeps working. With no engine configured, the "To Excel" context menu item is shown, `supportsExportFormat('xlsx')` and `supportsImportFormat('xlsx')` return `true`, and an XLSX export or import succeeds; `engines: { xlsx: null }` selects the built-in engine, and a per-call `engine: null` keeps the grid's engine. A non-finite number (`NaN`, `Infinity`) now exports as text. Fixed merged-cell meta left behind and `customBorders` throwing after a `loadData`/`updateData` that shrank the grid, `clearBorders()` leaving a border's meta (and its export) behind while rows were sorted or filtered, an XLSX export freezing extra columns or rows when some were hidden, an empty checkbox exporting as `FALSE`, a cleared `numeric` cell exporting as `0`, an XLSX export downloading `[object Promise]` under Zone.js (Angular), the Formulas plugin losing a validated write when `updateSettings()` or a sheet switch ran in the same task, `removeCellMeta()` throwing for an index past the grid's range (it now removes the key at that physical index, like `setCellMeta()`), an XLSX export writing currency codes such as `#,##0.00USD` that Excel repaired and other applications dropped, and dropping the leading zeros of a zero-padded format, an XLSX export of a right-to-left page writing a left-to-right sheet, a merged range with an empty first cell shifting its row in Apple's viewers, a border restored by undo under a filter or trim not being painted again, the export progress dialog showing empty for a grid inside an iframe, two overlapping imports applying in the order they finished instead of the order they started, an XLSX export with `exportFormulas` writing a formula's error result (such as `#DIV/0!`) as text instead of an error cell, an XLSX export with `exportFormulas` writing another row's formula into a cell when rows were sorted, moved, trimmed, or filtered, an XLSX export writing a currency symbol that imported back as another currency or as a plain number (it now writes the ISO 4217 code), an XLSX export writing `LET` and `LAMBDA` parameter names without Excel's `_xlpm.` prefix, custom borders staying on their old rows after `updateSettings({ trimRows })` or being lost by `trimRow()` followed by `loadData()`, a progressive `customBorders` load landing on the wrong rows after a trim or a filter, and an XLSX export writing a date before 1900 or a date that does not exist as a wrong date serial (it now exports as text). [#13634](https://github.com/handsontable/handsontable/pull/13634)
- Added a console warning when the data source has rows but Handsontable cannot find any columns in it, because the first row of `data` has no fields and neither `columns` nor `dataSchema` is set. [#13637](https://github.com/handsontable/handsontable/pull/13637)
- Added the `availableConditions` setting to the `filters` option, which chooses the operators that the **Filter by condition** lists offer, for the whole grid, per data type, or per column. [#13661](https://github.com/handsontable/handsontable/pull/13661)
- Added support for a number in the `textEllipsis` option, which clamps the text of a cell to that many lines and ends it with an ellipsis. [#13724](https://github.com/handsontable/handsontable/pull/13724)
- Added the `maxLength` option that limits the number of characters in a cell, without a custom validator. If your app already stores a custom `maxLength` key in cell settings, the built-in limit now applies to those cells, so rename your key or see the migration guide. [#13725](https://github.com/handsontable/handsontable/pull/13725)
- Added the [`beforePasteParse`](https://handsontable.com/docs/basic-clipboard/#clean-up-pasted-content-before-it-is-parsed) hook to the `CopyPaste` plugin. It fires before the clipboard content is sanitized and parsed, and passes a writable copy of the clipboard and the native `ClipboardEvent` to the callback, so you can clean pasted data without disabling the plugin. [#13726](https://github.com/handsontable/handsontable/pull/13726)
- Added the `fixedColumnsEnd` option, which freezes the last columns at the inline end edge of the grid (the right edge in LTR, the left edge in RTL), and fixed the `DragToScroll` plugin reserving the row header width on the wrong side in RTL. [#13730](https://github.com/handsontable/handsontable/pull/13730)
- Added row selection checkboxes with a "select all" checkbox in the header (the `rowSelection` option), with server-side and nested rows support, and a "check all" checkbox for checkbox columns (the `headerCheckbox` column option). Also, `setSourceDataAtCell()` now calls the `valueSetter` once per cell when an `afterSetSourceDataAtCell` listener exists. [#13735](https://github.com/handsontable/handsontable/pull/13735)
- Added the `sourceLabel` option, which lets the `value` of a key/value `source` entry in the `dropdown` and `autocomplete` cell types be an object, labeled by a property path or a function. [#13765](https://github.com/handsontable/handsontable/pull/13765)
- Added the `freezeBar` plugin, which lets users change the number of frozen rows and columns by dragging a bar on the freeze line or with the keyboard, together with the `beforeFreezeChange` and `afterFreezeChange` hooks and the `getFreezeCount()` and `setFreezeCount()` methods. [#13766](https://github.com/handsontable/handsontable/pull/13766)
- Added the `limitFixedToViewport` option, which draws only the frozen rows and columns that fit the grid and keeps the rest of it scrollable. [#13771](https://github.com/handsontable/handsontable/pull/13771)
- Added the `handsontable/themes/types` export, so a theme preset re-exported without a type annotation no longer fails declaration emit with TS2742 or TS2883. [#13866](https://github.com/handsontable/handsontable/pull/13866)
- Added a native date input to the "Is equal to" and "Is not equal to" filter conditions on `date` and `intl-date` columns. [#13878](https://github.com/handsontable/handsontable/pull/13878)
- Added the `ViewState` plugin, whose `getViewState()`, `setViewState()`, and `validateViewState()` methods capture the grid's view (sort, filters, hidden and resized rows and columns, frozen panes, pagination, selection, and scroll position) as plain JSON, check it, and restore it. [#13912](https://github.com/handsontable/handsontable/pull/13912)
- Added the `rowId` option, the `getRowId()`, `getVisualRowById()`, `getPhysicalRowById()`, and related row id methods, and the `afterRowIdsRemoved` and `afterRowIdsReset` hooks, which give each row an id that stays with its record when you sort, filter, move, insert, or remove rows. [#13914](https://github.com/handsontable/handsontable/pull/13914)
- Added the AsyncValues plugin, which fills cells from promises, one cell at a time or in batches, with a pending and an error state per cell, cancellation of stale requests, a concurrency limit, retries, and an optional undo step per run, and an optional save of the resolved values through DataProvider. Also, an open editor now keeps what the user typed when setSourceDataAtCell() writes another cell, or when a beforeChange listener vetoes a change to another cell. [#13916](https://github.com/handsontable/handsontable/pull/13916)
- Added the getAvailableConditions() method to the Filters plugin, which lists the filter conditions a column offers. A view state now restores the other columns' filters and skips the filter of a column that cannot offer its condition. [#13934](https://github.com/handsontable/handsontable/pull/13934)
- Added `handsontable/settingsSchema`: a JSON Schema of the grid, column, and cell settings, and a `validateSettings()` function that checks a configuration before you apply it and lists each problem with a path, a code, and a message. [#13955](https://github.com/handsontable/handsontable/pull/13955)
- Added `handsontable.settings-schema.js`, a CDN file that adds the `HandsontableSettingsSchema` global with `settingsSchema` and `validateSettings()`, so a page that loads Handsontable from a CDN can validate its settings. [#13965](https://github.com/handsontable/handsontable/pull/13965)
- Added dynamic-array formulas, error cells, and defined names to the XLSX export and import. With `exportFormulas`, the export writes the Formulas plugin's named expressions as defined names, the sheet-scoped ones included. The import keeps an array formula's spilled cells empty so it spills without `#SPILL!`, keeps the file's cached values where HyperFormula spills less, and registers the workbook's defined names in HyperFormula (built-in engine). The XLSX export now changes existing output too: with the Formulas plugin on, it writes each value with the type HyperFormula computed, even without `exportFormulas`, so a computed number or `TRUE`/`FALSE` is no longer written as text, and an error Excel has a code for is written as an Excel error instead of text. It also writes a formula entered with a decimal comma (`decimalSeparator: ','`) with a dot, so Excel reads `1,5` as 1.5. Fixed exported cell formulas being written one column off when columns were moved with `manualColumnMove` and hidden columns were left out with `exportHiddenColumns: false`. [#14096](https://github.com/handsontable/handsontable/pull/14096)
- Added license gating to the XLSX engine: with a license key that names a tier, `importFile` and `exportFile` skip the XLSX features the tier leaves out; a key that names no tier keeps every feature. `supportsExportFormat('xlsx')` and `supportsImportFormat('xlsx')` answer `false` when the tier leaves out the XLSX export or import. The console warning and the `license:*` entries in the import report name only the features the file or grid actually had and the caller asked to bring over, and without number formats a date or time exports as the text the grid shows. Added the `protection` option to the XLSX export, so a sheet can be protected with a password of up to 255 characters. [#14098](https://github.com/handsontable/handsontable/pull/14098)
- Added the license check of plugins: a plugin that the tier of a license key leaves out stays off, and the console and the bar under the grid name the missing features. A plugin turned off with `disablePlugin()` while its option is on now counts as off for exports, imports, row resizing, the Loading overlay, and the Undo, Redo, and "Copy with group headers" context menu items. [#14104](https://github.com/handsontable/handsontable/pull/14104)
- Added the `hidden_columns_hide` and `hidden_columns_show` keys to the column menu. List them in the `dropdownMenu` option to show the items. `dropdownMenu: true` is unchanged. A custom column menu item under one of these keys now uses the built-in action and visibility rule unless you set your own. The `MenuItemConfig` and `PredefinedMenuItemKey` types are now also exported from `handsontable`. [#14107](https://github.com/handsontable/handsontable/pull/14107)
- Added the import of the errors Excel stores as rich values, such as #SPILL! and #CALC!, to the built-in XLSX engine. Such cells used to import as #VALUE!. A cell holding a linked data type, such as Stocks, is now reported in result.dropped. [#14119](https://github.com/handsontable/handsontable/pull/14119)
- Added a "Powered by Handsontable DataGrid" bar below the grid for trial license keys (including trials issued for external use) and keys with the `attribution-bar` flag. A license bar now stays within the grid's declared `height`. [#14139](https://github.com/handsontable/handsontable/pull/14139)
- Added the `batchEvaluation` setting of the `formulas` option, which makes HyperFormula recalculate once for all changes made inside `batch()`, and the `beforeSuspendExecution`, `afterSuspendExecution`, `beforeResumeExecution`, and `afterResumeExecution` hooks. [#14268](https://github.com/handsontable/handsontable/pull/14268)
- Added the `includeSummaryResults` option of a column summary, which lets a summary count the results of other summaries inside its range. [#14271](https://github.com/handsontable/handsontable/pull/14271)
- Added a license tier: a license key can name the Professional tier, which includes every Handsontable feature, and the license key guide lists the features it includes. A key that names no tier keeps every feature. [#14284](https://github.com/handsontable/handsontable/pull/14284)
- Added an `emptyValue` option that sets what an emptied cell stores, and stopped a cell editor confirmed without any typing from overwriting the cell's value with an empty string. [#3927](https://github.com/handsontable/handsontable/issues/3927)
- Added the `AutoRowHeaderSize` plugin, which sizes the row header column to its longest label instead of clipping it. [#7147](https://github.com/handsontable/handsontable/issues/7147)
- React: Added a console warning when a Handsontable function renderer is passed to the `renderer` prop of `HotTable` or `HotColumn`, pointing to the `hotRenderer` prop instead. [#14010](https://github.com/handsontable/handsontable/pull/14010)

### Changed
- **Breaking change**: Changed `colToProp()` and `propToCol()` to return `null` when the column index or property names no column that exists and is visible, instead of returning the passed argument. Both TypeScript declarations widened to include `null`. A property name your data does not use is still returned unchanged, and the `modifyData` hook now receives `null` as its column argument for a numeric property that names no column, with its TypeScript declaration widened to match. [#13330](https://github.com/handsontable/handsontable/pull/13330)
- **Breaking change**: Changed `height: 'auto'` to no longer clip the grid, so the page or the nearest scrolling ancestor scrolls it and its rows stay virtualized. See the migration guide for the other `width` and `height` changes. [#13381](https://github.com/handsontable/handsontable/pull/13381)
- **Breaking change**: The `autocomplete`, `dropdown`, and `handsontable` cell types now default `textEllipsis` to `true`, so a long value stays on a single line and truncates with an ellipsis clear of the dropdown arrow, and `autoRowSize` sizes their rows to one line; set `textEllipsis: false` on the column to restore wrapping. [#13509](https://github.com/handsontable/handsontable/pull/13509)
- **Breaking change**: Changed icons to render as `<i class="ht-icon ht-icon-<name>">` elements driven by `--ht-icon-<name>` CSS variables, and extended the theme `icons` option to accept SVG strings, class lists (for icon fonts such as Tabler), or renderer callbacks (for Material Symbols ligatures). Pseudo-element icon selectors are removed and the Filters condition caption text moved into a `htUISelectCaptionLabel` child. Mirrored icons follow the grid's `layoutDirection` instead of an ancestor's `dir`, and a checkbox on a `-no-icons` bundle shows the theme's box with no tick instead of a native checkbox. The `iconsMap()` theme helper is deprecated in favor of `iconStyles()`; see the 19.0 migration guide. [#13639](https://github.com/handsontable/handsontable/pull/13639)
- **Breaking change**: Changed the TypeScript types of the `filters` option. The object form now accepts only `searchMode` and `filterFixedRows`, and a column's `filters` accepts only a boolean, so a misspelled key, a wrong value, or a per-column object no longer compiles. [#13662](https://github.com/handsontable/handsontable/pull/13662)
- **Breaking change**: Changed how undo and redo work: every action is now one undo step that restores the grid state it started from, so an undo puts values back on the right records after rows or columns were moved, sorted, filtered, or trimmed. Hiding, trimming, resizing, freezing, collapsing, custom borders, comments, cell meta, and the pagination page and page size are now undoable, `batch()`, `batchExecution()`, and the new `runOperation()` method group changes into one step, and the new `undo: { maxHistory }` option caps the history. With `undo: false`, nothing is recorded anymore. [#13672](https://github.com/handsontable/handsontable/pull/13672)
- **Breaking change**: Changed the narrowest width a column can be resized to, in a grid whose headers render the dropdown menu button, from 20px to the icon size plus the cell padding on both sides (32px in Main, 40px in Horizon, 24px in Classic), so the menu button stays inside its own cell. A narrow header now hides the label text first, then the sort indicator, and keeps the menu button. See the migration guide. [#13742](https://github.com/handsontable/handsontable/pull/13742)
- **Breaking change**: Changed `manualColumnFreeze` so that frozen columns can be dragged and columns can be dropped in front of them, as with `fixedColumnsStart`; to keep the old lock, return `false` from `beforeColumnMove`, as shown in the migration guide. Added the `restoreColumnPosition` option of `manualColumnFreeze`, a `finalIndex` argument to the `beforeColumnUnfreeze` and `afterColumnUnfreeze` hooks, and fixed the drop guideline being hidden under frozen columns and the selection staying on the old column after a freeze or unfreeze from the menu. [#13755](https://github.com/handsontable/handsontable/pull/13755)
- **Breaking change**: Changed `updateSettings()` so that a new `dataSchema`, with no `columns` option set, re-initializes the index mappers and the column-to-property map when the columns it defines change. The grid now resolves the column count of the new schema, and sorting, filtering, and columns that users moved, hid, or resized start over. [#13833](https://github.com/handsontable/handsontable/pull/13833)
- **Breaking change**: Changed the `colWidths` array and function to address columns by their physical index, so a column keeps its width when the user moves it, and when you insert or remove columns. Handsontable never changes the array you pass. Switching `colWidths` to or from an array, or passing a new array, clears the undo history. See the 18.1 to 19.0 migration guide to keep the old behavior. [#13834](https://github.com/handsontable/handsontable/pull/13834)
- **Breaking change**: Changed `setValue()` on a custom editor that extends `BaseEditor` so it receives the cell value instead of a string. A React `useHotEditor` or `EditorComponent`, and an Angular `HotCellEditorComponent`, receive that value too. When the editor needs a string, use `value == null ? '' : String(value)`. [#13896](https://github.com/handsontable/handsontable/pull/13896)
- **Breaking change**: Declared the `enterCommits`, `filterSelectedItems`, `notification`, `maxSelections`, `valueParser`, `searchInput`, `sourceSortFunction`, `theme`, `injectCoreCss`, and `parsePastedValue` options in the `GridSettings` TypeScript type. A value of the wrong type, an unknown `notification` key, or reading an option without a guard now fails to compile. [#13964](https://github.com/handsontable/handsontable/pull/13964)
- **Breaking change**: Changed `updateSettings()` so that a hook set to `null` removes the callbacks the settings registered for it, and fixed `colWidths: null` keeping columns at 50px instead of letting `AutoColumnSize` size them, and fixed a plugin turned on by `updateSettings()` reading its previous settings. [#14000](https://github.com/handsontable/handsontable/pull/14000)
- **Breaking change**: Changed when plugins set up their initial state: `columnSorting`, `columnSummary`, `mergeCells`, `customBorders`, `pagination`, `emptyDataState`, `nestedRows` and `dataProvider` now apply their settings before the first render, so columns under nested headers get their final width at once, and the grid renders once at init (twice when `customBorders` declares borders). The hooks that work fires (`afterColumnSort`, `afterMergeCells`, the `afterChange` of merges and summaries, `afterEmptyDataStateShow`, `beforeDataProviderFetch` and the first `fetchRows` call) now run before the `init` hook and the first render, so `getCell()` returns `null` inside them at init. The summaries of an `updateSettings()` call are written after its `afterUpdateSettings` listeners, so a listener there reads the previous summaries and, when the call also passes `columns`, a summary cell that is not read-only yet. Calling `enablePlugin()` on a running grid now applies the plugin's settings, and for `dataProvider` it fetches the data from the server. [#14080](https://github.com/handsontable/handsontable/pull/14080)
- **Breaking change**: Changed `loadData()` to drop a change that still waits for its cell's validator, instead of writing it into the new data at the same coordinates, usually a different record. This also applies when `loadData()` runs right after `setDataAtCell()` and when the new data holds the same records. `afterChange` doesn't fire for a dropped change. The DataProvider plugin writes such an edit again into its own record after the refetch that follows a save. See the migration guide. [#14109](https://github.com/handsontable/handsontable/pull/14109)
- **Breaking change**: Changed the `rowHeights` and `minRowHeights` arrays and functions to address rows by their physical index, so a row keeps its height when rows are collapsed with nested rows, filtered, trimmed, sorted, or moved, and aligned the nested rows collapse button with the row header label in rows with an exact height. Switching either option to or from an array, or passing a new array, clears the undo history. Also fixed a row inserted below another taking over that row's hidden state and manually resized height. See the 18.1 to 19.0 migration guide to keep the old behavior. [#14221](https://github.com/handsontable/handsontable/pull/14221)
- **Breaking change**: Vue: Changed the Vue 3 wrapper to type-check every `HotTable` and `HotColumn` prop in a template, so `vue-tsc` rejects a wrong value, a non-function hook prop, or `data: null` on `HotTable`. Also made the `handsontable` prop of both components, and the `getValue` prop of `HotTable`, reach the grid settings, which they did not before. See the migration guide for what to change. [#14059](https://github.com/handsontable/handsontable/pull/14059)
- Changed how the `nestedRows` plugin treats collapsed rows when the data is replaced: `updateData()` now keeps the collapsed parents, matching them by their position in the tree, while `loadData()` drops them, so `getCollapsedParents()` no longer reports parents from the previous dataset. [#13224](https://github.com/handsontable/handsontable/pull/13224)
- Changed how a clipboard with rows of unequal length is pasted: it now pastes as wide as its widest row, a shorter row empties the cells it covers, content repeating into a larger selection repeats on that width, and a merged cell reaching past the last column is trimmed to fit. [#13237](https://github.com/handsontable/handsontable/pull/13237)
- Content shaped like an HTML tag, a markup declaration, or a character reference is now what routes cell and header text through the HTML write path. Ordinary text holding `&`, `;`, `<` or `>` is written as plain text, which keeps it from stopping a grid from rendering under a Trusted Types policy. A character reference without its closing semicolon, such as `&copy 2024`, now renders literally. [#13264](https://github.com/handsontable/handsontable/pull/13264)
- When `manualColumnFreeze` is enabled, the column (dropdown) menu now offers the "Freeze column" and "Unfreeze column" entries by default, and rebuilds its item list every time it opens. [#13294](https://github.com/handsontable/handsontable/pull/13294)
- Made a grid with a pixel `width` and no `height` scroll its columns inside its own box while the page scrolls its rows, and fixed the `preventOverflow: 'horizontal'` layout (the bottom frozen rows now scroll with the page, the vertical scroll hooks fire, and the workspace width follows the container). [#13379](https://github.com/handsontable/handsontable/pull/13379)
- Improved scrolling performance by removing a redundant re-render that ran whenever the grid was scrolled across its horizontal start. [#13393](https://github.com/handsontable/handsontable/pull/13393)
- On a grid with column headers, the header now owns the gridline below it at every scroll position, so the first body row no longer renders a pixel taller than the rest and the grid's height no longer changes when it is scrolled. `columnHeaderHeight` resolves to the same border-box height at every scroll position as a result, and because that height includes the header's 1px top and bottom borders, `columnHeaderHeight: 40` leaves a 38px content box instead of 39px on an unscrolled grid. [#13418](https://github.com/handsontable/handsontable/pull/13418)
- Made a vertical scroll keep the row elements of the rows that stay rendered, so a `tr` moves with its row instead of being repainted in place and a renderer that caches per element keeps its cache across the scroll. [#13467](https://github.com/handsontable/handsontable/pull/13467)
- Improved rendering performance when rows shrink after a column resize: the viewport refill now renders only the newly added rows instead of re-rendering every visible row on each refill pass, so cell renderers and the `beforeRenderer` and `afterRenderer` hooks run once per cell for that draw. [#13481](https://github.com/handsontable/handsontable/pull/13481)
- Moved the drag behavior shared by the `manualRowResize` and `manualColumnResize` plugins into one internal module. Both plugins keep every documented method, option and hook. Their internal members are no longer part of the emitted TypeScript types, including `ManualColumnResize#startX`, which the API reference never listed but the type definitions did. [#13525](https://github.com/handsontable/handsontable/pull/13525)
- Made the frozen overlays' clone holders composited scroll containers, so a scroll frame no longer repaints the whole grid on grids with content-rich cells, and a touch pan over a frozen header now scrolls the grid instead of the page. [#13539](https://github.com/handsontable/handsontable/pull/13539)
- Changed how the `ColumnSorting` and `MultiColumnSorting` plugins sort. Each sorted column is now read in one guarded bulk pass instead of cell by cell, and the sort reorders row positions rather than per-row tuples. A column that sorts with the default comparison (text, and any type without its own sort function, such as `dropdown` or `autocomplete`) also extracts each row's comparison key once instead of on every comparison. Together, this roughly halves the time a large grid takes to sort by a text column. A grid that uses the `Formulas` or `NestedRows` plugin, a `dropdown`, `autocomplete`, or `multiSelect` column, a `columns[].data` accessor, or a column bound to a nested property path (such as `data: 'address.city'`) keeps the per-cell read. When you sort by two or more columns, `modifyData` and `modifyRowData` listeners and `valueGetter` functions now run column by column instead of row by row. [#13577](https://github.com/handsontable/handsontable/pull/13577)
- Improved filtering performance on large datasets: the `Filters` plugin now reads each filtered column as plain lists of rows and values, and creates a row's cell meta inside the filter scan instead of building the whole column's data up front. [#13579](https://github.com/handsontable/handsontable/pull/13579)
- Improved the `updateSettings()` performance with the `formulas` plugin enabled: a setting that changes the row count, such as toggling `nestedRows`, now rebuilds the formula sheet once, after the plugins update, instead of twice. A rebuild that fails now surfaces from the first read or render that needed it, and a listener that reads a cell from `afterUpdateSettings` pays that rebuild inside the read. [#13600](https://github.com/handsontable/handsontable/pull/13600)
- Improved the performance of loading data and switching sheets on grids with the AutoColumnSize and Formulas plugins enabled, by running the full column measurement once per data load instead of twice. [#13604](https://github.com/handsontable/handsontable/pull/13604)
- Changed the date, time, and datetime editors to leave the native picker closed when the keyboard opens them, so Tab works after Enter in Chromium, and fixed the time and datetime editors not focusing their input in Firefox. [#13821](https://github.com/handsontable/handsontable/pull/13821)
- Changed the double-click fill (copy-down) to stop above the first value already in the filled column and at the first gap in the neighboring column, as spreadsheet applications do, instead of filling across gaps or not filling at all. [#13906](https://github.com/handsontable/handsontable/pull/13906)
- Changed auto-sizing so a column wider than the grid is measured at its content width again, as before 16.2.0, instead of being capped at the width of the grid. This also fixes auto-sized columns that kept a wrapped, narrow width after the grid's container collapsed and returned. [#13907](https://github.com/handsontable/handsontable/pull/13907)
- Changed touch taps inside cells when visual selection is off: buttons, file inputs, and links now respond to a single tap. Heads-up: a link in such a cell is now followed on the first tap, where before that tap did nothing. [#13950](https://github.com/handsontable/handsontable/pull/13950)
- Updated the logo in the trial license badge and the lock screen to the new Handsontable branding. [#13980](https://github.com/handsontable/handsontable/pull/13980)
- Changed how a hook callback registered more than once is counted: settings that pass a function first added with `addHook()` stop the hook's earlier settings function, a callback added with `addHookOnce()` and then registered again keeps running, and in the Angular wrapper a callback passed both in the `settings` input and to `addHook()` runs once, and `removeHook()` removes it. [#14047](https://github.com/handsontable/handsontable/pull/14047)
- Changed the grid's scrollbars to run beside the scrollable area only, so they start after the headers and frozen rows or columns instead of running along the full edge of the grid, and kept the grid's border visible over them. [#14069](https://github.com/handsontable/handsontable/pull/14069)
- Changed the label of the "Filter by value" clear link from "Clear" to "Select none" in English, and to the counterpart of "Select all" in 19 other languages. Tests that match the old text need the new one. To keep the old text, override the `Filters:buttons.clear` key in a language dictionary. Fixed long labels of the two links above the list being clipped at the menu edge. [#14075](https://github.com/handsontable/handsontable/pull/14075)
- Changed the message for a missing license key: the console warning and the lock screen no longer suggest the `non-commercial-and-evaluation` key. [#14138](https://github.com/handsontable/handsontable/pull/14138)
- Changed updateSettings() to render the grid once when the new settings include data. The afterUpdateSettings hook now runs before that render, so getCell() there returns the previous render, and a React HotTable update no longer paints twice. [#14203](https://github.com/handsontable/handsontable/pull/14203)
- React: Changed `useHotEditor` so `value` updates in the same render as `setValue`, and mounted React editors inherit the grid theme `color-scheme`. [#13376](https://github.com/handsontable/handsontable/pull/13376)
- React: Changed `@handsontable/react-wrapper` to declare `react` and `react-dom` 18.0.0 or later as peer dependencies, matching the documented React 18 minimum. [#14009](https://github.com/handsontable/handsontable/pull/14009)
- Angular: Changed the wrapper to build with Angular 22, which replaces the per-file type declarations with a single bundled types file, while the supported range stays Angular 16 to 22. [#13835](https://github.com/handsontable/handsontable/pull/13835)
- Angular: Changed the `[data]` input to update the grid outside Angular's zone, like the `[settings]` input. A callback added with `addHook()` now runs outside the zone on a `[data]` change too, so async work it starts no longer triggers change detection by itself. [#14388](https://github.com/handsontable/handsontable/pull/14388)

### Deprecated
- Deprecated writing past the last column of an object data source. A paste, `populateFromArray()`, or `setDataAtCell()` still adds a property named after the column index, which no column can display, and prints a one-time console warning; the write will be ignored in Handsontable 20.0.0. Use `setDataAtRowProp()` to write a field the grid shows no column for. [#13343](https://github.com/handsontable/handsontable/pull/13343)
- Deprecated the `spliceCol()` and `spliceRow()` methods. They still work but print a one-time console warning and will be removed in 20.0.0. Use `populateFromArray()` or `alter()` instead. [#13599](https://github.com/handsontable/handsontable/pull/13599)
- Added the `sr-Latn-RS` language code for Serbian (Latin) and deprecated the `sr-SP` code, which will be removed in 20.0. [#13782](https://github.com/handsontable/handsontable/pull/13782)

### Removed
- **Breaking change**: Removed the `non-commercial-and-evaluation` license key. Handsontable now reads it, and its second form, as an invalid key, which locks the grid. Deprecated the Angular wrapper's `NON_COMMERCIAL_LICENSE` constant, which holds that key. It will be removed in 20.0. [#14144](https://github.com/handsontable/handsontable/pull/14144)
- **Breaking change**: Removed the APIs deprecated for removal in 19.0: `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, `loadManualRowHeights()`, `Handsontable.helper.sanitize()`, the `columnHeaders` export option (use `colHeaders`), and the `Settings` and `DataProviderOptions` type aliases (use `ExportFileSettings` and `DataProviderFetchOptions`). Also fixed the `CollapsibleColumns` plugin warning that nested headers were missing when a sheet of the SheetsBar plugin declares them. [#14182](https://github.com/handsontable/handsontable/pull/14182)
- Removed the unused `useHeaders` key from the `AutoRowSize` plugin's default settings. Nothing read it, so row sizing is unchanged, but `autoRowSize.getSetting()` no longer returns that key. [#13239](https://github.com/handsontable/handsontable/pull/13239)

### Fixed
- **Breaking change**: Fixed autocomplete, dropdown, and handsontable arrows wrapping onto a second line next to a long value. The `autoColumnSize` plugin now measures the arrow into the column width, so existing columns of those types can grow on upgrade. Pin a column with `width`, or the grid with `colWidths`, to keep the previous size. [#13532](https://github.com/handsontable/handsontable/pull/13532)
- **Breaking change**: Fixed `getCopyableData()` returning the raw cell value, such as a number, a boolean, or `null`, instead of the string its documentation and TypeScript type describe. `getCopyableSourceData()` still returns the stored value, and its TypeScript return type is now `unknown` instead of `string` to match. [#13559](https://github.com/handsontable/handsontable/pull/13559)
- **Breaking change**: Fixed `editor: false` being ignored by a column `type` and by checkbox cells, and added the `readOnlyStyling` option for making a grid read-only without the dimmed styling. [#13584](https://github.com/handsontable/handsontable/pull/13584)
- **Breaking change**: Fixed a numeric cell not right-aligning or getting the htNumeric class when it holds a non-numeric value. [#13615](https://github.com/handsontable/handsontable/pull/13615)
- **Breaking change**: Fixed object data with a `dataSchema` of non-`null` values and no `columns` option rendering those columns blank. Each such value now creates a column property, so the columns of a schema that mixes `null` and non-`null` values change their order. [#13943](https://github.com/handsontable/handsontable/pull/13943)
- **Breaking change**: Fixed the TypeScript type of `dataProvider.rowId` rejecting a function, which the plugin accepts. Code that reads `dataProvider.rowId` back as a string now has to narrow it. [#13969](https://github.com/handsontable/handsontable/pull/13969)
- **Breaking change**: Fixed removing the Ctrl/Cmd+C, Ctrl/Cmd+X, and Ctrl/Cmd+V shortcuts through the ShortcutManager, which now stops the Ctrl/Cmd+C, Ctrl/Cmd+X, and Ctrl/Cmd+V keys from copying, cutting, and pasting. Other native clipboard keys, such as Ctrl+Shift+V and Shift+Insert, are not blocked. The `grid` shortcut context now lists these three shortcuts by default, so `hasShortcut()` and `getShortcuts()` report them, and an application that removed its own Ctrl/Cmd+V by keys to get the native paste back must now remove it by group. [#14054](https://github.com/handsontable/handsontable/pull/14054)
- **Breaking change**: Fixed the React, Vue, and Angular wrappers so that a hook callback stops running after you remove its prop or set it to a value that is not a callback, such as `null`, `undefined`, or `false`. [#14105](https://github.com/handsontable/handsontable/pull/14105)
- **Breaking change**: Fixed spilled arrays turning into #SPILL! when a sheet is added to or removed from a HyperFormula engine that the Formulas plugin created, for example when a second grid connects to it (HyperFormula 3.1.1 or later). SHEET() and SHEETS() now also update after a sheet is renamed. After a middle sheet is removed, SHEET() returns the sheet's engine number instead of its position. [#14123](https://github.com/handsontable/handsontable/pull/14123)
- **Breaking change**: Fixed borders added from the context menu being invisible in dark color schemes: they now use the new `--ht-custom-borders-default-color` theme variable (black in light schemes). Their `color` in `getBorders()` and `getCellMeta().borders` is now the CSS value `var(--ht-custom-borders-default-color, #000)` instead of `#000`, so read it as a CSS value, not a hex string. [#14129](https://github.com/handsontable/handsontable/pull/14129)
- **Breaking change**: Fixed the Dialog plugin staying enabled after `loading: false` and ignoring a later `dialog: false`. The Loading plugin now requires the Dialog plugin instead of writing the `dialog` option, so the Dialog plugin is on while `dialog` is set or `loading` is on, and off when neither holds. If you use the Dialog plugin and set only `loading`, set `dialog: true`. [#14224](https://github.com/handsontable/handsontable/pull/14224)
- **Breaking change**: Fixed a row dragged into a gap that holds hidden rows landing on either side of the hidden rows, depending on where in the gap the pointer was released. Both halves of the gap now land the row after the hidden rows, and the `beforeRowMove` and `afterRowMove` hooks report the resolved drop index for the lower half. See the 19.0 migration guide. [#14259](https://github.com/handsontable/handsontable/pull/14259)
- **Breaking change**: Fixed a validated edit being saved into another row when the rows are sorted, moved, filtered, inserted, or removed before its validator answers. The `afterChange` and `beforeChangeRender` hooks now pass `AppliedCellChange` changes, whose row is the record's current visual row, or `null` for a record a filter or a trim took out of the visible rows, and the row of `modifyData` and `afterValidate` is `number | null`. Added the `getPhysicalRowOfChange()` method, which finds the record of such a change. See the 18.1 to 19.0 migration guide. [#14278](https://github.com/handsontable/handsontable/pull/14278)
- **Breaking change**: Fixed `rowHeights` being treated as a minimum height: a row now renders at exactly the height you set, even when it is shorter than the default row height, and content taller than the row is clipped instead of stretching it. Use `minRowHeights` to keep the previous behavior, where the value is a floor the content can grow past. [#4021](https://github.com/handsontable/handsontable/issues/4021)
- **Breaking change**: Fixed the `autocomplete`, `dropdown`, `handsontable`, and `multiselect` editors' lists being cut off by the grid's edge or by a scrolling parent – the lists now open against the browser window, so every choice that fits on screen is shown. See the migration guide for the other placement changes. [#8688](https://github.com/handsontable/handsontable/issues/8688)
- **Breaking change**: React: Fixed the React `HotColumn` props type so it no longer suggests hook callbacks such as `afterChange`, which only run from `HotTable`. A hook passed to `HotColumn` now fails with TS7006 under `noImplicitAny`. [#13783](https://github.com/handsontable/handsontable/pull/13783)
- Fixed an issue where column headers no longer matched their columns after inserting a column into a moved column order. [#10028](https://github.com/handsontable/handsontable/issues/10028)
- Fixed the `nestedRows` plugin hiding parent rows and showing orphaned child rows when `updateData()` was called with a different number of children while some parents were collapsed. [#10239](https://github.com/handsontable/handsontable/issues/10239)
- Fixed an issue where the grid scrollbars could not be reached under frozen rows, frozen columns, or the column header. [#10370](https://github.com/handsontable/handsontable/issues/10370)
- Fixed a problem where a formula updated by inserting or removing a row or column reverted to its previous state after the data was loaded back into the grid. The data is left untouched while rows or columns are sorted or moved, because the grid and the formula engine then hold different row orders. [#10388](https://github.com/handsontable/handsontable/issues/10388)
- Fixed source data validation for object data and moved columns. [#13073](https://github.com/handsontable/handsontable/pull/13073)
- Fixed missing theme icons and, in right-to-left grids, rounded corners drawn on the wrong cells, both caused by the CSS minifier lowering nested rules and logical properties for browsers below the build targets; those targets are now Chrome and Edge 130, Firefox 132, and Safari and iOS 18.2. [#13232](https://github.com/handsontable/handsontable/pull/13232)
- Fixed the grid failing to construct under a Content Security Policy that enforces Trusted Types (`require-trusted-types-for 'script'`). Handsontable now builds its own markup as DOM nodes, so it needs no Trusted Types policy and no entry in your `trusted-types` directive, and the `sanitizer` option may return a `TrustedHTML`. Three behavior changes come with it: the paste path hands your sanitizer the clipboard payload unchanged and flattens its result afterwards, `toHTML()` now sanitizes column and row headers, and character references outside a fixed set of names are no longer decoded in dialog copy or in cell text read through `toTableElement()`. See the migration guide for details. [#13244](https://github.com/handsontable/handsontable/pull/13244)
- Fixed `populateFromArray()` with the `shift_down` method, and the `Handsontable.helper.pivot()` helper, silently dropping cells when the input rows had unequal lengths. [#13254](https://github.com/handsontable/handsontable/pull/13254)
- Fixed a row or column move blocked by `beforeRowMove` or `beforeColumnMove` still adding an entry to the undo stack; impossible moves and moves that leave the order unchanged are no longer recorded either. [#13257](https://github.com/handsontable/handsontable/pull/13257)
- Fixed a crash when the `dialog`, `notification`, `emptyDataState`, `pagination`, or `loading` option was enabled in a grid nested in a cell of the `handsontable`, `autocomplete`, or `dropdown` cell type. These options now apply to the main grid only. [#13265](https://github.com/handsontable/handsontable/pull/13265)
- Fixed the alignment options dropping the cell's other class names, and undoing an alignment leaving the cell aligned left. [#13266](https://github.com/handsontable/handsontable/pull/13266)
- Fixed an in-progress cell edit landing on the wrong record, or appending rows to the source data, when rows or columns were filtered, trimmed, sorted, moved, inserted, removed, or replaced while the editor was open. The edit now follows its own record, and is discarded when a filter or trim takes that record out of view. [#13272](https://github.com/handsontable/handsontable/pull/13272)
- Fixed the autocomplete and dropdown editors re-showing a closed suggestion list and taking keyboard control back from the page when an asynchronous `source` answered after the editor had closed. A `source` function is no longer called at all once the edit has finished, and `queryChoices()` is now a no-op while no edit is in progress. [#13273](https://github.com/handsontable/handsontable/pull/13273)
- Fixed an `editor` option of `true` throwing an error instead of using the default editor. [#13278](https://github.com/handsontable/handsontable/pull/13278)
- Fixed a non-left-button click on a cell's dropdown arrow opening the cell editor. [#13295](https://github.com/handsontable/handsontable/pull/13295)
- Fixed the `autocomplete` and `dropdown` editors committing a previously suggested value instead of the one being typed. [#13297](https://github.com/handsontable/handsontable/pull/13297)
- Fixed a bug where the `average` column summary showed `NaN` once the summarized range held no values, for example after you cleared the source cells with the Delete key. It now shows `Not enough data`, the same result the `min` and `max` summaries already returned for an empty range. Ranges that still hold at least one value are unaffected, and empty cells stay excluded from both the sum and the divisor. [#13299](https://github.com/handsontable/handsontable/issues/13299)
- Fixed a bug where undoing a row removal threw an error, restored the row without its data, and stopped recording further actions when `dataSchema` was a function, either because the row objects had read-only members or because the columns used function `data` accessors. Writing to a read-only source-data member with `setSourceDataAtCell()` no longer throws (the write is skipped), and a row's own function-valued properties are no longer restored by reference on undo. [#13300](https://github.com/handsontable/handsontable/pull/13300)
- Fixed selection-dependent cell edits being lost when trimming moved their records. [#13304](https://github.com/handsontable/handsontable/pull/13304)
- Fixed a problem where filtering or trimming rows could leave the selection on a row that no longer held the record it was put on, so a paste or a Ctrl+Enter commit through that selection appended new rows to the data. Such a selection is now cleared. [#13310](https://github.com/handsontable/handsontable/pull/13310)
- Fixed the `multiselect` cell type not showing a dropdown indicator and not opening its list on a single click, unlike the `autocomplete` and `dropdown` cell types. [#13316](https://github.com/handsontable/handsontable/issues/13316)
- Fixed an error thrown when a context menu was opened over a row or column resize handle. [#13319](https://github.com/handsontable/handsontable/pull/13319)
- Fixed text selection not working inside frozen rows and columns when `fragmentSelection` is enabled. A selection now stays within the area it starts in. [#13320](https://github.com/handsontable/handsontable/pull/13320)
- Fixed a bug where `setDataAtRowProp()` and `setSourceDataAtCell()` reported the previous value of the wrong column when the property was a number and the columns were moved or remapped through `columns[].data`. The `oldValue` passed to `beforeChange`, `afterChange` and `afterSetSourceDataAtCell` now comes from the addressed cell, and undoing such a change restores the original value instead of overwriting the cell with another column's value. Data addressed by a string property was never affected. A numeric property against object-shaped data now reports the value stored under that numeric key (usually `undefined`), which is where the write itself lands. [#13322](https://github.com/handsontable/handsontable/pull/13322)
- Fixed a bug where a column's `sourceDataValidator` checked one cell but cleared a different one when the columns were moved or remapped through `columns[].data`, so setting `allowInvalid` to `false` could erase a column that was never validated. [#13323](https://github.com/handsontable/handsontable/pull/13323)
- Fixed the grid appending rows to the source data when a filter was applied right after removing rows while a cell editor was open. [#13332](https://github.com/handsontable/handsontable/pull/13332)
- Fixed unavailable context menu and column menu items being shown as rows labeled with their raw configuration key, and a `parent:child` item key throwing an error when clicked. [#13340](https://github.com/handsontable/handsontable/pull/13340)
- Fixed the row and column resize handles staying in the container after the manual resize plugins were disabled, where they swallowed clicks on the header underneath. [#13346](https://github.com/handsontable/handsontable/pull/13346)
- Fixed the guard against an endless `ResizeObserver` loop, which a busy machine could stop from engaging at all, and which permanently stopped a grid from reacting to container resizes once it did engage. The guard now measures the loop in rendering frames rather than in elapsed time, so it engages on any machine, and it reconnects the observer after a short cooldown instead of disconnecting it for good. [#13355](https://github.com/handsontable/handsontable/pull/13355)
- Fixed frozen columns painting under the scrollable table after a CSS rotate transform. [#13369](https://github.com/handsontable/handsontable/pull/13369)
- Fixed the fill border following the mouse after a double-click on the fill handle. [#13370](https://github.com/handsontable/handsontable/issues/13370)
- Fixed a custom editor closing and discarding its value when the browser focus moved into an element declared as `preventCloseElement`. [#13387](https://github.com/handsontable/handsontable/pull/13387)
- Fixed the fill handle staying in a drag state when the `fillHandle` option was disabled through `updateSettings()` in the middle of a drag, which made the fill border follow the pointer after the mouse button was released. [#13391](https://github.com/handsontable/handsontable/pull/13391)
- Fixed a grid with `height: 'auto'` showing a vertical scrollbar, and a horizontal one behind it, when it was rendered below 100% browser zoom or system display scaling. [#13392](https://github.com/handsontable/handsontable/pull/13392)
- Fixed a merged cell losing the rows that a filter or the `trimRows` plugin had removed from view when a row move split that merged cell, and a merged cell left with a single row in view being removed by any row move. [#13394](https://github.com/handsontable/handsontable/pull/13394)
- Fixed the `numeric` cell type writing its `htRight` and `htNumeric` classes into a shared cell `className` array, which put those classes on cells of other columns. [#13395](https://github.com/handsontable/handsontable/pull/13395)
- Fixed an undo of a cell edit writing to the wrong row, adding a row, or stopping the undo history from recording, when a filter or row trimming hid the edited row after the edit. Such an undo now writes the source data, so it fires `afterSetSourceDataAtCell` and `modifySourceData` instead of `beforeChange`, `afterChange`, and `modifyData`. [#13396](https://github.com/handsontable/handsontable/pull/13396)
- Fixed the "Filter by value" search box ignoring the column's locale once the filter menu had been confirmed. [#13397](https://github.com/handsontable/handsontable/pull/13397)
- Fixed the wrong gridline color between the corner cells and the first column header in grids with more than one row header. [#13399](https://github.com/handsontable/handsontable/pull/13399)
- Fixed a custom editor losing its own keyboard shortcuts after a click in its input field. [#13400](https://github.com/handsontable/handsontable/pull/13400)
- Fixed a bug where inserting a row next to a top-level row through the `nestedRows` context menu moved cell meta and row states off the rows they belonged to. `Insert row above` and `Insert row below` counted the position within the top-level rows rather than the row's position in the grid, so comments, cell classes, hidden and trimmed row states, and the row that undo removed all landed on the wrong row whenever an earlier top-level row had children. That insert no longer runs through `alter()`, so `beforeAlter` and `beforeDataSplice` no longer fire for it, matching the `Insert child row` and nested-child paths, which never fired them. Inserting next to a row that sits inside a collapsed parent still reports the wrong row to undo. [#13401](https://github.com/handsontable/handsontable/pull/13401)
- Fixed a bug where detaching a row from its parent left cell metadata, such as comments and custom class names, on the wrong rows. The detached row's own metadata is now cleared instead of being left behind on another row. [#13402](https://github.com/handsontable/handsontable/pull/13402)
- Fixed merged cells whose rows are trimmed or filtered out being deleted by a column move or a column freeze, or drawn over the wrong rows after a row or column move. [#13403](https://github.com/handsontable/handsontable/pull/13403)
- Fixed row headers drifting out of alignment with their rows after calling `AutoRowSize#clearCache()`. [#13404](https://github.com/handsontable/handsontable/pull/13404)
- Fixed the `Comments` plugin throwing when enabled a second time, and the `Formulas`, `Comments`, and `Loading` plugins keeping their hooks registered after being disabled. [#13410](https://github.com/handsontable/handsontable/pull/13410)
- Fixed the cell highlight jumping to a previously clicked cell when you Ctrl/Cmd+click a cell that is already selected. [#13412](https://github.com/handsontable/handsontable/pull/13412)
- Fixed a grid with custom row heights or column widths rendering too few rows or columns after sorting, moving, or filtering, which left blank space in the viewport and made rows appear repeated or out of order. [#13413](https://github.com/handsontable/handsontable/pull/13413)
- Fixed the context menu throwing under a Content Security Policy that enforces Trusted Types (`require-trusted-types-for 'script'`) when an item showed a check mark, which happened for "Read only", "Read-only comment", and any border already applied to the selection. The mark was built as an HTML string and written through `innerHTML`; it is now built as a DOM node, so the menu needs no Trusted Types policy and no `sanitizer`, and those items are announced to assistive technology as checkboxes, so their state is read out and not only drawn. A custom context menu or column menu item can show the same mark through a new `checked` option, which takes a boolean or a function returning one. Note that `checked` is now a reserved item property: an item that already carries one holding a boolean or a function is drawn with the mark and announced as a checkbox, so rename it to opt out, and drop any mark drawn inside `name` or the item shows two. See the migration guide. [#13420](https://github.com/handsontable/handsontable/pull/13420)
- Fixed a bug where a row, column, or data change that was vetoed, or that failed with an error, could make the grid commit an open editor into a new, unintended record, or stop the grid from opening editors at all. [#13425](https://github.com/handsontable/handsontable/pull/13425)
- Fixed an open editor committing its edit to the wrong row when a hook called `alter()` from inside another `alter()`. [#13430](https://github.com/handsontable/handsontable/pull/13430)
- Fixed the overlays not being resized when the grid's total size changed but the rendered rows did not, for example after hiding columns or filtering rows. `hot.view.adjustElementsSize()` now resizes the overlays right away instead of scheduling the resize for the next render, and nothing needs to call it any more, because the grid detects the change on its own. [#13442](https://github.com/handsontable/handsontable/pull/13442)
- Fixed the `AutoRowSize` and `AutoColumnSize` sampling options (`samplingRatio` and `allowSampleDuplicates`, plus `useHeaders` on `AutoColumnSize`) being silently ignored when changed through `updateSettings()`. They now apply, and the measured sizes are recalculated when one of them actually changes. Fixed `AutoRowHeaderSize` resetting its own `samplingRatio` and `allowSampleDuplicates` to the defaults whenever an `updateSettings()` call did not mention the plugin. All three plugins also read `samplingRatio` the same way now: it must be a whole number above zero, and any other value falls back to the default of 3. [#13443](https://github.com/handsontable/handsontable/pull/13443)
- Fixed the context menu and column menu submenus closing while the pointer was still moving towards them, and stopped a brief hover from opening a submenu after the pointer had already left the menu. [#13445](https://github.com/handsontable/handsontable/pull/13445)
- Fixed a custom renderer that caches per cell element missing its cache on every vertical scroll step, since 18.0 repainted the stationary elements in place. [#13446](https://github.com/handsontable/handsontable/issues/13446)
- Fixed a bug where the comment editor closed while the user was dragging its resize grip, and where it closed after the pointer left the editor and came straight back to it. [#13447](https://github.com/handsontable/handsontable/pull/13447)
- Fixed the Autofill plugin throwing an error on every pointer move across the page after a grid failed to initialize. [#13453](https://github.com/handsontable/handsontable/pull/13453)
- Fixed removing a nested parent row leaving its deeper descendants behind as blank rows. [#13457](https://github.com/handsontable/handsontable/pull/13457)
- Fixed a plain value written into an `autocomplete` or `dropdown` cell whose `source` is an array of `key` and `value` objects being stored as the bare label. The matching object is now stored, so a paste, `setDataAtCell()` and autofill behave like the cell editor, which already resolved the label, and a `strict` column no longer marks a valid pasted option as invalid. Undo and redo now restore such a cell exactly as it was, instead of rebuilding the object with the label as its key. Clearing such a cell now leaves it empty and honors `emptyValue`, instead of storing an object of empty halves. [#13458](https://github.com/handsontable/handsontable/pull/13458)
- Fixed a bug where a dropdown or autocomplete editor's list disappeared and could no longer be used after the edited cell was scrolled out of view and back in a fixed-height grid. [#13464](https://github.com/handsontable/handsontable/pull/13464)
- Fixed undoing the removal of a nested parent row. [#13471](https://github.com/handsontable/handsontable/pull/13471)
- Fixed an error thrown when sorting a grid whose formula engine sheet is shorter than the grid. This happens with trailing empty rows, or with a sheet the sheets bar adds at runtime, which could then no longer be switched back to. [#13478](https://github.com/handsontable/handsontable/pull/13478)
- Fixed the grid reporting a layout shift on every scroll frame (`div.wtSpreader`), which made a host page's Cumulative Layout Shift grow without bound while scrolling. [#13486](https://github.com/handsontable/handsontable/pull/13486)
- Fixed a `dropdown` column with `strict: false` accepting a value outside its `source` list unless the user had clicked that cell first. A paste, autofill, `setDataAtCell()`, `populateFromArray()` and `validateCells()` now mark such a value invalid, the same as typing it into the cell. [#13487](https://github.com/handsontable/handsontable/pull/13487)
- Fixed keyboard shortcuts, including select all, undo and redo, not working while the empty data state overlay is on screen. This covers the overlay shown while a data provider fetch is in flight, where those keys were dead too. Shortcuts that change cell content no longer run while the grid renders no cells or an overlay covers them, and the selection can no longer be moved onto a covered cell. Tab now moves the focus out of the overlay. Deactivating or unregistering a focus scope now restores the shortcut context that scope displaced. [#13489](https://github.com/handsontable/handsontable/pull/13489)
- Fixed a problem where collapsing a nested-rows section that held the selection left the grid with no selection, so it stopped answering the keyboard until it was clicked again. [#13492](https://github.com/handsontable/handsontable/pull/13492)
- Fixed the last column header being clipped by a scrollbar's width, and the root element carrying `htHasScrollX`/`htHasScrollY` for scrollbars that were never shown, after the container of a `stretchH: 'all'` or `stretchH: 'last'` grid was resized. [#13493](https://github.com/handsontable/handsontable/pull/13493)
- Fixed the confirm dialog opening with the keyboard focus left outside it, and the dialog's focus() method doing nothing on that dialog type. [#13497](https://github.com/handsontable/handsontable/pull/13497)
- Fixed a grid not selecting a cell when the user tabbed into it inside a shadow root, and a grid dropping its keyboard handling when a web component rendered in a cell was clicked or tabbed through. [#13499](https://github.com/handsontable/handsontable/pull/13499)
- Fixed a bug where the `hiddenColumns` and `hiddenRows` indicators extended one pixel beyond their cell, which made the grid report content it could not fit. A grid using `stretchH` with frozen columns showed a horizontal scrollbar with nothing to scroll, and its rows drifted apart across the frozen boundary once scrolled to the bottom. A grid using `height: 'auto'` grew a vertical scrollbar it should never have. The indicators look the same as before. [#13500](https://github.com/handsontable/handsontable/issues/13500)
- Fixed a menu item callback that throws, or that closes the menu while it opens, leaving the grid unusable for the rest of the page. [#13503](https://github.com/handsontable/handsontable/pull/13503)
- Fixed the cell selection after an overwrite paste into a column that uses a validator (e.g. `dropdown`), so it now covers all the pasted rows. [#13505](https://github.com/handsontable/handsontable/pull/13505)
- Fixed the pagination page-size select not filling its rounded corners. [#13512](https://github.com/handsontable/handsontable/pull/13512)
- Fixed the documented firing rule for the row and column removal hooks, which fire once per run of neighboring indexes. [#13518](https://github.com/handsontable/handsontable/pull/13518)
- Fixed screen readers not announcing a cell's column header. [#13519](https://github.com/handsontable/handsontable/pull/13519)
- Fixed merged cells keeping the wrong value after a column move. [#13520](https://github.com/handsontable/handsontable/pull/13520)
- Fixed an `alter` action that removed no rows or columns still being added to the undo stack. [#13521](https://github.com/handsontable/handsontable/pull/13521)
- Fixed the `Ctrl`/`Cmd`+`Enter` shortcut, so it now fills every selected cell across all selection layers, not only the layer that holds the focus. This applies both when an editor is open and when it is not, and a cell whose value is an object is left alone as it is on every other populate path. Plain `Enter` over such a selection no longer drops every layer but the focused one either - it moves the focus and keeps them all. [#13524](https://github.com/handsontable/handsontable/pull/13524)
- Fixed a column sort that skipped the last data row when spare rows overlapped bottom-fixed rows, and that left spare rows sortable when `maxRows` and `minSpareRows` were set without bottom-fixed rows. [#13526](https://github.com/handsontable/handsontable/pull/13526)
- Fixed Filter-by-value listing plaintext source values in password columns. Password values now reach the `modifyFiltersMultiSelectValue` hook as hashed display, so an existing handler on a password column either receives the hash or has its return value replaced, depending on registration order. [#13527](https://github.com/handsontable/handsontable/pull/13527)
- Fixed setBorders dropping cascaded or partial custom border sides. [#13529](https://github.com/handsontable/handsontable/pull/13529)
- Fixed pasting a clipboard taller than the remaining rows on the current page so the leading rows are kept instead of the trailing ones. [#13531](https://github.com/handsontable/handsontable/pull/13531)
- Fixed pagination snapping back to `initialPage` after next or previous when that option stayed in the settings. [#13536](https://github.com/handsontable/handsontable/pull/13536)
- Fixed the pagination and sheets bars covering a data row, being clipped inside a scrollable ancestor, or growing wider than their container when the grid had no `height` option and was sized in CSS. [#13538](https://github.com/handsontable/handsontable/pull/13538)
- Fixed missing mobile selection range handles on iPadOS. [#13540](https://github.com/handsontable/handsontable/pull/13540)
- Fixed mouse selection of a cell larger than the viewport leaving the start of the cell clipped. [#13544](https://github.com/handsontable/handsontable/pull/13544)
- Fixed the Serbian context menu label for inserting a column on the right. [#13545](https://github.com/handsontable/handsontable/pull/13545)
- Fixed inconsistent navigation over merged cells: a non-Tab horizontal move off a merged cell now always lands on the merged cell's top row, whichever row it was entered from. [#13546](https://github.com/handsontable/handsontable/pull/13546)
- Fixed full-row and full-column selection highlights drifting from headers with custom padding, including RTL columns. [#13547](https://github.com/handsontable/handsontable/pull/13547)
- Fixed the multiselect dropdown opening off-screen when there was not enough space on the right. [#13548](https://github.com/handsontable/handsontable/pull/13548)
- Fixed global and sticky RegExp validators returning inconsistent results across validateCells() runs. [#13549](https://github.com/handsontable/handsontable/pull/13549)
- Fixed custom borders configured with width 0 still painting a 1px edge. [#13550](https://github.com/handsontable/handsontable/pull/13550)
- Fixed the Show column and Show row menu items not restoring an initially hidden middle column or row from an adjacent header. [#13553](https://github.com/handsontable/handsontable/pull/13553)
- Fixed the row and column resize guide remaining visible after a held double-click autosize. [#13554](https://github.com/handsontable/handsontable/pull/13554)
- Fixed the `beforeColumnSort` and `afterColumnSort` TypeScript definitions, which omitted the `sortPossible` argument that both hooks pass. [#13555](https://github.com/handsontable/handsontable/pull/13555)
- Fixed the `alter()` method removing the wrong rows or columns when the given index points outside the table. [#13556](https://github.com/handsontable/handsontable/pull/13556)
- Fixed the `clear()` method emptying only the highlighted cell when `selectionMode` was set to `single`, and only the current page when the `pagination` plugin was enabled. `clear()` now empties every cell of the data set without selecting all cells first. As a result, it no longer triggers selection hooks such as `beforeSelectAll`, `afterSelectAll`, and `afterSelection`, it triggers `afterDeselect` only when cells were selected, and undoing it restores the selection you had before instead of selecting every cell. [#13557](https://github.com/handsontable/handsontable/pull/13557)
- Fixed the "Read only" and "Read-only comment" context menu items showing as checked when only some selected cells were read-only. They now show a dash and are announced as partly checked, clicking "Read-only comment" on such a selection sets every comment to the same state, and the `checked` option of a custom menu item accepts `'mixed'`. [#13562](https://github.com/handsontable/handsontable/pull/13562)
- Fixed an error thrown when the `nestedRows` plugin was enabled at runtime through `updateSettings()`, and made switching the plugin on or off update the number of rows the grid shows. [#13564](https://github.com/handsontable/handsontable/pull/13564)
- Fixed undo after a partial column removal recording out-of-range column indexes, and clarified that afterRemoveRow and afterRemoveCol fire on no-op removals. [#13565](https://github.com/handsontable/handsontable/pull/13565)
- Fixed the headers and the frozen rows and columns flickering while the browser window scrolls the grid. [#13567](https://github.com/handsontable/handsontable/pull/13567)
- Fixed a bug where a host page style rule targeting `span` elements changed the font family, size, weight, and spacing of the pagination labels and the multiselect cell chips. [#13571](https://github.com/handsontable/handsontable/pull/13571)
- Fixed `minRows`, `minSpareRows`, `minCols`, and `minSpareCols` not removing the empty rows and columns they added when lowered with `updateSettings()`. [#13572](https://github.com/handsontable/handsontable/pull/13572)
- Fixed a `columnSummary` endpoint with `reversedRowCoords` not following the last row when rows are added or removed via `alter()`. [#13573](https://github.com/handsontable/handsontable/pull/13573)
- Stopped rendering the cell selection, fill handle, and cell highlight on printouts, where they previously appeared as broken artifacts (an empty box and missing borders). [#13574](https://github.com/handsontable/handsontable/pull/13574)
- Fixed the "Hide rows" and "Hide columns" context menu options appearing when all rows or columns were already hidden. [#13578](https://github.com/handsontable/handsontable/pull/13578)
- Fixed a bug where calling the `init()` method more than once on the same instance created a duplicate overlays DOM structure. A repeat call now logs a warning and does nothing. [#13580](https://github.com/handsontable/handsontable/pull/13580)
- Fixed a bug where enabling or disabling the `nestedRows` plugin with `updateSettings()` left the formula engine on the previous row layout, so formulas calculated against the wrong rows. [#13583](https://github.com/handsontable/handsontable/pull/13583)
- Fixed the NestedRows plugin leaving the collapse buttons and the indentation in the row headers after being disabled. [#13590](https://github.com/handsontable/handsontable/pull/13590)
- Fixed the `disableVisualSelection: 'header'` option incorrectly hiding the `currentRowClassName` and `currentColClassName` indicators on body cells and on the current row's and column's headers. [#13595](https://github.com/handsontable/handsontable/pull/13595)
- Fixed a bug where overwriting a checkbox column with a custom renderer that rebuilt the cell through `innerHTML` rendered the checkbox unchecked and stopped it from appearing checked when clicked. [#13601](https://github.com/handsontable/handsontable/pull/13601)
- Fixed the column sorting comparator running twice when `columnSorting` (or `multiColumnSorting`) is enabled via `updateSettings`. [#13608](https://github.com/handsontable/handsontable/pull/13608)
- Fixed the `currentRowClassName` and `currentColClassName` indicators painting only the leaf header level for nested or grouped headers. [#13610](https://github.com/handsontable/handsontable/pull/13610)
- Fixed the read-only toggle from the context menu / column menu not being available to undo and redo. [#13612](https://github.com/handsontable/handsontable/pull/13612)
- Fixed rows hidden by the hiddenRows plugin becoming visible and row-header selection misbehaving after undoing their removal. [#13613](https://github.com/handsontable/handsontable/pull/13613)
- Fixed undo and redo after detaching a nested row, and an error when detaching a nested row with a trimmed child while formulas are enabled. [#13616](https://github.com/handsontable/handsontable/pull/13616)
- Fixed an error thrown when pressing Home or End in the date, time, and datetime editors. [#13619](https://github.com/handsontable/handsontable/pull/13619)
- Fixed the UMD bundles breaking on pages not served as UTF-8: the non-minified bundles failed to load, and the minified ones misparsed formula names and garbled text. [#13632](https://github.com/handsontable/handsontable/pull/13632)
- Fixed wheel and trackpad scrolling that stalled and jumped while the cursor was over a selection with `selectionHandles` enabled, and stopped hovering a selection from firing the selection hooks. [#13633](https://github.com/handsontable/handsontable/pull/13633)
- Fixed a bug where the selection handles (`selectionHandles`) were drawn on the frozen column or row line in the middle of a selection that spans a frozen pane, and duplicated on its edges. [#13635](https://github.com/handsontable/handsontable/pull/13635)
- Fixed column headers drifting out of view, and the scroll position snapping back on release, while dragging the horizontal scrollbar of a grid with no rows, or with every row filtered out or hidden. [#13636](https://github.com/handsontable/handsontable/pull/13636)
- Fixed the CSV export writing only the bottom header row when the `nestedHeaders` option is set. Every header layer is now exported, so a CSV file with nested headers starts with one header line per layer instead of one: code that skips a single header line when reading the file must skip one line per layer. Both the CSV and Excel exports now pass nested header labels through the `modifyColumnHeaderValue` hook, as the grid does, which changes the Excel header text when the hook is set. Also fixed the Excel export mishandling nested headers when a column inside a header group is hidden, or when the `NestedHeaders` plugin is disabled at runtime. [#13638](https://github.com/handsontable/handsontable/pull/13638)
- Fixed the `moveCells` drag bands being drawn on the frozen column and row boundary inside a selection that crosses a frozen pane. [#13649](https://github.com/handsontable/handsontable/pull/13649)
- Fixed the Formulas plugin keeping the children of a removed parent row when the Nested Rows plugin is enabled, and the `beforeRemoveRow` hook receiving only the parent row after an `updateSettings()` call. [#13650](https://github.com/handsontable/handsontable/pull/13650)
- Fixed the `pagination` and `filters` plugins ignoring a `dataProvider` that you add or remove with `updateSettings()` after the grid loads, and treating a `dataProvider` that a conflicting option (such as `trimRows`) blocks as server-backed: both plugins now page and filter the local rows then. Fixed a console error when you destroy the grid while `dataProvider` is still fetching. Added the `isFetching()` method to the `dataProvider` plugin. [#13652](https://github.com/handsontable/handsontable/pull/13652)
- Fixed MergeCells throwing an error, or dropping merged cells, when `mergeCells` was updated while a filter hid the merged rows. [#13660](https://github.com/handsontable/handsontable/pull/13660)
- Fixed the selection of a merged cell that crosses a frozen row or column line drawing extra selection borders and fill handles inside the cell. [#13667](https://github.com/handsontable/handsontable/pull/13667)
- Fixed column summaries after a column or row move: a summary now follows its column and keeps summarizing the same rows. `sourceColumn` and `destinationColumn` are now read as physical indexes, as documented. If your grid starts with a column order (a `manualColumnMove` array or an order restored by `persistentState`), a summary can now show up in a different column than before. [#13668](https://github.com/handsontable/handsontable/pull/13668)
- Fixed the empty data state loading overlay keeping an outdated size when a `dataProvider` fetch started after the grid was resized, which let it cover the pagination bar. [#13669](https://github.com/handsontable/handsontable/pull/13669)
- Fixed the "Read only" item of the context menu and the column menu unlocking a read-only column summary cell. The item no longer appears when the selection is only summary cells, and toggling a wider selection, such as a whole column, leaves a summary cell read-only, including after undo. Calling `setCellMeta()` or `removeCellMeta()` to make a read-only summary cell editable has no effect either; set the column summary's `readOnly` option to `false` instead. [#13670](https://github.com/handsontable/handsontable/pull/13670)
- Fixed the last column of a grid with `height: 'auto'` being cut off inside an `overflow: hidden` parent, when padding sits between the two or the grid's `width` is under 100%. [#13681](https://github.com/handsontable/handsontable/pull/13681)
- Fixed the Refetch button on the DataProvider error notification so it retries the failed page or page-size change instead of reloading the previous page. [#13685](https://github.com/handsontable/handsontable/pull/13685)
- Fixed a bug where a page-wide `scrollbar-width` rule painted scrollbars into the column headers, row headers, and frozen rows and columns. [#13687](https://github.com/handsontable/handsontable/pull/13687)
- Fixed user overrides of context menu and dropdown menu items added by plugins, such as `disabled()` on the Comments plugin's `commentsAddEdit` item, being ignored. [#13688](https://github.com/handsontable/handsontable/pull/13688)
- Fixed a TypeError thrown on render when a column or row header cell had lost its label element, and the `afterGetColHeader` hook firing twice for a column header whose content the grid had to rebuild. [#13689](https://github.com/handsontable/handsontable/pull/13689)
- Fixed the list of the `autocomplete`, `dropdown`, `handsontable`, and `multiselect` editors opening from the wrong edge of its cell on a right-to-left page scrolled sideways by the browser window. A list wider than the cell, such as the `handsontable` or `multiselect` list, could open off screen from a cell near the window's right edge. [#13702](https://github.com/handsontable/handsontable/pull/13702)
- Fixed the Read only menu item so that it can make a selection read-only when some of its cells get `readOnly` from the `cells` option. The item now leaves those cells alone, and its check mark ignores them. [#13707](https://github.com/handsontable/handsontable/pull/13707)
- Fixed a bug where the rows created by a paste past the last row were not validated when the `trimRows` plugin was active. [#13709](https://github.com/handsontable/handsontable/pull/13709)
- Fixed an uncaught error thrown when a dialog was destroyed while its transition was still running. [#13710](https://github.com/handsontable/handsontable/pull/13710)
- Fixed the default `ranges` of a Column summary endpoint not following the table when rows are added or the data is reloaded. The default range now always covers the whole table, so a row appended past the last row, a row inserted above the first row, and the rows of a longer dataset are all summed. A blank cell in that default range no longer throws when `forceNumeric` is on and `suppressDataTypeErrors` is `false`. [#13719](https://github.com/handsontable/handsontable/pull/13719)
- Fixed a paste that could overflow the current pagination page when `fragmentSelection` was enabled. [#13720](https://github.com/handsontable/handsontable/pull/13720)
- Fixed the `Formulas` plugin dropping the last column of a grid built without `data` when the first-row cell of that column was emptied and the settings were applied again. A switch to a sheet with uneven rows now loads the grid as wide as the widest row of that sheet. [#13721](https://github.com/handsontable/handsontable/pull/13721)
- Fixed "Clear column" leaving the values of the rows hidden under collapsed nested-row parents. [#13723](https://github.com/handsontable/handsontable/pull/13723)
- Fixed a dropdown menu or context menu staying open after pressing a `CollapsibleColumns` expand/collapse indicator. [#13727](https://github.com/handsontable/handsontable/pull/13727)
- Fixed an issue where a custom `noWordWrapClassName` replaced the built-in `htNoWrap` class, so cells still wrapped their content with `wordWrap: false`. Handsontable now always adds `htNoWrap` next to your class. To set another `white-space` value, use a selector stronger than `.handsontable .htNoWrap`, for example `.handsontable td.yourClass`. [#13728](https://github.com/handsontable/handsontable/pull/13728)
- Fixed merged cells that cross the `fixedRowsBottom` line shifting the frozen bottom rows by one column and losing their selection outline. [#13740](https://github.com/handsontable/handsontable/pull/13740)
- Fixed an issue where a column `width` equal to the grid `width` was ignored, and a `null` column `width` rendered at the default width instead of falling back to `colWidths`. [#13741](https://github.com/handsontable/handsontable/pull/13741)
- Fixed a whole-column selection or a select-all not growing to cover the rows that come back when nested rows are expanded or trimmed rows are restored. [#13744](https://github.com/handsontable/handsontable/pull/13744)
- Fixed an issue where a merge refused because it overlapped an existing merged cell still added an empty step to the undo history, cleared the redo history, unmerged the merged cells inside the selected range, and left merged-cell flags on cells that are not merged. A refused merge no longer fires the `beforeMergeCells` hook, so a `beforeMergeCells` listener can't make room for an overlapping merge anymore. [#13745](https://github.com/handsontable/handsontable/pull/13745)
- Fixed an issue where `updateSettings()` ignored a new value for `fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`, or `fixedColumnsEnd` after `alter()` removed a row or column, or after the ManualColumnFreeze plugin froze or unfroze a column. [#13747](https://github.com/handsontable/handsontable/pull/13747)
- Fixed merged cells in the frozen columns: a right-aligned or centered value no longer shows twice, a long value no longer makes the frozen row taller, and the rows of a merged cell keep the same heights in every pane when the grid has no row headers. [#13750](https://github.com/handsontable/handsontable/pull/13750)
- Fixed a blank area at the end of the horizontal scroll when `NestedHeaders` grows the column widths to fit long header labels. [#13751](https://github.com/handsontable/handsontable/issues/13751)
- Fixed the fill handle of a cell in a frozen top row showing over the row headers and the frozen columns after a horizontal scroll. [#13757](https://github.com/handsontable/handsontable/pull/13757)
- Fixed an issue where the frozen columns stayed misaligned with the rest of the grid when a custom renderer's content, such as an image, finished loading after the first render and changed a row's height. [#13758](https://github.com/handsontable/handsontable/pull/13758)
- Fixed an issue where selecting a cell pulled the grid back to that cell when the grid was scrolled programmatically right after selecting it. [#13768](https://github.com/handsontable/handsontable/pull/13768)
- Fixed a bug where Shift + mouse wheel scrolled the rows instead of the columns. [#13778](https://github.com/handsontable/handsontable/pull/13778)
- Fixed slow rendering, loading, and undo in grids with `date`, `time`, or `intl-datetime` columns, caused by building a new date formatter for every cell value. [#13780](https://github.com/handsontable/handsontable/pull/13780)
- Fixed the column range and the focus of a Shift+click on nested headers, so both are measured from the header or cell the range started from. [#13786](https://github.com/handsontable/handsontable/pull/13786)
- Fixed an issue where pressing Tab could not bring the focus back into a grid that the focus had left at the edge of the page. [#13787](https://github.com/handsontable/handsontable/pull/13787)
- Fixed an issue where the empty data state overlay was taller than a grid with `height: 'auto'` inside a clipping container and covered the content below it. [#13790](https://github.com/handsontable/handsontable/pull/13790)
- Fixed the `Filters` plugin rendering text inputs instead of date inputs for the "Is between" condition on `date` columns, which made dates typed in the column's display format match no rows. [#13791](https://github.com/handsontable/handsontable/pull/13791)
- Fixed Shift+Arrow on a column-header or row-header selection jumping to the edge of a merged cell it crosses, instead of extending the selection by one column or row. [#13792](https://github.com/handsontable/handsontable/pull/13792)
- Fixed the row and column that a drag selection reaches when the pointer leaves the grid past a merged cell, which could land several rows or columns off. Autofill, drag-to-scroll, move cells, and the selection handles now agree with it when every visible column is merged. [#13793](https://github.com/handsontable/handsontable/pull/13793)
- Fixed the date editor erasing a cell's date when the native date input held an incomplete date. [#13794](https://github.com/handsontable/handsontable/pull/13794)
- Fixed a column resize drag that overshot by the width of the hidden column indicator for a column next to a hidden column. The `newSize` of `beforeColumnResize` and `afterColumnResize` for such a column no longer includes the width of the indicator. [#13795](https://github.com/handsontable/handsontable/pull/13795)
- Fixed the lists of the Handsontable, autocomplete, dropdown, and multi-select editors, which landed a scrollbar's width away from their cell when the page draws its root scrollbar on the left. [#13798](https://github.com/handsontable/handsontable/pull/13798)
- Fixed the comment editor covering a cell near the viewport's left edge instead of flipping to its right side on an RTL page scrolled by the window. [#13799](https://github.com/handsontable/handsontable/pull/13799)
- Fixed a bug where a custom editor with the `portal` position opened far from its cell in a grid with the right-to-left layout direction. [#13800](https://github.com/handsontable/handsontable/pull/13800)
- Fixed a window scroll jump on a right-to-left page when the grid sits in a shrink-to-fit wrapper or is offset from the page's right edge, which made opening an editor or selecting a visible cell scroll the page. [#13801](https://github.com/handsontable/handsontable/pull/13801)
- Fixed the lists of the `handsontable`, `autocomplete`, `dropdown`, and `multiselect` editors opening past the viewport's edge in a grid the window scrolls inside a transformed or translated ancestor, and the `multiselect` list overlapping its cell when it opens above it. [#13802](https://github.com/handsontable/handsontable/pull/13802)
- Fixed the `multiselect` editor's list opening past the top or bottom of the viewport when the room around its cell was close to the list's height. [#13809](https://github.com/handsontable/handsontable/pull/13809)
- Fixed the layout of a grid that scrolls its columns in its own box while the page offsets it from the inline-start edge (an ancestor with `overflow-y: clip` or `preventOverflow: 'vertical'`, in left-to-right and right-to-left pages): the first visible column, the rendered columns, the stretched column widths, and the scroll position of a selected cell no longer include the offset. [#13810](https://github.com/handsontable/handsontable/pull/13810)
- Fixed an issue where releasing a dragged horizontal scrollbar on an RTL page scrolled by the window jumped the page back to its start. [#13811](https://github.com/handsontable/handsontable/pull/13811)
- Fixed an issue where the date values in the "Filter by value" list turned into `#bad-value#` after `updateSettings()` carried the `filters` option, for example on a React re-render. [#13814](https://github.com/handsontable/handsontable/issues/13814)
- Fixed the date editor in Firefox not focusing its input when opened with the keyboard and keeping the date picker open after the editor closed. [#13818](https://github.com/handsontable/handsontable/pull/13818)
- Fixed the selection of a merged cell that reaches into `fixedColumnsEnd`, so the frozen part is filled and outlined and shows the fill handle. `getCell(row, column, true)` now returns the cell of the frozen part for such a block instead of `null`. [#13819](https://github.com/handsontable/handsontable/pull/13819)
- Fixed a bug where a grid with `preventOverflow: 'horizontal'` and no `width` widened the page, which gained a horizontal scrollbar into empty space. The grid now clips its content at its own edges, as it does with a set `width`; the resize guide of the last column is hidden past the grid edge, and the resize still works. [#13820](https://github.com/handsontable/handsontable/pull/13820)
- Fixed the `multiselect` editor's list opening above a cell that had room for it below when the source had more entries than `visibleRows`. The list now flips at the same point as a short source with the same `visibleRows`, which moves the flip threshold for long-source `multiselect` columns. [#13823](https://github.com/handsontable/handsontable/pull/13823)
- Fixed the missing highlighted border between the corner and the first column header when the first column is selected. [#13824](https://github.com/handsontable/handsontable/pull/13824)
- Fixed notification toasts appearing at the container's far edge instead of the grid's in the end corners, and bottom-corner toasts covering the pagination bar. A toast stack's maximum width and height now follow the grid, so a small grid shows smaller toasts, and inline styles now override a custom `top`, `left`, `width` or `height` set on `.ht-notification`. [#13825](https://github.com/handsontable/handsontable/pull/13825)
- Fixed an issue where removing several columns at once from a moved column order left the headers of other columns removed in their place. [#13849](https://github.com/handsontable/handsontable/pull/13849)
- Fixed a bug where importing a theme preset (for example `handsontable/themes/static/variables/tokens/main`) or a language dictionary (for example `handsontable/i18n/languages/de-DE`) with a default import in an ES module project using `node16` or `nodenext` module resolution typed it as the module namespace instead of the preset or the dictionary, which made `registerTheme()` fail to compile and `deDE.languageCode` a type error. [#13858](https://github.com/handsontable/handsontable/pull/13858)
- Fixed an issue where Autofill copied the wrong values, or blanks, on a wide grid with the `Formulas` plugin when the data was an array of objects read through `columns`. [#13859](https://github.com/handsontable/handsontable/pull/13859)
- Fixed the fill handle filling no cells after a diagonal drag, and leaving the rows it inserts with `autoInsertRow` empty. [#13860](https://github.com/handsontable/handsontable/pull/13860)
- Fixed the type of the default import of `handsontable` and `handsontable/base` under the `node16` and `nodenext` module resolution, which was the CommonJS module namespace instead of `Handsontable`, and added the named type exports to the `Handsontable` namespace. [#13865](https://github.com/handsontable/handsontable/pull/13865)
- Fixed the fill handle adding new top-level parents instead of child rows when dragged past the last row of a nested grid. On a nested grid, `alter('insert_row_below', <last row index>)` now adds a sibling of the last row instead of a new top-level row. [#13868](https://github.com/handsontable/handsontable/pull/13868)
- Fixed errors thrown by `updateSettings()`, header rendering, and `destroy()` after a plugin was destroyed on its own with `getPlugin(name).destroy()`, and made the fill handle hide and reappear right away when the Autofill plugin is disabled, re-enabled, or destroyed. [#13879](https://github.com/handsontable/handsontable/pull/13879)
- Hid the fill handle when the selection consists of more than one range (a non-contiguous selection), so a drag can no longer fill from the last range alone and ignore the others. [#13880](https://github.com/handsontable/handsontable/pull/13880)
- Fixed `imeFastEdit` not moving the focus into the input of the date, time, intl-date, and intl-datetime editors on Firefox. [#13888](https://github.com/handsontable/handsontable/pull/13888)
- Fixed the resize handle staying on the dragged edge after an undo, and Ctrl/Cmd+Z not undoing a row or column resize when no cell was clicked first. [#13893](https://github.com/handsontable/handsontable/pull/13893)
- Fixed a crash when double-clicking a row selection checkbox while a header was selected. [#13897](https://github.com/handsontable/handsontable/pull/13897)
- Fixed an issue where the pagination bar shrank to the width of the row headers when the grid had no columns to render. [#13901](https://github.com/handsontable/handsontable/pull/13901)
- Fixed swapping the ColumnSorting and MultiColumnSorting plugins in one updateSettings() call, which turned both plugins off. [#13904](https://github.com/handsontable/handsontable/pull/13904)
- Fixed checkbox cells storing a pasted or written value that matches a template only by letter case (such as `"False"`) as text instead of the template value, and storing a written `"true"` or `"false"` as text in a row that was never rendered, and added an opt-in `checkbox` validator that marks or rejects values matching neither template. [#13910](https://github.com/handsontable/handsontable/pull/13910)
- Fixed a flicker of the custom borders on `updateSettings()` with `customBordersProgressive` enabled. The previous borders now stay visible until the new ones are applied. [#13913](https://github.com/handsontable/handsontable/pull/13913)
- Fixed a duplicated mobile selection handle on cells of a frozen column or row. [#13915](https://github.com/handsontable/handsontable/pull/13915)
- Fixed `getDataAtCol()`, `getDataAtProp()`, and `spliceCol()` reading only as many rows as the source array has when the `nestedRows` option or a `modifySourceLength` hook adds rows past it. [#13919](https://github.com/handsontable/handsontable/pull/13919)
- Fixed a string `dataProvider.rowId` reading a nested property instead of the row's own property with a dot in its name, the value the cell shows. `dataProvider.rowId` now reads the source row itself, so a function key receives that row instead of a copy, and `modifySourceData` no longer changes the id. [#13923](https://github.com/handsontable/handsontable/pull/13923)
- Fixed a Ctrl click on a sortable nested header selecting that header twice, and selecting whole columns when a drag moves from a cell into a nested header. [#13928](https://github.com/handsontable/handsontable/pull/13928)
- Fixed an issue where sorting inside `batch()` or `suspendExecution()` on an already sorted grid left the rows in the wrong order. [#13930](https://github.com/handsontable/handsontable/pull/13930)
- Fixed an issue where object data nested two or more levels deep without the `columns` option mapped to the wrong property, so the column rendered blank and an edit wrote a new top-level key. [#13932](https://github.com/handsontable/handsontable/pull/13932)
- Fixed an issue where date and datetime cells with years 0001–0099 rendered, sorted, and filtered as years 1901–1999. [#13933](https://github.com/handsontable/handsontable/pull/13933)
- Fixed an issue where turning off `collapsibleColumns` in the same `updateSettings()` call that adds a nested header level threw an error. [#13936](https://github.com/handsontable/handsontable/pull/13936)
- Fixed a merged cell in a later selection layer being highlighted darker than the cells around it, and merge()/unmerge() leaving the old highlight. The fullySelectedMergedCell-N suffix now counts the ranges that cover the merge instead of using the range index. A header selection merged via the context menu or Ctrl+M now shows the merged cell as a single focused cell. [#13938](https://github.com/handsontable/handsontable/pull/13938)
- Fixed the select editor showing another record's value when its value was refreshed on a sorted, filtered, or moved grid. [#13940](https://github.com/handsontable/handsontable/pull/13940)
- Fixed pasting into another Handsontable grid bringing back values that `beforeCopy` or `beforeCut` masked or removed. [#13941](https://github.com/handsontable/handsontable/pull/13941)
- Fixed `setSourceDataAtCell()` ignoring the column-level `sourceDataValidator` and `valueSetter` when the cell is addressed by a property name. These writes now apply the column's `valueSetter`, its cell type's value conversion, and its validator. [#13942](https://github.com/handsontable/handsontable/pull/13942)
- Fixed a bug where the Filters "Filter by value" list showed a "(Blank cells)" item for a grid with no rows. [#13945](https://github.com/handsontable/handsontable/pull/13945)
- Fixed an issue where saving an edit, or creating or removing rows, while a page change was loading sent the DataProvider grid back to the previous page. [#13953](https://github.com/handsontable/handsontable/pull/13953)
- Fixed an issue where two writes to the same cell that waited on an asynchronous validator were applied in the order the validators answered, so the older value could overwrite the newer one. The last write to a cell now wins, and a write that a newer one overtook no longer fires `afterChange`. A validator that corrects a value through `setDataAtCell()` with a source that does not end in `Validator` now wins over the change that triggered it, and that change fires no `afterChange`. [#13954](https://github.com/handsontable/handsontable/pull/13954)
- Fixed a drag of cells, rows, a column or row border, or the fill handle that was still held when `loadData()` replaced the data: it is now canceled instead of committed into the new data, and its auto-scroll stops. Also fixed AutoColumnSize measuring the previous data after `loadData()`, and `downloadFileAsync()` with the Dialog plugin exporting data loaded after the call: it now rejects instead. [#13956](https://github.com/handsontable/handsontable/pull/13956)
- Fixed an issue where a change rejected under `allowInvalid: false` was still written when the validators answered out of order. [#13959](https://github.com/handsontable/handsontable/pull/13959)
- Fixed `selectCells()` with `changeListener` set to `false` so an input outside the grid keeps focus when the call runs inside `batch()`, and when an `afterSelection` hook makes a plain selection call. [#13961](https://github.com/handsontable/handsontable/pull/13961)
- Fixed the top selection handle on touch devices being clipped by the grid edge when a selection starts in the first row without column headers or in the first column without row headers. [#13970](https://github.com/handsontable/handsontable/pull/13970)
- Fixed the fill handle of the last column and the last row being covered by an overlay scrollbar (for example, in Firefox on Windows 11) when the grid scrolls inside its own container, which made it impossible to drag. [#13972](https://github.com/handsontable/handsontable/pull/13972)
- Fixed the top selection handle on touch devices being drawn on the first visible row or column when the range start is scrolled out of view. [#13975](https://github.com/handsontable/handsontable/pull/13975)
- Fixed an issue where the grid kept stale row, column, and height measurements after a web font finished loading. Added the `afterFontsLoad` hook. [#13977](https://github.com/handsontable/handsontable/pull/13977)
- Fixed an issue where column headers and column widths stayed out of step with their columns after an `afterCreateCol` or `afterRemoveCol` hook called `render()`. [#13983](https://github.com/handsontable/handsontable/pull/13983)
- Fixed formulas that reference a sheet whose name HyperFormula reads only in quotes, such as `2026` or `Лист2`. The Formulas plugin now also feeds the engine the edits made while the plugin was off. [#13985](https://github.com/handsontable/handsontable/pull/13985)
- Fixed the `afterAsyncValueCancel` hook of the AsyncValues plugin, which reported the id of a neighboring row, or `null`, for a row that was removed or replaced. [#13990](https://github.com/handsontable/handsontable/pull/13990)
- Fixed `ShortcutContext#addShortcut()` placing a `position: 'before'` shortcut one slot too early, so it now runs directly before its `relativeToGroup` group. Pressing Enter on a collapsible column header with column sorting enabled now always collapses it. [#13991](https://github.com/handsontable/handsontable/pull/13991)
- Fixed which rows and columns count as fully visible when the grid's scrollbars differ in size from each other or from the browser default. [#14005](https://github.com/handsontable/handsontable/pull/14005)
- Fixed the first render computing the visible rows and the scrollbar without the column header. [#14013](https://github.com/handsontable/handsontable/pull/14013)
- Fixed the comment box on a merged cell spanning several rows so it takes the height of the merged range instead of a fixed 88px. [#14016](https://github.com/handsontable/handsontable/pull/14016)
- Fixed a merged cell made while rows were trimmed or filtered out, which covered a row it does not own and left its own last row empty once the rows came back. Such a merged cell now spans the removed rows between its rows, so it grows when they return. [#14017](https://github.com/handsontable/handsontable/pull/14017)
- Fixed an issue where formula cells did not repaint after the HyperFormula engine was changed from outside the grid, for example with `setCellContents()` on an external or shared engine. To repaint once after several external writes, wrap them in `engine.batch()`. [#14024](https://github.com/handsontable/handsontable/pull/14024)
- Fixed AutoColumnSize ignoring the content of merged cells. A merge that spans only rows now widens its column to fit its text, and a merge that spans several columns widens the first column it spans, so columns under long merged text get wider. [#14026](https://github.com/handsontable/handsontable/pull/14026)
- Fixed the `Formulas` plugin showing wrong values and formula text after `setIndexesSequence()` (or a sort with `sortEmptyCells: true`) put an empty or just-appended row or column ahead of rows or columns that hold content. A reorder the engine cannot take, because it needs more rows or columns than `maxRows` or `maxColumns` allow or because it moves a row or column an array formula spans, is now skipped and logs a warning. [#14027](https://github.com/handsontable/handsontable/pull/14027)
- Fixed a merged cell declared in the `mergeCells` option so it spans a trimmed or filtered row between its rows once the row comes back, and keeps that span when the same settings are sent again. [#14030](https://github.com/handsontable/handsontable/pull/14030)
- Fixed the `Formulas` plugin showing another row's values, or applying a redo in an outdated order, when an undo or redo restored a step after the rows or columns had been reordered with `setIndexesSequence()`, which is not an undo step. [#14038](https://github.com/handsontable/handsontable/pull/14038)
- Fixed a false console warning that a `dropdownMenu` item key does not match any available menu item, which a list naming Filters items logged although the Filters plugin was on. [#14039](https://github.com/handsontable/handsontable/pull/14039)
- Fixed a bug where undoing an inserted row or column in the Formulas plugin left empty rows or columns in the formula engine, which made its sheet grow with every insert and undo. [#14040](https://github.com/handsontable/handsontable/pull/14040)
- Fixed the column dropdown menu opening past the left edge of a narrow viewport, which clipped its first controls. [#14048](https://github.com/handsontable/handsontable/issues/14048)
- Fixed clearSort() restoring the wrong row order after a row was moved between two sorts or rows were inserted or removed while sorted, a collapsed column group keeping its columns hidden after a new column order split it, and nested headers labeling the wrong columns after an undone column move or a setIndexesSequence() call. [#14049](https://github.com/handsontable/handsontable/pull/14049)
- Fixed the column dropdown menu and the context menu opening past the edge of a narrow or short viewport, which clipped part of the menu. [#14051](https://github.com/handsontable/handsontable/pull/14051)
- Fixed the `Formulas` plugin bringing back formulas that pointed at the wrong rows or columns when an undo reversed a row or column removal, a row or column insert, or a cell move that came after a row or column insert or removal made while the grid was sorted or had moved rows or columns. [#14052](https://github.com/handsontable/handsontable/pull/14052)
- Fixed the selection's start and top edges showing only 1px of their 2px next to a frozen or header overlay, on the first visible column and row of a scrolled grid and on the first one after the frozen columns or rows. [#14055](https://github.com/handsontable/handsontable/pull/14055)
- Fixed `clearSort()` and `sort()` throwing after `setSortConfig()` on a grid that was never sorted or whose sorting plugin was disabled and enabled again. [#14057](https://github.com/handsontable/handsontable/pull/14057)
- Fixed CustomBorders rebuilding every border on an `updateSettings()` call whose `trimRows` value left the trimmed rows unchanged. [#14062](https://github.com/handsontable/handsontable/pull/14062)
- Fixed plugins leaving UI, options, and loading overlays behind when they are turned off or reconfigured. Search, ColumnSorting, and MultiColumnSorting reset their options to the defaults when `true` replaces an options object. The loading overlay clears on every way a DataProvider fetch ends. Dialog no longer carries one dialog's options into the next or hides on a settings re-send, and Loading acts only on its own screen. ColumnSummary no longer adds its previous total on a reload. `fixedColumnsLeft` and `fixedColumnsStart` no longer throw across separate `updateSettings()` calls. The column header row shrinks back after multi-line headers. [#14063](https://github.com/handsontable/handsontable/pull/14063)
- Fixed an issue where the "Delete comment" context menu item was enabled on a selection without any comment, and the "Read-only comment" item was disabled on a range whose highlighted cell had no comment. [#14066](https://github.com/handsontable/handsontable/pull/14066)
- Fixed `setManualSize()` of the `ManualColumnResize` and `ManualRowResize` plugins throwing an error when called before the plugin was enabled, and storing a size that isn't a finite number, such as `NaN`. [#14067](https://github.com/handsontable/handsontable/pull/14067)
- Fixed a tapped command in the context menu or the dropdown menu losing the focus it set on a touch screen. [#14068](https://github.com/handsontable/handsontable/pull/14068)
- Fixed the `afterPluginsInitialized` hook firing once per plugin when two grids were created before either called `init()`, and plugins enabling twice on a grid that declares both `columnSorting` and `multiColumnSorting`. [#14070](https://github.com/handsontable/handsontable/pull/14070)
- Fixed `Comments#getCommentAtCell()`, `Comments#getComment()`, and `Comments#getCommentMeta()` throwing `Expecting an unsigned number` for header coordinates. They now return `undefined`. [#14071](https://github.com/handsontable/handsontable/pull/14071)
- Fixed cell selection around merged cells: a selection now always covers every merged cell it touches, a merged cell whose rows a filter or `trimRows` hides no longer extends the selection over other cells, and an arrow key pressed after Tab or Enter inside a range moves on from the focused cell, not from a merged cell the focus skipped. A selection layer that Tab or Enter leaves keeps its last focused cell, as it does without merged cells. `beforeSelectionFocusSet` and `afterSelectionFocusSet` now receive the cell the focus lands on, and global `beforeSelectionHighlightSet`, `modifyTransformStart`, and `modifyTransformEnd` listeners now receive the range or step already adjusted for merged cells, as listeners added through the settings already did. Deprecated `getStartMostColumnIndex()`, `getEndMostColumnIndex()`, `getTopMostRowIndex()`, and `getBottomMostRowIndex()` of `MergedCellsCollection`. [#14073](https://github.com/handsontable/handsontable/pull/14073)
- Fixed dropping a row or column onto its own position reordering the index sequence around a trimmed row or column. The sequence change hooks no longer fire for such a drop. [#14074](https://github.com/handsontable/handsontable/pull/14074)
- Fixed `customBorders` storing borders on the wrong records or columns when one `updateSettings()` call also changed the trimmed rows or the row or column order. The plugin now enables after the plugins that reorder rows and columns. [#14076](https://github.com/handsontable/handsontable/pull/14076)
- Fixed the link in the console warning about a missing language, which opened a page that does not exist. [#14078](https://github.com/handsontable/handsontable/pull/14078)
- Fixed an issue where the `beforeRowMove` and `afterRowMove` hooks fired when a row header was pressed and released without moving the pointer. [#14082](https://github.com/handsontable/handsontable/pull/14082)
- Fixed a column header drag that moved or sorted the wrong column when `loadData()` or the `columns` option reset the column order during the drag. [#14083](https://github.com/handsontable/handsontable/pull/14083)
- Fixed the ColumnSummary plugin throwing an error when an endpoint's `ranges` option is an empty array. Such an endpoint now summarizes no rows, and a `custom` function now receives `ranges` as `[]` instead of `undefined`. [#14088](https://github.com/handsontable/handsontable/pull/14088)
- Fixed the CopyPaste plugin resetting its paste mode and header copy options to their defaults on an update of the fragmentSelection option. [#14089](https://github.com/handsontable/handsontable/pull/14089)
- Made adding many merged cells at once, and restoring them on a sheet switch, scale linearly with the number of merged cells, except for merged cells over trimmed rows. Fixed warnings and errors that showed a row or column index of 0 as blank. [#14099](https://github.com/handsontable/handsontable/pull/14099)
- Fixed `minSpareCols`, `minCols`, and inserting a column at the end of the grid placing the new `null` values at inconsistent positions in a row that is longer than the grid, and undo removing the values of such a row. The new columns are now empty, so a value past the grid width no longer shows up in them. [#14103](https://github.com/handsontable/handsontable/pull/14103)
- Fixed the multi-select editor's option labels being selectable while dragging in Safari, when Handsontable is loaded from the non-minified `handsontable.js` or `handsontable.css`. [#14106](https://github.com/handsontable/handsontable/pull/14106)
- Fixed `updateSettings()` emptying a grid backed by a `dataProvider` when the update sent `data`, and refetching the rows when it sent the same `dataProvider` object again. The React and Angular wrappers now pass only the settings that changed, so a render no longer resets the filters or the page. [#14110](https://github.com/handsontable/handsontable/pull/14110)
- Fixed an issue where a custom border disappeared on the first trim, untrim, or filter after `loadData()`. [#14117](https://github.com/handsontable/handsontable/pull/14117)
- Fixed a pending comment opening over new data after `loadData()`, and the pagination bar in a custom `uiContainer` ignoring the grid's `colorScheme` and `density`, and NestedRows staying off after it got data that isn't an array of objects, even once valid data or `nestedRows: true` came back. The Angular wrapper's `data` input now passes `'dataBinding'` as the `source` of `beforeUpdateData`, `afterUpdateData`, and `afterRowIdsRemoved`. [#14118](https://github.com/handsontable/handsontable/pull/14118)
- Fixed the `height` and `width` settings keeping the old size after they changed to `undefined` in the React and Angular wrappers. [#14120](https://github.com/handsontable/handsontable/pull/14120)
- Fixed the formula bar opening an edit on the wrong cell after an insert, a removal, or a data load moved records under the selection. [#14127](https://github.com/handsontable/handsontable/pull/14127)
- Fixed the cell editor staying at its old position when the grid's size changed during editing, which hid it under the Android soft keyboard in a WebView that resizes its content. The grid now scrolls the edited cell into view and moves the editor onto it. [#14130](https://github.com/handsontable/handsontable/pull/14130)
- Fixed editor lists, menus, and the Filters value list injecting the core stylesheet when `injectCoreCss` is set to `false`. A grid in a shadow root with that setting now needs the core CSS loaded in the document as well, or its menus render unstyled. [#14140](https://github.com/handsontable/handsontable/pull/14140)
- Fixed a strict `autocomplete` or `dropdown` cell replacing its value with another entry when confirmed without changes. Such a confirm now writes nothing, and a cell whose value matches no entry opens with no option highlighted. Also fixed `validateCells()`, `validateRows()`, `validateColumns()`, and undo and redo marking valid key/value `autocomplete` and `dropdown` cells and `multiselect` cells as invalid. [#14142](https://github.com/handsontable/handsontable/pull/14142)
- Fixed filtering with the `nestedRows` option: the "Filter by value" list now shows every value in the tree, including rows inside collapsed parents, and a filtered grid keeps the parent rows of matching rows and the child rows of matching parents. Screen readers now count only the rows that a filter or the `TrimRows` plugin leaves. Added the `modifyFiltersMatchedRows` hook, which lets you change the rows a filter keeps. [#14143](https://github.com/handsontable/handsontable/pull/14143)
- Fixed an uncaught error thrown when the grid was destroyed from the callback of `validateCells()`, `validateRows()`, `validateColumns()`, or `validateCell()`, or from a `beforeValidate` or `afterValidate` hook run by those methods or by `setDataAtCell()`. [#14148](https://github.com/handsontable/handsontable/pull/14148)
- Fixed the multiselect chip remove button changing the value of a read-only cell or a cell with `editor: false`. Such cells now draw their chips without the remove button, unless `readOnlyStyling` is `false`. [#14150](https://github.com/handsontable/handsontable/pull/14150)
- Fixed the XLSX export writing wrong colors for custom borders and `headerStyle` colors given as named, `rgb()`, or `hsl()` CSS colors. [#14151](https://github.com/handsontable/handsontable/pull/14151)
- Fixed an uncaught error thrown when the grid was destroyed from a hook of a cell edit's save: `beforeChange`, `afterSetDataAtCell`, `afterSetDataAtRowProp`, `beforeChangeRender`, `afterRender`, or `afterChange` of `setDataAtCell()` or `setDataAtRowProp()`, or a hook of an editor saved with Enter, Tab, an arrow key, a click on another cell, or a selection method, or of cells emptied with Delete or Backspace. [#14167](https://github.com/handsontable/handsontable/pull/14167)
- Fixed the grid's `aria-colcount` not updating when the number of row headers or columns changed after initialization. [#14170](https://github.com/handsontable/handsontable/pull/14170)
- Fixed an issue where changing the grid-level `type` with `updateSettings()` did not apply the editor, renderer, and validator of the new type. Passing `undefined` for `editor`, `renderer`, or `validator` now gives the option back to the type, so `updateSettings({ validator: undefined })` on a numeric grid keeps the numeric validator instead of leaving none. [#14172](https://github.com/handsontable/handsontable/pull/14172)
- Fixed an error thrown when a `beforeChange`, `afterChange`, `afterRender`, or undo and redo hook destroys the grid during a paste, cut, copy, undo, or redo. [#14173](https://github.com/handsontable/handsontable/pull/14173)
- Fixed an issue where cells that were already drawn kept the previous type's alignment class and templates after changing the grid-level `type` with `updateSettings()`, and where the result cells of the `columnSummary` plugin became editable after an `updateSettings()` call with `cells` or `cell`. [#14191](https://github.com/handsontable/handsontable/pull/14191)
- Fixed the column menu button and the sort styles staying in the group header row when `nestedHeaders` added a header row, or when `dropdownMenu` or `columnSorting` was turned off in the same update. [#14192](https://github.com/handsontable/handsontable/pull/14192)
- Fixed an error, or a sort of the new rows, when ColumnSorting was turned off or loadData() ran while a header-click sort waited for a cell validator. [#14193](https://github.com/handsontable/handsontable/pull/14193)
- Fixed a numeric cell that kept the `htRight htNumeric` classes after its column or the grid `type` changed, when its `className` was set with `setCellMeta()` or the `cell` option. [#14199](https://github.com/handsontable/handsontable/pull/14199)
- Fixed an issue where changing the columns together with the data kept manual column widths, hidden columns, and sorting on the wrong column. [#14200](https://github.com/handsontable/handsontable/pull/14200)
- Fixed the German (`de-DE` and `de-CH`) label of the "Filter by value" section in the filters dropdown menu, which read "Nach Zahlen filtern" ("filter by numbers"). [#14202](https://github.com/handsontable/handsontable/pull/14202)
- Fixed `updateSettings()` re-adding the grid's page-wide event listeners, which made every pointer move and click run Angular change detection when the call was made inside Angular's zone. [#14207](https://github.com/handsontable/handsontable/pull/14207)
- Fixed a grey box that appeared outside the grid when a row was moved while all columns were hidden. [#14209](https://github.com/handsontable/handsontable/pull/14209)
- Fixed `DropdownMenu#executeCommand()` and `ContextMenu#executeCommand()` throwing a `TypeError` for the `clear_column` command, and corrected the list of commands in their documentation. [#14210](https://github.com/handsontable/handsontable/pull/14210)
- Fixed row headers drifting away from the rows beside them when a row's content height is not a whole pixel, for example with a fractional line height. With AutoRowSize, such a row is now stored one pixel taller when its fraction is below one half (`getRowHeight()` returns 119 for a 118.27px row, not 118). [#14211](https://github.com/handsontable/handsontable/pull/14211)
- Fixed viewport getters, data getters, `getCoords()`, `getCell()`, `scrollViewportTo()`, `setDataAtCell()`, `updateData()`, and the `select*()` methods throwing a `TypeError` inside hooks that fire during initialization, such as `afterHideColumns`, `afterHideRows`, and the initial `afterLoadData`. [#14212](https://github.com/handsontable/handsontable/pull/14212)
- Fixed the grammar of the error messages thrown when a column can't be created or removed with object data, and when the Filters plugin gets fewer than three conditions in a disjunction with an extra condition. [#14213](https://github.com/handsontable/handsontable/pull/14213)
- Fixed a bug where custom context menu and column menu items that shared the same string `name` showed as one row. [#14214](https://github.com/handsontable/handsontable/pull/14214)
- Fixed year 0000 in date and datetime cells showing the same text as year 0001. The display now adds the era, for example 01/01/1 BC. [#14216](https://github.com/handsontable/handsontable/pull/14216)
- Fixed an issue where the pagination bar touched the column headers when a grid with a free height (no `height` option or `height: 'auto'`) had no rows to show, for example after a filter removed every row. The grid now keeps 150 px of empty space in that state, as the `emptyDataState` plugin does. [#14217](https://github.com/handsontable/handsontable/pull/14217)
- Fixed the comment box sitting 1px below the top edge of the selection border of its cell. [#14218](https://github.com/handsontable/handsontable/pull/14218)
- Fixed row headers that were shorter than their rows when `autoRowSize` met a merged cell whose first row or column is hidden. [#14219](https://github.com/handsontable/handsontable/pull/14219)
- Fixed the column headers, the pagination bar, and the Filters menu growing when the host page styles bare `span` or `input` elements. [#14220](https://github.com/handsontable/handsontable/pull/14220)
- Fixed formulas showing #REF! or wrong values after an initial manualRowMove or manualColumnMove order, and after a re-render that follows a row or column drag. [#14226](https://github.com/handsontable/handsontable/pull/14226)
- Fixed an issue where row headers were shorter than their rows after a trim, a filter, or the removal of its first row re-anchored a merged cell with `autoRowSize` enabled. [#14227](https://github.com/handsontable/handsontable/pull/14227)
- Fixed the `stateBefore` argument of the `beforeCellAlignment` hook so it holds only alignment class names and no longer reports custom class names such as `htBlue`. [#14228](https://github.com/handsontable/handsontable/pull/14228)
- Fixed the overlapping hit areas of the collapse button and the dropdown menu button in nested headers. [#14229](https://github.com/handsontable/handsontable/pull/14229)
- Fixed the first `updateSettings()` call accepting an init-only option (`layoutDirection`, `renderAllRows`, `renderAllColumns`, `ariaTags`) that the grid was created without. It now throws, like every later call. [#14230](https://github.com/handsontable/handsontable/pull/14230)
- Fixed Space not toggling the checkboxes of a column or row selected through its header when `navigableHeaders` is enabled. [#14232](https://github.com/handsontable/handsontable/pull/14232)
- Fixed a selection border on the `fixedRowsTop` or `fixedRowsBottom` freeze line that stopped short of the `fixedColumnsEnd` columns. [#14235](https://github.com/handsontable/handsontable/pull/14235)
- Fixed the `fixedColumnsEnd` freeze line, which moved by 1px at the end of the horizontal scroll, showed twice where a column lined up with the frozen columns, and cut the selection edge on the first of them. A selection that scrolling lines up with the `fixedColumnsStart`, `fixedColumnsEnd`, or `fixedRowsTop` area now draws its edge on the freeze line, as on any other gridline. [#14239](https://github.com/handsontable/handsontable/pull/14239)
- Fixed formulas showing a rejected or pending value, the editor closing on another cell's validation, a header sort running before a pending edit landed, and sorting, moving, pending edits, and sort state on grids built from a HyperFormula sheet, a sort after enabling formulas on a live grid, and `updateSettings({ data, formulas })` showing formulas as text. A change to a cell with a validator and `allowInvalid: false` now reaches HyperFormula after validation, so `afterFormulasValuesUpdate` fires then, and a reload through `updateSettings()` of a grid built from a HyperFormula sheet fires `afterUpdateData` instead of `afterLoadData` and `afterChange` with the `'updateData'` source instead of `'loadData'`. [#14243](https://github.com/handsontable/handsontable/pull/14243)
- Fixed a merged cell whose text was not measured by AutoRowSize and copied as empty after a row move, a column move, or a column freeze. [#14245](https://github.com/handsontable/handsontable/pull/14245)
- Fixed the frozen end column drawn off its column when the row header has more than one level, for example with the row selection checkboxes. [#14246](https://github.com/handsontable/handsontable/pull/14246)
- Fixed an issue where adding a child row through the NestedRows plugin copied the parent's children to an unrelated top-level row, which left the grid a row short after undo. [#14247](https://github.com/handsontable/handsontable/pull/14247)
- Fixed a dropdown or context menu taller than the viewport being cut off and unscrollable on touch devices, which now scroll it inside itself. [#14248](https://github.com/handsontable/handsontable/pull/14248)
- Fixed `getCellMeta()` reporting `spanned`, `rowspan` and `colspan` on a cell no merge is drawn from after a row move, a column move, or a column freeze. [#14253](https://github.com/handsontable/handsontable/pull/14253)
- Fixed `getCellMeta()` reporting a span on a merged cell's former top-left after a trim or filter was lifted, a move or freeze on a filtered grid, or an undo of a move, and a cell that a row move, a column move, or a column freeze took out of a merge on a filtered grid keeping its `hidden` flag. [#14260](https://github.com/handsontable/handsontable/pull/14260)
- Fixed the Filters condition list ending below a short viewport on a desktop page that cannot scroll, so its lower items could not be reached. [#14262](https://github.com/handsontable/handsontable/pull/14262)
- Fixed the grid's accessible name in Firefox after a sheet is renamed in the sheets bar: screen readers now read the new name. [#14263](https://github.com/handsontable/handsontable/pull/14263)
- Fixed the fixedRowsBottom rows shifting one column off their headers after a short horizontal scroll followed by a vertical scroll. [#14277](https://github.com/handsontable/handsontable/pull/14277)
- Fixed an issue where the validation of formula dependents ran on the wrong cell, or skipped the real one, when rows or columns were trimmed (for example by Filters or `trimRows`). [#14282](https://github.com/handsontable/handsontable/pull/14282)
- Fixed an issue where the comment editor lost the keyboard focus in Safari right after "Add comment" or "Edit comment" was chosen from the context menu. [#14283](https://github.com/handsontable/handsontable/pull/14283)
- Fixed a fill handle partly hidden under the frozen bottom rows after a keyboard move scrolled a row up to them, in a grid with column headers. [#14286](https://github.com/handsontable/handsontable/pull/14286)
- Fixed plugin markup staying in the header corner after row headers were turned on or the grid was scrolled horizontally. [#14287](https://github.com/handsontable/handsontable/pull/14287)
- Fixed a validated edit being saved into another column when columns are inserted or removed before its validator answers. A validator correction and a reopened editor now also stay on the edited column after a column move. [#14288](https://github.com/handsontable/handsontable/pull/14288)
- Fixed an error thrown when a touch tap selected a separator in the filters dropdown menu. [#14292](https://github.com/handsontable/handsontable/pull/14292)
- Fixed a missing screen reader announcement when a user sorts a column with a header press or the keyboard. The grid now announces the column and its new order. [#14296](https://github.com/handsontable/handsontable/pull/14296)
- Fixed a bug where a row or column resized by dragging ignored every later `rowHeights` or `colWidths` value. Passing either option to `updateSettings()` now re-declares the sizes and discards the ones stored by manual resizing. To keep the stored sizes, leave the option out of the call, or pass `manualRowResize` or `manualColumnResize` as an array. Both resize plugins also gained a `clearManualSizes()` method, and `ManualRowResize` gained the `clearManualSize()` method that `ManualColumnResize` already had. [#4371](https://github.com/handsontable/handsontable/issues/4371)
- Fixed `minSpareRows` repeatedly adding rows, and `isEmptyRow()` and `isEmptyCol()` misreporting, when `dataSchema` sets a default value on a nested property such as `{ data: 'meta.active' }`. [#5069](https://github.com/handsontable/handsontable/issues/5069)
- Fixed pasting a multi-cell block over a merged cell leaving the merge in place, which stored every pasted value but showed only the top-left one. The destination merge is now removed, as in Excel and Google Sheets, and a single undo restores both the data and the merge. Pasting a single value still leaves the merge intact and writes only its top-left cell. [#5092](https://github.com/handsontable/handsontable/issues/5092)
- Fixed the `freeze_column` and `unfreeze_column` items not working as keys of a custom column (dropdown) menu. [#5429](https://github.com/handsontable/handsontable/issues/5429)
- Fixed a shortened `columns` array, sent together with `data`, rendering and validating a column with the previous column's settings. [#5543](https://github.com/handsontable/handsontable/issues/5543)
- Fixed a bug where the `cell` option was erased when `updateSettings()` was called with the `columns` or `cells` option. Values declared through `cell` now persist across such calls, and follow their row through sorting and row moves. Passing `cell` again still replaces every previously declared entry, and a later `setCellMeta()` call still wins over the declared value. [#5661](https://github.com/handsontable/handsontable/issues/5661)
- Fixed the `mergeCells` plugin drawing the grid more times than needed while it initialized. [#5687](https://github.com/handsontable/handsontable/issues/5687)
- Fixed a bug where a cell holding an empty string counted as the number zero in a column summary, so `min`, `max`, `count`, and `average` changed when a cell was blank. Such a cell is now skipped, matching a cell cleared with the Delete key. [#5905](https://github.com/handsontable/handsontable/issues/5905)
- Fixed a bug where the `beforeInit` hook passed in the settings object never fired. Such callbacks now run, before the grid is fully initialized. [#5933](https://github.com/handsontable/handsontable/issues/5933)
- Fixed sorting leaving the last rows of a filtered grid unsorted when `minSpareRows` was set. [#5983](https://github.com/handsontable/handsontable/issues/5983)
- Fixed a bug where a modifier key stayed stuck in the pressed state after an operating system shortcut consumed its `keyup` event, so arrow keys added selection layers instead of moving the selection. [#6012](https://github.com/handsontable/handsontable/issues/6012)
- Fixed the `rowHeaderWidth` option ignoring values passed as strings. Both `rowHeaderWidth` and `columnHeaderHeight` now accept a pixel size written as a string, either as a bare number (`'100'`) or with the unit (`'100px'`), in the scalar and the per-level array form alike. A value that states no pixel count, such as `'50%'` or `'20em'`, is ignored in favor of the default size and reported once in the console. [#6154](https://github.com/handsontable/handsontable/issues/6154)
- Fixed a grid with no `height` set rendering taller than its own container when the browser zoom or the system display scaling was below 100%, which made the bottom rows overlap the element under the grid and cut off the last row headers. [#6280](https://github.com/handsontable/handsontable/issues/6280)
- Fixed the grid leaving a blank area under the last rendered row when the rows shrank after a column autosize or a data change, until the next scroll. [#6452](https://github.com/handsontable/handsontable/issues/6452)
- Fixed the "filter by value" list changing a column's filter conditions on its own: editing a cell no longer adds the typed value to the conditions, and confirming a list that can't show every selected value no longer drops the rest. [#6471](https://github.com/handsontable/handsontable/issues/6471)
- Fixed the first column rendering 1px narrower than the other columns when row headers are enabled, and the row header growing by 1px when the grid was scrolled horizontally. [#6673](https://github.com/handsontable/handsontable/issues/6673)
- Fixed `selectRows()`, `selectColumns()`, and `selectAll()` to accept an optional `changeListener` argument, so passing `false` keeps focus on an input outside the grid. [#7383](https://github.com/handsontable/handsontable/issues/7383)
- Fixed pasted columns being dropped when the clipboard's first row held fewer cells than a later row. [#7389](https://github.com/handsontable/handsontable/issues/7389)
- Fixed a bug where enabling the `hiddenRows` or `hiddenColumns` plugin alongside a cell `className` given as an array stopped the grid from rendering, or merged the array entries into a single invalid CSS class. The `afterHiddenRow` and `afterHiddenColumn` markers are now matched as whole class names, so a cell whose own class contains the marker name still gets the marker. [#7427](https://github.com/handsontable/handsontable/issues/7427)
- Fixed a bug where a cell marked as invalid lost its highlight after `updateSettings()` was called with the `cell`, `cells`, or `columns` option, while the cell kept the invalid value. This also affected cells still being checked by an asynchronous validator. In React, it happened on every re-render of a grid that has `HotColumn` children; in Angular, on every change to the `settings` input. [#7553](https://github.com/handsontable/handsontable/issues/7553)
- Fixed a bug where re-applying an unchanged `mergeCells` configuration through `updateSettings()` cleared the merged-away cells again, firing `beforeChange` and `afterChange` for values that did not change. A re-applied merge area now clears only the cells that still hold a value. [#7555](https://github.com/handsontable/handsontable/issues/7555)
- Fixed merged cells drawing on top of the rows below them after a collapsed `nestedRows` parent, a filter, or `trimRows` removed rows from inside the merge. A merged cell now spans only the rows of its own that are still shown, and is restored to its full span once they come back. [#7686](https://github.com/handsontable/handsontable/issues/7686)
- Fixed a bug where inserting a row next to a nested child row through the `nestedRows` context menu left cell meta behind: comments, cell classes, and any other stored meta stayed on their old rows instead of moving down with the data. Affected `Insert row above`, `Insert row below`, and `Insert child row`. [#7727](https://github.com/handsontable/handsontable/issues/7727)
- Fixed the comment tooltip not opening when you hover a commented cell in a grid rendered inside a shadow root. [#8624](https://github.com/handsontable/handsontable/issues/8624)
- Vue: Fixed `@handsontable/vue3` publishing no TypeScript declaration files despite declaring the `types` field, and exposed `HotTableProps` from the package's entry point. [#13331](https://github.com/handsontable/handsontable/pull/13331)
- Vue: Fixed the Vue 3 wrapper rendering a different default `HotTable` container `id` on the server and in the browser, which logged a hydration mismatch warning in Nuxt. The generated `id` is now unique per instance and set after mounting. [#13982](https://github.com/handsontable/handsontable/pull/13982)
- Vue: Fixed an unchanged `themeName` being re-sent to `updateSettings()` on every reactive change, which slowed each cell edit. [#14058](https://github.com/handsontable/handsontable/pull/14058)
- Vue: Fixed the Vue 3 wrapper taking back a setting, such as `colHeaders`, that an app set with `updateSettings()`. An unchanged prop is no longer sent again after the app replaced its value, so the `alter()` then `updateSettings({ colHeaders })` flow keeps the new headers. [#14231](https://github.com/handsontable/handsontable/pull/14231)
- Vue: Fixed an issue where a new `data` array passed to `HotTable` in the Vue 3 wrapper did not reach the grid. An array built in the template (for example `rows.map(...)`) now reloads the grid on every render of the parent component, as in the React and Angular wrappers. [#14244](https://github.com/handsontable/handsontable/pull/14244)
- React: Fixed React custom editors not committing `setValue` after a click on the editor UI. [#13374](https://github.com/handsontable/handsontable/issues/13374)
- React: Fixed HotTable throwing "Rendered fewer hooks than expected" when the id prop was added or removed across re-renders. [#13609](https://github.com/handsontable/handsontable/pull/13609)
- React: Fixed the `onOpen` callback of `useHotEditor` and `EditorComponent` not receiving the event that opened the editor. `EditorComponent` now calls `onOpen` after the editor is positioned. [#13895](https://github.com/handsontable/handsontable/pull/13895)
- React: Fixed the React wrapper turning off on-by-default options, such as `copyPaste`, when a prop is `undefined`. An `undefined` prop now counts as not passed, so the option keeps its default. [#13976](https://github.com/handsontable/handsontable/pull/13976)
- React: Fixed `next build` failing with `createContext is not a function` when a Next.js Server Component imports `HotTable`. The React wrapper's ES and CommonJS builds now start with the `'use client'` directive. [#14008](https://github.com/handsontable/handsontable/pull/14008)
- React: Fixed a crash when a Handsontable editor class was passed to the `editor` prop of `HotTable` or `HotColumn`, and a broken editor when an editor name was passed. The editor now applies as if passed to `hotEditor`, and a console warning points to that prop. [#14141](https://github.com/handsontable/handsontable/pull/14141)
- React: Fixed a `type` set on `HotTable` getting the text editor and renderer instead of the type's own. Such grids now show that type's editor and formatting. [#14147](https://github.com/handsontable/handsontable/pull/14147)
- React: Fixed an `EditorComponent` editor staying at its old position when the grid resized without scrolling, and staying open but hidden after its cell scrolled out of view. [#14149](https://github.com/handsontable/handsontable/pull/14149)
- React: Fixed React component-based cell renderers in rows fixed to the bottom (`fixedRowsBottom`) going blank and losing their state after a vertical scroll. [#14153](https://github.com/handsontable/handsontable/pull/14153)
- React: Fixed a bug where the `editor` and `hotEditor` props did not accept a boolean in the React wrapper. Setting either to `false` now disables editing on `HotTable` and on `HotColumn` (the reported `<HotColumn editor={false} />` case keeps working as asked), unless a component is passed to `editor` or an editor is named in `hotEditor`, both of which still win. Setting either to `true`, or to another falsy value such as `null`, is now treated as if the prop were not provided, so the cell keeps the editor its column type or the grid supplies instead of throwing or locking. The `renderer` and `hotRenderer` props are unchanged. [#7561](https://github.com/handsontable/handsontable/issues/7561)
- React: Fixed a bug where a component-based renderer in a frozen row or column left the cell empty in one of the two tables the grid draws it in, which made the frozen area stop lining up with the rest of the rows. [#9063](https://github.com/handsontable/handsontable/issues/9063)
- Angular: Fixed a bug where the grid rendered at zero height when the `height` option was relative (for example `'100%'`) and the `<hot-table>` sat in a parent with a fixed height, which also showed up as the grid disappearing inside a CSS-transformed ancestor. [#13690](https://github.com/handsontable/handsontable/pull/13690)
- Angular: Fixed an error logged on every server request when the grid renders on the server, and an error logged on click after the page hydrates. [#14007](https://github.com/handsontable/handsontable/pull/14007)
- Fixed `customBorders` edges that were not drawn on the first column and the first row after the frozen ones. [#14294](https://github.com/handsontable/handsontable/pull/14294)
- Fixed the XLSX export rounding numbers in a column whose `numericFormat` sets no fraction digits, such as a currency format with no `minimumFractionDigits`, and the XLSX import rounding numbers under a format with optional fraction digits, such as `0.##`. [#14376](https://github.com/handsontable/handsontable/pull/14376)

## [18.1.3] - 2026-11-20

### Fixed
- Fixed slow scrolling of grids with many custom borders. [#13908](https://github.com/handsontable/handsontable/pull/13908)

## [18.1.2] - 2026-10-07

### Changed
- Changed entitlement license keys to protect their human-readable text as well as their bracketed block, so the block alone, edited text, or text after the block makes a current key invalid, while a rewrapped, one-line, or `\n`-escaped key still works. [#13743](https://github.com/handsontable/handsontable/pull/13743)

### Fixed
- Fixed entitlement license keys whose bracketed block was broken across lines, for example by an email client, reading as invalid and locking the grid. [#13760](https://github.com/handsontable/handsontable/pull/13760)

## [18.1.1] - 2026-09-15

### Fixed
- Fixed copying, cutting, and pasting doing nothing in a grid embedded in a Salesforce Lightning Web Component. [#13388](https://github.com/handsontable/handsontable/issues/13388)
- Fixed a `filters` plugin crash thrown when a cell in a filtered column was edited, or the data was replaced with a filter active, after `updateSettings()` was called with the `filters` option (as the React and Angular wrappers do on every update). [#13480](https://github.com/handsontable/handsontable/pull/13480)

## [18.1.0] - 2026-09-01

### Added
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

### Changed
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

### Removed
- Removed leftover Pikaday styles from the themes. [#13156](https://github.com/handsontable/handsontable/pull/13156)

### Fixed
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

### Security
- Fixed pasted HTML being able to run scripts, and applied the `sanitizer` option to the surfaces that previously skipped it. [#13236](https://github.com/handsontable/handsontable/pull/13236)
- Fixed the `dialog` plugin interpolating an unvalidated `template.id` into the dialog's `id` attribute, and the `loading` plugin rendering its `title` and `description` options as HTML. Those two `loading` options now render as text, so markup passed in them shows up literally instead of being interpreted; use `icon` for markup. The button `type` option of the `dialog`, `emptyDataState`, and `notification` plugins is now resolved where the markup is built. [#13242](https://github.com/handsontable/handsontable/pull/13242)

## [18.0.0] - 2026-06-30

### Added
- **Breaking change**: Added wrapper layout slots and a `layout` option to control the order of UI elements rendered around the grid (pagination, dialog). The license notification always renders last in the bottom area and is not orderable. Built-in UI now mounts into dedicated wrapper containers, which changes the root DOM structure. [#12094](https://github.com/handsontable/handsontable/issues/12094)
- Re-exported `CellMeta`, `CellProperties`, `ColumnSettings`, `GridSettings` and other public types as named top-level imports from `handsontable` and `handsontable/base`. [#11240](https://github.com/handsontable/handsontable/issues/11240)
- Added `hashRevealDelay` option to the password cell type, which briefly shows each typed character before masking it. [#12491](https://github.com/handsontable/handsontable/issues/12491)
- Added the `visibleWhen` nested-header option (`'collapsed'`, `'expanded'`, `'always'`) that lets you choose which columns of a collapsible group stay visible when the group is collapsed or expanded. [#12776](https://github.com/handsontable/handsontable/issues/12776)

### Changed
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
- Angular: Added support for installing Angular 16 through 22, without the --force flag [#12752](https://github.com/handsontable/handsontable/issues/12752)
- Reduced memory usage and improved initialization time for large datasets by no longer materializing cell metadata for every cell during source data validation. [#12847](https://github.com/handsontable/handsontable/pull/12847)

### Deprecated
- Deprecated `saveManualColumnWidths()`, `loadManualColumnWidths()`, `saveManualRowHeights()`, and `loadManualRowHeights()`. The methods do nothing, log a deprecation warning, and will be removed in the next major release. Registering the `persistentStateSave`, `persistentStateLoad`, or `persistentStateReset` hook now logs a warning that 17.0 removed it. [#12727](https://github.com/handsontable/handsontable/pull/12727)

### Removed
- **Breaking change**: Removed the numbro, moment.js, DOMPurify, and @handsontable/pikaday dependencies. [#12689](https://github.com/handsontable/handsontable/issues/12689)

### Fixed
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
- Vue: Fixed a Vue 3 wrapper crash on cell edit when `contextMenu` or `dropdownMenu` had `uiContainer` set to a DOM element under the Vue mount root. [#12475](https://github.com/handsontable/handsontable/issues/12475)
- React: Fixed React component renderers being unmounted and visibly cleared on every grid render after a cell edit. [#12494](https://github.com/handsontable/handsontable/issues/12494)
- React: Fixed an issue where `HotColumn` children removed from a `HotTable` left phantom columns behind in the React wrapper. [#12596](https://github.com/handsontable/handsontable/issues/12596)
- Angular: Fixed subscription leak, missing EmbeddedViewRef cleanup, repeated registerRenderer calls, wrong constructor.name, incorrect prop type, missing null guard in ngOnDestroy, premature editor destruction, redundant double-destroy of already-swept renderer refs, and stale editor reuse when a different column takes an index. [#12657](https://github.com/handsontable/handsontable/issues/12657)
- Fixed cell meta set with `setCellMeta` (for example, `readOnly`) being reset by `updateSettings`. [#12811](https://github.com/handsontable/handsontable/issues/12811)
- Reduced memory usage during scrolling and fixed potential out-of-memory errors on very large datasets. [#12844](https://github.com/handsontable/handsontable/pull/12844)

## [17.1.0] - 2026-05-19

### Added
- Added a hit area for dropdown menu and collapsible buttons [#12070](https://github.com/handsontable/handsontable/pull/12070)
- Added `rowspan` support to the NestedHeaders plugin, allowing column headers to span multiple header rows. [#191](https://github.com/handsontable/handsontable/issues/191)
- Added the DataProvider plugin and `dataProvider` table option for server-side row loading and mutations. [#12147](https://github.com/handsontable/handsontable/pull/12147)
- Added XLSX export support to the ExportFile plugin [#12166](https://github.com/handsontable/handsontable/pull/12166)
- Added build weight comparison tables to the Modules guide, showing the minified and gzip size added by each optional module when imported on top of `handsontable/base`. [#12262](https://github.com/handsontable/handsontable/issues/12262)
- Added Notification plugin for non-blocking toast notifications. [#12299](https://github.com/handsontable/handsontable/issues/12299)
- Added long-press gesture detection on touch devices to open the context menu. [#12306](https://github.com/handsontable/handsontable/issues/12306)
- Added dedicated `paginationButton*` theme tokens so pagination navigation button colors can be customized independently for default, hover, focus, and disabled states via the theme builder. [#12404](https://github.com/handsontable/handsontable/issues/12404) [#12317](https://github.com/handsontable/handsontable/issues/12317)

### Changed
- Added a frame-based e2e test wait helper and replaced selected hook test sleeps. [#12161](https://github.com/handsontable/handsontable/pull/12161)
- Improve the rendering performance [#12189](https://github.com/handsontable/handsontable/pull/12189)
- Change the columnHeaders property name to colHeaders in the exportFile plugin [#12224](https://github.com/handsontable/handsontable/issues/12224)
- Improve rendering performance for fast scrollbar movements [#12235](https://github.com/handsontable/handsontable/pull/12235)
- Angular: Modernized the Angular wrapper to align with Angular 17–19, simplify setup, reduce dependencies, and clean up tooling. [#12451](https://github.com/handsontable/handsontable/issues/12451)

### Fixed
- Fixed an issue where the Nested Rows plugin was disabled after calling updateSettings with an empty data array. [#10556](https://github.com/handsontable/handsontable/issues/10556)
- Fixed `setSourceDataAtCell()` updating parent rows instead of nested child rows when `nestedRows` is enabled. [#10657](https://github.com/handsontable/handsontable/issues/10657)
- Fixed a stack overflow error when pasting large datasets (50,000+ rows) by optimizing array operations in the HTML table parser. [#11784](https://github.com/handsontable/handsontable/issues/11784)
- Fixed incorrect JSDoc type annotations for the `modifyAutofillRange` hook parameters. The parameters `entireArea` and `startArea` are now correctly documented as `number[]` (a flat 4-element array) instead of the generic `Array` type, and the `@returns` type annotation has been added. [#11862](https://github.com/handsontable/handsontable/issues/11862)
- Fixed filter by value input performance degradation when searchMode: apply option is enabled. [#12104](https://github.com/handsontable/handsontable/issues/12104)
- Fixed `getCellMetaAtRow()` to always return cell metadata in physical column order. [#12109](https://github.com/handsontable/handsontable/pull/12109)
- Fixed the `modifyAutofillRange` hook type signature to match runtime tuple arguments and return value [#12113](https://github.com/handsontable/handsontable/issues/12113)
- Fixed incorrect parsing of comma-grouped values in numeric cells [#12114](https://github.com/handsontable/handsontable/issues/12114)
- Fixed comment editor positioning for merged cells [#12115](https://github.com/handsontable/handsontable/pull/12115)
- Fixed the Filters plugin incorrectly applying filter conditions after columns were moved with the ManualColumnMove plugin. [#11832](https://github.com/handsontable/handsontable/issues/11832)
- Fixed column resizing being misaligned and calculating incorrect widths when the grid container has a CSS `transform: scale()` applied. [#11838](https://github.com/handsontable/handsontable/issues/11838)
- Fixed an issue where the `stretchH: 'last'` option ignored the column's defined `width` value when the viewport was too narrow, causing the last column to shrink to `0px`. As of 17.1.0, the defined `width` is always respected — the last column will never be rendered below its configured width, regardless of viewport size. Prior to this fix, a sufficiently narrow container could collapse the last column to `0px` even when an explicit width was set. [#11761](https://github.com/handsontable/handsontable/issues/11761)
- Fixed HyperFormula errors when MultiSelect cells store array values. [#12135](https://github.com/handsontable/handsontable/pull/12135)
- Fixed `setDataAtRowProp()` incorrectly canceling an active editor session when the programmatic update targeted a different cell in the same row. [#4305](https://github.com/handsontable/handsontable/issues/4305)
- Fix ThemeBuilder false unknown token warning on initialization [#12146](https://github.com/handsontable/handsontable/pull/12146)
- Prevent after scroll hooks from firing when axis position is unchanged [#12151](https://github.com/handsontable/handsontable/issues/12151)
- Fixed six regressions related to rowspans in nested column headers. [#12152](https://github.com/handsontable/handsontable/pull/12152)
- Fixed undo restore for mixed checkbox multi-selection delete. [#12153](https://github.com/handsontable/handsontable/issues/12153)
- Fixed Ctrl+A selecting the entire grid instead of the comment text when the comment textarea was focused. [#12193](https://github.com/handsontable/handsontable/issues/12193)
- Fixed `columnHeaderHeight` overriding the actual content height, causing overlay THEAD misalignment when header text wraps. [#12198](https://github.com/handsontable/handsontable/issues/12198)
- Fixed selected fixed-column header alignment with data cells for fixedColumnsStart [#12202](https://github.com/handsontable/handsontable/issues/12202)
- Fixed autofill over hidden columns when Formulas is enabled and hiddenColumns.copyPasteEnabled is false [#12203](https://github.com/handsontable/handsontable/issues/12203)
- Fixed a one-pixel horizontal misalignment of the left pagination caret in the Pagination plugin. [#2791](https://github.com/handsontable/handsontable/pull/2791)
- Fixed nested headers crash when sorting with disabled current highlight. [#12211](https://github.com/handsontable/handsontable/issues/12211)
- Improved server-side data documentation structure and fixed disjunctionWithExtraCondition guard fallback in server filter utility examples. [#12241](https://github.com/handsontable/handsontable/issues/12241)
- Fixed framework wrappers crashing when init-only settings (renderAllRows, renderAllColumns, layoutDirection, ariaTags) changed after initialization. [#12242](https://github.com/handsontable/handsontable/issues/12242)
- Fixed an issue where `currentRowClassName` and `currentColClassName` could not be changed dynamically using `updateSettings`. [#12247](https://github.com/handsontable/handsontable/issues/12247)
- Fixed column menu dropdown button styling when a filtered column header is also active [#12253](https://github.com/handsontable/handsontable/issues/12253)
- Fixed an issue where rows with dataSchema default values (e.g., false for checkbox columns) were not recognized as empty by isEmptyRow and isEmptyCol, causing minSpareRows and minSpareCols to add infinite rows. [#12254](https://github.com/handsontable/handsontable/issues/12254) [#2409](https://github.com/handsontable/handsontable/issues/2409)
- Fixed autocomplete editor with strict mode and allowInvalid discarding typed value on click-away instead of saving it. [#12285](https://github.com/handsontable/handsontable/issues/12285)
- Fixed filter-by-value search by trimming leading and trailing spaces and treating whitespace-only input as an empty query. [#12290](https://github.com/handsontable/handsontable/issues/12290)
- Fixed portal-based popups (e.g., date picker) closing immediately on touch devices (Android) due to outside-click detection not accounting for rootPortalElement. [#12298](https://github.com/handsontable/handsontable/pull/12298)
- Fixed `setDataAtRowProp` ignoring the `source` parameter in array-form calls, causing `beforeChange` and `afterChange` hooks to always receive `'edit'` instead of the provided source string. [#12300](https://github.com/handsontable/handsontable/issues/12300)
- Fixed multiple Handsontable tables with shared HyperFormula engine and auto-sizing becoming unresponsive due to cross-table formula update interference. [#12305](https://github.com/handsontable/handsontable/issues/12305)
- Fixed `disableVisualSelection` treating `undefined` as `true` instead of falling back to the default (`false`). [#12307](https://github.com/handsontable/handsontable/issues/12307)
- Fixed incorrect return types for in some hooks [#12309](https://github.com/handsontable/handsontable/pull/12309)
- Fixed multiselect overflow indicator not responding to chip padding token changes [#12316](https://github.com/handsontable/handsontable/pull/12316)
- Fixed the `headerRowBackgroundColor` theme token having no visual effect on row headers. The `rowHeaderOddBackgroundColor` and `rowHeaderEvenBackgroundColor` tokens now derive from `headerRowBackgroundColor` by default, so customizing it properly cascades to all row headers. [#12322](https://github.com/handsontable/handsontable/issues/12322)
- Fixed an exception when showing the loading indicator from the `afterChange` hook during editor close. [#12348](https://github.com/handsontable/handsontable/issues/12348)
- Fixed TypeScript type for the `dateFormat` option to accept `Intl.DateTimeFormatOptions` objects required by the `intl-date` cell type. [#12395](https://github.com/handsontable/handsontable/issues/12395)
- React: Fixed the React wrapper skipping settings updates when `dataSchema` or `columns` contains non-plain objects such as `Date`, `Set`, or `Map`. [#12207](https://github.com/handsontable/handsontable/pull/12207)
- Fixed the loading overlay resetting the grid scroll position to the top when no cell was selected before showing the overlay. [#12514](https://github.com/handsontable/handsontable/issues/12514)
- Fixed a memory leak caused by ThemeManager not unsubscribing from the shared theme object on destroy. [#12570](https://github.com/handsontable/handsontable/issues/12570)
- Fixed viewport scroll jump when Ctrl+clicking a selected cell to deselect it. [#12574](https://github.com/handsontable/handsontable/issues/12574)
- Fixed a memory leak where IntersectionObserver instances were not properly disconnected when `document.body` had zero height. [#12578](https://github.com/handsontable/handsontable/issues/12578)
- Fixed the browser page scrolling to the grid when `dataProvider` loads rows for the first time into an empty grid with `emptyDataState` enabled. [#12591](https://github.com/handsontable/handsontable/issues/12591)

### Security
- Patched critical and high dependency vulnerabilities across the monorepo and aligned Angular wrapper tooling for compatibility. [#12237](https://github.com/handsontable/handsontable/issues/12237)

## [17.0.1] - 2026-03-25

### Fixed
- Fix UndoRedo crash when nullified changes [#12000](https://github.com/handsontable/handsontable/pull/12000)
- Fix UndoRedo beforeChange order [#12001](https://github.com/handsontable/handsontable/pull/12001)
- Fixed a bug where the editor does not receive the user inputs [#12042](https://github.com/handsontable/handsontable/pull/12042)
- Fixed scrollbar width calcualtion on Safari >=26. [#12047](https://github.com/handsontable/handsontable/pull/12047)
- Added missing typings for Core [#12048](https://github.com/handsontable/handsontable/pull/12048)
- Fixed rounded corners that may be applied in incorrect use cases [#12052](https://github.com/handsontable/handsontable/pull/12052)
- Fixed undo/redo stack desync with formulas engine [#12056](https://github.com/handsontable/handsontable/pull/12056)
- Fixed column width calculation for collapsed columns [#12059](https://github.com/handsontable/handsontable/pull/12059)
- Fixed and issue with table backround overflow [#12063](https://github.com/handsontable/handsontable/pull/12063)
- Fixed column header misalignment when nestedRow is enabled [#12081](https://github.com/handsontable/handsontable/pull/12081)
- Fixed an issue with mobile select handles styles [#12083](https://github.com/handsontable/handsontable/pull/12083)
- Improved clipboard processing after paste [#12084](https://github.com/handsontable/handsontable/pull/12084)
- Fixed an issue with scrolling issue that occurs when preventOverflow is enabled [#12086](https://github.com/handsontable/handsontable/pull/12086)
- Fixed date picker positioning near viewport edges [#12087](https://github.com/handsontable/handsontable/pull/12087)
- Fixed an issue with main theme hover on menu icon background color [#12159](https://github.com/handsontable/handsontable/pull/12159)

## [17.0.0] - 2026-03-09

### Added
- **Breaking change**: Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Introduced a simple way to define custom editors using the new `BaseEditor.factory` method. [#11899](https://github.com/handsontable/handsontable/pull/11899)
- Implemented a new MultiSelect cell type with a dedicated editor, renderer, and validator. [#11981](https://github.com/handsontable/handsontable/pull/11981)
- Added support for `Intl.NumberFormat` options. [#11997](https://github.com/handsontable/handsontable/pull/11997)
- Added support for `Intl.DateTimeFormat` options. [#11999](https://github.com/handsontable/handsontable/pull/11999)
- Added a copy-as-Markdown button to the documentation pages. [#12009](https://github.com/handsontable/handsontable/pull/12009)
- Added a new `sanitizer` table option. [#12016](https://github.com/handsontable/handsontable/pull/12016)
- React: Introduced a simple way to define custom editors using the new `ComponentEditor`. [#11978](https://github.com/handsontable/handsontable/pull/11978)

### Changed
- Improved differentiation between Handsontable errors and other errors. [#11780](https://github.com/handsontable/handsontable/pull/11780)
- Added a hit area to the fill handle. [#11952](https://github.com/handsontable/handsontable/pull/11952)
- Added a new `parsePastedValue` option to fix issues with pasting object-based values. [#12020](https://github.com/handsontable/handsontable/pull/12020)
- Introduced a new publishing flow for versions 17.0.0 and above. [#12028](https://github.com/handsontable/handsontable/pull/12028)

### Deprecated
- Deprecated **numbro.js** for numeric formatting. Copy it to your project or replace it with the `Intl.NumberFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_3-migrate-from-numbro-format-to-intl-numberformat)
- Deprecated **Pikaday** for date picking. Switch to native date input. [Migration guide](https://handsontable.com/docs/javascript-data-grid/recipes/cell-types/pikaday)
- Deprecated **moment.js** for date parsing and display. Replace it with the `Intl.DateTimeFormat` API. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_4-migrate-from-moment-js-format-to-intl-datetimeformat)
- Deprecated **DOMPurify** as a built-in XSS sanitizer. Use the new `sanitizer` option or convert content to plain text. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_5-migrate-from-built-in-dompurify-to-the-sanitizer-option)
- Deprecated **core-js** polyfills for ECMAScript features. [Migration guide](https://handsontable.com/docs/javascript-data-grid/migration-from-16.2-to-17.0#_6-core-js-dependency-removed)
- Deprecated bundling **HyperFormula** as a Handsontable dependency. Starting from version 18.0, install and import it separately, then pass it to the Formulas plugin with `formulas: { engine: HyperFormula }`. [Formula calculation](https://handsontable.com/docs/javascript-data-grid/formula-calculation)

### Removed
- **Breaking change**: Removed deprecated wrapper packages for Angular, React, and Vue, the `PersistentState` plugin, and the legacy undo/redo methods. [#12015](https://github.com/handsontable/handsontable/pull/12015)
- **Breaking change**: Removed `core-js` from dependencies. [#12017](https://github.com/handsontable/handsontable/pull/12017)
- **Breaking change**: Removed the legacy CSS stylesheets (e.g. `handsontable.full.min.css`), which were the default styling prior to version 16. [#11950](https://github.com/handsontable/handsontable/pull/11950)
- Removed the `languages` folder from git + updated the `17.0+` release workflow. [#12049](https://github.com/handsontable/handsontable/pull/12049)

### Fixed
- Fixed errors triggered by certain keyboard shortcuts. [#11951](https://github.com/handsontable/handsontable/pull/11951)
- Fixed unwanted layout shifts caused by the editor. [#11955](https://github.com/handsontable/handsontable/pull/11955)
- Fixed an issue with scrolling in Firefox. [#11962](https://github.com/handsontable/handsontable/pull/11962)
- Fixed an issue with viewport scroll after calling `loadData()`/`updateData()`. [#11985](https://github.com/handsontable/handsontable/pull/11985)
- Fixed a bug where the pasted value could not be changed. [#11989](https://github.com/handsontable/handsontable/pull/11989)
- Fixed misalignment issues when using `CSS transform: scale()`. [#11990](https://github.com/handsontable/handsontable/pull/11990)
- Fixed a bug that made it impossible to delete values from key/value-based autocomplete and dropdown cells. [#12010](https://github.com/handsontable/handsontable/pull/12010)
- Fixed a Data Factory issue in filters that could return zero results even when matches exist. [#12031](https://github.com/handsontable/handsontable/pull/12031)
- Changed the element type for focus catchers. [#12032](https://github.com/handsontable/handsontable/pull/12032)
- Fixed incorrect scrollbar width calculation for scaled environments. [#12035](https://github.com/handsontable/handsontable/pull/12035)
- Fixed and issue with column headers styles [#12058](https://github.com/handsontable/handsontable/pull/12058)
- Angular: Fixed a problem with the Angular wrapper that broke builds done with a disabled `skipLibCheck`. [#12091](https://github.com/handsontable/handsontable/pull/12091)

## [16.2.0] - 2025-11-25

### Added
- Improved focus management by introducing a focus scopes mechanism. [#11804](https://github.com/handsontable/handsontable/pull/11804)
- Introduced an "auto" option for the `roundFloat` setting in the Column Summary plugin and ensured proper recalculation of endpoints after data updates. [#11833](https://github.com/handsontable/handsontable/pull/11833)
- Added an Enter key handler and a new `searchMode` option to the Filters plugin. [#11871](https://github.com/handsontable/handsontable/pull/11871)
- Implemented a `style` option for the Custom Borders plugin, enabling style customization. [#11876](https://github.com/handsontable/handsontable/pull/11876)
- Introduced a new "dotted" border style to the Custom Borders plugin. [#11877](https://github.com/handsontable/handsontable/pull/11877)
- Added the EmptyDataState plugin to improve UX when no data is available. [#11879](https://github.com/handsontable/handsontable/pull/11879)
- Added a `settings` entry to the Handsontable exports. [#11883](https://github.com/handsontable/handsontable/pull/11883)
- Added new global button CSS class names. [#11896](https://github.com/handsontable/handsontable/pull/11896)
- Introduced `minRowHeights` as an alias for `rowHeights` for API consistency. [#11898](https://github.com/handsontable/handsontable/pull/11898)
- Added a new `template` option to the Dialog plugin. [#11902](https://github.com/handsontable/handsontable/pull/11902)
- Added new theme variables and implemented `no-icons` and `icons-only` style variants. [#11913](https://github.com/handsontable/handsontable/pull/11913)

### Changed
- Refined dropdown behavior when the input is empty - focus now remains on the input field. [#11863](https://github.com/handsontable/handsontable/pull/11863)
- Improved how the Autocomplete and Dropdown editors respond to clicks outside the open editor. [#11873](https://github.com/handsontable/handsontable/pull/11873)
- Reverted the editors' `updateChoicesList` method type change. [#11943](https://github.com/handsontable/handsontable/pull/11943)

### Fixed
- Fixed the datepicker icon size issue on iPad. [#11860](https://github.com/handsontable/handsontable/pull/11860)
- Corrected header size rendering on iPad. [#11861](https://github.com/handsontable/handsontable/pull/11861)
- Fixed an issue with header text size with `collapsibleColumns` enabled. [#11864](https://github.com/handsontable/handsontable/pull/11864)
- Fixed an issue with an unwanted empty space on the right side of the table when using the modern themes. [#11868](https://github.com/handsontable/handsontable/pull/11868)
- Fixed row misalignment for multi-line cell content. [#11872](https://github.com/handsontable/handsontable/pull/11872)
- Improved column width calculations for checkbox-typed cells. [#11891](https://github.com/handsontable/handsontable/pull/11891)
- Fixed a problem, where using `minSpareRows` would crash the table when configured alongside the Column Summary plugin. [#11911](https://github.com/handsontable/handsontable/pull/11911)
- Fixed an issue preventing re-adding a previously removed hook callback. [#11914](https://github.com/handsontable/handsontable/pull/11914)
- Stabilized the height of the first row when it's empty. [#11918](https://github.com/handsontable/handsontable/pull/11918)
- Fixed a problem where resizing the window vertically did not resize the table. [#11919](https://github.com/handsontable/handsontable/pull/11919)
- Fixed an issue where the dialog overlay could make the table unresponsive after rapid show/hide calls. [#11925](https://github.com/handsontable/handsontable/pull/11925)
- Fixed an issue with TouchEvent on Firefox. [#11928](https://github.com/handsontable/handsontable/pull/11928)
- React: Fixed an issue with Collapsible Columns being reset in React wrapper. [#11923](https://github.com/handsontable/handsontable/pull/11923)

### Security
- Updated dev dependencies to address high-severity vulnerabilities. [#11895](https://github.com/handsontable/handsontable/pull/11895)

## [16.1.1] - 2025-09-23

### Fixed
- Fixed row misalignment when setting `manualRowResize` on an instance with `autoRowSize` enabled. [#11849](https://github.com/handsontable/handsontable/pull/11849)
- Reverted the foreground color change for the "main" theme. [#11852](https://github.com/handsontable/handsontable/pull/11852)
- Fixed an error thrown when using autocomplete-typed cells with key/value sources alongside formulas. [#11853](https://github.com/handsontable/handsontable/pull/11853)

## [16.1.0] - 2025-09-15

### Added
- Introduced row pagination functionality. [#11612](https://github.com/handsontable/handsontable/pull/11612)
- Introduced a Dialog plugin. [#11754](https://github.com/handsontable/handsontable/pull/11754)
- Added support for object-based (`key`/`value`) source in Autocomplete and Dropdown editors, along with new `valueGetter` and `valueSetter` options. [#11773](https://github.com/handsontable/handsontable/pull/11773)
- Added a new `initialState` configuration option. [#11777](https://github.com/handsontable/handsontable/pull/11777)
- Introduced the Loading plugin. [#11792](https://github.com/handsontable/handsontable/pull/11792)
- Added a new "classic" theme. [#11790](https://github.com/handsontable/handsontable/pull/11790)
- Added a [Deprecation policy](https://handsontable.com/docs/deprecation-policy/) page to the documentation.
- Added a [Long Term Support (LTS)](https://handsontable.com/docs/long-term-support/) page to the documentation.

### Changed
- Enabled focus navigation between multiple selection layers. [#11756](https://github.com/handsontable/handsontable/pull/11756)
- Renamed the input element used as the internal focus catcher. [#11770](https://github.com/handsontable/handsontable/pull/11770)
- Added a background color to the `wtHolder` element. [#11797](https://github.com/handsontable/handsontable/pull/11797)
- Updated the CSS variables for the Pagination styles. [#11820](https://github.com/handsontable/handsontable/pull/11820)

### Fixed
- Fixed undo/redo functionality for cell types other than `text`. [#11656](https://github.com/handsontable/handsontable/pull/11656)
- Fixed incorrect resizing behavior when auto-sizing rows or columns by double-clicking separators. [#11671](https://github.com/handsontable/handsontable/pull/11671)
- Fixed mouse wheel zooming issues on Windows. [#11680](https://github.com/handsontable/handsontable/pull/11680)
- Fixed autocomplete sorting and option highlighting issues. [#11708](https://github.com/handsontable/handsontable/pull/11708)
- Fixed misalignment between rows and row headers when using `autoRowSize`. [#11736](https://github.com/handsontable/handsontable/pull/11736)
- Fixed layout inconsistencies caused by browser zoom and scaling. [#11739](https://github.com/handsontable/handsontable/pull/11739)
- Fixed an issue with the root-wrapper height calculation. [#11769](https://github.com/handsontable/handsontable/pull/11769)
- Fixed a `TypeError` being thrown after undoing operations on nested row structures. [#11793](https://github.com/handsontable/handsontable/pull/11793)
- Fixed `rowHeights` handling for merged cells. [#11795](https://github.com/handsontable/handsontable/pull/11795)
- Fixed visual issues across themes. [#11805](https://github.com/handsontable/handsontable/pull/11805)
- Fixed table misalignment after loading new data. [#11809](https://github.com/handsontable/handsontable/pull/11809)
- Angular: Fixed the tree-shaking mechanism for the Angular wrapper (`@handsontable/angular-wrapper`). [#11738](https://github.com/handsontable/handsontable/pull/11738)
- Fixed an issue with the deprecation warning being shown too often. [#11819](https://github.com/handsontable/handsontable/pull/11819)
- Fixed an issue with the classic (legacy) theme deprecation warning being displayed for non-root instances. [#11821](https://github.com/handsontable/handsontable/pull/11821)
- Fixed an issue with the table not rendering correctly when scrolling into extremely tall rows. [#11825](https://github.com/handsontable/handsontable/pull/11825)

### Security
- Resolved critical vulnerabilities reported by `pnpm audit`. [#11798](https://github.com/handsontable/handsontable/pull/11798)

### Deprecated
- Deprecated the legacy style (to be removed in version `17.0.0`). [#11790](https://github.com/handsontable/handsontable/pull/11790)
- Deprecated the PersistentState plugin (to be removed in version `17.0.0`). [#11835](https://github.com/handsontable/handsontable/pull/11835)
- Deprecated the `@handsontable/vue` wrapper. [#11839](https://github.com/handsontable/handsontable/pull/11839)

## [16.0.1] - 2025-07-10

### Fixed
- Fixed a missing `touchend` handler that prevented the editor from opening on mobile devices. [#11729](https://github.com/handsontable/handsontable/pull/11729)

## [16.0.0] - 2025-07-09

### Added
- **Breaking change**: Added a focus outline to the context and dropdown menus. [#11669](https://github.com/handsontable/handsontable/pull/11669)
- Improved Handsontable editor positioning. [#11593](https://github.com/handsontable/handsontable/pull/11593)
- Added a second-click cell deselection feature. [#11602](https://github.com/handsontable/handsontable/pull/11602)
- Added a new `textEllipsis` option. [#11609](https://github.com/handsontable/handsontable/pull/11609)
- Added backward compatibility for the renamed CSS variables. [#11676](https://github.com/handsontable/handsontable/pull/11676)
- Angular: Introduced a new Angular wrapper - `@handsontable/angular-wrapper`. [#11511](https://github.com/handsontable/handsontable/pull/11511)

### Changed
- **Breaking change**: Updated the CSS theme variables and added `--ht-radio-*` variables. [#11470](https://github.com/handsontable/handsontable/pull/11470)
- **Breaking change**: Changed the `modifyData` hook to use visual indexes for both rows and columns. [#11501](https://github.com/handsontable/handsontable/pull/11501)

### Fixed
- **Breaking change**: Fixed an issue with custom border overlapping row headers. [#11551](https://github.com/handsontable/handsontable/pull/11551)
- **Breaking change**: Fixed accessibility issues and introduced a new DOM structure with a wrapper and a portal. [#11579](https://github.com/handsontable/handsontable/pull/11579)
- Fixed a problem with the dropdown editor having a horizontal scrollbar on Windows with fractional scaling applied. [#11613](https://github.com/handsontable/handsontable/pull/11613)
- Fixed an issue with scrollbar styles on the Safari browser. [#11614](https://github.com/handsontable/handsontable/pull/11614)
- Fixed the column filter behavior when adding new columns. [#11616](https://github.com/handsontable/handsontable/pull/11616)
- Fixed an issue with the dropdown elements' colors. [#11661](https://github.com/handsontable/handsontable/pull/11661)
- Angular: Fixed an error of `this.hotInstance.getSettings(...).columns?.filter is not a function` in `angular-wrapper`. [#11695](https://github.com/handsontable/handsontable/pull/11695)

## [15.3.0] - 2025-04-29

### Added
- Added a missing boolean type to the editor in the React wrapper. [#11514](https://github.com/handsontable/handsontable/pull/11514)
- Fixed the Comments plugin for IME editing and added a new `beforeCompositionStart` hook. [#11521](https://github.com/handsontable/handsontable/pull/11521)
- Added horizontal scroll to the Filter's "by value" component. [#11561](https://github.com/handsontable/handsontable/pull/11561)
- Added optional formula sanitization for CSV export to prevent CSV Injection attacks. [#11592](https://github.com/handsontable/handsontable/pull/11592)

### Changed
- Improved the initialization time of Handsontable with Formulas enabled. [#11474](https://github.com/handsontable/handsontable/pull/11474)
- Changed the size of the Manual Row Resize and Manual Column Resize guide lines. [#11507](https://github.com/handsontable/handsontable/pull/11507)
- Improved the viewport scrolling behavior. [#11577](https://github.com/handsontable/handsontable/pull/11577)

### Fixed
- Fixed an issue with the NestedRows plugin duplicating rows when moving child rows. [#11362](https://github.com/handsontable/handsontable/pull/11362)
- Fixed an issue with row resize line alignment and resize handle flickering. [#11500](https://github.com/handsontable/handsontable/pull/11500)
- Fixed an issue with the Autocomplete caret position after using scroll on a list of choices and a problem with the dropdown width. [#11503](https://github.com/handsontable/handsontable/pull/11503)
- Fixed the submenu positioning for all themes. [#11505](https://github.com/handsontable/handsontable/pull/11505)
- Fixed a problem where re-enabling the Hidden Columns configuration caused an error to be thrown if a selection was a part of the hidden range. [#11508](https://github.com/handsontable/handsontable/pull/11508)
- Fixed an issue with an empty `parentNode` in the table's `getCords` method. [#11509](https://github.com/handsontable/handsontable/pull/11509)
- Improved the Undo/Redo actions for removing rows and columns. [#11515](https://github.com/handsontable/handsontable/pull/11515)
- Fixed rows' height calculations for merged cells on Safari. [#11517](https://github.com/handsontable/handsontable/pull/11517)
- Fixed the missing (incorrect) render call after dataset change. [#11529](https://github.com/handsontable/handsontable/pull/11529)
- Fixed an issue with the mobile keyboard closing after clicking the filter search input on Android devices.  [#11532](https://github.com/handsontable/handsontable/pull/11532)
- Fixed a problem with multiple row header levels being rendered in reverse order. [#11533](https://github.com/handsontable/handsontable/pull/11533)
- Fixed a `TypeError` error for the `AutoRowSize` plugin. [#11537](https://github.com/handsontable/handsontable/pull/11537)
- Allow changing the selection after a filter was applied. [#11538](https://github.com/handsontable/handsontable/pull/11538)
- Fixed a problem with the Autocomplete editor rendering very slowly when provided with a long list of choices. [#11552](https://github.com/handsontable/handsontable/pull/11552)
- Fixed an issue with the focus catcher accessibility. [#11553](https://github.com/handsontable/handsontable/pull/11553)
- Fixed a `TypeError` error being thrown after removing rows on the bottom overlay. [#11555](https://github.com/handsontable/handsontable/pull/11555)
- Fixed calculating the first row height. [#11557](https://github.com/handsontable/handsontable/pull/11557)
- Fixed an issue with highlighting a cell after calling `updateData`. [#11558](https://github.com/handsontable/handsontable/pull/11558)
- Fixed the "unmerge cells" action triggered form keyboard shortcut. [#11559](https://github.com/handsontable/handsontable/pull/11559)
- Fixed the left/right-arrow shortcuts for menus when the table was configured with `layoutDirection: rtl`. [#11562](https://github.com/handsontable/handsontable/pull/11562)
- Fixed an issue with duplicate boolean values in the filters. [#11563](https://github.com/handsontable/handsontable/pull/11563)
- Fixed an issue with data sources with non-string values under the `name` property. [#11565](https://github.com/handsontable/handsontable/pull/11565)
- Fixed the settings object not being updated after adding new hooks. [#11566](https://github.com/handsontable/handsontable/pull/11566)
- Fixed a problem with the table rendering all rows when it's configured to have `0px` height. [#11567](https://github.com/handsontable/handsontable/pull/11567)
- Fixed the copy/paste/cut functionalities for web components. [#11572](https://github.com/handsontable/handsontable/pull/11572)
- Fixed the `allowInvalid` option (both `true` and `false`) for the Dropdown Editor.  [#11587](https://github.com/handsontable/handsontable/pull/11587)
- Fixed a problem with a deprecation warnings being thrown when using Context Menu's Undo and Redo items. [#11588](https://github.com/handsontable/handsontable/pull/11588)
- Fixed an error being thrown when editing Autocomplete-typed cells with a long list of choices rendered in a small container. [#11589](https://github.com/handsontable/handsontable/pull/11589)
- Ensured that there's a single `@charset` entry in the classic theme's CSS files and that it's placed at the beginning of those files. [#11591](https://github.com/handsontable/handsontable/pull/11591)

## [15.2.0] - 2025-03-19

### Added
- Added the Farsi translation. [#11388](https://github.com/handsontable/handsontable/pull/11388)
- Added support for class names passed as an array for the numeric cell renderer. [#11420](https://github.com/handsontable/handsontable/pull/11420)
- Updated the Italian translation for the new Context Menu labels. [#11436](https://github.com/handsontable/handsontable/pull/11436)
- Updated the Serbian translation for the new Context Menu labels. [#11437](https://github.com/handsontable/handsontable/pull/11437)
- Added the mobile cell handle CSS variables to the themes. [#11479](https://github.com/handsontable/handsontable/pull/11479)
- Improved the execution flow of the Filters plugin and added two new methods (`importConditions` and `exportConditions`). [#11488](https://github.com/handsontable/handsontable/pull/11488)

### Changed
- Sped up the rendering performance for themes. [#11443](https://github.com/handsontable/handsontable/pull/11443)
- Improved the table UI behavior after removing all rows and/or columns. [#11477](https://github.com/handsontable/handsontable/pull/11477)
- Reverted the removal of `actionType` class field for UndoRedo actions. [#11495](https://github.com/handsontable/handsontable/pull/11495)

### Removed
- Removed the broken, unsupported and undocumented `rendererTemplate` Text Renderer option. [#11424](https://github.com/handsontable/handsontable/pull/11424)

### Fixed
- Fixed the default (fallback) date format for the Date editor. [#11419](https://github.com/handsontable/handsontable/pull/11419)
- Fixed the Context Menu's items' state rendering. [#11422](https://github.com/handsontable/handsontable/pull/11422)
- Corrected the checkbox visibility in the no-theme variant. [#11427](https://github.com/handsontable/handsontable/pull/11427)
- Fixed problems with the cell content reading with `imeFastEdit` enabled. [#11442](https://github.com/handsontable/handsontable/pull/11442)
- Fixed `hasVerticalScroll` and `hasHorizontalScroll` methods. [#11455](https://github.com/handsontable/handsontable/pull/11455)
- Fixed the editor border radius on mobile devices. [#11457](https://github.com/handsontable/handsontable/pull/11457)
- Fixed the wrong height of the first row. [#11458](https://github.com/handsontable/handsontable/pull/11458)
- Fixed the single cell selection inside iframes. [#11460](https://github.com/handsontable/handsontable/pull/11460)
- Fixed an issue with row header misalignment. [#11465](https://github.com/handsontable/handsontable/pull/11465)
- Improved the Autocomplete/Dropdown Editor list behavior. [#11469](https://github.com/handsontable/handsontable/pull/11469)
- Fixed a problem with horizontal scrollbar in the Autocomplete dropdown. [#11473](https://github.com/handsontable/handsontable/pull/11473)
- Fixed the merged cells height for custom row heights. [#11478](https://github.com/handsontable/handsontable/pull/11478)
- Fixed a problem with the Comments editor not flipping direction when overlapping the window's scrollbars. [#11481](https://github.com/handsontable/handsontable/pull/11481)
- Fixed a problem with the focus trap during `Shift` + `Tab` navigation. [#11483](https://github.com/handsontable/handsontable/pull/11483)
- Fixed an issue with the Context Menu opening on Classic theme. [#11486](https://github.com/handsontable/handsontable/pull/11486)
- Fixed a problem with `rowHeights` when the provided value was lower than the default/minimal row height. [#11487](https://github.com/handsontable/handsontable/pull/11487)
- Fixed an issue with the data source modification for row values passed as strings. [#11491](https://github.com/handsontable/handsontable/pull/11491)
- Fixed the conflicts between ColumnSorting and MultiColumnSorting plugins. [#11492](https://github.com/handsontable/handsontable/pull/11492)
- Fixed copy, cut an paste actions on tables with a selection reaching outside of the rendered viewport. [#11504](https://github.com/handsontable/handsontable/pull/11504)

## [15.1.0] - 2025-02-20

### Added
- Added the `TAB` and `SHIFT + TAB` functionality to the Comments editor. [#11345](https://github.com/handsontable/handsontable/pull/11345)

### Changed
- Changed the approach to how the table is rendered by reusing the cell nodes. [#11264](https://github.com/handsontable/handsontable/pull/11264)
- Updated Hyperformula to v3. [#11373](https://github.com/handsontable/handsontable/pull/11373)
- Improved the performance of horizontal scrolling. [#11412](https://github.com/handsontable/handsontable/pull/11412)

### Removed
- Removed the `getComputedStyle` function from the type declaration file. [#11421](https://github.com/handsontable/handsontable/pull/11421)

### Fixed
- Fixed a bug where values passed to data-modifying hooks were not normalized. [#11346](https://github.com/handsontable/handsontable/pull/11346)
- Fixed a problem where data population via autofill handler was broken for merged cells. [#11291](https://github.com/handsontable/handsontable/pull/11291)
- Fixed a problem with a missing render call for the `minSpareRows` and `minSpareCols` options. [#11292](https://github.com/handsontable/handsontable/pull/11292)
- Fixed the undo/redo scrolling behavior after undoing the data deletion. [#11297](https://github.com/handsontable/handsontable/pull/11297)
- Fixed the `Page Up`/`Page Down` keyboard shortcuts for the oversized rows. [#11301](https://github.com/handsontable/handsontable/pull/11301)
- Fixed a bug where the Undo/Redo action caused the wrong cells to be affected when triggered after filtering data. [#11307](https://github.com/handsontable/handsontable/pull/11307)
- Fixed a bug where the selection was incorrectly expanded after closing the editor. [#11311](https://github.com/handsontable/handsontable/pull/11311)
- Fixed a bug where the viewport was incorrectly scrolled after moving rows with the Nested Rows plugin enabled. [#11312](https://github.com/handsontable/handsontable/pull/11312)
- Fixed dropdown-typed cells validation for custom editors. [#11314](https://github.com/handsontable/handsontable/pull/11314)
- Fixed Undo/Redo for rows/columns with enabled min spare indexes. [#11321](https://github.com/handsontable/handsontable/pull/11321)
- Fixed a problem with the table misalignment after changing the container size. [#11324](https://github.com/handsontable/handsontable/pull/11324)
- Fixed a bug with an uncaught error being thrown after changing the theme while some of the editors were not fully initialized. [#11325](https://github.com/handsontable/handsontable/pull/11325)
- Fixed a problem with a broken scroll on overlays when `batch` was used. [#11328](https://github.com/handsontable/handsontable/pull/11328)
- Fixed the date picker arrow icon positions for RTL, along with other minor RTL fixes. [#11329](https://github.com/handsontable/handsontable/pull/11329)
- Fixed the Autofill handler styles for the new themes. [#11330](https://github.com/handsontable/handsontable/pull/11330)
- Fixed a problem with an uncaught error being thrown after scrolling the viewport. [#11341](https://github.com/handsontable/handsontable/pull/11341)
- Fixed a problem where calling `updateSettings` with `themeName` set to the current theme name would clear the theme from the table. [#11343](https://github.com/handsontable/handsontable/pull/11343)
- Fixed a problem where the `getCellsMeta` method returned improper results.  [#11350](https://github.com/handsontable/handsontable/pull/11350)
- Fixed the row virtualization for Filter's "by value" component. [#11351](https://github.com/handsontable/handsontable/pull/11351)
- Fixed a problem with the columns shifting after the render calls with the new themes being enabled. [#11352](https://github.com/handsontable/handsontable/pull/11352)
- Fixed the cell editor width for the new themes. [#11354](https://github.com/handsontable/handsontable/pull/11354)
- Disabled the "Clear column" option for read-only cells. [#11355](https://github.com/handsontable/handsontable/pull/11355)
- Fixed a problem where autocomplete highlight was not rendered correctly in the new themes. [#11364](https://github.com/handsontable/handsontable/pull/11364)
- Fixed a problem where the cell borders were not rendered correctly for fixed rows and columns with the new themes being enabled. [#11369](https://github.com/handsontable/handsontable/pull/11369)
- Fixed the incorrect spacing between the checkboxes and their labels. [#11377](https://github.com/handsontable/handsontable/pull/11377)
- Fixed a problem where the Nested Headers' header selection was not rendered properly for the new themes. [#11381](https://github.com/handsontable/handsontable/pull/11381)
- Fixed a bug where the dropdown editor was not fully visible on fixed rows while the new themes were enabled. [#11399](https://github.com/handsontable/handsontable/pull/11399)
- Fixed a problem where the initial styles of the context menu and dropdown menu were not properly assigned in the new themes. [#11400](https://github.com/handsontable/handsontable/pull/11400)
- Fixed a misalignment of the Manual Row Move's "guide" in the new themes. [#11401](https://github.com/handsontable/handsontable/pull/11401)
- Fixed a bug where the selection was not rendered correctly when selecting both merged and non-merged cells with the new themes being enabled. [#11403](https://github.com/handsontable/handsontable/pull/11403)
- Fixed a bug where using the keyboard shortcuts to open the Context Menu would open it at a wrong position when the new themes were enabled. [#11404](https://github.com/handsontable/handsontable/pull/11404)
- Fixed the CodeQL warnings by modifying potentially problematic code fragments. [#11405](https://github.com/handsontable/handsontable/pull/11405)
- Fixed a bug where the date editor would not close after selecting a date on mobile devices. [#11406](https://github.com/handsontable/handsontable/pull/11406)
- Fixed a problem with the header widths when using Nested Headers with the new themes enabled. [#11410](https://github.com/handsontable/handsontable/pull/11410)
- Fixed the header text overlap in Nested Headers. [#11413](https://github.com/handsontable/handsontable/pull/11413)
- Fixed a problem with the merged cells height calculation in the new themes. [#11423](https://github.com/handsontable/handsontable/pull/11423)
- Fixed a problem, where clicking on the Comments' editor element deselected the currently selected cells. [#11446](https://github.com/handsontable/handsontable/pull/11446)

## [15.0.1] - 2025-02-10

### Fixed
- Fixed the copy/paste feature not working correctly in Chrome 133. [#11428](https://github.com/handsontable/handsontable/pull/11428)

## [15.0.0] - 2024-12-16

### Added
- Added support for row and column virtualization of merged cells. [#11162](https://github.com/handsontable/handsontable/pull/11162)
- Added missing typings for the language files. [#11236](https://github.com/handsontable/handsontable/pull/11236)
- Added support for the new themes, including "main" and "horizon".  [#11144](https://github.com/handsontable/handsontable/pull/11144)
- React: Added `@handsontable/react-wrapper` to the monorepo. [#11212](https://github.com/handsontable/handsontable/pull/11212)

### Changed
- **Breaking change**: Updated the production dependencies (replaced `pikaday` with `@handsontable/pikaday`, updated `numbro` and `dompurify`) [#10929](https://github.com/handsontable/handsontable/pull/10929)
- Refactored the column stretching logic, moved it to a separate plugin and fixed bugs related to the columns widths misalignment. [#11210](https://github.com/handsontable/handsontable/pull/11210)
- Updated the typing for dropdown and context menu options. [#11237](https://github.com/handsontable/handsontable/pull/11237)
- Updated the monorepo to utilize Node 22. [#11265](https://github.com/handsontable/handsontable/pull/11265)

### Removed
- **Breaking change**: Removed check marks from the Context Menu's alignment submenu. [#11278](https://github.com/handsontable/handsontable/pull/11278)

### Fixed
- Fixed the Autocomplete and Dropdown editors' container size calculations. [#11201](https://github.com/handsontable/handsontable/pull/11201)
- Fixed the focus management for the Dropdown Menu after `updateSettings` calls. [#11205](https://github.com/handsontable/handsontable/pull/11205)
- Fixed the broken column selection when the column was being moved with the Nested Headers plugin enabled. [#11206](https://github.com/handsontable/handsontable/pull/11206)
- Fixed copying values when the Fast IME Edit option was enabled. [#11243](https://github.com/handsontable/handsontable/pull/11243)
- Fixed an issue with exporting of the common lib in `package.json`. [#11247](https://github.com/handsontable/handsontable/pull/11247)
- Fixed the checkbox switching in merged cells. [#11252](https://github.com/handsontable/handsontable/pull/11252)
- Fixed a problem with the missing "name" attribute of the Focus Catcher. [#11256](https://github.com/handsontable/handsontable/pull/11256)
- Fixed data deletion for the checkbox-typed cells. [#11263](https://github.com/handsontable/handsontable/pull/11263)
- Fixed the horizontal scrolling for Nested Headers. [#11269](https://github.com/handsontable/handsontable/pull/11269)
- Fixed a problem where the Filters' dropdown container did not match the dropdown content size. [#11273](https://github.com/handsontable/handsontable/pull/11273)
- Fixed an error thrown when hiding already selected columns. [#11277](https://github.com/handsontable/handsontable/pull/11277)
- Fixed the cell fast edit mode that did not work properly when a comment was displayed. [#11280](https://github.com/handsontable/handsontable/pull/11280)
- Fixed an error for cases where the keyboard event was triggered with `key` set as `undefined`. [#11281](https://github.com/handsontable/handsontable/pull/11281)
- Fixed the input width calculation for the password-typed cells. [#11283](https://github.com/handsontable/handsontable/pull/11283)
- Fixed the missing `source` argument for the `setDataAtCell` method. [#11287](https://github.com/handsontable/handsontable/pull/11287)
- Fixed the top overlay misalignment issue, visible after vertical scrollbar disappeared. [#11289](https://github.com/handsontable/handsontable/pull/11289)
- React: Made the build scripts of `@handsontable/react-wrapper` place the TS type definitions in the configured directory. [#11296](https://github.com/handsontable/handsontable/pull/11296)

## [14.6.2] - 2025-02-10

### Fixed
- Fixed the copy/paste feature not working correctly in Chrome 133. [#11428](https://github.com/handsontable/handsontable/pull/11428)

## [14.6.1] - 2024-10-17

### Removed
- Removed `aria-hidden` from the TextEditor and PasswordEditor's `TEXTAREA` elements.  [#11218](https://github.com/handsontable/handsontable/pull/11218)

## [14.6.0] - 2024-10-01

### Added
- Fix aria-label, aria-checked and menuitemcheckbox roles for the readOnly and alignment contextMenu items [#11091](https://github.com/handsontable/handsontable/pull/11091)
- Extended the `beforeFilter` hook with a second argument to allow correct Undo/Redo functionality. [#11170](https://github.com/handsontable/handsontable/pull/11170)
- Added even and odd class names to the TR elements. [#11183](https://github.com/handsontable/handsontable/pull/11183)
- Added new API to retrieve visible, partially visible and rendered row and columns indexes. [#11189](https://github.com/handsontable/handsontable/pull/11189)

### Changed
- Make the focus visible for `select` cell type cells. [#11160](https://github.com/handsontable/handsontable/pull/11160)

### Removed
- Remove -ms fix from css [#11055](https://github.com/handsontable/handsontable/issues/11055)

### Fixed
- Fixed a bug that prevents copy valus from cell comments. [#11103](https://github.com/handsontable/handsontable/pull/11103)
- Fixed submenu misalignment after horizontal scroll. [#11106](https://github.com/handsontable/handsontable/pull/11106)
- Fixed rows misalign for cells that content produce heights with fractions. [#11110](https://github.com/handsontable/handsontable/pull/11110)
- Fixed dropdown menu misalignment after opening with a keyboard shortcut. [#11115](https://github.com/handsontable/handsontable/pull/11115)
- Fixed a bug where the data was saved in a wrong cell, when sorting a column with an open editor. [#11129](https://github.com/handsontable/handsontable/pull/11129)
- Fixed copy/paste/cut issues when `outsideClickDeselects` was disabled [#11139](https://github.com/handsontable/handsontable/pull/11139)
- Fixed merged cells that break after adding a new row. [#11145](https://github.com/handsontable/handsontable/pull/11145)
- Fixed F2 keyboard shortcut (enter into editing mode). [#11151](https://github.com/handsontable/handsontable/pull/11151)
- Fixed context/dropdown menu column width calculations depending on the content. [#11156](https://github.com/handsontable/handsontable/pull/11156)
- Updated TS typings for `selectCell` method. [#11161](https://github.com/handsontable/handsontable/pull/11161)
- Fixed a problem with deleting content from a selection when it contained both `checkbox` and non-`checkbox`-typed cells. [#11182](https://github.com/handsontable/handsontable/pull/11182)
- Fixed a problem where the Context Menu container wasn't reflecting the size of its contents. [#11190](https://github.com/handsontable/handsontable/pull/11190)
- Fixed an issue connected with throwing an error triggered by some keyboard shortcuts when there was no selection [#11195](https://github.com/handsontable/handsontable/pull/11195)

## [14.5.0] - 2024-07-24

### Added
- Added support for other keyboard layouts besides QWERTY (e.g. AZERTY). [#11027](https://github.com/handsontable/handsontable/pull/11027)
- Added missing "this" typing for the ColumnSummary plugin. [#11036](https://github.com/handsontable/handsontable/pull/11036)
- Added Undo/Redo logic for the ColumnSorting/ManualColumnSorting plugins. [#11037](https://github.com/handsontable/handsontable/pull/11037)
- Added new option `headerClassName`, which allows adding custom CSS classes to the column headers. [#11076](https://github.com/handsontable/handsontable/pull/11076)

### Changed
- Improved the precision of calculating the height and width of columns and rows. [#11049](https://github.com/handsontable/handsontable/pull/11049)
- Improved the rendering performance. [#11069](https://github.com/handsontable/handsontable/pull/11069)

### Fixed
- Improved performance of cell merging. [#10995](https://github.com/handsontable/handsontable/pull/10995)
- Fixed a problem where clicking and dragging on cells in window-controlled scrolled instances would result in unpredictable behavior. [#10996](https://github.com/handsontable/handsontable/pull/10996)
- Fixed merged cells misalignment in overlays. [#11007](https://github.com/handsontable/handsontable/pull/11007)
- Fixed selection expansion for merged cells. [#11010](https://github.com/handsontable/handsontable/pull/11010)
- Fixed a problem where the table could go into an endless resize loop when one of the instance's parents was using `dvh` values for sizing, and the table was not given any size itself. [#11021](https://github.com/handsontable/handsontable/pull/11021)
- Fixed a bug where the `afterSetCellMeta` was unnecessarily triggered after clicking on the comments textarea element. [#11033](https://github.com/handsontable/handsontable/pull/11033)
- Fixed invalid cell states after data population that was canceled in the `beforeChange` hook. [#11035](https://github.com/handsontable/handsontable/pull/11035)
- Fixed a problem with the Formulas plugin using wrong indexes when performing autofill.  [#11038](https://github.com/handsontable/handsontable/pull/11038)
- Fixed a problem where disabling `navigableHeaders` broke keyboard navigation in the first row if the option was previously enabled and used. [#11043](https://github.com/handsontable/handsontable/pull/11043)
- Fixed a problem where the dropdown menu would not close after tapping on the table cells on mobile browsers. [#11044](https://github.com/handsontable/handsontable/pull/11044)
- Fixed the header selection with `nestedHeaders` enabled not working on mobile devices. [#11051](https://github.com/handsontable/handsontable/pull/11051)

## [14.4.0] - 2024-06-11

### Added
- Extended the `manualRowResize` plugin with a method to retrieve the row height value from the last manual adjustment attempt. [#10941](https://github.com/handsontable/handsontable/pull/10941)
- Added an option to change the order of hook callbacks. [#10970](https://github.com/handsontable/handsontable/pull/10970)
- Added new `dataDotNotation` option which, when set as `false` allows using object keys with dots. [#10973](https://github.com/handsontable/handsontable/pull/10973)

### Changed
- Improved editor behavior after dataset alterations. [#10963](https://github.com/handsontable/handsontable/pull/10963)
- React: Synchronized the `rollup` version between the wrappers and updated the `rollup` plugin dependencies.  [#10962](https://github.com/handsontable/handsontable/pull/10962)

### Fixed
- Fixed unwanted table re-rendering for oversized rows/columns. [#10912](https://github.com/handsontable/handsontable/pull/10912)
- Fixed `Ctrl/Cmd` + `Enter` keyboard shortcut for comments. [#10920](https://github.com/handsontable/handsontable/pull/10920)
- Fixed issue with rows and columns not unfreezing when headers are disabled. [#10926](https://github.com/handsontable/handsontable/pull/10926)
- Fixed `imeFastEdit` option being reset after `updateSettings` call [#10933](https://github.com/handsontable/handsontable/pull/10933)
- Improved fast typing values between editors. [#10947](https://github.com/handsontable/handsontable/pull/10947)
- Removed double borders for column headers. [#10948](https://github.com/handsontable/handsontable/pull/10948)
- Fixed column width calculations with `stretchH: 'all'` option. [#10954](https://github.com/handsontable/handsontable/pull/10954)
- Fixed missing column summary cell meta state after `updateSettings` method call. [#10955](https://github.com/handsontable/handsontable/pull/10955)
- Fixed sorting issue for the `time` column type. [#10956](https://github.com/handsontable/handsontable/pull/10956)
- Fixed data populate error with `correctFormat` usage. [#10957](https://github.com/handsontable/handsontable/pull/10957)
- Fixed cell meta coordinates overwrite by `GhostTable`. [#10961](https://github.com/handsontable/handsontable/pull/10961)
- Fixed `setDataAtRowProp` error when saving data into a trimmed-out column. [#10964](https://github.com/handsontable/handsontable/pull/10964)
- Fixed table scrolling issue after inserting a new row over a table-wide selection. [#10965](https://github.com/handsontable/handsontable/pull/10965)
- Fixed copy/cut/paste issue from outside elements. [#10976](https://github.com/handsontable/handsontable/pull/10976)
- Fixed autocomplete dropdown dimensions after filtering out all choices. [#10977](https://github.com/handsontable/handsontable/pull/10977)
- Fixed dataset clearing issue for formulas. [#10983](https://github.com/handsontable/handsontable/pull/10983)
- Improved typings for the ContextMenu plugin. [#10984](https://github.com/handsontable/handsontable/pull/10984)
- Added missing type for `namedExpressions`. [#10986](https://github.com/handsontable/handsontable/pull/10986)
- Fixed double borders for row/column headers. [#10988](https://github.com/handsontable/handsontable/pull/10988)
- Fixed a problem, where trying to render a hidden instance made it render all of its rows by disabling the rendering for hidden instances. [#10989](https://github.com/handsontable/handsontable/pull/10989)
- Fixed error in numeric cell types after entering non-numeric values. [#10931](https://github.com/handsontable/handsontable/pull/10931)
- Fixed a bug that prevented column sorting of the checkbox cell types. [#11004](https://github.com/handsontable/handsontable/pull/11004)
- Updated the TS typings of the Shortcut Manager's `getShortcuts` method. [#10910](https://github.com/handsontable/handsontable/pull/10910)
- React: Prevented React wrapper from throwing errors on updating component props with init-only settings. [#10921](https://github.com/handsontable/handsontable/pull/10921)

For more information on Handsontable 14.4.0, see:

- [Blog post (14.4.0)](https://handsontable.com/blog/handsontable-14.4.0-improved-stability)
- [Documentation (14.4)](https://handsontable.com/docs/14.4)
- [Release notes (14.4.0)](https://handsontable.com/docs/release-notes/#_14-4-0)


## [14.3.0] - 2024-04-16

### Added
- Added new feature, Navigation within selection and edit cells within a range [#10732](https://github.com/handsontable/handsontable/pull/10732)

### Changed
- Updated dependencies based on npm audit, most notably we upgraded to angular 17.0 [#10889](https://github.com/handsontable/handsontable/pull/10889)

### Fixed

- Ensured the cursor changes to 'grabbing' for all table elements during column or row movement[#10852](https://github.com/handsontable/handsontable/pull/10852)
- Resolved an issue where the `TAB` key failed to move selection when editing select-type cells in 'fast edit' mode. [#10849](https://github.com/handsontable/handsontable/pull/10849)
- Prevent the `Cmd/Ctrl + A` action when the focus is on headers. [#10853](https://github.com/handsontable/handsontable/pull/10853)
- Unified `source` arguments in `beforeChange` and `afterChange` hooks triggered by the Merge Cells plugin. [#10857](https://github.com/handsontable/handsontable/pull/10857)
- Ensured focus retention after column collapsing. [#10865](https://github.com/handsontable/handsontable/pull/10865)
- Fixed visibility issue with bottom/right cell borders after scrolling from the absolute top/left positions using the api. [#10887](https://github.com/handsontable/handsontable/pull/10887)
- Fixed Dropdown plugin logic to prevent blocking click events from custom editors. [#10888](https://github.com/handsontable/handsontable/pull/10888)
- Fixed datepicker position for the date cell type. [#10892](https://github.com/handsontable/handsontable/pull/10892)
- Vue: Fixed an issue in the Vue and Vue3 wrappers where updating the hook callback didn't reflect changes in the underlying instance's settings. [#10686](https://github.com/handsontable/handsontable/issues/10686)
- Vue: Fixed the behavior of the Vue/Vue3 wrappers' `simpleEqual` helper, which previously returned incorrect results when comparing identical objects. [#10896](https://github.com/handsontable/handsontable/pull/10896)

For more information on Handsontable 14.3.0, see:

- [Blog post (14.3.0)](https://handsontable.com/blog/handsontable-14.3.0-enhanced-navigation-and-bug-fixes)
- [Documentation (14.3)](https://handsontable.com/docs/14.3)
- [Release notes (14.3.0)](https://handsontable.com/docs/release-notes/#_14-3-0)

## [14.2.0] - 2024-03-06

### Added

- Added a new Handsontable hook, `beforeBeginEditing`, to conditionally control when to allow cell editing. [#10699](https://github.com/handsontable/handsontable/pull/10699)
- Added the ability to prevent viewport scrolling by using two existing Handsontable hooks: `beforeViewportScrollVertically` and `beforeViewportScrollHorizontally`. [#10724](https://github.com/handsontable/handsontable/pull/10724)
- Added undo-and-redo support for column moving. [#10746](https://github.com/handsontable/handsontable/pull/10746)
- Added a new `Filters` plugin hook: `modifyFiltersMultiSelectValue`. Now, filtered values lists will show the formatted numeric value, not the raw data. [#10756](https://github.com/handsontable/handsontable/pull/10756)

### Changed

- Improved the viewport scroll behavior after clicking on a cell. [#10709](https://github.com/handsontable/handsontable/pull/10709)
- Improved the response of checkboxes to double-clicks. [#10748](https://github.com/handsontable/handsontable/pull/10748)
- Improved the way `checkbox` cells react to pressing <kbd>Space</kbd> or <kbd>Enter</kbd>. [#10802](https://github.com/handsontable/handsontable/pull/10802)
- Improved the type inference of the `propToCol()` method. [#10750](https://github.com/handsontable/handsontable/pull/10750)
- React: Improved React portal caching. [#10758](https://github.com/handsontable/handsontable/pull/10758)

### Removed

- Removed versioned Handsontable examples and their GitHub publishing workflow. [#10766](https://github.com/handsontable/handsontable/pull/10766)

### Fixed

- Fixed an issue where the sizes of rows and columns were calculated incorrectly for hidden indexes. [#10705](https://github.com/handsontable/handsontable/pull/10705)
- Fixed an issue where pasting arrays larger than the table's height caused data getter methods (such as `getCellsMeta()`) to throw an error. [#10710](https://github.com/handsontable/handsontable/pull/10710)
- Fixed an issue where HyperFormula and Handsontable didn't sync properly. [#10719](https://github.com/handsontable/handsontable/pull/10719)
- Fixed an issue where removing all rows and columns while HyperFormula was enabled caused an error. [#10720](https://github.com/handsontable/handsontable/pull/10720)
- Fixed an issue where very large text cells lacked the vertical scrollbar during editing. [#10722](https://github.com/handsontable/handsontable/pull/10722)
- Fixed an issue where non-contiguous selection caused too many `afterSelectionEnd` and `afterSelectionEndByProp` calls. [#10725](https://github.com/handsontable/handsontable/pull/10725)
- Fixed an issue where tables pasted from the clipboard contained redundant line breaks. [#10745](https://github.com/handsontable/handsontable/pull/10745)
- Fixed an issue where clicking outside the table didn't remove the focus from the table (when Handsontable was placed in an iframe). [#10752](https://github.com/handsontable/handsontable/pull/10752)
- Fixed an issue where hovering over the header handles of `handsontable` cells caused an error. [#10761](https://github.com/handsontable/handsontable/pull/10761)
- Fixed an issue where `dropdown` cells with long lists of options caused an error. [#10763](https://github.com/handsontable/handsontable/pull/10763)
- Fixed an issue where using the browser's autocomplete dropdown on an input outside of Handsontable caused errors. Also, fixed an event listener leak. [#10795](https://github.com/handsontable/handsontable/pull/10795)
- Fixed an issue where using context and dropdown menus on mobile caused unwanted selection handles to show up. [#10816](https://github.com/handsontable/handsontable/pull/10816)
- Fixed an issue where the `Autofill` plugin treated cells filled with `0` as empty. [#10817](https://github.com/handsontable/handsontable/pull/10817)
- React: Fixed a missing `HotTableClass` export. [#10760](https://github.com/handsontable/handsontable/pull/10760)
- React: Fixed missing `renderer` and `editor` props. [#10768](https://github.com/handsontable/handsontable/pull/10768)

For more information on Handsontable 14.2.0, see:

- [Blog post (14.2.0)](https://handsontable.com/blog/handsontable-14-2-0-improved-react-re-rendering-new-handsontable-hooks)
- [Documentation (14.2)](https://handsontable.com/docs/14.2)
- [Release notes (14.2.0)](https://handsontable.com/docs/release-notes/#_14-2-0)

## [14.1.0] - 2024-01-16

### Added

- Added a new configuration option, `renderAllColumns`, which lets you disable column virtualization for improved accessibility. [#10599](https://github.com/handsontable/handsontable/pull/10599)
- Added a dedicated renderer (`DropdownRenderer`) and validator (`DropdownValidator`) for the dropdown cell type. [#10688](https://github.com/handsontable/handsontable/pull/10688)
- Added support for the <kbd>Tab</kbd> key in the select editor (`selectEditor`). [#10673](https://github.com/handsontable/handsontable/pull/10673)

### Changed

- Improved how undoing changes affects the viewport. Now, when you undo a change, the view automatically scrolls back to the changed area. [#10639](https://github.com/handsontable/handsontable/pull/10639)
- Improved how pasting data affects the viewport. Now, even when the size of the pasted data is larger than the viewport, the viewport stays in place. [#10630](https://github.com/handsontable/handsontable/pull/10630)
- Improved how removing a row or column affects the selection. Now, when you remove a row or column, the selection moves to the nearest visible row or column. [#10690](https://github.com/handsontable/handsontable/pull/10690)
- Improved TypeScript definitions for multiple plugins. [#10670](https://github.com/handsontable/handsontable/pull/10670)
- Improved TypeScript definitions for the core modules. [#10671](https://github.com/handsontable/handsontable/pull/10671)
- Improved TypeScript definitions for the `CellCoords` and `CellRange` classes. [#10678](https://github.com/handsontable/handsontable/pull/10678)
- Improved TypeScript definitions for the `CustomBorders` plugin. [#10659](https://github.com/handsontable/handsontable/pull/10659)
- React: Improved support for SSR frameworks. [#10575](https://github.com/handsontable/handsontable/pull/10575)

### Fixed

- Fixed an issue where double-clicking a cell resulted in highlighting the cell's contents. [#10595](https://github.com/handsontable/handsontable/pull/10595)
- Fixed an issue where pressing the <kbd>Tab</kbd> key when editing a cell in the last column caused an error. [#10632](https://github.com/handsontable/handsontable/pull/10632)
- Fixed an issue where pressing the <kbd>Tab</kbd> key with `tabNavigation` set to `false`caused the grid to scroll. [#10634](https://github.com/handsontable/handsontable/pull/10634)
- Fixed an issue where the `Filters` plugin threw a `TypeError` in specific setup cases. [#10637](https://github.com/handsontable/handsontable/pull/10637)
- Fixed an issue where changing Handsontable's configuration or data broke the focus position. [#10642](https://github.com/handsontable/handsontable/pull/10642)
- Fixed an issue where Handsontable didn't go into the "unlisten" state after clicking an element outside of the table. [#10648](https://github.com/handsontable/handsontable/pull/10648)
- Fixed an issue where recovering removed cells by using undo/redo didn't restore the cells' configuration options. [#10649](https://github.com/handsontable/handsontable/pull/10649)
- Fixed an issue where the `ManualRowResize` and `ManualColumnResize` plugins threw an error when a cell renderer used the HTML `<table>` element. [#10650](https://github.com/handsontable/handsontable/pull/10650)
- Fixed an issue where, in some situations, the table didn't scroll after navigating it with the keyboard. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where the drag-to-scroll functionality was not working for window-scrolled instances. [#10655](https://github.com/handsontable/handsontable/pull/10655)
- Fixed an issue where some configurations of the `CollapsibleColumns` plugin caused an uncaught `TypeError`. [#10693](https://github.com/handsontable/handsontable/pull/10693)
- Fixed an issue where pressing the <kbd>Backspace</kbd> key in a date cell deleted the entire contents of the cell instead of a single character. [#10696](https://github.com/handsontable/handsontable/pull/10696)
- Fixed several issues related to the `roundFloat` option of the `ColumnSummary` plugin. [#10701](https://github.com/handsontable/handsontable/pull/10701)
- Fixed a missing TypeScript definition in the `Formulas` plugin.  [#10186](https://github.com/handsontable/handsontable/pull/10186)
- Added `pikaday` to `handsontable`s `dependencies`, to ensure backward compatibility of Handsontable 14.1.0. [#10715](https://github.com/handsontable/handsontable/pull/10715)
- React: Fixed a missing TypeScript definition for the `settings` prop. [#10661](https://github.com/handsontable/handsontable/pull/10661)
- Vue: Fixed an issue where passing `hyperformulaInstance` to `hotSettings` resulted in `TypeError: Converting circular structure to JSON`. [#8728](https://github.com/handsontable/handsontable/pull/8728)
- Vue: Updated the peer dependencies of the Vue 3 wrapper with the latest version of Vue. [#10571](https://github.com/handsontable/handsontable/pull/10571)

For more information on Handsontable 14.1.0, see:

- [Blog post (14.1.0)](https://handsontable.com/blog/handsontable-14-1-0-typescript-ssr-improvements)
- [Documentation (14.1)](https://handsontable.com/docs/14.1)
- [Release notes (14.1.0)](https://handsontable.com/docs/release-notes/#_14-1-0)

## [14.0.0] - 2023-11-22

### Added

- Added a `Ctrl/Cmd + Shift + Space` keyboard shortcut for selecting all cells. [#10237](https://github.com/handsontable/handsontable/pull/10237)
- Added support for keyboard navigation in the headers. [#10265](https://github.com/handsontable/handsontable/pull/10265)
- Added keyboard shortcuts for selecting all rows and columns along with 4 new hooks. [#10389](https://github.com/handsontable/handsontable/pull/10389)
- Added support for collapsing/expanding columns using a keyboard shortcut. [#10404](https://github.com/handsontable/handsontable/pull/10404)
- Added support for collapsing/expanding nested rows using a keyboard shortcut. [#10405](https://github.com/handsontable/handsontable/pull/10405)
- Added support for column sorting using a keyboard shortcut. [#10410](https://github.com/handsontable/handsontable/pull/10410)
- Added keyboard shortcuts for opening the column menu. [#10413](https://github.com/handsontable/handsontable/pull/10413)
- Added a keyboard shortcut for opening the context menu. [#10417](https://github.com/handsontable/handsontable/pull/10417)
- Added a keyboard shortcut for scrolling the viewport [#10419](https://github.com/handsontable/handsontable/pull/10419)
- Added a keyboard shortcut for clearing the filters. [#10420](https://github.com/handsontable/handsontable/pull/10420)
- Added a keyboard shortcut for managing cell comments. [#10421](https://github.com/handsontable/handsontable/pull/10421)
- Added the ability to traverse the grid within a webpage using the `TAB` key and introduced a new `tabNavigation` option. [#10430](https://github.com/handsontable/handsontable/pull/10430) [#10585](https://github.com/handsontable/handsontable/pull/10585)
- Added ARIA tags to the table elements. [#10463](https://github.com/handsontable/handsontable/pull/10463)
- Added ARIA tags to the autocomplete editor. [#10524](https://github.com/handsontable/handsontable/pull/10524)
- Added test cases to ensure the dropdown editor's ARIA tags are correct. [#10526](https://github.com/handsontable/handsontable/pull/10526)
- Added the `aria-label` attribute to the checkbox renderer. [#10539](https://github.com/handsontable/handsontable/pull/10539)
- Added keyboard shortcuts and `role` attributes to the filtering menu's links. [#10548](https://github.com/handsontable/handsontable/pull/10548)
- Added ARIA tags and improved accessibility of the dropdown menu. [#10541](https://github.com/handsontable/handsontable/pull/10541)
- Added the ability to navigate the headers with the keyboard by introducing a new `navigableHeaders` option along with other changes. [#10301](https://github.com/handsontable/handsontable/pull/10301)
- Added a new `beforeSelectionHighlightSet` hook that allows modifying logical selection coordinates before they are applied to the rendering engine. [#10513](https://github.com/handsontable/handsontable/pull/10513)
- Implemented the `select` renderer and cell type. [#10529](https://github.com/handsontable/handsontable/pull/10529)
- Added an accessibility demo for javascript and React. [#10532](https://github.com/handsontable/handsontable/pull/10532)
- Added `handsontable` and `date` renderers for their respective cell types to allow adding the a11y attributes. [#10535](https://github.com/handsontable/handsontable/pull/10535)
- Added new `beforeColumnWrap` and `beforeRowWrap` hooks. [#10550](https://github.com/handsontable/handsontable/pull/10550)
- Add a set of `angular@17` examples to ensure Handsontable works with that Angular version. [#10584](https://github.com/handsontable/handsontable/pull/10584)

### Changed

- **Breaking change**: Changed the way the table reacts to using the "select all cells" methods and shortcuts. [#10461](https://github.com/handsontable/handsontable/pull/10461)
- **Breaking change**: Changed the colors of the invalid cells and the arrow buttons of the autocomplete-typed cells. [#10520](https://github.com/handsontable/handsontable/pull/10520)
- **Breaking change**: Improved the navigation and accessibility of the Filtering Dropdown Menu. [#10530](https://github.com/handsontable/handsontable/pull/10530)
- **Breaking change**: Changed the way Handsontable handles focus by focusing the browser on cell elements. Introduced a new `imeFastEdit` option to minimize the negative effects affecting the "fast edit" feature for the IME users. [#10342](https://github.com/handsontable/handsontable/pull/10342)
- Extended the Core's `scrollViewportTo` method to allow disabling of cell auto-snapping. [#10508](https://github.com/handsontable/handsontable/pull/10508)
- Improved the keyboard navigation for the context and dropdown menus and added a new `forwardToContext` option to the ShortcutManager. [#10519](https://github.com/handsontable/handsontable/pull/10519)
- Improved DX by adding an exception to be thrown when trying to activate a shortcut context that has been not yet registered. [#10476](https://github.com/handsontable/handsontable/pull/10476)
- Improved the performance of the table for cases when the table is hidden. [#10490](https://github.com/handsontable/handsontable/pull/10490)
- Updated the TS definitions for the HiddenRows and HiddenColumns plugins. [#10492](https://github.com/handsontable/handsontable/pull/10492)
- Updated the TS definitions for the AutoRowSize and AutoColumnSize plugins. [#10493](https://github.com/handsontable/handsontable/pull/10493)
- Updated the TS definitions for the Filters plugin and the Core methods. [#10494](https://github.com/handsontable/handsontable/pull/10494)
- Fixed the typescript type definitions in the packages' `package.json` files. [#10509](https://github.com/handsontable/handsontable/issues/10509)
- Changed the default styling of the "OK" button in the Filtering Dropdown when it's focus. [#10558](https://github.com/handsontable/handsontable/issues/10558)

### Fixed

- Fixed an issue where copying values containing an ampersand resulted in a wrong values being pasted. [#10472](https://github.com/handsontable/handsontable/pull/10472)
- Fixed an issue related to the backlight position misalignment for the `ManualRowMove` and `ManualColumnMove` plugins. [#10475](https://github.com/handsontable/handsontable/pull/10475)
- Fixed a problem with row header widths changing sizes after adding/deleting rows. [#10479](https://github.com/handsontable/handsontable/pull/10479)
- Fixed a problem with the `offset` helper for elements placed in foreign object contexts. [#10480](https://github.com/handsontable/handsontable/issues/10480)
- Fixed problems with size and alignment of the table when placed under elements with the CSS `transform: scale` attribute applied. [#10482](https://github.com/handsontable/handsontable/pull/10482)
- Added the missing `updateData` value to the `ChangeSource` type. [#10488](https://github.com/handsontable/handsontable/pull/10488)
- Fixed a bug where pressing `Ctrl/Cmd` does not trigger non-contiguous selection. [#10502](https://github.com/handsontable/handsontable/pull/10502)
- Fixed a problem with the editor having incorrect width and height. [#10504](https://github.com/handsontable/handsontable/pull/10504)
- Fixed visual glitches (unwanted pixels) of the `Autocomplete` editor's list in cases when there were no items. [#10506](https://github.com/handsontable/handsontable/pull/10506)
- Fixed the Vue and React demo's dependencies to be able to use the demos with Stackblitz. [#10523](https://github.com/handsontable/handsontable/pull/10523)
- Fixed a problem with the merged cells having wrong row heights. [#10500](https://github.com/handsontable/handsontable/pull/10500)
- Fixed the accessibility issues in the documentation. [#10574](https://github.com/handsontable/handsontable/pull/10574)
- Updated the demos for better accessibility. [#10563](https://github.com/handsontable/handsontable/pull/10563)
- Fixed a problem with the text editor's width being calculated incorrectly. [#10590](https://github.com/handsontable/handsontable/pull/10590)
- Fixed a problem with two cells being selected after `Ctrl/Cmd + Shift` key combination. [#10622](https://github.com/handsontable/handsontable/pull/10622)

For more information on Handsontable 14.0.0, see:

- [Blog post (14.0.0)](https://handsontable.com/blog/whats-new-in-handsontable-14-improvements-to-accessibility)
- [Documentation (14.0)](https://handsontable.com/docs/14.0)
- [Release notes (14.0.0)](https://handsontable.com/docs/release-notes/#_14-0-0)
- [Migration guide (13.1 → 14.0)](https://handsontable.com/docs/migration-from-13.1.0-to-14.0/)

## [13.1.0] - 2023-08-31

### Changed

- Optimized the transpilation process of the distribution files. [#10440](https://github.com/handsontable/handsontable/pull/10440)
- Updated the internal monorepo scripts to utilize Node 20. [#10468](https://github.com/handsontable/handsontable/pull/10468)

### Fixed

- Fixed a problem with errors being thrown when pressing `delete` or `backspace` keys after deselecting cells. [#10272](https://github.com/handsontable/handsontable/issues/10272)
- Fixed problems with moving rows when there are trimmed rows in the table. [#10399](https://github.com/handsontable/handsontable/pull/10399)
- Fixed a problem with the column resize handle being stuck after the user clicked the right mouse button.  [#10416](https://github.com/handsontable/handsontable/pull/10416)
- Extended the type definition of `CellChange` to match the actual implementation. [#10432](https://github.com/handsontable/handsontable/issues/10432)
- Fixed a typo in the `CopyPaste` plugin's `copy` method argument. [#10446](https://github.com/handsontable/handsontable/pull/10446)
- Fixed the mobile selection handlers that disappeared below the table headers when multiple cells were selected. [#10447](https://github.com/handsontable/handsontable/pull/10447)
- Fixed the Merge Cells plugin's problem with updating the cell meta after unmerging the previously-merged cells, which resulted in the Autofill plugin not working properly. [#10456](https://github.com/handsontable/handsontable/issues/10456)
- Added the missing type definition for `BaseEditor`'s `getEditedCellRect` method. [#10459](https://github.com/handsontable/handsontable/issues/10459)
- Corrected the type definitions for the Context Menu. [#9566](https://github.com/handsontable/handsontable/issues/9566)
- React: Mark an internal prop of the React wrapper's base editor component as optional. [#10429](https://github.com/handsontable/handsontable/issues/10429)

For more information on Handsontable 13.1.0, see:

- [Blog post (13.1.0)](https://handsontable.com/blog/handsontable-13-1-0-reduced-bundle-size-and-bug-fixes)
- [Documentation (13.1)](https://handsontable.com/docs/13.1)
- [Release notes (13.1.0)](https://handsontable.com/docs/release-notes/#_13-1-0)

## [13.0.0] - 2023-06-22

### Added

- Angular: Added support for Angular 16. [#10396](https://github.com/handsontable/handsontable/pull/10396)

### Changed

- **Breaking change (React, Angular, Vue 2, Vue 3)**: Changed Handsontable's policy toward older versions of supported frameworks. From now on, Handsontable supports only those versions of any supported frameworks that are officially supported by their respective teams. Dropping Handsontable's support for any older framework versions won't be treated as a breaking change. [#10396](https://github.com/handsontable/handsontable/pull/10396)
- **Breaking change**: Changed the order in which three hooks are executed: now, the `beforeChange` hook is fired before the `afterSetDataAtCell` and `afterSetDataAtRowProp` hooks. [#10231](https://github.com/handsontable/handsontable/pull/10231)
- Changed the margins of the context menu in the RTL layout direction. [#10375](https://github.com/handsontable/handsontable/pull/10375)

### Removed

- **Breaking change (Angular)**: Dropped support for Angular 13 and lower. From now on, Handsontable supports only those versions of Angular that are officially supported by the Angular team: currently, it's 14-16. However, Handsontable 13.0.0 was thoroughly tested and, to the best of our knowledge, works correctly with versions down to Angular 12. [#10396](https://github.com/handsontable/handsontable/pull/10396)
- **Breaking change**: Removed the deprecated `beforeAutofillInsidePopulate` hook. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated `getFirstNotHiddenIndex` method. Instead, use the `getNearestNotHiddenIndex()` method. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated parameters of the `alter()` method: `insert_row` and `insert_col`. Instead, use the following parameters: `insert_row_above`, `insert_row_below`, `insert_col_start`, and `insert_col_end`. [#10407](https://github.com/handsontable/handsontable/pull/10407)
- **Breaking change**: Removed the deprecated parameters of the `populateFromArray()` method: `direction` and `deltas`. [#10407](https://github.com/handsontable/handsontable/pull/10407)

### Fixed

- Fixed an issue where the "Read only" icon of the context menu displayed incorrectly in the RTL layout direction. [#10375](https://github.com/handsontable/handsontable/pull/10375)

For more information on Handsontable 13.0.0, see:

- [Blog post (13.0.0)](https://handsontable.com/blog/handsontable-13-0-0-support-for-angular-16-and-new-frameworks-support-policy)
- [Documentation (13.0)](https://handsontable.com/docs/13.0)
- [Migration guide (12.4 → 13.0)](https://handsontable.com/docs/migration-from-12.4-to-13.0)
- [Release notes (13.0.0)](https://handsontable.com/docs/release-notes/#_13-0-0)

## [12.4.0] - 2023-05-23

### Added

- Added two new Handsontable hooks, `afterColumnSequenceChange` and `afterRowSequenceChange`, which are fired after changing the order of columns or rows, respectively. [#10215](https://github.com/handsontable/handsontable/pull/10215)

### Fixed

- Fixed numerous issues related to syncing Handsontable with HyperFormula. Now, formulas work properly with all the Handsontable features. [#10215](https://github.com/handsontable/handsontable/pull/10215)
- Fixed na issue where formulas didn't recalculate after rows or columns were moved. [#4668](https://github.com/handsontable/handsontable/issues/4668)
- Fixed an issue where Handsontable's dates didn't sync correctly with HyperFormula's dates. [#10085](https://github.com/handsontable/handsontable/issues/10085)
- Fixed an issue where calling `updateSettings()` would reset HyperFormula's undo/redo actions stack. [#10326](https://github.com/handsontable/handsontable/pull/10326)
- Fixed an issue where the `Autofill`, `TrimRows` and `Formulas` plugins didn't work properly together. [#10200](https://github.com/handsontable/handsontable/issues/10200)
- Fixed an issue where the `modifySourceData` hook used the wrong type of indexes. [#10215](https://github.com/handsontable/handsontable/pull/10215)
- Fixed an issue where text copied from Handsontable to Excel included wrong types of spaces. [#10017](https://github.com/handsontable/handsontable/issues/10017)
- Fixed an issue where mousing over the same cell twice didn't trigger the `beforeOnCellMouseOver` and `afterOnCellMouseOver` hooks. [#10321](https://github.com/handsontable/handsontable/pull/10321)
- Updated TypeScript definition files related to the `CustomBorders` plugin. [#10360](https://github.com/handsontable/handsontable/pull/10360)
- Fixed an issue where moving rows manually to the bottom was difficult due the misalignment between the backlight and guideline elements. [#9556](https://github.com/handsontable/handsontable/issues/9556)

For more information on Handsontable 12.4.0, see:

- [Blog post (12.4.0)](https://handsontable.com/blog/handsontable-12-4-0-auto-updating-formulas)
- [Documentation (12.4)](https://handsontable.com/docs/12.4)
- [Release notes (12.4.0)](https://handsontable.com/docs/release-notes/#_12-4-0)

## [12.3.3] - 2023-03-28

### Added

- Added a Chinese (zh-CN) translation of the "Copy with headers" feature. [#10273](https://github.com/handsontable/handsontable/pull/10273)
- Added a new guide: Rows sorting. [#10183](https://github.com/handsontable/handsontable/pull/10183)

### Fixed

- Fixed an issue where column-filter checkboxes got reset when the table was scrolled out of view. We solved this by preventing the table from triggering a complete render each time it leaves the viewport. [#10206](https://github.com/handsontable/handsontable/pull/10206)
- Fixed an issue where clicking on a cell scrolled the table sideways in certain RTL configurations. [#10206](https://github.com/handsontable/handsontable/pull/10206)
- Fixed an issue where calling [`getDataAtCol()`](https://handsontable.com/docs/javascript-data-grid/api/core/#getdataatcol) or [`getDataAtProp()`](https://handsontable.com/docs/javascript-data-grid/api/core/#getdataatprop) caused an error in case of data sets with more than 125 000 rows. [#10226](https://github.com/handsontable/handsontable/pull/10226)
- React: Fixed React 18 warnings about deprecated lifecycle methods. We removed `componentWillMount()` and `componentWillUpdate()` from Handsontable's codebase and recreated their functionality by using React's portals. [#10263](https://github.com/handsontable/handsontable/pull/10263)

For more information on Handsontable 12.3.3, see:

- [Blog post (12.3.3)](https://handsontable.com/blog/handsontable-12-3-3-better-support-for-react-18-and-large-data-sets)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)
- [Release notes (12.3.3)](https://handsontable.com/docs/release-notes/#_12-3-3)

## [12.3.2] - 2023-03-23

Handsontable 12.3.2 may not work properly with React's functional components. If you're using React, you should upgrade to 12.3.3.

## [12.3.1] - 2023-02-06

### Added

- Added a Japanese translation of the "Copy with headers" feature.
  [#10201](https://github.com/handsontable/handsontable/pull/10201)

### Removed

- Removed the two-week delay in showing the console warning about license expiration.
  [#10175](https://github.com/handsontable/handsontable/pull/10175)

### Fixed

- Fixed an issue where `updateData()` didn't work with nested data structures (`NestedRows`).
  [#10178](https://github.com/handsontable/handsontable/pull/10178)
- Fixed an issue of unwanted pixels in the "Filter by condition" menu by removing a superfluous
  overlay. [#10174](https://github.com/handsontable/handsontable/pull/10174)
- Fixed an issue where merged cells could lack right and bottom borders due to a Chrome bug.
  [#10212](https://github.com/handsontable/handsontable/pull/10212)
- Fixed an issue where using some browser and system shortcuts could cause Handsontable to behave as
  if <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> was being held down.
  [#10210](https://github.com/handsontable/handsontable/pull/10210)

For more information on Handsontable 12.3.1, see:

- [Blog post (12.3.1)](https://handsontable.com/blog/articles/2023/2/handsontable-12.3.1-japanese-translation-and-improved-keyboard-interaction)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)
- [Release notes (12.3.1)](https://handsontable.com/docs/release-notes/#_12-3-1)

## [12.3.0] - 2022-12-14

### Added

- Added a new feature that lets you copy the contents of column headers by using 3 new context menu
  options: "Copy with headers", "Copy with group headers", and "Copy headers only".
  [#2288](https://github.com/handsontable/handsontable/issues/2288)
- Added 4 new API methods for copying column headers programmatically: `copyCellsOnly()`,
  `copyWithColumnHeaders()`, `copyWithAllColumnHeaders()`, and `copyColumnHeadersOnly()`.
  [#2288](https://github.com/handsontable/handsontable/issues/2288)
- Added missing TypeScript definitions of the `CellCoords` and `CellRange` classes, which are used
  in the arguments of some of the APIs.
  [#9755](https://github.com/handsontable/handsontable/issues/9755)
- Added missing TypeScript definitions for the following Handsontable hooks: `beforeColumnFreeze`,
  `afterColumnFreeze`, `beforeColumnUnfreeze`, and `afterColumnUnfreeze`.
  [#9859](https://github.com/handsontable/handsontable/issues/9859)

### Fixed

- Fixed an issue where the `UndoRedo` plugin didn't work properly with preconfigured columns.
  [#10108](https://github.com/handsontable/handsontable/pull/10108)
- Fixed an issue where formulas inserted programmatically by using `updateData()` were not
  evaluated. [#10011](https://github.com/handsontable/handsontable/issues/10011)
- Fixed a regression where setting a column's `type` could overwrite other custom-defined settings.
  [#10128](https://github.com/handsontable/handsontable/pull/10128)
- Fixed an issue where Handsontable didn't render properly when initialized inside of a hidden
  container. [#5322](https://github.com/handsontable/handsontable/issues/5322)
- Fixed an issue of desynchronization between configuration options (cell meta) and Handsontable's
  data. The issue occurred when Handsontable's options were modified through the following hooks:
  `beforeCreateRow`, `afterCreateRow`, `beforeCreateCol`, and `afterCreateCol`.
  [#10136](https://github.com/handsontable/handsontable/pull/10136)
- Fixed an issue where comments added to fixed columns didn't display properly after scrolling.
  [#9645](https://github.com/handsontable/handsontable/issues/9645)
- Fixed an issue where typing in a `dropdown` editor caused the IME to disappear, resulting in wrong
  characters being typed. [#9672](https://github.com/handsontable/handsontable/issues/9672)
- React: Fixed an issue where `dropdown` cells weren't validated properly when using the `HotColumn`
  component. [#10065](https://github.com/handsontable/handsontable/issues/10065)

For more information on Handsontable 12.3.0, see:

- [Blog post (12.3.0)](https://handsontable.com/blog/articles/2022/12/handsontable-12-3-0-copying-cells-with-headers)
- [Documentation (12.3)](https://handsontable.com/docs/12.3)
- [Release notes (12.3.0)](https://handsontable.com/docs/release-notes/#_12-3-0)

## [12.2.0] - 2022-10-25

### Added

- Added a new feature that lets you add rows and columns at a specified position. Now, the `alter()`
  method takes 4 new parameter values: `insert_row_above`, `insert_row_below`, `insert_col_start`,
  and `insert_col_end`. [#9471](https://github.com/handsontable/handsontable/issues/9471)

### Deprecated

- Deprecated the `insert_row` parameter of the `alter()` method. Instead, use `insert_row_above` or
  `insert_row_below`. [#9471](https://github.com/handsontable/handsontable/issues/9471)
- Deprecated the `insert_col` parameter of the `alter()` method. Instead, use `insert_col_start` or
  `insert_col_end`. [#9471](https://github.com/handsontable/handsontable/issues/9471)

### Removed

- Removed a type definition for a non-existing method, `translateRowsToColumns()`.
  [#9919](https://github.com/handsontable/handsontable/issues/9919)

### Fixed

- Fixed an issue where the width of the cell editor was calculated incorrectly.
  [#3815](https://github.com/handsontable/handsontable/issues/3815)
- Fixed an issue where formulas surrounded by merged cells were converted to values by mistake.
  [#6359](https://github.com/handsontable/handsontable/issues/6359)
- Fixed an issue where Handsontable could disappear on Firefox 93 (and later) in a specific use
  case. [#9545](https://github.com/handsontable/handsontable/issues/9545)
- Fixed an issue where changing a cell's `type` through `setCellMeta()` didn't properly set the
  cell's `editor` and `renderer`. [#9734](https://github.com/handsontable/handsontable/issues/9734)
- Fixed an issue where the dropdown menu didn't display when the `NestedHeaders` plugin was enabled
  and all rows were trimmed out. [#9753](https://github.com/handsontable/handsontable/issues/9753)

For more information on Handsontable 12.2.0, see:

- [Blog post (12.2.0)](https://handsontable.com/blog/handsontable-12.2.0)
- [Documentation (12.2)](https://handsontable.com/docs/12.2)
- [Release notes (12.2.0)](https://handsontable.com/docs/release-notes/#_12-2-0)

## [12.1.3] - 2022-09-22

### Removed

- Removed a custom stable sorting implementation in favor of the built-in sorting algorithm
  [#6091](https://github.com/handsontable/handsontable/issues/6091)
- Removed type definitions for non-existing methods `rowOffset` and `colOffset` and a non-existing
  hook `modifyRowSourceData`. [#8659](https://github.com/handsontable/handsontable/issues/8659),
  [#7317](https://github.com/handsontable/handsontable/issues/7317)

### Fixed

- Fixed incorrect date format conversion on input in the date editor.
  [#9681](https://github.com/handsontable/handsontable/issues/9681)
- Fixed an error when adding a large number of rows using the `alter` method.
  [#7840](https://github.com/handsontable/handsontable/issues/7840)
- Fixed IME text input in the editors.
  [#9586](https://github.com/handsontable/handsontable/issues/9586)
- Fixed an issue where the editor did not open on key events when the cell was outside the viewport.
  [#9022](https://github.com/handsontable/handsontable/issues/9022)
- Fixed an issue with "0" values being ignored by the Column Summary plugin.
  [#6385](https://github.com/handsontable/handsontable/issues/6385)
- Fixed an error when opening the column dropdown menu with the Filters plugin enabled.
  [#9561](https://github.com/handsontable/handsontable/issues/9561)
- Fixed an issue where the `trimWhitespace` option could not be used in the column and cell levels
  of the cascading configuration. [#7387](https://github.com/handsontable/handsontable/issues/7387)
- Fixed the flickering of the selection area at the edge of the table while scrolling.
  [#8317](https://github.com/handsontable/handsontable/issues/8317)
- Fixed misalignment on mobile devices when the edge cells were selected.
  [#9621](https://github.com/handsontable/handsontable/issues/9621)
- Fixed type definitions for the method `setSourceDataAtCell`.
  [#8599](https://github.com/handsontable/handsontable/issues/8599)

For more information on Handsontable 12.1.3, see:

- [Documentation (12.1)](https://handsontable.com/docs/12.1)
- [Release notes (12.1.3)](https://handsontable.com/docs/release-notes/#_12-1-3)

## [12.1.2] - 2022-07-08

### Changed

- Changed the version of the Moment.js dependency from 2.29.3 to 2.29.4, in reaction to a
  recently-found Moment.js security vulnerability. The vulnerability did not affect a correct
  configuration of Handsontable. [#9638](https://github.com/handsontable/handsontable/issues/9638)
- Vue: Freezed the version of the Vue framework that is used in our build chain to ~2.6. This
  shouldn't affect apps that use Vue 2.7+.
  [#9624](https://github.com/handsontable/handsontable/issues/9624)

For more information on Handsontable 12.1.2, see:

- [Documentation (12.1)](https://handsontable.com/docs/12.1)
- [Release notes (12.1.2)](https://handsontable.com/docs/release-notes/#_12-1-2)

## [12.1.1] - 2022-07-05

### Fixed

- Angular: Fixed an issue where the installation of `@handsontable/angular` package failed for
  versions of Angular other than 9 [#9622](https://github.com/handsontable/handsontable/issues/9622)

For more information on Handsontable 12.1.1, see:

- [Documentation (12.1)](https://handsontable.com/docs/12.1)
- [Release notes (12.1.1)](https://handsontable.com/docs/release-notes/#_12-1-1)

## [12.1.0] - 2022-06-28

### Added

- Added smoother row and column moving when some row or columns are hidden.
  [#7613](https://github.com/handsontable/handsontable/issues/7613)
- Added `getNearestNotHiddenIndex()`, a new method that finds the visual index of the nearest
  not-hidden row or column and works even with large numbers of hidden rows or columns. The previous
  method, `getFirstNotHiddenIndex()`, still works, but is marked as deprecated.
  [#9064](https://github.com/handsontable/handsontable/issues/9064)
- Added a Czech translation. [#9343](https://github.com/handsontable/handsontable/issues/9343)
- Added a Serbian translation. [#9469](https://github.com/handsontable/handsontable/issues/9469)
- Added new hooks: `beforeColumnFreeze`, `afterColumnFreeze`, `beforeColumnUnfreeze`, and
  `afterColumnUnfreeze`. [#9248](https://github.com/handsontable/handsontable/issues/9248)

### Changed

- Replaced HTML entities appearing in Handsontable's license texts with canonical counterparts.
  [#9487](https://github.com/handsontable/handsontable/issues/9487)
- Updated the Pikaday optional dependency to 1.8.2, to let Handsontable work with Parcel 2 without
  errors. [#9410](https://github.com/handsontable/handsontable/issues/9410)
- React: Changed the wrapper's lifecycle methods, to let Handsontable work with React 17+ without
  warnings. [#8748](https://github.com/handsontable/handsontable/issues/8748)
- Angular: Moved the `@angular/core` dependency to peer dependencies.
  [#9574](https://github.com/handsontable/handsontable/issues/9574)

### Deprecated

- Deprecated the `getFirstNotHiddenIndex()` method. Use `getNearestNotHiddenIndex()` instead.
  [#9064](https://github.com/handsontable/handsontable/issues/9064)

### Fixed

- Fixed an issue where dropdown and autocomplete cell editors rendered incorrectly if the
  `preventOverflow` option was set to `'horizontal'`.
  [#3828](https://github.com/handsontable/handsontable/issues/3828)
- Fixed an issue where frozen rows were getting duplicated.
  [#4454](https://github.com/handsontable/handsontable/issues/4454)
- Fixed an issue where comments rendered outside the viewport.
  [#4785](https://github.com/handsontable/handsontable/issues/4785)
- Fixed an issue where comments got positioned incorrectly when Handsontable ran within a scrollable
  element. [#6744](https://github.com/handsontable/handsontable/issues/6744)
- Fixed an issue that occurred when Handsontable ran within an HTML `<form>`: pressing
  <kbd>Enter</kbd> inside another form's `<input>` could open Handsontable's dropdown menu.
  [#9295](https://github.com/handsontable/handsontable/issues/9295)
- Fixed an issue where it was impossible to unmerge cells in the RTL layout direction.
  [#9362](https://github.com/handsontable/handsontable/issues/9362)
- Fixed an issue where columns wider than the viewport's width and rows higher than the viewport's
  height didn't render correctly. [#9473](https://github.com/handsontable/handsontable/issues/9473)
- Fixed an issue where dragging-to-scroll on mobile didn't work properly in the RTL layout
  direction. [#9475](https://github.com/handsontable/handsontable/issues/9475)
- Fixed an issue where hiding columns with nested headers caused incorrect column width calculation
  (for the `stretchH: 'all'` option).
  [#9496](https://github.com/handsontable/handsontable/issues/9496)
- Fixed an issue where `ShortcutManager` unnecessarily handled `keyup` events with no `key` defined.
  [#9562](https://github.com/handsontable/handsontable/issues/9562)

For more information on Handsontable 12.1.0, see:

- [Blog post (12.1.0)](https://handsontable.com/blog/handsontable-12.1.0-data-grid-new-hooks-new-translations-and-rendering-improvements)
- [Documentation (12.1)](https://handsontable.com/docs/12.1)
- [Release notes (12.1.0)](https://handsontable.com/docs/release-notes/#_12-1-0)

## [12.0.1] - 2022-05-16

### Fixed

- Fixed an issue where checking or unchecking a checkbox in a row with `autoRowSize: true` and
  multi-line cell values caused rows to align incorrectly.
  [#7102](https://github.com/handsontable/handsontable/issues/7102)
- Fixed an issue where checking or unchecking a checkbox changed the cell width.
  [#8211](https://github.com/handsontable/handsontable/issues/8211)
- Fixed an issue where using a single Handsontable instance with multiple HyperFormula sheets could
  lead to an uncaught `TypeError`. [#8268](https://github.com/handsontable/handsontable/issues/8268)
- Fixed an issue where nested column headers didn't expand properly.
  [#9099](https://github.com/handsontable/handsontable/issues/9099)
- Fixed an issue where updating custom borders could lead to uncaught error exceptions.
  [#9455](https://github.com/handsontable/handsontable/issues/9455)

For more information on Handsontable 12.0.1, see:

- [Documentation (12.0)](https://handsontable.com/docs/12.0)
- [Release notes (12.0.1)](https://handsontable.com/docs/release-notes/#_12-0-1)

## [12.0.0] - 2022-04-28

### Added

- Added `ShortcutManager`, a new API for customizing keyboard shortcuts.
  [#8942](https://github.com/handsontable/handsontable/issues/8942)
- Added support for right-to-left (RTL) languages, introducing a new configuration option:
  `layoutDirection`. [#8760](https://github.com/handsontable/handsontable/issues/8760)
- Added an Arabic translation. [#9208](https://github.com/handsontable/handsontable/issues/9208)
- Added a new configuration option: `fixedColumnsStart`.
  [#8760](https://github.com/handsontable/handsontable/issues/8760)
- Added a new keyboard shortcut (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd>) for filling the
  selected range of cells with the value of the active cell.
  [#9366](https://github.com/handsontable/handsontable/issues/9366)
- Added support for the <kbd>Home</kbd> and <kbd>End</kbd> keys inside cell editors, for moving the
  cursor to the beginning or end of the text.
  [#9367](https://github.com/handsontable/handsontable/issues/9367)
- Added support for the latest Node LTS version.
  [#9149](https://github.com/handsontable/handsontable/issues/9149)

### Changed

- **Breaking change**: Changed how `updateSettings()` handles data updates, to improve performance
  and the consistency of user experience. Now, when provided with a new data object,
  `updateSettings()` updates the data without resetting any states.
  [#7263](https://github.com/handsontable/handsontable/issues/7263)
- **Breaking change (React, Angular, Vue 2, Vue 3)**: Updating your data through a component
  property no longer resets your index mapper information and configuration options.
  [#7263](https://github.com/handsontable/handsontable/issues/7263)
- **Breaking change**: Changed how `updatePlugin()` reacts to `updateSettings()` calls, to improve
  performance and the consistency of user experience. Now, calls to `updateSettings()` update a
  plugin's state only when the options object contains a configuration option that's relevant to
  that particular plugin. [#9021](https://github.com/handsontable/handsontable/issues/9021)
- **Breaking change**: Changed the order of execution for two hooks: now, `beforeKeyDown` is
  properly fired before `afterDocumentKeyDown`.
  [#6236](https://github.com/handsontable/handsontable/issues/6236)
- **Breaking change**: Changed how default keyboard shortcuts are defined, to improve keyboard
  navigation consistency. Most of the shortcuts did not change and are now properly documented in
  the
  [keyboard shortcuts](https://handsontable.com/docs/keyboard-shortcuts/#default-keyboard-shortcuts)
  guide. However, some shortcuts that were not defined explicitly, and were not listed in the
  documentation, don't work anymore (e.g., <kbd>Enter</kbd> opens a cell's editor, but
  <kbd>Ctrl</kbd>+<kbd>Enter</kbd> doesn't). This change doesn't affect custom keyboard shortcuts.
  [#8942](https://github.com/handsontable/handsontable/issues/8942)
- **Breaking change**: Split a cross-platform modifier key (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>) into two
  separate keys, to improve keyboard navigation consistency. Now, the <kbd>Cmd</kbd> key triggers
  actions on macOS where the <kbd>Ctrl</kbd> key triggers actions on Windows. For example, on macOS,
  <kbd>Ctrl</kbd>+<kbd>A</kbd> doesn't work anymore: <kbd>Cmd</kbd>+<kbd>A</kbd> is used
  instead. [#9369](https://github.com/handsontable/handsontable/issues/9369)
- **Breaking change**: Changed the actions of the following
  [keyboard shortcuts](https://handsontable.com/docs/keyboard-shortcuts/#default-keyboard-shortcuts),
  to match the usual spreadsheet software behavior, and provide a more intuitive user experience:
  <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>↑</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd> +
  <kbd>↑</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>↓</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> +
  <kbd>Shift</kbd>+<kbd>↓</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>←</kbd>,
  <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>←</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> +
  <kbd>→</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>→</kbd>, <kbd>Home</kbd>,
  <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Home</kbd>, <kbd>End</kbd>, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> +
  <kbd>End</kbd>, <kbd>Shift</kbd>+<kbd>Page Up</kbd>, and <kbd>Shift</kbd>+<kbd>Page
  Down</kbd>. [#9363](https://github.com/handsontable/handsontable/issues/9363)
  [#9364](https://github.com/handsontable/handsontable/issues/9364)
  [#9365](https://github.com/handsontable/handsontable/issues/9365)
- Changed two scripts of the main Handsontable workspace (`./`), to speed up the build process: now,
  the `npm run build` and `npm run test` scripts don't build or test the Handsontable examples
  (`./examples`). [#9412](https://github.com/handsontable/handsontable/issues/9412)
- Changed the version of the Moment.js dependency from 2.24.0 to 2.29.3, in reaction to a
  recently-found Moment.js security vulnerability that did not directly affect Handsontable.
  [#9381](https://github.com/handsontable/handsontable/issues/9381)
- Changed the version of the HyperFormula optional dependency from ^1.2.0 to ^2.0.0.
  [#9411](https://github.com/handsontable/handsontable/issues/9411)
- Changed an internal property name, from `hot.view.wt` to `hot.view._wt`, where `hot` is the name
  of your Handsontable instance. The intention of this change is to make it clear that Walkontable
  (Handsontable's rendering engine) is not a part of Handsontable's public API.
  [#8760](https://github.com/handsontable/handsontable/issues/8760)

### Removed

- **Breaking change**: Removed the <kbd>Cmd</kbd>+<kbd>M</kbd> keyboard shortcut (used for cell
  merging), as it conflicted with window minimizing on macOS. The <kbd>Ctrl</kbd>+<kbd>M</kbd>
  keyboard shortcut works the same as before.
  [#9368](https://github.com/handsontable/handsontable/issues/9368)
- **Breaking change**: Removed the <kbd>Shift</kbd>+<kbd>Page Up</kbd>/<kbd>Page Down</kbd>
  keyboard shortcuts from the cell editing context.
  [#9401](https://github.com/handsontable/handsontable/issues/9401)
- Dropped support for Internet Explorer 11 and Edge Legacy (the non-Chromium version of Edge).
  Handsontable 11.x becomes the long-term support (LTS) version for Internet Explorer 11 and Edge
  Legacy, until the end of 2023. [#7026](https://github.com/handsontable/handsontable/issues/7026)
- React: Removed the `enzyme` dependency from the React wrapper.
  [#9151](https://github.com/handsontable/handsontable/issues/9151)

### Fixed

- React, Angular, Vue 2, Vue 3: Fixed an issue where using `updateSettings()` caused problems for
  state managers. [#8372](https://github.com/handsontable/handsontable/issues/8372)
- Fixed an issue where using `updateSettings()` caused hidden columns to reappear.
  [#7165](https://github.com/handsontable/handsontable/issues/7165)
- Fixed an issue where using `updateSettings()` caused merged cells to unmerge.
  [#3315](https://github.com/handsontable/handsontable/issues/3315)
- Fixed an issue where using `updateSettings()` caused the state of nested rows to reset.
  [#8838](https://github.com/handsontable/handsontable/issues/8838)
- Fixed an issue where using `updateSettings()` caused problems with column sorting.
  [#7688](https://github.com/handsontable/handsontable/issues/7688)
- React: Fixed an issue where using React's `setState()` within the `afterFilter` hook broke
  filtering. [#7567](https://github.com/handsontable/handsontable/issues/7567)
- Vue 2: Fixed an issue where repeatedly changing Handsontable's height through `updateSettings()`
  caused Handsontable to crash. [#7546](https://github.com/handsontable/handsontable/issues/7546)
- Vue 2: Fixed an issue where the `failed` validation status got erased when editing a new row.
  [#7541](https://github.com/handsontable/handsontable/issues/7541)
- Fixed an issue where cell filtering did not use formula results.
  [#5455](https://github.com/handsontable/handsontable/issues/5455)
- Fixed a wrong TypeScript definition in the `BasePlugin` class.
  [#9175](https://github.com/handsontable/handsontable/issues/9175)
- Fixed an issue where the <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Z</kbd> and
  <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> keyboard shortcuts didn't behave
  properly inside cell editors. [#9367](https://github.com/handsontable/handsontable/issues/9367)
- Fixed an issue where the dropdown menu contained unwanted rectangle elements.
  [#9240](https://github.com/handsontable/handsontable/issues/9240)
- React, Vue 2, Vue 3: Fixed an issue with registering modules for the React, Vue 2, and Vue 3
  wrappers, by adding an `"exports"` field to their `package.json` files.
  [#9140](https://github.com/handsontable/handsontable/issues/9140)

For more information on Handsontable 12.0.0, see:

- [Blog post (12.0.0)](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)
- [Documentation (12.0)](https://handsontable.com/docs/12.0)
- [Migration guide (11.1 → 12.0)](https://handsontable.com/docs/migration-from-11.1-to-12.0)
- [Release notes (12.0.0)](https://handsontable.com/docs/release-notes/#_12-0-0)

## [11.1.0] - 2022-01-13

### Added

- Added `updateData()`, a new method that allows for replacing Handsontable's `data` without
  resetting the states of cells, rows and columns.
  [#7263](https://github.com/handsontable/handsontable/issues/7263)
- Vue: Added Vue 3 support, by introducing a new wrapper.
  [#7545](https://github.com/handsontable/handsontable/issues/7545)

### Changed

- Updated the TypeScript definition of the `setDataAtCell()` method.
  [#8601](https://github.com/handsontable/handsontable/issues/8601)
- Extended Handsontable's GitHub Actions workflow, to allow for deploying code examples to GitHub
  Pages. [#9058](https://github.com/handsontable/handsontable/issues/9058)

### Fixed

- Fixed an issue where the `autocomplete` editor's suggestion list didn't update properly.
  [#7570](https://github.com/handsontable/handsontable/issues/7570)
- Fixed an issue where nested headers didn't render when `data` wasn't defined.
  [#8589](https://github.com/handsontable/handsontable/issues/8589)
- Fixed some end-to-end tests that failed on mobile devices.
  [#8749](https://github.com/handsontable/handsontable/issues/8749)
- Fixed an issue where the rendered selection could get shifted by 1px.
  [#8756](https://github.com/handsontable/handsontable/issues/8756)
- Fixed an issue where the first column's border didn't display properly.
  [#8767](https://github.com/handsontable/handsontable/issues/8767)
- Fixed an issue where the `CollapsibleColumns` plugin's `expandAll()` method didn't expand
  collapsed columns. [#8900](https://github.com/handsontable/handsontable/issues/8900)
- Fixed end-to-end test scripts that occasionally crashed.
  [#8961](https://github.com/handsontable/handsontable/issues/8961)
- Fixed a typo in the `valueAccordingPercent()` helper.
  [#9006](https://github.com/handsontable/handsontable/issues/9006)
- Fixed an issue where the `NestedRows` plugin could throw a type error after calling the
  `updateSettings()` method. [#9018](https://github.com/handsontable/handsontable/issues/9018)
- Fixed an issue where performance was affected by removing events.
  [#9044](https://github.com/handsontable/handsontable/issues/9044)
- Fixed a wrong TypeScript definition of the `MultiColumnSorting` plugin's `sort()` method.
  [#9067](https://github.com/handsontable/handsontable/issues/9067)
- Fixed an issue where the `Comments` plugin's editor disappeared after adding a comment.
  [#9075](https://github.com/handsontable/handsontable/issues/9075)
  [#6661](https://github.com/handsontable/handsontable/issues/6661)
- React: Fixed a wrong return type.
  [#9000](https://github.com/handsontable/handsontable/issues/9000)

For more information on Handsontable 11.1.0, see:

- [Blog post (11.1.0)](https://handsontable.com/blog/handsontable-11.1.0-vue-3-support-and-updatedata)
- [Documentation (11.1)](https://handsontable.com/docs/11.1)
- [Release notes (11.1.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_11-1)

## [11.0.1] - 2021-11-17

### Fixed

- Fixed the UMD build of `@handsontable/angular`, which was not working properly in `11.0.0`.
  [#8946](https://github.com/handsontable/handsontable/pull/8946)

For more information on Handsontable 11.0.0, see:

- [Documentation (11.0)](https://handsontable.com/docs/11.0)
- [Release notes (11.0.1)](https://handsontable.com/docs/release-notes/#_11-0-1)

## [11.0.0] - 2021-11-17

### Added

- **Breaking change**: Added TypeScript definition files for Handsontable's modularized version.
  [#7489](https://github.com/handsontable/handsontable/issues/7489)
- **Breaking change (Vue)**: Added support for modularization to the Vue wrapper.
  [#8820](https://github.com/handsontable/handsontable/issues/8820)
- **Breaking change (React)**: Added support for modularization to the React wrapper.
  [#8819](https://github.com/handsontable/handsontable/issues/8819)
- **Breaking change (Angular)**: Added support for modularization to the Angular wrapper.
  [#8818](https://github.com/handsontable/handsontable/issues/8818)
- Added a new package entry point that allows importing built-in modules in one function call:
  `import { registerAllEditors, registerAllRenderers, registerAllValidators, registerAllCellTypes, registerAllPlugins } from 'handsontable/registry'`.
  [#8816](https://github.com/handsontable/handsontable/issues/8816)
- Added a new `locale` option, to properly handle locale-based data.
  [#8897](https://github.com/handsontable/handsontable/issues/8897)
- Added a GitHub Actions workflow that covers testing Handsontable and the wrappers.
  [#8652](https://github.com/handsontable/handsontable/issues/8652)
- Added new direction helpers (internal API) that lay ground for future RTL support.
  [#8868](https://github.com/handsontable/handsontable/issues/8868)

### Changed

- **Breaking change**: Changed how the `populateFromArray()` method works with its `method` argument
  set to `shift_down` or `shift_right`.
  [#888](https://github.com/handsontable/handsontable/issues/888)
- Moved the entire Handsontable package to its own, new subdirectory: `./handsontable`.
  [#8759](https://github.com/handsontable/handsontable/issues/8759)
- Replaced the license files with updated versions.
  [#8877](https://github.com/handsontable/handsontable/issues/8877)

### Fixed

- Fixed an issue with incorrect filtering of locale-based data while using search input from a
  drop-down menu. [#6095](https://github.com/handsontable/handsontable/issues/6095)
- Fixed an error thrown when using the `populateFromArray()` method with its `method` argument set
  to `shift_right`. [#6929](https://github.com/handsontable/handsontable/issues/6929)
- Fixed an issue with the `beforeOnCellMouseDown` and `afterOnCellMouseDown` hooks using wrong
  coordinates. [#8498](https://github.com/handsontable/handsontable/issues/8498)
- Fixed a `TypeError` thrown when calling the `updateSettings()` method in Handsontable's
  modularized version. [#8830](https://github.com/handsontable/handsontable/issues/8830)
- Fixed two issues with the documentation's `canonicalUrl` entries.
  [#8886](https://github.com/handsontable/handsontable/issues/8886)
- Fixed an error thrown when autofill's source is a `date` cell.
  [#8894](https://github.com/handsontable/handsontable/issues/8894)
- React: Fixed a React wrapper issue where it's impossible to use different sets of props in editor
  components reused across multiple columns.
  [#8527](https://github.com/handsontable/handsontable/issues/8527)

For more information on Handsontable 11.0.0, see:

- [Blog post (11.0.0)](https://handsontable.com/blog/handsontable-11.0.0-modularization-for-react-angular-and-vue)
- [Documentation (11.0)](https://handsontable.com/docs/11.0)
- [Migration guide (10.0 → 11.0)](https://handsontable.com/docs/migration-from-10.0-to-11.0)
- [Release notes (11.0.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_11-0)

## [10.0.0] - 2021-09-29

### Changed

- **Breaking change**: Unified the naming and description of the fourth argument, `controller`, for
  selection manipulation in the `beforeOnCellMouseDown` and `beforeOnCellMouseOver` hooks.
  [#4996](https://github.com/handsontable/handsontable/issues/4996)
- **Breaking change**: Changed what the `beforeRender` and `afterRender` hooks are, and when they
  are triggered. Added two new hooks: `beforeViewRender` and `afterViewRender`.
  [#6303](https://github.com/handsontable/handsontable/issues/6303)
- **Breaking change**: Changed the optional HyperFormula dependency from 0.6.2 to ^1.1.0, which
  introduces breaking changes for the `Formulas` plugin users.
  [#8502](https://github.com/handsontable/handsontable/issues/8502)
- **Breaking change**: Changed the default values for the `rowsLimit` and `columnsLimit` options of
  the `CopyPaste` plugin. [#8660](https://github.com/handsontable/handsontable/issues/8660)
- **Breaking change**: Added a default font family, size, weight and color.
  [#8661](https://github.com/handsontable/handsontable/issues/8661)
- **Breaking change**: Changed the `autoWrapRow` and `autoWrapCol` options\` default values from
  `true` to `false`. [#8662](https://github.com/handsontable/handsontable/issues/8662)
- Improved the performance of the `getCellMeta()` method.
  [#6303](https://github.com/handsontable/handsontable/issues/6303)
- Improved the documentation and TypeScript definition of the `selectOptions` option.
  [#8488](https://github.com/handsontable/handsontable/issues/8488)
- Improved the arguments forwarding in the hooks
  [#8668](https://github.com/handsontable/handsontable/issues/8668)
- Added a Github Actions workflow covering the testing of Handsontable and all of the wrappers.
  [#8652](https://github.com/handsontable/handsontable/issues/8652)

### Fixed

- Fixed an issue of not resetting the date picker's configuration.
  [#6636](https://github.com/handsontable/handsontable/issues/6636)
- An error won't be thrown while inserting a new row for nested rows in a specific case.
  [#7137](https://github.com/handsontable/handsontable/issues/7137)
- Fixed a few problems with the `NestedRows` plugin, occurring with the `Formulas` plugin enabled.
  [#8048](https://github.com/handsontable/handsontable/issues/8048)
- Fixed errors being thrown in the `Formulas` plugin if a provided sheet name contained a dash
  character. [#8057](https://github.com/handsontable/handsontable/issues/8057)
- Fixed multiple bugs related to undo/redo actions while using the `Formulas` plugin.
  [#8078](https://github.com/handsontable/handsontable/issues/8078)
- Fixed an issue where autofill was not able to be blocked/changed with the `beforeChange` hook when
  the `Formulas` plugin was enabled
  [#8107](https://github.com/handsontable/handsontable/issues/8107)
- Data stored by the `NestedRows` plugin won't be corrupted by some actions.
  [#8180](https://github.com/handsontable/handsontable/issues/8180)
- Collapsed parents won't be expanded after inserting rows.
  [#8181](https://github.com/handsontable/handsontable/issues/8181)
- Fixed the cooperation of the dropdown menu and column sorting (menu closing on click).
  [#8232](https://github.com/handsontable/handsontable/issues/8232)
- Data won't be corrupted anymore when some alterations are performed.
  [#8614](https://github.com/handsontable/handsontable/issues/8614)
- Adjusted directories and files related to `dataMap`, to prevent potential circular references.
  [#8704](https://github.com/handsontable/handsontable/issues/8704)
- Improved the performance of the regular expression used to detect numeric values, and fixed major
  code smells. [#8752](https://github.com/handsontable/handsontable/issues/8752)

For more information on Handsontable 10.0.0, see:

- [Blog post (10.0.0)](https://handsontable.com/blog/handsontable-10.0.0-improved-performance-and-consistency)
- [Documentation (10.0)](https://handsontable.com/docs/10.0)
- [Migration guide (9.0 → 10.0)](https://handsontable.com/docs/migration-from-9.0-to-10.0)
- [Release notes (10.0.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_10-0)

## [9.0.2] - 2021-07-28

### Fixed

- Fixed an issue with an error being thrown when lazy loading columns on a setup with Nested
  Headers + Hidden Columns. [#7160](https://github.com/handsontable/handsontable/issues/7160)
- Fixed column header sizes not being updated on `updateSettings` calls containing `columns`.
  [#7689](https://github.com/handsontable/handsontable/issues/7689)
- Fixed functional keys' behavior, to prevent unexpected editing.
  [#7838](https://github.com/handsontable/handsontable/issues/7838)
- Fixed missing collapsible indicator on IE.
  [#8028](https://github.com/handsontable/handsontable/issues/8028)
- Fixed support for row and column headers in the `parseTable` utility.
  [#8041](https://github.com/handsontable/handsontable/issues/8041)
- Fixed a bug where not providing a data object with the `nestedRows` plugin enabled crashed the
  table. [#8171](https://github.com/handsontable/handsontable/issues/8171)
- Vue: Fixed an issue where adding rows to a Handsontable instance wrapped for Vue resulted in
  additional rows being inserted at the end of the table.
  [#8148](https://github.com/handsontable/handsontable/issues/8148)
- Vue: Fixed a problem in the Vue wrapper, where destroying the underlying Handsontable instance
  caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)
- React: Fixed a problem in the React wrapper, where destroying the underlying Handsontable instance
  caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)
- Angular: Fixed a problem in the Angular wrapper, where destroying the underlying Handsontable
  instance caused it to throw errors and crash.
  [#8311](https://github.com/handsontable/handsontable/issues/8311)

### Added

- Added new documentation engine [#7624](https://github.com/handsontable/handsontable/issues/7624)

For more information on Handsontable 9.0.2, see:

- [Blog post (9.0.2)](https://handsontable.com/blog/whats-new-in-handsontable-9.0.2)
- [Documentation (9.0)](https://handsontable.com/docs/9.0)
- [Release notes (9.0.2)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_9-0-2)

## [9.0.1] - 2021-06-17

### Removed

- Removed the redundant internal `jsonpatch` library from the source code.
  [#8140](https://github.com/handsontable/handsontable/issues/8140)

### Fixed

- Fixed an issue where the validator function was called twice when the Formulas plugin was enabled.
  [#8138](https://github.com/handsontable/handsontable/issues/8138)
- Introduced a new CSS style for cells of the `checkbox` type to restore previous behavior.
  [#8196](https://github.com/handsontable/handsontable/issues/8196)

For more information on Handsontable 9.0.1, see:

- [Documentation (9.0)](https://handsontable.com/docs/9.0)
- [Release notes (9.0.1)](https://handsontable.com/docs/release-notes/#_9-0-1)

## [9.0.0] - 2021-06-01

### Changed

- **Breaking change**: New Formulas plugin, with an entirely different API. See the migration guide
  for a full list of changes. Removed the required `hot-formula-parser` dependency for the sake of
  an optional one, `hyperformula`. [#6466](https://github.com/handsontable/handsontable/issues/6466)
- **Breaking change**: Changed the `afterAutofill` and `beforeAutofill` hooks' signatures.
  [#7987](https://github.com/handsontable/handsontable/issues/7987)
- Upgraded `eslint` and eslint-related modules.
  [#7531](https://github.com/handsontable/handsontable/issues/7531)
- Added `fit` & `fdescribe` to restricted globals in test files.
  [#8088](https://github.com/handsontable/handsontable/issues/8088)

### Removed

- **Breaking change**: Removed the deprecated plugins - Header Tooltips and Observe Changes.
  [#8083](https://github.com/handsontable/handsontable/issues/8083)

### Fixed

- Fixed a problem with the column indicator of the Collapsible Columns plugin not being displayed
  properly on styled headers. [#7970](https://github.com/handsontable/handsontable/issues/7970)
- Fixed a problem with duplicated `afterCreateCol` hooks being triggered after undoing a removal of
  a column. [#8076](https://github.com/handsontable/handsontable/issues/8076)

### Deprecated

- Deprecated the `beforeAutofillInsidePopulate` hook. It will be removed in the next major release.
  [#8095](https://github.com/handsontable/handsontable/issues/8095)

For more information on Handsontable 9.0.0, see:

- [Blog post (9.0.0)](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin)
- [Documentation (9.0)](https://handsontable.com/docs/9.0)
- [Migration guide (8.4 → 9.0)](https://handsontable.com/docs/migration-from-8.4-to-9.0)
- [Release notes (9.0.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_9-0)

## [8.4.0] - 2021-05-11

### Added

- Introduced a `separated` attribute for the label options (the `label` DOM element may wrap `input`
  or be placed next to it). [#3172](https://github.com/handsontable/handsontable/issues/3172)
- Introduced the `modifyAutoColumnSizeSeed` hook to let developers overwrite the default behavior
  of the AutoColumnSize sampling. [#3339](https://github.com/handsontable/handsontable/issues/3339)
- Added support for hiding columns for the _NestedHeaders_ plugin.
  [#6879](https://github.com/handsontable/handsontable/issues/6879)
- Added ability to skip stacking actions by the `UndoRedo` plugin and introduced new hooks.
  [#6948](https://github.com/handsontable/handsontable/issues/6948)
- Added 2 new hooks, `beforeHighlightingColumnHeader` and `beforeHighlightingRowHeader`. Use them to
  retrieve a header element (`<th>`) before it gets highlighted.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method, `indexMapper.unregisterAll()`. Use it to unregister all collected index maps
  from all map collections types. ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method, `indexMapper.createChangesObserver()`. Use it to listen to any changes made to
  indexes while Handsontable is running.
  ([#7528](https://github.com/handsontable/handsontable/pull/7528))
- Added a new method, `indexMapper.createAndRegisterIndexMap()`. Use it to create and register a new
  index map. ([#7528](https://github.com/handsontable/handsontable/pull/7528))

### Fixed

- Fixed a problem with sorting the `checkbox`-typed cells and an issue with empty cells not being
  displayed properly. [#4047](https://github.com/handsontable/handsontable/issues/4047)
- Fixed a problem where undoing the removal of row with `readOnly` cells was not performed properly.
  [#4754](https://github.com/handsontable/handsontable/issues/4754)
- Fixed state-change resolving for externally added checkboxes.
  [#5934](https://github.com/handsontable/handsontable/issues/5934)
- Fixed a problem with the native selection being removed with the `fragmentSelection` option
  enabled. [#6083](https://github.com/handsontable/handsontable/issues/6083)
- Fixed a bug where number of columns rendered in the viewport was not correct.
  [#6115](https://github.com/handsontable/handsontable/issues/6115)
- Fixed a bug with the Dropdown Menu not opening on Android devices.
  [#6212](https://github.com/handsontable/handsontable/issues/6212)
- Fixed the double-tap issue on iOS.
  [#6961](https://github.com/handsontable/handsontable/issues/6961)
- Fixed a problem with the Comments editor being destroyed after destroying another Handsontable
  instance. [#7091](https://github.com/handsontable/handsontable/issues/7091)
- Fixed incorrect `numericFormat`'s type definition.
  [#7420](https://github.com/handsontable/handsontable/issues/7420)
- Fixed the `trimWhitespace` tests on Firefox.
  [#7593](https://github.com/handsontable/handsontable/issues/7593)
- Fixed the [NPM Audit] Github Action job to report found vulnerabilities.
  [#7621](https://github.com/handsontable/handsontable/issues/7621)
- Fixed some minor iOS problems. [#7659](https://github.com/handsontable/handsontable/issues/7659)
- Fixed the TypeScript definition for the suspended rendering feature.
  [#7666](https://github.com/handsontable/handsontable/issues/7666)
- Fixed the `postbuild` and `examples:install` scripts on Windows.
  [#7680](https://github.com/handsontable/handsontable/issues/7680)
- Fixed the contents of the production `package.json`.
  [#7723](https://github.com/handsontable/handsontable/issues/7723)
- Fixed an issue, where the callbacks for the UndoRedo plugin were called twice.
  [#7825](https://github.com/handsontable/handsontable/issues/7825)
- Vue: Fixed a problem with displaying and removing rows in the Nested Rows plugin.
  [#7548](https://github.com/handsontable/handsontable/issues/7548)
- React: Fixed an incompatibility in the property type definitions for the HotColumn component.
  [#7612](https://github.com/handsontable/handsontable/issues/7612)

### Changed

- Enhanced the ESLint config file by adding a rule that checks if there are new lines missing before
  some keywords or statements. [#7691](https://github.com/handsontable/handsontable/issues/7691)

For more information on Handsontable 8.4.0, see:

- [Blog post (8.4.0)](https://handsontable.com/blog/whats-new-in-handsontable-8-4-0)
- [Documentation (8.4.0)](https://handsontable.com/docs/8.4.0)
- [Release notes (8.4.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-4)

## [8.3.2] - 2021-03-16

### Fixed

- Fixed a bug where it was impossible to enable `disableVisualSelection` for cells/columns.
  [#5082](https://github.com/handsontable/handsontable/issues/5082)
- Fixed wrong paddings for multi-level headers.
  [#5086](https://github.com/handsontable/handsontable/issues/5086)
- Fixed problems with the `current` option of the `disableVisualSelection` setting.
  [#5869](https://github.com/handsontable/handsontable/issues/5869)
- Fixed problems with the `header` option of the `disableVisualSelection` setting.
  [#6025](https://github.com/handsontable/handsontable/issues/6025)
- Fixed a bug where the "double-tap-to-zoom" gesture prevented the editor from opening properly on
  some mobile devices. [#7142](https://github.com/handsontable/handsontable/issues/7142)
- Fixed a bug where calling the `updateSettings` method in the body of some callbacks would break
  the table. [#7231](https://github.com/handsontable/handsontable/issues/7231)
- Fixed an issue where the `maxRows` and `maxCols` options interfered with hidden index
  calculations. [#7350](https://github.com/handsontable/handsontable/issues/7350)
- Fixed problems with doubled borders being displayed when `window` was a scrollable container.
  [#7356](https://github.com/handsontable/handsontable/issues/7356)
- Fixed a bug where value population from an edited cell would result in a console error.
  [#7382](https://github.com/handsontable/handsontable/issues/7382)
- Fixed a bug where the dropdown cell type would not work on Safari 14+.
  [#7413](https://github.com/handsontable/handsontable/issues/7413)
- Fixed a bug where the `AutoRowSize` plugin would break the table when placed in an iframe.
  [#7424](https://github.com/handsontable/handsontable/issues/7424)
- Fixed bugs in navigation by `HOME` and `END` keys with hidden rows/columns enabled.
  [#7454](https://github.com/handsontable/handsontable/issues/7454)
- Fixed a bug with the `trimWhitespace` option not working properly.
  [#7458](https://github.com/handsontable/handsontable/issues/7458)
- Fixed an issue with inconsistent documentation and TypeScript definitions for `colWidths` and
  `rowHeights` options. [#7507](https://github.com/handsontable/handsontable/issues/7507)
- Fixed the incorrect `cellTypes` module paths in the `exports` entry of the `package.json` file.
  [#7597](https://github.com/handsontable/handsontable/issues/7597)
- Vue: Fixed Remote Code Execution vulnerability in the dev dependencies.
  [#7620](https://github.com/handsontable/handsontable/issues/7620)

### Added

- Introduced the monorepo to this repository. From now on, `handsontable`, `@handsontable/angular`,
  `@handsontable/react`, and `@handsontable/vue` will all be developed in the same repo -
  `handsontable`. [#7380](https://github.com/handsontable/handsontable/issues/7380)
- Added a custom ESLint rule which allows restricting specified modules from loading by `import` or
  re-exporting. [#7473](https://github.com/handsontable/handsontable/issues/7473)

For more information on Handsontable 8.3.2, see:

- [Blog post (8.3.2)](https://handsontable.com/blog/handsontable-8-3-2-introducing-monorepo)
- [Documentation (8.3.2)](https://handsontable.com/docs/8.3.2)
- [Release notes (8.3.2)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-3-2)

## [8.3.1] - 2021-02-10

### Fixed

- Fixed an issue where the CSS files could be eliminated during tree-shaking
  [#7516](https://github.com/handsontable/handsontable/issues/7516)

For more information on Handsontable 8.3.1, see:

- [Documentation (8.3.1)](https://handsontable.com/docs/8.3.1)
- [Release notes (8.3.1)](https://handsontable.com/docs/release-notes/#_8-3-1)

## [8.3.0] - 2021-01-28

### Added

- Introduced a new feature that allows postponing the table render and internal data cache update.
  The table rendering time can be reduced several-fold times by batching (using the `batch` method),
  multi-line API calls, or manually suspending rendering using the `suspendRender` and
  `resumeRender` methods. [#7274](https://github.com/handsontable/handsontable/issues/7274)
- Introduced a possibility to import:

  - plugins
  - cell types
  - editors
  - renderers
  - validators

  as separate modules, along with the Handsontable _base_. This change allows utilizing only the
  parts of Handsontable the end application is actually using, without the overhead of the full
  bundle. [#7403](https://github.com/handsontable/handsontable/issues/7403)

- Added a new workflow for managing and generating changelogs.
  [#7405](https://github.com/handsontable/handsontable/issues/7405)

### Fixed

- Fixed a bug with auto-execution of the first item in the ContextMenu plugin.
  [#7364](https://github.com/handsontable/handsontable/issues/7364)
- Fixed a bug where column sorting with multi column sorting crashed the table.
  [#7415](https://github.com/handsontable/handsontable/issues/7415)
- Added a missing entry for the `skipRowOnPaste` option in the TypeScript definition file.
  [#7394](https://github.com/handsontable/handsontable/issues/7394)
- Added missing tests to prevent issue #7377 from resurfacing.
  [#7396](https://github.com/handsontable/handsontable/issues/7396)
- Fixed an issue where altering columns did not update filters attached to columns.
  [#6830](https://github.com/handsontable/handsontable/issues/6830)
- Fixed typos and wrong return types in the TypeScript definition file.
  [#7399](https://github.com/handsontable/handsontable/issues/7399),
  [#7400](https://github.com/handsontable/handsontable/issues/7400)
- Updated the dependencies causing potential security issues, as well as Babel configuration needed
  after the update. [#7463](https://github.com/handsontable/handsontable/issues/7463)

### Changed

- Corrected a typo in a helper method from the Column Sorting plugin.
  [#7375](https://github.com/handsontable/handsontable/issues/7375)
- Optimized the performance of rendering the table with numerous spare rows (for `minSpareRows`,
  `minSpareCols`, `minRows`, and `minCols` options).
  [#7439](https://github.com/handsontable/handsontable/issues/7439)

For more information on Handsontable 8.3.0, see:

- [Blog post (8.3.0)](https://handsontable.com/blog/handsontable-8.3.0-has-been-released)
- [Documentation (8.3.0)](https://handsontable.com/docs/8.3.0)
- [Release notes (8.3.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-3)

## [8.2.0] - 2020-11-12

### Added

- Added new type of Index Map named `LinkedPhysicalIndexToValueMap`
  [#7276](https://github.com/handsontable/handsontable/pull/7276)
- Added an external dependency, `DOMPurify`, to add HTML sanitization what should minimize the risk
  of inserting insecure code using Handsontable built-in functionalities.
  [#7292](https://github.com/handsontable/handsontable/issues/7292)

### Fixed

- Fixed an issue the container not being updated after trimming rows.
  [#7241](https://github.com/handsontable/handsontable/issues/7241)
- Fixed an issue with a `htmlToGridSettings` helper if passed `<table>` had no rows.
  [#7311](https://github.com/handsontable/handsontable/issues/7311)
- Fixed an issue where sorting indicator moved incorrectly when column was added.
  [#6397](https://github.com/handsontable/handsontable/issues/6397)
- Fixed a bug, where untrimming previously trimmed rows would sometimes result in the table instance
  not refreshing its height, leaving the row headers not properly rendered.
  [#6276](https://github.com/handsontable/handsontable/issues/6276)
- Fixes a bug, where tables' viewport was scrolled if a user opened editor when some columns on the
  left side of that cell were hidden.
  [#7322](https://github.com/handsontable/handsontable/issues/7322)
- Fix a problem when `event.target`'s parent in the `mouseover` event was not defined, the table
  threw an error when hovering over row/column headers.
  [#6926](https://github.com/handsontable/handsontable/issues/6926)
- Fixed an issue, where calling the validation-triggering methods on a `hiddenColumns`-enabled
  Handsontable instance rendered the validated cells improperly.
  [#7301](https://github.com/handsontable/handsontable/issues/7301)
- Fixed an issue, where adding 0 rows to the table ended with doubled entries in indexMappers'
  collections. [#7326](https://github.com/handsontable/handsontable/issues/7326)
- Fix a problem with the inconsistent behavior of the Context Menu's "Clear column" disabled status.
  [#7003](https://github.com/handsontable/handsontable/issues/7003)
- Fix a bug with parsing multiline cells on pasting `text/html` mime-type.
  [#7369](https://github.com/handsontable/handsontable/issues/7369)

For more information on Handsontable 8.2.0, see:

- [Blog post (8.2.0)](https://handsontable.com/blog/handsontable-8.2.0-has-been-released)
- [Documentation (8.2.0)](https://handsontable.com/docs/8.2.0)
- [Release notes (8.2.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-2)

## [8.1.0] - 2020-10-01

### Added

- Added support for resizing non-contiguous selected rows
  [#7162](https://github.com/handsontable/handsontable/pull/7162) along with refactor and bug fix
  introduced within #6871 PR [#7220](https://github.com/handsontable/handsontable/pull/7220)
- Added e2e tests and reorganized already existing ones
  [#6491](https://github.com/handsontable/handsontable/issues/6491)

### Fixed

- Fixed an issue where if the first part of the merged area was hidden the value did not show
  [#6871](https://github.com/handsontable/handsontable/issues/6871)
- Fixed an issue where after selecting the top-left element the row range resizing was not possible
  [#7162](https://github.com/handsontable/handsontable/pull/7162) along with refactor and bug fix
  introduced within #6871 PR [#7220](https://github.com/handsontable/handsontable/pull/7220)
- Fixed an issue where the column headers were cut off after hiding and then showing columns using
  the Hidden Columns plugin. [#6395](https://github.com/handsontable/handsontable/issues/6395)
- Fixed an issue where redundant row has been added during copy/paste operations in some case
  [#5961](https://github.com/handsontable/handsontable/issues/5961)
- Fixed an issue where too many values have been pasted when column was hidden
  [#6743](https://github.com/handsontable/handsontable/issues/6743)
- Fixed a bug, where trying to move collapsed parent rows with the Nested Rows plugin enabled threw
  an error. [#7132](https://github.com/handsontable/handsontable/issues/7132)
- Fixed an issue where after column or row alteration, Handsontable threw an error if ColumnSummary
  was enabled without defined rows ranges
  [#7174](https://github.com/handsontable/handsontable/pull/7174)
- Fixed an issue where using updateSettings() has been breaking column sorting in specific cases
  [#7228](https://github.com/handsontable/handsontable/issues/7228)
- Fixed an issue where the rows were missing their left border after disabling the row headers using
  `updateSettings`, while there were `fixedColumnsLeft` defined.
  [#5735](https://github.com/handsontable/handsontable/issues/5735)
- Fixed an issue where the Handsontable could fall into an infinite loop during vertical scrolling.
  It only happened when the scrollable element was the `window` object.
  [#7260](https://github.com/handsontable/handsontable/issues/7260);
- Fixed an issue with moving rows to the last row of the table, when the Nested Rows plugin was
  enabled along with some other minor moving-related bugs.
  [#6067](https://github.com/handsontable/handsontable/issues/6067)
- Fixed an issue with adding unnecessary extra empty line in cells on Safari.
  [#7262](https://github.com/handsontable/handsontable/issues/7262)
- Fixed an issue with clipped column headers if they were changed before or within usage
  `updateSettings`. [#6004](https://github.com/handsontable/handsontable/issues/6004)

### Changed

- Updated dependencies to meet security requirements
  [#7222](https://github.com/handsontable/handsontable/pull/7222)
- Improved performance for TrimRows, HiddenRows and HiddenColumns plugins for big datasets with lots
  trimmed/hidden indexes [#7223](https://github.com/handsontable/handsontable/pull/7223)

For more information on Handsontable 8.1.0, see:

- [Blog post (8.1.0)](https://handsontable.com/blog/handsontable-8.1.0-has-been-released)
- [Documentation (8.1.0)](https://handsontable.com/docs/8.1.0)
- [Release notes (8.1.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-1)

## [8.0.0] - 2020-08-05

### Added

- Added `modifySourceData` hook and `setSourceDataAtCell` method.
  [#6664](https://github.com/handsontable/handsontable/issues/6664)
- Added new argument to `scrollViewportTo` method: optional `considerHiddenIndexes` which is a
  `boolean`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Added additional information available in the cell meta object - the language.
  [#6254](https://github.com/handsontable/handsontable/pull/6254).
- Added a possibility to allow cancelling of `autofill` in the `beforeAutofill` hook.
  [#4441](https://github.com/handsontable/handsontable/issues/4441)
- Added support for newer versions of moment, numbro and pikaday.
  [#5159](https://github.com/handsontable/handsontable/issues/5159)
- Added `afterAutoFill` hook. [#6135](https://github.com/handsontable/handsontable/issues/6135)
- Added "deprecated" warning messages mechanism for plugin hooks.
  [#6613](https://github.com/handsontable/handsontable/pull/6613)
- Added missing types for `instance.undoRedo`.
  [#6346](https://github.com/handsontable/handsontable/issues/6346)
- Added `countRenderableColumns` method to the `TableView`.
  [#6177](https://github.com/handsontable/handsontable/issues/6177)
- Added missing "hide" property in `CustomBorders` typings.
  [#6788](https://github.com/handsontable/handsontable/issues/6788)
- Added `beforeSetCellMeta` hook with an ability to cancel the changes.
  [#5388](https://github.com/handsontable/handsontable/issues/5388)
- Added additional test for autofill plugin.
  [#6756](https://github.com/handsontable/handsontable/issues/6756)

### Changed

- Changed how `manualRowMove` and `manualColumnMove` plugins work
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Click on a row header will select all cells (also hidden).
  [#2391](https://github.com/handsontable/handsontable/issues/2391)
- Extracted Cell-Meta logic from Core to separate module.
  [#6254](https://github.com/handsontable/handsontable/pull/6254)
- The `CellMeta` manager was refactored for future features and improvements.
  [#6233](https://github.com/handsontable/handsontable/issues/6233)
- Rows can be resized to less than `rowHeights`.
  [#6149](https://github.com/handsontable/handsontable/issues/6149)
- Left mouse button (LMB) click on the corner will now select all cells.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The right mouse button (`RMB`) click on the corner, column and row headers will show just some
  options, defined by newly created specification
  [#7082](https://github.com/handsontable/handsontable/pull/7082)
- Hidden indexes will no longer be rendered, as a consequence `afterRenderer`, `modifyColWidth`,
  `beforeStretchingColumnWidth` will be executable only on visible (meaning, rendered) rows and
  columns. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `getColWidth` for hidden index will return 0 - it used to return 0.1
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- The `modifyColWidth` hook isn't called internally. However, it will be executed when the user will
  call the `getColWidth`. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Hidden rows/columns won't rendered anymore. As a consequence hooks `beforeValueRender`,
  `beforeRenderer`, `afterRenderer`, `modifyColWidth`, `beforeStretchingColumnWidth` etc. will be
  executed just for some of the columns (just the renderable ones).
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Selection behavior changed when hiding cells from the `ContextMenu`, now it is selecting a column
  on the right when there is space on right to the last selected column, selecting a column on the
  left otherwise. [#6547](https://github.com/handsontable/handsontable#6547)
- Developed a unified way to identify HOT "input" elements. All input elements owned by HOT got an
  attribute "data-hot-input" which are identified by that key.
  [#6383](https://github.com/handsontable/handsontable/issues/6383)
- `NestedHeaders` plugin was rewritten, from now on, only a tree-like structure will be allowed,
  meaning, there will be no possibility to place nested headers in-between layers.
  [#6716](https://github.com/handsontable/handsontable/pull/6716)
- `CustomBorders` plugin was adapted to work with `HiddenColumns` properly, from now on hiding cells
  at the start or at the end of a range will also hide their borders. Also, hiding a single cell
  with borders will hide all of its borders.
  [#7083](https://github.com/handsontable/handsontable/pull/7083)
- `CollapsibleColumns` will no longer use `HiddenColumns` plugin to work.
  [#6204](https://github.com/handsontable/handsontable/issue/6204)
- Modifying the table's data by reference and calling `render()` will not work properly anymore.
  From this point onward, all the data-related operations need to be performed using the API
  methods, such as `populateFromArray` or `setDataAtCell`.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Removed dependencies between plugins: the `manualColumnFreeze` plugin doesn't use the
  `manualColumnMove`, the `collapsibleColumns` plugin doesn't use the `hiddenColumns` plugin,
  `nestedRows` plugin doesn't use the `trimRows` plugin, `filters` plugin doesn't use the `trimRows`
  plugin anymore. [#5945](https://github.com/handsontable/handsontable/pull/5945) along with other
  adjustments [#6547](https://github.com/handsontable/handsontable/pull/6547):
- The `minSpareRows` and `minRows` options will ensure that the number of visible rows corresponds
  to the value provided to them (for example, the `trimRows` plugin won't have an impact on the
  number of displayed rows). [#5945](https://github.com/handsontable/handsontable/pull/5945)
- `toPhysicalRow` and `toVisualColumn` now return `null` for non-existant rows/columns.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `afterLoadData` hook receives a different set of arguments. It used to be just the initialLoad
  flag, now the first argument is `sourceData`, followed by `initialLoad`.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `manualColumnFreeze` plugin unfreezes the column just after the "line of freeze".
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `RecordTranslator` object and the `t` property available in the plugins were removed.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- After-prefixed hooks (`afterLoadData`, `afterFilter`, etc.) are now called just before the
  `render` call. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- Newly created rows and columns are now placed in the source data in the place calculated from its
  position in the visual context (they "stick" to their adjacent rows/columns). It also applies to
  moved rows and columns. [#5945](https://github.com/handsontable/handsontable/pull/5945)
- When the `nestedRows` plugin is `enabled`, moving rows will be possible only using the UI or by
  calling the `dragRows` method of the `manualRowMove` plugin.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- The `beforeRowResize`, `afterRowResize`, `beforeColumnResize`, `afterColumnResize` hooks have the
  order of their arguments rearranged for the sake of consistency with other hooks.
  [#3328](https://github.com/handsontable/handsontable/issues/3328)
- Changed the argument structure in `collapsibleColumns`' `toggleCollapsibleSection` method.
  [#6193](https://github.com/handsontable/handsontable/issues/6193)
- Updated the `moment`, `numbro` and `pikaday` dependencies to their latest versions.
  [#6610](https://github.com/handsontable/handsontable/issues/6610)
- Standardize the `z-index` properties between the overlays.
  [#6269](https://github.com/handsontable/handsontable/pull/6269)

### Deprecated

- The `ObserveChanges` plugin is no longer enabled by `columnSorting` and became deprecated.
  [#5945](https://github.com/handsontable/handsontable/pull/5945)
- `HeaderTooltips` plugin becomes deprecated and will be removed in the next major version.
  [#7023](https://github.com/handsontable/handsontable/issues/7023)
- IE support is depreacated and will removed by the end of the year.
  [#7026](https://github.com/handsontable/handsontable/issues/7026)

### Removed

- Removed `firstVisibleColumn` CSS class as no longer needed.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed helpers that covered IE8 support or are not needed anymore.
  [#6525](https://github.com/handsontable/handsontable/issues/6525)
- Removed old unnecessary warning about `beforeChange` callback.
  [#6792](https://github.com/handsontable/handsontable/issues/6792)
- Removed `debug` key (key, css, docs).
  [#6672](https://github.com/handsontable/handsontable/issues/6672)
- Removed `hiddenRow` and `hiddenColumn` hooks.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed optional argument `modifyDocumentFocus` from the `listen` function.
  [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed `rowOffset` and `colOffset` public API methods since they aliased the methods from
  Walkontable. [#6547](https://github.com/handsontable/handsontable/pull/6547)
- Removed the experimental `GanttChart` plugin.
  [#7022](https://github.com/handsontable/handsontable/issues/7022)
- Removed post-install warning from package.json file
  [#6608](https://github.com/handsontable/handsontable/pull/6608)
- The `modifyRow`, `modifyCol`, `unmodifyRow`, `unmodifyCol` and `skipLengthCache` hooks are no
  longer needed and were removed. [#5945](https://github.com/handsontable/handsontable/pull/5945)

### Fixed

- Fixed a problem with data not being added to the table properly with the `columnSorting` option
  enabled. [#2685](https://github.com/handsontable/handsontable/issues/2685)
- Fixed a problem with `loadData` not resetting the row order changed by the `manualRowMove` plugin.
  [#3568](https://github.com/handsontable/handsontable/issues/3568)
- Fixed a bug, where using `alter`'s `insert_row` after using the `loadData` method and sorting the
  data would add unintentional additional rows to the table.
  [#3809](https://github.com/handsontable/handsontable/issues/3809)
- Fixed a bug, where blank rows appeared in the middle of the table after using `loadData` along
  with the `minSpareRows` option. [#3937](https://github.com/handsontable/handsontable/issues/3937)
- Fixed a problem with the `columnSummary` plugin not working properly after adding new rows using
  the Context Menu and sorting the data.
  [#3924](https://github.com/handsontable/handsontable/issues/3924)
- Fixed a bug, where calling `loadData` with an object-based data source would not work properly.
  [#4204](https://github.com/handsontable/handsontable/issues/4204)
- Fixed a problem with the Hidden Columns settings being reset after calling `updateSettings`.
  [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed a bug with the `filters` plugin using incorrect indexes after moving and/or sorting the
  table. [#4442](https://github.com/handsontable/handsontable/issues/4442)
- Fixed a bug that caused a column to contain improper data after moving it to index `0`.
  [#4470](https://github.com/handsontable/handsontable/issues/4470)
- Fixed a bug with the `afterRowMove` hook receiving an improper `target` argument.
  [#4501](https://github.com/handsontable/handsontable/issues/4501)
- Fixed a problem with the `manualColumnFreeze` plugin enabling `manualColumnMove`, even if it was
  declared as `false`. [#4553](https://github.com/handsontable/handsontable/issues/4553)
- Fixed a problem with plugins using `arrayMappers` not working properly after updating the dataset.
  [#4567](https://github.com/handsontable/handsontable/issues/4567)
- Fixed a bug, where calling `loadData` with `minSpareRows` and `manualRowMove` enabled caused the
  table to improperly load the data.
  [#4576](https://github.com/handsontable/handsontable/issues/4576)
- Fixed a bug, where enabling `columnSorting` caused the `manualColumnFreeze` to be unusable.
  [#4601](https://github.com/handsontable/handsontable/issues/4601)
- Fixed a problem, where the columns were assigned improper widths after inserting additional
  columns or removing any of them. [#4666](https://github.com/handsontable/handsontable/issues/4666)
- Fixed a bug, where moving rows was impossible while `persistentState` was enabled.
  [#4713](https://github.com/handsontable/handsontable/issues/4713)
- Fixed a bug, where `manualColumnMove` didn't work if the dataset was empty.
  [#4926](https://github.com/handsontable/handsontable/issues/4926)
- Fixed a bug with the `collapseAll` method from the `collapsibleColumns` plugin did not work
  properly if `columnSorting` was enabled.
  [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed a bug, where calling `loadData` with `minSpareRows` enabled would cause unwanted blank rows
  to appear. [#5707](https://github.com/handsontable/handsontable/issues/5707)
- Fixed a bug with the `afterColumnMove` hook receiving an improper `target` argument.
  [#5173](https://github.com/handsontable/handsontable/issues/5173)
- Fixed a problem, where filtering data after moving rows would not work properly.
  [#5178](https://github.com/handsontable/handsontable/issues/5178)
- Fixed a bug, where calling `loadData` made `NaN` appear in the column headers.
  [#5369](https://github.com/handsontable/handsontable/issues/5369)
- Fixed a bug with the `skipColumnOnPaste` option not working properly when using `columnSorting`
  and `hiddenColumns`. [#5824](https://github.com/handsontable/handsontable/issues/5824)
- Fixed a bug with the `trimRows` plugin did not work properly after moving rows.
  [#5860](https://github.com/handsontable/handsontable/issues/5860)
- Fixed a problem with `minSpareRows` not working properly with the `trimRows` plugin being used.
  [#5862](https://github.com/handsontable/handsontable/issues/5862)
- Fixed a problem, where it was impossible to filter the data declared in the `nestedRows` plugin.
  [#5889](https://github.com/handsontable/handsontable/issues/5889)
- Fixed a bug, where filtering and sorting data would cause the `toVisualRow` method to return the
  wrong results. [#5890](https://github.com/handsontable/handsontable/issues/5890)
- Fixed a bug with the `filters` and `trimRows` plugins not working properly alongside each other.
  [#5915](https://github.com/handsontable/handsontable/issues/5915)
- Fixed a bug, where `manualColumnMove` would not work properly when the data object properties
  count would be lower than the table column count.
  [#5931](https://github.com/handsontable/handsontable/issues/5931)
- Fixed a bug with the `trimRows` plugin did not work properly with the `startRows` option.
  [#5953](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem, where using `loadData` after sorting would not work as expected.
  [#5956](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a problem with the `beforeColumnMove` and `afterColumnMove` hooks not containing information
  about their destination indexes. [#6005](https://github.com/handsontable/handsontable/issues/6005)
- Fixed a problem where using `filters` and `minSpareRows` would make the table add an empty row at
  the beginning of the table. [#6278](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug with the `manualRowMove` plugin would duplicate data in the moved rows, when used with
  a row index greater than the table row count.
  [#6088](https://github.com/handsontable/handsontable/issues/5953)
- Fixed a bug, where the `toVisualRow` method returned `null` when using the `trimRows` and
  `columnSorting` plugins together.
  [#6310](https://github.com/handsontable/handsontable/issues/6310)
- Fixed a problem, where calling `updateSettings` in the `afterColumnMove` hook callback would have
  no effect. [#4480](https://github.com/handsontable/handsontable/issues/4480)
- Fixed a bug, where calling `loadData` would make the `filters` plugin to not behave as expected.
  [#5244](https://github.com/handsontable/handsontable/issues/5244)
- Fixed a bug, where detaching a child from a parent in the `nestedRows` plugin would cause a `+/-`
  button misalignment. [#5900](https://github.com/handsontable/handsontable/issues/5900)
- Fixed a problem with the `columnSummary` plugin creating a doubled summary row.
  [#5794](https://github.com/handsontable/handsontable/issues/5794)
- Fixed a bug, where moving children between parents using the `nestedRows` plugin would throw an
  error. [#6066](https://github.com/handsontable/handsontable/issues/6066)
- Fixed a bug, where adding rows by modifying the data by reference while using the `nestedRows`
  plugin would throw an error. [#3914](https://github.com/handsontable/handsontable/issues/3914)
- Fixed a bug, where merging cells would conflict with the `columnSorting` plugin.
  [#6086](https://github.com/handsontable/handsontable/issues/6086)
- Fixed a bug, where the row headers would stay visible after removing all the table columns.
  [#6412](https://github.com/handsontable/handsontable/issues/6412)
- Fixed an issue where Hidden columns become visible when the user ran `updateSettings`.
  [#4121](https://github.com/handsontable/handsontable/issues/4121)
- Fixed an issue where using `hiddenColumns` and `stretchH` showed a redundant horizontal scrollbar.
  [#4181](https://github.com/handsontable/handsontable/issues/4181)
- Fixed an issue in which if the last column was a hidden column and `stretchH` was enabled, the
  last column was displayed. [#4370](https://github.com/handsontable/handsontable/issues/4370)
- Fixed an issue where `updateSettings` performance was very low because of `hiddenColumns` being
  rendered. [#4381](https://github.com/handsontable/handsontable/issues/4381)
- Fixed an issue where collapse was not working correctly with custom cell renderers.
  [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an incorrect header name when user defined more columns in the `nestedHeaders` plugin.
  [#4716](https://github.com/handsontable/handsontable/issues/4716)
- Fixed an issue where `hiddenColumns` did not work properly with `columnSorting`.
  [#5571](https://github.com/handsontable/handsontable/issues/5571)
- Fixed an issue where `manualColumnMove` should work with `hiddenColumns`.
  [#5598](https://github.com/handsontable/handsontable/issues/5598)
- Fixed an issue where `hiddenColumns` option interfered with the keyboard movement.
  [#5704](https://github.com/handsontable/handsontable/issues/5704)
- Fixed an issue where after hiding the first two rows, the row headers became de-synchronized by
  1px. [#5817](https://github.com/handsontable/handsontable/issues/5817)
- Fixed an issue where hiding columns affected selection of hidden columns.
  [#5871](https://github.com/handsontable/handsontable/issues/5871)
- Fixed an issue where if `collapsibleColumns` were set to `true` it was impossible to exit
  selection mode. [#5875](https://github.com/handsontable/handsontable/issues/5875)
- Fixed an issue where `hiddenColumns` did not work properly with `autoWrapRow/autoWrapCol`.
  [#5877](https://github.com/handsontable/handsontable/issues/5877)
- Fixed an issue on IE where hiding the first column caused a display of double border for top left
  corner. [#5881](https://github.com/handsontable/handsontable/issues/5881)
- Fixed an issue where `nestedHeaders` duplicated a header name if more columns are added.
  [#5882](https://github.com/handsontable/handsontable/issues/5882)
- Fixed an issue where `hiddenColumns` plugin unset cell's `renderer`.
  [#5883](https://github.com/handsontable/handsontable/issues/5883)
- Fixed an issue where `hiddenColumns` had stored visual indexes and should have used physical
  indexes. [#5909](https://github.com/handsontable/handsontable/issues/5909)
- Fixed an issue where hidden columns should be unrecoverable.
  [#6113](https://github.com/handsontable/handsontable/issues/6113)
- Fixed an issue where row selection ignored columns that are hidden at the end.
  [#6181](https://github.com/handsontable/handsontable/issues/6181)
- Fixed an issue where defining data with more data than used in `columns` caused an issue with
  showing column once it was hidden.
  [#6426](https://github.com/handsontable/handsontable/issues/6426)
- Fixed an issue where hiding rows, while there was a merged area, involved caused data shifting and
  unexpected merged area coordinates.
  [#6376](https://github.com/handsontable/handsontable/issues/6376)
- Fixed an issue where `colHeader` was truncated after moving `hiddenColumn`.
  [#6463](https://github.com/handsontable/handsontable/issues/6463)
- Fixed an issue where the last hidden column was visible upon column resizing.
  [#6557](https://github.com/handsontable/handsontable/issues/6557)
- Fixed an issue where with hiding columns after moved them manually.
  [#6668](https://github.com/handsontable/handsontable/issues/6668)
- Fixed an issue where expanding a collapsed column caused expanding of a child columns except for
  the first one. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue where setting `columnSorting` to `true` (on initialization or via `updateSettings`)
  made headers non-collapsible programmatically via `collapseAll` method.
  [#4999](https://github.com/handsontable/handsontable/issues/4999)
- Fixed an issue where `customBorders` plugin was missing in the definition file.
  [#6477](https://github.com/handsontable/handsontable/issues/6477)
- Fixed incorrect size of `wtHider`and `wtHolder` in overlays.
  [#3873](https://github.com/handsontable/handsontable/issues/3873)
- Fixed an issue where `updateSettings` could not update `tableClassName`.
  [#6295](https://github.com/handsontable/handsontable/issues/6295)
- Fixed an issue where JSON data with empty value was losing some double quotes when pasted into a
  cell. [#6167](https://github.com/handsontable/handsontable/issues/6167)
- Fixed an issue where some classes for the table were missing if one of them was empty.
  [#6371](https://github.com/handsontable/handsontable/issues/6371)
- Fixed an issue where clicking in a contextmenu's border opened the native context menu.
  [#6218](https://github.com/handsontable/handsontable/issues/6218)
- Fixed the error that ocurred during loading of E2E test runner in Edge and IE.
  [#6713](https://github.com/handsontable/handsontable/issues/6713)
- Fixed the inconsistency and problems with adding rows from the corner when all rows are trimmed.
  [#7061](https://github.com/handsontable/handsontable/issues/7061)
- Fixed an issue where using read-only and alignment from the context menu was disabled when all
  columns were selected. [#7114](https://github.com/handsontable/handsontable/issues/7114)
- Fixed an issue where setting focus to a column to open context menu after applying a filter was
  impossible. [#7005](https://github.com/handsontable/handsontable/issues/7005)
- Fixed an issue where `minSpareCols` with `undo` added too many columns.
  [#6363](https://github.com/handsontable/handsontable/issues/6363)
- Fixed the inconsistency in selection when using the right mouse button for first row/column.
  [#6334](https://github.com/handsontable/handsontable/issues/6334)
- Fixed an issue where undoing column removal caused column headers to lack a header.
  [#6992](https://github.com/handsontable/handsontable/issues/6992)
- Fixed an issue where `readOnly` for column was erased (did not apply) if filters were used.
  [#6559](https://github.com/handsontable/handsontable/issues/6559)
- Fixed an issue where readonly property was lost after declining confirmation in `beforeRemoveCol`
  or `beforeRemoverow`. [#6332](https://github.com/handsontable/handsontable/issues/6332)
- Fixed an issue where `readOnly` state for some cells was lost when rows with `trimRows` turned on
  were removed. [#6990](https://github.com/handsontable/handsontable/issues/6990)
- Fixed incorrect column header highlight when merged cells were unmerged and `hiddenColumns` were
  used. [#6978](https://github.com/handsontable/handsontable/issues/6978)
- Fixed an issue where after hiding the first row, the second row top border disappeared.
  [#6977](https://github.com/handsontable/handsontable/issues/6977)
- Fixed an issue with incorrect selection after hiding the first row.
  [#6831](https://github.com/handsontable/handsontable/issues/6831)
- Fixed an issue where hiding the first row caused blue highlight in column headers selection to
  disappear. [#6976](https://github.com/handsontable/handsontable/issues/6976)
- Fixed wrong selection area after sorting with hidden rows.
  [#6386](https://github.com/handsontable/handsontable/issues/6386)
- Fixed an issue where it was not possible to use `selectAll` when the first row was hidden.
  [#6975](https://github.com/handsontable/handsontable/issues/6975)
- Fixed an issue where it was possible to select hidden row or column.
  [#6974](https://github.com/handsontable/handsontable/issues/6974)
- Fixed an issue where row indexes changed if the first row was hiding after moving row from bottom
  to top. [#6965](https://github.com/handsontable/handsontable/issues/6965)
- Fixed an issue where selection skipped the highest parent.
  [#6770](https://github.com/handsontable/handsontable/issues/6770)
- Fixed an iisue where `nestedRows` blocked table from loading if data was not provided.
  [#6928](https://github.com/handsontable/handsontable/issues/6928)
- Fixed an isse where it was impossible to go back to the original cell after dragging down.
  [#4233](https://github.com/handsontable/handsontable/issues/4233)
- Fixed an issue where keyboard navigation did not work on merged cells with hidden rows/columns.
  [#6973](https://github.com/handsontable/handsontable/issues/6973)
- Fixed an issue where `trimRows` and `hiddenRows` with specific settings broke borders.
  [#6904](https://github.com/handsontable/handsontable/issues/6904)
- Fixed wrong union type for `startPosition`.
  [#6840](https://github.com/handsontable/handsontable/issues/6840)
- Fixed type mismatch for `Handsontable.plugins.ContextMenu`.
  [#6347](https://github.com/handsontable/handsontable/issues/6347)
- Fixed an issue where `manualColumnMove` did not modify the `columns` in `updateSettings`.
  [#5200](https://github.com/handsontable/handsontable/issues/5200)
- Fixed rendering issue on column udpate with `updateSettings`.
  [#3770](https://github.com/handsontable/handsontable/issues/3770)
- Fixed an issue where expanding a collapsed column was also expanding 'child' collapsed columns,
  except the first child. [#5792](https://github.com/handsontable/handsontable/issues/5792)
- Fixed an issue with inproper selection for headers when the first column was hidden.
  [#5999](https://github.com/handsontable/handsontable/issues/5999)
- Fixed an issue where it was not possible to align cells if the selection was made upward.
  [#6600](https://github.com/handsontable/handsontable/issues/6600)
- Fixed an issue where `currentColClassName` did not work properly with `nestedHeaders`.
  [#5861](https://github.com/handsontable/handsontable/issues/5861)
- Fixed an issue with scrollbar and dimension calculation in Firefox for toggling column visibility
  with fixed columns and `stretchH`.
  [#6186](https://github.com/handsontable/handsontable/issues/6186)
- Fixed an issue with undoing the nested row removal.
  [#6433](https://github.com/handsontable/handsontable/issues/6433)
- Fixed an isse where `getSourceData` functions returned wrong data for nested rows.
  [#5771](https://github.com/handsontable/handsontable/issues/5771)
- Fixed na issue where formulas plugin did not work with `nestedRows`.
  [#4154](https://github.com/handsontable/handsontable/issues/4154)
- Fixed an issue where nested headers and hidden columns highlighted ad additional column when used
  together. [#6881](https://github.com/handsontable/handsontable/issues/6881)
- Fixed an issue where `getByRange` for sourceData did not work properly with nested object data.
  [#6548](https://github.com/handsontable/handsontable/issues/6548)
- Fixed an issue where `window.frameElement` threw errors in MSEdge, IE and Safari.
  [#6478](https://github.com/handsontable/handsontable/issues/6478)
- Fixed an issue where `DataSource.countColumns` returned invalid number of columns for nested
  objects. [#3958](https://github.com/handsontable/handsontable/issues/3958)
- Fixed an issue where `mergedCells` with hidden cells caused problems with rendering.
  [#7020](https://github.com/handsontable/handsontable/issues/7020)
- Fixed an issue where it was not possible to move column when all columns were selected by
  `ctrl + a`. [#6355](https://github.com/handsontable/handsontable/issues/6355)
- Fixed an issue where double click on the column resize handle did not adjust size correctly.
  [#6755](https://github.com/handsontable/handsontable/issues/6755)
- Fixed an issue where the cell meta was retrieved using the wrong coordinates.
  [#6703](https://github.com/handsontable/handsontable/issues/6703)
- Fixed nested rows incorrect state after changing data.
  [#5753](https://github.com/handsontable/handsontable/issues/5753)
- Fixed an issue in EDGE where the dropdown menu `onMouseOut` event caused critical errors when
  hovering over vertical scrollbar.
  [#6699](https://github.com/handsontable/handsontable/issues/6699)
- Fixed an issue with too many layers of highlight with noncontinuous selection on merged cells.
  [#7028](https://github.com/handsontable/handsontable/issues/7028)
- Fixed an issue where `NestedHeaders` did not allow to define header level as an empty array.
  [#7035](https://github.com/handsontable/handsontable/issues/7035)
- Fixed an issue where passing `nestedHeaders` as a single empty array stoped the table from
  rendering. [#7036](https://github.com/handsontable/handsontable/issues/7036)
- Fixed an issue where opening a context menu for a column when its hidden data was selected did not
  block adding of rows by the menu.
  [#7050](https://github.com/handsontable/handsontable/issues/7050)
- Fixed an issue where it was not possible to navigate past hidden column using keyboard
  if` hot.updateSettings` was called in `afterSelection`.
  [#3726](https://github.com/handsontable/handsontable/issues/3726)
- Fixed an issue where headers did not export with `exportToFile` in the specific case.
  [#4176](https://github.com/handsontable/handsontable/issues/4176)
- Fixed an issue with types mismatch.
  [#6035](https://github.com/handsontable/handsontable/issues/6035)
- Fixed an issue where manual row resize handler threw an error when bottom rows overlay was
  enabled. [#6435](https://github.com/handsontable/handsontable/issues/6435)
- Fixed an issue where the `afterRowResize` hook shared incorrect results in the second parameter.
  [#6430](https://github.com/handsontable/handsontable/issues/6430)
- Fixed an issue where the row/column resize hooks should not have returned `null`.
  [#7074](https://github.com/handsontable/handsontable/issues/7074)
- Fixed the loss of selection after merging from headers.
  [#7076](https://github.com/handsontable/handsontable/issues/7076)
- Fixed an issue where calling `updateSettings` changed the index of frozen columns via
  `freezeColumn` method. [#6843](https://github.com/handsontable/handsontable/issues/6843)
- Fixed an issue where deleting the last column via `updateSettings` which was part of the selection
  caused scroll to the bottom. [#5849](https://github.com/handsontable/handsontable/issues/5849)
- Fixed an issue where it was not possible to hide rows and merge cells at the same time.
  [#6224](https://github.com/handsontable/handsontable/issues/6224)
- Fixed the wrong data in merge cells after the hidden column and additionally an error occurs.
  [#6888](https://github.com/handsontable/handsontable/issues/6888)
- Fixed an issue where it was not possible to change cell type via `setCellMeta`.
  [#4793](https://github.com/handsontable/handsontable/issues/4793)
- Fixed an issue where cell editor did not dynamically changed while changing the cell type.
  [#4360](https://github.com/handsontable/handsontable/issues/4360)
- Fixed an issue where it was not possible to unmerge cells if part of them was hidden.
  [#7095](https://github.com/handsontable/handsontable/issues/7095)
- Fixed an issue where calling `clear` method removed the focus from the table.
  [#7099](https://github.com/handsontable/handsontable/issues/7099)
- Fixed an issue where `clear` method did not work for hidden data.
  [#7097](https://github.com/handsontable/handsontable/issues/7097)
- Fixed an issue where the editor was moved by 1px when the first row / column was hidden.
  [#6982](https://github.com/handsontable/handsontable/issues/6982)
- Fixed an issue where headers were deselected after undoing removal.
  [#6670](https://github.com/handsontable/handsontable/issues/6670)
- Fixed an issue with improper selection after insert column/row when mergeCells was enabled.
  [#4897](https://github.com/handsontable/handsontable/issues/4897)
- Fixed an issue where wrong cell meta was removed when deleting rows.
  [#6051](https://github.com/handsontable/handsontable/issues/6051)
- Fixed wrong types of `beforeRowMove` arguments.
  [#6539](https://github.com/handsontable/handsontable/issues/6539)
- Fixed an issue where selection of a whole row did not happen consequently after selecting a row
  header. [#5906](https://github.com/handsontable/handsontable/issues/5906)
- Fixed an issue where it was not possible to use physical row index instead of visual one.
  [#6309](https://github.com/handsontable/handsontable/issues/6309)
- Fixed an issue where incorrect data was returned after undoing the remove column option.
  [#5000](https://github.com/handsontable/handsontable/issues/5000)
- Fixed - Copy and paste works properly also when selecting hidden columns when: all columns within
  a selected range are hidden and when just some columns within a selected range are hidden.
  [#7043](https://github.com/handsontable/handsontable/issues/7043).
- Fixed an issue where it was impossible to add new row in the `nestedRows`.
  [#5133](https://github.com/handsontable/handsontable/issues/5133)
- Fixed an issue where `afterOnCellMouseDown` returned (0,0) coords after clicking on the topleft
  corner. [#3978](https://github.com/handsontable/handsontable/issues/3978)
- Fixed an issue where persisted `manualColumnMove` was not restored when using `loadData`.
  [#5207](https://github.com/handsontable/handsontable/issues/5207)
- Fixed issues with filtering results in blank rows.
  [#5208](https://github.com/handsontable/handsontable/issues/5208)
- Fixed an issue where changing data on collapsed rows resulted in error.
  [#5328](https://github.com/handsontable/handsontable/issues/5328)
- Fixed an issue where the `manualColumnMove` operation affected the column order of data loaded by
  `loadData`. [#5591](https://github.com/handsontable/handsontable/issues/5591)
- Fixed an issue where `nestedRows` did not allow to keep `rowHeaders` after collapsing.
  [#5874](https://github.com/handsontable/handsontable/issues/5874)
- Fixed performance and CPU issue caused by using some handsontable properties.
  [#6058](https://github.com/handsontable/handsontable/issues/6058)
- Fixed an error with columnSummary plugin when trying to create a row.
  [#6300](https://github.com/handsontable/handsontable/issues/6300)
- Fixed an error where `walkontable.css` and `handsontable.css` stylesheets were out of sync.
  [#6381](https://github.com/handsontable/handsontable/issues/6381)
- Fixed an issue where `colHeaders` order was not updated after manual move with empty object data
  source. [#6413](https://github.com/handsontable/handsontable/issues/6413)
- Fixed "detach from parent" option.
  [#6432](https://github.com/handsontable/handsontable/issues/6432)
- Fixed an issue where `PreventOverflow` feature did not work if `multiColumnSorting` plugin was
  enabled. [#6514](https://github.com/handsontable/handsontable/issues/6514)
- Fixed an issue where old CSS classes were not removed after `updateSettings`.
  [#6575](https://github.com/handsontable/handsontable/issues/6575)
- Fixed an issue where `columnSummary`, `Filters` and spare rows were causing 'RangeError: Maximum
  call stack size exceeded'. [#6695](https://github.com/handsontable/handsontable/issues/6695)
- Fixed an issue where `afterSelectionEnd` returned incorrect data when clicking on a column when
  all rows were hidden. [#7045](https://github.com/handsontable/handsontable/issues/7045)
- Fixed an issue where wrapping was not applied after setting `trimWhitespace` to `false`.
  [#6232](https://github.com/handsontable/handsontable/issues/6232)
- Fixed an issue with additional selection border in iOS.
  [#7103](https://github.com/handsontable/handsontable/issues/7103)
- Fixed an issue with rendering different borders.
  [#6955](https://github.com/handsontable/handsontable/issues/6955)
- Fixed an issue with `BACKSPACE` not working properly in the filter by value input.
  [#6842](https://github.com/handsontable/handsontable/issues/6842)
- Fixed an issue with Undo/Redo not working with fixing columns.
  [#6869](https://github.com/handsontable/handsontable/issues/6869)
- Added a missing argument in the `deepObjectSize` function.
  [#6821](https://github.com/handsontable/handsontable/pull/6821)

For more information on Handsontable 8.0.0, see:

- [Blog post (8.0.0)](https://handsontable.com/blog/the-new-handsontable-8-is-now-available)
- [Documentation (8.0.0)](https://handsontable.com/docs/8.0.0)
- [Migration guide (7.4 → 8.0)](https://handsontable.com/docs/migration-from-7.4-to-8.0)
- [Release notes (8.0.0)](https://handsontable.com/docs/javascript-data-grid/release-notes/#_8-0)

## Prior [8.0.0]

The changes for previous versions are described at
https://github.com/handsontable/handsontable/releases.
