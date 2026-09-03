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
  `disablePlugin()`.
- **The first rendered row gets +1px** to compensate for its `border-top-width`. That compensation is
  per-render, not baked into the cached height.

## `updateSettings` does not recalculate

Changing `wordWrap`, `textEllipsis` or a renderer changes row heights, but `updateSettings()` alone does not
re-measure. Callers must follow it with `recalculateAllRowsHeight()`. That is documented in the class JSDoc
and in the guides — it is the contract, not a bug.

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
