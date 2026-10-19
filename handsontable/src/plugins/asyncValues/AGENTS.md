# AsyncValues plugin – per-cell async values with a pending and error state

The `asyncValues` plugin fills cells from promises (one source per cell, or a batch source for many cells) and
shows a pending and an error state per cell. Read this before touching `asyncValues.ts` (the plugin),
`launchQueue.ts` (the concurrency cap), `decoration.ts` (the cell's classes, ARIA, and elements), `utils.ts`,
`types.ts`, or `src/styles/components/plugins/_async-values.scss`.

## What it owns and what it does not

- It owns the **in-flight requests and the errors they leave**, in a `physicalIndexToValue` map registered on
  `rowIndexMapper` under the registry name (`'AsyncValues'`), one `RowState` per row: `entries` (prop to entry)
  and `recorded` (the writes an `undo: 'record'` call made, waiting for its undo step). The index mapper
  shifts the values on a row insert and removal; sorting, filtering and moving rows do not touch physical
  indexes, which is what lands a result on the record it was started for.
- It does **not** own the value. A resolved value is written to the data like any other write; while a request
  is pending, or after it fails, the cell keeps whatever it held, so "the previous value is kept" needs no code.
- It does **not** re-run a request on its own. A cancelled request stays cancelled; the application starts a new
  one from its own `afterChange` when an input changes (the guide's pattern), and `afterAsyncValueCancel` reports
  why a request ended. `retry()`/`retryErrors()` re-run a FAILED cell's kept source on request (a function
  source only: a plain promise has already settled; `keepSource: false` drops it).
- It does **not** own row ids. They come from core's row identity (`hot.getRowIdAtPhysicalRow()`,
  `getPhysicalRowById()`, the `rowId` option or `dataProvider.rowId`), read on demand and never stored on an
  entry, because an id can change with the data.
- The state is reported in cell meta (`asyncState`, `asyncError`) by `afterGetCellMeta`, **never** written with
  `setCellMeta`.
- It does **not** know whether the grid accepted a resolved value. `resolved` means "passed to the grid":
  `beforeChange` and a validator (`allowInvalid: false`) can still reject it, and an asynchronous validator
  writes it after `afterAsyncValueResolve` has fired. Pinned by "should report a value a validator rejects as
  resolved". Settling from `afterChange` instead would never settle a vetoed write.

## The traps

- **`updatePlugin()` must not cancel anything.** The React and Angular wrappers send every prop again on every
  update, so `asyncValues: true` reaches `onUpdateSettings` on each render. The usual
  `disablePlugin(); enablePlugin();` cancelled every request with `'disabled'` whenever the host component
  re-rendered. The option has no sub-settings, so `updatePlugin()` only calls `super`. Pinned by "should keep a
  pending request when `updateSettings()` sends the option again".
- **NestedRows is a hard conflict** (`registerConflict(PLUGIN_KEY, 'nestedRows')`). NestedRows moves and detaches
  rows through its own data manager without shifting the index mapper, and fires `beforeRemoveRow`/
  `afterRemoveRow` for a detach that removes nothing, so a physical index does not follow its record there.
  Supporting it needs NestedRows to report its moves, which is its own change.
- **The state must never reach undo.** A `setCellMeta` write would join the user's undo step, be replayed after
  `updateSettings`, and come back on undo of a row removal. So the map is listed in `DERIVED_INDEX_MAP_NAMES`
  (`translations/indexMapperSnapshot.ts`) and is never captured, and the resolved write runs under
  `operationScope.suppress()`. Without the derived entry an undo of a row removal restores the row's map value,
  a `Map` holding an entry nothing will ever settle, and the cell spins forever. Pinned by "should not bring a
  cancelled request back when the row removal is undone" and the `isDerivedIndexMap` case in
  `translations/__tests__/indexMapperSnapshot.unit.js`. The name is case-sensitive (`'AsyncValues'`, not the
  settings key).
- **Undo of an earlier step can overwrite an async value.** With the default `undo: 'skip'` the resolved write
  is not recorded, so undoing an earlier edit of the same cell restores the value that step recorded, over the
  async one. That is the defined behavior, documented in the guide.
- **`undo: 'record'` records one step per call, when the call's last request settles, and never holds a step
  open.** An `operationScope.hold()`ed step that has journaled data absorbs every user edit made meanwhile and
  keeps `isUndoAvailable()` false until it settles (`../undoRedo/AGENTS.md`), which an AI run of minutes cannot
  afford. So every write of the call is suppressed like a `'skip'` write, and `#planWrite` keeps
  `{ run, oldValue, newValue }` in the row's `recorded` map (it follows the row through inserts and removals like
  the entries do). When the run's `live` count reaches 0, `#recordRun` (a macrotask later, so a write an
  asynchronous validator delayed has landed) writes the old values back suppressed and the new ones recorded
  inside ONE `operationScope.run('async_values', …)`, so the step's before/after are exactly old/new. A cell whose
  current value is no longer `newValue` (a user edited it, a validator rejected or changed it) is left out: the
  user's edit is a step of its own. `#recording` keeps those writes from cancelling the requests that depend on
  the rewritten cells. Named and valued like the `undo` option of the view-state API (`'record' | 'skip'`,
  default `'skip'`). Pinned in `__tests__/api.unit.ts` ("undo" block).
- **Two hooks see every write, and both are needed.** `afterChange` covers the visual API (editor, paste,
  autofill, `populateFromArray`, `setDataAtCell`) and UndoRedo's repeat of the visible restored cells.
  `afterSetSourceDataAtCell` (physical rows) covers `setSourceDataAtCell`, which fires no `afterChange`, and the
  undo of a filtered-out row. The plugin's own write needs no source filter: the entry is deleted before the
  write, so the write cancels only the requests that depend on the written cell, which is intended (a value
  computed from another async value is stale once its input lands).
- **Both are registered at order `-1`.** The documented way to re-run a lookup is to start it from the
  application's own `afterChange`. A plugin enabled at runtime registers its hooks after the settings
  listeners, so at the default order the application's new request was cancelled with `'dependency'` by the
  very change that started it. Pinned by "should keep a request the application starts from its own
  `afterChange`".
- **A `dependsOn` change clears an error too**, silently (no cancel hook: nothing was pending). Without it, a
  fixed input left a stale error on the cell forever.
- **A resolved value takes one of two write paths.** A row with a visual index goes through
  `setDataAtRowProp`, so `beforeChange`, validators, `afterChange`, ColumnSummary and Formulas see it. A row
  trimmed out of the grid (Filters, TrimRows) has no visual index and goes through `setSourceDataAtCell`: the
  cell's validator does not run (a `sourceDataValidator` does) and no `afterChange` fires. Do not route everything through the
  source path to "simplify" it: ColumnSummary listens to `afterChange` only.
- **Settled requests are flushed by the `flush` setting:** `'microtask'` (results of one task share a write),
  `'frame'` (`requestAnimationFrame`, cancelled on disable/destroy), or a number of ms (`_registerTimeout`), which
  coalesces separate network responses into one write per window. Each flush writes one `setDataAtRowProp` call
  per write source (`options.source`) and path, and renders once, under `suspendRender()`/`resumeRender()` in a
  `finally` (not `batch()`, because validators and `beforeChange` listeners are host code). The notification
  runs in a `finally` after the write, so a throwing `beforeChange` listener cannot leave a caller's promise
  unsettled. `meta` is applied in the same suppressed block, to rows with a visual index only (`setCellMeta` is
  visual; a filtered-out row has none), and is never part of an undo step.
- **`beforeAsyncValueResolve` takes the value as its FIRST argument** because a hook listener's return feeds the
  next listener's first argument. `false` discards, any other non-`undefined` return replaces the value. A
  resolved literal `false` that the listeners pass through unchanged is written (`answer === false && value !==
  false` is the veto test), so a listener cannot REPLACE a value with `false`; documented on the hook. The hook is
  only run when it has listeners, because with none `runHooks` returns the first argument, and a resolved `false`
  would then read as a veto.
- **Concurrency is a FIFO of `Launch`es (`launchQueue.ts`).** A cell stays pending while its launch waits. A batch
  is one launch. A launch gives its slot back when its source settles OR when its last cell is cancelled
  (`#releaseSlot`), so a source that ignores the abort signal cannot hold a slot forever. `pump()` is re-entrancy
  safe: a source that starts a request runs inside it. `updatePlugin()` pumps, so a raised `concurrency` starts
  the queued launches at once.
- **A batch aborts its own signal only when every one of its cells was cancelled.** Each cell still gets its own
  signal in its context. The batch's answer is distributed by index to the cells still pending when the batch
  STARTED; an `Error` element rejects its cell, a missing element rejects with an empty message, a rejection
  rejects them all. `retryErrors()` re-runs failed batch cells as batches again, per source and call.
- **A result is applied only when its entry is still in `#entries`.** The entry object is the generation
  counter: a restart, an edit or a removal deletes it, so a source that ignores its `AbortSignal` and resolves
  late is still dropped. The check runs twice, when the promise settles and again at the flush, because an edit
  can land between the two.
- **The row index can be reset without a data load.** `updateSettings()` with `columns` or `dataSchema` runs
  `initToLength()`, which resets every index map to `null`, this one included, and fires no load hook. The
  plugin listens to the mapper's `init` local hook (removed by hand in `disablePlugin()`, since `BasePlugin`
  does not track local hooks) and puts its entries back: the data and its physical rows did not change. The
  Angular wrapper sends `columns` again on every settings change, so without this every such change hid all
  async state. Pinned by "should keep a pending request when `updateSettings()` rebuilds the row index".
- **A data replacement keeps the requests whose rows survive.** The React wrapper sends `data` on every commit,
  so core runs `updateData()` on every re-render, and Angular on every data change; cancelling there killed every
  run on the first re-render. `before*Data` captures every `RowState` with its row id, and `after*Data` (order
  `-1`) puts each back: on the row that holds the same id now, or, without ids, on the same physical row for
  `updateData()` (core's convention for cell meta and generated ids) and nowhere for `loadData()` (a new dataset,
  `'dataReplaced'`). A row not found cancels its requests with `'rowRemoved'`. Settled requests waiting for the
  flush keep their place, so a result that lands after the replacement still reaches its record. With
  `dataProvider.rowId`, requests survive a DataProvider refetch too. The capture must happen in `before*Data`:
  `updateData()`'s `fitToLength` has already truncated the map, and `loadData()` re-initialized it, by `after*`.
- **A load is guarded by `#replacingData`.** A load's spare rows fire `afterCreateRow` before `afterLoadData`,
  and the requests belong to the replacement, not to a row removal. A load that throws never reaches
  `after*Data`, so a microtask queued in `before*Data` clears the flag and runs the replacement as a load.
- **A removed row is found by comparing `#entries` against the map, in `afterRemoveRow`.** The map has
  already dropped the removed rows' values there, so an entry it no longer holds belonged to one. A stash
  filled in `beforeRemoveRow` was tried first and was wrong three ways: a vetoed removal left it behind for the
  next one, a nested `alter()` from a `beforeRemoveRow` listener overwrote it, and a listener that widened
  `physicalRows` after the plugin's own ran was never in it. Each left an entry with a stale `physicalRow`
  whose result then landed on another record. Pinned by the veto and nested-removal cases.
- **Every entry carries its physical row, and it goes stale on a row insert or removal.** The map shifts the
  values, not the entries, so `#syncRows()` re-reads them from the map after `afterCreateRow` and
  `afterRemoveRow` (one pass over the rows, only while an entry exists), before any cancel hook runs. Both are
  registered at order `-1`, so a listener of those hooks that cancels or writes a cell already sees current
  rows, and `#deleteEntry()` still finds an entry by scanning the map when its row is stale (ColumnSummary
  writes from its own row hooks and enables earlier).
- **Host code runs only after the entries are consistent.** `#detach()` removes without running host code;
  `#notifyCleared()` then settles every promise, aborts (an `abort` listener is host code), and only then runs
  the hooks, so a throwing listener cannot leave another caller's promise pending. The flush does the same
  (`#settleResult` for all, then `#reportSettled`). A rejection whose error the same flush already cleared
  (a resolved `dependsOn` input) settles as rejected but fires no hook and no announcement.
  `disablePlugin()` sets `#disabling`, and a request started from a cancel listener meanwhile resolves as
  cancelled instead of outliving the plugin. A start listener that cancels its own request keeps the source
  from being called. A restart installs the new entry before the
  previous one's cancel hook runs, so a listener that restarts the same cell from that hook replaces the new
  entry instead of leaving an orphan that later wrote its value and cancelled the live request. Pinned by
  "should let a cancel listener restart the same cell".
- **Columns of array data are indexes.** An insert or removal shifts the ones after it, so the entries keyed
  by a number at or after the first shifted physical column are cancelled (`'columnsChanged'`); the ones
  before it, and string props, stay. Cancelling every numeric entry made `minSpareCols` (which appends a
  column after a write into the last one) cancel every request.
- **The decoration is plugin state, so `renderMode: 'onChange'` cannot see it.** Every state flip calls
  `markCellChanged()` for the visual cell before the render. A cell edit renders BEFORE `afterChange`
  (`beforeChangeRender` → `render()` → `afterChange`), so a cancellation from `afterChange` renders once more.
- **Taking the decoration off a recycled cell element.** Walkontable resets `className` and every `aria-*`
  attribute before each paint, but not the indicator span or `title`. The `data-ht-async` attribute marks a
  decorated element and holds the `title` the plugin wrote, so a `title` a renderer wrote in the same paint is
  left alone. `disablePlugin()` clears every entry and paints once while `afterRenderer` is still registered,
  or the spinners would outlive the plugin; that is why its cleanup runs before `super.disablePlugin()`.
- **The error message is in the cell twice.** `title` serves a pointer only, and a screen reader ignores it
  whenever the cell has `aria-describedby`, which Walkontable sets to the column header on every cell. So the
  message is also visually hidden text (`span.htAsyncErrorMessage`, `user-select: none`) read with the cell's
  content, and a rejection on the active cell is announced while the grid listens and `ariaTags` is on
  (`utils/a11yAnnouncer.ts`, the message itself, so no i18n string). Known leaks of that text: AutoLink reads
  `TD.textContent`, so when it is enabled AFTER this plugin its `afterRenderer` runs later and links a URL in
  the message; Formulas `showFormulas` repaints the content and drops the span (the `title` stays).
- **The indicator is a real element, not a pseudo-element.** `td::after` is taken by the Comments indicator
  and `td.area::before` by the selection fill; a cell can be commented, selected and pending at once. It covers
  the end of a long or right-aligned value; padding the cell instead would rewrap text and change the row
  height while the request runs.
- **DataProvider: a resolved value is not saved.** `'AsyncValues.resolve'` is not in
  `DATA_PROVIDER_BATCH_UPDATE_SOURCES` on purpose: a saved update refetches, and without `dataProvider.rowId`
  a refetch cancels every request. With `dataProvider.rowId` the requests of the rows still on the page survive
  a refetch (the data-replacement remap above); saving stays the application's job.
- **The `'microtask'` flush is a bare `rootWindow.queueMicrotask()`**, not `_registerMicrotask()`, which keeps
  one record per call for the instance's life (a column of separate responses flushes once per response).
  `#flush` returns before touching `hot` when nothing is queued, which is the state after `destroy()`.
- **`copyPendingAs: 'empty'`** blanks pending cells in `beforeCopy`'s data. The data is laid out over the union
  of the copied ranges' rows and columns in first-seen order (`readCopiedAxes` mirrors copyPaste's
  `normalizeRanges`, which a plugin may not import). Export keeps the current value.
- **`afterAsyncValuesIdle` fires once per busy-to-idle transition**, from `#afterSettling()`, which every settle
  path (flush, cancel, removal, replacement) ends with. `#pendingCount` is kept by `#setEntry` and `#finish`, so
  the query methods and the idle check never walk the entries.
- **`destroy()` settles every pending promise as cancelled (`'disabled'`)**, so an unmounting wrapper's
  `await setAsyncValue()` does not hang. It fires no hook: the grid is gone.

## Where to look next

- Plugin contract, lifecycle and the priority table (340): `../base/AGENTS.md`.
- The undo journal and the derived maps: `../undoRedo/AGENTS.md`.
- A plugin that keeps per-row state in a `physicalIndexToValue` map: `../rowSelection/AGENTS.md`.
- Abort handling for a grid-level request: `../dataProvider/AGENTS.md`.
- Workflow: the `handsontable-plugin-dev` skill.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=asyncValues` (jsdom grids). Four files:
  `asyncValues.unit.ts` (the lifecycle, cancellation, re-entrancy, rows, other plugins), `rows.unit.ts` (starting by
  physical row and row id, data replacement), `batching.unit.ts` (batch sources, concurrency, flush strategies),
  `api.unit.ts` (progress, retry, request options, before-hooks, copying, `undo: 'record'`). Shared builders are in
  `__tests__/helpers/grid.ts`. Results settle through the returned promise; a late result needs a macrotask
  (`setTimeout(0)`) to prove it was dropped, because the default flush is a microtask. `flush: 'frame'` is tested
  with a stubbed `requestAnimationFrame`.
- E2E: `cd tests && npx playwright test e2e/async-values.spec.ts` (fixture `tests/fixtures/demo/async-values.html`,
  page object `AsyncValuesPage`). It checks the painted indicator and the error colors on every theme, so
  rebuild the full package first (see `tests/AGENTS.md`).
