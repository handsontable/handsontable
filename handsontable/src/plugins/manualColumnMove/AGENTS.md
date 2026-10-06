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

## `isDragging()` is the shared click-versus-drag verdict

```js
isDragging() { return this.enabled && this.#pressed && this.#dragged; }
```

ColumnSorting asks this **on release** to tell a click apart from a drag, so the two plugins cannot disagree
about where that line is — it has no tolerance logic of its own, it just calls
`manualColumnMove?.isDragging()`.

**So `POINTER_DRAG_TOLERANCE = 3` in this file is the single source of truth for that threshold.** Do not go
looking for a second copy in ColumnSorting and do not add one: the comments at `manualColumnMove.ts:19` and
`:716` claim the value is duplicated there, and they are stale — `columnSorting/` contains no tolerance
constant, no `Math.abs`, and no press-origin tracking.

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
columns the grid DRAWS, so the columns `maxCols` hides lie past it and are not frozen. The plugin is enabled before
the table view exists, so `getFixedColumnsEndCount()` falls back to the same clamp over `countCols()` there. Nothing is restricted while `fixedColumnsEnd` is `0`.
Unlike the start side (which no plugin guards, see "The start freeze line is positional"), the end side is
guarded here, because no other plugin owns the end band. `ManualColumnFreeze` additionally refuses to freeze or
unfreeze in a way that would move a column across the end line, so the end band is protected on both paths. The count is
`hot.view.countFixedColumnsEnd()` (`TableView`), which clamps over `hot.countCols()`: the same total the renderer
uses, capped by `maxCols`. Do not count over the uncapped source columns, or the guard protects columns the grid
never draws. `fixedColumnsStart` keeps the priority when the bands would overlap.

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
