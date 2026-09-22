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

## Engine settings: `maxRows` / `maxColumns` do NOT reach the engine

HyperFormula's own default sheet size is 40000. Handsontable used to pass its `maxRows`, which defaults to
`Infinity`, so **an engine the plugin builds has never been bounded** (GH #10672). Keep it that way.

Both keys nonetheless stay in `SETTING_KEYS` alongside `language`, because `updatePlugin` also creates or
switches the sheet, and dropping them would skip that.

`engine/register.ts` accepts three shapes: an engine class, an engine instance, or
`{ hyperformula: engineClass }`. Cross-sheet referencing hooks are registered on the shared instance
registry.

## `updateSettings()` resyncs the sheet ONCE, after the plugins update

The sheet is rebuilt from the source data by `#resyncSheet()` — one full scan of the source data, one
`setSheetContent`. The Core fires `afterCellMetaReset` in the **middle** of `updateSettings()`, before
`afterUpdateSettings`, which is where every plugin's `onUpdateSettings` runs. So a scan run there describes
a layout a plugin may be about to replace: `nestedRows: true` flattens a two-row tree into four rows, and
an engine left with the two-row sheet rendered `Root B`'s `=UPPER(A1)` as its own raw text while the
computed value slid onto another row (DEV-2978).

One flag, `#sheetResyncPending`, connects four drains:

- **`#onAfterCellMetaReset`** records that a resync is owed and which sheet it belongs to
  (`#sheetIdAtLastSync`). It scans eagerly in exactly two cases: **construction**, because the Core skips
  `afterUpdateSettings` on its first run and `hot.view` does not exist yet, so there is no late pass to
  defer to; and the **empty-data branch**, which is not a scan but a reload of the grid FROM the sheet
  (`switchSheet()`), and which records the layout it produced.
- **`#onBeforeRender`** drains it before a draw starts. This is where the scan actually lands on the
  `nestedRows` toggle: NestedRows renders from its own `onUpdateSettings`, after it has flattened the tree.
  Without this drain the first cell's paint gate would drain it through `#onModifyData`, and the full scan
  plus the dependent grids' redraw would run from inside a cell paint of this grid's own draw (measured
  stack: `#resyncSheet <- #onModifyData <- CellPainter.shouldPaint <- TableView.render <-
  NestedRows.onUpdateSettings`).
- **`#onModifyData` / `#onModifySourceData`** drain it when something reads the engine before either of
  the above — a plugin's `onUpdateSettings`, a user's default-order `afterUpdateSettings` listener.
- **`#onAfterUpdateSettingsRowCount`**, the `afterUpdateSettings` listener registered with
  **`orderIndex: 1`** — after every default-order listener, the plugins' included — drains whatever is
  still owed. When nothing is (an earlier drain ran, or the eager branch did) it falls back to the DEV-2978
  gate: `countSourceRows()` against the count the last write recorded (`#recordSyncedLayout()`), on the
  same sheet id, and rescans only when the count moved after that write.

That is one scan per `updateSettings()`. Measured locally with the `performance-tests` harness on a
throwaway scenario — the perf suite stays small and broad, and the count is pinned by the tests below —
(5,000 parents with one child each, 10,000 rows flattened, `updateSettings({ nestedRows: true })`):
**151 ms → 99 ms total (−34%), 2 → 1 `setSheetContent` per toggle, 5 iterations** (DEV-3006; heap moved
−4% to −11% across develop runs, so read that column loosely). Before DEV-3006 the mid-update scan ran and was discarded, and the late
listener scanned again. The total did not shrink for a settings change that leaves the row count alone: the
one scan moved from `afterCellMetaReset` to the first drain, so a user listener that reads one cell mid-cycle
now pays it inside that read (measured 78–90 ms at 10,000 rows, against 0 ms before), and a profiler bills
it to the listener.

Rules that keep it correct:

- **Reads through the Core data API never see a stale engine; the plugin's own methods can.**
  `getDataAtCell()`, `getData()`, `getSourceDataAtCell()`, `getSourceData()` and a render all pass through
  the two read hooks, which drain the flag after their own early-return guards, so a plugin's
  `onUpdateSettings` or a user's default-order listener that reads a cell gets the sheet the update
  produced. `getCellType()`, `isFormulaCellType()`, `getCellDependents()`, `getCellPrecedents()` and a
  direct `plugin.engine.*` read do NOT drain: from a default-order listener they answer for the PREVIOUS
  sheet until the update returns, where before DEV-3006 they answered for the mid-update scan (a different
  stale state, but stale on a row-count change too). A second grid on the same engine reading this sheet
  through a cross-sheet reference sees the previous sheet in that window as well; it is re-rendered when
  the drain runs. No core plugin reads any of those inside the window.
- **A listener throw is self-healing; a scan throw is not retried.** If a default-order listener throws,
  `updateSettings()` unwinds before the late listener runs and the flag stays set; the next draw or engine
  read drains it, and so does the next `updateSettings()` or `loadData()`. If the SCAN throws — a `cells()`
  handler that throws for one cell, a dependent grid whose `afterRender` throws — `#resyncSheet()` leaves
  the flag cleared and the layout unrecorded, and the next `updateSettings()` retries. It must not re-arm
  the flag: measured with a persistently throwing write, a re-armed flag turned every later `getDataAtCell()`
  and `render()` into a full scan that threw again (3 reads, 3 throws, 4 writes), where develop threw once
  and kept rendering. The one deterministic engine throw, a sheet over `maxRows` / `maxColumns`, is not
  thrown at all: `isItPossibleToReplaceSheetContent` is checked first and `#clearRejectedSheet()` empties
  the sheet with a warning, the same treatment `#onAfterLoadData` gives a rejected load. Covered by `syncs
  the sheet on the next read when a default-order listener throws`, `does not retry a scan that threw until
  the next settings update`, `stops scanning after a write that fails on every attempt`, and `empties the
  sheet instead of throwing when the engine cannot hold the layout`.
- **A scan can now throw out of a READ or a RENDER.** The drain moved from `updateSettings()` into the
  hooks, so a resync that fails surfaces from the `getDataAtCell()`, `getSourceDataAtCell()` or `render()`
  that drained it, where before it surfaced from `updateSettings()`. Accepted: the alternative is serving a
  value from a sheet known to be stale. It surfaces once, per the rule above.
- **`#resyncSheet()` clears the flag FIRST.** The scan reads the source data through the very hooks that
  drain the flag — `#getProcessedSourceDataArray` suspends the projection for its bulk read but not for the
  `getSourceDataAtRow` probe that follows it — so a flag still set inside the scan re-enters the method from
  its own scan (measured as a stack overflow). Every write releases `#internalOperationPending` in a
  `finally` — `#writeSheet()` is the one full-write path, shared by `#resyncSheet()` and the
  `#onAfterLoadData` write branch, and `#clearRejectedSheet()` does the same for the emptying write —
  because the read hooks return early while it is set and would otherwise serve raw formula text until
  the next settings update. That is what the frozen Jasmine spec `should recover when a dependent grid
  throws mid-write` used to pin as an intermediate state and now asserts the healed value of, and what
  `keeps serving the engine after a dependent grid throws during a loadData write` pins for the load path.
- **Binding another sheet cancels the owed resync.** `#updateSheetNameAndSheetId()` clears the flag, so
  `switchSheet()` (which loads the grid FROM the sheet) and the `addSheet` callers (which filled the sheet
  from the grid) leave nothing to carry — a drain after them would write this grid's visible-column
  projection over the sheet just bound: a grid showing one column of a three-column sheet truncated that
  sheet for every grid sharing the engine (the DEV-2978 data-loss case). The late listener's sheet-id check
  is the second line of defense. Covered by `does not write the grid into a sheet the update switched to`
  (unit) and `does not write the grid back into a sheet it just switched to` (Playwright).
  `#onAfterLoadData`'s own write clears it for the same reason.
- **Key the fallback gate off the row COUNT, never off a plugin.** Nothing here knows what changed the
  layout, which is the point — the next plugin to flatten, group or expand rows at settings time is
  covered without a change, **as long as it reports through `modifySourceLength`**. `minRows` /
  `minSpareRows` are NOT in that class: the Core creates those rows in `adjustRowsAndCols()`, after
  `afterUpdateSettings`, and they reach the engine through `afterCreateRow`. A read that drains BEFORE a
  row-count-changing plugin runs (a listener on `afterCellMetaReset`) costs the second scan the gate exists
  for — covered by `rescans when the row count moves after an early drain`.
- **Record the layout at the END of every write, never at the start.** `#resyncSheet()`,
  `#clearRejectedSheet()`, the `#onAfterLoadData` write branch and the empty-data reload all record it.
  The empty-data branch's `switchSheet()` runs `loadData()`, which moves the row count itself; a count
  taken first describes a layout the handler then replaced, and the late listener re-entered for a change
  the handler had just made. A `loadData()` from a default-order listener records too, so the gate does not
  take the rows it loaded for a foreign layout change — covered by `lets a default-order listener load data
  without a second scan`.
- **One `setSheetContent` per update is also one engine undo entry per update.** Every write pushes a
  HyperFormula undo entry and clears its redo stack, and the grid records no action for a settings update,
  so the discarded second scan used to add an entry the grid could never match. Covered by `pushes exactly
  one engine undo entry per settings update`; it counts entries, it does not prove the two stacks agree
  after an `undo()`, because NestedRows clears the grid's history on enable.
- **`hot.view` is the init detector, on purpose.** The Core creates the view right after the first
  `updateSettings(settings, true)`, so it is absent during the construction-time `afterCellMetaReset`
  and present for every later one; `collapsibleColumns` and `emptyDataState` read the same signal. Covered
  by `fills the sheet before the first draw at construction`.
- **The incremental alternative was considered and rejected.** Replacing the late full scan with
  `addRows` / `removeRows` for the row delta does not work: flattening inserts rows in the INTERIOR of the
  sheet, not at the end, so the delta is not an append and the insert positions would have to be derived
  from the tree. More machinery and more ways to be quietly wrong; revisit only if the deferral above turns
  out to be unsafe.
- **Known gap:** a foreign `afterUpdateSettings` listener that runs `disablePlugin(); enablePlugin()` on
  this plugin mid-update drops the owed resync (`disablePlugin` clears the flag, `enablePlugin` finds the
  sheet still in a user-supplied engine and skips the rebuild), so the sheet keeps the previous data until
  the next update. Formulas' own `updatePlugin` does not do this. Not fixed, because setting the flag on
  every re-enable would also rescan a plain runtime re-enable, which never rebuilt the sheet before.
- **On a SHRINK, `getSheetDimensions()` is the wrong probe.** The engine grows a sheet to calculate
  values outside it and does not hand that extent back, so after a four-row grid drops to two the
  dimensions still report four while the content is correct. Assert `getSheetSerialized()` instead —
  `tests/e2e/formulas-nested-rows-toggle.spec.ts` does.

Tests: `__tests__/deferredResync.unit.js` (scan count, every drain, init fill, listener and scan throws,
engine size limit, mid-update read, sheet switch, undo depth) and `tests/e2e/formulas-nested-rows-toggle.spec.ts`
(`rebuilds the sheet once per toggle`).

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

## `showFormulas()`/`hideFormulas()`: display-only, on purpose (DEV-207)

`#showFormulasFlag` makes a `FORMULA`/`ARRAYFORMULA` cell show its formula text instead of its
calculated value. It is deliberately **not** read by `#onModifyData`: that hook feeds every
`getDataAtCell()` consumer — the renderer, `CopyPaste`, but also column sorting's comparator, the
Filters value-list dropdown, and cell validation — and gating there would make sorting order by
formula text and the value-list dropdown show formula strings, which neither Excel nor Google
Sheets does. Cell validation happens to be immune regardless: `#onBeforeValidate` (below) already
recomputes the calculated value from the engine directly, ignoring whatever `modifyData` reports.

Two separate mechanisms carry the mode instead, both scoped to exactly where a user expects it:

- **Paint**: `#onPaintFormulaText`, a *second* `afterRenderer` hook registered with `orderIndex: 1`
  (`this.addHook('afterRenderer', this.#onPaintFormulaText, 1)`), so it always runs after every
  default-order (`orderIndex` 0) `afterRenderer` listener — this plugin's own `#onAfterRenderer`
  above (the `HYPERLINK` wrap) and `AutoLink`'s. **The `orderIndex` is load-bearing, not tidiness.**
  `AutoLink`'s hook reads the TD's *live rendered text*, not the hook's `value` argument, so without
  it a `=HYPERLINK("https://…", label)` formula's own painted text would get re-linkified by
  `AutoLink` the instant this plugin wrote it — measured and confirmed with a negative control
  (`tests/e2e/formulas-show-formulas.spec.ts`, "does not let AutoLink re-linkify…"). Running last
  makes this plugin's paint the final write for the cell regardless of which plugin enabled first.
- **Copy/cut**: `#onBeforeCopyOrCut`, registered on both `beforeCopy` and `beforeCut`, rewrites only
  the copied array in place — never touches `getDataAtCell()` or the data map. It has to map each
  `data[i][j]` back to a `(row, column)` from the `coords` argument alone, the same way
  `CopyPaste#getRangedData()`/`normalizeRanges()` (`../copyPaste/copyableRanges.ts`) built that array
  in the first place: dedupe each range's rows and columns, first-seen order. `copiedRowsAndColumns()`
  reimplements that small, pure derivation locally rather than importing it, to avoid a cross-plugin
  dependency on `copyPaste`'s internal module — keep the two in sync if that algorithm ever changes.
  A negative row in `coords` is a copied column header (`CopyPaste#getRangedData`'s `row < 0`
  convention), never a formula cell, and is skipped.

`showFormulas()`/`hideFormulas()` both guard on `this.enabled` and no-op while the plugin is
disabled — `#onModifyData`/`#onPaintFormulaText` cost nothing while disabled either way, but a bare
flag flip with no hook to act on it would make `isShowingFormulas()` report a mode that shows
nothing.

The `Ctrl`+`` ` `` grid shortcut is registered/removed with the plugin's own `#registerToggleFormulasShortcut`/
`#unregisterToggleFormulasShortcut` (own `SHORTCUTS_GROUP = PLUGIN_KEY`), called from
`enablePlugin()`/`disablePlugin()` — **not** through the deprecated `registerShortcuts()`/
`unregisterShortcuts()` no-op shims, which exist only for the pre-19.0.0 `Alt`+`Enter` link shortcut
and must keep doing nothing. The binding is `['Control', 'backquote']`, not `Control/Meta` and not
the literal `` ` `` character: `Cmd`+`` ` `` is macOS's own "move focus to the next window" shortcut
(the same reason `MergeCells` binds `['Control', 'm']`), and a real backquote keypress's
`keyCode`/`which` (192) normalizes to the string `'backquote'`, never to the character itself
(`shortcuts/utils.ts`'s `specialCharactersSet`) — the Jasmine `keyDownUp()` simulator cannot
reproduce that real `keyCode`, which is why the shortcut's real-keypress coverage lives in
`tests/e2e/formulas-show-formulas.spec.ts` instead of the Jasmine suite.

**Known limitation: `AutoColumnSize`/`AutoRowSize` measure the calculated value, not the painted
text.** Both size through `GhostTable`, which calls a cell's renderer directly and never fires
`afterRenderer` — so a column stays sized for `3` while the DOM shows `=A1+B1`, and a long formula
can clip for as long as the mode is on. No render or settings change recalculates it. Accepted
trade-off for keeping the toggle purely display-only rather than feeding the sampler a second, mode-
dependent measurement path.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='formulas'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='formulas'`

`__tests__/` is unusually broad: `hfApi`, `initialization`, `validation`, `publicAPI`, `hooks`,
`featureIntegration`, `memoryLeak`, `redoState`, `indexSyncer/`, `plugins/`. A change here almost always
needs more than `formulas.spec.js`, and `memoryLeak.spec.js` is the one people forget.

## `HYPERLINK` cells and `renderMode: 'onChange'`

A `HYPERLINK` whose URL argument lives in another cell keeps its label when that cell changes, so the engine exports no value change for it and an incremental render would keep the stale `href`. `#onAfterRenderer` records every cell it wrapped in `#hyperlinkCells` (physical coordinates) and `#onEngineValuesUpdated` calls `hot.markCellChanged()` for each of them, so any engine update rebuilds the anchors on the next render. A cell that BECOMES a `HYPERLINK` while keeping the label it already showed is not in the set yet and changes nothing the paint compares, so `#onEngineValuesUpdated` also walks the engine's change list and marks every updated cell whose `#getHyperlinkHref` is non-null (`#markCellsThatBecameHyperlinks`). `markCellChanged()` touches stored meta only, so a recorded cell that scrolled out and was evicted costs nothing. The set is cleared in `disablePlugin`, at the top of `#onAfterLoadData`, and in the four create/remove row/column handlers: physical keys drift after a removal, and every one of those paths repaints all rendered cells, which re-registers them. Plain dependents need nothing: the render compares the formatted value, which HyperFormula already changed.
