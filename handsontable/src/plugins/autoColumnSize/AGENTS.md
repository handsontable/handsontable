# AutoColumnSize plugin — measuring the widest cell per column

The `autoColumnSize` plugin sizes columns from their content. Read this before touching
`autoColumnSize.ts`.

Two facts to get right before anything else:

- **It is enabled by default.** `autoColumnSize: undefined` behaves like `true` (the opposite of
  `autoRowSize`, which is off by default). So a change here reaches every grid that never mentioned the
  option.
- **`PLUGIN_PRIORITY = 10`, the lowest of all plugins**, so it enables first and its `modifyColWidth`
  listener sits at the head of that hook's list.

## The measurement pipeline

`SamplesGenerator` collects sample values per column (bucketed by string length), `GhostTable` renders them
off-DOM with the real renderers, and the widest result is written to the `autoColumnSize` index map.

Rules that hold this together:

- **Sample with `getCellMetaTransient`, never `getCellMeta`.** The sampler sweeps the whole row range per
  column; the eager read permanently materializes one meta object per visited cell, which is O(rows × columns)
  retention on init. The transient read still resolves the full dynamic meta — hooks plus the `cells`
  function — so MergeCells' `hidden`/`spanned` flags work.
- **Format the value through `formatCellValue()`**, so the measured string is what the renderer will
  actually produce (cell-level `valueFormatter`, then the renderer's static). See the `renderCell.ts`
  bullet in `../../../AGENTS.md`.
- Cells covered by a merged cell carry `null` and are skipped — they contribute no sample.
- **The ghost table must be restored even when a custom renderer throws.** A throwing renderer that leaves
  headers disabled, or the probe's columns still attached, corrupts every later full-scan measurement.

## `syncLimit`, and what "sync" guarantees

`syncLimit` (a column count, or a percentage string) splits the work: those columns are measured *exactly*,
over the whole row range, **before the first paint**. Everything past the limit runs asynchronously in
`requestAnimationFrame` chunks. Do not move work out of the synchronous half to speed up init — the
`syncLimit` contract is that the first paint is correct for those columns.

The async loop must cancel its frame when the instance was destroyed mid-calculation.

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
  collected cannot be trusted for later re-measures.

## The index map is `skipUnchangedWrites`

The `autoColumnSize` map holds numbers only, so re-writing an unchanged width must be a no-op — otherwise
it invalidates the column-width position cache, and every render re-measures the visible columns.

## Listeners stay bound while disabled — deliberately

`disablePlugin()` leaves the width-recalculation listener active, because ManualColumnResize's
double-click-to-autofit needs it even with `autoColumnSize: false`. Do not "clean that up".

Also: widths are kept unchanged when every row is deleted or trimmed, rather than collapsing to the header
width.

## Known concerns

- `@TODO Should call once per render cycle, currently fired separately in different plugins` — this plugin,
  `autoRowSize` and `hiddenColumns` each trigger the same per-render work. Catalogued in
  `../../../.ai/CONCERNS.md`.
- `requestAnimationFrame` batching in the codebase is thin, and this is one of the few files using it.

## Notes for docs

`scrollViewportTo()` computes scroll positions from column widths, so a grid with custom renderers or
styles that produce non-standard widths needs this plugin enabled or it scrolls to the wrong place. That
caveat is in the class JSDoc — keep it there.

## Where to look next

- Row counterpart: `../autoRowSize/AGENTS.md`. Row *header* widths: `../autoRowHeaderSize/AGENTS.md`.
- Storing user-dragged sizes instead of computing them: `../manualResize/AGENTS.md`.
- `GhostTable` / off-DOM measurement rules (the probe must mimic the real grid DOM exactly):
  `../../../AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoColumnSize'`
