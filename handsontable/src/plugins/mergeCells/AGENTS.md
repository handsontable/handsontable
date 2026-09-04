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
