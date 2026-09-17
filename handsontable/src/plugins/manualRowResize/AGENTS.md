# ManualRowResize plugin — dragging a header edge to set a height

The `manualRowResize` plugin stores heights the user set by dragging the row header's bottom edge. Read this
before touching `manualRowResize.ts`.

**The drag itself is not in this plugin.** The handle, the guide, the press and double-click state and the
resize hooks live in `../../utils/manualResize/resizeGesture.ts`, shared with `../manualColumnResize/`, and the row
specifics the gesture needs live in `ROW_RESIZE_AXIS` in `../../utils/manualResize/axis.ts`. Read
`../../utils/manualResize/AGENTS.md` before touching `disablePlugin()`, `destroy()`, or anything about the drag - that
is where the DEV-2719 teardown traps are, including why the drag must survive the update cycle.

`../manualColumnResize/AGENTS.md` documents what the two plugins still share outside the gesture: the replayed
map `init` hook and the two guards on writing a size.

What differs for rows:

## `SETTING_KEYS` carries TWO foreign options

```js
static get SETTING_KEYS() { return [PLUGIN_KEY, ...ROW_SIZE_OPTIONS]; }
// ROW_SIZE_OPTIONS = ['rowHeights', 'minRowHeights']
```

`minRowHeights` is a documented alias of `rowHeights` (`Core#_getRowHeightFromSettings` reads
`rowHeights ?? minRowHeights`). The column plugin has one entry, because there is no `minColWidths` alias.
Do not symmetrize them.

## Where the row axis differs from the column axis

These live in `ROW_RESIZE_AXIS` (`../../utils/manualResize/axis.ts`), and `../../utils/manualResize/AGENTS.md` explains each:

- **`fixedRowsTop` AND `fixedRowsBottom` are read through Walkontable** - `TableView` reduces both by the number
  of hidden rows. A row in the bottom band resolves against `bottomInlineStartCornerOverlay`, and a header in
  neither corner overlay resolves against the **inline-start** overlay. The column axis has one band to
  exclude; rows have two.
- **Rows can only grow.** A declared row height is a minimum, not a target (`../autoRowSize/AGENTS.md`: "we can
  shrink column but cannot shrink rows"), and the auto-size measurement still runs after a drag. So
  `ROW_RESIZE_AXIS.getHookSize` reports `max(dragged, rendered)` to `beforeRowResize` / `afterRowResize`,
  where the column axis reports the stored width.
- **The pointer delta is not flipped under RTL** - the block axis never runs the other way.

## Standing TODO

`ROW_RESIZE_AXIS.getHookSize` measures the row through `wtTable.getRowHeight()`, with the note "this should
utilize `hot.getRowHeight` after it's fixed and working properly". Do not swap to `getRowHeight()` without
verifying the underlying issue is resolved.

## `getLastDesiredRowHeight()` reads the gesture

It is public and row-only, and it returns the size the pointer described last - `ResizeGesture#getCurrentSize()`,
or `0` before the first drag.

## `afterMouseDownTimeout()` is a forward

Every other gesture method moved into `ResizeGesture`. This one stays as a one-line forward for parity with the
column plugin, whose forward a frozen spec calls directly.

## Double-click autofit needs AutoRowSize's listener

`../autoRowSize/` deliberately leaves its height-recalculation listener bound even when disabled, exactly so
this plugin's double-click autofit keeps working.

## Where to look next

- The drag, the teardown traps and the along/across model: `../../utils/manualResize/AGENTS.md`.
- The column mirror: `../manualColumnResize/AGENTS.md`.
- Computing heights instead of storing them: `../autoRowSize/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowResize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='manualRowResize'`
