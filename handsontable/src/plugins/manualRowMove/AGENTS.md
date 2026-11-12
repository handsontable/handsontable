# ManualRowMove plugin — dragging a row header to reorder

The `manualRowMove` plugin reorders rows by dragging their header. Read this before touching
`manualRowMove.ts` or `ui/`.

**`../manualColumnMove/` is the mirror plugin, and the shared rules are documented there** — read
`../manualColumnMove/AGENTS.md` for the `move*`-versus-`drag*` index distinction (final index vs drop
index), the `isMovePossible()` bounds check against `getNotTrimmedIndexesLength()`, and the standing
`// TODO: move adding plugin classname to BasePlugin.`

What follows is what is specific to rows.

## An array setting replays as a move on init

`moveBySettingsOrLoad()` calls `moveRows(pluginSettings, 0)` when `manualRowMove` is an array. So the array
means "these rows, in this order, at the top" — it is a **move instruction**, not a stored permutation, and
it replays on every load.

Consequence: a grid configured with an array reverts a row the user had since dragged, whenever the replay
runs again. The manual *resize* plugins hit the same class of problem and document it in detail —
`../../utils/manualResize/AGENTS.md`.

Formulas reloading the engine sheet a grid built without `data` is bound to (every `updateSettings()`) does
not trigger the replay: it reloads through `updateData()`, which keeps the index maps and fires no
`afterLoadData`. When anything but the grid changed the sheet since the grid loaded it (the host through the
engine API, another grid on the sheet), it falls back to `loadData()`, and then it holds the replay from the engine and puts the
grid's previous order back after the load
(`../formulas/AGENTS.md`, "A reload of the sheet the syncers are synced with keeps the grid's order"). It reads
this plugin's state through nothing but the index mapper; the same holds for ManualColumnMove.

## A press another listener claimed arms no move

`#onBeforeOnCellMouseDown` skips a press whose `isImmediatePropagationStopped(event)` is set, the way DragToScroll does: that listener owns the gesture. The FormulaBuilder header pick is the case it was added for. A pick dragged across the headers of a header-selected row armed a move, drew the guideline, scrolled the viewport on each `mousemove` next to the pick's own auto-scroller, and moved the range on release, which closed the edit. A pick that ended without a `mouseup` (a window blur) also left the move pressed for the next release on the page. The check depends on the claiming listener running first in the same hook: FormulaBuilder registers with order index `-1`. The other in-tree claimers (CheckboxHeader, RowSelection, CollapsibleColumns) register after this plugin, so their presses arm as before, until an `updatePlugin()` of this plugin moves its hook to the tail of the list.

## A move that changes nothing never reaches the index mapper

`moveRows()` computes `movePerformed` (`isMovePossible()` and `isRowOrderChanged()`) **before** it calls
`rowIndexMapper.moveIndexes()`, and calls it only when that is true. `moveIndexes()` places the moved rows
before the next NOT-trimmed row, so it does not see a trimmed row sitting between. Run for a drop onto the
row's own position, it moved the row to the far side of the trimmed row, and untrimming (for example from
`afterRowMove`) then showed an order nobody asked for. The hooks still fire for such a drop, with
`movePossible: true` and `orderChanged: false`; firing them is by design and suppressing them would be
breaking. Because the mapper is not touched, a drop onto the same position no longer fires
`afterRowSequenceChange` and `afterRowSequenceCacheUpdate` (source `move`), no longer forces a full render, and
no longer runs the selection repair of the cache update: nothing moved, so there is nothing to react to. Do not
move the computation back below the mapper call.
`../manualColumnMove/` has the identical guard. NestedRows moves rows by its own path and is not covered.
Pinned by `__tests__/noopMoveTrimmedRows.unit.js` and `tests/e2e/manual-move-trimmed.spec.ts`.

## A move that changes the order lands next to a visible row

`moveIndexes()` puts the moved rows right before the physical row of the visible row at `finalIndex`, after any
trimmed rows in front of it. A move to the last visible position puts them right after the last visible row,
before the trailing trimmed rows. The rows never split a run of neighboring trimmed rows (they can land between
two trimmed rows that have a visible row between them). The rule is specified and pinned by
`__tests__/moveTrimmedPlacement.unit.js`, and the row-moving guide documents it. Landing on the other side of a
trimmed block would change the physical order users see after untrimming, so it is a breaking change.

With HIDDEN rows the same visible gap has two drop indexes: the lower half of the row above the hidden block
and the upper half of the row below it. `moveIndexes()` counts a hidden row as an item, so the lower-half index
(it points at the first hidden row) would land the rows in front of the block and the upper-half one after it.
The pointer resolution steps over the hidden rows (`getLowerHalfDropIndex()`, called from the lower-half branch of
`refreshPositions()`), so both give the same drop index and the rows land after the block, right before
the next visible row, the same side as the trimmed rule and as `ManualColumnMove` (which gets it from its
zero-width hidden columns). Do not move the fix into `moveIndexes()` or `countFinalIndex()`: `dragRows()` and
`moveRows()` keep the literal meaning of the index a caller passes, and `moveIndexes()` is a public mapper method.
When the hidden rows run to the end of the grid there is no visible row to step to, and the index is left
alone, so the rows land in front of the trailing hidden rows, as they do in front of trailing trimmed ones.
**The step is skipped in four more cases.** (1) A step that would cross into or out of a fixedRowsTop or fixedRowsBottom band: the guideline shows the old spot, and the row would land in the other band. (2) The NestedRows plugin is enabled: its move path reads the parent of the row at the drop index, so a step over hidden rows could make the row a child of a hidden row. (3) The visible row after the hidden ones is inside a merged cell but not its first row (the merge starts at a hidden row): landing before it would put the rows between the merged rows, and the MergeCells `afterRowMove` handler would shrink the merge (`isInsideMergedCell()`). (4) **The hovered row is one of the moved rows.** Grabbing a row and releasing it on its own
lower half is the "drop it back in place" gesture, which must stay a no-op: stepping would move the row across
the hidden block, fire `afterRowMove` with `orderChanged: true` and record an undo step for a visibly unchanged
grid. Pinned by the self-drop case of `tests/e2e/manual-row-move-hidden-gap.spec.ts`.
The hooks report the resolved drop index. Landing on the far side is a change from 18.1 for the lower-half drop
(migration guide, section 60). Pinned by `__tests__/moveTrimmedPlacement.unit.js` (`getLowerHalfDropIndex()`, bands and NestedRows included) and
`tests/e2e/manual-row-move-hidden-gap.spec.ts`. NestedRows moves rows by its own path and the e2e spec does not drive it; the unit tests only pin that the step is skipped.

## Row heights are read defensively

The drag measurement sums Walkontable row heights and falls back per row to
`stylesHandler.getDefaultRowHeight()`, because a row outside the rendered range reports nothing. Never
assume a row height is available; the fallback is per row, not per drag.

The UI has one extra quirk over the column version: **the first rendered row can be a pixel taller than
the rest**, because it draws the grid's own top frame as a `border-top` inside its declared height. Ask
`stylesHandler.firstRenderedRowDrawsTopBorder()` rather than testing the row index or reading
`hasColHeaders()` — since the row axis settled (see the walkontable `AGENTS.md`, "Border ownership"),
it is true only on a grid that renders **no head row**, and "renders no head row" is not the same as
`colHeaders: false`: NestedHeaders adds head rows through `afterGetColumnHeaderRenderers` without
consulting that setting, so the predicate reads the rendered header count instead.

Two places in this plugin depend on it, and they are separate. `getRowsHeight` sums the LOGICAL row
heights, so once the first rendered row is behind the hovered one the sum falls a pixel short of the
rendered band — `firstRowBorderCompensation` folds that back into `tdStartPixel` so it is the hovered
row's real top edge. The guideline is then placed on the gridline just above that edge, clamped at the
grid's own top (`Math.max(tdStartPixel - 1, 0)`). Do not reintroduce the old
`coords.row === 0 ? tdHeight - 1 : tdHeight` special case: it existed to absorb the header/first-row
border trade that no longer happens, and with headers on it now moves the guideline off by a pixel.

There are also clamps for the backlight below the table and the guideline below the table.

**A zero size is a size.** `ui/_base.ts` `setSize()` writes `0` through `isNumeric()`, like `../manualColumnMove/ui/_base.ts`. The backlight is sized `hider.offsetWidth - leftPos`, and with no rendered column (every column hidden) that is `0`. A truthiness check skipped it, so the CSS `width: 100%` stayed and a box as wide as the row headers was drawn right of the grid. With no columns the backlight is therefore zero wide; the guideline stays, because the rows can still be moved by their headers. Pinned by `__tests__/ui/_base.unit.ts` and `tests/e2e/manual-row-move-no-columns.spec.ts`.

`isFixedRowTop(row)` and `isFixedRowBottom(row)` exist because a row inside `fixedRowsTop` or
`fixedRowsBottom` behaves differently as a drop target. Both are checked — a fix aimed at only the top
band misses the bottom one.

## A press that never traveled is a click and fires no move hook

`#onMouseUp` calls `dragRows()` only when the pointer traveled farther than `POINTER_DRAG_TOLERANCE` (3 px) from
the press. `#onMouseMove` tracks it in `#dragged` through `hasPointerTraveled()`, both from `helpers/dom/event.ts`,
exactly as `ManualColumnMove` does. Before that guard a header pressed and released in place fired
`beforeRowMove` and `afterRowMove` for a move that changed nothing. The guard is about the gesture, not the
order: a drag that goes out and returns to its start still fires both hooks, with `orderChanged: false`, and that
is deliberate, since suppressing it would be a breaking change (see "A move that changes nothing never reaches
the index mapper" above). The tolerance is measured in client coordinates, so a row dropped by wheel-scrolling
under a motionless pointer reads as a click, as it does in the column plugin. A test that simulates a move must
send a `mousemove` that travels past the tolerance from the `mousedown` position, or the release reads as a
click: `tests/e2e/manual-move-trimmed.spec.ts` moves the pointer inside the header for that reason. Pinned by
`tests/e2e/manual-row-move-noop-hooks.spec.ts`.

## NestedRows reimplements this plugin

`../nestedRows/utils/rowMoveController.ts` carries three TODO comments about "mocking real work" of this
plugin and reimplementing its internal function. That is real logic duplication: **a bug fixed here may not
be fixed there**, and vice versa. `../../../.ai/CONCERNS.md` tracks it, with the intended fix being a
shared utility or a proper public method on this plugin.

If you change move semantics, check `nestedRows` in the same pass.

## DataProvider blocks this plugin

`registerConflict('dataProvider', ['manualRowMove', …])`: with a complete server-backed `dataProvider`
configuration, **DataProvider** is the plugin that stays disabled. See `../base/AGENTS.md`.

## A drag ends when the data is replaced

`beforeLoadData` cancels a held header drag (`#onBeforeDataReplace`: the pressed flag, the
rows to move and the moving classes), so the `mouseup` takes its early return. The rows a drag holds are visual
indexes of the data it started on, and the release moved the rows of the data that replaced it (a sheets bar switch).
Not on `updateData()`: the React wrapper sends `data` on every re-render, so a parent re-render would cancel the gesture. ManualColumnMove cancels on every column order reset instead, `updateSettings()` with `columns` included
(`../manualColumnMove/AGENTS.md`); this plugin still covers `loadData()` only. Pinned by
`tests/e2e/sheets-bar-in-flight-drags.spec.ts`.

## Where to look next

- The column mirror and the shared index semantics: `../manualColumnMove/AGENTS.md`.
- The plugin that duplicates this logic: `../nestedRows/AGENTS.md`.
- Row headers that follow their rows through a move: `../bindRowsWithHeaders/AGENTS.md`.
- Moving *cells* rather than rows: `../moveCells/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowMove'`

`__tests__/` splits into `manualRowMove.spec.js`, `manualRowMoveUI.spec.js`, `API.spec.js`,
`positioning.spec.js`, `scrolling.spec.js` and `ui/`.

Two theme traps live in these specs, and both only ever showed up on `horizon`, whose 37px rows are
the tallest. Run every drag spec on all three themes (`--theme=classic|main|horizon`), not just the
default.

- **A drop point must be derived from the row's own height, never written as a literal.** The plugin
  decides the drop index by comparing the pointer against the hovered row's MIDDLE, so a hardcoded
  `offset().top + 18` is half a pixel above the midpoint on `horizon` and lands on the hovered row
  instead of the one below. Say `offset().top + outerHeight() - 2` when the spec means "the lower
  half". `nestedRows/__tests__/integration/manualRowMove.spec.js` carried two of these.
- **A row index near the edge of the rendered band is not portable across themes.** Taller rows fit
  fewer rows in the same fixture, and scrolled to the bottom `scrollTop` sits at its clamp, so a
  one-pixel change in total content height moves which row the band starts on. Give the fixture
  enough height to hold three body rows below any frozen pane on the tallest theme, and read the row
  from the viewport. Use `getFirstFullyVisibleRow()`, **not** the master's first RENDERED row: the
  master also renders the rows hidden behind the frozen pane, and hovering one of those scrolls the
  viewport, which is the very thing `scrolling.spec.js` asserts does not happen.
