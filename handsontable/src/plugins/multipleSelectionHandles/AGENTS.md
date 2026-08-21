# MultipleSelectionHandles plugin — the mobile selection handles

The `multipleSelectionHandles` plugin drives the two round grab-points on a selection's corners on touch devices. Read this before touching `multipleSelectionHandles.ts`.

It is `@private` and has no setting: `isEnabled()` returns `isMobileBrowser()`, which is a **user-agent test evaluated when the plugin initializes**. Switching a browser into device emulation after the grid was built does nothing — reload, or no handles exist. That single fact is the most common reason a mobile test or manual check "fails" for the wrong reason.

## This is the only drag path a phone has

`3rdparty/walkontable/src/selection/border/border.ts` gates the desktop affordances behind `!isMobileBrowser()` and creates these handles instead (`createMultipleSelectorHandles`, keyed on `isMobileBrowser() && isDataViewInstance`). So on mobile:

- The desktop `selectionHandles` resize handles and the `moveCells` edge bands are **not rendered**, and `afterOnSelectionHandleMouseDown` / `afterOnSelectionEdgeMouseDown` **never fire**. A plugin waiting on those hooks is never armed on a phone.
- A plain finger drag across cells is **native scrolling by design** — `walkontable/src/event.ts` defers the synthesized mousedown to `touchend` so a drag scrolls instead of selecting.

Both together mean: if a feature should work while dragging on mobile, it has to hook into *this* plugin. DragToScroll does exactly that, by asking `isDragged()` from its own document-level `touchstart` listener (see `../dragToScroll/AGENTS.md`).

The handle DOM lives in the border, not here — this plugin only reads the hit-area classes `topSelectionHandle-HitArea` and `bottomSelectionHandle-HitArea` off the event target.

## Resolving the finger

**Use `getCellCoordsFromMousePosition()` (`helpers/dom/cellCoords.ts`), not `document.elementFromPoint()`.** The helper clamps the position to the viewport and returns the nearest cell, so a finger dragged *past* the grid edge still maps to a real cell. `elementFromPoint` returns nothing usable out there, which froze the selection at the last rendered cell — half of issue #11658.

**De-duplicate per-move updates on coordinates, never on the resolved `td`.** Walkontable reuses the same elements across scrolls, so under a finger that is holding still the element is identical on every tick while the cell it represents changes. Comparing elements silently skips every update during an auto-scroll. `#lastTargetCoords` exists for this.

**Read `selectedRange.getDirection()` before the conditional `setRangeEnd`.** `#extendSelection` calls `setRangeEnd` first when the range is a single cell, and that mutates the range — so the direction handed to `getCurrentRangeCoords` must be captured on entry, or a 1×1 selection resizes along the wrong axis.

## Gesture lifecycle

`dragged` holds which handles are being dragged, and `isDragged()` is public because DragToScroll reads it. Keeping it honest matters — a stale `true` lets an unrelated touch arm auto-scroll with no handle press at all.

- **`touchcancel` must reset everything** (`#resetDrag`). A cancelled gesture never reaches `touchend`, and browsers cancel often on a real device.
- **`touchend` fires per touch point.** Tear the drag down only once the last finger is up (`getFirstTouchPoint(event) === null`), or a second finger lifting kills a drag still in progress.
- In a real browser the `touchend` target is the element captured at `touchstart`, so a release over a cell still carries the handle's hit-area class. The **legacy Jasmine specs dispatch `touchend` on the destination cell instead**, so `dragged` does not clear there — do not read those specs as a statement about real behavior.

`#onAfterScroll` re-extends the selection at the last known finger position after each scroll, because a finger held still past the edge emits no further `touchmove`. It does not run away: the target is resolved against the *current* viewport and then de-duplicated on coordinates, so it reaches a fixed point after one step — measured with `dragToScroll: false`, where nothing suppresses the scroll-into-view, it stops after one row and stays there.

## Where to look next

- The auto-scroller this plugin arms: `../dragToScroll/AGENTS.md`.
- Handle DOM and the mobile/desktop split: `3rdparty/walkontable/src/selection/border/border.ts`.
- Writing tests for any of this: `tests/AGENTS.md` ("Touch and mobile specs").
- Plugin contract, hooks, lifecycle: `handsontable-plugin-dev` skill.
