# MergeCells plugin — spanning cells across rows and columns

The `mergeCells` plugin merges a rectangular range into one visible cell. Read this before touching
`mergeCells.ts` (2.1k lines), `cellsCollection.ts`, `focusOrder.ts`, `cellCoords.ts`, `renderer.ts`,
`utils.ts` or anything in `calculations/` and `contextMenuItem/`.

## Read `colspan` / `rowspan` from cell meta, never from the DOM

```js
const { colspan, rowspan } = hot.getCellMeta(row, col);   // authoritative
```

The DOM attributes only describe cells that are currently rendered. The meta is authoritative regardless of
viewport state. This is the single most repeated rule about this plugin, and it is in the root
`../../../AGENTS.md` for that reason.

## The lookup matrix is the authority on visibility — not the merge list

`cellsCollection.ts` keeps two structures, and they can disagree on purpose:

- **`mergedCells`** — the list of declared merges. It keeps entries whose whole visible span is hidden, and
  **their visual coordinates may be stale.**
- **the lookup matrix** — purged of merges that are fully hidden. **This is what you query for visibility**
  (`getWithinRange`, and the two other sites that repeat the comment).

Reading visibility off `mergedCells` is the bug this split exists to prevent.

Two line-scan helpers encode the rest of that logic: the first merge-touched line (in scan order) whose
cells all agree on a single index at or past `visualIndex`, and the first merge-**free** line at or past it
(which always emits its own index — cells covered by no merge contribute their line's own index).

## The anchor is the merge; its visual coordinates are derived

Every merge carries an **anchor** (`#mergeAnchors` in `mergeCells.ts`): the list of **physical rows** it
covers plus its physical left column. That is the authoritative description — physical indexes survive
trimming and reordering. The merge's own `row`/`col`/`rowspan` are re-derived from it on every
`rowIndexMapper` `cacheUpdated`, so treat them as a snapshot of how the merge currently *draws*, not as
what it owns.

**`mergeSelection()` is one operation, and so one undo step.** It unmerges the merges inside the range
(`unmergeRange(…, true)`) before it merges the range, and each of those opens its own operation. Left
unwrapped, the two became two steps: one `Ctrl`+`M` over existing merges took two undos (DEV-160,
DEV-514). A nested operation's `describe()` is ignored, so the outer operation describes the step
itself through `#describeMerge()` - the same `cellRange` and `data` fields `mergeRange()` attaches.
Any new method that calls two mutators must wrap them the same way.

Undo and redo carry the anchors too: `captureState()` returns every merge with its anchor, and
`restoreState(state, context)` applies only what the step changed: it removes the live merges listed on
the other side of the step but not in `state`, adds the ones `state` lists that the other side did not,
and sorts the list back into the order `state` gives it. A merge made outside any step - for example by
`updateSettings({ mergeCells })` after the step - therefore survives the undo. It falls back to
rebuilding the whole collection from `state` when there is no `context.other`, when the replay reset the
row order (`context.reordered`), when a merge to remove is not the one the lookup finds at its
coordinates, or when a merge to put back overlaps a live merge the step did not make - `add(…, true)`
skips the overlap check, so the diff path would stack a recorded merge on top of one a settings update
made on the same cells. Either way it re-attaches the anchors, re-anchors onto the visible rows and marks every
cell changed. Each captured merge also carries `physicalColumns`, the physical column of every column
it spans at capture time, for `getStateColumns()`: the UndoRedo check of a `columns` settings update
drops a merge step only when a column one of its changed merges covers shows another field. Without
it the step (and every older one) dropped on any field change. The anchor cannot answer that: it
holds the first column only, and the column order may have changed since. Match a merge to its own anchor by the merge object, never
through `mergedCellsCollection.get()` - that answers for every covered cell, so after a removal has slid
another merge onto those coords the lookup hands back the wrong object.

A merge whose rows are all trimmed is restored with `addOutsideMatrix()`, not `add()`: its coordinates
are stale, a visible merge can be drawn there now, and `add()` turns away a merge whose top-left is
taken - so a purged merge that came first in the list dropped the visible one for good. For the same
reason the matrix footprint removal (`#removeMergedCellFromMatrix`) deletes only entries that point to
the merge being removed: purging a merge at its stale coordinates used to erase the entries of the
merge drawn over them. Both halves are pinned by one spec in `../undoRedo/__tests__/undoRedo.unit.js`
(`merges restored while rows are trimmed`), and dropping either turns it red.

`captureState()` runs on every operation, the internal `batchExecution()` calls of the render path
included, so it first compares the live merges with the list it returned last time, in place, and
allocates a new list only when one differs. Do not replace that with a version counter: the merge objects
are shifted in place from many sites, and one missed bump records a stale list with no error.

The rows are an explicit list, not a `{ start, length }` range: merging on a sorted grid, or over a row a
filter has hidden, gives a merge whose physical rows are not consecutive.

## Trimming re-anchors a merge, and clips it

The plugin listens for the **row trimming map** changing — Filters, `trimRows`, a NestedRows collapse — so
a merge whose rows get trimmed follows the rows that stay visible. Two things happen, and the second one
is the part that is easy to get wrong:

- the merge moves to the visual position of the first of its rows that is still visible, and
- its `rowspan` shrinks to the **number of its rows that are still visible**.

**The anchor's row list is ordered by visual position, and every structural edit must preserve that.**
That invariant is what makes "first in the list" mean "the top-left". The list is captured in visual
order, so on a descending sort it runs the other way to the physical indexes — and `#remapRowAnchorsAfterInsert`
therefore *splices* the rows an insert grew a merge by into their visual place rather than appending them.
Appending was a real defect: a grown row that sits visually above the ones already listed ended up last,
and once the head was trimmed away the merge re-anchored onto the wrong row.

Do **not** "simplify" the derivation to take the smallest visual index instead. It looks equivalent and is
not: it also re-anchors merges on a *sorted* grid, where the head of the list is the row that was the
top-left when the merge was made. Pulling every merge up to its highest visible row lets two merges whose
rows a sort interleaves collide in the lookup matrix — measured on the merged-cells demo, and pinned by
`should not let a sort pull two merges onto the same rows in the lookup matrix`. `relocateInMatrix` has no
overlap guard (unlike `add`, which runs `isOverlapping`), so the second footprint silently wins.

The span is one continuous block downwards from that top-left, so a merge whose visible rows are
non-contiguous in the visual order (sorting or a row move, never trimming alone) can still cover foreign
rows. That is pre-existing and unchanged.

The clipping is not cosmetic. A trimmed row has no visual index at all, so the visual row space is
compressed; a merge that kept its declared span would reach past its own rows and onto whatever sits
below, and two merges would claim the same rows in the lookup matrix. Hidden rows are different — they
keep their visual index, so they do not shrink the span here, and the renderer clips them out of the
rendered `rowspan` instead.

A merge is never dropped because its rows were trimmed. When none of them is visible it is purged from
the matrix but kept in the list, and it comes back whole once its rows do. Removing the last *visible*
row of a partly trimmed merge does not delete it either: `#onAfterRemoveRow` remaps the anchors first,
then drops the merges whose anchor is now empty itself and forbids `shiftCollections` to drop any of the
rest. The decision cannot be left to the shift: it reads the merge's *visual* coordinates, which for a
merge purged while all of its rows were trimmed are stale, frozen at the moment it was purged.

**Resetting a dropped merge's cell meta reads the anchor AND the drawn block, never `row`/`rowspan`
alone.** `#resetMergedCellMeta` runs for every merge `clearCollections()` drops (every
`updateSettings({ mergeCells })`, disabling the plugin, and SheetsBar's merge restore on a sheet switch)
and for every merge `unmergeRange()` drops (the context menu, `Ctrl`+`M`, `unmerge()`, UndoRedo). A merge
purged because all of its rows are trimmed keeps stale visual coordinates: with every row filtered out they
address no row, so `removeCellMeta` threw `Expecting an unsigned number` (DEV-3135, a regression from
#12798 in 18.1.0); with some rows filtered out they address whatever record the trim slid into place, and
wiped that record's own `copyable: false`. The anchor alone is not enough either: after a sort, the block a
merge draws covers other records' rows, and `afterGetCellMeta` stores `hidden`/`copyable` on those too. So
the rows are `anchor.physicalRows` plus, while the merge is not purged, the rows under its drawn block.
`hidden`/`copyable` are removed from every one of those cells. The span keys (`spanned`, `rowspan`,
`colspan`) are removed from the current top-left cell unconditionally, as before, and from any other
left-column cell only where its **stored** meta owns them (`getCellMetaIfExists`, never materialized) —
`afterGetCellMeta` writes them on whichever cell is the visible top-left when it runs, which after a
re-anchor is not the original one, but is always in that column. Removing them from every left-column row
fired `afterRemoveCellMeta` 21 times for a 3x2 merge where `develop` fires 15; pinned at 15. A trimmed row
has no visual index, so its meta is removed through `_getMetaManager().removeCellMeta()` by physical index,
and the `before`/`afterRemoveCellMeta` hooks do not fire for it. SheetsBar therefore does not track
`hidden`/`spanned` at all (its `UNTRACKED_META_KEYS`): a tracked copy would come back after that hookless
removal. Pinned by `__tests__/trimmedMergeMetaReset.unit.js`.

**A record a merge stops drawing over is cleaned when the mapping changes, not when the merge is
dropped.** The reset above cannot reach a record the merge drew over (after a sort) once a trim has purged
the merge: a purged merge has no drawn block, and its stale coordinates may name another record by then.
So `#onBeforeRowIndexCacheUpdate` records, while the mapping still describes the screen, the drawn rows
each merge does not own (`#collectForeignDrawnRows`), and `#onRowIndexCacheUpdated` removes
`hidden`/`copyable` from those the re-anchor moved the block off (`#clearRowsLeftBehind`, meta manager, no
hooks). The recording is discarded when the physical row count changed — an insert or remove renumbers
the physical rows it holds. It costs one pass over each merge's drawn rows per mapping change, next to the
re-anchor's pass over its anchor rows. A nested `updateCache` overwrites the outer recording, so the outer
update then cleans nothing: a missed cleanup, never a wrong one. **Known limit:** like the unmerge reset,
the cleanup removes `copyable` outright rather than restoring what was there before. A value the user set
on such a cell through `setCellMeta` (`copyable: false`, say) is therefore lost once a sort passes a merge
over the cell and a later sort or `clearSort()` moves it off: `afterGetCellMeta` has already overwritten it
while the merge covered the cell, and the cleanup then deletes the key, so the cell reads the column or grid
value again. A value set through the `cells` or `columns` option survives, because the removal only drops
the cell's own key. Restoring the user's value would mean remembering it before that overwrite, which runs
on every meta read — not done.

**While rows are trimmed, `updatePlugin()` keeps the merge of an area it cannot place.** Settings describe
visual positions. An area that fits the rows on screen is applied to them, exactly as before and as the
guide documents (values a filter brought under it are cleared) — an application that computes its merges
from the rows on screen sends the same areas after filtering, and they must land there. An area whose rows
reach past the visible rows (`row + rowspan > countRows()`, while it still fits the whole data) cannot be
placed: validation used to drop it with an out-of-bounds warning — every merge, when every row is
filtered out, and the React and Angular wrappers re-send unchanged settings on every commit. Such an area's
merge is kept when the area was applied before AND the merge still sits on the rows it was created on.
`#mergeAreas` records, per merge object, the area key and the anchor's footprint (`#getAnchorFootprint`)
when `generateFromSettings()` created it; a row insert or remove remaps the anchor, the footprint no longer
matches, and the area goes back through the settings like any other. `#takeKeptMerges` takes the kept
merges out of the list **before** `disablePlugin()`, so their meta is not reset and nothing is written to
their cells; `#restoreKeptMerges` puts the same objects back (`MergedCellsCollection#restoreMerges`, list
only), flags them purged and re-anchors them **before** `generateFromSettings()` applies the other areas.
`filterOverlappingMergeCells` reads what is occupied from the **lookup matrix**, not the list, so a kept
merge whose rows are all trimmed (purged, stale coordinates) does not reject a new area on screen, and a
partly visible one does. So one re-sent array can mix two readings — an area that fits is placed on the
rows on screen, one that does not keeps its records — and the guide spells that out. A merge a row or
column move replaced is a new object with no recorded area, so it goes back through the settings.

The row insert/remove hooks mirror the physical renumbering onto the anchors themselves rather than
re-deriving them from the merges. They have to: the index mapper emits its cache update **before**
`afterCreateRow`/`afterRemoveRow`, so by the time those hooks run a re-anchor has already gone round once
against a grid whose row count changed while the merges had not been shifted yet.

## A row move that splits a merge distributes its trimmed rows

A row move can leave a merge's rows in more than one contiguous visual run, and `translateAfterAxisMove`
then replaces the merge with one fragment per run. A trimmed row has no visual index, so it belongs to no
run, and the rule that places it is: **it travels within its run of the row index sequence, and that run's
trimmed rows go to the run's first visible row.** A run here is a maximal set of the merge's *own* rows
with no other row between them in the sequence, cut by `#groupRowsBySequenceRuns`.

The run, not the row, is what the answer turns on, and both halves of that matter.

- **A trimmed row must never be paired across a row the merge does not own.** The span is one continuous
  block from its top-left, so an anchor pairing rows across a foreign row cannot be drawn: once trimming is
  lifted the block covers that foreign row and stops short of the merge's own row beyond it. Nearest-in-
  sequence without this check shipped that defect — a 12-row grid, `{ row: 2, rowspan: 5 }`, `trimRows([3,
  4, 5])`, `moveRow(6, 3)` produced a fragment covering physical 9 while leaving the merge's own physical 6
  outside it. Pinned by `should not send a trimmed row across a row the merge does not own when a move
  splits it`. A run with no visible row cannot be placed at all, and its rows are dropped.
- **Distance inside a run is deliberately not measured.** A run contains no foreign row, so its visible
  rows are visually adjacent and always land in the *same* fragment — a nearest-carrier rule would compute
  a choice nothing can observe, and its tie-break would be a branch no test could pin. Do not add one back.

The *sequence*, not the physical index, is what defines a run. `IndexMapper#moveIndexes` removes the moved
rows from the full sequence and re-inserts them at a position computed among the rows that are **not**
trimmed, so every row it did not move keeps its slot — which makes the sequence exactly the order the rows
take once trimming is lifted. Physical distance answers nothing here: a trimmed row usually sits one
physical index from two of its neighbors, so the distance ties, and it does not see the move at all.

Three parts of `mergeCells.ts` carry this, and each has a reason that is easy to undo by accident.

- **The attribution is computed in `#onAfterRowMove`, not `#onBeforeRowMove`.** It reads the sequence the
  move produced. `#planRowMoveTranslation` runs before `translateAfterAxisMove` replaces the merge objects,
  because it is keyed on the merges that still exist.
- **The plan is skipped unless a merge exists and a row is trimmed.** `#buildRowSequencePositions` walks
  the whole row sequence, which is real allocation per drop on a large grid, and with nothing trimmed the
  answer is the one the old path already gave: a fragment draws exactly the rows it owns. `nestedRows` is
  the reason to keep the guard cheap rather than clever — its `rowMoveController` reorders the source data
  and fires `afterRowMove` by hand while its `beforeRowMove` returns `false`, so `moveIndexes` never runs
  and the sequence the plan would read is the pre-move one. Nothing splits on that path today, so the plan
  is never read there; do not start depending on it without a spec for that path.
- **The split is read from the plan, never from how many fragments came back.** `#countVisualRuns` counts
  the runs through `MergedCellsCollection.detectContiguousRuns`, the same helper the split uses, so the two
  cannot disagree. Counting fragments is wrong for a merge broken into a real run plus a single cell: the
  collection drops the single cell, one fragment comes back, and carrying the whole anchor onto that
  survivor would hand it the dropped fragment's rows as well.
- **`#reanchorFragmentsAfterSplit` sorts each fragment's rows by sequence slot, and that sort is
  load-bearing.** When a trimmed row's nearest carrier sits *below* it, appending leaves the carrier at the
  head of the list, and the re-anchor reads the head as the top-left — so the merge would come back one row
  too low, over a row it does not own. Same defect `#remapRowAnchorsAfterInsert` avoids by splicing rather
  than appending.

**A merge whose rows a sort scattered is excluded from all of this, and `#describesOwnRows` is what
excludes it.** The split cuts its fragments out of the merge's *drawn* block, and for a scattered merge that
block reaches over rows it does not own — so a fragment can be made of foreign rows, and the sort above
would then pull that fragment's head onto one, which is exactly the collision `#sortVisibleRowsByVisualOrder`
refuses (and `relocateInMatrix` has no overlap guard to catch). The two inputs disagree only for this shape:
`isSplit` is measured on the drawn block, the attribution on the owned rows. So such a merge is reported
unsplit, falls through to the guarded single-fragment path, and keeps the behavior it had before any of
this — re-anchored from what is visible, trimmed row lost. Pinned by `should leave a merge whose rows a sort
scattered on the unsplit path when a row move breaks its block`; deleting the guard turns that spec red.

## A fragment that draws one cell but owns trimmed rows is not a singleton

`translateAfterAxisMove` drops a `1x1` fragment because a single cell is no longer a merge. That is wrong
for a fragment whose other rows are merely trimmed: it is a merge again the moment they come back. So
`#onAfterRowMove` passes `retainedIndexes` — **per merge**, `Map<MergedCellCoords, Set<number>>`, never one
flat set: two merges in different columns can cover the same rows, and a shared set would keep the
genuinely-single fragment of the merge that carries nothing, leaving a phantom `1x1` entry in both the list
and the lookup matrix.

**Both axes need the hatch, and the column axis needs it for a less obvious reason.** The trimming
re-anchor shrinks a merge's own `rowspan` to its visible count, so a merge trimmed to one visible row *is*
`rowspan: 1` — and a column translation copies that shrunk value onto every fragment. A `colspan: 1` merge
in that state reaches the singleton guard already at `1x1`, so without retention any `manualColumnMove` or
`manualColumnFreeze` deleted it, including one that touched none of its own columns, and
`translateAfterAxisMove` had already cleared `mergedCells` by then, so the rows returning brought nothing
back (DEV-2805). `#onAfterColumnMove` and `#onAfterColumnFreeze` therefore pass
`#planColumnMoveRetention(snapshot)`: every physical column of every merge that owns **more than one**
row, at least one of them trimmed. The floor matters: a `rowspan: 1` merge whose only row is trimmed has
nothing to come back, so its one-column fragment is a genuine single cell and is dropped as on `develop`
(pinned by `should drop the single-column fragment of a one-row merge whose row is trimmed when a column
move splits it`). The column axis needs no attribution and no `#describesOwnRows` guard — a column reorder never changes which
rows a merge covers, so `#transferAnchorsAfterAxisMove` hands every fragment the whole anchor either way,
and a retained single cell is treated exactly like a wider fragment of the same merge. Pinned by the three
column specs next to the row-move ones in the trimming describe (unrelated move, freeze, and a split that
leaves a single-column fragment).

**`translateAfterAxisMove` re-adds purged merges to the matrix, and the purged flag dies with the old
object.** The collection rebuilds the lookup matrix from every replacement, so a merge whose rows are all
trimmed comes back into the matrix at its stale visual coordinates, over whatever physical rows now sit
there, and the replacement is a new object that `#purgedMerges` (a `WeakSet` keyed on identity) knows
nothing about. On the row axis the mapper's `cacheUpdated` re-anchor ran *before* `afterRowMove`, so it
could not see the replacements; on the column axis it never runs at all. Every axis-move handler therefore
calls `#reanchorMergesToVisibleRows()` once more after `#captureMergeAnchors()`, gated on
`#isRowTrimmingActive()`: fully trimmed merges are purged and flagged again, and the visible ones are left
alone because their replacements already sit where the re-anchor would put them. The gate keeps the pass
off the untrimmed column-move path, where nothing can be purged. Two shapes reach this: a merge trimmed in
one go keeps `rowspan >= 2` and drew a phantom multi-row merge over foreign rows (pre-existing on both
axes), and a merge trimmed one row at a time is `rowspan: 1` when the last row goes, so the column
retention above keeps its `1x1` fragment and it would have drawn a phantom single cell. Pinned by the
three `should keep a ... merge out of the lookup matrix across a ... move` specs in the trimming describe.

Retention is keyed on the carrier, so a split leaving two single cells where only one of them owns trimmed
rows keeps that one and drops its sibling. That asymmetry is the rule working, not a wrinkle in it: the
sibling is a genuine single cell and the survivor is a merge with its other rows away. Which one survives
is therefore decided by where the trimmed rows are reachable from, never by anything about the drag.
`should keep a single-column merge alive through a split when the surviving cell owns a trimmed row` pins
exactly that pair.

The retention is deliberately **not** gated on the merge having been split. A merge trimmed down to one
visible cell already draws a single cell without any help from the move, so gating it there let any row
move — even one that never touched the merge — delete it (both shapes are pinned in the trimming describe
of `mergeCells.spec.js`, and the per-merge keying in `cellsCollection.unit.ts`).

**It is gated on `#describesOwnRows`, though — the same guard the split uses, and for a sharper reason.**
Retaining a *scattered* merge's single cell leaves one fragment, which reads as unsplit, which sends it
down the path that copies the **whole** anchor onto it: the merge then draws its full span from a cell that
is only one of the places its rows sit, over rows it does not own, and drops the ones it does. That is
strictly worse than the singleton drop it replaced, so such a fragment is left to be dropped. Pinned by
`should not retain a single-cell fragment of a merge whose rows a sort scattered`; the two guards have to
move together, and removing either one turns a spec red.

## A shrinking `loadData` leaves the collection addressing cells that are gone

The plugin registers **no `afterLoadData` hook**, so `loadData` (and `updateSettings({ data })`,
which routes to `updateData`) replaces the dataset while `mergedCellsCollection` keeps the previous
grid's merges. Nothing draws them past the grid, but `#resetMergedCellMeta` walks every cell a
dropped merge covers into `removeCellMeta` — `hidden` and `copyable` per cell, then `spanned`,
`rowspan`, `colspan` on the master. On 8x8 data merged at
`{ row: 6, col: 6, rowspan: 2, colspan: 2 }` followed by a 3x3 `loadData`, both
`updateSettings({ mergeCells: [] })` and `updateSettings({ mergeCells: [in-range area] })` threw
`Assertion failed: Expecting an unsigned number` — a pre-existing defect, reproducible on released
18.1.1. The real-world path is `importFile`, which applies a result as `loadData` plus
`updateSettings({ mergeCells, … })`: importing a smaller sheet over a previous import whose merge
sat near the bottom or right edge threw mid-import.

**The cause was a core asymmetry, and it is fixed in `Core#removeCellMeta`, not here.**
`Core#setCellMeta` passes an index outside the current range through as the physical one;
`removeCellMeta` used to translate unconditionally, so such an index became `null` and the meta
manager's `assertUnsignedKey` threw. `removeCellMeta` now reads an out-of-range index the same way
its sibling writes one, so `#resetMergedCellMeta` carries **no bounds guard**: it removes the meta
by the raw coordinates the merge was recorded with, and a plugin-local guard here would be a second
copy of a core-owned rule (it was one, for two commits).

The removal is not cosmetic on the `updateData` path. Core drops the cell meta only in `loadData`
(`metaManager.clearCellsCache()`); `updateData` — and therefore `updateSettings({ data })` — keeps
it by physical row. So after a shrink through `updateData`, a reset, and a regrow, the old merge's
`hidden` / `copyable` / `spanned` / `rowspan` / `colspan` are still on live cells unless the reset
actually clears them; skipping the write left `getCopyableText()` blanking the old merge area.

**`#resetMergedCellMeta` is the single funnel.** It is the plugin's only walk into `removeCellMeta`
(the writing side, `mergeRange`, only ever addresses the live range the user selected, and
`MergedCellsCollection#clear()` reaches the DOM through `getCell()`, which answers `null` out of
range). Since DEV-3135 it resolves the merge's columns to PHYSICAL indexes before removing anything,
and **a column past `countCols()` must resolve to itself**, not be skipped: `toPhysicalColumn()`
answers `null` for it, and skipping it cleared nothing after a shrink (the `updateData` case below
went red when DEV-3135 met this branch). The rows need no such rule — they come from the merge's
recorded anchor, already physical, and a physical row with no visual index is removed through the
meta manager directly. Every reset path funnels through it: `clearCollections()` (called by `disablePlugin()`, so by
`updatePlugin()` and therefore by the whole `mergeCells` settings path, and by SheetsBar's
`resetViewState`) and `unmergeRange()` (the context menu, `Ctrl`+`M`, `unmerge()`, the paste handler
and every UndoRedo merge action).

**The `afterLoadData` hook was deliberately NOT added**, for two reasons beyond the CustomBorders one
(the core clears cell meta on `loadData` and keeps it on `updateData`, so a hook that cleared the
collection would drop merges the user still sees after a same-size `loadData`). First, a hook that
pruned only *out-of-range* merges would have to read the bound off `mergedCells` — the list this
file's second section says is **not** the authority on visibility, whose entries are deliberately
kept with stale visual coordinates while their rows are trimmed, and which is restored whole once
those rows come back. A bounds test there cannot tell "the dataset shrank" from "these coordinates
are frozen from the moment the merge was purged". Second, `sheetsBar`'s `resetViewState` documents
that it *relies* on the collection surviving `loadData` and clears it itself through
`clearCollections()`. Pinned by `__tests__/shrinkingLoadData.unit.js`, which covers the bottom-only,
right-only, corner and exact-boundary (`row === countRows()`) shapes, a same-size control proving an
in-range merge still has its `spanned`/`rowspan`/`colspan`/`hidden` meta removed, and the
`updateData` shrink → reset → regrow regression (the meta is gone and `getCopyableText()` returns
the cell values). The core rule itself is pinned by
`src/__tests__/core/removeCellMeta.unit.js`.

## SheetsBar goes through members MergeCells owns, never the collection

A sheet switch captures and restores merges around its `loadData()`. It calls
`getVisibleMergedAreas()`, `clearCollections()`, `restoreMergedAreas()`, the `deferSettingsPass`
flag and `runDeferredSettingsPass()` through the typed `getPlugin('mergeCells')`, so changing their
names or signatures breaks the type check instead of the switch. Keep the capture reading the lookup matrix
and the restore on the automatic path (`mergeRange(range, true, true)`): SheetsBar relies on both.
Pinned by `__tests__/mergedAreasApi.unit.js`.

## `disablePlugin()` clears the field, so copy first

`generateFromSettings()` needs to tell a **re-applied** area from a **newly declared** one, so the previous
areas are copied *before* `disablePlugin()` clears them.

**The settings pass can be held back, for a caller whose settings update runs before its data load.**
While the `@private` `deferSettingsPass` flag is set, `updatePlugin()` rebuilds the plugin and puts the
copied areas back into `#appliedMergeKeys`, but skips `generateFromSettings()` and leaves `#initialized`
unset; `runDeferredSettingsPass(apply)` runs the pass later (`apply: false` builds nothing and writes no
cell, but still sets `#initialized` and captures anchors). SheetsBar is the one caller: a sheet switch
applies the arriving sheet's settings while the departing sheet's data is still loaded, and a pass run
there validated the arriving areas against the departing size and wrote its clearing `null`s into the
departing sheet's array. `#onAfterInit` clears a pending pass, because it builds the merges itself.
The pass has to run before anything calls `mergeRange()` — `afterMergeCells` captures an anchor only
once `#initialized` is set.

## Focus order is a scan, not a linked list

`focusOrder.ts` replaced a linked-list implementation, and several methods keep a cast with the note *"with
no current node the method returns `undefined` at runtime and the callers rely on that behavior."* The
layer lookups (`#getNodeAt`, `#findNodeInLayer`) likewise keep "without a layer index no node can match",
mirroring the old comparison against `undefined`.

**Those casts are compatibility, not sloppiness.** Removing one changes the value callers receive.

## Two rendering quirks

- **Safari needs explicit heights on the cells next to a merged cell**, or their height is not proportional
  to the merged cell's. Chrome and Firefox do this by default; the explicit write emulates it.
- **The `TR` `background` property is modified so it can be changed asynchronously later.** Only the alpha
  changes, so it is invisible — the TDs' own background covers it. Do not remove it as dead styling.

## A bottom overlay never holds the origin of a block that crosses `fixedRowsBottom` (DEV-176)

The bottom clone (and `bottom_inline_start_corner` and `bottom_inline_end_corner`) renders only the frozen bottom
rows. For a block that starts above them, `renderer.ts` `after()` found `notHiddenRow !== row` for every covered cell and hid them
all with `display: none`, so no TD in the clone carried the span and each row slid one column to the inline
start, under the wrong header (the `TypeError` in `Border#appear` that the ticket reported was already gone:
`isHTMLElement(fromTD)` guards it since the TS conversion). The clone's first rendered row now carries the
span. Three sites agree on that rule, and a fourth lives in Walkontable:

- `renderer.ts` `after()`: the carrier is `max(origin, firstRowOfBottomOverlay)` (`getFirstRowOfActiveBottomOverlay`,
  `utils.ts`, valid while the overlay draws). **It answers for all three bottom overlays** (`BOTTOM_ROW_OVERLAYS`:
  `bottom`, `bottom_inline_start_corner`, `bottom_inline_end_corner`). Leaving the end corner out made it fall back to
  the master's first rendered row, so a block in the `fixedColumnsEnd` columns that crosses `fixedRowsBottom` had
  every covered cell hidden there and the row slid out of its columns. A new bottom overlay name goes into that list.
- `cellsCollection.ts` `isFirstRenderableMergedCell()` reads the same row, or the fully-selected-block class
  (`fullySelectedMergedCell-N`) never reaches the clone's carrier and its fill is dropped.
- Walkontable `Table#getCell` (`table/cellAccess.ts`): when the hook answers with a block extent that starts
  before this CLONE's first rendered row but reaches into it, the lookup resolves to that first rendered row.
  This is why the plugin's `modifyGetCellCoords` needs no bottom-overlay logic, and why it works outside a draw
  (`hot.getCell(8, 1, true)`, `Event#parentCell` for a press on the clone's `.wtBorder.current`), which a rule
  keyed on `getActiveOverlayName()` cannot do: that name is `'master'` again once `Overlay#refresh` ends.

- **With `virtualized`, a clone lookup must still get the block's REAL last row.** The `'render'` answer clips
  the extent to the master's rendered range, which on a long grid ends far above the bottom clone, so
  `Table#getCell`'s rule (extent reaches the clone) never fired and `hot.getCell(98, 1, true)` found nothing.
  The `topmost` lookup (only `getCell` asks it, and it reads the first row and column of the answer) returns
  `bottomEndRow`; the border and master lookups stay clipped. A short fixture hides this, because the master
  there reaches the frozen rows: the spec uses 100 rows for it.
- **Never clamp the block's extent.** `Border#resolveMergedBlockEdges` asks the hook for the real extent to tell
  which edges lie on a freeze line. Clamping it makes the clone draw a closed box with a selection edge on the
  freeze line, through the block. Only the cell lookup (`getCell`) moves to the clone's first row.
- **The carrier is emptied** (`empty(getCellContentRoot(TD))` in `after()`). It is painted with the covered
  cell's own coordinates, so a renderer's output would act on the wrong cell (a checkbox calls
  `setDataAtCell(8, ...)`, not the origin) and a long wrapped text would size the clone's rows, which are only
  as tall as a plain row. The master draws the block's content.
- `#onModifyRowHeightByOverlayName` still skips the bottom overlays on purpose (no height inflation there).
- Covered by `tests/e2e/merge-cells-frozen-bottom.spec.ts` (both modes; corner overlay; hidden rows; area
  selection; long text; press on the clone's outline). Its page object reads the outline through
  `mergedBlockSelection()`, so keep that block in column 1: a block in column 0 has its left edge under the
  row-header clone's holder and that helper then reports an edge missing for a reason unrelated to this rule.
- Not changed: a merge that crosses the line is still accepted, and `fixedRowsBottom` moving later (a settings
  update, a row insert) is handled by the render path, not by validation.

## The init draw is batched, and four things about it are load-bearing

`#onAfterInit` applies the declared merges between a `suspendRender()` / `resumeRender()` pair (#5687).
Before that it drew the grid twice — `generateFromSettings()` clears the cells each area covers through
`setDataAtCell()`, which renders, and the handler then rendered again. Four rules come out of it, and
each has a measured reason.

- **Keep the explicit `this.hot.render()` inside the pair.** `resumeRender()` draws through
  `TableView#render`, which picks fast-vs-full from `hot.forceFullRender`, and only `Core#render` sets that
  flag. On the synchronous path the clearing write sets it for you, but with an async `validator` that
  write lands *after* `afterInit` returns, so nothing has set the flag by the time `resumeRender()` draws —
  without the explicit call that draw is a *fast* one, it skips the cell renderers, and the spans never
  appear.
- **Never gate that render on "the clearing write already rendered."** Same async `validator`, seen from
  the other side: its deferred draw **reverses** the order of the two init draws, so the handler's render
  becomes the one that puts the merges on screen. Gating on the write would leave such a grid unmerged
  until validation resolves.
- **Skip the work entirely when no area is declared.** `mergeCells: true` with no `cells` has nothing to
  apply, and the initial render already shows the final grid, so a draw there repaints an identical table.
  `resumeRender()` always draws once the pair is entered, so this has to be a check *around* it, not
  inside.
- **Do not collapse the pair back into `hot.batchRender()`.** That helper is `suspendRender(); fn();
  resumeRender();` with **no `finally`** (`core.ts`), and the clearing write runs user code — a
  `beforeChange` handler, a sync validator. A throw there would skip `resumeRender()` and leave
  `renderSuspendedCounter` above zero for the rest of the instance's life, so every later `render()`
  silently does nothing. The explicit `try`/`finally` here is that guard.

Note what the guard does **not** do: the throw still propagates, so `#initialized` and the anchor capture
are skipped either way. That is unchanged by #5687.

Coverage: `tests/e2e/merge-cells-init-renders.spec.ts` pins the counts, both setting shapes (the array
form and `{ cells: [...] }`, which reach the guard through different `getSetting()` branches) and the
async-validator ordering.
`updatePlugin()` is a separate path and is deliberately untouched — `updateSettings()` renders at the end
regardless.

## `cellCoords.ts` handles six structural cases

Adding rows/columns, removing rows/columns, removing the whole merge, removing partially-including-the-start,
removing the middle, removing the end. Each is a separate branch with its own comment. A structural bug here
is almost always a missing branch rather than wrong arithmetic — check all six.

## Fragile area: selection + merged cells

`../../../.ai/CONCERNS.md` flags this: visual-selection coordinate adjustment and MergeCells coordinate
adjustment overlap, with TODO comments admitting uncertainty about the responsibility boundary.
`selection.clear()` has a TODO noting that `selectedByColumnHeader` / `selectedByRowHeader` should be
cleared and are not. E2E coverage is extensive; the unit-level highlight logic is under-tested.

**When changing selection logic, test all combinations of: merged cells, hidden rows/columns, frozen
rows/columns, and navigable headers.** Run both the `selectAll` and `selectCells` suites.

### An arrow-key horizontal exit is addressed by the merge's top row (DEV-102)

`#onModifyTransformStart` snaps the highlight to the merge's top-left while stashing the entered cell
in `#lastSelectedFocus`, and restores that focus before the next move — that entry-row/entry-column
memory is what PR #10732's range navigation relies on. A **non-Tab horizontal** move that leaves the
merge onto the adjacent cell is the one exception: it re-snaps the result to the merge's topmost
**visible** row (`getNearestNotHiddenIndex(mergedParent.row, 1)`, bounded to the span — assigning a
hidden top row throws `Renderable coords are not visible` from the transform). So a merge is always
addressed by its top-left corner however it was entered; before this, entering B2:B4 from below (B5
up) then leaving left landed on A4, from above (B1 down) on A2.

The gate is `delta.row === 0 && landsOnAdjacentColumn && !isDuringTabNavigation()` — "any non-Tab
horizontal `transformStart`", which is the Left/Right arrows, the editor's arrow-key exit, and a
horizontally-configured `enterMoves`; it is not literally arrows-only. Mouse entry then a horizontal
leave is the same path (the snap does not care how the merge was entered). Home/End do not reach it
(they `setRangeStart` to a computed cell, never `transformStart`), and Shift+Arrow goes through
`modifyTransformEnd`. A `transformStart(0, ±1)` called directly by other code (no Tab flag) also gets
the snap, which is the reasonable default for a discrete horizontal move; only Tab's row-cycling is
excluded.

Three things this override must **not** catch, each behind a separate condition, each with a red spec
if you drop it:

- **A wrap to another row** (`autoWrapRow`, no adjacent cell) keeps the entry row, or the wrap loops
  forever between the merge and the row below its top — gate on `landsOnAdjacentColumn` (the column
  branch found a not-hidden neighbor), never on the mere presence of a merge.
- **Vertical and diagonal moves** keep the entry column (the tested column memory) — gate on
  `delta.row === 0`.
- **Tab / Shift+Tab**, which cycles keeping the row it moves along, reaches this hook through
  `transformStart` with the **same `(0, ±1)` delta as an arrow** (single-range case; the multi-range
  case goes through `modifyTransformFocus` and never reaches here). There is no delta or source that
  tells them apart — both mark source `'keyboard'`. `inlineStart`/`inlineEnd` therefore call
  `selection.markTabNavigation()` **after** `markSource()`, and the context-menu Tab shortcut calls
  `markTabNavigation()` on its own (it never goes through those commands). The override reads
  `selection.isDuringTabNavigation()`. `markSource()` itself clears the flag, so a throw during the
  transform cannot leak into the next command; `markEndSource()` still clears it on the success
  path. Do not expose `tabNavigation.ts`'s local `isTabOrShiftTabPressed` — that flag lives in a
  shortcut-command closure, and the context-menu Tab path never goes through it. The Jasmine
  `keyDownUp('tab')` helper drives the real command path, so it sets the flag; a `transformStart`
  called directly in a unit test does not.

Pinned by `__tests__/keyboardShortcuts/arrowLeft.spec.js` / `arrowRight.spec.js` (top-row landing,
including hidden columns and the multi-merge chain), the unchanged `arrowUp`/`arrowDown` and
`tab`/`shiftTab` specs (the three exclusions), and `tests/e2e/merge-cells-horizontal-exit.spec.ts`.

## `fixedColumnsEnd`: the end clone draws the part of a merge that crosses the line

The inline-end clone renders only the LAST `fixedColumnsEnd` columns, and the top/bottom end corners render the same
columns. A merge is anchored at its top-left (lowest visual column, in LTR and RTL alike), so a merge that starts
in the master and reaches into the band has its anchor OUTSIDE the clone. Every cell of the merge in the clone is a
covered cell, and without help the renderer hides all of them: the band shows a hole. A merge inside the band, or
starting on its first column, is anchored in the clone and needs nothing.

- `utils.ts` owns the overlay-name lists. `getFirstRenderedColumnOfOverlay` answers 0 for the start overlays and the
  first column of the end band (visual, not hidden) for `inline_end` and the two end corners; every other overlay
  starts where the main table starts. `getFirstRenderedRowOfOverlay` is the row counterpart (the top overlays start at
  0). `renderer.ts`, `mergeCells.ts` (`modifyGetCellCoords` virtualized clamp) and `cellsCollection.ts`
  (`isFirstRenderableMergedCell`) all go through them. **Do not add another inline list of overlay names.**
- **The `to` column of the `virtualized` clamp is per overlay too.** `getLastRenderedColumnOfOverlay` answers the
  last column of the end band (visual) for the end overlays and the main table's last rendered column for the rest.
  Reading `hot.getLastRenderedVisibleColumn()` for an end overlay returned a column BEFORE the band whenever the master
  was scrolled to the start (a merge over 8..10 with a band of 9..11 came back as `[9..8]`: the selection border drew
  a start edge on the freeze line and the fill handle went to column 8). Pinned by
  `__tests__/overlayBounds.unit.ts` and `tests/e2e/fixed-columns-end-review3.spec.ts`.
- `renderer.ts` clamps the merge's anchor column to the first end column on the end overlays EVEN WHEN `virtualized` is
  off. The rows are clamped only when `virtualized` is on, as before. With `fixedColumnsEnd: 0` nothing changes.
- The continuation cell is the covered cell of the FIRST end column of the merge's first row, with the `colspan` the
  renderer already computes from that column (`min(origColspan, columns left)`), so it never reaches past the band.
  Its text is the merge anchor's, because covered cells resolve to the anchor through `modifyGetCellCoords`.
- **That same hook is why `Core#getCell(row, endColumn, true)` does not return the continuation.** It resolves the
  covered coordinates to the anchor, which is a master cell (and is not rendered at all while the master is scrolled
  away from it). Tests that need the end clone's cell read the clone's DOM. Editors and selection of such a merge go
  through the anchor, as they do for every merge.
- `#onModifyRowHeightByOverlayName` treats `top_inline_end_corner` like the top corners and
  `bottom_inline_end_corner` like the bottom ones (no height inflation there).
- **A block that crosses `fixedRowsBottom` inside the end columns works the same as on the start side.** The bottom end
  corner's first row carries the span (`getFirstRowOfActiveBottomOverlay`), with the `colspan` clamped to the band, and
  the continuation of the inline-end clone, the bottom clone and the master are unchanged. Supported, in LTR and RTL
  and with `virtualized` on and off: a block anchored in the band that crosses the bottom line (outline and fill
  handle included), and a block anchored in the master that reaches into the band and into the bottom rows (its cells
  render correctly in every clone). Pinned by `tests/e2e/merge-cells-frozen-bottom-end.spec.ts`.
- **Still NOT supported (measured without `fixedRowsBottom` too, in the default mode, so the bottom rows do not cause them):**
  - A block that covers EVERY column of an end clone (for example `fixedColumnsEnd: 2` and a block over both columns).
    The rows below its first have no displayed cell in that clone, a table row with none has no height, and the
    block's cell is one row tall (`rowspan="4"`, 29 px) in the inline-end clone and in the bottom end corner. The row
    headers keep the rows tall in the master and in the start clones; the end clones have none. Keep one band column
    that no block covers.
  - The selection outline of a block anchored in the master that reaches into the band. In the default mode
    `Table#getCell` resolves the block to a clone's first rendered ROW but not to its first rendered COLUMN
    (the hook answers the real anchor column), so the end clones draw no outline and no fill handle, and the
    master's end edge and handle lie under the clone. With `virtualized` the hook clamps the column, the clones draw,
    but the box has a start edge on the freeze line, through the block. The row-side rule in `Table#getCell` is the
    model for a column-side one.
- Pinned by `tests/e2e/fixed-columns-end-headers.spec.ts` (LTR and RTL, `virtualized` on and off) and
  `__tests__/overlayBounds.unit.ts`.

## `getSourceDataAtCell` takes a visual column

`getSourceDataAtCell(row, column)` takes a **physical row** but a **visual column** — `core.ts`
documents that split and carries a TODO. `colToProp()` translates the column again. Passing
`toPhysicalColumn()` into it double-translates and reads a different cell whenever the two orders
differ (`manualColumnMove`, a hiding map plus a move). `#getStoredValueAt` is the correct pattern.
`mergeRange()` must match it when it copies the anchor value for `populateFromArray` (DEV-2669).
Do not "fix" `#getStoredValueAt` back to a physical column.

## Pagination cannot coexist with this plugin

`registerConflict('pagination', ['mergeCells', …])` — Pagination is the plugin that stays disabled. See
`../base/AGENTS.md`.

## Viewport getter methods

`mergeCells` changes what the viewport getters report (DEV-932). That is documented behavior, not a defect.

## Where to look next

- The rendering primitive and the overlay clones: `../../3rdparty/walkontable/AGENTS.md`.
- Autofill and selection maths for merges: `calculations/autofill.ts`, `calculations/selection.ts`.
- Plugins whose specs live in this directory because the interaction is delicate:
  `../autofill/`, `../hiddenColumns/`, `../hiddenRows/`, `../undoRedo/`.
- Cell meta storage: `../../dataMap/metaManager/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='mergeCells'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='mergeCells'`

`__tests__/` is one of the largest in the repo — dedicated specs for `hiddenColumns`, `hiddenRows`,
`autofill`, `undoRedo`, `scrolling`, `selection`, `openEditor`, `secondClickDeselects`,
`pluginCompatibility`, plus `keyboardShortcuts/`, `methods/` and `rtl/`. Unit coverage exists for
`cellCoords`, `cellsCollection`, `focusOrder`, `selection` and `autofillCalculations`; prefer adding there.

## Rendering under `renderMode: 'onChange'`

**A merged block's cells never take the stable paint identity.** The engine recycles its rows on a
vertical scroll (`Viewport#allowsRowRecycling()`, which does NOT require single-pass layout) and offers
the host the overlay name as a cell's paint identity, so a carried-over cell can be skipped. The
`spanned` flag this plugin sets on a block's origin meta in `afterGetCellMeta` (covered cells resolve
to the origin through `modifyGetCellCoords`) is what `CellPainter#bandIdentity` reads to keep the full
band — offsets and sizes — for the block's cells instead: the renderer clamps the block's span to the
rendered band, so those cells must repaint when the band moves, while every other cell of the grid
skips. Keep `spanned` on the origin meta; removing it would let a clamped block keep a stale span
across a scroll. The single-pass opt-out (`modifySinglePassLayout` → `false`) is about the layout
model only (the height-versus-viewport circularity); it no longer switches the recycling or the stable
identity off for the rest of the grid.

Two writes of this plugin are invisible to the incremental render and are marked by hand:

- **Collection changes** (`MergedCellsCollection#add`/`remove`/`clear`) call `hot.markAllCellsChanged()`. A merged block covers cells whose own value and meta never change, and autofill creates blocks with no meta write at all; only an epoch bump repaints them (and drops the selection scan cache, which holds the `fullySelectedMergedCell-N` extra class).
- **The neighbor height** (`renderer.ts`, `getHeightNextToMergedBlock`, `rowHeaders: false` only) is written on the cell right after a block that starts at column 0, and it is DERIVED from the merged collection inside that cell's own paint — never handed over from the origin's paint. A one-shot map filled by the origin broke under `renderMode: 'onChange'`: the neighbor repainted for its own reason while the origin was skipped, its style was wiped, and nothing re-created the entry. Deriving it needs no `markCellChanged`: a collection change repaints every cell, `rowHeights` goes through `updateSettings` (render epoch).

The selection extra class (`afterDrawSelection`) is asked by Walkontable on every draw for every coordinate of the selection and diffed like any other class, so the plugin no longer registers `beforeRemoveCellClassNames` (the hook still exists for external code). The per-coordinate call matters: `getSelectedMergedCellClassName` answers only for a block's **first renderable** coordinate, so a scan that asked once per element would miss the block.
