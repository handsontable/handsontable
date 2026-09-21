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

> **The two exceptions to "always translate": `getCellDependents` / `getCellPrecedents`.** These public
> methods (DEV-204) are the only ones that speak HF index space at their boundary. They neither translate
> the incoming address nor translate the addresses they return, unlike `getCellType` / `isFormulaCellType`,
> which take visual `(row, column)`. It is deliberate, not a missed `getVisualIndexFromHfIndex()`.
> HyperFormula's dependency graph is inherently an HF-space concept, and its results cannot be expressed in
> visual space: a dependent can live on another sheet, the result can be a range rather than a cell, and a
> named-expression reference comes back with `sheet: -1`, none of which has a Handsontable visual
> coordinate. The consequence a caller must know (and the JSDoc states): the returned HF indexes equal
> visual indexes only when nothing is trimmed, hidden, moved, or sorted. Do not "fix" these two by routing
> them through the axis syncers, and do not copy their raw-address pattern into a method that is supposed to
> be visual. The public argument/return types are `FormulasCellAddress` / `FormulasCellRange`
> (`engine/types.ts`, re-exported from the plugin barrel). They are named to avoid a collision with
> HyperFormula's own `SimpleCellAddress` / `SimpleCellRange`, since core source never imports from
> `'hyperformula'`.

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

**A nested `remove_row` undo can refuse to land.** `RemoveRowAction.canUndo()` runs the enabled and
`beforeCreateRow` checks **before** `beforeUndo`, because this plugin always calls `engine.undo()`
there. A late `{ wasUndone: false }` would leave HyperFormula restored and Handsontable empty.
`UndoRedo.undo()` also skips `afterUndo` when the action reports that failure.

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

## The `afterLoadData` listener runs first, at `orderIndex` -1 (DEV-2905)

Every other plugin reads cells through `modifyData`, and this listener is what puts the new data into the
engine (`setSheetContent`). At the default order it ran after AutoColumnSize's full sweep — that plugin has
the lowest `PLUGIN_PRIORITY` — so the sweep measured formula columns against the previous dataset's results,
and the `valuesUpdated` batch this listener triggers queued every changed cell for a second synchronous full
rescan. This listener moved rather than that one because moving the sweep later changed what every other
`afterLoadData` listener sees: AutoRowSize measures row heights against the sweep's widths, and host
callbacks read `getColWidth()`. `afterUpdateData` carries the same order for symmetry. The `updateSettings`
data path is unaffected either way — with `source === 'updateSettings'` this listener returns early and the
engine is fed from `afterCellMetaReset`.

## The per-cell read path caches "the engine holds my sheet" (DEV-2905)

`modifyData` and `modifySourceData` fire once per cell of every bulk read (AutoColumnSize sampling, the
filters column scan), so `#onModifyData` is the plugin's hottest path. Two rules keep it cheap:

- **`#hasOwnSheet()` replaces `engine.doesSheetExist(this.sheetName)` on those two hooks.** The answer is
  cached in `#ownSheetExists` and dropped to `null` from every place the answer can change: the engine's own
  `sheetAdded` / `sheetRenamed` / `sheetRemoved` listeners (engine-wide, so a second instance on the same
  engine removing this instance's sheet still invalidates it), `#updateSheetNameAndSheetId()`, the `engine`
  assignments in `enablePlugin` / `disablePlugin` / `destroy`, and the plugin's own `engine.undo()` /
  `engine.redo()` calls — HyperFormula's undo and redo add, remove, and rename sheets through its
  `UndoRedo` operations, which emit no sheet event. A host calling `engine.undo()` directly on a sheet
  operation is the one path left uncovered; it also desyncs the two undo stacks, so it is unsupported
  regardless. A new invalidation point is needed whenever a new path writes `sheetName`, `sheetId`, or
  `engine` without going through those. `#onEngineSheetRemoved` still does not null `sheetName` — the
  cached `false` is what protects reads after an external `removeSheet` of the own sheet
  (`__tests__/ownSheetCache.unit.js`, `tests/e2e/sheet-switch-autosize.spec.ts`).
- **One address translation per read, on both hooks.** `#toEngineAddress()` does the `toPhysical*` bounds
  check and the two axis-syncer translations once; the type lookup, the dimensions check, and the value
  read share the result. Keep the `VALUE` / `EMPTY` early return — it hands back the raw source string
  (after `unescapeFormulaExpression`), while `getCellValue` would return the engine's parsed value (numeric
  strings as numbers, date text as serials), and array-spill cells have an empty source value yet a real
  engine value, so the type branch cannot be replaced by a check on the source value either.

## Engine settings: `maxRows` / `maxColumns` do NOT reach the engine

HyperFormula's own default sheet size is 40000. Handsontable used to pass its `maxRows`, which defaults to
`Infinity`, so **an engine the plugin builds has never been bounded** (GH #10672). Keep it that way.

Both keys nonetheless stay in `SETTING_KEYS` alongside `language`, because `updatePlugin` also creates or
switches the sheet, and dropping them would skip that.

`engine/register.ts` accepts three shapes: an engine class, an engine instance, or
`{ hyperformula: engineClass }`. Cross-sheet referencing hooks are registered on the shared instance
registry.

## `updateSettings()` resyncs the sheet TWICE, and the second pass is the one that sees plugins

The sheet is rebuilt from the source data in `#onAfterCellMetaReset`, and the Core fires
`afterCellMetaReset` in the **middle** of `updateSettings()` — before `afterUpdateSettings`, which is
where every plugin's `onUpdateSettings` runs. So a setting that changes how many rows the grid holds
is invisible to that pass. `nestedRows: true` is the measured case: the plugin flattens a two-row
tree into four rows, the engine kept the two-row sheet, `Root B`'s `=UPPER(A1)` rendered as its own
raw text, and the computed value had slid onto another row — and a later edit then re-evaluated
against the stale sheet, so the wrong row updated. It was unreachable until the runtime toggle
stopped throwing in `NestedRows`' own data manager.

`#onAfterUpdateSettingsRowCount` is the repair: a second `afterUpdateSettings` listener registered
with **`orderIndex: 1`**, which is what puts it after every default-order listener, the plugins'
included. It compares `countSourceRows()` AND the bound sheet id against what
`#onAfterCellMetaReset` recorded on its way through the same update (`#recordSyncedLayout`), and
re-runs that handler when the count moved on the same sheet.

Eight things to keep:

- **Key it off the row COUNT, never off a plugin.** Nothing here knows what changed the layout, which
  is the point — the next plugin to flatten, group or expand rows at settings time is covered without
  a change, **as long as it reports through `modifySourceLength`**. A plugin that changes row CONTENT
  at a constant count (a `modifyRowData`-only projection) is not covered, and neither is a reorder.
  The corollary belongs in the other plugin's file: it must not reach over here.
- **The sheet id is half the key, and it is the half that prevents data loss.** `updatePlugin()`
  switches the sheet from a default-order `afterUpdateSettings` listener, and `switchSheet()` loads
  the new sheet's rows into the grid — so on a switch between sheets of different heights the count
  differs for a reason that needs no resync. Without the id check the listener wrote the grid BACK
  into the sheet just switched to, through `#getProcessedSourceDataArray`'s visible-column
  projection: a grid showing one column of a three-column sheet truncated that sheet to one column,
  destroying the rest for every grid sharing the engine. Covered by
  `does not write the grid back into a sheet it just switched to`.
- **Record the layout at the END of `#onAfterCellMetaReset`, never at its start.** The empty-data
  branch's own `switchSheet()` runs `loadData()`, which moves the row count itself, so a count taken
  first describes a layout the handler then replaced — and the listener re-entered for a change the
  handler had just made, firing a second full `loadData` from inside `afterUpdateSettings`.
- **The gate is one integer comparison plus one id comparison** on the common path, which matters
  because the React wrapper sends `updateSettings()` on every re-render and the resync it guards is a
  full-dataset scan whose per-cell meta read fires `cells()` and the get-meta listeners. Measured: no
  extra resync on any re-render-shaped payload, and the probe itself is 0.31% of the call it rides on
  even at 50k rows (it is `countAllRows()`, an uncached tree walk, when `nestedRows` is on — O(rows),
  not an integer read).
- **`minRows`/`minSpareRows` are NOT in the covered class.** The Core creates those rows in
  `adjustRowsAndCols()`, which runs after `afterUpdateSettings`, so the gate never sees them; they
  reach the engine through `afterCreateRow` instead, which is correct and cheaper.
- **The intended path pays for the fix.** The mid-update pass still runs against the pre-flatten data
  and its result is discarded, so a `nestedRows` toggle rebuilds the sheet twice: measured 133.7 ms →
  237.1 ms at 10,000 flattened rows (+72%). Halving it means suppressing the mid-update pass while a
  settings cycle is in flight, which changes when every formula grid resyncs — deliberately not done
  here.
- **`orderIndex: 1` is load-bearing and also runs after a USER's `afterUpdateSettings` listener.** A
  listener reading calculated values from inside that hook still sees the pre-toggle sheet; only a
  read after `updateSettings()` returns is guaranteed fresh.
- **On a SHRINK, `getSheetDimensions()` is the wrong probe.** The engine grows a sheet to calculate
  values outside it and does not hand that extent back, so after a four-row grid drops to two the
  dimensions still report four while the content is correct. Assert `getSheetSerialized()` instead —
  `tests/e2e/formulas-nested-rows-toggle.spec.ts` does.

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
  the paths where the engine changes itself: an insert, a removal, a move and an undo all leave it holding
  the grid's new sequence, so the stored order follows it there.
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
