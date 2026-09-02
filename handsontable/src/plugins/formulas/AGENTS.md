# Formulas plugin — the HyperFormula bridge

The `formulas` plugin connects the grid to HyperFormula. Read this before touching `formulas.ts` (3.4k
lines), `indexSyncer/axisSyncer.ts`, `engine/`, `utils.ts` or `hyperlinkUrl.ts`.

HyperFormula is a **user-supplied peer dependency** (a devDependency here for tests only). It is bundled
into `handsontable.full.js` and external in `handsontable.js`, so anything build-time has to be checked in
both variants.

## Three index spaces, and a defect that comes from confusing two of them

| Space | Who speaks it |
|---|---|
| physical | the data source; HF holds data in physical order (identity `[0..n-1]`) |
| visual | Handsontable's public API — `getDataAtCell`, `getCellMeta` |
| HF index | HyperFormula's own sheet coordinates |

`rowAxisSyncer` / `columnAxisSyncer` (`indexSyncer/axisSyncer.ts`) translate:
`getHfIndexFromVisualIndex()` and `getVisualIndexFromHfIndex()`. **Always go through them.**

> **Known open defect.** `Formulas#validateDependentCells` treats HF indexes as **visual** indexes: it
> bounds-checks `row >= hot.countRows()` and then calls `getDataAtCell(row, col)` / `getCellMeta(row, col)`
> on the raw HF index, with no `getVisualIndexFromHfIndex()`. HF is fed trimmed rows too, so with
> `trimRows` or Filters active the two diverge and the wrong cell is validated — or the dependent is
> skipped when the HF index runs past `countRows()`. Do not assume `valid` lands on the right cell in a
> trimmed grid.

Related, on the hook side: **`afterSetDataAtCell` carries visual rows while
`afterSetSourceDataAtCell` carries physical ones** (`core.ts`), so never feed the latter to
`getHfIndexFromVisualIndex()` — the address then points at another row as soon as rows are sorted or moved,
and silently suppresses whichever cell it collides with. `prop` needs no such care: `propToCol()` returns a
visual column on both paths.

## Undo/redo bypasses the change listeners — and that is the design

```js
const isBlockedSource = (source) =>
  source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';
```

`#onAfterSetDataAtCell` and `#onAfterSetSourceDataAtCell` return early for those sources, because the engine
reverts the change through **its own** undo stack (`beforeUndo` calls `engine.undo()`). The two stacks must
stay in step — the number of actions in Handsontable and in HyperFormula has to match.

So anything else those listeners would have done must be handled separately on the `afterUndo` / `afterRedo`
path. That is how dependent formula cells kept a stale `valid` flag after undo (DEV-2036). Three rules for
that path:

- **Gate on whether the action wrote cell data, not on `actionType`.** Undoing an edit writes through
  `setDataAtCell`; undoing a row or column removal restores data with `setSourceDataAtCell`
  (`../undoRedo/actions/removeRow.ts`, `removeColumn.ts`). Both must be handled. Only actions that purely
  reorder or hide (`row_move`, `col_sort`, `filter`, `merge_cells`) write nothing and can be skipped.
- **Only `setDataAtCell` writes are validated by the Core.** `setSourceDataAtCell` runs `sourceDataValidator`
  (`dataMap/sourceDataValidator.ts`), a separate mechanism that never touches the `valid` flag — so only the
  former may be excluded from a validation pass, or the restored cells end up validated by nobody.
- **`STRUCTURAL_ACTION_TYPES`** (`insert_row`, `insert_col`, `remove_row`, `remove_col`) are the only
  actions that make HyperFormula rewrite formula references, so they are the only ones whose source data has
  to be caught up in `afterUndo`/`afterRedo`. A reordering action leaves the source data's own reference
  frame untouched and must **not** trigger the write-back.

**`MoveCellsAction` is asymmetric, on purpose.** Its `undo` restores both regions with `restoreRegion`
instead of replaying the move, so `afterMoveCells` — where the forward direction syncs — never fires; undo
has to cover it here. Redo *does* replay the move, so it must **not** be listed, or the sheet is scanned
twice.

## Sequence syncing

The row/column sequence is mirrored into HF as a **permutation**, and two hooks matter:

- the **sequence** hook fires synchronously on every sequence mutation, including mid-batch;
- **`cacheUpdated`** fires when the mapper rebuilds its `notTrimmedIndexes` cache — the moment from which the
  translation methods would read the new trimming state.

Two performance rules and one mid-batch guard:

- **Build the inverse permutation in one pass.** `newSequence.indexOf` per element makes every sort and
  unsort quadratic in the number of rows or columns.
- **The transformation tells HF where each currently-held element should move to**: for each current
  position `i`, the target is the visual index of physical `i` — the inverse permutation of the sequence.
- **`?? -1` covers a mid-batch state** in which the mapper's not-trimmed cache still holds a physical index
  that is no longer part of the sequence. Keep it.

`removeRows`/`removeColumns` spans are chunked, because an unbounded variadic argument spread could overflow
the call stack.

## Engine settings: `maxRows` / `maxColumns` do NOT reach the engine

HyperFormula's own default sheet size is 40000. Handsontable used to pass its `maxRows`, which defaults to
`Infinity`, so **an engine the plugin builds has never been bounded** (GH #10672). Keep it that way.

Both keys nonetheless stay in `SETTING_KEYS` alongside `language`, because `updatePlugin` also creates or
switches the sheet, and dropping them would skip that.

`engine/register.ts` accepts three shapes: an engine class, an engine instance, or
`{ hyperformula: engineClass }`. Cross-sheet referencing hooks are registered on the shared instance
registry.

## HF may extend the sheet beyond the dataset

The engine grows a sheet's dimensions to calculate values outside the defined dataset (it extends the
dependency graph). The compensation code carries a note that it can be removed once
[hyperformula#1179](https://github.com/handsontable/hyperformula/issues/1179) is resolved.

## `HYPERLINK` cells: an allowlist, not a sanitizer

`resolveHyperlinkUrl()` allows exactly `http:`, `https:`, `mailto:`, `tel:`. Everything else returns `null`
and the cell does not become a link. Two deliberate choices:

- **The URL is parsed with `new URL()`, not pattern-matched**, so obfuscations that survive a string
  comparison (`JaVaScRiPt:`, `java\tscript:`, leading whitespace) are normalized before the protocol is read.
- **The guard cannot be delegated to a sanitizer**, because default sanitization in this codebase is a
  pass-through (DOMPurify was removed in v18.0).

## Where to look next

- Integration overview and the peer-dependency contract: `../../../.ai/INTEGRATIONS.md`.
- Undo action shapes this plugin reasons about: `../undoRedo/AGENTS.md`.
- Trimming plugins that make HF and visual indexes diverge: `../trimRows/AGENTS.md`,
  `../filters/AGENTS.md`.
- Exporting formulas rather than values: `../exportFile/AGENTS.md` (`exportFormulas`).
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='formulas'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='formulas'`

`__tests__/` is unusually broad: `hfApi`, `initialization`, `validation`, `publicAPI`, `hooks`,
`featureIntegration`, `memoryLeak`, `redoState`, `indexSyncer/`, `plugins/`. A change here almost always
needs more than `formulas.spec.js`, and `memoryLeak.spec.js` is the one people forget.
