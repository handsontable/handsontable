# CustomBorders plugin — per-cell border styling

The `customBorders` plugin puts borders on individual cells. Read this before touching `customBorders.ts`
(1.9k lines) or `utils.ts`.

The plugin has **two representations of the same fact**, and almost every bug here is the two disagreeing:

- **the model** — `savedBorders`, plus a row index over it, which `getBorders()` reports;
- **the cell meta** — `getCellMeta(row, col).borders`, which is what persists and what UndoRedo restores.

## The invariant: cell meta first, model second

A cell meta write is **vetoable** (`beforeSetCellMeta` / `beforeRemoveCellMeta`), so the ordering rule is
absolute:

- **Write the meta first.** A vetoed write must not reach the model — otherwise `getBorders()` reports a
  border that `getCellMeta().borders` knows nothing about, and clearing the model later tries to remove a
  meta key that was never written.
- **Remove the meta first, too.** A blocked removal leaves the cell's `borders` meta in place; dropping the
  border from the model anyway leaves the two disagreeing.
- **The one exception is an undo or a redo.** UndoRedo restores the `borders` meta from its journal
  before it calls `restoreState()`, so `#rebuildModelFromMeta()` only fills the model
  (`insertBorderIntoSettings()`) and writes no meta. Going through `prepareBorderFromCustomAdded()` there
  fired the meta hooks once per bordered cell, and a listener that vetoes border writes on locked cells
  dropped the border from the model while the meta kept it.
- **A cell whose write is vetoed is skipped entirely**, so the model never gets ahead of the meta.
- **Sample the veto flag *before* the write.** A `runOnce` veto listener removes itself the moment it fires,
  so probing afterwards reads `false` for a write that was in fact vetoed.

## Rendering is virtualized — the model is not the DOM

`setBorders()` and friends update **only the model**. `#syncViewportSelections` materializes the rendered
custom selection on the next view render, and only for borders inside the rendered range. That is what makes
the plugin scale: border DOM exists for the viewport, not for every bordered cell.

Consequences:

- **The working window is the union of the frozen areas and the master rendered range.** Frozen rows and
  columns are drawn by the overlay clones even when the master range excludes them.
- **A style edit must drop the cell's currently rendered selection.** The border id is coordinate-based and
  unchanged by a style edit, and the sync only adds/removes *by id* — without the drop it keeps the stale
  selection.
- **`place` is accepted for backward compatibility only.** It no longer drives an incremental per-side
  toggle; the sync rebuilds the visible selection from the already-updated model, which carries the final
  side styles.
- **Patch the row index for the one changed border, never invalidate it wholesale.** Marking it dirty makes
  the next render rebuild it from the whole of `savedBorders`, so a progressive load — which renders once
  per batch — rebuilds a growing array once per batch: O(borders² / chunkSize) over the load, in the exact
  path the batching exists to speed up.
- **After a model-only change, render.** `setCellMeta` does not render, and the model update already dropped
  the previous rendered selection, so without a render the old border DOM is gone and the new one waits for
  some unrelated render — the cell appears to lose its border.

## Merging: a descriptor means "update these sides"

`#buildRangeCellBorder` starts from the cell's existing borders and layers the descriptor on top, so sides
the descriptor does not mention are kept and **overlapping ranges accumulate their sides in the model**.

With no descriptor the border stays all-hidden, which is the "clear this cell" intent: **when every side is
hidden the border is removed entirely** — dropped from the model and from the cell meta — rather than stored
as an all-hidden object.

The merge base describes **this** cell regardless of the bookkeeping fields the stored meta carries. Those
can be stale when the meta is a detached snapshot — UndoRedo restoring borders captured at pre-shift
coordinates is the case that matters.

**Any record is a merge base, not only a plugin-shaped `BorderObject`.** Cascaded or partial
`borders` from column or cell meta carry no `id`/`row`/`col`. Requiring those fields
(`isBorderObject`) dropped the sides the user authored: `setBorders` then wrote hidden
defaults over them (DEV-2513). `#mergeBaseFromExisting` starts from `createEmptyBorders` and
layers `normalizeBorder` of the existing record, matching the `afterSetCellMeta` path.
Viewport-driven seeding of cascaded borders that `setBorders` never touched is a separate
follow-up (#13166).

A progressive load keeps **one** first-touch tracking `Set` across all its batches, so overlapping ranges
split across batches still merge correctly. A plain synchronous call owns and clears its own.

## Structural changes: three rules

- **Flush an in-flight progressive load from the `before*` hook, not the `after*` one.** The core shifts the
  cell meta before it fires the `after*` hooks, so a late flush writes `borders` meta onto post-shift cells
  the configuration never targeted.
- **Do not render from `afterCreateRow` / `afterCreateCol` / `afterRemove*`.** Those fire from inside
  `alter()`, before it finishes rewriting the headers, and `alter()` renders when it is done. A forced
  mid-`alter()` render paints a header row the closing render then treats as up to date, so labels stay
  bound to their pre-insert columns while the new column is appended at the end — clicking a header then
  selects a different column than the label sits on (#11031).
- **Skip the shift for auto-inserted rows and columns.** `minSpareRows` / `minSpareCols` append at the end
  and do **not** shift cell meta in the core (`DataMap#createCol` skips `metaManager.createColumn` when
  `source === 'auto'`), so shifting the model would diverge from the meta.

## A shrinking `loadData` leaves the model addressing cells that are gone

The plugin registers **no `afterLoadData` hook**, so `loadData` (and `updateSettings({ data })`,
which routes to `updateData`) replaces the dataset while `savedBorders` keeps the previous grid's
coordinates. Nothing renders them - `#syncViewportSelections` only materializes borders inside the
rendered range - but `#resetBorderModel` walks the whole model into
`#writeBordersMeta(row, col, null)`. On 8x8 data bordered at `{ row: 7, col: 7 }` followed by a 3x3
`loadData`, `updateSettings({ customBorders: [] })`, `updateSettings({ customBorders: [in-range
entry] })` and `clearBorders()` all threw `Assertion failed: Expecting an unsigned number` - a
pre-existing defect, reproducible on released 18.1.1.

**`#resetBorderModel` therefore walks the META, by the physical coordinates it is stored under, and
never the model.** The model keeps the VISUAL coordinates a border was set at, and they stop naming
that record as soon as rows are sorted, moved or trimmed. Replaying them into `removeCellMeta` (the
first fix for the throw above, after `Core#removeCellMeta` learned to read an out-of-range index as a
raw physical one) cleared the wrong record or none: sort, set a border, filter its row out, and
`clearBorders()` emptied the model while the `borders` meta stayed on the record - the grid stopped
painting the border, the XLSX export still wrote it, and an unrelated undo (which rebuilds the model
from the meta) painted it again. Each `borders` entry from `getUserDefinedCellMetas()` is now
resolved to its CURRENT visual coordinates and removed through `#writeBordersMeta` (so a
`beforeRemoveCellMeta` veto still works); a record with no visual index (trimmed, or past a shrunk
dataset) is removed through the internal `Core#_removeCellMetaByPhysicalIndex`, which is journaled
for undo like `removeCellMeta` but fires no meta hook, because those hooks carry visual coordinates.
The model is then rebuilt from whatever meta survived (`#rebuildModelFromMeta`), so a vetoed border
keeps its entry at its current coordinates. Pinned by `__tests__/clearBordersTrimmedRows.unit.js`.

**The reset walks the meta once.** `#resetBorderModel` collects the `borders` entries, removes them,
and hands only the vetoed survivors (their values read again from `getCellMetaIfExists`) to
`#rebuildModelFromMeta(bordered)`, so a clear does not walk `getUserDefinedCellMetas()` a second
time. The walk is still O(every user-defined meta key) - a physical-index `Set` of bordered records is
the follow-up. The `row < countRows() && column < countCols()` clause is load-bearing: after a
lowered `maxRows` / `maxCols`, `toVisualRow()` answers an index the grid no longer counts, and
`removeCellMeta` would read it as a raw physical index and leave the meta on the record. Pinned by
the two "lowered maxRows / maxCols" cases in `clearBordersTrimmedRows.unit.js`.

The removal is not cosmetic on the `updateData` path. Core drops the cell meta only in `loadData`
(`metaManager.clearCellsCache()`); `updateData` - and therefore `updateSettings({ data })` - keeps it
by physical row. So after a shrink through `updateData`, a reset, and a regrow, the old `borders`
meta is still on a live cell unless the reset actually clears it, which is the state this file's
`getBorders()`/`getCellMeta().borders` rule forbids.

**The `afterLoadData` hook was deliberately NOT added.** The core clears cell meta on `loadData` and
keeps it on `updateData`, so a hook that cleared the model would remove borders the user still sees
after a same-size `loadData` - a visible behavior change with no ticket behind it. A hook that only
pruned out-of-range entries would be redundant: `#resetBorderModel` is the single place that clears
the `borders` meta wholesale, and it covers every caller (`clearBorders()`,
`changeBorderSettings()`, `updateSettings`). Pinned by `__tests__/shrinkingLoadData.unit.js`, which
covers the bottom-only, right-only, corner and exact-boundary (`row === countRows()`) shapes, a
same-size control proving an in-range entry still has its meta removed, and the `updateData`
shrink -> reset -> regrow regression. The core rule itself is pinned by
`src/__tests__/core/removeCellMeta.unit.js`.

## A filter or a trim rebuilds the model from the meta

The plugin listens to `afterFilter`, `afterTrimRow` and `afterUntrimRow` (the trim hooks only when
`stateChanged`) and rebuilds the model from the `borders` meta (`#rebuildAfterIndexChange`). **Behavior
change (DEV-3011): after a filter or a trim, a border follows its record** - `getBorders()` reports it at
the record's current visual row, and the border is painted there - instead of staying at the visual row it
was set at, which by then held another record. Two defects drove it:

- **A ghost border through undo.** `restoreState` rebuilds the model from the meta but skips a record
  with no visual index, so `clearBorders()` under a filter (or a trim) that hid the row, then `undo()`,
  put the meta back with no model entry. When the row came back nothing rebuilt the model: nothing was
  painted, `getBorders()` was empty, and the XLSX export still wrote the border.
- **A range clear missed the record.** After a sort and a filter, the model painted the border at its
  stale visual row; `clearBorders([[row...]])` of what you see removed the model entry and left the meta
  on the record.

Hidden rows (`hiddenRows`) keep their visual indexes, so `afterHideRows` needs no rebuild. Sorting and
row moves are not covered by this rebuild. A progressive load still in flight is flushed first, so the
rebuild (which cancels the load) cannot drop its pending batches. The trim plugin does not render after
its hooks, so the trim path schedules a render; `filter()` renders right after `afterFilter`. Each
rebuild walks every user-defined meta key, once per filter or trim. Pinned by the filter, trim and
sort-plus-filter range-clear cases in `__tests__/clearBordersTrimmedRows.unit.js`.

## A progressive load is never an undo step

Every `borders` meta write goes through `setCellMeta()`, which opens an operation of its own. So both
progressive paths write under `operationScope.suppress()`: a batch run from the timer
(`#processProgressiveChunk`) would otherwise record one undo step per bordered cell, and the flush
(`#flushProgressiveApply`) runs from a user action's `before*` hook, so its writes would join that
action's step - an undo of the row insert that finished the load then removed the borders it wrote.
Pinned in `../undoRedo/__tests__/pluginState.unit.js` ("a progressive border load").

## `setCellMeta('borders', …)` written directly is supported

The value may be a complete plugin-shaped object (UndoRedo restoring an undone removal) **or** a partial
user-authored one such as `{ top: { width: 2 } }`. So it must not be required to carry the internal
`id`/`row`/`col` bookkeeping. It is routed through `prepareBorderFromCustomAdded` as a descriptor for the
write's coordinates; the canonical (complete, denormalized) object is written back to the meta, an
all-hidden result clears the cell, and the model entry is upserted — so meta and model cannot diverge.

## `width: 0` is a real value

Walkontable honors an explicit `width: 0` (DEV-1137). See `../../3rdparty/walkontable/AGENTS.md`
("Custom border `width: 0` is a real value").

## `left`/`right` vs `start`/`end`

`normalizeBorder()` translates the legacy `left`/`right` into the logical `start`/`end` that Walkontable's
Border API wants; `denormalizeBorder()` adds `left`/`right` back for backward compatibility. **Both names
stay in the public API forever** — `backward-compatibility.spec.js` pins that. `resolveRangeBorderSide()`
drops `cornerVisible`, which describes the selection corner rather than an individual side.

## Known bugs, deliberately encoded in the tests

`../../../.ai/CONCERNS.md` catalogues 14+ TODO comments in this plugin's specs asserting known-wrong
behavior — `isEnabled()` returning the wrong value after `updateSettings({ customBorders: false })`,
`countCustomBorders()` counting redundant invisible borders (`10 * 5` where `5 * 5` is expected), and one
flaky spec where `getCellMeta(0, 0).borders` is sometimes `undefined`. **When you fix one of these, the spec
breaks** — that is expected; update the assertion and reference the issue.

## Where to look next

- The rendered border primitive: `../../3rdparty/walkontable/AGENTS.md` (custom selections / Border).
- Menu entries: `contextMenuItem/` (`top`, `bottom`, `left`, `right`, `noBorders`), wired via
  `../contextMenu/AGENTS.md`.
- Snapshot/restore behavior: `../undoRedo/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='customBorders'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='customBorders'`

`__tests__/` has separate `hidingColumns.spec.js`, `hidingRows.spec.js`, `borderStyle.spec.js`,
`backward-compatibility.spec.js` and `rtl/` — the hiding and RTL specs catch most regressions here.

## `fixedColumnsEnd` joins the working window

`#syncViewportSelections` passes the real end count to `isIndexInViewportUnion()` (the `fixedColumnsEnd` setting,
read through `hot.view.countFixedColumnsEnd()`, so the start columns keep the priority). The end clone renders the last
columns even when the master range is far from them, exactly like the start clone, so a border on an end column
has to be in the working set or it is never drawn. Pinned by `tests/e2e/fixed-columns-end-plugins.spec.ts`.
