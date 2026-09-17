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

The counting in `#onMouseMove` is gated on its `countDragStep` argument, and `#onAfterScroll` replays the
last pointer position with `countDragStep = false`. That is the other half of the trap — a scroll that
shifts a new cell under a resting pointer has to redraw the border without registering a drag that never
happened.

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

With `autoInsertRow: true`, dragging past the last row inserts rows (`insert_row_below`) on a 200 ms
interval while the pointer stays outside. `addingStarted`, `mouseDragOutside` and `handleDraggedCells`
together are the state machine for that — clear all of them on teardown, not just one.

## Read cell meta transiently

The fill loop only reads `source` and `_complexDataFormat`, so it uses `getCellMetaTransient`. A large
drag-fill or fill-down with the eager `getCellMeta` permanently materializes one meta object per filled
cell. `_complexDataFormat` is a private plugin key with no public declaration — that is why the local
`AutofillCellProperties` interface exists rather than an index-signature `any`.

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
