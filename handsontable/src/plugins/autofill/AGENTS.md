# Autofill plugin — the fill handle

The `autofill` plugin owns drag-down and copy-down: the small square at the bottom-right of the selection.
Read this before touching `autofill.ts` or `utils.ts`.

Two behaviors, one handle:

- **drag-down** — drag the square to expand the selected values into neighbouring cells.
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
the table element** — dragging the last column's fill handle at a slight angle is enough. The drag is
therefore counted a second time on the mouse-up path. Without it, a fill made with such a drag is never
committed.

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
