# TrimRows plugin — removing rows from the visual space

The `trimRows` plugin trims rows: they leave the **visual** index space entirely, so `countRows()` shrinks
and the rows below move up. Read this before touching `trimRows.ts`.

The plugin itself is small — one `'trimming'` index map on `rowIndexMapper` and a public API around it. Its
importance is out of proportion to its size, because **trimming is the operation that can strand a
selection**.

## Trimming is not hiding

| | hiding (`../hiddenRows/`) | trimming (this plugin, Filters, NestedRows) |
|---|---|---|
| visual index | kept | **removed** |
| `countRows()` | unchanged | shrinks |
| selection risk | none | a highlight can outlive the record it addressed |

Filters registers a trimming map too, which is why filtering affects the **visual** tier and removes indexes
from the `DataMap`. (Pagination, by contrast, registers a *hiding* map and affects the renderable tier — the
DeepWiki page gets this backwards; the repository is authoritative. See `../../../.ai/INDEX-MAPPING.md`.)

## The stranded-selection protocol

A trim can leave the highlight's visual coordinate pointing at nothing, and a write through it makes
`applyChanges()` **append** records. `core.ts` therefore keeps `Selection` supplied with the highlight's
**physical** coordinates, captured whenever the selection is laid — they cannot be recovered afterwards,
because `IndexMapper#updateCache()` rebuilds every cache *before* it fires `cacheUpdated`.

Four rules ride along, each from a measured defect:

1. **Drop, never clamp** a stranded cell selection. Clamping slides the highlight onto a neighboring record
   and the next paste overwrites it. The exception is a **header-anchored extent** — a full column, a full
   row, select-all — whose far corner tracks the grid rather than naming records; that is clamped, judged
   **per axis**.
2. **Re-read the record on every path that keeps the selection**, including the editor-open exit.
3. **Discriminate the change.** A structural insert/remove and a permutation (sort, move) both raise
   `trimmedIndexesChanged` exactly as a filter does; both invalidate the capture rather than stranding the
   selection. The physical index **count** is what separates structural from the rest, and a permutation must
   re-read and **fall through**, because one `batch()` can carry a permutation and a trim together.
4. **An editor open when the trim landed is sampled before the public hooks.**

`Selection#deselectIfHighlightStranded()` holds the rule and `tests/e2e/selection-trimmed-row.spec.ts`
pins every case. The full text is in `../../../AGENTS.md`.

## `updatePlugin()` does not go through disable/enable

An array `trimRows` setting is replayed directly into the map inside `batchExecution(…, true)` — clear, then
set each physical index. The usual `disablePlugin(); enablePlugin();` cycle is deliberately **not** used
here.

## The `init` local hook has to be replayed by hand

`createAndRegisterIndexMap` initializes the map **synchronously** when the dataset is already loaded (a
plugin re-enable), before the `init` local hook could attach — so `#onMapInit()` is called again explicitly.
`../hiddenRows/` and `../hiddenColumns/` carry the same replay.

## Indexes are PHYSICAL

`getTrimmedRows()` returns physical rows, and `trimRows()` / `untrimRows()` take them. That is unlike most
plugin APIs, which speak visual indexes.

## DataProvider blocks this plugin

`registerConflict('dataProvider', [… 'trimRows'])` — a complete server-backed `dataProvider`
configuration and `trimRows` cannot coexist, and it is **DataProvider** that stays disabled. See
`../base/AGENTS.md` for the hard-conflict mechanism.

## Where to look next

- Hiding instead of trimming: `../hiddenRows/AGENTS.md`.
- Other trimming consumers: `../filters/AGENTS.md`, `../nestedRows/AGENTS.md`.
- Index map tiers: `../../../.ai/INDEX-MAPPING.md`, `../../translations/AGENTS.md`.
- Plugins that must not compare against `countRows()` because of trimming:
  `../columnSummary/AGENTS.md`, `../formulas/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='trimRows'`
- Selection-stranding cases live in Playwright: `tests/e2e/selection-trimmed-row.spec.ts`.
