# AutoColumnSize plugin — measuring the widest cell per column

The `autoColumnSize` plugin sizes columns from their content. Read this before touching
`autoColumnSize.ts`.

Two facts to get right before anything else:

- **It is enabled by default, but `colWidths` switches it off.** `isEnabled()` is
  `getSettings()[PLUGIN_KEY] !== false && !getSettings().colWidths` — so `autoColumnSize: undefined`
  behaves like `true` (the opposite of `autoRowSize`, which is off by default), **and any `colWidths`
  setting silently disables the plugin.** Check `isEnabled()` first when a grid "is not measuring": on a
  grid that declares `colWidths` there is nothing to find in the sampler or the ghost table.
- **`PLUGIN_PRIORITY = 10` is the lowest of all plugins, so it enables first — but that is not what puts
  its `modifyColWidth` listener at the head of the hook.** The listener is registered with an explicit
  **order index of `-10`**. Priority orders `enablePlugin()`, not hook callbacks (`../base/AGENTS.md`). The
  indexes on that hook are: this plugin `-10`, `nestedHeaders` unindexed, `manualColumnResize` `+1`,
  `hiddenColumns` `+2`, `stretchColumns` `+10`. **Drop the `-10` and any negative-index listener silently
  outranks the measured width.**

## The measurement pipeline

`SamplesGenerator` collects sample values per column (bucketed by string length), `GhostTable` renders them
off-DOM with the real renderers, and the widest result is written to the `autoColumnSize` index map.

Rules that hold this together:

- **Sample with `getCellMetaTransient`, never `getCellMeta`.** The sampler sweeps the whole row range per
  column; the eager read permanently materializes one meta object per visited cell, which is O(rows × columns)
  retention on init. The transient read still resolves the full dynamic meta — hooks plus the `cells`
  function — so MergeCells' `hidden`/`spanned` flags work.
- **A uniform column reads its meta once and its values in bulk** (`columnSampleReader.ts`, built per
  `#sampleColumn()` call). With no `beforeGetCellMeta`/`afterGetCellMeta` listener (`hasHook()` counts
  global ones) and no function `cells` on the column meta, a cell without stored meta resolves the same
  meta as every other such cell of the column apart from its coordinates, so the reader resolves it and
  its renderer once and reads the values with `_getDataAtColumnForRows()`, which falls back to `get()` per
  row for `modifyData` and the other cases it lists. That took the 100k × 50 constructor from about 1.7 s
  to 0.75 s with `syncLimit: 50`. A slice shorter than `MIN_READER_ROWS` (16) is read per cell: below it the
  reader's setup costs what it saves. Grids with MergeCells, HiddenRows, HiddenColumns or AsyncValues add an
  `afterGetCellMeta` listener and keep the per-cell path. Three rules. (1) **A cell with stored meta and a
  hidden row stay on the per-cell path**, and the stored-meta check runs again per row, because a formatter
  run for an earlier row can `setCellMeta()` a later one. The bulk read covers only the rows the per-cell
  path would read when the slice starts; a row that gains stored meta during the walk is read twice. (2) **One meta object serves the whole column only when nothing outside
  this plugin can keep or write to it**: no function `valueFormatter` on the column meta, no `valueFormatter`
  static on the renderer, and no `modifyAutoColumnSizeSeed` listener that is not marked read-only
  (`markReadOnlyMetaListener()`, `utils/readOnlyMetaListeners.ts`). Otherwise each row gets a new
  `createTransientColumnMeta()` object, as a per-cell read would give it. The checkbox renderer's global
  seed listener is marked; without the mark it is registered in every build that includes the checkbox
  renderer and the shared object never applies (0.75 s against 1.3 s above). Mark a new built-in listener
  only when it neither writes to the meta nor keeps it. (3) **Known limits:** the values are read before the
  walk, so `modifyData`, a `valueGetter` and a `data` accessor run for the whole slice before any formatter
  or seed listener, not interleaved per cell, and a formatter that writes into the data during the walk is
  not seen for the rows after it. The gate is read when the slice starts, so a meta listener added during
  the walk applies from the next slice. Pinned by `__tests__/uniformColumnSampling.unit.ts` (the read
  counts, every gate, the meta objects, a meta stored during the walk) and
  `tests/e2e/auto-column-size-uniform-column.spec.ts` (each case's widths against a build that a no-op
  `afterGetCellMeta` listener sends down the per-cell read).
- **Format the value through `formatCellValue()`**, so the measured string is what the renderer will
  actually produce (cell-level `valueFormatter`, then the renderer's static). See the `renderCell.ts`
  bullet in `../../../AGENTS.md`.
- Cells covered by a merged cell carry `null` and are skipped — they contribute no sample. The merge's
  own top-left cell is sampled only when the merge spans one column; see "Merged cells" below.
- **List-cell columns (autocomplete, dropdown, handsontable) include the reserved arrow
  slot (DEV-348).** The real renderer adds `td.htAutocomplete`; the product CSS reserves the
  arrow as `padding-inline-end`. GhostTable therefore measures value plus arrow, and an
  autosized column grows on upgrade (a breaking change). A column `width` skips measurement
  for that column only. `colWidths` still disables this plugin for the whole grid. Do not
  strip the arrow from the sample — that reopens the wrap onto a second line.
- **The ghost table must be restored even when a custom renderer throws.** A throwing renderer that leaves
  headers disabled, or the probe's columns still attached, corrupts every later full-scan measurement.
- **The ghost container's width must never follow the root's.** `GhostTable#createContainer()` copies the
  root's class names onto the container, `ht-wrapper` included, and `.handsontable.ht-wrapper` is
  `width: 100%`. The container is absolutely positioned, so that resolved against a collapsed or narrow root:
  every column measured at its wrapped min-content width (51px for a 75px column in a 0px root), and the
  render that follows the root's return measures cache misses only, so columns past the ones rendered while
  it was narrow kept the wrapped width for good. `_base.scss` therefore sets `width: auto` on
  `.handsontable.htGhostTable.htAutoSize`, a compound selector so it wins on specificity (0,3,0 against the 0,2,0 of
  `.handsontable.ht-wrapper`, so source order does not decide). A column wider than its root now measures
  at its content width, as it did before 16.2.0, where #11919's `ht-wrapper` stretch had capped it at the root
  width as a side effect. A test of this must restore the root through the grid's own ResizeObserver render:
  `render()` and `refreshDimensions()` both re-measure every column and hide the defect
  (`tests/e2e/auto-column-size-collapsed-root.spec.ts`).

## Merged cells

The content of a merge used to size no column at all: the sampler skipped every `spanned` cell, so a long
text in a merge wrapped into a 50px column. Two rules replace that skip, split by the merge's shape.

- **A merge that spans one column (rowspan only) is sampled like any cell.** Its text belongs to that
  column alone, so the sample cache and the width-determiner probe need nothing extra.
- **A merge that spans several columns stays out of the samples** and is fitted by `MergedCellsWidths`
  (`mergedCellsWidths.ts`). Sampled as an ordinary value it made its first column as wide as the whole text
  on its own (the 2015 symptom of GitHub issue #2667). The demand is the text width minus the widths of the
  other spanned columns, and it lands on the first column of the span that is not hidden, the one MergeCells
  draws the merge from (`mergeCells/renderer.ts`, `getNearestNotHiddenIndex`). `getColumnWidth()` returns the
  larger of that demand and the measured width.

Eight rules hold this together.

1. **The demand lives apart from `columnWidthsMap`.** The probe compares new widths against the cached
   width, and a demand written into it would never shrink back when a spanned column grows or the merge goes
   away. It is a plain `Map` keyed by physical column, not a registered index map, so UndoRedo needs no
   `DERIVED_INDEX_MAP_NAMES` entry for it.
2. **The other spanned columns count at their width before the stretch, and a hidden one counts as 0.** The
   host reads `getColWidth(column, 'StretchColumns')`, the source the StretchColumns calculator reads its base
   widths with. Read with the stretch, a fit that followed a stretched render subtracted the stretched widths,
   and once the wider first column turned the stretch off, the merge ended short of its text. A column is
   skipped when `columnIndexMapper.isHidden()` says so, not when its width is 0: CollapsibleColumns hides
   through its own hiding map and its columns keep their width. A settings `width` and a manual size count.
3. **Demands are resolved from the rightmost drawing column leftwards, each written before the next is
   read.** A demand reads only the columns to the right of its drawing column, so a merge that starts inside
   another one's span is sized first. Merges with the same lead column and span are resolved once.
4. **A fit runs only when an input changed, never on every render.** `forceFullRender` re-measures every
   visible column on every `render()`, and a fit there read every merge on every edit. Each input below is
   pinned by a case in `tests/e2e/auto-column-size-merged-cells.spec.ts`, and the ones marked (control) also
   went red with the trigger removed:
   - a stored width that changed (`#updateColumnWidthsMapBasedOnGhostTable` compares before it writes);
   - any width map of the column axis changing (the column mapper's `change` local hook): a drag, the
     ManualColumnResize API, the stretch, this plugin's own map (control: the API case);
   - the text or meta of a merge's first cell (`#invalidateMergedCellText`): an edit through
     `#onBeforeChange` (before its "already queued" early return), an undo through `afterSetSourceDataAtCell`
     (control), and `afterSetCellMeta` (control). The Formulas value updates reach the same method, and no
     case pins them;
   - a merge added or removed: `beforeMergeCells`/`beforeUnmergeCells` mark the layout dirty, because
     MergeCells renders inside the call (clearing the covered cells) before its `after*` hook, and that
     render's fit must read the merges; `afterMergeCells`/`afterUnmergeCells` queue the rescans;
   - an undo or redo, which can restore merges with no merge hook (rule 8, control);
   - a style change: a column re-measured from its cached samples to another width
     (`#replayedColumns`) makes every group measure again from its kept texts (control). A style change
     that moves no visible plain column goes unseen until another input arrives. The first full render
     after a sweep has no samples to replay (the sweep drops them), so while `#rewalkAfterSweepPending` is
     set, a width that changed on a column that re-walk measured from scratch counts as a style change too:
     the re-walk cannot tell one from a data change. Those columns are a set local to one
     `#calculateColumnsWidth()` call, handed to the width update, so none is left over for a later measure.
     The flag clears after the first full re-walk, which fills the cache again; a full render that returns
     before it (no rows, no visible column) leaves it set, because that render re-walked nothing. The grid draws once at init and the first re-walk can follow a style
     change ("fits a merge again when the styles change before a render", control). Do not keep the sweep's
     samples instead: a replay cannot see a value written into the data array with no hook, and the first
     `render()` after init then keeps the old width (`textEditor.spec.js`, "textarea should have cell
     dimensions (after render)");
   - a settings update (`updatePlugin()`), which can restyle a merge's text (control);
   - rows hidden, shown, or trimmed (control for shown), the rows sorted, a column inserted, moved, removed,
     or hidden (control for hidden), `loadData()` and `updateData()` (control), and `enablePlugin()`
     (control).
5. **Each merge's text is kept, and only what changed is read again.** `MergedCellsWidths` keeps the
   formatted text of every merge's first cell by physical row and column, and the width of each group of
   merges (same lead column and span) by a signature of its physical rows and the column's text version. An
   edit forgets one text. Hiding, showing, or trimming rows only changes which merges a group holds, so the
   group is measured again from the kept texts without reading a cell, and a style change does the same
   (`markStylesChanged()`). `markStale()` forgets every text: a settings update, an overwrite sweep, and
   `enablePlugin()`. `markRenumbered()` also drops a waiting merge snapshot (rule 8), for anything that can
   renumber the physical rows or columns: a changed row or column sequence (a sort included, since the
   cacheUpdated state cannot tell a sort from a remove and insert), `loadData()`, and `updateData()`.
   **A fit after a width change alone reads no merge.** `markWidthsChanged()` is the only mark that keeps
   `#layoutDirty` off, and such a fit resolves the demands again from the groups the last full fit kept
   (`#resolved`): the widths are the only input that moved. Every other mark sets `#layoutDirty`, and a new
   input that can change the drawn merges, their rows, or their texts must too, or the fast path keeps
   the previous groups.
6. **The "may have merges" flag gates the per-change reads, never the structural marks.**
   `mayHaveMultiColumnMerges()` counts every multi-column merge MergeCells reports, hidden rows included, and
   gates the meta reads of `#onBeforeChange`, `afterSetSourceDataAtCell`, `afterSetCellMeta`, and the column
   `change` hook, so a paste into a grid without such merges reads no meta. The index-mapper handlers ask
   whether MergeCells is enabled instead: `getVisibleMergedAreas()` leaves out a merge whose rows are all
   trimmed, so after a filter the flag reads `false`, and clearing the filter must still refit.
7. **The fit runs after the ghost table is cleaned, once per sweep, and merges queue as little as they
   need.** The fit measures through the ghost table too, so `#updateColumnWidthsMapBasedOnGhostTable()`
   cleans it first. An idle chunk of the asynchronous sweep leaves the fit pending (`#deferMergedCellsFit`),
   and the sweep fits once when it ends. A merge made by the user rescans every column it spans; a merge
   applied from the settings (`auto`) rescans only its first column, whose text the init sweep measured
   before the merge existed, since the grid never drew its covered values. A queued rescan is skipped for a
   column already scanned in the same `beforeRender` (`#scannedColumns`) or by an asynchronous chunk that
   started after the merge (`#mergeRescanQueuedAt`).

8. **An undo or redo compares the merges before and after.** MergeCells restores merges with no hook in
   `restoreState()`, and the plugin would otherwise keep samples taken under the old merges: an undone
   unmerge left the first column at the whole text's width. `beforeUndo`/`beforeRedo` take a snapshot of
   the merges (`snapshotMerges()`), keyed by their physical first cell and span; the undo renders before its
   `after*` hook fires, so a snapshot taken there would miss that render. The fit of that render reports
   every merge that appeared or went away, and every column it spans is dropped from the samples cache and
   queued for a full rescan, which `#onBeforeRender` runs in the same render. Only that fit compares: a
   comparison on every fit cost 4 to 6 ms per fit at 10k merges. A renumbering drops a waiting snapshot.
   `clearCollections()` (a settings rebuild, a disable) is the other hook-less path; the settings update
   reads every text again and the full render re-walks the visible columns, and a lingering demand never
   exceeds the unmerged cell's own text.

Known limit: a merge removed with no unmerge hook (`updateSettings({ mergeCells: false })`) keeps its demand
until the next fit; the unmerged first cell is sampled again then, and its own text is never narrower than
the demand. Unit cases for the class: `__tests__/mergedCellsWidths.unit.ts`.

## `syncLimit`, and what "sync" guarantees

`syncLimit` (a column count, or a percentage string) splits the work: those columns are measured *exactly*,
over the whole row range, **before the first paint**. Everything past the limit runs asynchronously in
idle-task chunks (`requestIdleTask`). The contract is that the first paint is correct for the columns the
user sees, and an explicit `syncLimit` keeps its literal meaning.

**The default split has a cell budget (`SYNC_CELLS_BUDGET`, 1,000,000 cells).** The synchronous part used to
have a column cap and no cell cap, so a 100k × 50 grid sampled 5M cells, about 2.2 s, before the first paint.
`calculateAllColumnsWidth()` now passes `syncViewport` to `#sweepColumns()` when the sweep is the one of `init`
or `loadData()` (`#recalculateDeferringOffScreenColumns()` sets `#mayDeferOffScreenColumns`; the public
`calculateAllColumnsWidth()`/`recalculateAllColumnsWidth()` keep measuring every `syncLimit` column before they
return), `syncLimit` is NOT set (`#hasExplicitSyncLimit()`; an object without it resolves the limit to 0, so one
column), AutoRowSize is not enabled, and `(syncLimit + 1) × rows` exceeds the budget. That sweep measures only the
columns on screen before it returns (about 0.8 s on the same grid) and leaves every other column to idle tasks.
The final widths are the same, because every column, early or late, samples the whole row range. These rules
hold it together:

- **Before the first draw nothing is "on screen" yet.** `getFirstVisibleColumn()` is -1 inside the `init`
  hook, so `#onScreenColumns()` sees only the frozen bands, and the first render's
  `calculateVisibleColumnsWidth()` measures nothing either (a pre-draw sweep that deferred everything drew
  default widths and moved them later). So before a draw the queue is the frozen end columns, then the rest
  from column 0 (`#preDrawSweepOrder()`), and the sweep measures them one at a time, flushing the ghost table
  after each, until the widths before the stretch (`getColWidth(column, 'StretchColumns')`) fill
  `view.getFrozenViewportSize(true)`. Once a draw exists (a `loadData()` on a scrolled grid), the queue is
  `#columnSweepOrder(true)` and the synchronous part is `#onScreenColumns()`. A width of 0 or one the view
  cannot measure falls back to every `syncLimit` column, as without a budget.
- **A grid with AutoRowSize enabled keeps the exact path.** AutoRowSize measures the rows right after this
  plugin's `init` and `afterLoadData` listeners, against these widths, so a row in view with a long text in an
  off-screen column was measured at the fallback width (189 px against 29 px in the probe) and shrank once the
  sweep ended: a row on screen that moved. That grid opted into an exact init, so it keeps it ("keeps every
  column synchronous while AutoRowSize measures the rows"). AutoRowSize turned on while
  the sweep still has columns left for idle tasks measures the rows on screen in its `beforeRender` listener,
  which runs after this plugin's, so this plugin's `#onBeforeRender` ends the sweep there and measures every
  `syncLimit` column it did not reach (`#measureDeferredColumnsNow()`) before AutoRowSize reads them. Without it
  a row in view measured 3009 px against 29 px and kept that height ("measures the rows against exact widths
  when AutoRowSize is turned on during the sweep"). The exact path still measures only the `syncLimit` columns
  and one chunk before it returns (about 102 columns by default) and leaves the rest to idle tasks, so the rows
  are measured against the default width of those columns. AutoRowSize owes the rows a second measure when the
  sweep ends (`#rowsOwedToColumnSweep` in its `AGENTS.md`), and pays it in `beforeRender`, so the idle chunk that
  ends any sweep renders, with the same fill-only visible pass as the budget path (`loop()`, the last branch).
  Without that render the owed measure waits for an unrelated full render, which a grid the user only scrolls
  never gets, so a row below the fold kept the height of its text wrapped at 50 px (149 px against 49 px in the
  probe) (`tests/e2e/auto-row-size-column-sweep.spec.ts`). The render measures the band on screen as any render
  does, and AutoRowSize measures the other rows from idle tasks only, so it blocks no longer than an ordinary
  render. The render is not tied to AutoRowSize any more: a grid without it needs the same draw for its scroll
  range (the next bullet), so the sweep draws whether or not the plugin is enabled.
- **The columns a merge on screen spans are measured with it** (`measureMergeSpans()` in `#sweepColumns()`). A
  multi-column merge needs from its first column the text's width less the other spanned columns, so with
  those at the fallback width the first column was drawn too wide (1076 px against 417 px in the probe) and
  shrank when the sweep ended: an on-screen column that moved. The spans are followed to a fixed point (a merge
  reaching the screen only through another merge's off-screen column counts), and capped at the `syncLimit`
  columns: a title row merged across 100 columns would otherwise measure all 100 over every row before the first
  paint. Past the cap the merge is drawn from fallback widths, as it was without a budget for columns past
  `syncLimit`.
- **The idle part of such a sweep is tracked (`#viewportSweepPending`).** Its queue is fixed when it starts and
  it has no `#sweepPendingColumns`, so `#cancelSweep()` and `#invalidateReMeasureSweep()` read the flag too: a
  disable and enable, a column insert, or a meta change before it ended left every column it had not reached
  without a width (scroll width 1979 px against 7697 px). A cancel owes a re-measure, as a re-measure sweep's
  does. A disable and enable with no render in between pays it from an idle task the enable's ready step
  schedules (`onGridReady()`, outside the init pass): it starts the re-measure sweep and renders. Only the next
  render paid it before, so a grid nobody rendered kept those columns without a width; and a sweep started in
  the step itself ended in its first chunk, which never draws, so the scroll range kept 1880 px against
  7697 px. A render that comes first (an `updateSettings()`) pays the debt, and the task finds nothing owed.
- **On a drawn grid the columns before the viewport are measured too** (`#countDrawnLeadingColumns()`). The
  scroll offset is their sum, so a `loadData()` on a grid scrolled sideways left them at the fallback width,
  the scroll range shrank, the browser clamped the offset, and the viewport moved to other columns. They follow
  the columns on screen in the queue, within the `syncLimit` cap, as without a budget.
- **No chunk runs in the caller.** The default sweep runs one `CALCULATION_CELLS_BUDGET` chunk synchronously
  after the exact part; on a grid this tall that is one more off-screen column over every row, so a
  `syncViewport` sweep goes straight to an idle task.
- **The last idle chunk of every sweep that does not reuse samples renders, in full, with a visible pass that
  only fills in (`#fillOnlyRender`).** (A re-measure sweep, `reuseSamples`, takes the branch above it in `loop()`
  and draws through `#sweepDrawPending`.) That covers the default sweep of a grid wider than its synchronous part (about 102
  columns) with no budget and no AutoRowSize: it used to end without a draw (scroll width 8050 px against
  33950 px of measured columns on 160 columns, and `scrollViewportTo({ col })` landing about 30 columns short
  until an unrelated render), and the gate on AutoRowSize or `syncViewport` is gone
  (`auto-column-size-sync-budget.spec.ts`, "idle sweep on a grid wider than its synchronous part"). A sweep
  the caller finishes (no idle task) draws nothing, as before, so a grid that fits the synchronous part gets no
  extra render. The width map's observer only drops the engine's cache, so without a render the scroll range
  kept the fallback widths of the deferred columns (`auto-column-size-sync-budget.spec.ts`, "widens the scroll
  range…", went from 7697 px to 1880 px with it removed). A fast draw (`hot.view.render()`) is not enough: it rewrites no
  `<col>`, so the rendered columns past the viewport's edge kept the fallback width the first paint gave
  them. A plain forced render is too much: it overwrites every on-screen width, and the synchronous part's
  samples were dropped (`recalculateAllColumnsWidth()`), so it re-walked every on-screen column over every row
  from inside an idle task. The flag is one-shot, consumed by `calculateVisibleColumnsWidth()`: a render the
  application holds with `suspendRender()` runs at `resumeRender()`, after `render()` returned.
- **Behavior a tall default grid gets now:** right after the constructor, `getColWidth()` of an off-screen
  column returns the fallback width until the idle sweep reaches it. A `scrollViewportTo()` or `selectCell()`
  made meanwhile is computed from the widths of the columns before its target, so
  `#onBeforeViewportScrollHorizontally` measures every one of them that lacks a width and then renders
  (fill-only) before the scroll goes on: Walkontable reads the widths from its last draw, so measuring alone
  left the scroll on fallback widths, and the selected cell left the view when the sweep ended. That costs the
  columns up to the target over every row, which is what the path without a budget paid in the constructor. A
  render held by `suspendRender()` (a `batch()` included) runs only at `resumeRender()`, so a scroll made then is
  stored (`#scrollAfterResumedRender`) and run again from the next `afterRender`. Measured is not drawn: an idle
  chunk writes widths and draws only at the end of the sweep, and a sweep that ends while the rendering is held
  draws at `resumeRender()`. So the hook also renders, and stores the scroll when held, whenever
  `#widthsChangedSinceDraw` is set (by a `syncViewport` idle chunk or the hook's own measure, cleared at the end of
  `#onBeforeRender`), not only when it measured something itself. Only a `syncViewport` sweep measures up front.
  Any other sweep still running (`inProgress`: an explicit `syncLimit`, a default grid wider than the
  synchronous part under the budget, AutoRowSize on a tall grid) measures nothing in the hook, because an
  application that sets `syncLimit` asks for less synchronous work (a scroll to column 40 of 60 on 100k rows
  measured 720 ms with `syncLimit: 5`, against 0.3 ms before). The hook remembers the last scroll whose columns
  before the target still lack a width (`#scrollAfterSweep`) and runs it again after the render that ends the
  sweep (`#replayScrollAfterSweep()`), through `#scrollAfterResumedRender` when that render is held. Without
  the replay a `selectCell(0, 159)` right after the constructor on 160 columns landed on the fallback widths of
  the columns before it, and the cell was off screen once the sweep drew
  (`auto-column-size-sync-budget.spec.ts`, "keeps the last column in view after a call made before the sweep
  ends" and "without measuring up front"). A scroll to a column whose widths are all known clears the pending
  one, and `#cancelSweep()` drops it. A user who scrolls with the scrollbar while the sweep runs is not seen by
  the hook, so the replay moves the viewport back to the last programmatic target. With no sweep running and no
  width written since the last draw, the hook is inert. An edit made while the sweep runs is
  refreshed when it ends (`#refreshQueuedColumnsWidth()` waits for `inProgress`), and a column scrolled into
  view before the sweep reached it is measured by that render, synchronously, over every row (the visible
  pass fills every missing width), as for any grid wider than `syncLimit` before. A grid whose columns all fit
  the synchronous part (under the budget, or with an explicit `syncLimit` that covers them) behaves exactly as
  before. A grid wider than that, with or without a budget, gets the one fill-only render when the sweep ends.

Pinned by `tests/e2e/auto-column-size-sync-budget.spec.ts`, which lowers `SYNC_CELLS_BUDGET` from the page
(it is a static getter for that reason) so a 1000-row grid takes the tall grid's path, and compares every
width with a grid measured the exact way. The perf scenario `initial-load-autosize` measures the constructor
on 100k × 50 with the default plugin.

The async loop must cancel its frame when the instance was destroyed mid-calculation.

Every full sweep goes through `#sweepColumns()`. `calculateAllColumnsWidth()` runs it in ascending order with the
`syncLimit` columns measured exactly, or, past the cell budget above, with the columns on screen first. The web-font re-measure (`#onAfterFontsLoad`, DEV-199) runs it with no exact
columns, `viewportFirst` (the rendered columns come first in the queue) and `reuseSamples` (a column with cached
samples is measured from them, at no sampling cost), so the first chunk – one `CALCULATION_STEP` of columns or one
`CALCULATION_CELLS_BUDGET` of cells, run synchronously – covers what is on screen, and the rest waits for idle tasks.
While that sweep runs, `#sweepPendingColumns` holds the columns it has not measured yet, and the sweep's own
draws leave them to it (`#sweepDrawPending`: the render that follows the start of the sweep and its draws from idle
tasks). `calculateVisibleColumnsWidth()` then honors `forceFullRender` only for the other on-screen columns: the
forced render right after the hook otherwise re-walks every on-screen column without cached samples over the whole
row range, which held the page for 0.7 s on a 100k × 20 grid, the same cost the chunking had just avoided. The
columns the sweep already measured have cached samples, so those draws measure them again at little cost. Any other
forced render (an application's `render()`, a theme switch) measures every on-screen column as it would with no
sweep. Two earlier shapes failed review: a flag that left every on-screen column to the sweep through its last draw
kept a theme or class change made meanwhile at the old widths, and leaving the pending columns to the sweep on
every forced render kept them stale on a page too busy for idle tasks (a write plus `render()` every 200 ms on
100k rows costs 0.55 s each, on every build). `#finishSweep()` and `#cancelSweep()` clear both. Listener order matters too: the four sizing
plugins register `afterFontsLoad` with `FONT_REMEASURE_ORDER_INDEX` (10, `core/fontLoad.ts`), so the application's
listeners, a settings listener included, run first and can drop a custom renderer's cached sizes before anything
measures. The rules that sweep follows, each one a review finding:

- **An idle chunk that changed the width of an on-screen column draws the grid, and so does the last chunk.** A
  width written from an idle task reaches the screen only through a draw: the `columnWidthsMap` observer calls
  `invalidateColumnWidthCache()` and nothing else, so without it the on-screen columns past the first chunk kept
  the fallback-font width until an unrelated render. The draw at the end also covers columns scrolled into view
  while the sweep ran and consumes the refresh queue (`#refreshQueuedColumnsWidth()` waits for `inProgress`).
  `flushGhostTable()` compares the widths before and after the write: the hook fires for every font the page loads
  (an icon font too), and a chunk that measured on-screen columns to the same widths is no reason to draw.
- **The chunk run by the caller never draws.** The font re-measure runs inside `afterFontsLoad`, which core
  follows with a render, and a draw from inside the hook ran before AutoRowSize, NestedHeaders and the user's
  listeners had re-measured, so the grid drew twice (three times on a small grid, where that chunk ends the
  sweep). `loop(fromIdleTask)` draws only from an idle task.
- **A change that makes the sweep's samples or queue stale ends it and owes a new one to the next render
  (`#invalidateReMeasureSweep()`, `#reMeasureOwed`).** `#onAfterSetCellMeta`, `#queueMergeRescan()` and the two
  index-mapper listeners call it: a changed row or column set leaves the sweep's queue of visual columns
  describing other columns, meta can restyle a column it measured, and a merge's rescans wait for the sweep to end.
  A meta write drops one column's samples, so the restart replays every other column and a stream of them still
  lets the sweep finish.
  `#onBeforeRender` starts the owed sweep before `calculateVisibleColumnsWidth()`, so the same render draws the
  on-screen columns from it, and holds the debt while the grid has no rows or no columns. `#onAfterLoadData` drops
  the debt, since an owed sweep would take the new data's columns from the previous data's samples. Only a sweep
  that overwrites every width pays it: `calculateAllColumnsWidth()` skips the columns that have one, so it keeps
  the debt. **Any cancel of a re-measure sweep owes one** (`#cancelSweep()` sets the debt while
  `#sweepPendingColumns` is set): a `calculateAllColumnsWidth()` call or a disable and enable that cut the sweep
  short left the columns it had not reached at the fallback-font width. A font load on a grid with no rows owes it
  too, instead of measuring the headers alone: the widths can come from rows the grid had before (pro #6).
- **A source write and an `updateSettings()` call do not end the sweep.** Each drops the cached samples of what it
  changed (the written columns, every column), the forced render after it measures the on-screen columns, and the
  sweep samples the others afresh when it reaches them. Ending the sweep on each restarted it from its first column
  on the next draw with no samples left to replay, so on a 100k-row grid that took a write every 200 ms, or a
  wrapper that calls `updateSettings()` on every re-render, the on-screen columns past the first chunk were never
  measured. A change to a column the sweep has not finished marks it in `#sweepStaleColumns`
  (`#markSweepColumnStale()`, `#markPendingSweepColumnsStale()` for settings), and the sweep samples it again
  from its first row. A source write drops only the written columns' samples, so the rest of the sweep still
  replays its cache; a write the plugin cannot map to a column (a `data` function) drops them all.
- **An `updateData()` while a re-measure runs or is owed drops the samples cache.** An update that keeps the row
  and column count changes no index map, so the cache survives it and the sweep replayed the previous data's
  samples. The sweep goes on (a wrapper sends `data` on every re-render). Outside a re-measure the cache still
  survives `updateData()`, which is a gap in the refresh queue (DEV-2097), not in this sweep.
- **A column the grid lost costs no budget.** `processChunk()` skips a queued column past `countCols()` without
  counting it, so a shrink from 250 columns to 1 ends the sweep in its next idle task, not three tasks later
  (`inProgress` holds back `#refreshQueuedColumnsWidth()` meanwhile).
- **The font re-measure marks the merges' styles changed.** On the first load after init every column is sampled
  afresh, so no column reports a style change through `#replayedColumns`, and the merges kept the widths measured
  in the fallback font.
- **The sweep's cached-samples path adds the column to `#replayedColumns`.** `MergedCellsWidths` (DEV-548) reads
  that set in `#updateColumnWidthsMapBasedOnGhostTable()`: the same samples rendered to another width mean the
  styles changed (a web font is one), so the merges' kept widths are measured again at the end of the sweep.
- **An idle chunk on a hidden grid cancels the sweep.** The ghost table measures inside the root element, so a
  grid hidden after the sweep started (a tab switch) read a width of 0 for every remaining column and drew them at
  the minimum width once shown again. A re-measure is owed to the first render of the visible grid, and so is one
  for a cancelled sweep that overwrites every width (`recalculateAllColumnsWidth()` after `loadData()`), whose
  unreached columns would keep the previous data's widths; their cached samples are dropped first, since they can
  describe that data. A sweep that fills in missing widths leaves them missing, and a draw measures the on-screen
  ones like any width it lacks.
- **"On screen" is `#onScreenColumns()`: the frozen columns at both edges plus the master table's rendered range.**
  Once the grid is scrolled sideways, `getFirstRenderedVisibleColumn()` starts past the frozen band, so the
  rendered range alone would queue the frozen columns behind it.
- **A column with an entry in `#columnWidthsToRefresh` is sampled again, never measured from its cache.** An edit
  during the sweep is queued, and the queue holds the columns the sweep has not measured until it ends, so their
  cached samples predate the edit. The queued columns the sweep already measured are consumed on the next draw
  (`#refreshQueuedColumnsWidth()`): waiting for the end kept an edited on-screen column at its pre-edit width for
  as long as the sweep ran, since each draw replays the samples cached before the edit.
- **The sweep's own draw measures in one ghost table.** `calculateVisibleColumnsWidth()` hands the on-screen
  columns to `#calculateColumnsWidth()` with a predicate (overwrite the measured ones, fill in the pending ones),
  so the draw lays out one table and fits the merges once, not once per column.
- **`measuredColumns` is left alone.** It counts a prefix of the visual columns for `isNeedRecalculate()`, which a
  sweep in any order but ascending (viewport-first, or frozen end columns first) does not extend. The sweep checks
  the order of its queue itself (`isAscending`).

**Never pass `reuseSamples` to a sweep that follows a data change**: its cached samples describe the previous data.
Pinned by `tests/e2e/web-font-load.spec.ts` ("measures the first columns on screen at once...", "measures a frozen
column...", "samples a column edited while...", "draws nothing inside the afterFontsLoad hook", "re-measures a
column whose cell meta changed...", "draws after an idle chunk only when...", "stops measuring while the grid is
hidden...", "keeps a re-measure owed...", "finishes a re-measure that...", "finishes the sweep while updateSettings() calls...", "refreshes an edit of a column the sweep already measured...", "samples the new data of an updateData() call...", "re-measures the columns a hidden grid kept from the data before loadData()...", "re-measures once shown when a listener hides...", "re-measures the columns a sweep already measured...", "finishes the
sweep while source writes keep coming", "runs a listener added with the default order...", "re-measures a merge
whose text...", "re-measures the headers of a grid that had no rows...", "measures every column on screen on an
application render...") and `tests/e2e/sheets-bar-in-flight-work.spec.ts`
("skips the columns an update took away...").

## The sampling settings are re-read in `updatePlugin()`, and only a real change re-measures

`samplingRatio`, `allowSampleDuplicates` and `useHeaders` are applied in `#applySamplingSettings()`, called
from **both** `enablePlugin()` and `updatePlugin()`. Reading them in `enablePlugin()` alone is not enough:
that method returns early on an already-enabled plugin, and `BasePlugin` only re-runs the enable/disable pair
when the plugin's enabled state itself changed — so a plain settings change never reaches it. All three were
silently ignored when they arrived through `updateSettings()` (DEV-2850). Four rules ride along:

- **An update that omits this plugin's key keeps the stored settings.** `SETTING_KEYS` is `true`, so an
  update that never mentions `autoColumnSize` still reaches `updatePlugin()`. `BasePlugin#onUpdateSettings`
  then refreshes the plugin settings from `hot.getSettings()[PLUGIN_KEY]`, not from the payload, so
  `updatePlugin()` reads the user's `samplingRatio` and `useHeaders`, not the defaults, and an unrelated
  `updateSettings({ readOnly: true })` re-measures nothing. Before that fallback lived in the base class, this
  plugin restored the settings itself. **This is the common path:** the Vue wrapper omits every settings key
  whose value is unchanged (`wrappers/vue3/src/helpers.ts`, `simpleEqual`), so a Vue app sends a payload
  *without* `autoColumnSize` on virtually every prop change. Pinned by `__tests__/samplingSettings.unit.ts`.
- **Re-measure with `recalculateAllColumnsWidth()`, not `clearCache()`.** A bare clear empties every measured
  width, but the only render-time measurement is `calculateVisibleColumnsWidth()` — so every column outside
  the viewport would keep the default width until it is scrolled into view, shrinking the table width and the
  horizontal scroll extent. `#onAfterLoadData` is the model for "everything is stale". `AutoRowSize` can use
  its own `clearCache()` only because that method sets `#fullRecalculationScheduled`, which its
  `#onBeforeRender` honors; this plugin has no equivalent flag. The trade is that
  `recalculateAllColumnsWidth()` is a no-op on a grid that is not visible, which leaves the previous widths
  in place — the same limitation `#onAfterLoadData` already has, and a smaller wrong than a grid of default
  widths. It also clears `#columnWidthsToRefresh`, so the header-change entries queued earlier in
  `updatePlugin()` are not measured a second time in the same render.
- **A sampling change in the call that turns the plugin on again is measured too.** `BasePlugin` refreshes
  the plugin settings before `enablePlugin()`, so `enablePlugin()` applies the new sampling settings and the
  `updatePlugin()` of the same call sees no change. `enablePlugin()` therefore records a change it applied to
  a plugin that measured before (`#samplingChangedOnEnable`), and `updatePlugin()` re-measures for it once.
  The widths map survives a disable, so without it the widths measured under the old settings stayed.
- **Re-measure only on a real change.** `updatePlugin()` runs on *every* `updateSettings()` call, and the
  React and Angular wrappers re-send unchanged settings on every update (React on every commit). An
  unconditional re-measure would walk every column on each of them — which the `skipUnchangedWrites` rule
  below exists to avoid in the first place.
- **`useHeaders` is compared against `#appliedUseHeaders`, never against `ghostTable.getSetting()`.** The
  ghost table's copy is render-time scratch state that `#measureCellsWidth()` deliberately flips to `false`
  and restores in a `finally`. Reading it here would tie the change detection to that restore being perfect,
  and a future path that flipped it without restoring would report a phantom change and re-measure the whole
  grid on the next `updateSettings()`.

`samplingRatio` is resolved by `SamplesGenerator.resolveSampleCount()` rather than by each plugin, so all
three sampling plugins agree on what the option means — this plugin used to `parseInt` it while `AutoRowSize`
stored it raw. Anything that is not a whole number above zero resolves to `null` (the default). That guard is
not cosmetic: `parseInt` turned `true` and `[]` into `NaN`, and because `NaN !== NaN` the change check
reported a change on *every* `updateSettings()` call and never converged.

**`applySamplingOptions()` is the only way into those two options — do not add a per-option setter back.**
`SamplesGenerator` used to carry `setSampleCount()` and `setAllowDuplicates()`, and both were removed once
all three plugins moved to the shared method, because they wrote `customSampleCount` **raw**: a caller
passing `-1`, `2.5` or `'6'` could reach a state the plugins can no longer produce, which is exactly the
disagreement `resolveSampleCount()` exists to end. Removing them was safe rather than breaking because the
class is exported from no public entry point and the two plugins that expose the instance mark it
`@private` (`AutoRowHeaderSize` keeps it in a `#` field), so it is not in the published API surface.

`AutoRowSize` follows the same shape; its own `AGENTS.md` carries the note about the
`updateSettings`-does-not-recalculate contract this sits under.

## The refresh queue avoids full rescans (DEV-2097)

An edit does not automatically rescan its column. Changed cells are queued as width probes, and a full
rescan runs only when: it was asked for explicitly, there is no cached width to compare a probe against, or
so many cells changed that probing costs about as much as the rescan.

Three consequences:

- **An overgrown sample bucket is dropped whole, never trimmed.** The width determiner — the string that
  decides the column's width — can sit anywhere in a bucket, so trimming risks evicting it and rendering
  the column narrower than its content. Dropping the entry costs one full scan on the next re-measure.
- **A settings change invalidates the samples cache**, because settings can remap the data feeding it (a new
  `columns` definition, for instance).
- **The synchronous sweep's samples are dropped on purpose.** It runs inside the `init` / `afterLoadData`
  hook cascade, *before* other plugins re-apply their cell meta (MergeCells' `spanned`/`hidden`), so what it
  collected cannot be trusted for later re-measures. The cost shows on the first forced render after init: it
  re-walks every on-screen column over the whole row range (0.65 s on 100k × 20), and so did the first web-font
  re-measure until it moved to the chunked sweep above.

## The `afterLoadData` sweep relies on the Formulas plugin running first (DEV-2905)

This plugin has the lowest `PLUGIN_PRIORITY`, so at the default order its `afterLoadData` listener ran
before every other plugin's — including the Formulas listener that feeds the new data to the engine. The
sweep then measured formula columns against the *previous* dataset's results, and the engine's
`valuesUpdated` batch queued every changed cell, which `#refreshQueuedColumnsWidth` turned into a second
synchronous full rescan on the resume render: three measurements per column per `loadData()`. The Formulas
plugin now registers that listener at `orderIndex` -1 (its own `AGENTS.md` says why it moved rather than
this one), so the sweep sees fresh values and `recalculateAllColumnsWidth()` discards the queue.
`tests/e2e/sheet-switch-autosize.spec.ts` pins the count at `countCols() * 2` (the load sweep plus the
visible-columns walk). Keep this listener at the default order: AutoRowSize measures row heights against
this plugin's widths in its own default-order `afterLoadData` listener, and host `afterLoadData` callbacks
read `getColWidth()` — both expect the sweep to have run, which is what the plugin enable order gives them.

## The index map is `skipUnchangedWrites`

The `autoColumnSize` map holds numbers only, so re-writing an unchanged width must be a no-op — otherwise
it invalidates the column-width position cache, and every render re-measures the visible columns.

## Listeners stay bound while disabled — deliberately

`disablePlugin()` leaves the width-recalculation listener active, because ManualColumnResize's
double-click-to-autofit needs it even with `autoColumnSize: false`. Do not "clean that up".

Also: widths are kept unchanged when every row is deleted or trimmed, rather than collapsing to the header
width.

## Known concerns

- This plugin no longer asks the view to resize the overlays. It used to, beside `autoRowSize` and
  `hiddenColumns`, each with a `@TODO Should call once per render cycle` on it. Walkontable decides for
  itself now — see "The engine decides for itself when the overlays need resizing" in
  `../../3rdparty/walkontable/AGENTS.md`, and do not add the call back.
- `requestAnimationFrame` batching in the codebase is thin, and this is one of the few files using it.
- **`colWidths: null` names no width, on both sides.** `isEnabled()` reads it as unset (`!colWidths`), and
  `_getColWidthFromSettings()` returns `undefined` for a `null` width, so `getColumnWidth()` takes the measured
  size. It used to return the `null`, which `getColWidth()` passed through as a width and every column drew at
  the default 50px while the plugin reported itself enabled. The sheets bar writes `null` for a key only some
  sheets declare (its `undefined` baseline), so every sheet after one declaring `colWidths` was fixed at 50px,
  and an xlsx export from it wrote one-character columns. Pinned by
  `../sheetsBar/__tests__/settingsBaseline.unit.js`.
- **`hot._getColWidthFromSettings()` takes a VISUAL index.** It translates the index itself: the `colWidths` function gets the physical index, and the array is read at the entry the column was declared at (`core/columnSizeSettings.ts`, which keeps that entry when columns are inserted or removed), and it reads `getCellMeta(0, col)`, which also takes a visual index. Pass the visual column at every call site; passing the physical one translates twice and reads another column's width once columns are moved.

## Notes for docs

`scrollViewportTo()` computes scroll positions from column widths, so a grid with custom renderers or
styles that produce non-standard widths needs this plugin enabled or it scrolls to the wrong place. That
caveat is in the class JSDoc — keep it there.

## One sweep at a time, and never over replaced data

The columns past `syncLimit` are measured in idle tasks (`requestIdleTask`), and each sweep keeps its row range and
last column in its own closure. The plugin keeps the pending task in `#sweepTask`, and `#cancelSweep()` cancels it
when a new sweep starts, on `beforeLoadData`, and on a real disable or destroy (`updatePlugin()`
does not disable, so a wrapper re-render keeps the sweep). Before that, a sweep left running when the data was
replaced (a sheets bar switch away from a wide sheet) sampled cells the new data does not have, the ghost table kept a
column it never built, and every later render threw `Cannot read properties of undefined (reading
'getBoundingClientRect')`. Not on `updateData()`: the React wrapper sends `data` on every re-render, and nothing restarts the sweep after an `updateData()`. A re-render can still shrink the data between two idle tasks, so each chunk clamps the sweep's row and column bounds to `countRows()` and `countCols()` (`processChunk`); without it the sweep sampled columns the grid no longer had and broke the ghost table the same way. Pinned by `tests/e2e/sheets-bar-in-flight-work.spec.ts` ("leaves a wide sheet...", "...when an update shrinks the data").

## The first full measure stays on the `init` hook, on purpose

Every other plugin that parked init work on `init` or `afterInit` moved it to the ready step
(`onGridReady()`, `../base/AGENTS.md`). This one keeps its `init` listener. The steps run in
`PLUGIN_PRIORITY` order, so a step of this plugin would run at 10, before the plugins that build what it
measures: NestedHeaders (280) builds the header labels, MergeCells (150) the merges, and Pagination (900)
the page. Measured from a step, the columns would come out of empty labels again, the defect PR #14080
fixed. Every ready step now runs before the `init` hook, so `init` is the point where the other plugins'
state is in place and the first render has not run yet. AutoRowSize keeps its listener for the same reason.

## Where to look next

- Row counterpart: `../autoRowSize/AGENTS.md`. Row *header* widths: `../autoRowHeaderSize/AGENTS.md`.
- Storing user-dragged sizes instead of computing them: `../../utils/manualResize/AGENTS.md`.
- `GhostTable` / off-DOM measurement rules (the probe must mimic the real grid DOM exactly):
  `../../../AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.


## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoColumnSize'`
