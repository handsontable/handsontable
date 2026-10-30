# ManualColumnMove plugin — dragging a column header to reorder

The `manualColumnMove` plugin reorders columns by dragging their header. Read this before touching
`manualColumnMove.ts` or `ui/`.

`../manualRowMove/` is the mirror plugin. The public API shape, the `move` vs `drag` distinction and
`isMovePossible()` are identical; read that file's AGENTS.md for the row-specific parts.

## `move*` and `drag*` take DIFFERENT indexes

This is the single most common mistake with this plugin:

| Method | Index argument | Means |
|---|---|---|
| `moveColumn(s)` | **final index** | where the elements end up |
| `dragColumn(s)` | **drop index** | where the pointer was released |

`dragColumns()` converts the drop index into a final index with `countFinalIndex()`, caches the drop index,
then calls `moveColumns()`. Both fire `beforeColumnMove` / `afterColumnMove` — the hooks always speak the
*final* index.

All of these are **visual** indexes, and `isMovePossible()` bounds them against
`columnIndexMapper.getNotTrimmedIndexesLength()` — the not-trimmed length, not `countCols()`. It rejects
four cases: destination too high (`moved.length + finalIndex > length`), destination negative, any moved
index negative, and any moved index at or past the length. "You can't move more than one element to the
last position" is a consequence of the first.

## A move that changes nothing never reaches the index mapper

`moveColumns()` computes `movePerformed` (`isMovePossible()` and `isColumnOrderChanged()`) before it calls
`columnIndexMapper.moveIndexes()`, and calls it only when that is true. `moveIndexes()` places the moved
columns before the next NOT-trimmed column and does not see a trimmed one in between, so a drop onto the
column's own position used to push it past the trimmed column. The hooks still fire, with `orderChanged:
false`. The sequence change hooks (`afterColumnSequenceChange` and its cache update twin) no longer fire for
such a drop either. The row mirror documents the same rule in `../manualRowMove/AGENTS.md`; keep both in step.
Pinned by `__tests__/noopMoveTrimmedColumns.unit.js` and `tests/e2e/manual-move-trimmed.spec.ts`.

## `isDragging()` is the shared click-versus-drag verdict

```js
isDragging() { return this.enabled && this.#pressed && this.#dragged; }
```

ColumnSorting asks this **on release** to tell a click apart from a drag, so the two plugins cannot disagree
about where that line is — it has no tolerance logic of its own, it just calls
`manualColumnMove?.isDragging()`.

**So the threshold lives in one place: `POINTER_DRAG_TOLERANCE` (3 px) and `hasPointerTraveled()` in
`helpers/dom/event.ts`.** ManualColumnMove and ManualRowMove both call them. Do not add a second copy in
ColumnSorting or either plugin: `columnSorting/` contains no tolerance constant, no `Math.abs`, and no press-origin
tracking. The comment at `manualColumnMove.ts:716` that claims the value is duplicated there is stale.

A press that never traveled is a click, not a move, and bailing out on that also keeps
`beforeColumnMove` / `afterColumnMove` from firing on every header click. The full protocol on the sorting
side — the queued press, the two release signals, the two cancel checks — is in `../columnSorting/AGENTS.md`.

## Hidden columns have zero width, and the drop target steps over them

The drop resolution stops on the column under the cursor, **or** on the last column the header covers (its
right edge reaching the header's end). Because a hidden column has zero width, it is stepped over.

**A drop at a column's right edge lands past any hidden columns that follow it**, so releasing at the visible
end of a collapsed group drops *after the whole group* rather than between its visible column and an
adjacent hidden one. That is the intended behavior with CollapsibleColumns and HiddenColumns.

## The backlight starts at the grabbed header level

With nested headers, the grabbed level is the row's distance from the topmost header, and the backlight's
vertical offset is the summed height of every level above it. Getting that wrong makes the drag preview
float above or below the pointer on multi-level headers.

The UI code also carries three deliberate clamps — no backlight past the right edge, none past the left
edge, no guideline outside the table — plus the guideline's default `margin-left: -1px`.

## The start freeze line is positional

No plugin vetoes a move across the start freeze line or of a frozen start column, whether the line comes from
`fixedColumnsStart` or from `ManualColumnFreeze`: the first `fixedColumnsStart` columns are frozen, whichever
columns they are, and a move never changes the count. `ManualColumnFreeze` used to veto both after its first use,
and the reasons it no longer does are in `../manualColumnFreeze/AGENTS.md`.

## The guideline over frozen columns lives in the frozen overlay

The guideline and the backlight start in the master table's hider, and the frozen start overlay paints over the
master as a whole: `.ht_master` is a stacking context (`z-index: 0`), so the guideline's `z-index: 205` only ranks
inside it and never outranks the overlay clones (120 to 180). Left in the master, the line of a drop between or in
front of frozen columns is drawn and covered. `refreshPositions()` therefore moves it into the overlay's hider
while the hovered column is frozen (`#placeGuideline()`), and `#onMouseUp()` moves it back. Do not raise a
`z-index` to fix this, and do not move the line to the root: the walkontable notes say why the master's zero is
load-bearing, and the root has no clipping or scroll tracking of its own.

- The overlay's table starts at the grid's start edge, so its position is the master one minus the scroll offset
  that the master arithmetic adds for a frozen column. The overlay's hider has no width (measure its table), and a
  drop at the freeze line is clamped to the table's last pixel, because the overlay holder clips anything past it.
- **Only re-parent a guideline that was already appended.** `onMouseDown` appends the guideline and the backlight
  together, guarded by "the guideline is built and not appended". Appending the guideline from `#onMouseUp()` first
  made that guard skip the backlight, and the next drag had none (62 legacy specs failed on it).
- The backlight is not moved: it is a plain box that the overlay would clip, and it spans columns that can cross the
  freeze line. A plain `fixedColumnsStart` grid had the same hidden guideline before `ManualColumnFreeze` could be
  used to reach it.
- **A position check cannot see this bug.** The guideline was at the right coordinates under the overlay. Pin it
  with `document.elementFromPoint()` at a body row and assert that the guideline is the element hit
  (`tests/e2e/manual-column-freeze-boundary.spec.ts`, "the drop guideline"); the pointer-events-none backlight
  cannot be probed that way.

## A drag ends when the column order starts over

`afterColumnSequenceChange` with the `'init'` source cancels a held header drag (`#cancelDrag()`), so the release
moves nothing. `initIndexMappers()` is the one place that source comes from: `loadData()`, `updateSettings()` with
`columns`, and new data or a schema with another column layout. The columns a drag holds are visual indexes of the
order it started on, so the release moved other columns. Hooking `beforeLoadData` alone missed the `columns` paths.
A same-shape `updateData()` keeps the order (`fitToLength()`, no `'init'`) and the drag: the React wrapper sends
`data` on every re-render, so a parent re-render must not cancel the gesture.

- **ColumnSorting drops its queued header press on the same change.** A drag starts with a press on the header,
  and the cancel makes `isDragging()` read `false`, so without that the release sorted a column of the new order.
- **`disablePlugin()` cancels too, but not inside `updatePlugin()`.** A drag held while the plugin is turned off
  otherwise kept its state, and the first `mouseup` after it was turned back on moved those columns. A restart
  through `updatePlugin()` (`#restarting`) keeps the drag, because the wrappers send `manualColumnMove` with every
  render.
- `#cancelDrag()` is also the reset of both mousedown branches that start no drag, so the reset fields cannot drift
  apart. It goes through `#endDrag()`, which `#onMouseUp()` shares and which moves the guideline back to the master
  table.

Pinned by `tests/e2e/manual-column-move-data-replace.spec.ts`.

## DataProvider blocks this plugin

`registerConflict('dataProvider', ['manualColumnMove', …])`: with a complete server-backed `dataProvider`
configuration, **DataProvider** is the plugin that stays disabled. See `../base/AGENTS.md`.

## Standing TODO

`// TODO: move adding plugin classname to BasePlugin.` — both move plugins add their root class name by
hand. If you move that to `BasePlugin`, do both at once.

## Where to look next

- The row mirror: `../manualRowMove/AGENTS.md`.
- The plugin competing for the same header gesture: `../columnSorting/AGENTS.md`.
- The start freeze line and `restoreColumnPosition`: `../manualColumnFreeze/AGENTS.md`.
- Moving *cells* rather than columns: `../moveCells/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualColumnMove'`

`__tests__/` splits into `manualColumnMove.spec.js`, `manualColumnMoveUI.spec.js`, `positioning.spec.js`,
`scrolling.spec.js`, `selection.spec.js`, plus `ui/` and `rtl/`. Positioning and RTL catch most UI
regressions.

## `fixedColumnsEnd`: the end columns are a band of their own

`isMovePossible()` also refuses a move that crosses the end line (`#keepsEndBandIntact`), so `moveColumns()`,
`dragColumns()` and the UI all honor it: a move may not change which columns the band holds. An end column
cannot leave the band, a scrolling column cannot land inside it, and a selection that holds both moves only when
the result puts the same columns back in the band (a full saved column order that keeps the end columns last
passes, which is also what the initial `manualColumnMove` array relies on). The band is the last `fixedColumnsEnd`
columns of `hot.countCols()`, so the columns `maxCols` hides lie past it and are not frozen. Nothing is restricted
while `fixedColumnsEnd` is `0`.
Unlike the start side (which no plugin guards, see "The start freeze line is positional"), the end side is
guarded here, because no other plugin owns the end band. `ManualColumnFreeze` additionally refuses to freeze or
unfreeze in a way that would move a column across the end line, so the end band is protected on both paths. The count is
`getFixedColumnsEndCount()`: `clampFixedColumnsEnd(fixedColumnsEnd, fixedColumnsStart, hot.countCols())`, the same
clamp and the same total (capped by `maxCols`) the renderer uses. Do not count over the uncapped source columns, or the
guard protects columns the grid never draws. `fixedColumnsStart` keeps the priority when the bands would overlap.
**It reads the CONFIGURED band, not `hot.view.countFixedColumnsEnd()`.** With `limitFixedToViewport` the view returns
the drawn band, which can be smaller. A move from the scrolling columns into the configured band (columns 22 with an
end band of 10 over 30 columns, while only 2 are drawn) then passed the guard and shifted the columns in between
into the band, so a different set of columns was frozen at the end once the grid grew. The start side keeps reading
the drawn band (`isFixedColumnsStart()`), because the start band is positional and a move across its line changes no
count. This is the same rule `ManualColumnFreeze` and `CollapsibleColumns` follow. **The geometry is the other
way round:** `isFixedColumnsEnd()` positions the guideline and the backlight (`#getEndBandShift()` is added for a
column in the end clone), so it reads `hot.view.countFixedColumnsEnd()`, the band the grid draws, as `manualRowMove`
does. A column that scrolls while its configured band is only partly drawn must not get the shift, or the guideline
lands off by the remaining scroll distance. The guard and the geometry are two questions with two counts.

The backlight and the guideline live in the master's hider and scroll with it, while the end clone stands at the
inline-end edge. `#getEndBandShift()` is the distance between the two, never positive and zero at the inline-end
scroll limit, added for a hovered or grabbed end column the way the scroll offset is added for a start column.
It is read from the rendered boxes (the end clone against the hider: `clone.right - hider.right` in LTR,
`hider.left - clone.left` in RTL), not computed from the scroll metrics. The first version used
`scrollX + window.innerWidth - hiderWidth` for a window-scrolled grid; that ignores the offset of the grid's root
in the page (a body margin shifted the guideline by exactly that margin) and counts the vertical scrollbar.
The boxes serve a grid the element scrolls and a grid the window scrolls alike.
Pinned by `__tests__/fixedColumnsEnd.unit.js` (including hidden and trimmed columns: the band is the last
`fixedColumnsEnd` VISUAL columns of the not trimmed ones, a hidden column in it is part of the band but not drawn)
and `tests/e2e/fixed-columns-end-plugins.spec.ts` (element scroll and window scroll, LTR and RTL).
