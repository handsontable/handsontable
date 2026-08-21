# DragToScroll plugin — auto-scroll while dragging

The `dragToScroll` plugin scrolls the viewport when a drag reaches its edge. Read this before touching `dragToScroll.ts`, `autoScroller.ts`, `scrollTimer.ts`, or `utils.ts`.

It owns **only the scrolling**. Whoever started the drag owns the selection: this plugin extends the selection itself for a plain cell drag and for nothing else.

## Two input paths, and the mobile one is easy to forget

The plugin listens on the document of `rootWindow` **and every parent frame** (`registerEvents()` walks up with `getParentWindow`).

- **Mouse:** `mousemove` feeds positions, `mouseup` ends the drag.
- **Touch:** `touchstart` / `touchmove` / `touchend` / `touchcancel`. These are not optional — no browser fires `mousemove` while a finger is down, so without them the plugin is dead on mobile. That was issue #11658.

Both paths funnel into `#trackPointer(clientX, clientY)`. Add new pointer sources there, not in a copy of it.

Rules that cost real bugs to learn:

- **End on `touchcancel` as well as `touchend`.** A browser cancels a gesture often on a real phone — a system gesture, an incoming call, the browser claiming the touch for scrolling. `touchend` then never fires.
- **`touchend` fires per touch point, not per gesture.** A second finger or a palm lifting must not stop a drag the first finger is still performing; there is no re-arm path short of a new `touchstart`, so auto-scroll would stay dead for the rest of the drag. `#onTouchEnd` returns early while `getFirstTouchPoint(event)` is still non-null.
- **Narrow touch events with `getFirstTouchPoint()` / `hasTouchList()`** from `helpers/dom/event.ts`, never `instanceof TouchEvent`: this plugin listens across frames, each frame has its own constructor, and desktop Safari has no `TouchEvent` at all.

## Arming: the drag's owner decides, this plugin asks

`#setupListening(kind, event, controller)` computes the boundaries and starts listening. It is reached five ways, and four of them are hooks:

| Drag | Entry point | Guard |
|---|---|---|
| plain cell drag-select | `beforeOnCellMouseDown` | skipped when `selectionMode: 'single'` |
| autofill corner | `afterOnCellCornerMouseDown` | — |
| move-cells edge band | `afterOnSelectionEdgeMouseDown` | `getPlugin('moveCells').isDragActive()` |
| desktop selection handle | `afterOnSelectionHandleMouseDown` | `getPlugin('selectionHandles').isDragActive()` |
| **mobile selection handle** | its own document `touchstart` | `getPlugin('multipleSelectionHandles').isDragged()` |

The guards exist because those hooks fire unconditionally from `TableView`, while the owning plugin may reject the press. Without the check, auto-scroll would run with no drag in progress.

**The ordering the guards depend on comes from two different mechanisms — do not mix them up.**

- For the *hook* paths it is `PLUGIN_PRIORITY`: MoveCells is 25 and SelectionHandles 24, against this plugin's 100, so their state is already settled when the guard reads it.
- For the *mobile* path there is no hook at all, so priority is irrelevant (MultipleSelectionHandles is 160 — it would run *after*). The guarantee is **DOM bubbling**: that plugin listens on `rootElement`, a descendant of the document this plugin listens on, so it has already recorded the drag. `EventManager` ignores a handler's `return false`, so the event really does keep bubbling.

## The auto-scroller runs on its own timer

`ScrollTimer#tick` reschedules itself. Consequences:

- **One move past the edge is enough to start it**, and it keeps scrolling while the finger or mouse rests. Tests must not assume a fresh event per scroll step — assert on progress over time instead (see `tests/AGENTS.md`).
- It stops when `check()` reports a zero diff, when `scrollViewportTo` reports no movement (`stopVertical` / `stopHorizontal`), or on `unlisten()`.
- `unlisten()` is the single teardown: it clears the drag kind, the last pointer position, the controller and the timers. Reach for it rather than clearing fields by hand.

## Selection extension is per drag kind

`#onAfterScroll` extends the selection **only when `#activeDragKind === 'cell'`**. Corner, move and handle drags return early on purpose — autofill, MoveCells, SelectionHandles and MultipleSelectionHandles each own their own `afterScroll` continuation. Adding extension here for another kind means two plugins fighting over the same range.

`#onAfterSelection` sets `preventScrolling.value = true` while listening and outside the viewport, so `setRangeEnd` does not scroll-into-view and undo the auto-scroll. It is deliberately limited to the active-drag window, or ordinary `selectCell` calls would stop scrolling into view.

## Where to look next

- The mobile drag that drives this plugin: `../multipleSelectionHandles/AGENTS.md`.
- Interval curve: `utils.ts` `calculateInterval` (logarithmic, `interval` + `rampDistance` settings).
- Clamping a pointer to a cell: `helpers/dom/cellCoords.ts` `getCellCoordsFromMousePosition`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
