# ManualColumnResize plugin — dragging a header edge to set a width

The `manualColumnResize` plugin stores widths the user set by dragging the header's right edge. Read this
before touching `manualColumnResize.ts`.

**The drag itself is not in this plugin.** The handle, the guide, the press and double-click state and the
resize hooks live in `../../utils/manualResize/resizeGesture.ts`, shared with `../manualRowResize/`, and the column
specifics the gesture needs live in `COLUMN_RESIZE_AXIS` in `../../utils/manualResize/axis.ts`. Read
`../../utils/manualResize/AGENTS.md` before touching `disablePlugin()`, `destroy()`, or anything about the drag - that
is where the DEV-2719 teardown traps are.

What this plugin owns: the column widths map, every public size accessor, `SETTING_KEYS` and `updatePlugin()`,
the `#onMapInit` replay, and the `modifyColWidth`, `beforeStretchingColumnWidth` and `beforeColumnResize`
hooks.

## `SETTING_KEYS` includes a foreign option

```js
static get SETTING_KEYS() { return [PLUGIN_KEY, ...COLUMN_SIZE_OPTIONS]; }   // ['manualColumnResize', 'colWidths']
```

That is what makes `updateSettings({ colWidths })` reach this plugin at all (issue
[#4371](https://github.com/handsontable/handsontable/issues/4371)) — and it changes what `updatePlugin()`
must assume, in three ways. **The rules are in `../../utils/manualResize/AGENTS.md`**; the short version, all visible
in `updatePlugin()`:

1. **Restore the plugin option from the merged settings.** `BasePlugin#onUpdateSettings` feeds
   `updatePluginSettings()` with `newSettings[PLUGIN_KEY]`, which a `colWidths`-only update does not carry —
   so without the restore `getSetting()` starts lying for the rest of the session.
2. **Re-initialize only when the plugin's own option was declared.** `#onMapInit` replays the declared
   `manualColumnResize` array, so re-initializing on a `colWidths`-only update reverts a column the user had
   since dragged — to neither the dragged width nor the requested one.
3. **The clear runs after the re-initialization**, so the widths replayed on the map's `init` hook are
   discarded too.

## The `init` local hook has to be replayed by hand

`createAndRegisterIndexMap` initializes the map **synchronously** when the dataset is already loaded (a
plugin re-enable), before the local hook could attach. Same replay as `../hiddenColumns/` and
`../trimRows/`.

## Two guards on writing a width

- **The map only exists while the plugin is enabled**, and a disabled plugin stores no widths — every
  read/write path checks that first.
- **An out-of-range visual index resolves to `null`**, which would write an entry under the string `"null"`
  and invalidate the width cache for nothing. Bail instead.

The gesture writes every width through the private `#setManualSize()` and tracks a drag with `#clampSize()`,
never through the public `setManualSize()` (that one opens an undo step of its own). Both use `#clampSize()`,
so the width floor has one home. A drag stores the width only on release - see "One press, one undo step" in
`../../utils/manualResize/AGENTS.md`.

## The width floor is derived from the theme, not a constant (DEV-158)

`#getMinWidth()` returns `--ht-icon-size + 2 * --ht-cell-horizontal-padding` (32px in Main, 40px in Horizon, 24px
in Classic): the room a header needs for its menu button. It reads both tokens through
`hot.stylesHandler.getCSSVariableValue()`, which caches them until the theme changes, so a drag reads it on
every pointer move for free. Four rules ride along:

- **The floor is applied when a width is written, not when it is read.** `setManualSize()`, `setManualSizes()` and
  the drag go through `#clampSize()`. A width stored under another theme, or declared in the `manualColumnResize`
  array (replayed by `#onMapInit` without a clamp), is kept as it is, so a theme switch never rewrites stored
  widths and `getManualSize()` returns what was stored. A write-back is a write: `sheetsBar`'s `restoreSizes()`
  sends every captured width through `setManualSizes()`, so a below-floor width from the array comes back clamped
  after a sheet switch.
- **A missing or non-numeric token falls back to 20px, and the floor is never below 20px.** A grid without a theme
  has no tokens, jsdom loads no theme, and a custom theme may declare a token as `calc()`, which
  `getCSSVariableValue()` returns as a string. `Number()` turns any of those into `NaN`, and the guard in
  `#getMinWidth()` keeps `NaN` out of the clamp. A token in `rem` or `em` is the opposite trap: `StylesHandler`
  runs `parseFloat()` and `Math.ceil()` on the raw text, so `1.25rem` reads as `2`. The result is therefore floored
  at 20px, or a rem-based custom theme would let a column get narrower than the old floor.
- **The floor is the same with and without a column header.** A grid that renders no headers still gets 32px in
  Main: the width map does not know what the grid renders, and a floor that changed with `colHeaders` would
  change stored widths when a user toggles them.
- **The floor only means something because the header CSS can collapse to it.** At 32px the content box is 15px,
  so the label and the sort indicator must give way to the menu button. That is `_column-sorting.scss`
  ("Narrow header with a menu button"); see `../columnSorting/AGENTS.md`. Raising or lowering the floor without
  re-measuring the icon against the header, in all three themes and both directions, brings the bug back.

## Where the column axis differs from the row axis

These live in `COLUMN_RESIZE_AXIS` (`../../utils/manualResize/axis.ts`), and `../../utils/manualResize/AGENTS.md` explains each:

- **`fixedColumnsStart` is read through Walkontable, not the settings** - `TableView` reduces it by the number
  of hidden columns. A header outside the top-left corner overlay resolves against the **top** overlay.
- **A header spanning more than one column shows no handle** - nested headers have no single column to resize.
- **The resize hooks report the stored width** - unlike rows, a width is final.
- **The pointer delta is multiplied by `getDirectionFactor()`**, because the inline axis runs the other way
  under RTL.

## `afterMouseDownTimeout()` is a forward, and must stay

Every other gesture method moved into `ResizeGesture`. This one stays on the plugin as a one-line forward,
because the frozen `../autoRowSize/__tests__/autoRowSize.spec.js` calls
`manualColumnResizePlugin.afterMouseDownTimeout()` directly between simulated clicks.

## Double-click autofit needs AutoColumnSize's listener

`../autoColumnSize/` deliberately leaves its width-recalculation listener bound even when disabled, exactly
so this plugin's double-click autofit keeps working. Do not "clean that up" there.

## Where to look next

- The drag, the teardown traps and the along/across model: `../../utils/manualResize/AGENTS.md`.
- The row mirror: `../manualRowResize/AGENTS.md`.
- Computing widths instead of storing them: `../autoColumnSize/AGENTS.md`.
- Growing columns to fill the width, which must respect these as minimums:
  `../stretchColumns/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualColumnResize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='manualColumnResize'`

`__tests__/rtl/` matters here — the handle sits on the opposite edge under RTL.
`../nestedHeaders/__tests__/resizingColumns.spec.js` resizes a column in a grid that has spanning headers, but
it does not assert that a spanning header itself refuses the handle - that rule is pinned by
`../../utils/manualResize/__tests__/axis.unit.js`.
