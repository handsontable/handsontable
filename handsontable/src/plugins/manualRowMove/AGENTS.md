# ManualRowMove plugin — dragging a row header to reorder

The `manualRowMove` plugin reorders rows by dragging their header. Read this before touching
`manualRowMove.ts` or `ui/`.

**`../manualColumnMove/` is the mirror plugin, and the shared rules are documented there** — read
`../manualColumnMove/AGENTS.md` for the `move*`-versus-`drag*` index distinction (final index vs drop
index), the `isMovePossible()` bounds check against `getNotTrimmedIndexesLength()`, and the standing
`// TODO: move adding plugin classname to BasePlugin.`

What follows is what is specific to rows.

## An array setting replays as a move on init

`moveBySettingsOrLoad()` calls `moveRows(pluginSettings, 0)` when `manualRowMove` is an array. So the array
means "these rows, in this order, at the top" — it is a **move instruction**, not a stored permutation, and
it replays on every load.

Consequence: a grid configured with an array reverts a row the user had since dragged, whenever the replay
runs again. The manual *resize* plugins hit the same class of problem and document it in detail —
`../manualResize/AGENTS.md`.

## Row heights are read defensively

The drag measurement sums Walkontable row heights and falls back per row to
`stylesHandler.getDefaultRowHeight()`, because a row outside the rendered range reports nothing. Never
assume a row height is available; the fallback is per row, not per drag.

The UI has one extra quirk over the column version: **the first row is taller than the rest**, so the
"hover on the lower part of the TD" test is special-cased for it. There are also clamps for the backlight
below the table and the guideline below the table.

`isFixedRowTop(row)` and `isFixedRowBottom(row)` exist because a row inside `fixedRowsTop` or
`fixedRowsBottom` behaves differently as a drop target. Both are checked — a fix aimed at only the top
band misses the bottom one.

## NestedRows reimplements this plugin

`../nestedRows/utils/rowMoveController.ts` carries three TODO comments about "mocking real work" of this
plugin and reimplementing its internal function. That is real logic duplication: **a bug fixed here may not
be fixed there**, and vice versa. `../../../.ai/CONCERNS.md` tracks it, with the intended fix being a
shared utility or a proper public method on this plugin.

If you change move semantics, check `nestedRows` in the same pass.

## DataProvider blocks this plugin

`registerConflict('dataProvider', ['manualRowMove', …])`: with a complete server-backed `dataProvider`
configuration, **DataProvider** is the plugin that stays disabled. See `../base/AGENTS.md`.

## Where to look next

- The column mirror and the shared index semantics: `../manualColumnMove/AGENTS.md`.
- The plugin that duplicates this logic: `../nestedRows/AGENTS.md`.
- Row headers that follow their rows through a move: `../bindRowsWithHeaders/AGENTS.md`.
- Moving *cells* rather than rows: `../moveCells/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowMove'`

`__tests__/` splits into `manualRowMove.spec.js`, `manualRowMoveUI.spec.js`, `API.spec.js`,
`positioning.spec.js`, `scrolling.spec.js` and `ui/`.
