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

## `setCellMeta('borders', …)` written directly is supported

The value may be a complete plugin-shaped object (UndoRedo restoring an undone removal) **or** a partial
user-authored one such as `{ top: { width: 2 } }`. So it must not be required to carry the internal
`id`/`row`/`col` bookkeeping. It is routed through `prepareBorderFromCustomAdded` as a descriptor for the
write's coordinates; the canonical (complete, denormalized) object is written back to the meta, an
all-hidden result clears the cell, and the model entry is upserted — so meta and model cannot diverge.

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
