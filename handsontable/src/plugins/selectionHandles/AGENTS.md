# SelectionHandles plugin — desktop selection edge handles

The `selectionHandles` plugin draws grab handles on the selection's edges and resizes the selection when one
is dragged. Read this before touching `selectionHandles.ts` or `helpers.ts`.

**Desktop only.** The mobile equivalent is a separate plugin with a separate gesture model —
`../multipleSelectionHandles/`. Do not merge them; the touch path has rules this one does not need
(per-finger identity, `touchcancel`).

## Opt-in, strictly

`isEnabled()` is `getSettings()[PLUGIN_KEY] === true` — an exact comparison, not `!!`. So a truthy object
does **not** enable it. `PLUGIN_PRIORITY = 24`.

## `isDragActive()` exists for one caller

DragToScroll must not start auto-scrolling for a press this plugin rejected, and the hook it listens on
(`afterOnSelectionHandleMouseDown`) fires unconditionally from `TableView`. So `isDragActive()` is reachable
through `getPlugin` — marked `@private`, not public API. Priority 24 against DragToScroll's 100 is what
guarantees this plugin's state is already settled when that guard reads it. See
`../dragToScroll/AGENTS.md`.

## The drag session is one object, cleared in one place

`#drag` holds the edge, layer, the four range bounds and the focus cell. Alongside it: `#lastCoords`,
`#bodyCursor` (the host cursor, saved so it can be restored) and `#pointerPosition` (so an auto-scroll can
continue the resize without a new pointer event).

`#endDrag()` is the single teardown, and `disablePlugin()` calls it **and** clears the hovered layer
(`selection.setHandlesHoveredLayer(null)`). Clearing fields by hand instead leaves the host cursor stuck or
a handle painted as hovered.

## `clampEdge()` — an edge may not cross its opposite

`helpers.ts` clamps by which edge is being dragged: `top`/`start` take `Math.min(bounded, oppositeIndex)`,
`bottom`/`end` take `Math.max(...)`. Both are floored at 0. That is what stops a drag from inverting the
range instead of resizing it.

## Hover must never replay the selection

The hover wiring (`#onCellMouseOver`, `#onRootMouseLeave`, `#onDocumentMouseUp`) only decides which layer shows
the handles. `Selection#setHandlesHoveredLayer` stores that layer and fires the `afterSetHandlesHoveredLayer`
local hook, and core answers with `view.render()`. That is enough, because the layer is read only when the
borders are drawn (`isAdjustHandlesVisibleFor`, through the `adjustHandlesVisible` border setting).

It used to call `selection.refresh()`, which clears and replays every layer through `setRangeEnd` with the
source `'refresh'`. Two things came with that, both on every hover in and out: the public selection hooks
(`beforeSetRangeEnd`, `afterSelection`, `afterSelectionEnd` and their `ByProp` twins) fired, and core's
`afterSetRangeEnd` scrolled the range back into view, because `'refresh'` is not one of its ignored scroll
sources. For that source `getComputedRowTarget` (`core/viewportScroll/utils.ts`) picks the range's FIRST row
when the range starts above the viewport and its last row only when it ends below it. A wheel scroll moves
cells under a resting pointer, so each crossing of the range edge snapped a downward scroll back to the
range's first row and the scroll stalled (DEV-3085).

Two rules follow. Never route a hover-only state change through `refresh()`. And use `view.render()`, not
`hot.render()`: the latter forces a full draw, which re-runs every rendered cell's renderer on a hover.
`tests/e2e/selection-handles.spec.ts` ("selectionHandles hover") pins the scroll offset, the hook log, an
exact wheel distance, a layer-to-layer hover, and zero cell repaints across a hover in and out (the last one
is what fails if `hot.render()` replaces `view.render()`).

## Two input rules

- **A right-press must not start a resize.** It opens the context menu; without the guard the release would
  also commit a resize.
- **`mouseleave` on the root element and `mouseup` on `documentElement`** are raw listeners, not hooks —
  a drag that ends outside the grid still has to end. They go through `this.eventManager`, so
  `disablePlugin()` removes them.

Mouse events are narrowed without `instanceof MouseEvent`, because the grid may live in an iframe whose
constructor is a different realm's. MoveCells narrows identically.

## Where to look next

- Mobile handles, and the touch rules this plugin does not carry: `../multipleSelectionHandles/AGENTS.md`.
- Auto-scroll while dragging: `../dragToScroll/AGENTS.md`.
- Sibling gestures on the same selection: `../moveCells/AGENTS.md`, `../autofill/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='selectionHandles'`

`__tests__/lazyBorderElements.unit.js` pins that the handle elements are created lazily — a grid with no
selection must not pay for them.
