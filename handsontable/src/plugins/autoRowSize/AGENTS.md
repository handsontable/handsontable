# AutoRowSize plugin — measuring the tallest cell per row

The `autoRowSize` plugin sizes rows from their content. Read this before touching `autoRowSize.ts`.

It mirrors `../autoColumnSize/` closely — same `SamplesGenerator` + `GhostTable` pipeline, same `syncLimit`
split, same `skipUnchangedWrites` index map — so read that file's AGENTS.md too. What follows is only what
differs, and the differences are the part people get wrong.

## Four ways rows are not columns

1. **It is disabled by default.** `autoRowSize: undefined` behaves like `false`. AutoColumnSize is the
   opposite. So enabling this plugin is an opt-in performance cost, and the docs say so.
2. **Rows can only grow.** The source comment is blunt: *"For rows we must calculate row height even when
   user had set height value manually. We can shrink column but cannot shrink rows!"* A manually declared
   row height is a **minimum**, and the measurement still runs. Two code paths repeat that rule — keep them
   in step.
3. **A vertical scrollbar of the right size requires this plugin.** Without it the grid guesses row heights,
   so the scrollbar length and `scrollViewportTo()` are both wrong on any grid with multiline text or custom
   renderers.
4. **`allowSampleDuplicates` matters more here.** By default identical values are sampled once, on the
   assumption they render at the same height. That assumption breaks with multiline text and with renderers
   that vary height by row position — then one row's height gets applied to the rest. The trade is measuring
   more rows, which lengthens the blocking part of the calculation.

## The column-header height cache has a guard you must not remove

`modifyColumnHeaderHeight` reuses the cached header height unless the caller explicitly overwrites the
cache (full renders from data or settings changes do). Without that guard **every** render — including a
selection-driven one — re-samples the header row across all columns and forces a ghost-table reflow, even
when every height is already cached.

## Two DOM details

- **`htFirstDatasetColumnNotRendered`** is a class this plugin puts on the root element and must remove in
  `disablePlugin()`. It suppresses the inline-start border on the first rendered data cell, and since
  #6673 that border only exists when the grid has **no** row headers — with row headers the header
  owns the gridline and no cell behind it draws one, so the class is inert there. Do not read it as
  "column 0 has no border": ask the cell's computed border instead (see
  `handsontable/src/3rdparty/walkontable/AGENTS.md`, "Column-axis border ownership").
- **The first rendered row gets +1px** to compensate for its `border-top-width`. That compensation is
  per-render, not baked into the cached height.

## `updateSettings` does not recalculate

Changing `wordWrap`, `textEllipsis` or a renderer changes row heights, but `updateSettings()` alone does not
re-measure. Callers must follow it with `recalculateAllRowsHeight()`. That is documented in the class JSDoc
and in the guides — it is the contract, not a bug.

## Only a full render measures rows, and it measures only the visible band

`calculateVisibleRowsHeight()` hangs off **`beforeRender`**, which `TableView#render()` raises — the engine's
scroll draw does not. So scrolling measures nothing, and a render measures only the rows it draws. On an
ordinary grid that is invisible, because `#onInit` sweeps every row up front through `calculateAllRowsHeight()`.

Anything that empties the cache has to put that sweep back, or every row below the fold keeps the default
height for good. That is not a cosmetic default: once a wide wrapping column is scrolled into view the data
cell renders at its content height (a cell never renders shorter than its own text) while the row header
honors the default, so the row headers slide out of alignment and the gap accumulates down the grid
(DEV-2812, reported as DEV-2718).

`clearCache()` with no argument therefore sets `#fullRecalculationScheduled`, and `#onBeforeRender` honors it.
Three rules ride along:

- **The full sweep runs *after* `calculateVisibleRowsHeight()`, never instead of it.**
  `calculateAllRowsHeight()` measures only up to `syncLimit` rows synchronously and leaves the rest to an
  idle sweep that schedules no redraw of its own, so a grid scrolled past that limit would draw its visible
  band unmeasured — re-creating the defect on the frame that was supposed to repair it.
- **The flag is held, not consumed, when the render cannot measure.** `recalculateAllRowsHeight()` is a no-op
  on a hidden grid, and on a column-less one the measurement writes a near-empty height for every row that
  nothing later corrects (`calculateVisibleRowsHeight()` bails out on that grid for the same reason, with the
  comment "Keep last row heights unchanged for situation when all columns was deleted or trimmed"). Consuming
  the flag in either case would leave the cache empty permanently.
- **The flag is consumed before the sweep, then re-owed if the sweep throws.** Holding it across the call
  would let a re-entrant render reach the branch with the flag still set and recurse; spending it outright
  would leave every unmeasured row at the default height for the instance's life when a renderer throws (the
  ghost table runs the real renderers). Clearing it first and restoring it in a `catch` gets both.

`clearCache()` must **not** zero `measuredRows`: the public `isNeedRecalculate()` slices the height map by it,
so zeroing it makes that method answer "nothing to recalculate" at the exact moment every height was dropped.
`AutoColumnSize#clearCache()` leaves its counterpart alone too.

The **selective** forms — `clearCache([rows])` and `clearCacheByRange()` — have the same below-the-fold hole,
and close it differently: they push the cleared rows onto `#visualRowsToRefresh` through
`#queueClearedRowsForRefresh()`, so only those rows are re-measured rather than the whole grid.
`#calculateSpecificRowsHeight()` reads a row from the data, so an off-screen row is no obstacle. That queue is
drained in one synchronous pass, so clearing a very large range buys a correspondingly large measurement on
the next render — the same shape `#onBeforeChange` has always had, and the honest cost of the call the caller
made. A physical row with no visual index (outside the dataset, or hidden by a trimming map) is skipped.

## One sweep at a time

`calculateAllRowsHeight()` cancels any sweep still in flight before starting its own, through the
instance-held `#idleSweepTimer`. Every sweep starts at row 0 and covers every row, so the new one subsumes
whatever the old one had left. Two running together would double the work and race on `inProgress`: whichever
finished first would clear it while the other was still writing heights, and `#onBeforeRender` reads that flag
to decide whether the refresh queue is safe to drain. Entry points that can overlap in one frame: `#onInit`,
`#onAfterLoadData`, the column-resize gesture, an explicit `recalculateAllRowsHeight()`, and now a
`clearCache()` that schedules one.

## Listeners stay bound while disabled — deliberately

`disablePlugin()` leaves the height-recalculation listener active, because ManualRowResize's
double-click-to-autofit needs it even with `autoRowSize: false`.

Heights are also kept unchanged when every column is deleted or trimmed.

## Where to look next

- The shared pipeline, sampling rules and refresh-queue behavior: `../autoColumnSize/AGENTS.md`.
- Row *header* widths, which run their own sampler on column `-1`: `../autoRowHeaderSize/AGENTS.md`.
- Storing user-dragged heights instead of computing them: `../manualResize/AGENTS.md`.
- Merged-cell interaction has its own spec: `__tests__/mergeCells.spec.js`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoRowSize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='rowHeightsInteraction'`
