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
- No priority ordering matters: it registers no hook. `PLUGIN_PRIORITY` is 920, in the `900`+ band, only
  because it must not run before what it reads.

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
  grid for sort, filters and pagination (`externalDataSource`, those would fetch), a stored order
  whose length no longer matches (`sizeMismatch`, reported by `restoreViewState()`), a selection that
  does not fit (`outOfRange`), and a value of the wrong shape (`invalid`) are all reported in
  `skipped`. Another `version` applies nothing and warns. A new part needs a validator in
  `writePart()`: a state may come from an LLM or a URL, and a malformed value must not reach a
  plugin API that throws.
- **Validate against the grid, not only the shape.** A value that passes a type check can still
  break a plugin: the Filters import throws on an operation or condition name that is not registered
  on the page and on two entries for one column with
  different operations, after it has already emptied the live conditions; a sort the plugin rejects
  (a column past `countCols()`, a duplicate, more than one column without MultiColumnSorting) leaves
  the grid unsorted, because the restore clears the sort first; and `setIndexesSequence()` stores any
  array, so a row order that is not a permutation of `0..n-1` shows one record twice and hides
  another. `writePart()` rejects all of those as `invalid` before anything is applied, and
  `writeOrder()` reports another length as `sizeMismatch`. The `it.each` table in
  `viewState.unit.js` holds one case per rule.
- **The public sort carries no pre-sort order.** The sorting plugin builds its pre-sort cache on its
  first sort and keeps it until it is disabled, so an order handed to it later is overwritten on a
  grid that has sorted before. The restore hands it the current order, and `rowOrder` restores the
  exact sequence when the state carries it.
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

## Where to look next

- `../../utils/viewState/AGENTS.md` for the engine and the order of the restore steps.
- `../sheetsBar/AGENTS.md` for the sheet switch that shares the engine.
- `../base/AGENTS.md` for the plugin contract, and the `handsontable-plugin-dev` skill.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='plugins/viewState|utils/viewState|sheetsBar'`
- `tests/e2e/view-state-api.spec.ts` for the parts jsdom cannot judge (scroll, a header selection, the page
  with a selection on it): `cd tests && npx playwright test --project=e2e-main e2e/view-state-api.spec.ts`
- `src/plugins/viewState/__tests__/viewState.types.ts` pins the public types and the `ViewState` namespace aliases.
