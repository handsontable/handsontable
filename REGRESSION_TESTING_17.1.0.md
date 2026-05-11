# Regression Testing Checklist - Handsontable 17.1.0

**Build status:** PASS (2688/2688 unit tests, `npm run build --prefix handsontable`)
**Date:** 2026-05-11
**Branch:** `claude/regression-testing-mapping-1Wf5V`

---

## How to use this document

Each feature section lists the PRs it covers and step-by-step manual test steps.
Mark each step: `[x]` pass, `[F]` fail (add note), `[-]` skipped / N/A.

---

## APLIKACJA - CORE EDITING

### 1. Autocomplete editor
**PRs:** #12285, #12440

- [ ] Open a grid with `type: 'autocomplete'` column
- [ ] Start typing - suggestions dropdown appears
- [ ] Click outside the editor - value is saved
- [ ] With `strict: true` + `allowInvalid: false`: type a value not in the list, click away - value reverts to previous
- [ ] With `strict: true` + `allowInvalid: true`: type an invalid value, click away - typed value stays
- [ ] With `strict: false`: click away - typed value is kept
- [ ] No timing / flaky failures when opening and closing the editor quickly

---

### 2. Date picker editor
**PRs:** #12395, #12298

- [ ] Open a grid with `type: 'date'` column
- [ ] Editor opens and displays the date picker popup
- [ ] Date format follows `Intl.DateTimeFormatOptions` config (e.g. `{ year: 'numeric', month: '2-digit', day: '2-digit' }`)
- [ ] Keyboard navigation inside the picker works (arrow keys, Enter, Escape)
- [ ] **[Android emulator]** Touch a date cell - editor opens
- [ ] **[Android emulator]** Synthetic mouse events after touch do NOT close the editor
- [ ] Portal-based popup renders correctly without overflow/clipping

---

### 3. Numeric editor - comma-grouped values
**PR:** #12114

- [ ] Enter `100,000` in a numeric cell - parsed as `100000`
- [ ] Enter `1,234.56` - parsed as `1234.56`
- [ ] Enter `1.234,56` (EU locale) - parsed correctly per locale config
- [ ] Non-numeric input is rejected / falls back to previous value

---

### 4. Editor session - setDataAtRowProp cancel behavior
**PR:** #12144

- [ ] Start editing a cell in row 1 (cell is in edit mode)
- [ ] Call `hot.setDataAtRowProp(rowIndex, 'otherProp', value)` targeting a different column in the same row
- [ ] Active editor remains open - it is NOT canceled
- [ ] The cell being edited does not change its displayed value
- [ ] The programmatic update to the other column is applied after editor closes

---

### 5. Editor close - loading indicator crash
**PR:** #12348

- [ ] Set up `afterChange` hook that calls `hot.getPlugin('loading').show()`
- [ ] Open a cell editor, make a change, then close (Enter / click away)
- [ ] App does NOT crash / throw JavaScript error
- [ ] Loading indicator shows and hides correctly

---

## APLIKACJA - SELECTION & INPUT

### 1. Selection - default mode (not multiple range)
**PR:** #12501

- [ ] Open grid with NO explicit `selectionMode` config
- [ ] Default is single selection - only one cell/range selected at a time
- [ ] Ctrl+click does NOT add a second selection range
- [ ] `disableVisualSelection: false` (default) - selection highlight is visible
- [ ] React example: selection mode is NOT forced to `multiple` by default

---

### 2. disableVisualSelection - undefined treated as false
**PR:** #12307

- [ ] Grid with no `disableVisualSelection` setting - selection highlight visible
- [ ] Set `disableVisualSelection: undefined` - selection highlight still visible (treated as `false`)
- [ ] Set `disableVisualSelection: true` - selection highlight hidden
- [ ] Set `disableVisualSelection: false` explicitly - selection highlight visible
- [ ] `updateSettings({ disableVisualSelection: false })` after `true` - highlight reappears

---

### 3. Keyboard - Ctrl+A inside comments
**PR:** #12283

- [ ] Open a comment editor on a cell (right-click > Add/Edit comment)
- [ ] Type some text in the comment textarea
- [ ] Press Ctrl+A (Cmd+A on Mac) - only the comment text is selected
- [ ] Grid cells are NOT selected / highlighted
- [ ] Ctrl+A outside the comment (in grid) still selects all cells

---

### 4. Keyboard - Space key in filter search input
**PR:** #12290

- [ ] Open Filters dropdown on a column
- [ ] Click the search input field
- [ ] Type text with spaces (e.g. `foo bar`)
- [ ] Space character is inserted into the search query
- [ ] Filter results update to match the typed text including spaces
- [ ] Leading/trailing spaces are trimmed from the final filter condition

---

## APLIKACJA - FILTERING

### 1. Filters - conditions preserved after column move
**PR:** #12117

- [ ] Apply a filter condition to column A (e.g. contains "X")
- [ ] Drag column A to a different position (e.g. move to position 3)
- [ ] Filter indicator icon still shows on the moved column
- [ ] Data is filtered correctly based on the moved column's values
- [ ] Other columns are not accidentally filtered

---

### 2. Filters - no input lag in search mode
**PR:** #12150

- [ ] Open Filters dropdown, use the search input
- [ ] Type 10+ characters rapidly
- [ ] UI remains responsive - no visible lag between keystrokes
- [ ] `hideRow` calls are batched (no row flickering during typing)
- [ ] Final filter result is correct

---

## APLIKACJA - RENDERING & PERFORMANCE

### 1. Rendering performance - fast scrollbar drag
**PRs:** #12235, #12189

- [ ] Load grid with 10,000+ rows and 20+ columns
- [ ] Grab the vertical scrollbar and drag it rapidly up and down
- [ ] Rendering is smooth - no visible freeze or jank
- [ ] All cells render correctly after scrolling stops
- [ ] Grab horizontal scrollbar and drag rapidly - same result

---

### 2. Rendering - paste large HTML dataset
**PR:** #12121

- [ ] Create an HTML table with 1000+ rows in a text editor / browser
- [ ] Copy the HTML table (Ctrl+C)
- [ ] Paste into Handsontable (Ctrl+V)
- [ ] Data loads without crash or JavaScript error
- [ ] All rows appear in the grid
- [ ] Performance is acceptable (paste completes within a few seconds)

---

### 3. Rendering - column resize with CSS transform: scale
**PR:** #12118

- [ ] Apply `transform: scale(0.8)` to the Handsontable container element
- [ ] Hover over a column header border - resize handle appears
- [ ] Drag the resize handle to resize a column
- [ ] Column width changes align with the drag position (no offset)
- [ ] Resize works at scale(0.5) and scale(1.5) as well

---

### 4. Rendering - ghost table & collapsible column width
**PR:** #12275

- [ ] Enable `collapsibleColumns: true` and `nestedHeaders` with collapsible groups
- [ ] Collapse a column group
- [ ] Column widths are correct after collapse - no extra blank space
- [ ] Expand the group - widths return to original values
- [ ] Ghost table (drag preview) appears correctly when moving columns

---

## APLIKACJA - SCROLL & POSITIONING

### 1. Scroll hooks - no duplicate fire when position unchanged
**PR:** #12151

- [ ] Set up `afterScrollVertically` listener that logs calls
- [ ] Scroll the grid down - hook fires once
- [ ] Scroll to the bottom edge, then attempt to scroll further down
- [ ] Hook does NOT fire again (position unchanged)
- [ ] Same test for `afterScrollHorizontally`

---

### 2. Pagination - caret button alignment
**PR:** #12205

- [ ] Enable `pagination` plugin
- [ ] Inspect the left caret (`<`) and right caret (`>`) navigation buttons
- [ ] Left caret is visually centered / pixel-perfect aligned (not 1px off)
- [ ] Right caret is aligned correctly
- [ ] Alignment holds in both light and dark themes

---

## APLIKACJA - COLUMN OPERATIONS

### 1. columnHeaderHeight - does not clip content
**PR:** #12286

- [ ] Set `columnHeaderHeight: 20` with a header that contains wrapped text needing 40px
- [ ] Header content is fully visible (not clipped by the height constraint)
- [ ] Setting a height LARGER than content - header height matches the setting
- [ ] Setting a height SMALLER than content - height expands to fit content

---

### 2. Fixed columns - header alignment on second fixed column
**PR:** #12202

- [ ] Set `fixedColumnsStart: 2`
- [ ] Click to select the second fixed column (index 1)
- [ ] Header cell and data column are aligned - no 1px misalignment
- [ ] Select first fixed column - also aligned
- [ ] Scroll horizontally - fixed columns remain aligned

---

### 3. stretchH: 'last' - respects defined column width
**PR:** #12123

- [ ] Set `stretchH: 'last'` and define a width for the last column (e.g. `columns: [..., { width: 200 }]`)
- [ ] Last column displays at 200px, not 0px
- [ ] Resize the browser window - last column stretches but respects minimum defined width
- [ ] No column shrinks to 0px

---

## APLIKACJA - DATA OPERATIONS

### 1. setDataAtRowProp - source parameter in array form
**PR:** #12300

- [ ] Attach `beforeChange` and `afterChange` listeners that log the `source` argument
- [ ] Call `hot.setDataAtRowProp([{ row: 0, prop: 'name', value: 'test' }], 'custom-source')`
- [ ] `beforeChange` receives source `'custom-source'`
- [ ] `afterChange` receives source `'custom-source'` (not `'edit'`)
- [ ] Single-call form `hot.setDataAtRowProp(0, 'name', 'test', 'custom-source')` also passes source correctly

---

### 2. setSourceDataAtCell - updates child row in nestedRows
**PR:** #12143

- [ ] Enable `nestedRows` plugin with parent/child data structure
- [ ] Expand a parent row to reveal child rows
- [ ] Call `hot.setSourceDataAtCell(childVisualRow, col, newValue)` targeting a child row
- [ ] Child row data updates - parent row data is unchanged
- [ ] `hot.getSourceDataAtRow(childVisualRow)` returns updated value

---

### 3. isEmptyRow / isEmptyCol - dataSchema defaults treated as empty
**PRs:** #12254, #12255

- [ ] Set `dataSchema: { name: '', active: false, qty: 0 }` and `minSpareRows: 1`
- [ ] `hot.isEmptyRow(lastRow)` returns `true` for a row filled with schema defaults
- [ ] `hot.isEmptyCol(col)` returns `true` for a column filled with schema defaults
- [ ] Grid does NOT keep adding infinite spare rows (minSpareRows is respected)
- [ ] Checkbox column with `false` default - spare row detection works correctly

---

## APLIKACJA - FORMULAS & CALCULATIONS

### 1. Formulas autofill - crossing hidden columns with copyPaste disabled
**PR:** #12203

- [ ] Create a formula in column A (e.g. `=B1+1`)
- [ ] Hide column B (`hiddenColumns: { columns: [1] }`)
- [ ] Disable copy-paste (`copyPaste: false`)
- [ ] Select cell A1, use autofill handle to drag to column C
- [ ] Formula in C1 is adjusted correctly (e.g. `=D1+1`)
- [ ] No error thrown due to disabled copyPaste

---

### 2. HyperFormula - shared engine with multiple tables
**PR:** #12305

- [ ] Create two Handsontable instances sharing one `HyperFormula` engine
- [ ] Enable `autoColumnSize` and `autoRowSize` on both
- [ ] Change data in table 1 - table 1 updates correctly
- [ ] Table 2 remains responsive and does NOT freeze
- [ ] Cross-table formulas evaluate correctly

---

### 3. HyperFormula - MultiSelect array values
**PR:** #12135

- [ ] Set up a `multiSelect` column and select multiple values (e.g. `['A', 'B']`)
- [ ] Add a formula in an adjacent cell referencing the MultiSelect cell
- [ ] No `HyperFormula` error is thrown in the console
- [ ] Formula evaluates (returns array or first element depending on config)

---

## APLIKACJA - NESTED ROWS & HEADERS

### 1. Nested headers - rowspan support
**PR:** #12129

- [ ] Configure `nestedHeaders` with a rowspan entry (e.g. `rowspan: 2`)
- [ ] Spanning header cell occupies the correct number of rows visually
- [ ] Clicking the spanning header sorts the correct column
- [ ] Column move: spanning header moves correctly with its column group
- [ ] Column hide: spanning header hides/shows with its column

---

### 2. Nested headers - rowspan regressions (6 fixes)
**PR:** #12152

- [ ] Rowspan header + column sorting: clicking sorts correctly, no visual glitch
- [ ] Rowspan header + filters: filter dropdown opens on correct column
- [ ] Rowspan header + column move: headers reorder correctly after drag
- [ ] Rowspan header + column hide: hidden column also hides its spanning header portion
- [ ] Rowspan header + selection highlight: correct columns highlight on click
- [ ] No extra borders or misaligned cells in any of the above scenarios

---

### 3. Nested headers - null highlight crash on sort
**PR:** #12211

- [ ] Configure `nestedHeaders` and set `currentColClassName: null` (or leave unset)
- [ ] Set `currentRowClassName: null` (or leave unset)
- [ ] Click a nested header cell to trigger column sorting
- [ ] No JavaScript crash / TypeError in console
- [ ] Sorting applied correctly to the target column

---

## APLIKACJA - COMMENTS & VISUAL

### 1. Comments - positioning on merged cells
**PR:** #12115

- [ ] Merge a range of cells (e.g. A1:C3) via `mergeCells`
- [ ] Right-click the merged cell and add a comment
- [ ] Comment editor popup appears anchored to the merged cell (not offset)
- [ ] Comment icon appears at top-right of the merged cell
- [ ] No overlap with adjacent cells or headers

---

### 2. Highlight class names update via updateSettings
**PR:** #12247

- [ ] Set `currentRowClassName: 'highlight-row-v1'` on init
- [ ] Select a row - class `highlight-row-v1` applied to the row
- [ ] Call `hot.updateSettings({ currentRowClassName: 'highlight-row-v2' })`
- [ ] Select a row - class `highlight-row-v2` is applied, `highlight-row-v1` is removed
- [ ] Same test for `currentColClassName`

---

### 3. Dropdown button styling with active filter header
**PR:** #12253

- [ ] Enable both `filters: true` and `dropdownMenu: true`
- [ ] Click a column header to make it active (highlighted)
- [ ] Dropdown button in the active header has correct styling (no border/color conflict with filter indicator)
- [ ] Open the dropdown - items render correctly
- [ ] Deselect the header - styling returns to normal

---

### 4. Checkbox - tick always white in both themes
**PR:** #12444

- [ ] Add a `checkbox` type column with some checked rows
- [ ] With default (light) theme: checked checkbox shows a white tick mark
- [ ] Switch to dark theme: checked checkbox still shows a white tick mark
- [ ] Unchecked boxes look correct in both themes
- [ ] Tick is visible against the checkbox background color in both themes

---

## APLIKACJA - TOUCH DEVICES

### 1. Long-press context menu on touch
**PR:** #12306

- [ ] **[Android emulator / real device]** Long-press a cell for ~600ms
- [ ] Context menu opens at the touch position
- [ ] Context menu items are tappable
- [ ] Short tap does NOT open the context menu
- [ ] **[iOS]** Long-press also opens context menu (if supported)

---

### 2. Editor not closed by synthetic mouse events (Android)
**PR:** #12298

- [ ] **[Android emulator / real device]** Tap a cell to open the editor
- [ ] Editor is open and showing the keyboard
- [ ] Synthetic mouse events fired by Android (mousedown/mouseup after touchend) do NOT close the editor
- [ ] Date picker portal popup: tap to open, popup stays open, pick a date
- [ ] Autocomplete popup: tap to open, suggestions visible, tap a suggestion

---

## APLIKACJA - UNDO/REDO

### 1. Undo after mixed checkbox + multi-select delete
**PR:** #12153

- [ ] Enable `checkboxColumn` and multi-row selection
- [ ] Check checkboxes on rows 2 and 4 (mixed: some via checkbox, some via Shift+click)
- [ ] Delete the selected rows (via context menu or keyboard)
- [ ] Press Ctrl+Z - rows are restored in their original positions
- [ ] Data in restored rows is correct
- [ ] Checkbox state is restored correctly

---

## ADVANCED FEATURES - SERVER-SIDE DATA

### 1. DataProvider - CRUD operations
**PRs:** #12147, #12172, #12238

- [ ] Configure `dataProvider` plugin pointing at a test backend endpoint
- [ ] Grid loads - initial rows fetched from the server (GET request)
- [ ] Add a new row - POST request sent with correct payload
- [ ] Edit a cell and save - PUT/PATCH request sent with correct row ID and data
- [ ] Delete a row - DELETE request sent with correct row ID
- [ ] Network errors show a meaningful message (not a raw crash)

---

### 2. DataProvider - server-side filtering and sorting
**PR:** #12160

- [ ] Apply a filter via the Filters dropdown
- [ ] Network request to backend includes filter conditions (column, operator, value)
- [ ] Click a sortable column header
- [ ] Network request includes `sortConfig` (column, order)
- [ ] Grid renders the server-returned rows in the sorted/filtered order
- [ ] Combining filter + sort sends both in the same request

---

### 3. Notification plugin - toast notifications
**PRs:** #12299, #12340

- [ ] Trigger a success notification: `hot.getPlugin('notification').show({ type: 'success', message: 'Saved' })`
- [ ] Toast appears at a fixed position (top-right or configured position)
- [ ] Toast does NOT block clicks on the grid beneath it
- [ ] Toast auto-closes after the configured timeout
- [ ] Trigger error and info variants - all display correctly
- [ ] DataProvider CRUD operations show Notification toasts (not Dialog popups)

---

## ADVANCED FEATURES - MULTISELECT

### 1. MultiSelect - overflow indicator respects chip padding tokens
**PR:** #12316

- [ ] Set up a `multiSelect` column with chip padding CSS tokens configured
- [ ] Select enough items to trigger the overflow indicator (e.g. "+2 more")
- [ ] Overflow indicator respects the `chipPaddingInline` / `chipPaddingBlock` token values
- [ ] Changing the token values updates the overflow indicator layout
- [ ] No text clipping inside chips

---

### 2. MultiSelect - HyperFormula array values (duplicate of Formulas section)
**PR:** #12135

- [ ] MultiSelect cell stores `['A', 'B']`
- [ ] Formula referencing the cell evaluates without console errors
- [ ] HyperFormula engine does not throw on array cell values

---

## ADVANCED FEATURES - PLUGINS

### 1. ExportFile - XLSX format
**PRs:** #12166, #12224

- [ ] Configure `exportFile` plugin
- [ ] Call `hot.getPlugin('exportFile').downloadFile('xlsx', { filename: 'test' })`
- [ ] File `test.xlsx` downloads to the browser
- [ ] Open file in Excel / LibreOffice - data matches the grid
- [ ] Column headers appear as the first row (using `colHeaders` option, not `columnHeaders`)
- [ ] Verify plugin config uses `colHeaders` (old `columnHeaders` key is not supported)

---

## WRAPPERS - REACT

### 1. React wrapper - dataSchema with non-plain objects
**PR:** #12207

- [ ] Set `dataSchema` containing a `Date` instance, a `Set`, or a `Map`
- [ ] Call `updateSettings({ data: newData })` or any other setting update
- [ ] Settings are applied correctly - no silent skip of the update
- [ ] `hot.getSettings().dataSchema` reflects the non-plain object reference
- [ ] No "Maximum update depth exceeded" React error

---

### 2. React wrapper - HotTableRef typing
**PR:** #12263

- [ ] Use `const ref = useRef<HotTableRef>(null)` in a TypeScript React component
- [ ] Access `ref.current.hotInstance.getPlugin('columnSorting')` - TypeScript does not error
- [ ] `HotTableRef` type is exported from `@handsontable/react-wrapper`
- [ ] Docs page for React instance methods shows the `HotTableRef` typing example
- [ ] Docs includes a note about mobile / touch limitations

---

## WRAPPERS - ANGULAR

### 1. Angular wrapper - modern patterns (Angular 17-19)
**PRs:** #12451, #12497

- [ ] Create an Angular 17+ standalone component using `HotTableModule`
- [ ] Bootstrap via `app.config.ts` (no `AppModule`) - table renders correctly
- [ ] Use `@if` / `@for` directives in the component template - no errors
- [ ] Performance: table with 1000 rows renders without `ExpressionChangedAfterItHasBeenCheckedError`
- [ ] All Angular documentation examples load without console errors

---

### 2. Angular wrapper - JIT compatibility
**PR:** #12456

- [ ] Compile the Angular demo with JIT compiler (not AOT)
- [ ] `templateUrl` in the component decorator resolves correctly
- [ ] Constructor-based dependency injection works (no `inject()` function required)
- [ ] No compilation error: "Module not found" or "metadata" related
- [ ] Demo renders the grid correctly in JIT mode

---

## WRAPPERS - GENERAL

### 1. updateSettings - skip init-only settings
**PR:** #12278

- [ ] Identify an init-only setting (e.g. `data`, `startRows` - settings that can't change post-init)
- [ ] Call `hot.updateSettings({ startRows: 10 })` after the grid is initialized
- [ ] Setting is silently skipped - no crash
- [ ] A warning is logged to the console indicating the setting is init-only
- [ ] Other settings passed in the same `updateSettings` call ARE applied

---

## THEME BUILDER

### 1. Pagination button CSS tokens (12 tokens)
**PRs:** #12404, #12317

- [ ] Open the Theme Builder UI
- [ ] Search for `paginationButton` in the token list
- [ ] 12 tokens visible: default, hover, focus, disabled states × (background, text, border) - confirm count
- [ ] Change `paginationButtonBackgroundColor` - pagination buttons update color in the preview
- [ ] Change `paginationButtonHoverBackgroundColor` - hover state reflects the new color
- [ ] Lightbulb icon / navigation arrow color changes when related tokens are modified

---

### 2. headerRowBackgroundColor cascades to row headers
**PR:** #12322

- [ ] Open Theme Builder
- [ ] Set `headerRowBackgroundColor` to a distinctive color (e.g. red)
- [ ] Column headers and row headers both show the new color
- [ ] `rowHeaderOddBackgroundColor` and `rowHeaderEvenBackgroundColor` derive from `headerRowBackgroundColor` when not explicitly overridden
- [ ] Changing `headerRowBackgroundColor` again - row headers update automatically

---

### 3. Theme builder demo respects color scheme toggle
**PRs:** #12412, #12394

- [ ] Open the Theme Builder built-in themes demo
- [ ] Toggle the color scheme selector from "light" to "dark"
- [ ] All theme previews switch to dark variants
- [ ] Toggle back to "light" - all previews switch to light variants
- [ ] Each built-in theme (Horizon, Main, etc.) has both light and dark variants available

---

### 4. Figma tokens sync
**PR:** #12454

- [ ] Open Theme Builder
- [ ] Verify token names match those in the Figma design file (spot-check 5-10 tokens)
- [ ] Token values (colors, spacing) are consistent between Theme Builder and Figma
- [ ] No tokens present in Theme Builder that are absent from Figma, or vice versa

---

## Summary

| Section | Total steps | Passed | Failed | Skipped |
|---|---|---|---|---|
| Core Editing (5 features) | 26 | | | |
| Selection & Input (4 features) | 21 | | | |
| Filtering (2 features) | 9 | | | |
| Rendering & Performance (4 features) | 16 | | | |
| Scroll & Positioning (2 features) | 11 | | | |
| Column Operations (3 features) | 13 | | | |
| Data Operations (3 features) | 15 | | | |
| Formulas & Calculations (3 features) | 16 | | | |
| Nested Rows & Headers (3 features) | 16 | | | |
| Comments & Visual (4 features) | 19 | | | |
| Touch Devices (2 features) | 10 | | | |
| Undo/Redo (1 feature) | 6 | | | |
| Advanced - Server-Side Data (3 features) | 18 | | | |
| Advanced - MultiSelect (2 features) | 8 | | | |
| Advanced - Plugins (1 feature) | 6 | | | |
| Wrappers - React (2 features) | 10 | | | |
| Wrappers - Angular (2 features) | 10 | | | |
| Wrappers - General (1 feature) | 5 | | | |
| Theme Builder (4 features) | 21 | | | |
| **TOTAL** | **256** | | | |

---

*Items marked [Android emulator] require a real or emulated Android device.*
*Items marked [iOS] require a real or emulated iOS device.*
