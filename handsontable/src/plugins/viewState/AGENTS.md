# ViewState plugin – a versioned, JSON-safe view state

The plugin behind `getPlugin('viewState').getViewState()`, `.setViewState()` and `.validateViewState()`.
It covers `viewState.ts` (the class), `gridViewState.ts` (the conversion, the checks and the restore
orchestration) and the engine it drives, `../../utils/viewState/viewState.ts`. Read this before touching
any of them.

## What it owns and what it does not

- It owns the public shape (`GridViewState`), its version, the checks that decide whether a part can be
  applied, and the result (`applied`, `skipped`, `previous`, `error`). It owns none of the restore steps:
  those are the engine's, `utils/viewState/AGENTS.md`.
- It has **no setting and no state**. `isEnabled()` returns `true`, as `ExportFile` does, so the plugin is on
  whenever its module is registered and `updateSettings()` never touches it. That is also why it adds nothing
  to `metaSchema.ts`, `GridSettings` or the wrappers.
- **Core must not import it, and neither may anything core imports.** The first version put the methods on
  `Core`: every `handsontable/base` build then carried the engine and the public layer, +19 KB minified and
  +6 KB gzip (measured by bundling `tmp/base.mjs` with and without them). As a plugin it costs a build only
  when it is registered. Do not move the methods back for convenience.
- It reaches other plugins only through `getPlugin()` and their `@private` methods
  (`Filters#_findInvalidConditions()`, `HiddenRows#_replaceHiddenRows()`), never their internals.
- No priority ordering matters: it registers no hook and keeps no state, so `enablePlugin()` has nothing to
  order. `PLUGIN_PRIORITY` is 920, in the `900`+ band with the other plugins that look at everyone else's
  state, and it must stay unique in the table.

## The traps

- **Missing means "leave it alone", not "reset".** Internally an empty or missing part is the
  neutral value: `hiddenRows: []` un-hides everything and a missing frozen count unfreezes. The
  public restore therefore starts from the neutral state, writes the parts the object carries over it,
  and passes `restoreViewState()`/`restoreViewport()` the set of those parts. Every step outside the set is skipped. Never call the restore without the set from
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
  grid for the sort, filters and pagination, which would fetch, and for the row order, the hidden, trimmed and
  collapsed rows, the row heights and the selection, which are positions in the page the grid has loaded and
  would land on other records on another page (`externalDataSource`), a stored order
  whose length no longer matches (`sizeMismatch`, found by `writeOrder()` in `planRestore()`; the engine's own
  length check, which `applyParts()` still reports, is only a net for a hook that changes the count mid-restore),
  a hidden or trimmed index, a size or a scroll position past the end of its axis, or a selection that
  does not fit (`outOfRange`), and a value of the wrong shape (`invalid`) are all reported in
  `skipped`. Another `version` applies nothing and warns, and a key that is not a part is reported `invalid`
  under its own name (an LLM or a URL misspells keys, and a silent ignore reads as success). A new part needs a validator in
  `writePart()`: a state may come from an LLM or a URL, and a malformed value must not reach a
  plugin API that throws.
- **Validate against the grid, not only the shape.** A value that passes a type check can still
  break a plugin: the Filters import throws on an operation or condition name that is not registered
  on the page and on two entries for one column with
  different operations, after it has already emptied the live conditions; a sort the plugin rejects
  (a duplicate, more than one column without MultiColumnSorting, a column past `countCols()`) leaves
  the grid unsorted, because the restore clears the sort first; and `setIndexesSequence()` stores any
  array, so a row order that is not a permutation of `0..n-1` shows one record twice and hides
  another. `writePart()` rejects all of those before anything is applied (a sort column the grid does not show
  as `outOfRange`, the rest as `invalid`), and `writeOrder()` reports another length as `sizeMismatch`.
  `describeShownColumn()` bounds the sort, the filters and the hidden columns (not the widths) by the column's
  visual index against `countCols()`, the bound the sorting plugin checks, because `maxCols` and a trimming
  map lower it below the physical count, and the engine reaches the hiding plugin through visual indexes,
  where such a column was dropped without a word. `describeDuplicateColumn()` rejects one column named twice
  in `sort` or `columnWidths`, by its paths, so a message never shows an index the caller did not write. The `it.each` table in
  `viewState.unit.js` holds one case per rule.
- **One index space: an index that names a record or a column is physical, a position on screen is
  visual.** The sort, the filters, the hidden columns, the column widths and the orders are physical, so
  every part of one state addresses the same columns after a column move; the selection, the scroll and
  the frozen counts are visual. The sort used to be the one visual exception. It is physical in the
  engine too, which translates it right before each call into the sorting plugin (the stale-cache trap in
  `../../utils/viewState/AGENTS.md`), so `readPart()` and `writePart()` pass it through unchanged. Do not
  convert it here against `columnOrder`: the plugin translates against the cache from before the restore.
- **A column may be named by its property, on input only.** `resolveColumnKeys()` turns a string in
  `sort`, `filters`, `hiddenColumns` and `columnWidths` into the physical index of its column
  (`propToCol()`, then `toPhysicalColumn()`) before any other check, so the checks, the duplicate test
  and the Filters validation see indexes only. An unknown property is `invalid` at its own path
  (`propToCol()` hands it back unchanged); a property of a trimmed column is `outOfRange`, as the same
  column named by its index is (`propToCol()` answers `null`; not in `columnWidths`, see below), and so is a
  property a `columns` array declares past `maxCols` (`declaredColumnIndex()`, which returns the index or `-1`: the grid builds no such column, so `propToCol()` does not
  know it; `columnWidths` resolves such a property to its declared index instead, a trimmed column's included; a
  trimmed column on a grid without a `columns` array has no physical index to find by property, so it stays
  `outOfRange` there, as no public lookup answers for it). A string is always a
  property, `'2'` included.
- **The column widths skip the shown-column check on purpose.** `setManualSizes()` stores a width by physical
  index for every column the mapper has, so a width past `maxCols` or on a trimmed column restores, and
  `getViewState()` reports it. A shown-column check there made a captured state skip its own widths, and
  reject the whole state under `atomic`.
- **The shown-column check reads the order in force now, not the state's `columnOrder`.** A sort column the
  same state's order brings in under `maxCols` is reported `outOfRange`. Checking it against the planned order
  would pass it, and the sorting plugin would drop it: it reads the column cache from before the restore
  inside the batch (the stale-cache trap in `../../utils/viewState/AGENTS.md`), so visual column 0 sorts the
  column that was first before the restore. A fix needs the column cache refreshed before the sort. A property two columns share
  resolves to the last one, as `propToCol()` does. `getViewState()` and `previous` never emit properties:
  a `columns[].data` can be a function, a property can be shared, and array data has none. The row parts
  and `columnOrder` take integers only.
- **The public sort carries no pre-sort order.** The sorting plugin takes its pre-sort cache from the row
  order it finds whenever sort states go onto an unsorted grid (a `sort()` from empty states, or a
  `setSortConfig()` there once the cache exists). The restore clears a sort that is on first, so the plugin
  takes the current order, and `rowOrder` restores the exact sequence when the state carries it.
- **By default the restore records no undo step, and keeps the earlier ones.** Unlike a sheet switch there
  is no `loadData()` to empty the stacks, so a later undo of an older sort or filter step acts on the
  restored view. `ViewState#setViewState()`'s JSDoc says so, and `undo: 'record'` is the way out (below).
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
  decorator, which throws on arguments of the wrong shape). Whether the column offers each condition is
  `Filters#_findUnavailableConditions()`, asked after it, and it is the one problem that does NOT skip the
  part: `splitUnavailableFilters()` leaves those columns out and restores the rest, reporting each entry,
  and skips the part only when no column is left (an empty list would clear the grid's filters). So
  `filters` can be in `applied` and in `skipped` at once, which is why `applied` drops only the parts
  skipped WHILE applying. The check reads every row's type through the Filters scan, not
  `getAvailableConditions()` (that reads the untrimmed rows and refused states the menu produced; the
  filters `AGENTS.md` has the rule). Core must not import the condition
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
  second guard for a transaction that would open meanwhile (UndoRedo records from the operation journal,
  so `suppress()` is what carries the weight). With `undo: 'record'` the whole
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
  A `rowOrder` restored without a `sort` clears the sort, so `previous` carries the sort too; without it
  a revert would bring the rows back and leave the indicator and `getSortConfig()` empty.
- **`atomic` covers the checks made before the apply, and only those.** A step a listener vetoes
  (`beforeFilter`, `beforeHideRows`, `beforeColumnSort`) and a selection `restoreViewport()` cannot land are
  found while applying, so `applied` can name a part a listener stopped, and the selection skip is reported
  after the rest was written. Moving such a check into `planRestore()` is the only way to make it atomic.
- **A selection and a scroll row are measured after the row count changes.** `filters`, `trimmedRows` and
  `collapsedRows` change `countRows()`, so a view saved on the full grid has its selection at row 50 while a
  filter leaves 10 rows. With one of them in the state `planRestore()` skips the fit check
  (`deferRows`), and `applyParts()` measures the scroll row, and `restoreViewport()` the selection, once
  the rows are applied. The cost: those two are reported after the apply, so `atomic` does not cover them.
- **The sort is cleared only when one is on.** `sort([])` on a never-sorted grid makes the sorting plugin cache
  the order from before the restore, which a later sort and clear would bring back over the restored
  `rowOrder`; on a server grid it sends a fetch with an empty sort. `clearActiveSort()` checks both, and
  `previous` carries the sort only when there was one.
- **`getViewState()` reads only the parts the grid can give.** Passing the available parts to
  `captureViewState()` keeps a grid with merges and borders from paying for scans whose result is dropped.
- **The NestedRows collapse is replaced, not merged.** `restoreCollapsedParents()` expands every
  parent collapsed now before it collapses the stored ones. On a sheet switch nothing is collapsed
  by then (`loadData()` drops it), so that step is a no-op there.

## Where to look next

- `../../utils/viewState/AGENTS.md` for the engine and the order of the restore steps.
- `../sheetsBar/AGENTS.md` for the sheet switch that shares the engine.
- `../base/AGENTS.md` for the plugin contract, and the `handsontable-plugin-dev` skill.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='plugins/viewState|utils/viewState|sheetsBar'`
- `tests/e2e/view-state-api.spec.ts` for the parts jsdom cannot judge (scroll, a header selection, the page
  with a selection on it): `cd tests && npx playwright test --project=e2e-main e2e/view-state-api.spec.ts`
- `src/plugins/viewState/__tests__/viewState.types.ts` pins the public types and the `ViewState` namespace aliases.
