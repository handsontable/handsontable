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
`#planColumnMoveRetention(snapshot)`: every physical column of every merge that owns a trimmed row. The
column axis needs no attribution and no `#describesOwnRows` guard — a column reorder never changes which
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
calls `#purgeInvisibleMergesAfterAxisMove()` after `#captureMergeAnchors()`, which re-runs the re-anchor:
fully trimmed merges are purged and flagged again, and the visible ones are left alone because their
replacements already sit where the re-anchor would put them. Two shapes reach this: a merge trimmed in
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

## `disablePlugin()` clears the field, so copy first

`generateFromSettings()` needs to tell a **re-applied** area from a **newly declared** one, so the previous
areas are copied *before* `disablePlugin()` clears them.

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

Two writes of this plugin are invisible to the incremental render and are marked by hand:

- **Collection changes** (`MergedCellsCollection#add`/`remove`/`clear`) call `hot.markAllCellsChanged()`. A merged block covers cells whose own value and meta never change, and autofill creates blocks with no meta write at all; only an epoch bump repaints them (and drops the selection scan cache, which holds the `fullySelectedMergedCell-N` extra class).
- **The neighbor height** (`renderer.ts`, `getHeightNextToMergedBlock`, `rowHeaders: false` only) is written on the cell right after a block that starts at column 0, and it is DERIVED from the merged collection inside that cell's own paint — never handed over from the origin's paint. A one-shot map filled by the origin broke under `renderMode: 'onChange'`: the neighbor repainted for its own reason while the origin was skipped, its style was wiped, and nothing re-created the entry. Deriving it needs no `markCellChanged`: a collection change repaints every cell, `rowHeights` goes through `updateSettings` (render epoch).

The selection extra class (`afterDrawSelection`) is asked by Walkontable on every draw for every coordinate of the selection and diffed like any other class, so the plugin no longer registers `beforeRemoveCellClassNames` (the hook still exists for external code). The per-coordinate call matters: `getSelectedMergedCellClassName` answers only for a block's **first renderable** coordinate, so a scan that asked once per element would miss the block.
