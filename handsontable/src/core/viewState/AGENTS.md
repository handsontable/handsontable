# View state (core)

Capture and restore of the grid's runtime view: row and column order, sort, filters, hidden and
trimmed indexes, collapsed NestedRows parents, manual sizes, frozen counts, pagination, selection,
and scroll. Two callers share it:

- `viewState.ts` is the engine. SheetsBar uses it on every sheet switch, with no part filter, so
  every step runs (merges, custom borders, and the lazily served cell meta included). It is not
  public; `ViewState` is published only as the type `SheetsBarViewState`.
- `gridViewState.ts` is the public layer behind `Core#getViewState()` and `Core#setViewState()`.
  It turns the internal state into the versioned, JSON-safe `GridViewState` and back.
- `withoutUndoEntry.ts` runs an operation with UndoRedo ignoring new actions. Both callers use it.

## The public layer

- **Missing means "leave it alone", not "reset".** Internally an empty or missing part is the
  neutral value: `hiddenRows: []` un-hides everything and a missing frozen count unfreezes. The
  public restore therefore starts from a fresh `captureViewState()` of the live grid, writes the
  parts the object carries over it, and passes `restoreViewState()`/`restoreViewport()` the set of
  those parts. Every step outside the set is skipped. Never call the restore without the set from
  the public path: the merges and custom borders it would re-apply were captured under the grid's
  current row order, and a restored order moves them onto other rows.
- **Live selection objects never cross JSON.** `SelectionState` holds `CellRange`/`CellCoords`
  instances, and the restore calls `isValid()`, `clone()` and `includes()` on them. The public form
  stores `[row, col]` tuples, and `deserializeSelection()` rebuilds the objects through
  `hot._createCellCoords()` and `hot._createCellRange()`. The unit suite's selection round trips go
  red when that rehydration is skipped. `selection: null` means "nothing selected" and deselects.
- **The viewport step holds the rendering only, never the index cache.** `restoreViewport()` puts the
  Pagination page back, and Pagination counts its pages from the index cache: inside `safeBatch()`
  (which also calls `suspendExecution()`) `setPage(3)` was clamped to a stale count and landed on
  page 1. SheetsBar's `#batchRender` holds the rendering only for the same reason. Pinned by the
  pagination case of `tests/e2e/view-state-api.spec.ts`; the jsdom unit case cannot see it.
- **A part is skipped, never thrown on.** A disabled plugin (`pluginDisabled`), a `dataProvider`
  grid for sort, filters and pagination (`externalDataSource`, those would fetch), a stored order
  whose length no longer matches (`sizeMismatch`, reported by `restoreViewState()`), a selection that
  does not fit (`outOfRange`), and a value of the wrong shape (`invalid`) are all reported in
  `skipped`. Another `version` applies nothing and warns. A new part needs a validator in
  `writePart()`: a state may come from an LLM or a URL, and a malformed value must not reach a
  plugin API that throws.
- **Validate against the grid, not only the shape.** A value that passes a type check can still
  break a plugin: the Filters import throws on an operation or condition name that is not registered
  on the page (`registeredOperations`/`registeredConditions`) and on two entries for one column with
  different operations, after it has already emptied the live conditions; a sort the plugin rejects
  (a column past `countCols()`, a duplicate, more than one column without MultiColumnSorting) leaves
  the grid unsorted, because the restore clears the sort first; and `setIndexesSequence()` stores any
  array, so a row order that is not a permutation of `0..n-1` shows one record twice and hides
  another. `writePart()` rejects all of those as `invalid` before anything is applied, and
  `writeOrder()` reports another length as `sizeMismatch`. The `it.each` table in
  `gridViewState.unit.js` holds one case per rule.
- **The public sort carries no pre-sort order.** The sorting plugin builds its pre-sort cache on its
  first sort and keeps it until it is disabled, so an order handed to it later is overwritten on a
  grid that has sorted before. The restore hands it the current order, and `rowOrder` restores the
  exact sequence when the state carries it.
- **The restore records no undo step, and keeps the earlier ones.** Unlike a sheet switch there is
  no `loadData()` to empty the stacks, so a later undo of an older sort or filter step acts on the
  restored view. `Core#setViewState`'s JSDoc says so; recording the restore as one step is a possible
  follow-up.
- **A hidden row without a visual index goes through `HiddenRows#_replaceHiddenRows()`.** The plugin's
  visual `showRows()`/`hideRows()` reject a whole list when one row in it has no visual index, which is
  the case for every row a filter, TrimRows, or a collapsed NestedRows parent trims. The `@private`
  physical method takes the full set, runs the hiding hooks, and applies nothing when a
  `beforeUnhideRows` or `beforeHideRows` listener returns `false`, so the plugin keeps its own map and
  its veto. Core must never write into the plugin's hiding map itself. Before, a live-grid restore could
  not show a trimmed hidden row, and a row the state hid while it was trimmed came back visible once the
  trim lifted (the same held for a sheet switch whose arriving sheet filters a hidden row out).
- **The filter validation lives in the Filters plugin.** `Filters#_findInvalidConditions()` checks the
  columns, the operation, the condition names and the arguments, and answers with the path and the reason of
  the first problem, which the public layer turns into the skipped entry's `path` and `message` (binding a condition runs its input
  decorator, which throws on arguments of the wrong shape). Core must not import the condition
  registries: that would pull Filters internals into every build, `handsontable/base` included.
- **Frozen rows skip a paginated grid.** The restore writes the frozen counts onto the table meta, which
  skips the Pagination conflict `updateSettings()` raises for `fixedRowsTop`/`fixedRowsBottom`, so the
  public layer reports the part as `pluginConflict` instead of leaving both on.
- **A row order without a sort clears the sort.** The sort indicator and `getSortConfig()` would
  otherwise describe an order the rows no longer have.
- **The public restore starts from `createNeutralViewState()`, not a capture.** The engine reads only the
  fields of the parts it was given, so capturing the live view first only cost a scan of the filters,
  borders, merges and sizes. The view batch runs only when a part outside pagination, selection and
  scroll is in the request, and the viewport batch only for those three.
- **Undo is suppressed twice by default, and not at all with `undo: 'record'`.** `withoutUndoEntry()`
  wraps the call in core's `operationScope.suppress()`, which also keeps a held continuation (a validator's
  answer that settles later) unrecorded, and sets UndoRedo's `ignoreNewActions` flag, which covers the
  actions the plugin registers from `beforeColumnSort` and `beforeFilter`. With `undo: 'record'` the whole
  apply runs inside one `operationScope.run('view_state', 'setViewState', ...)`: the plugin mutators it
  calls join that transaction, and UndoRedo records one step from the index-map snapshots, the plugin
  states and the settings it already captures (sort states, hidden and trimmed maps, sizes, frozen
  counts, Filters, Pagination, NestedRows). Selection and scroll are not part of a step. The unit suite
  undoes and redoes a state that carries every part; add a part there before relying on it.
- **A skipped entry is `{ part, reason, path, message }`, and the whole check runs before any write.**
  `planRestore()` reads every part into the neutral internal state and collects the failures; nothing
  on the grid changes until it is done. That is what `validateViewState()` returns, what `atomic` tests,
  and why a filter the plugin cannot import never reaches `importConditions()`. A check that can only
  be made while applying (the selection's fit is the one that used to be) belongs in `planRestore()`, or
  `atomic` stops being atomic. The result's `error` is for a state rejected as a whole
  (`notAnObject`, `unsupportedVersion`, `atomicRejected`); a missing or non-object state is an error,
  never an empty success.
- **`previous` is read after the check and before the apply**, only for the parts being applied
  (`captureViewState(hot, [], parts)` skips the scans of the parts it was not asked for), in the same
  public shape, so `setViewState(previous)` reverts. Parts the state names but the grid skipped are not in it.
- **The NestedRows collapse is replaced, not merged.** `restoreCollapsedParents()` expands every
  parent collapsed now before it collapses the stored ones. On a sheet switch nothing is collapsed
  by then (`loadData()` drops it), so that step is a no-op there.

## The engine

- **Order is load-bearing** in `restoreViewState()`:
  the column order goes before the sort re-apply (the sort config addresses its column
  visually), sort is cleared and re-applied around the row order (the sorting plugin resets
  rows to its own pre-sort cache on every `sort()`), filters and trimming re-apply before the
  hidden sets (hidden indexes are stored as physical, and so are the tracked cell-meta
  entries), and the selection and scroll run through `restoreViewport()` **after** the render
  batch, once the arriving sheet is painted at its own sizes. `restoreViewport()` puts the
  Pagination page and page size back first (`setPageSize()` then `setPage()`, each skipped when
  unchanged, the page clamped to the arriving count first): Pagination holds one page for the
  whole grid and clamps it on every load, so a switch through a shorter sheet moves it, and a
  selection or scroll aimed at a row on another page lands on a hidden row and does nothing. A
  never-visited sheet gets `resetViewport()` instead — the configured `initialPage` and
  `pageSize`. Both go through the public API, so the page hooks fire on a switch that changes
  the page. With an external data source (`hasExternalDataSource`) the page is neither captured
  nor restored: DataProvider answers a page change with a fetch, and the result would load into
  whichever sheet is active when it resolves. After that batch `keepSelectionOnPage()` checks the
  focus against the shown page — a `'auto'` page size decides its boundaries from the row heights
  of that paint, a `beforePageSizeChange` veto leaves the page counted in the old size, and a
  `beforePageChange` veto keeps the clamped page. A restored selection is followed to its page —
  one `setPage()` to the estimated page (the number page size as the page length, the shown
  span for `'auto'`), so a gap of many pages fires the page hooks once, then a one-page walk.
  Never re-estimate from each page reached: a short last page or `'auto'` pages of other
  lengths make repeated estimates bounce past the row; a selection that was not restored (one
  a plugin or a listener made during the switch), or one the follow could not reach, is
  deselected rather than left on a hidden row.
  The selection itself is kept twice: `selection` (`getSelected()`) and `selectionState`, a copy
  of `Selection#exportSelection()` (the active range is cloned — the export hands it out live —
  and so are the ranges handed to the import, or the stored state would become the live
  selection). A selection made from a header or spanning a whole axis (any header or
  extent-spans flag in `selectionState`) cannot be judged from its coordinates: `selectCells()`
  rejects a range that contains headers (beyond a single header, even with `navigableHeaders`),
  while a whole column on page 2 or later has none — Pagination moves its start to the page's
  first row — so `selectCells()` would accept it and drop the header and span flags. Such a
  selection is replayed instead: one layer through `selectRows()`/`selectColumns()`/`selectAll()`,
  which run the selection hooks and set the `ht__selection--rows`/`--columns` classes; several
  layers through `importSelection()`, followed by one `setRangeEnd()` + `finish()` on the last
  layer, the step core answers with those classes and hooks — and since that step makes the last
  layer active, a `setRangeFocus()` after it puts the captured focus and active layer back. A
  plain cell selection goes through
  `selectCells()` and gets its focus and active layer back with `setRangeFocus()`. A stored
  order whose length no longer matches the data is skipped. Stored trimmed rows at or past `countSourceRows()` —
  read after the arriving sheet's `loadData()`, so rows padded by `minRows`/`minSpareRows`
  count — are dropped one by one before `trimRows()`, which rejects the whole list when any
  index is out of range. Like the hidden sets and manual sizes, the kept ones follow physical
  position, not the record, after the host changed the sheet's data while it was away.
  Manual sizes are stored as sparse `[physicalIndex, size]` pairs read and written through the
  resize plugins' `getManualSizes()`/`setManualSizes()` (physical, so a trimmed row keeps its
  height) and cleared through their bulk `clearManualSizes()`. NestedRows drops its collapsed parents on
  every `loadData()`, so the view state carries them as tree paths (`collapsedParents`, via the
  data manager's `getRowTreePath()`/`getRowIndexByTreePath()` — a physical index shifts when the
  sheet's data gains a row while it is away) and replays them after the hidden sets, with hooks
  off (DEV-3042). Before the hidden sets, the collapse would trim a hidden child out of the
  visual space its stored index is mapped through. For the same reason the hidden rows are
  captured physically off the plugin's hiding map (`hidingMapsCollection.get(pluginName)` –
  the map is registered under the upper-cased `HiddenRows`, not `hiddenRows`), not through
  `getHiddenRows()`: a hidden child of a collapsed parent has no visual index at capture time.

Tests: `__tests__/viewState.unit.js` (the engine), `__tests__/gridViewState.unit.js` (the public
API, JSON round trips per part), `tests/e2e/view-state-api.spec.ts` (scroll, header selection,
pagination), plus SheetsBar's own suites.
