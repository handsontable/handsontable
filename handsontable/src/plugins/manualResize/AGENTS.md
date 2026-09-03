# manualResize — shared helpers for the two manual resize plugins

This directory holds **no plugin**. It is `utils.ts`, imported by `../manualRowResize/manualRowResize.ts`
and (via its own `utils.ts`) `../manualColumnResize/manualColumnResize.ts`. Read this before touching either
resize plugin, because the rules below are what those two share.

## The size options each plugin answers to

```
ROW_SIZE_OPTIONS    = ['rowHeights', 'minRowHeights']
COLUMN_SIZE_OPTIONS = ['colWidths']
```

`minRowHeights` is a documented alias of `rowHeights` — `Core#_getRowHeightFromSettings` reads
`rowHeights ?? minRowHeights`, so both state the row heights equally. There is **no** `minColWidths` alias,
which is why the column list has one entry and the row list two. Do not "symmetrize" them.

## Listing a foreign option in `SETTING_KEYS` changes three things

Both plugins put their size option in `SETTING_KEYS` next to their own key, so that
`updateSettings({ rowHeights })` reaches them at all (issue [#4371](https://github.com/handsontable/handsontable/issues/4371)).
Each consequence below has already shipped as a bug:

1. **The stored setting gets wiped.** `BasePlugin#onUpdateSettings` feeds `updatePluginSettings()` with
   `newSettings[PLUGIN_KEY]`, and a `{ rowHeights }` call does not carry that key — it is `undefined`.
   Restore it from the merged settings, or `getSetting()` starts lying for the rest of the session.
2. **Do not run the usual `disablePlugin(); enablePlugin();` cycle on such an update.** `#onMapInit` replays
   the declared `manualRowResize` array, so a grid configured with an array reverts a row the user had since
   dragged — to neither the dragged height nor the requested one. Re-initialize only when the plugin's own
   key is present.
3. **A clear that must survive the cycle has to run *after* `enablePlugin()`.** `disablePlugin()` snapshots
   the live map into `#config`, and `#onMapInit` replays it.

Also: `Array.isArray(setting)` is `true` for `[]`, which means "enabled, no presets" — never "the array
states the sizes".

## `redeclaresManualSizes()` — when a config discards dragged sizes

A config object that re-declares the size option is taken as "the option takes effect again", so the sizes
the user dragged are cleared. Three deliberate exceptions:

- **A non-empty plugin array wins.** `pluginSetting` is read from the *merged* settings, not from the config
  object, so a grid configured with a non-empty array keeps what the plugin replays on the map's `init` hook.
  Clearing there would leave the stored sizes and the option disagreeing until the next replay put them back.
- **An empty array presets nothing**, so it does not suppress the clear.
- **A function states no fixed size.** It is called again on every render, and a framework wrapper rebuilds
  an inline one on every render too, so treating it as a re-declaration would discard the stored sizes on
  every render. Clear those with `clearManualSizes()` instead.

The final relevance test is `sizeOption !== undefined` — matching how `BasePlugin` itself tests a config key.
Keep the two in step.

## Scale-aware pointer math

A resize drag reads pointer deltas in *visual* pixels, so a CSS-transformed host page would make the drag
short. `getElementScaleFactor(element, axis)` divides `getBoundingClientRect()` by `offsetWidth`/`offsetHeight`,
and `normalizeVisualDelta(visualDelta, scaleFactor)` converts back.

**The one-pixel tolerance is load-bearing.** Table headers and `border-collapse` can make
`getBoundingClientRect()` one CSS pixel wider or taller than the offset size with no CSS transform at all,
so a difference of `<= 1` is reported as unscaled (factor `1`). Without it, `normalizeVisualDelta` rounds
every resize one layout pixel short. Both helpers also fail safe to `1` on a non-finite or non-positive
measurement, which is what a grid built inside a `display: none` container measures.

## Where to look next

- Row plugin: `../manualRowResize/AGENTS.md`. Column plugin: `../manualColumnResize/AGENTS.md`.
- Auto-sizing counterparts, which compute rather than store sizes: `../autoRowSize/`, `../autoColumnSize/`.
- `SETTING_KEYS` semantics in general: `../base/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='manualResize'`
- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowResize|manualColumnResize'`
