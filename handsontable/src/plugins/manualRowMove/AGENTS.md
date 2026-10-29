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
move the computation back below the mapper call. A move that does change the order still
lands on the same side of a trimmed row as before: that placement is a separate, open design question.
`../manualColumnMove/` has the identical guard. NestedRows moves rows by its own path and is not covered.
Pinned by `__tests__/noopMoveTrimmedRows.unit.js` and `tests/e2e/manual-move-trimmed.spec.ts`.

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

`isFixedRowTop(row)` and `isFixedRowBottom(row)` exist because a row inside `fixedRowsTop` or
`fixedRowsBottom` behaves differently as a drop target. Both are checked — a fix aimed at only the top
band misses the bottom one.

## A press that never traveled is a click and fires no move hook

`#onMouseUp` calls `dragRows()` only when the pointer traveled more than `POINTER_DRAG_TOLERANCE` (3 px) from
the press, tracked in `#dragged` by `#onMouseMove`, exactly as `ManualColumnMove` does. Before that guard a
header pressed and released in place fired `beforeRowMove` and `afterRowMove` for a move that changed nothing.
The guard is about the gesture, not the order: a drag that goes out and returns to its start still fires both
hooks, with `orderChanged: false`, and that is deliberate, since suppressing it would be a breaking change (see
"A move that changes nothing never reaches the index mapper" above). `POINTER_DRAG_TOLERANCE` is a second copy
of the column plugin's constant, because plugins do not import each other: change both together. The tolerance
is measured in client coordinates, so a row dropped by wheel-scrolling under a motionless pointer reads as a
click, as it does in the column plugin. A test that simulates a move must send a `mousemove` that travels past
the tolerance from the `mousedown` position, or the release reads as a click. Pinned by
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
Not on `updateData()`: the React wrapper sends `data` on every re-render, so a parent re-render would cancel the gesture. ManualColumnMove has the same shape and is not covered yet (open). Pinned by
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
