# ManualColumnResize plugin — dragging a header edge to set a width

The `manualColumnResize` plugin stores widths the user set by dragging the header's right edge. Read this
before touching `manualColumnResize.ts` or `utils.ts`.

The file opens with a standing instruction:

> **Developer note! Whenever you make a change in this file, make an analogous change in
> manualRowResize.js**

Take it literally. `../manualRowResize/` is the mirror plugin, and the shared helpers live in
`../manualResize/utils.ts`.

## `SETTING_KEYS` includes a foreign option

```js
static get SETTING_KEYS() { return [PLUGIN_KEY, ...COLUMN_SIZE_OPTIONS]; }   // ['manualColumnResize', 'colWidths']
```

That is what makes `updateSettings({ colWidths })` reach this plugin at all (issue
[#4371](https://github.com/handsontable/handsontable/issues/4371)) — and it changes what `updatePlugin()`
must assume, in three ways. **The rules are in `../manualResize/AGENTS.md`**; the short version, all visible
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

## Read `fixedColumnsStart` through Walkontable, not through the settings

In the Walkontable context the fixed-column count is **reduced by the number of hidden columns** by the
`TableView` module. Reading the raw setting resolves the handle against the wrong overlay.

And when the `TH` is not a child of the top-left overlay, recalculate using the **top** overlay — that is
where the rest of the headers live.

## Multi-column resize

A drag on a header inside the current selection resizes **every selected column**. A drag on a header
outside the selection (or with no selection) resizes just that one.

## Two event workarounds

- **#6926** — when `event.target` is temporarily detached, skip the callback and wait for the next
  `mouseover`.
- A `mouseover` fires right after `contextmenu` and must be ignored (this is documented in the row plugin;
  keep the two in step).

`../manualResize/AGENTS.md` also covers the scale-aware pointer math — `getElementScaleFactor()` and
`normalizeVisualDelta()`, including the load-bearing one-pixel tolerance — and
`shouldSkipResizeHandlePositioning()` / `shouldRefreshHandleAfterAutoResize()`, which encode the
double-click-to-autofit behavior.

## Double-click autofit needs AutoColumnSize's listener

`../autoColumnSize/` deliberately leaves its width-recalculation listener bound even when disabled, exactly
so this plugin's double-click autofit keeps working. Do not "clean that up" there.

## Where to look next

- Shared helpers and the full `SETTING_KEYS` rules: `../manualResize/AGENTS.md`.
- The row mirror: `../manualRowResize/AGENTS.md`.
- Computing widths instead of storing them: `../autoColumnSize/AGENTS.md`.
- Growing columns to fill the width, which must respect these as minimums:
  `../stretchColumns/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualColumnResize'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='manualColumnResize'`

`__tests__/rtl/` matters here — the handle sits on the opposite edge under RTL.
