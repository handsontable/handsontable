# RowSelection plugin — checkbox row selection and "select all"

The `rowSelection` plugin lets the user select rows with checkboxes, and select or clear a whole scope
from a "select all" checkbox (PRO-87, modeled on AG Grid's `rowSelection`). Read this before touching
`rowSelection.ts`, `rowIdSelection.ts`, or the scope rules in `../../utils/rowScope.ts`.

## What it owns, and what it does not

- It owns a **row selection state of its own**: one boolean per physical row in a `physicalIndexToValue`
  map registered on `rowIndexMapper` under the plugin name (`'RowSelection'`). It is not the cell
  selection (`hot.getSelected()` never sees it), and it is never written into the data. A checkbox
  column bound to data is the `checkbox` cell type's job, not this plugin's.
- It does **not** own the order, the filtering, the hiding, or the paging of rows. It reads them: the
  index map follows its rows through sorts, moves, inserts, and removals by itself, and the scope rules
  in `../../utils/rowScope.ts` read Filters, TrimRows, HiddenRows, and Pagination state at the moment
  they are asked.

## The traps

- **The "select all" checkbox must describe exactly the rows a click on it acts on.** Both go through
  `#getRowsInScope()` → `collectRowsInScope()`. A header computed over one row set and a click acting on
  another is the most-reported defect in other grids (AG Grid and MUI issues on filtered and paged
  scopes). Do not add a second way to compute either.
- **The tick is an icon element, not the input's `::after`.** Since DEV-3003 a checkbox tick is an
  `<i class="ht-icon">` sibling of the input (an `<input>` holds no children), laid over the input by the
  checkbox renderer's `span.htCheckboxRendererBox` wrapper. `#renderCheckbox()` builds that wrapper
  (`htRowSelectionCheckboxBox`) and keeps its icon in step through `syncIcon()`: `checkbox`, or
  `collapseOff` (the dash) for the mixed state. A bare input shows an empty box, and margin overrides go
  on the wrapper, not the input. Pinned by `__tests__/rowSelection.unit.ts`.
- **Mixed → select all.** `resolveHeaderToggleTarget()` follows the checkbox cell type's Space rule
  (`changeSelectedCheckboxesState`). MUI deselects from mixed and its users asked for the opposite.
- **HiddenRows and TrimRows rows are out of every scope, Filters rows are not out of `'all'`.** The map
  names are read from the index mapper's collections: HiddenRows registers `'HiddenRows'` (its plugin
  name), TrimRows registers the literal `'trimRows'`. Pagination is a hiding map too, so "hidden" cannot
  be read from `rowIndexMapper.isHidden()` — that would make `'all'` and `'filtered'` mean "this page".
  `__tests__/rowSelection.unit.ts` catches a wrong map name. The same rule holds for a Shift+click range
  and a range toggled with Space (`#createScopeFilter()`, reading the same two maps by name): a range
  drawn over a hidden row lists it, and it must not be selected. A range DOES take the rows of the
  pages between its two ends: the user picked both ends, so the rows in between are what they asked for
  (pinned by "should select the rows of other pages that a Shift+click range spans").
- **The map changes outside the plugin.** IndexMapper splices it on row insert and remove, and UndoRedo
  restores a removed row's flag. That is why the header state is a cache dropped from the map's own
  `change` local hook and from the mapper's `cacheUpdated`, not a counter the plugin keeps by hand.
- **Writes run under `operationScope.suppress()`.** The selection is UI state, like the cell
  selection: undo and redo do not replay it. Measured: a plain write records no step today either, so
  the suppression is a guard, not a fix — keep it.
- **`updatePlugin()` carries the selection over.** `disablePlugin()` unregisters the map, so the
  values are copied before and written back after. A wrapper re-sending unchanged settings would
  otherwise clear the selection on every render.
- **`updateData()` keeps the selection, `loadData()` clears it.** `loadData()` re-creates the map;
  `updateData()` (and `updateSettings({ data })`, which every wrapper sends a new `data` prop through)
  only `fitToLength()`s it, so the flags stay on the same physical rows. That is deliberate: clearing it
  there wiped the selection on every edit of an app that replaces its data array immutably. The class
  JSDoc and the guide document it. Pinned by `__tests__/rowSelection.unit.ts`.
- **`disablePlugin()` removes the header checkbox from the DOM** (`#removeHeaderCheckboxes()`). Core's
  `appendColHeader()` reuses a header's `.relative` container and only refreshes `.colHeader`, and a
  disabled plugin runs no `afterGetColHeader`, so a `firstColumn` or corner checkbox stayed in the header
  with no listener behind it.
- **Every Space shortcut requires `canAccessCellContent()`** (both here and in `CheckboxHeader`). In bound
  mode Space writes data, and the header stays focusable under the `emptyDataState` loading overlay.
- **`afterRenderer` runs for every painted cell**, so the resolved settings are cached
  (`#settings`, re-resolved on enable). Do not call `#resolveSettings()` on the render path.
- **Under `renderMode: 'onChange'` a cell is repainted only when marked.** The selected-row class is
  state of this plugin's own, so every change calls `markAllCellsChanged()` before `render()`. A user
  edit of the bound column renders BEFORE `afterChange` (`core.ts`, `beforeChangeRender` → `render()` →
  `afterChange`), so the marking happens in `#onBeforeChangeRender`, or the tint lagged one edit behind.
- **A press on a checkbox is handled on `mousedown`, and the `click` is cancelled.** The state is
  applied and rendered on `mousedown`; the browser's own toggle on `click` would then flip it back, so
  `#onRootClick` prevents it. The `mousedown` itself sets `isImmediatePropagationEnabled = false` (the
  CollapsibleColumns pattern, not `stopImmediatePropagation()` — DEV-214) and `preventDefault()`, which
  keeps the browser focus off the input so the keyboard stays with the grid.
- **`headerCheckbox: false` and `'singleRow'` turn the corner off completely** (`#hasHeaderCheckbox()`).
  No checkbox, no `htRowSelectionHeader` class (the pointer cursor and the hit area key on it), no
  toggle on a press or on Space, and the press is not swallowed, so the corner selects the grid as a
  plain corner does. The mousedown handler checks the state too, not only the classes: the DOM can be one
  render behind an `updateSettings()`.
- **A row with no visible checkbox is a plain row header.** `checkboxes` returning `false` and
  `hideDisabledCheckboxes` both give `#getRowCheckboxState()` `hidden: true`. In the row header the cell
  gets no checkbox and no `htRowSelectionCell` (so no pointer cursor and no hit area; the width is fixed
  by `modifyRowHeaderWidth`, so nothing shifts). In the first column a hidden, disabled placeholder
  (`htRowSelectionCheckboxHidden`, `visibility: hidden` in the SCSS) keeps the values aligned across
  rows, and a press on it toggles nothing. Space on such a row's header does nothing; Space on its data
  cell still toggles a selectable row (`checkboxes` hides the control, it does not make the row
  unselectable).
- **The Shift+click anchor moves only when the change happens.** A vetoed toggle used to move it, and
  the next Shift+click then started a range from a row the user never selected.
- **Taps arrive with the deferred `touchstart`.** Walkontable calls `onMouseDown` with it on `touchend`
  (`3rdparty/walkontable/src/event.ts`), and a `TouchEvent` has no `button`, so both mouse handlers accept
  `isLeftClick(event) || isTouchEvent(event)`. A bare `button !== 0` check made every tap a no-op on iPad.
  The unit test calls the hook with a `TouchEvent`; `tests/e2e/row-selection.spec.ts` ("on a touch screen")
  taps for real.
- **Space on a checkbox must be marked handled.** Both Space shortcuts set
  `isImmediatePropagationEnabled = false` on the event. With `checkboxLocation: 'firstColumn'` the
  checkbox sits in a data cell, and the editor manager opens the cell editor on any printable key the
  shortcut leaves unmarked: Space toggled the row and opened the editor. Pinned by
  `__tests__/rowSelection.unit.ts` and the "Space on a first column checkbox" Playwright test.
- **A bound cell's meta can depend on other columns.** In bound mode a read-only (or non-checkbox)
  bound cell is not selectable, and `cells`/`columns` functions or `beforeGetCellMeta`/`afterGetCellMeta`
  listeners can derive that from any value of the row. `#affectsSelectionState()` therefore drops the
  "select all" cache on every edit while one of those exists (`#boundMetaMayReadData()`), and
  `afterSetCellMeta`/`afterRemoveCellMeta` drop it in bound mode, and so do `beforeUndo`/`afterUndo`/
  `beforeRedo`/`afterRedo`: UndoRedo restores cell meta through the meta manager, which fires no
  `afterSetCellMeta` (an undone Read only menu item kept the old total). Without them an edit of another
  column left the header total stale and a header press acted on it. Pinned by
  `__tests__/boundColumn.unit.ts`.
- **The rendering hooks share one `RowChecks` per draw** (`#getDrawRowChecks()`). Scroll draws run no
  render hook, so the shared checks live until the end of the task (`queueMicrotask`) and are dropped
  sooner on `beforeRender`, in `#applyChange()` / `#replaceServerSelection()` once a change passes the
  veto, and wherever the header summary is invalidated (data, settings, row indexes). The public API
  (`isRowSelected()` and the rest) always builds fresh checks. A new path that changes what the checks
  read must drop them too, or a draw in the same task paints the old state.
- **A tap must not leave the input focused.** Walkontable drops the browser's own `mousedown` that follows
  a tap, so the hook's `preventDefault()` never reaches it and its default action focuses the input. The
  next tap on the same input then hits Walkontable's "press on the focused element" guard and does
  nothing. `#onRootMouseDown` cancels every `mousedown` on the plugin's checkbox at the root element.
  Pinned by the "second tap on the same checkbox" Playwright test.
- **Switching to `'singleRow'` reduces the selection to one row** (`#reduceToSingleRow()`, run from
  `updatePlugin()`): the anchor when it is selected, else the last selected row in visual order. With a
  server-backed grid and no selected row loaded it keeps the row id toggled last (`Set` insertion order)
  and clears a "select all". A bound column is left alone: its values are the user's data.
- **A parent is removed only when every row under it is selected** (`#getRemovableRows()`). With
  `'descendants'` a parent counts as selected once its SELECTABLE leaves are, but `alter('remove_row')` on
  a parent takes its whole subtree, which would delete a leaf `isRowSelectable` rejects. Such a parent
  stays, and its selected rows are removed one by one.
- **`firstColumn` on a checkbox column is a configuration mistake, warned once** (`#warnIfFirstColumnIsCheckboxColumn()`):
  each cell shows two checkboxes and Space toggles the row, not the value. `CheckboxHeader` steps aside for
  that header as it does for the bound column, so it shows only "select all".
- **The remove menu item counts what the action removes** (`#countRemovableRows()`): the selected rows
  with a visual index, `0` (and disabled) when rows cannot be removed or a server-side "select all" is
  active. `getSelectedCount()` would count filtered-out rows and rows on other pages, which stay.
- **A header with no label gets `htRowSelectionCheckboxOnly`** (the corner always; a column header whose
  label is empty, such as a column made only for the checkboxes in the `firstColumn` location). The CSS hides
  its label and centers the checkbox on both axes; an empty label would still take the room next to it.
- **The corner gets its own class (`htRowSelectionCorner`).** Core adds `cornerHeader` to a header label
  that renders a negative column and never removes it, so a header cell reused from the corner (switching
  `checkboxLocation`) keeps it. A CSS rule keyed on `cornerHeader` hid the first column's label. Pinned by
  the "keeps the first column label after switching" case in `tests/e2e/row-selection.spec.ts`.
- **Space on a data cell toggles its row (as in AG Grid), and must mark the event handled.** The editor
  manager opens an editor on any printable key in `afterDocumentKeyDown` unless
  `isImmediatePropagationStopped(event)`, and a shortcut returning `false` does not set that. Without the
  flag the first Space toggled the row AND opened the editor with a space typed, and the next Space went
  into the editor. A checkbox cell keeps its own Space (`#isHighlightOnDataCell()` skips checkbox cells
  and the plugin's own checkbox column). Shift+Space and Ctrl+Space keep selecting cells.
- **User-driven changes are announced** through `utils/a11yAnnouncer.ts` (`#notifyChange()`, which also
  runs `afterRowSelectionChange`): one row by number, more by the count in the "select all" scope. `'api'`
  and `'dataChange'` sources are silent, so a program or a paste does not chatter.
- **The corner's container must fill the header cell.** With its label hidden, the corner's `.relative`
  flex container shrank to the checkbox and sat at the top of the cell (4px above center on `main`), and
  the checkbox rule's `margin-top: -2px` lifted it further. `_row-selection.scss` sets `height: 100%` on
  the corner container and `margin-block: 0` on header checkboxes. Pinned by the "centers the select all
  checkbox vertically" case in `tests/e2e/row-selection.spec.ts`, on all three themes.
- **The row header column is pushed last** in `afterGetRowHeaderRenderers`, next to the data, and its
  column coordinate is `#rowHeaderRendererIndex - view.getRowHeadersCount()` (`-1` unless a plugin
  enabled after this one adds a column). The corner above it gets the same coordinate in
  `afterGetColHeader`. Do not hard-code `-1`.
- **NestedRows: `groupSelects` decides the tree's rules** (`#resolveGroupSelects()`), and a wrong guess about
  it breaks the parent's state. With `'descendants'` (the default) **only the leaves store a selection**: a
  parent's checked / mixed / unchecked state and whether it can be selected are computed from the leaves
  under it (`#computeGroupTree()`, one recursive pass over `dataManager.getData()`, cached in `#groupTree` and
  dropped wherever `#headerSummaryCache` is). A parent written into the map would be a second source of
  truth, so `#applyChange()` and `#getRowsInScope()` replace every parent with its leaves first
  (`#expandGroupsToLeaves()`: a parent's descendants are the physical rows right after it, `countChildren()`
  long). That also counts the leaves of a collapsed parent, which NestedRows trims. Consequences: the hooks
  and the "select all" count list leaves; `getSelectedRows()` lists checked parents too, `getSelectedCount()`
  does not; `isRowSelectable` rejecting a parent makes its whole subtree unselectable. `'singleRow'` and a
  bound column cannot express a mixed parent, so both fall back to `'self'`. `'topLevel'` keeps the
  level-0-only rule. Filters under NestedRows splices `__children` (see `../nestedRows/AGENTS.md`), so a
  filtered-out row is gone from the tree, not trimmed. Pinned by `__tests__/nestedRows.unit.ts`.

## A checkbox column as the selection (`checkboxLocation: { column }`)

`getBoundColumn()` resolves the column (a `data` prop through `propToCol()`, or a physical index through
`toVisualColumn()`); a column that is not `type: 'checkbox'` warns once and falls back to the row header
location. While bound, the selection IS the column's values:

- **Reads go to the data** (`#isPhysicalRowSelected()` → `isCheckedValue()` from
  `../../utils/checkboxColumn.ts`, the checkbox renderer's own test). The index map stays registered but
  is not read. The cell meta comes from `getCheckboxCellMeta()`, resolved by the physical row, so a row
  the filters removed keeps its own `readOnly` (a `cells` callback, `setCellMeta()`), not the column's.
- **The resolved bound column is cached** (`#boundColumnCache`): the render path asks for it several
  times per painted cell, and each resolution is a `propToCol()` plus a column meta read. It is dropped
  on enable/disable, `afterUpdateSettings`, `afterLoadData`, and the column index mapper's
  `cacheUpdated` (insert, remove, move, hide). A `setCellMeta()` that changes the column's `type` is not
  watched: call `updateSettings()` after it.
- **Writes go through `writeCheckboxColumn()` inside `runOperation()`**, with the source
  `'RowSelection.change'`: one undo step, and a server-backed grid saves it like any edit. The row-id
  model is off (`#isServerMode()` answers `false`): the data already persists the selection.
- **`afterRowSelectionChange` reports what the write really changed** (`#writeBoundColumn()`). The
  write can be cancelled or nulled by a `beforeChange` listener, or rejected by a validator under
  `allowInvalid: false`, so the rows come from the write's own `afterChange` (collected while
  `#boundWrite.open`), plus the filtered-out rows (written through `setSourceDataAtCell()`, which fires
  no `afterChange`) read back from the data. A write an asynchronous validator holds lands after the
  call returned `false`; its `afterChange` reports it then, with the source of the call that started it.
- **Edits from elsewhere reach the selection hooks** through `beforeChange`/`afterChange`
  (`#collectBoundFlips()`), mapped to the `'checkbox'` source for `'edit'` and `'dataChange'` for the rest.
  `beforeRowSelectionChange` returning `false` nulls every flipping change of that batch. The plugin's own
  source is skipped there, or its writes would be reported twice.
- **`setSourceDataAtCell()` fires neither of those**, so bound mode also listens to
  `afterSetSourceDataAtCell` (physical rows; added only in bound mode, because any listener makes core read
  every source write's old value). UndoRedo restores data through that method, so an undo of a bound
  selection change is reported as `'dataChange'` too. It cannot be vetoed: the value is already written.
  UndoRedo then repeats the visible restored cells in an `afterChange` with the same source, so
  `#onAfterChange()` skips `isUndoRedoSource()` (`../../utils/undoRedoSource.ts`), or every undo and redo
  was reported twice.
  The plugin's own source is skipped here as well: `writeCheckboxColumn()` writes filtered-out rows
  through `setSourceDataAtCell()`.
- **The header cache must drop on `beforeChangeRender`**, not only `afterChange`: an edit renders before
  `afterChange` runs, and the header would stay one change behind (measured in the Playwright spec). It
  drops only when the edit writes the bound column or `isRowSelectable` is set (it may read any value):
  an edit of any other column used to force a full rescan of every row on the next corner render.
- **One checkbox per cell.** `afterRenderer` injects nothing in the bound column, the Space shortcut stands
  aside for its cells (the checkbox cell type's own Space writes them), `enableClickSelection` ignores it,
  and the `CheckboxHeader` plugin (`../checkboxHeader/`) skips its header, which this plugin renders.
- A read-only or non-checkbox cell in the column cannot be selected.
- **An edit that would check a row `isRowSelectable` rejects is cancelled** in `#onBeforeChange()` (the
  change is nulled, as a vetoed one is), so a click on the cell and `selectRows()` agree. Unchecking is
  allowed, and a read-only cell is deliberately not part of this rule: the user cannot edit it, and an API
  write to it is a write to the data.
- **The fallback is real.** A `{ column }` that does not resolve to a checkbox column warns and draws the
  checkboxes in the row header (`#isRowHeaderLocation()`); every check for the row header location goes
  through that helper, never `checkboxLocation === 'rowHeader'`, or the fallback draws nothing.

## A server-backed grid (DataProvider)

Every page change is a `loadData()`, which re-creates the physical map with every row unselected. So
with DataProvider (`#isServerMode()`: the plugin is enabled and `hasExternalDataSource` answers `true`)
the selection lives in `rowIdSelection.ts`, keyed by `dataProvider.rowId`, and the physical map is only
a projection of it for the loaded page:

- **`#hydrateFromRowIds()` runs after every load** (`afterLoadData`/`afterUpdateData`) and after
  `updatePlugin()`. It writes the map silently and fires no selection hook: the selection did not change,
  only the rows in view.
- **"Select all" is an exclusion model** (`{ selectAll, toggledRowIds }`, AG Grid's server-side
  selection state). In the `'all'` and `'filtered'` scopes (`#isServerWideScope()`) a header click, a
  `selectAll()`, and a `deselectAll()` replace the whole model through `#replaceServerSelection()`; the
  server already filtered the rows, so the two scopes mean the same there. `'currentPage'` keeps the
  per-row path and records each row id explicitly.
- **Every per-row change goes through `#applyChange()`, which mirrors it into the model**
  (`#recordRowIds()`). A path that writes the map without it loses the change at the next page load.
- **`singleRow` mode and a plain click with `enableClickSelection` go through `#selectOnly()`**, which
  replaces the model: deselecting "the other rows" from the map alone would leave rows on other pages
  selected.
- **The header counts against `totalRows` from `afterDataProviderFetch`**, not the loaded rows. Under
  "select all" the count assumes every toggled id still matches the query, and `isRowSelectable` is
  only ever asked about loaded rows, so a rejected row on another page is counted. The guide documents
  both; the server has to apply the same rule.
- **The hooks list only loaded rows** (physical indexes). Rows on other pages have no index. So a
  change that moves only rows on other pages (a "select all" while the loaded page is already selected)
  runs both hooks with two EMPTY lists: the selection did change, `getSelectedCount()` and
  `getServerSelection()` moved, and `beforeRowSelectionChange` must still be able to veto it. Skipping the
  hooks there would leave an application's "N selected" counter stale. The one real no-op — every row
  matching the query is loaded (`totalRows` ≤ loaded rows), so nothing else exists — adopts the new model
  without hooks and returns `false` (`#replaceServerSelection()`); the model is still adopted because the
  "select all" state counts the rows `isRowSelectable` rejects, and the header would otherwise stay mixed
  on every click.
- **Removed rows are forgotten** (`#onAfterRowsMutation()`, `RowIdSelection#forget()`). DataProvider
  cancels the `alter()` and removes on the server; `afterRowsMutation('remove', { rowsRemove })` runs
  after a successful `onRowsRemove` and before the refetch. Without it the removed ids stayed in the
  model: counted, shown as mixed, named in the menu, and exported by `getServerSelection()`.
- **`disablePlugin()` resets the model and `totalRows`**, so re-enabling does not bring back a server
  selection the grid no longer shows; `updatePlugin()` carries both (and the anchor) over by hand.
- `getServerSelection()`/`setServerSelection()` return `null`/`false` without a server-backed grid.
- **The model and `totalRows` belong to the dataset, and the sheets bar swaps them per sheet**, through the
  `@private` `_exportViewState()`/`_importViewState()` (the view state's `checkedRows` part). Server-backed sheets
  each have their own DataProvider, and the ids of one are meaningless on another: with one model for the
  grid, the ids checked on one sheet showed as checked on the next and `removeSelectedRows()` sent them to its
  `onRowsRemove`. `_importViewState()` runs no selection hook and announces nothing, unlike
  `setServerSelection()`. It also restores the checked physical rows of a grid that holds its own rows, which
  `loadData()` clears, and leaves a bound checkbox column alone: the data holds that selection.

## Known gaps

- **The selected-row color is the `rowSelectionBackgroundColor` token** (`--ht-row-selection-background-color`),
  a semi-transparent accent per theme. In Figma it is `component/rows/row-selection-background-color` in
  the `themes` collection, aliasing `<theme>/custom/row-selection` in the `mode` collection (light/dark
  RGBA). The key is in `scripts/themes/figma/tokensKeys.mjs`, so `generate:themes-static` keeps it.
- **The `:indeterminate` dash icon** (`collapseOff`) matches the Figma checkbox component (node 13:1313,
  "Selection=Indeterminate"). It lives in the generator (`scripts/themes/figma/utils/helpers/iconsMap.mjs`
  and `templates/iconsMap.ts`, which `__tests__/iconsMap.test.mjs` keeps identical) and in the generated
  `src/themes/static/` files.
- **A server-side "select all" follows the query.** Changing the filters afterward changes which rows
  "all" means; the guide tells integrators to send the query with the selection.
- **`checkboxLocation: 'firstColumn'` widens the first column only when AutoColumnSize sized it**
  (`#onModifyColWidth` compares against `autoColumnSize.getColumnWidth()`); a user width is left alone,
  so the checkbox can then crowd the value.

## Where to look next

- Scope rules and the header state: `../../utils/rowScope.ts` (pure, no Handsontable instance).
- The DOM-injection patterns it copies: `../dropdownMenu/` (`afterGetColHeader`),
  `../collapsibleColumns/AGENTS.md` (blocking the header press).
- Hiding vs trimming maps: `../hiddenRows/AGENTS.md`, `../pagination/AGENTS.md`.
- Undo/redo and index maps: `../undoRedo/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=rowSelection` —
  `../../utils/__tests__/rowScope.unit.ts` (the scope rules), `__tests__/rowIdSelection.unit.ts` (the exclusion model),
  `__tests__/rowSelection.unit.ts` (the API in a jsdom grid with Filters, HiddenRows, TrimRows,
  Pagination, ColumnSorting, UndoRedo, and NestedRows), `__tests__/nestedRows.unit.ts` (`groupSelects` on a
  three-level tree), and `__tests__/dataProvider.unit.ts` (a grid
  backed by an in-memory server, 10 rows per page; it waits for `afterDataProviderFetch` and for
  `fetchData()`'s own promise, never for a count of microtask hops). The DataProvider suite logs jsdom
  `Could not parse CSS stylesheet` errors from the theme engine; they are not this plugin's (same count
  without its token).
- E2E: `cd tests && npx playwright test e2e/row-selection.spec.ts` (fixture
  `tests/fixtures/demo/row-selection.html` and `row-selection-data-provider.html`, page object
  `RowSelectionPage`). It reads stylesheet rules,
  so rebuild the full package first (see `tests/AGENTS.md`).
