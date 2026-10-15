# Autofill plugin — the fill handle

The `autofill` plugin owns drag-down and copy-down: the small square at the bottom-right of the selection.
Read this before touching `autofill.ts` or `utils.ts`.

Two behaviors, one handle:

- **drag-down** — drag the square to expand the selected values into neighboring cells.
- **copy-down** — double-click the square to copy the selection into all empty cells below.

## The setting is `fillHandle`, not `autofill`

`PLUGIN_KEY` is `autofill` but `SETTING_KEYS` is `['fillHandle']`, and `isEnabled()` reads `fillHandle`.
So `updateSettings({ autofill: … })` does **nothing** — the user-facing option has always been
`fillHandle`. Do not "fix" that; it is the published API.

`DEFAULT_SETTINGS` is `{ direction: undefined, autoInsertRow: true }`, both validated by
`SETTINGS_VALIDATORS`. `direction` accepts only the values in `DIRECTIONS` (or `undefined`, meaning both
axes are allowed).

## Three hooks it registers on the singleton

`modifyAutofillRange`, `beforeAutofill`, `afterAutofill`. `beforeAutofill` is the veto point and
`modifyAutofillRange` can rewrite the target range, so anything that has to constrain a fill belongs in one
of those rather than in this plugin.

## The invisible-cell extrapolation

A fill area may start or end on a hidden cell. The highlighted selection stores **renderable** indexes only
(that is Walkontable's contract), so there is no record of the hidden endpoints — the plugin extrapolates
where the start and end are. Any change to range computation has to keep that extrapolation, or a fill that
touches a hidden row silently loses a row.

## Dragging past the table's edge (DEV-2024)

Drag counting is driven by `beforeOnCellMouseOver`, and that hook **does not fire once the pointer leaves
the table element** — dragging the last column's fill handle at a slight angle is enough. So `#onMouseMove`
counts the drag as well, whenever the pointer sits outside the selected range. Without that, a fill made
with such a drag is never committed: `#onMouseUp` only *reads* `handleDraggedCells`, and calls `fillIn()`
only when it is greater than 1.

The counting lives in `#followPointer`, gated on its `countDragStep` argument, and `#onAfterScroll` replays
the last pointer position with `countDragStep = false`. That is the other half of the trap — a scroll that
shifts a new cell under a resting pointer has to redraw the border without registering a drag that never
happened. The two `scrolled after pressing the fill handle` specs in `autofill.spec.js` pin it, and they are
also why the mouseup gate cannot simply become "the fill border extends past the selection": a scroll moves
the border too.

The one replay that **does** count is the one after an auto-inserted row (see "Auto-inserting rows"). The
drag itself grew the grid there, so the new row under the resting pointer is a real drag step.

## Resolving the drag direction (DEV-140)

`redrawBorders()` takes the drag direction from `resolveDragDirection()` (`utils.ts`), fed with how many
rows and columns the pointer's cell lies outside the selection (`getDistanceOutsideRange()`). The fill
handle sits on the selection's bottom-end **corner**, so a pointer moving diagonally leaves the selection
on both axes with its very first sample, however slowly it moves. The direction is then taken from the
axis the pointer is further outside on, and a tie resolves as vertical (the pre-18.0 behavior, where the
row axis always won). An axis the `direction` option leaves out is ignored, so it can neither win nor
block the allowed one. Once resolved, the direction is kept until the pointer comes back inside the
selection along its axis, and then switches to the other one.

Before DEV-140 the direction was resolved only when exactly one axis had changed. A diagonal drag then
drew no preview and filled nothing at all – a regression from 18.0.0 (DEV-99, #12344), which replaced
the old per-sample projection with the sticky direction. Distances are counted in cells, not pixels: no
layout read, and the same answer under RTL, at the cost of a one-row, one-column move resolving as
vertical even when the pointer travelled further sideways. The distances are in VISUAL indexes, so hidden
rows or columns between the selection and the pointer count toward their axis. Pinned by `__tests__/utils.unit.ts` and
`tests/e2e/fill-handle-diagonal-drag.spec.ts`.

## Two drag-state fields, one sentinel (GitHub #13370)

`mouseDownOnCellCorner` is the **gesture flag** (set on `afterOnCellCornerMouseDown`, cleared in
`#onMouseUp`), `handleDraggedCells` is the **step counter**. Only the flag says whether a corner gesture
is in progress – `fillIn()` legitimately zeroes the counter through `resetSelectionOfDraggedArea()`.

That matters because the corner double-click is not a native `dblclick`: Walkontable synthesizes it
from the mousedown/mouseup pairs and fires it from its `mouseup` listener on the **holder**, which runs
before this plugin's `mouseup` listener on the `documentElement` (bubble order). On a copy-down that
applies, `fillIn()` has therefore already zeroed the counter when `#onMouseUp` runs. Gating the teardown
on the counter skipped it and left `mouseDownOnCellCorner` stuck, so `#onMouseMove` kept redrawing the
fill border under a released pointer. Gate any teardown on the flag, never on the counter.
`tests/e2e/fill-handle-double-click.spec.ts` pins it with a real-pointer double-click.

**The teardown rule covers the lifecycle path, not just `mouseup` (DEV-2782).** `disablePlugin()` is the
second way a gesture ends: `updateSettings({ fillHandle: false })` routes through
`BasePlugin.onUpdateSettings`, which calls `disablePlugin()` **alone** – no `enablePlugin()` follows, the
way it does inside `updatePlugin()`. The base class then clears the event manager, so the
`documentElement` `mouseup` listener that owns the teardown is gone before the button is released and
`#onMouseUp` never runs. Both teardown paths therefore share `#resetDragState()`, and any new field that
belongs to a live corner gesture belongs in it. One field deliberately stays out: `addingStarted` mirrors
a pending `addRow()` timeout registered through `_registerTimeout`, that timeout still fires after the
plugin is disabled and clears the flag itself, so resetting it early lets a re-enabled drag schedule a
second `addRow()` and insert two rows. Cancel the timer if that ever has to change.

**A reconfiguration is not a disable, and the difference is load-bearing.** `updatePlugin()` calls
`disablePlugin()` too, and `BasePlugin#isRelevantToSettings()` tests whether a `SETTING_KEYS` entry is
**present** in the payload, not whether its value changed – so `updateSettings({ fillHandle: true })`
reaches `updatePlugin()` with the value unchanged. That is not a rare shape: the React wrapper forwards
every declared prop on every re-render (`fillHandle` is not in its `DEEP_COMPARABLE_SETTINGS`), so any
sibling state change re-sends it, mid-drag included. Resetting unconditionally in `disablePlugin()`
therefore cancelled a live drag on an ordinary re-render. `#isReconfiguring` is the carve-out:
`updatePlugin()` raises it around its disable/enable pair, and the reset is skipped while it is set,
because the `mouseup` listener is re-registered in the same tick and the gesture is genuinely still
live. Any future teardown added to `disablePlugin()` has to respect that flag, or it re-creates the
regression.

The carve-out is scoped to a reconfiguration that **changes nothing**, and that is not the same as
"any `updatePlugin()` pass". A pass that genuinely narrows what a fill may do has to end the gesture
as well, or `#onMouseUp` commits it under the rules it was drawn with: drag down with both axes
allowed, send `fillHandle: 'horizontal'`, release without moving, and the abandoned vertical drag
fills anyway. So `updatePlugin()` compares the **resolved** configuration (`directions`,
`autoInsertRow`) across its disable/enable pair and resets when it moved. Resolved, not raw, because
`'vertical'` and `{ direction: 'vertical' }` are the same configuration and neither should end a
drag. `tests/e2e/fill-handle-disable-mid-drag.spec.ts` pins all three outcomes: the disable ends the
gesture, the same-value re-send does not, the direction change does.

## The `documentElement` listeners outlive a failed init (DEV-2874)

`enablePlugin()` runs on `afterPluginsInitialized`, which fires **while `Core#init`'s
`runHooks('beforeInit')` executes**. `hot.table` is assigned later and exactly once, by
`TableView#createElements()`, reached from the `this.view = new TableView(this)` that follows in the
same function. So between those two statements this plugin already holds live `mousemove`/`mouseup`
listeners on `rootDocument.documentElement` while `hot.table` is still `undefined`. (Cited by symbol,
not by line: `core.ts` moves constantly and a stale line number is worse than none. Grep the calls.)

An init that aborts inside that window leaves those listeners bound forever. The constructor threw, so
the caller holds no instance and can never `destroy()` it, and the leak is cumulative – one live
listener per aborted attempt. The `this.updateSettings(mergedUserSettings, true)` between those two
statements sits right in the gap: the deprecated `rows`/`cols`/`ganttChart` settings throw there
unconditionally (the three `'is no longer supported'` `throwWithCause` calls at the top of
`Core#updateSettings`), an unresolvable string cell type in `columns` throws during meta resolution, and
a user `beforeInit` hook that throws does it even earlier (settings-declared `beforeInit` is registered
after the plugin constructors, so the plugins are enabled first). The set of throw sites is not
enumerable, which is why the **consumer** is guarded and not the producer.

`#onMouseMove` therefore must not touch `this.hot.table` unless a gesture is armed. It used to call
`getIfMouseWasDraggedOutside()` outside the `mouseDownOnCellCorner` block, so every pointer move
anywhere on the page threw `Cannot read properties of undefined (reading 'ownerDocument')` out of
`offset()` – Sentry DEMOS-6J, reproduced from a demo runner where a live-typed config aborted the init
once per keystroke. The guard now short-circuits on `handleDraggedCells > 0`, which is the same
conjunction the branch already carried, so nothing changed except when the measurement is evaluated.
The result is named `shouldMarkDragOutside`, not for the row insertion: that is gated separately on
`autoInsertRow`, which the `fillHandle` schema default (`metaSchema.ts`) leaves `false`.

Two things not to get wrong here:

- **This guard uses the step counter, and the flag rule above does not apply.** Not because the flag
  would be unsafe – `#resetDragState()` clears `mouseDragOutside` on every teardown path, so there is
  no stale-true state for `addRow()` to fire from. The reason is narrower and stronger: `handleDraggedCells > 0`
  was **already** the second conjunct of this predicate, so hoisting it changes nothing but *when* the
  read-only measurement is evaluated. Gating on `mouseDownOnCellCorner` instead would also skip the
  `else` write, which is a different change needing its own equivalence argument for no gain. The
  counter is only ever raised together with the flag (`#onAfterCellCornerMouseDown`), so it implies a
  live gesture either way.
- **`undefined` and `null` are different bugs.** Every teardown path – `disablePlugin()`,
  `BasePlugin#destroy()`, `hot.destroy()` – clears this plugin's `EventManager` and so removes the
  document listeners, and `hot.destroy()` runs its plugin `destroy()` loop *before* the `objectEach`
  sweep that nulls instance properties. A future stack reading `ownerDocument` of **null** is a
  teardown-ordering regression; **undefined** is this pre-view window. Read the message before assuming
  a stale-reference-after-unmount story.

`tests/e2e/fill-handle-aborted-init.spec.ts` pins both halves: no page error on a pointer move after an
aborted init, and zero drag-outside measurements while nothing is held (with a real drag as the
positive control for the counter).

Do **not** guard `offset()` itself. Its parameter is a non-nullable `HTMLElement` and it has many call
sites; tolerating `undefined` there would hide unrelated bugs. A `return false` fallback inside
`getIfMouseWasDraggedOutside()` is no better – it is a silent wrong answer, and after the hoist it is
unreachable from its only caller.

## Auto-inserting rows

With `autoInsertRow: true`, dragging past the last row inserts one row (`insert_row_below`) 200 ms after the
pointer is found outside, and another only after the pointer moves again: the insertion is triggered from
`mousemove`, so a pointer held still does not keep inserting. Reaching the last row by hovering it schedules
one as well (`addNewRowIfNeeded()`, from `beforeOnCellMouseOver`). `addingStarted`, `mouseDragOutside` and
`handleDraggedCells` together are the state machine for that — clear all of them on teardown, not just one.

Three rules for the insertion timer in `addRow()`, each a DEV-140 defect:

- **It inserts only while the gesture is live.** A flick released within the 200 ms used to insert a row
  after the release, with no fill to extend into it. The callback still clears `addingStarted` on that path, so
  the "Two drag-state fields" rule above about that flag holds.
- **It follows the pointer after inserting.** The new row appears under a pointer that may not move again
  before the release, so the timer calls `#followPointer()` with the last position, counted. Without it
  the preview stayed on the selection and the step counter stayed at 1 (a pointer below the table maps
  back onto the selection's own last row), so the release filled nothing and left the new row empty.
  A consequence: when the new row lands **under** the pointer (rows are taller than the pointer's distance
  below the table), the browser fires `mouseover` on it, the preview now reaches the last row, and
  `addNewRowIfNeeded()` adds one more spare row. That is the hover rule above working as designed, and it
  stops after one row, but it makes row counts depend on the theme's row height — the Playwright spec keeps
  its pointer 80 px below the table for that reason.
- **It is guarded after `alter()` too.** A hook the insertion runs can end the gesture or destroy the
  grid; `#lastMouseClientPosition` is private, so `BasePlugin#destroy()` does not clear it, and the
  replay would run against a torn-down instance without the re-check.
- **"Outside" is decided per axis.** `getIfMouseWasDraggedOutside()` never counts a pointer as outside
  while the drag already extends the selection sideways (the direction is sticky, so the new row would
  stay empty). Otherwise a pointer below the table is outside when horizontal fill is not allowed, or
  when it is further below the table than past its inline-end edge (the left one under RTL), measured in
  pixels from the table's edges. It used to require `clientX <= tableRight`, so a vertical-only
  drag that drifted a few pixels right of the grid inserted nothing, while under RTL the check had no
  inline-end limit at all.

## Read cell meta transiently

The fill loop only reads `source` and `_complexDataFormat`, so it uses `getCellMetaTransient`. A large
drag-fill or fill-down with the eager `getCellMeta` permanently materializes one meta object per filled
cell. `_complexDataFormat` is a private plugin key with no public declaration — that is why the local
`AutofillCellProperties` interface exists rather than an index-signature `any`.

## Read cell values raw, through `_getCopyableData()` (DEV-2942)

`Core#getCopyableData()` returns a **string**, as its docs and type always said: the value goes
through `stringify()`. `getSelectionData()` must not call it. Its values are written back into the grid
by `populateFromArray()` and handed to `beforeAutofill`, so a number has to stay a number. The loop
reads through the private `_getCopyableData()` instead, which keeps the `copyable` gate and skips the
conversion. The method is not on the public `HotInstance` type, so the call goes through the local
`HotInstanceInternal` type at the top of `autofill.ts` – do not add it to `HotInstance`. Swap it back and a dragged `1` lands as `'1'`, a checkbox `true` as `'true'` – the
non-string fill spec in `autofill.spec.js` and an older numeric fill spec both go red.
`getCopyableSourceData()` is not affected: it still returns the stored value.

## Object-cell data (DEV-1659)

A fill across cells whose values are objects was once silently blocked when properties were `undefined` or
the key order differed. Compare object cells by content, never by key order or by `JSON.stringify`.

## Auto-scroll while dragging is a different plugin

The fill handle arms DragToScroll through `afterOnCellCornerMouseDown`, and DragToScroll deliberately does
**not** extend the selection for a corner drag — this plugin owns that continuation via its own
`afterScroll` listener. See `../dragToScroll/AGENTS.md`.

## Where to look next

- Auto-scroll arming and the per-drag-kind ownership rule: `../dragToScroll/AGENTS.md`.
- The mobile drag path (no `mousemove` on a phone): `../multipleSelectionHandles/AGENTS.md`.
- Related selection gestures: `../moveCells/AGENTS.md`, `../selectionHandles/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autofill'`

`__tests__/` is split into `hooks/`, `options/`, `rtl/` and `rendering.spec.js` — RTL has its own directory
because fill direction flips with the layout.
