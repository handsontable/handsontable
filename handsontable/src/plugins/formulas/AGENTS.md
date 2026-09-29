# Formulas plugin — the HyperFormula bridge

The `formulas` plugin connects the grid to HyperFormula. Read this before touching `formulas.ts` (3.4k
lines), `indexSyncer/axisSyncer.ts`, `engine/`, `utils.ts` or the shared link toolkit in `../../utils/cellLinks/`.

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

## Undo/redo: the plugin observes, the engine's own stack is never used

The grid restores its own state on undo and redo (see `../undoRedo/AGENTS.md`), and this plugin only
brings the engine in line with the restored grid. It never calls `engine.undo()` or `engine.redo()`:
the grid's stack holds steps the engine never saw (hiding, resizing, a sort in another grid on the same
engine), so two stacks cannot be kept in step. HyperFormula still records its own undo entries for
every call this plugin makes, and nothing reads them.

Two source predicates split the work:

```js
const isBlockedSource = source => source === 'auto';
const isRestoreSource = source => source === 'UndoRedo.undo' || source === 'UndoRedo.redo';
```

- **The row and column hooks are passive for a restore source** - `before`/`after` of
  `CreateRow`, `CreateCol`, `RemoveRow`, `RemoveCol`. Following a replayed row change one by one is
  wrong in two ways: the engine shifts formula references a second time over formula text the
  journal already restored, and a `#REF!` the engine wrote on the removal cannot be turned back into
  the reference it replaced. The `before*` hooks are passive too, so a replay is never vetoed by an
  engine that is about to be reloaded anyway.
- **The cell writes of a restore are held, not applied** (`#restoredWrites`), in the
  `afterSetSourceDataAtCell` format (physical rows). They reach the engine in `restoreState()`.
- **`captureState()` returns two versions and, while the order is not physical, the engine's sheet.**
  `structureVersion` changes on every row or column insert, removal, move, **and every sequence
  change** (a sort included) and on a NestedRows detach; `dataVersion` on every cell write. UndoRedo
  calls `restoreState(state)` whenever a step changed either of them. When the structure version
  differs from the one the engine holds, the sheet is replaced and the held writes are dropped:
  - **In physical order** the source data is authoritative: `#loadSourceDataIntoSheet()`, the same
    path a data load takes. The write-back of engine-rewritten formulas (`#syncFormulasToSourceData`)
    runs inside the forward operation, so the journal holds it and the undo reverses it.
  - **Out of physical order** the source data cannot rebuild the engine: the write-back is skipped
    there, and the engine's references depend on HOW the order was reached. `engine.moveRows` keeps
    every reference on its data, while `engine.setRowOrder` - what the axis syncer sends for a sort
    or a restored sequence - turns some of them into `#REF!` (measured: `setRowOrder([2, 3, 4, 0, 1])`
    on a fresh sheet writes `=#REF!+1000` where the equivalent `moveRows` writes `=A5+1000`). So the
    state carries `engine.getSheetSerialized()` plus both syncers' `getEngineOrder()`, and the restore
    loads it with `setSheetContent()` and `adoptEngineOrder()` - nothing is sent to reorder it. Never
    "simplify" this into reload-then-reorder; that reproduces the `#REF!`.

  With the same structure version, the held writes are written into the engine in one
  `engine.batch()`. The sheet snapshot is re-serialized on every step that writes data while the
  grid is sorted or moved - an O(cells) cost per step on those grids only.
- **Draw every new version from `#versionSeed`, never reuse one.** `restoreState()` sets the
  current versions to the restored state's; a later change that reused a number would make a
  different structure compare equal to a recorded one.
- **`afterUndo` / `afterRedo` flush whatever is still held** - the writes of an action registered
  through `done()`, which never reaches `restoreState()`.
- **Dependents of a sheet replacement are validated after the restore, not inside it.**
  `setSheetContent()` reports every recalculated cell, including the ones the restore wrote, which the
  UndoRedo plugin validates itself. The plugin collects the restored cells from the `afterChange` the
  restore fires (`#onAfterRestoredChange`) and validates the rest in `afterUndo`/`afterRedo`
  (`#validateRestoredDependents`) - a cell validated twice is the DEV-2036 regression.
- **There is no "restore in progress" gate on the axis syncer, on purpose.** The order changes a
  restore makes still reach the engine through `setRowOrder`, and every one of them is overwritten:
  a restore that changes the order changes `structureVersion`, so it ends in a full sheet replacement
  that also resets or adopts the stored order. A flag set in `beforeUndo` would leak whenever a later
  `beforeUndo` listener vetoes - the defect the old implementation had.

A move is covered the same way: the cells a move writes, and the formulas elsewhere the engine
rewrote, are all journaled inside the move's own step, so an undo writes them back and `restoreState()`
feeds them to the engine. `commitPendingMoveCells()` runs for a user's move only.

`IndexSyncer` has no undo/redo flags any more. Restoring the row or column order fires the sequence
change like any other, and the axis syncer sends the new order to the engine; a reload afterwards
re-runs `setupSyncEndpoint()`.

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

## The engine's sheet size is not the grid's axis length, in either direction

`getSheetDimensions()` answers with the extent of the sheet's **content**, and the engine accepts an order
exactly as long as that — anything else it rejects by throwing, and the throw unwinds whatever triggered the
sequence change (a sort, a view-state restore). The two directions have different causes and the same fix
site, `AxisSyncer#syncOrderWithEngine`:

- **Sheet larger than the dataset.** The engine grows a sheet to calculate values outside it (it extends the
  dependency graph). The order is padded up to that size, and the padding can go once
  [hyperformula#1179](https://github.com/handsontable/hyperformula/issues/1179) is resolved.
- **Sheet shorter than the grid.** Trailing empty rows and columns are not counted, so a grid with a blank
  last row, with `minSpareRows`, or a sheet the sheets bar added at runtime (no data at all, reported `0x0`
  against the grid's default 26 columns) is longer than its own engine sheet. The order is **compressed**
  onto the elements the engine holds, keeping their relative order, rather than sent whole — sending it whole
  is what made sorting such a grid throw `InvalidArgumentsError` (DEV-2904).

Four rules ride along.

- **The order must be a permutation of `0..size - 1`.** The engine validates entries as well as length, so an
  index the sequence no longer covers (the mid-batch state that used to produce `-1`) is ranked last rather
  than passed through, which the engine would reject as "not a permutation".
- **`#indexesSequence` names the elements the engine holds, in the engine's own order** — not the grid's
  sequence. The two are the same only while the sheet covers the whole grid. Once it does not, storing the
  grid's sequence would name elements the engine never received, and every later order, being relative to
  what the engine holds, would move the wrong rows or columns for the rest of the session. The exception is
  the paths where the engine changes itself: an insert, a removal and a move all leave it holding the
  grid's new sequence, so the stored order follows it there. An undo is not one of them any more - it
  restores the grid's order, which reaches the engine as an ordinary order change.
- **How the sheet was filled decides where its new rows go.** A sheet fed its content (at load, or by the
  engine's own insert) holds it in physical order; a sheet that reported `0x0` is filled through addresses
  the grid computes from its own sequence, so its first row is whichever row the grid showed first **at the
  moment it was filled**. That sequence is captured when the empty sheet is found and used to extend the
  stored list, because the grid can have been reordered since — reading the current sequence there would
  conclude the engine already holds the new order and skip the sync that carries it.
- **An order that cannot be reproduced is not sent.** The compression keeps the engine's own elements in
  their relative order, which reproduces the grid exactly while they still occupy the sequence's leading
  positions — a sheet shorter than the grid means the grid's extra rows are the empty tail the engine left
  out. A reorder that moves one of those in FRONT of an element the engine holds is inexpressible: the engine
  addresses its rows positionally and has no row to shift the others past. Approximating it would leave the
  index translation (which reads HF index `i` as sequence position `i`) and the engine on different rows, so
  nothing is sent. An order that would change nothing is skipped too, because the engine records an undo
  entry and clears its redo stack for every order it is handed.

Still open: a move applied while the engine's sheet is empty reaches the engine through `syncMoves` but is
not reflected in the stored order, and a sequence change that cannot be expressed leaves the engine behind
the grid with no warning.

## `HYPERLINK` cells: an allowlist, not a sanitizer

`resolveLinkUrl()` (in `../../utils/cellLinks/`) allows exactly `http:`, `https:`, `mailto:`, `tel:`. Everything else returns `null`
and the cell does not become a link. Two deliberate choices:

- **The URL is parsed with `new URL()`, not pattern-matched**, so obfuscations that survive a string
  comparison (`JaVaScRiPt:`, `java\tscript:`, leading whitespace) are normalized before the protocol is read.
- **The guard cannot be delegated to a sanitizer**, because default sanitization in this codebase is a
  pass-through (DOMPurify was removed in v18.0).

## Sorting does not remap formula addresses (DEV-917)

Do not implement spreadsheet-style formula address remapping after `ColumnSorting`.
HyperFormula can yield `#REF!` on formula cells in the sortable body, and further
sorts do not restore the original formulas. Product decision (2026-09-16): document
this as a known limitation. The supported workaround is `fixedRowsBottom` so
summary formulas stay out of the sort (#12627). User-facing copy:
`docs/content/guides/formulas/formula-calculation/formula-calculation.md`.

## Where to look next

- Sort-after-`#REF!` is a known limitation (DEV-917), not a remapping feature: `../columnSorting/AGENTS.md`.
- User-facing copy: `docs/content/guides/formulas/formula-calculation/formula-calculation.md`.
- Integration overview and the peer-dependency contract: `../../../.ai/INTEGRATIONS.md`.
- Undo action shapes this plugin reasons about: `../undoRedo/AGENTS.md`.
- Trimming plugins that make HF and visual indexes diverge: `../trimRows/AGENTS.md`,
  `../filters/AGENTS.md`.
- Exporting formulas rather than values: `../exportFile/AGENTS.md` (`exportFormulas`).
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## `HYPERLINK` anchors share plumbing with `autoLink`

- The anchor is built by `createLinkElement()` from `../../utils/cellLinks/` and carries `ht-link ht-hyperlink`.
  `ht-hyperlink` shipped in 18.1.0 and stays forever; `ht-link` is the shared marker the styles and the
  Alt+Enter command key on. Do not build an `<a>` by hand here.
- **Alt+Enter is not registered by this plugin.** It is a core grid command (`shortcuts/contexts/commands/openCellLink.ts`)
  that reads `a.ht-link` from the selected cell's rendered TD. Registering the chord here again would run two
  callbacks per keypress: the shortcut manager appends duplicate key combinations, it does not reject them.
- **Order rule against `autoLink`.** Hook callbacks run in registration order, and `Formulas` can be enabled after
  `AutoLink` through `updateSettings`, so `#onAfterRenderer` must converge from both orders: it always unwraps its
  own `a.ht-hyperlink` first, and when the cell resolves to a link it unwraps every `a.ht-link` before wrapping. When
  the cell resolves to no link it leaves foreign anchors alone. `AutoLink` skips any TD that already holds an `<a>`.
  Unwrapping `a.ht-link` alone is not enough: it leaves behind any `span.ht-link-scheme` `AutoLink` hid inside that
  anchor (`hideSchemePrefix()` in `../../utils/cellLinks/linkElement.ts`), and the wrap that follows would then carry
  that hidden span into the HYPERLINK anchor. So `#onAfterRenderer` unwraps `a.ht-link .ht-link-scheme` FIRST, while
  it is still inside its own anchor — a HYPERLINK label always renders verbatim, whichever `afterRenderer` ran first.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='formulas'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='formulas'`

`__tests__/` is unusually broad: `hfApi`, `initialization`, `validation`, `publicAPI`, `hooks`,
`featureIntegration`, `memoryLeak`, `redoState`, `indexSyncer/`, `plugins/`. A change here almost always
needs more than `formulas.spec.js`, and `memoryLeak.spec.js` is the one people forget.

## `HYPERLINK` cells and `renderMode: 'onChange'`

A `HYPERLINK` whose URL argument lives in another cell keeps its label when that cell changes, so the engine exports no value change for it and an incremental render would keep the stale `href`. `#onAfterRenderer` records every cell it wrapped in `#hyperlinkCells` (physical coordinates) and `#onEngineValuesUpdated` calls `hot.markCellChanged()` for each of them, so any engine update rebuilds the anchors on the next render. A cell that BECOMES a `HYPERLINK` while keeping the label it already showed is not in the set yet and changes nothing the paint compares, so `#onEngineValuesUpdated` also walks the engine's change list and marks every updated cell whose `#getHyperlinkHref` is non-null (`#markCellsThatBecameHyperlinks`). `markCellChanged()` touches stored meta only, so a recorded cell that scrolled out and was evicted costs nothing. The set is cleared in `disablePlugin`, at the top of `#onAfterLoadData`, and in the four create/remove row/column handlers: physical keys drift after a removal, and every one of those paths repaints all rendered cells, which re-registers them. Plain dependents need nothing: the render compares the formatted value, which HyperFormula already changed.
