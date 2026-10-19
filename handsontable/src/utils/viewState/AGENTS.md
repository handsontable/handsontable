# View state engine

Capture and restore of the grid's runtime view: row and column order, sort, filters, hidden and
trimmed indexes, collapsed NestedRows parents, manual sizes, frozen counts, pagination, selection,
and scroll. Read this before touching `viewState.ts`. Two callers share it, and core does not
import it, so it stays out of a `handsontable/base` build:

- SheetsBar (`plugins/sheetsBar/`) uses it on every sheet switch, with no part filter, so every step
  runs (merges, custom borders, and the lazily served cell meta included). `ViewState` is published
  only as the type `SheetsBarViewState`.
- The `ViewState` plugin (`plugins/viewState/`) is the public layer: it turns the internal state into
  the versioned, JSON-safe `GridViewState`, checks it, and passes the engine a set of parts. Its rules
  are in `plugins/viewState/AGENTS.md`.
- `withoutUndoEntry.ts` runs an operation with UndoRedo ignoring new actions and core's operation scope
  suppressed. Both callers use it.

**Neither caller may be imported from core.** `core.ts` and its helpers must not reach this directory:
the engine carries the restore code for MergeCells, CustomBorders, NestedRows, Pagination and Filters
(about 19 KB minified, 6 KB gzip in a base build), which a grid that does not use those plugins must not
pay for. A new consumer lives in a plugin.

## What it does

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

Tests: `__tests__/viewState.unit.js` (the engine), plus SheetsBar's own suites and
`plugins/viewState/__tests__/viewState.unit.js` (the public layer through the engine).

## Where to look next

- `../../plugins/viewState/AGENTS.md` for the public layer, `../../plugins/sheetsBar/AGENTS.md` for the switch.
- `../../plugins/base/AGENTS.md` for the plugin contract.
