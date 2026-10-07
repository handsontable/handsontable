# FreezeBar plugin – a draggable bar on each freeze line

Covers `freezeBar.ts` (the plugin), `snapResolver.ts` (pointer to count) and the pure fit helper it uses, `src/utils/frozenAreaFit.ts`. Read this before touching how a count is written, or where a bar is mounted.

## What it owns and what it does not

- It owns the bars, the drag guide, and the write of the four frozen counts (`fixedRowsTop`, `fixedRowsBottom`, `fixedColumnsStart`, `fixedColumnsEnd`) that a user starts.
- It does not own freezing itself. `ManualColumnFreeze` moves a column to the freeze line and keeps the first N columns frozen. This plugin never moves a column and never touches the column index mapper, so the two can run together.
- It does not own the viewport clamp of the rendered area (#4259). It only keeps its own drag inside what fits, through `getMaxFittingFrozenCount`.

## The traps

- **The count is written on the table meta inside `runOperation`, never through `updateSettings()`.** `getSettings()` returns the table meta, so assigning to it creates an own property that shadows the global value, which is what `alter()`, `ManualColumnFreeze` and UndoRedo do. Three things break with `updateSettings`: a wrapper re-sends every prop on each render, so a changed global value is reverted by the next render (the drop of the shadow is keyed on a changed incoming value, `FROZEN_COUNT_OPTIONS` in `core.ts`); a grid configured with `fixedColumnsLeft` throws when `fixedColumnsStart` is also passed; and a write of `fixedRowsTop` disables Pagination silently. Start columns are written to `_fixedColumnsStart`, the backing field both names share.
- **The cost of that choice is the app's contract.** The settings the app passed in are not changed, so an app that re-sends the same value after a drag keeps the dragged count. An app that keeps the counts in its own state copies them in `afterFreezeChange`. Do not also write the global value to "fix" this: the re-sent original value then differs and reverts the drag.
- **Undo needs no code.** UndoRedo's grid state already captures and restores all four counts, and one `runOperation` per release is one undo step.
- **Pagination is blocked here.** A write on the table meta never reaches the conflict registry, so Pagination would stay enabled next to fixed rows, a combination it does not support. `#isEdgeAvailable` hides the row bars and refuses `setFreezeCount('top' | 'bottom')` while it is on.
- **Counts are visual.** A hidden track keeps its slot in the band and a trimmed track gives its slot up. The resolver sees a hidden track as size 0 and, on equal distances, picks the lowest count, so a hidden track right after the last frozen one stays unfrozen. A keyboard step skips hidden tracks (`#stepOverHidden`).
- **The pointer distance is measured from the visible part of the root element, not its bounding box.** In window scroll mode the overlays are `position: sticky`, so the root element's own edge may be scrolled out of view; `#getVisibleRect` intersects it with the viewport on the axes the window scrolls. The guide is placed from the root element's edge, so it adds the difference back.
- **Where a bar lives (measured on a demo page).** A bar for a band with frozen tracks is a child of that overlay's root (`.ht_clone_*`). It needs no repositioning in element or window scroll, or in RTL, and the clone roots do not clip it. With nothing frozen and no headers every clone is 0×0, so the handle of an empty edge cannot live there: it is a child of the root element, placed on the edge of the data area. In window scroll mode that handle is on the grid's own edge, so the end and bottom handles are at the far end of the page.
- **The drag uses Pointer Events**, so mouse, touch and pen share one path. `touch-action: none` is on the bar, and `@media (pointer: coarse)` grows its hit area to 44px with a pseudo-element. The gesture is tracked by `pointerId`; `pointercancel` stores nothing.
- **The keyboard works on the focused bar, not through the shortcut manager.** The bar is a `role="separator"` with its own `keydown` handler that stops the event, so the arrow keys never move the cell selection. The arrows point in the direction the bar moves: start and top grow with ArrowRight and ArrowDown, end and bottom grow with ArrowLeft and ArrowUp, and the horizontal arrows swap in RTL. While the grid listens, Tab moves the cell selection, so F6 (a shortcut in the `grid` context, group `freezeBar`) moves the focus to the first bar. Ctrl, Alt and Meta chords are left alone. End goes to the largest count that fits, Home to 0.
- **`updatePlugin()` keeps the bars.** A wrapper re-sends every prop on each commit, and an app that copies the count into its state in `afterFreezeChange` triggers a commit per arrow press. Tearing the bars down there dropped the focus from the bar and cancelled a drag. A bar that changes host (an edge going from 0 to 1 frozen tracks moves it from the root element to an overlay) is re-focused after the move, because moving a node blurs it.
- **`aria-valuemax` is resolved on focus and on drag start, not on `afterRender`.** It walks the size of every track on the axis, and `afterRender` runs on every scroll. Keep `#syncBar` cheap. The attributes follow the `ariaTags` setting.
- **`getFreezeCount('end')` is the effective count** (`TableView#countFixedColumnsEnd()`, clamped by the start band), so the hooks and `aria-valuenow` agree with what is drawn.
- **Turning the plugin off removes the bars, not the counts.** The counts live on the table meta as own properties, so the frozen area stays as the user left it until `updateSettings` changes the option that holds it.
- **Teardown must be safe mid-drag.** Wrappers call `disablePlugin()` and `enablePlugin()` on a rerender. `#teardown` aborts the drag (it removes the document listeners and stores nothing), removes the guide and every bar.
- **`SETTING_KEYS` is left at its default.** The bars follow `afterRender`, so a change of the frozen counts from anywhere (the API, `alter()`, undo) repositions them without a settings round trip.

## Where to look next

- `../base/AGENTS.md` for the plugin contract and the `PLUGIN_PRIORITY` table (380).
- `../manualColumnFreeze/AGENTS.md` for the other writer of `_fixedColumnsStart`, and the open #4259 note.
- `../../utils/manualResize/AGENTS.md` for the gesture this one is modeled on.
- `../undoRedo/AGENTS.md` for how the counts are captured and restored.
- The `handsontable-plugin-dev` skill for the workflow.

## Testing

- `npm --prefix handsontable run test:unit.jest -- --testPathPattern=freezeBar` runs the unit tests. jsdom has no layout, so the unit tests give the viewport a size with `jest.spyOn` on the view.
- `tests/e2e/freeze-bar.spec.ts` (mouse, keyboard, RTL, window scroll, pagination, teardown) and `tests/e2e/freeze-bar-touch.spec.ts` (a real finger through the DevTools protocol) drive the fixture `tests/fixtures/demo/freeze-bar.html` through `tests/fixtures/pages/FreezeBarPage.ts`.
- After a change to `src/styles`, rebuild `build:umd` before an end-to-end run: the bundle inlines the base stylesheet.
