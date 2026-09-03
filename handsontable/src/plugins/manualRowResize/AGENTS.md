# ManualRowResize plugin — dragging a header edge to set a height

The `manualRowResize` plugin stores heights the user set by dragging the row header's bottom edge. Read this
before touching `manualRowResize.ts`.

The file opens with a standing instruction:

> **Developer note! Whenever you make a change in this file, make an analogous change in
> manualColumnResize.js**

Take it literally. **`../manualColumnResize/AGENTS.md` documents everything the two share** — the foreign
`SETTING_KEYS` entry and its three `updatePlugin()` consequences, the replayed map `init` hook, the two
guards on writing a size, the overlay-relative handle resolution, multi-row resize, and the #6926 detached
`event.target` workaround. The shared helpers are in `../manualResize/AGENTS.md`.

What differs for rows:

## `SETTING_KEYS` carries TWO foreign options

```js
static get SETTING_KEYS() { return [PLUGIN_KEY, ...ROW_SIZE_OPTIONS]; }
// ROW_SIZE_OPTIONS = ['rowHeights', 'minRowHeights']
```

`minRowHeights` is a documented alias of `rowHeights` (`Core#_getRowHeightFromSettings` reads
`rowHeights ?? minRowHeights`). The column plugin has one entry, because there is no `minColWidths` alias.
Do not symmetrize them.

## Read `fixedRowsTop` AND `fixedRowsBottom` through Walkontable

Both counts are reduced by the number of hidden rows by the `TableView` module, so the raw settings are
wrong in that context. And when the `TH` is not a child of the top-left **or bottom-left** overlay,
recalculate using the **inline-start** overlay — that is where the rest of the row headers live. The column
plugin has one such fallback; rows have two overlays to exclude first.

## A `mouseover` fires right after `contextmenu`

It must be ignored. The column plugin needs the same guard — keep the two in step.

## Standing TODO

`// TODO: this should utilize this.hot.getRowHeight after it's fixed and working properly.` The plugin
measures the row itself instead. Do not swap to `getRowHeight()` without verifying the underlying issue is
resolved.

## Rows can only grow

A declared row height is a **minimum**, not a target — `../autoRowSize/AGENTS.md` spells that out ("we can
shrink column but cannot shrink rows"). A dragged height interacts with that: the auto-size measurement
still runs.

## Double-click autofit needs AutoRowSize's listener

`../autoRowSize/` deliberately leaves its height-recalculation listener bound even when disabled, exactly so
this plugin's double-click autofit keeps working.

## Where to look next

- Everything shared: `../manualColumnResize/AGENTS.md` and `../manualResize/AGENTS.md`.
- Computing heights instead of storing them: `../autoRowSize/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowResize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='manualRowResize'`
