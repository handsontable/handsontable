# MultiColumnSorting plugin — sorting by several columns at once

The `multiColumnSorting` plugin is a **subclass of ColumnSorting**. Read
`../columnSorting/AGENTS.md` first — the index maps, the visual-index sort configs, the queued-header-press
machinery and the compare-function-per-run rule are all inherited and all still apply.

This file covers only what is different: three small files, `multiColumnSorting.ts`, `rootComparator.ts` and
`domHelpers.ts`.

## The two sorting plugins are mutually exclusive at runtime

`ColumnSorting#enablePlugin` keeps a module-level `WeakMap` keyed on the instance (`pluginConflictsState`).
Whichever of the two enables first wins; the second one calls `warnAboutPluginsConflict()` and returns
without enabling. Registration is cleared on disable.

The consequence when debugging: **`columnSorting: true` and `multiColumnSorting: true` on one grid is not a
supported combination, and the loser is decided by `PLUGIN_PRIORITY`** — ColumnSorting is 50, this plugin is
170, so ColumnSorting wins and MultiColumnSorting is the one that warns. This is *not* the
`registerConflict` hard-conflict mechanism from `../base/AGENTS.md`; it is a separate, older guard.

`pluginKey` is an instance field (`this.pluginKey`), not a static read, precisely so the shared parent code
addresses the right settings key and the right index map names for each subclass. Never hardcode
`'columnSorting'` in inherited code paths.

## Columns after the first are tie-breakers

`rootComparator` builds **one compare function per sorted column**, all created once per sort run, then
walks them in order: a column is consulted only while every earlier column compared equal (`DO_NOT_SWAP`).

The row arrays are `[rowIndex, ...values]`, so sorted column *N*'s value sits at index **N + 1** — the
parent's single-column version reads index 1 as the degenerate case of the same rule. While
`sortService/engine.ts` runs a prepared sort, one extra numeric slot sits at the **end** of every row array
(the row's index into the extracted key stores); it is popped again when the sort finishes, and a custom
root comparator never sees it.

The prepared-keys seam is resolved **per column**: a column whose compare function implements the seam
reads extracted keys, while a column with a user-supplied compare function keeps the per-comparison path,
in the same sort. Membership is a module-private `Symbol` set by a built-in factory, never the presence of
the method names — see `../columnSorting/AGENTS.md`. The tie-breaker walk is unchanged either way.
`positionComparator` is the same walk over parallel value arrays, for the path the parent takes by default:
sorted column *N*'s values live in `columnValues[N]`, indexed by position. `rootComparator` keeps the tuple
form, where column *N*'s value sits at index **N + 1**. **Both must be kept in step**: they are picked
between at sort time by `getBuiltInPositionComparator()`, which is an identity check on the registered
root comparator (see `../columnSorting/AGENTS.md`).
Getting k=1 right and k>1 wrong is the likely bug here — the k-deep
`DO_NOT_SWAP` tie-break walk has to be reproduced in both.
`__tests__/comparatorCrossCheck.unit.ts` fuzzes the two against each other over random values, both
`sortEmptyCells` settings, both orders and k = 1 to 3, with a seeded generator so a failure reproduces.

Each column reads `columnMeta.multiColumnSorting.compareFunctionFactory`, falling back to the cell type's
registered factory. Note this subclass reads the settings object **without** optional chaining, unlike the
parent — the merged per-column settings always exist by the time the comparator runs.

## Shift+Enter appends a column to the sort

The extra shortcut is registered in the `grid` context, positioned **before** the editor group, and returns
`false` to suppress the default Enter behavior (move to the next row in the selection). It uses
`APPEND_COLUMN_CONFIG_STRATEGY`, which is what makes it *add* to the sort rather than replace it.

`runOnlyIf` requires a single, visible, header highlight. `unregisterShortcuts()` removes the group — a
subclass that adds a shortcut must remove it in the matching override, or `disablePlugin()` leaves it live.

## Where to look next

- Everything inherited: `../columnSorting/AGENTS.md`.
- The drag that competes for the same header gesture: `../manualColumnMove/AGENTS.md`.
- The plugin that hard-blocks this one when server-backed: `../dataProvider/AGENTS.md`
  (`registerConflict('dataProvider', […, 'multiColumnSorting'])` — the block runs the other way, disabling
  DataProvider).
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='multiColumnSorting'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='multiColumnSorting'`
