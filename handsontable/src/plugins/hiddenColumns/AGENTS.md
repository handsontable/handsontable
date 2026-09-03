# HiddenColumns plugin — hiding columns without removing them

The `hiddenColumns` plugin hides columns from the DOM while keeping them in the visual index space. Read
this before touching `hiddenColumns.ts` or anything in `contextMenuItem/`.

`../hiddenRows/` is the mirror image of this plugin, almost line for line. Fix a bug in one and check the
other.

## Hiding is not trimming

The map type is **`'hiding'`**, registered on `columnIndexMapper` under the plugin name. A hidden column
**keeps its place in the visual space** and disappears only from the renderable space. A *trimmed* column
leaves the visual space altogether.

That difference is why hiding does not strand a selection the way trimming does — the full rule is in the
core-package `../../../AGENTS.md` and in `../trimRows/AGENTS.md`. Tier details:
`../../../.ai/INDEX-MAPPING.md`.

## The `init` local hook has to be replayed by hand

```js
this.#hiddenColumnsMap.addLocalHook('init', () => this.#onMapInit());

if (this.hot.columnIndexMapper.getNumberOfIndexes() > 0) {
  this.#onMapInit();
}
```

`createAndRegisterIndexMap` initializes the map **synchronously** when the dataset is already loaded — a
plugin re-enable — which is before the hook above could attach. Without the replay, a re-enabled plugin
never applies its configured hidden set. `../hiddenRows/` and `../trimRows/` carry the same replay.

## `skipColumnOnPaste`: only flip what you flipped

The plugin sets `skipColumnOnPaste` on hidden columns (when `copyPasteEnabled: false`) and marks each one it
touched with a private symbol, `SKIP_COLUMN_ON_PASTE_BY_PLUGIN`.

**Cells that already had `true` from user configuration** (`columns`, `cells`, or `cell`) **are left
untouched**, and only marked cells are cleared on unhide — otherwise unhiding a column erases a
user-defined value. The property itself is consumed by the Autofill and CopyPaste plugins.

## `afterGetCellMeta` hygiene — this is the reference implementation

Three rules, all visible in `#onAfterGetCellMeta`:

- **`className` is `string | string[]`.** Normalize with `normalizeClassNames()` (which returns a *fresh*
  array) and write back a string, matching what `numericRenderer` and the `search` plugin store. Never
  `(meta.className as string).split(' ')` — it throws on an array, inside a render hook, so the grid renders
  blank (#7427). Never `meta.className += ' marker'` — it coerces an array through `Array#toString` and
  merges `['a','b']` into one bogus `a,b` class. And never push into the value you were handed: a
  grid-level or column-level array is **one instance shared by every cell** through the meta prototype
  chain.
- **Compare before assigning.** This hook runs on **every** cell meta read, and an unconditional write
  materializes an own property that shadows the column-level and grid-level cascade.
- **Match a marker class by token, not substring.** `indexOf` on the joined string treats a user class named
  `afterHiddenColumnHighlight` as the marker already being present, so the real marker never gets added.

The parameter is typed `CellProperties`, never `Record<string, unknown>` — the latter erases every property
to `unknown`, which is what let the `as string` cast compile in the first place.

Note the hook reads `this.isHidden(column - 1)`: the indicator classes describe the **neighbor**
relationship, so an off-by-one here is a real bug, not a style choice.

## `modifyColWidth` is registered at order index 2

That puts it after the default listeners — including AutoColumnSize's, which is pinned to the front. A
hidden column's width must be zeroed *after* anything that computes a width, or the computed value wins.

## `disablePlugin()` resets cell meta

`resetCellsMeta()` runs after `super.disablePlugin()`, because the meta this plugin wrote (the paste marker
and the indicator classes) must not survive the plugin.

## Known concern

`../../../.ai/CONCERNS.md` records that this plugin, `autoColumnSize` and `autoRowSize` each trigger the
same per-render work separately — `@TODO Should call once per render cycle`. It also lists
`showColumn.ts`'s `arr.push(...largeArray)` as a stack-overflow risk at large scale; use a loop.

## Where to look next

- The row mirror: `../hiddenRows/AGENTS.md`. Trimming instead of hiding: `../trimRows/AGENTS.md`.
- Consumers of `skipColumnOnPaste`: `../copyPaste/AGENTS.md`, `../autofill/AGENTS.md`.
- Menu entries: `contextMenuItem/`, wired via `../contextMenu/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='hiddenColumns'`

`__tests__/` is split by concern — `altering`, `navigation`, `selection`, `editors`, `indicators`,
`maxCols`, `publicAPI`, `pluginHooks`, `configuration`, plus `contextMenu/`, `plugins/`, `settings/` and
`rtl/`. A hiding change usually breaks `navigation` or `selection` first.
