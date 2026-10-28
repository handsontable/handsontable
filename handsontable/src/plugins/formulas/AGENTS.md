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
- **`captureState()` returns two versions and, while the order is not physical or the source data is stale, the engine's sheet.**
  `structureVersion` changes on every row or column insert, removal, move, **and every sequence
  change** (a sort included) and on a NestedRows detach; `dataVersion` on every cell write. UndoRedo
  calls `restoreState(state)` whenever a step changed either of them. When the structure version
  differs from the one the engine holds, the sheet is replaced and the held writes are dropped:
  - **In physical order, with the source data in step with the engine,** the source data is
    authoritative: `#loadSourceDataIntoSheet()`, the same path a data load takes. The write-back of engine-rewritten formulas (`#syncFormulasToSourceData`)
    runs inside the forward operation, so the journal holds it and the undo reverses it.
  - **After a structural change made out of physical order, the source data stays stale when the order
    returns.** The write-back is skipped there, so the source keeps the text the engine has since rewritten
    (an insert at visual 1 shifts every formula below it), and `#sourceHasStaleFormulas` records it. The next
    structural step in physical order writes the engine's text into the source and journals the stale text as
    its "before" value, so a state captured before that step must carry the engine's sheet: its undo reloaded
    the stale source otherwise, and the formulas ended up pointing at the wrong rows (DEV-3624). A full
    write-back in physical order, or a full sheet write from the source (`#writeSheet()`), clears the flag; a
    restore sets it from whether the restored state carries an engine sheet. Pinned by
    `__tests__/reorderedInsertUndo.unit.js`.
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

**A restore trims the lines the reload left behind.** `setSheetContent()` never shrinks a sheet, so
the row or column an insert added stayed in the engine when an undo reloaded the sheet without it: one extra
engine line per insert and undo (7 rows, the last one moved to the top, 40 cycles of an insert at row 2: height
3 to 45; without a reorder, an insert at row 0 or 1 gave 2 to 42). `addRows` grows the sheet for a real reason
and the grid's undo never tells the engine, so the undo's reload is where the line is not given back. **Only
the undo and redo restore trims** (`#restoreStructure()`, for a structural step, after the peer rewrites are put
back). A data-only step restores through the other branch of `restoreState()` and never trims, so a sheet the
host grew keeps its size. `loadData()`, `updateSettings({ data })` and every other `setSheetContent()` path
still keep the sheet's size, as before. A host that inserts and then reloads the data in a loop still leaks.

The trim takes away only what the step added:

- **It never goes below the size the restored state had.** `#sheetSizeFloors` maps each recorded state to
  the engine's width and height at its last capture, and `AxisSyncer#trimUnusedTail(minSize)` stops there,
  per axis. A row insert and its undo therefore cannot shorten the width, and a sheet the engine had grown on
  its own (a write-and-clear extension, another sheet's reference) keeps that size. **The size is not part of
  the state.** `captureState()` hands back the previous state while the versions are unchanged, and a sheet
  that another grid grows (`=Sheet1!A50` typed in a second grid) changes no version: a state that carried the
  size was replaced by a new object, UndoRedo compares states by identity, so it recorded an empty step and
  dropped the redo stack. A reused state gets its floor raised to the current size instead.
- **A line goes only when it holds nothing and no formula reads a cell of it** (`getCellDependents()`). An
  empty cell that a formula reads counts towards the sheet's size, and removing its line turns the reference
  into `#REF!` (`=A5*2` becomes `=#REF!*2`, and `SUM(A1:A9)` shrinks). Check the dependents, not only
  `isCellEmpty()`. The trim runs after `#restorePeerRewrites()` because a peer's formula still names the
  shifted line before that. The scan starts at the last line and stops at the first used one, so a sheet
  without a leak pays one line's check.
- **The reload, the peer rewrites and both trims are one engine batch, so a restore emits once.** Every
  engine call recalculates a volatile formula (`=RAND()`), and each recalculation emits `valuesUpdated` and
  `afterFormulasValuesUpdate` and repaints a second grid on the engine again. Trimming in a call of its own
  made that two emits for one undo. The batch is why `#restoreStructure()` reads the source data before it
  and holds `#internalOperationPending` for its length: a suspended engine refuses value reads, and those
  come from `modifyData` and `modifySourceData`. `#restorePeerRewrites()` runs inside it without a batch of
  its own (a nested `batch()` would end the suspension), and `#syncPeerSources()` runs after it, because it
  reads values. The trim is not in a `finally`: after a half-applied restore, lines still to be filled look
  unused, and the batch skips it when something above throws.
- **Known limit: a whole-column or whole-row reference (`SUM(A:A)`, `SUM(1:1)`) is never trimmed.** It
  depends on every cell of its column or row, so no line is unused and the sheet grows by one line per
  insert and undo, as it does without the trim. Pinned as such in `__tests__/insertUndoEngineSize.unit.js`;
  fixing it means asking whether the only readers of a line are ranges that span the whole axis.

Pinned by `__tests__/insertUndoEngineSize.unit.js`, which also pins formulas that read cells past the content.

A move is covered the same way: the cells a move writes, and the formulas elsewhere the engine
rewrote, are all journaled inside the move's own step, so an undo writes them back and `restoreState()`
feeds them to the engine. `commitPendingMoveCells()` runs for a user's move only. **A move made while
the order is not physical marks the structure changed** (not only the data): the engine's references
depend on the order there, so the undo must load the recorded `engineSheet` instead of writing cells
into a sheet whose references the move already rewrote.

**Another sheet on the same engine is not this grid's to reload, so its rewrites are recorded as
text (`peerRewrites`).** When this grid adds, removes or moves rows, columns or cells, HyperFormula
rewrites every formula that points into this sheet - in other grids' sheets and in named
expressions - and restoring this sheet never touches them (a reverse `addRows` cannot turn a `#REF!`
back into a reference, and `getCellDependents()` cannot list references into a sheet). So each engine
call that can rewrite references runs through `#trackPeerRewrites()`: before the call it lists the
candidates (peer-sheet cells whose formula text, lowercased, names this sheet, plus every named
expression in the global scope and every sheet scope), after it re-reads them, and the text that
changed goes into `#pendingPeerRewrites` (first `before`, last `after` per key). Five rules:

- **It costs nothing on a single-sheet engine, and one scan per changed peer sheet otherwise.** The
  probe runs only while a step is recording (`getRecordingTransaction() !== null`) and the engine
  holds another sheet or a named expression. Reading a peer sheet's formulas is the whole cost -
  measured about 35 ms for ten value-only sheets of 100k cells, 52 ms with a formula in one cell of
  ten - so `#sheetsNotNamingOwnSheet` remembers the sheets a scan found with no formula naming this
  one and skips them. An entry goes away when `valuesUpdated` reports any cell of that sheet
  (HyperFormula reports every cell whose content is set, even when its value does not change, and a
  new formula's first value always differs from none); the set is cleared on `sheetRenamed`,
  `sheetRemoved`, enable, and a new own sheet. It is not used while `isEvaluationSuspended()`,
  because the engine holds its events back then. **Known limit:** a formula the HOST moves into a
  skipped peer sheet with the engine API (a cross-sheet `engine.moveCells()`) is not seen.
  HyperFormula moves the vertex and re-evaluates it to the same value, so `valuesUpdated` reports
  nothing in that sheet, and an undo of a later row or column change here leaves that formula's
  rewrite in place (`=S1!A4` where `=S1!A5` was). The plugin's own MoveCells path stays inside its
  sheet and is not affected. Caching only the sheets a Formulas grid owns would not close it: the
  move can land in one of them. Sorts and the restore's identity reset go through
  `setRowOrder`, which never rewrites peers, so they are not wrapped. Wrapped: `addRows`,
  `addColumns`, the removal batches, the `moveCells` batch, and the `calculateAndSyncMoves` calls
  (`moveRows` is add + move + remove in HyperFormula).
- **A quoted sheet name is matched in both forms.** HyperFormula writes `O'Brien` as
  `'O''Brien'!A1`, so the text is searched for the name as typed and with every `'` doubled. A named
  expression scoped to a sheet that was removed since is skipped on restore:
  `getNamedExpressionFormula()` throws for a removed scope, inside `engine.batch()`, which left the
  undo half-applied.
- **`captureState()` takes the pending rewrites into the state** and never returns `previous` while
  any are pending. `restoreState()` reads them from `context.other` on undo and from `state` on redo,
  and writes a text back only when the current text is still the one the step left - a formula
  edited since keeps its new text, and one `warnOnce` says so. A named expression keeps its options.
- **The peer grid's source data follows.** `#syncPeerSources()` finds the other grid through
  `getRegisteredHotInstances()`, checks `peer instanceof Formulas` (a grid from a second bundle is
  another class, and the `#` access would throw), and writes the engine's formulas into its source
  inside `suppress()`, so that grid gets no step of its own. It writes only the rewritten cells
  (`#syncFormulasToSourceData(true, cells)`), because it allows `#REF!`: a whole-sheet write would
  also persist a `#REF!` the peer's engine holds for another reason, which `REF_ERROR_PATTERN`
  exists to keep out of the developer's array.
- **Limits:** a formula written in another grid after the step is not adjusted by the undo; a later
  structural change in the other grid can move the recorded address (the content guard catches
  most); a sorted peer gets its engine updated but not its source written.

**The engine sheet snapshot shares its unchanged rows** with the previous snapshot
(`#captureEngineSheet()`), so the memory a long history takes grows with the rows each step changed,
not with the sheet size. The time to serialize is still O(cells) per data step on a sorted grid.

**A removed sheet is left alone.** When the host removed this grid's sheet from the engine,
`restoreState()` only follows the recorded versions (`!#hasOwnSheet()`), and the axis syncer skips its
`'update'` sync (`#isSheetRemoved()`, `getSheetName(sheetId) === undefined`) - an undo of a sort or
an insert after `removeSheet()` threw before.

**A restored write goes through the column's `valueGetter`** (`#writeSourceChangesToEngine()` uses
`#getValueGetterValue()`), the same way a load does, so an object value keyed by `value` reaches the
engine as the value and not as `[object Object]`.

**`getStateColumns()` answers `[]` only for a data-only step in physical order** (both states without
an `engineSheet` and with the same `structureVersion`): its cells are restored by prop. Any step that
reloads the sheet or loads a serialized one restores a column layout, so it is dropped by a `columns`
update that changes a column's field (`../undoRedo/AGENTS.md`, "The epoch").

`IndexSyncer` has no undo/redo flags anymore. Restoring the row or column order fires the sequence
change like any other, and the axis syncer sends the new order to the engine; a reload afterwards
re-runs `setupSyncEndpoint()`.

**`auto` is blocked in both directions, and a lowered minimum size relies on that (DEV-2206).** The rows and
columns `minRows`/`minSpareRows`/`minCols`/`minSpareCols` append are created with `auto`, so
`#onAfterCreateRow`/`#onAfterCreateCol` never send them to the engine; the removal that gives them back
(`grid.removeSurplusRowsAndCols()` in `core.ts`) is `auto` too, so `#onAfterRemoveRow`/`#onAfterRemoveCol`
never send it either. The engine holds a sheet sparsely and those rows are always empty, so it never had
anything to lose: `getSheetSerialized()` reads the same before and after a lowering (measured). Do not unblock
the removal alone — the engine would record an undo entry the grid's history does not have. One visible effect,
accepted: a formula that points INTO a filler row keeps its reference and reads empty after a lowering, where an
ordinary `alter('remove_row')` turns it into `#REF!` (both measured).

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

**Removed indexes are translated physically** (`AxisSyncer#setRemovedHfIndexes`). The engine holds trimmed
rows too, and a NestedRows detach hands `beforeRemoveRow` the whole subtree, including a descendant trimmed
by `trimRows`. A visual translation reported that row as `-1`, and `engine.removeRows()` threw in the middle
of the detach (DEV-138).

**`#onBeforeRemoveRow` relies on NestedRows expanding the removal list first.** NestedRows rewrites the
`beforeRemoveRow` list by reference to cover the removed parent's whole subtree. It registers that listener
with `orderIndex: -1`, so this plugin's listener (priority 260) sees the expanded list, and both the engine
removal and the `isItPossibleToRemoveRows` veto cover every descendant. At the default order this listener
ran first and read the parent alone, so the engine kept the descendants while the grid dropped them, and
every reference below the subtree shifted by the number of rows the caller named instead of by the number
actually removed (DEV-3092). The
undo-only specs missed it because an undo lines both sides up again. Assert the engine sheet right after the
removal (`tests/e2e/formulas-nested-rows-remove-parent.spec.ts`). Do not fix a similar ordering problem by
expanding the list here: that couples this plugin to the tree.

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

**The listener also overtakes `manualColumnMove` / `manualRowMove`, and that changed which engine call
carries a configured order on a later `loadData()`.** Init is untouched: those plugins apply their arrays in
`enablePlugin`, so at the first `afterLoadData` the sequence is already non-identity and
`setupSyncEndpoint()` → `#syncInitialOrder()` sends `setColumnOrder` / `setRowOrder` on both develop and this
branch (measured with the engine methods spied; the reference rewrite that
`__tests__/plugins/initialManualColumnMove.spec.js` pins at init is unchanged). On a `loadData()` after
init the two plugins re-apply the arrays in their own `afterLoadData`. Develop ran that before this listener,
and the order reached the engine **twice**: `moveColumns` from the move, then `setSheetContent`, then
`setColumnOrder` from `#syncInitialOrder()` — a double transform that rewrote `=A1+10` to `=B1+10` (510
instead of 15 on the spec's data). Now this listener runs first, `#syncInitialOrder()` sees the identity
sequence and sends nothing, and the move that follows reaches the engine once through `syncMoves()`. The
spec's `loadData()` case pins the formula staying `=A1+10`. Do not "restore" the `setColumnOrder` path by
postponing `setupSyncEndpoint()` behind the moves without re-measuring that case.

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
- **An enable on a live grid whose sheet a shared engine still holds owes a resync.** The engine keeps
  the sheet as it was when the plugin was turned off, and the edits made since are only in the grid's
  data: before this, a re-enable bound the stale sheet, so those edits were ignored by every formula,
  and a foreign `afterUpdateSettings` listener that ran `disablePlugin(); enablePlugin()` mid-update
  lost the update's data the same way. `enablePlugin()` sets `#sheetResyncPending` there, which the
  next draw or read drains. Three cases skip it: no view yet (construction), a grid built without data
  (it reads the engine sheet as its data), and a load core is about to make (`isDataLoadPending()`,
  the sheets bar's switch), which feeds the sheet itself. Pinned by `__tests__/reenableSharedEngine.unit.js`
  and "writes the new data when a listener disables and re-enables the plugin mid-update".
- **At construction, a sheet a load in the same build already wrote is not scanned again** when the
  row count is the same and the meta phase cannot change what the engine reads
  (`#metaPhaseMayChangeEngineValues()`): the sheets bar loads its opening sheet itself, and the eager
  construction resync fed it a second time.
- **On a SHRINK, `getSheetDimensions()` is the wrong probe.** The engine grows a sheet to calculate
  values outside it and does not hand that extent back, so after a four-row grid drops to two the
  dimensions still report four while the content is correct. Assert `getSheetSerialized()` instead —
  `tests/e2e/formulas-nested-rows-toggle.spec.ts` does.

Tests: `__tests__/deferredResync.unit.js` (scan count, every drain, init fill, listener and scan throws,
engine size limit, mid-update read, sheet switch, undo depth) and `tests/e2e/formulas-nested-rows-toggle.spec.ts`
(`rebuilds the sheet once per toggle`).

## A validated write reaches the engine BEFORE the source data

`#onAfterSetDataAtCell` writes a `setDataAtCell()` / `setDataAtRowProp()` change into the engine
synchronously, but the Core applies a change to the source data only after the column's validators
resolve — and `validateCell` always resolves in a microtask. Any cell with a validator opens that window:
a `numeric`, `date`, `dropdown` or `autocomplete` column, or a custom `validator`. A full sheet write from
the source data inside it (`#writeSheet`, reached from an `updateSettings()` in the same synchronous task)
scans data that does not hold the change yet and silently drops it from the engine: the cell reads its raw
formula text through `getDataAtCell()` and every formula depending on it keeps the previous value, with no
error. Pre-existing — reproduced identically on 18.1.1. Repro: a grid with `columns: [{ type: 'numeric' }]`,
`setDataAtCell(2, 0, '=SUM(A1:A2)')` then `updateSettings({})` in the same task.

The repair is `#onBeforeChangeRender`. `#onAfterSetDataAtCell` records each change set in
`#changesAwaitingApply` (a `WeakMap` keyed by the change array — the Core hands the same array to
`beforeChangeRender`), together with `#sheetWriteCount` and `sheetId`. When the count has moved, or
the sheet id has changed, by the time the Core applies the set, the set is written into the engine
again. Five rules:

- **`beforeChangeRender`, not `afterChange`.** The Core renders between the two, so writing back from
  `afterChange` painted the raw formula text until the next render (negative control in the test below).
- **`#clearRejectedSheet` does not bump the count.** Writing one change back into a sheet the engine
  refused to hold would leave it holding that one cell.
- **A sheet switch in the window does NOT stop the write-back - the engine follows the grid.** The Core
  applies the validated change to whatever data the grid holds when validation ends, and after a switch
  that is the switched-to sheet's. A guard on the sheet id used to skip the write-back there, which left
  the grid holding the change while the engine did not, so the cell showed its raw formula text. The
  plugin's invariant is that the engine mirrors the grid, so the set is written into the CURRENT sheet.
  The switch alone does not move the count (its `loadData()` writes no sheet), so the record also keeps
  the sheet id it was written under, and a changed id triggers the write-back too. Comparing the count
  alone skipped a bare switch, and the switched-to sheet never got the change. Pinned by `keeps the
  engine in step with the grid when the sheet switched while the change was validated` (switch plus a
  full write) and `writes a change into the switched-to sheet when the switch alone ran while the change
  was validated` (switch only).
- **After a switch, the switched-AWAY sheet is put back.** `afterSetDataAtCell` already wrote the change
  into the sheet the grid showed then, and the Core never applies it there, so one `setDataAtCell()` used
  to land in both sheets: switching back showed a value the grid data never held. `#restoreSwitchedAwaySheet`
  writes the change set's OLD values back into the sheet recorded on the set (they are what that sheet
  held, since the grid's data was that sheet's when the change was made), skipping out-of-bounds changes
  (never written there) and a sheet removed from the engine. **It restores the cells the first write
  RECORDED (`ChangeSetAwaitingApply#writtenCells`: engine address, grid coordinates, old value), never
  a fresh mapping.** The index mapping DOES move on a switch: the switch's `loadData` clears runtime
  trims, so with row 0 trimmed a change to visual row 0 was written to sheet row 1, while a mapping
  after the switch named sheet row 0 and overwrote it with the old value. Pinned by the `first` sheet
  assertions in both sheet-switch tests, `puts the switched-away sheet back when a slower validator
  answers after the switch`, and `restores the recorded cell when a trim the switch cleared moved
  the rows`.
- **The restore escapes a text old value like any engine-bound write** (`#escapeEngineBoundValue`): written
  back raw, a preserved text `'007'` came back as the number 7, and a non-ISO string in a `date` column
  as a serial number. Pinned by `puts a preserved text value back as text in the switched-away sheet`.
- **The restore keeps two guards, and only one of them is covered by the other.** The removed-sheet
  check (`getSheetName(sheetId) === undefined`) skips the whole batch for a sheet removed while the change
  was validated; `isItPossibleToSetCellContents` guards each cell against the engine's own limits.
  Deleting the removed-sheet check alone keeps the suite green, because the per-cell guard then absorbs a
  removed sheet. The per-cell guard is covered by nothing: `writtenCells` records a cell even when the
  engine refused its FIRST write (`syncChangeWithEngine` past `maxRows`), so on a live switched-away sheet
  only that guard stops `setCellContents` from throwing `SheetSizeLimitExceededError`. Keep both: the
  first states the intent and avoids an empty engine batch, the second is the per-cell bound no
  sheet-level check gives. Pinned by `leaves a switched-away sheet alone when it was removed from the
  engine before the change was applied` (the removed-sheet case, which throws only with both deleted) and
  `does not put back a cell the engine refused the first write of` (the per-cell guard alone).
- **The write-back writes the whole set once, and the out-of-bounds write stands aside.** A change past
  the last row or column is not written from `afterSetDataAtCell` but from a one-off `afterChange`
  listener, after the Core created the row. By `beforeChangeRender` that row exists, so the write-back
  covers it and sets `writtenBack` on the record, which the `afterChange` listener checks. Writing it
  twice is a redundant engine write and an extra entry on the ENGINE's own undo stack. A grid undo never
  calls `engine.undo()` (it restores the engine from the state the plugin recorded), so only an app that
  calls `engine.undo()` itself would see that entry. Pinned by the `setCellContents` count in `writes the
  out-of-bounds rows of a paste into the engine once, not again from afterChange`. Its neighbor, `undoes a
  paste past the last row in the grid and the engine`, checks the undo only and does not pin the single
  write.
- **The write-back repaints the other sheets' grids that read the cell** (the write scope, see `valuesUpdated` below), like
  the `afterSetDataAtCell` path: a grid on another sheet kept painting the old value while its data was
  already right. Pinned by `repaints another sheet's grid that reads the written-back cell`.
- **The write-back validates the dependents it recalculated**, like the `afterSetDataAtCell` path. The
  first validation ran against the settings the update replaced (a swapped validator, for one).

**Overlapping async sets on one cell across a switch restore a stale old value (DEV-3308, open).** With
an async validator, a second set on the same cell, written while the first is still validating, records
the same old value as the first. When the first set applies on sheet A, the grid switches, and the second
set applies on the other sheet, `#restoreSwitchedAwaySheet` writes that old value into A over the first
set's applied value. **Compare-and-restore does NOT fix it** – skipping the restore when a later write
owns the cell was checked by the reviewer against a patched bundle, and A still ends with the old value,
because the second set IS the last writer of the cell, so its guard passes. The fix is to refresh the
recorded old value of the other pending sets that wrote the same cell when a set applies on its own sheet:
a per-cell list of pending sets beside the `WeakMap`, cleared when a set applies or is dropped. The base
build also ends with a wrong value here, so this is pre-existing.

A validator's rejection needs no guard **in the write-back**: `validateChanges()` splices a rejected change
out of the very array `beforeChangeRender` receives, so the write-back never sees it. Keep the write-back
reading that array, not a copy taken in `afterSetDataAtCell`. **That does not hold for the FIRST write.**
`afterSetDataAtCell` writes the change into the engine before validation, and nothing puts the old value
back when the validator rejects it: when every change of the set is rejected `beforeChangeRender` does not
fire at all, and a partly rejected set is applied without the rejected cell. A formula reading that cell
shows a wrong result until the next full resync (`allowInvalid: false` numeric column, `setDataAtCell(2, 0,
'abc')`: the engine holds `'abc'`, the grid keeps the old number). Pre-existing on `develop`, deferred to a
follow-up. The test `does not write a change the validator rejected back into the engine` calls
`updateSettings({})`, which rebuilds the sheet from source data, so it does not cover this leak.

The write-back adds one engine undo entry on top of the resync's own, which is what keeps a later grid undo
of that change consistent: `engine.undo()` then reverts the write-back, not the resync. Without a resync the
listener costs a `WeakMap` get and delete per change set and writes nothing (measured: a 10,000-change
`setDataAtCell()` makes 10,000 `setCellContents` calls either way; with a resync, 20,000 – the first write
plus one write-back).

Older than this repair, and harmless to the grid: WITHOUT a resync, a paste that reaches past the last row
writes the in-bounds changes and the out-of-bounds ones in two engine batches – two entries on the engine's
own undo stack for one grid action. A grid undo does not use that stack, so it restores the engine
correctly; an app that calls `engine.undo()` directly reverts only the out-of-bounds half.

Tests: `__tests__/validatedWriteResync.unit.js`.

## A `sheetName` change applied ahead of its data only binds (DEV-3040)

A `formulas.sheetName` change applied through `updateSettings()` makes `updatePlugin` call
`switchSheet()`, which `loadData()`s the engine sheet's serialized content into the grid. Core's
`_applySettingsAndData()` (the SheetsBar plugin, on every switch, see `../base/AGENTS.md`) loads the
sheet's data itself right after the settings, so while `isDataWorkDeferred()` answers `true`
`updatePlugin` binds the sheet with `#updateSheetNameAndSheetId()` instead, and the load then reaches
`#onAfterLoadData`, which writes the loaded array into the bound sheet. Three rules. A name the engine
does not know is left to the load, which adds a sheet of that name and fills it with the loaded data, as
a plain `updateSettings()` plus `loadData()` does, so it is not an error: going through `switchSheet()`
there logged "The sheet named X does not exist, switch aborted" on the first visit of every sheet a
sheets bar workbook bound to the `HyperFormula` class or to a second engine. Outside such a call a
missing name still goes through `switchSheet()`, which reports it, unless no sheet is bound at all, when
the branch below adds one from the grid's data. The branch that fills a new sheet from the grid's current data when no sheet is
bound is skipped in the same window: the grid still holds the previous data then (at init, no data map
at all), and the load fills the sheet. And a host's own `updateSettings({ formulas: { sheetName } })`
is never deferred, so it keeps relying on `switchSheet()` to fill the grid. Tests, all in
`../sheetsBar/__tests__/sheetsBar.unit.js`: "loads the grid once per switch" pins the single load;
"binds a Formulas sheet name the engine lacks to the sheet the load adds and fills, with no error"
pins the missing-name path; "leaves the Formulas switch load and min padding working after a
switch threw mid-update" pins that a throwing switch leaves the flag down.

**Only a `sheetName` setting that changed asks for another sheet (`#requestedSheetName()`).** The binding
is kept by sheet id and follows an engine rename (`#onEngineSheetRenamed`), while the setting keeps the
name it was written with. Read as a request every time, the old name made a `language` or `maxRows`
update log that the sheet does not exist and bind the grid to any sheet that took the old name since, and
made a `loadData()` add a new sheet under the old name. `#followedSheetNameSetting` holds the setting the
binding last followed; it is updated at the end of `updatePlugin()` outside a pending load, when the
pending branch binds an existing sheet, and in `#onAfterLoadData`. Do not write the new name onto the
table meta instead: a shadow there survived the sheets bar's next switch payload, so the plugin stayed
bound to the renamed sheet and wrote the arriving sheet's data into it. `getSettings().formulas.sheetName`
therefore keeps the old name after a rename. Pinned by "keeps the active sheet bound after its rename,
through settings updates and a data load" in `../sheetsBar/__tests__/formulaSheets.unit.js`.

**A sheets bar switch that sets another engine instance moves the plugin to it (`#followEngineChange()`).**
The engine is set up on enable only, so the plugin kept the first engine while a sheets bar switched to a
sheet bound to a second one: the second sheet's edits landed in a copy of it inside the first engine, and
the second engine's formulas never saw them. The plugin is disabled and enabled again with no sheet
bound, and binds the sheet the settings name in the new engine. **Only an instance that already holds the
sheet `sheetName` names counts**, as every engine the sheets bar binds does. The React examples build
`HyperFormula.buildEmpty()` in the component body and the wrapper forwards `formulas` on every commit, so
following any new instance moved such a grid to an empty engine on every render (and a test of exactly that
ran out of memory). An empty new instance is ignored, as it was before. And only a call whose load is
pending (`isDataLoadPending()`) follows, so a plain `updateSettings()` with another instance keeps the
engine the grid was built with, as before.

**The `afterCellMetaReset` that follows the call's own load resyncs only when a `cell` entry sets a key that decides the value the engine reads (`type`, `valueGetter`, `source`, `sourceLabel`, and `preserveTextValue`, which the engine-bound escaping reads; `VALUE_GETTER_META_KEYS`) or `columns` is a function.** Only the reset of the call's own held meta phase skips (`_isHeldMetaPhaseRunning()`): a full `updateSettings()` an `afterLoadData` listener makes in the same call runs its meta phase outside that window, and its `columns` reached the column meta after the load wrote the sheet, so it resyncs. The sheets bar restates a grid-level `cell` on every switch, so counting any entry made every switch of such a workbook pay the resync, even for an entry that only sets `readOnly`. A custom `valueGetter` that reads another key of a `cell` entry is not seen. Core resets the column meta before that load for `columns: null` (the sheets bar sends it for a sheet without `columns`), so that payload needs no resync. The two `updatePlugin()` branches that bind a sheet for the load (the `sheetName` rebind without `switchSheet()`, and the skipped fill from the current data) ask `isDataLoadPending()`, not `isDataWorkDeferred()`: an enable from an `afterLoadData` listener in that call comes after the load, and waiting for it left `sheetName` `null`.
The load already wrote the sheet with the call's column configuration, so a resync there was a second full
engine write and a second AutoColumnSize sweep per switch (`tests/e2e/sheet-switch-autosize.spec.ts` pins
one). The `cell` entries are applied after the load, though, and a cell type they set can change the value
the engine reads (a key/value dropdown resolves an object to its label), and so are the column types of a
`columns` function (core's early `columns` pass covers the array form only), so such a call resyncs once
(`#metaPhaseMayChangeEngineValues()`, pinned by "feeds Formulas the value a cell type from the `cell`
option resolves on the new data" in `../sheetsBar/__tests__/deferredPluginWork.unit.js`).

**`#hotWasInitializedWithEmptyData` reads the loaded array, not only the `data` setting.** It decides
whether the engine sheet is the grid's data source, and it is set in `beforeLoadData`. Core's first
load can carry a real array before the `data` setting is stored (the sheets bar loads its opening sheet
that way), and a check of the setting alone then marked the grid as empty, so every later settings
update reloaded the grid from the engine sheet. The array check is scoped to that call
(`isDataWorkDeferred()`): a grid built with a `dataProvider` and no `data` loads a `[]` placeholder first
and must keep reading the engine sheet as its data, and a grid built without data loads `null`.

## Sheet names the engine reads only in quotes

HyperFormula's unparser writes a sheet name without quotes whenever it can (`=2026!A1` for a sheet
named `2026`) and then cannot parse that text back, and its parser cannot read a name outside its
unquoted grammar at all (`=Лист2!A1` is `#ERROR!`, while `='Лист2'!A1` works). The same rule runs in
both directions. **On the way in**, `#escapeEngineBoundValue()` quotes a formula before anything else
(cell edits, `setSourceDataAtCell`, the switched-away restore), `#escapeSourceDataArray()` quotes the
formulas of every bulk write before its date and text gate (load, resync, inserted rows), and
`addSheet(name, data)` quotes the rows it feeds; the host's own array is never written by these.
Without it the editor showed `='Лист2'!A1` (the read side below) over an `#ERROR!` the engine held
for the unquoted text. **On the way out**, every formula text that leaves the engine through
this plugin goes through `#readableFormula()` (or `#readableSheet()` for a whole sheet),
which runs `quoteUnreadableSheetNames()` from `../../utils/formulaReferences.ts`: an unquoted name
the engine cannot read is quoted, everything else is left as written. That covers the source-data
read (`modifySourceData`, so the editor opens on `='2026'!A1`), `switchSheet()`, the write-back of
rewritten formulas, the undo snapshot and peer rewrites, fill, copy and cut, show-formulas paint, and
MoveCells. Committing the editor text unchanged used to make the cell `#ERROR!`. Whether a name is
readable is asked of the engine itself (`validateFormula('=<name>!A1')`) and cached per name in
`#unquotedSheetNames`, cleared on enable. A formula with no `!` returns at once, so the hot read
path pays one `includes('!')`. Pinned by `__tests__/sheetNameQuoting.unit.js`.

Two tokenizer rules sit under all of this. **An error literal is never a sheet name**: the scanner
skips `#` up to its `!` or `?`, because `#DIV/0!` reads as the name `0` in front of a `!`, and quoting
it wrote `#DIV/'0'!` into every formula with that literal (into the host data too, after a row insert);
a sheet named `REF` or `Value` would also have had its rename rewrite `#REF!` and `#VALUE!`. **The
engine's own answer counts only for a name made of name characters** (`isUnquotedSheetName()`):
`validateFormula('=Sales-EU!A1')` is `true` because the engine parses it as a subtraction, so a name
with an operator, a space or a quote is always quoted. The bar's `#sheetNameText()` applies that rule;
the read and write paths here only ever see tokenized names, which hold name characters only.

## `sheetName`, `switchSheet()` and the engine instance

**The setting counts as followed only once the binding matches it** (`#followSheetNameSettingWhenBound()`):
a `sheetName` the engine did not hold yet stays a request, so the same setting sent again after the host
added the sheet binds it (recorded at once, the retry did nothing and logged nothing). **The public
`switchSheet()` drops the followed setting**, so the next settings update that reaches the plugin binds
the setting's sheet again, as it did before `#requestedSheetName()` existed. The plugin's own reloads go
through the private `#loadSheet()` and keep it, which is what keeps the rename case (an engine rename the
binding followed, with the setting still on the old name) from asking for the old name. **An engine class
setting over a user instance is an engine change while a load is pending** (`#engineBuiltFromClass`, the
sheets bar's switch): kept on the instance, a sheet that passes the class wrote itself into another sheet's
engine. Pinned by `__tests__/sheetNameSetting.unit.js`
and the engine binding cases of `../sheetsBar/__tests__/formulaSheets.unit.js`.

**A sheet the engine refuses still gets the sync endpoint** (`#clearRejectedSheet()` calls
`setupSyncEndpoint()`): left on the sheet bound before, a sort of the refused sheet reordered that other
sheet's formula cells.

## The engine order of a sheet the grid leaves and loads again (`runWithEngineOrderHeld()`)

Every order the axis syncer hands the engine (`setRowOrder`, `setColumnOrder`) moves the formula cells,
and their text with them, so a sheet's formula text in the engine depends on how its order was reached
(see Undo/redo above, and "Sorting does not remap formula addresses" below). A caller that replaces the grid's data and puts the same order back
(the sheets bar, on a switch) therefore cannot load the data and sort it again. Two `@private` methods,
reached through the typed `getPlugin('formulas')`:

- `exportEngineOrder()` returns the bound sheet's engine order (`getEngineOrder()` of both syncers) when
  it is not physical on either axis, or `null`.
- `runWithEngineOrderHeld(run, adopt)` runs `run` with both syncers held (`AxisSyncer#setOrderHeld()`):
  an `'update'` order change is not sent, and the translation reads the engine's own order
  (`#getHeldEngineSequence()`) instead of the grid's sequence, so a read in between finds its cell. A
  syncer an enable creates inside the call starts held. When the call ends, the grid's order is sent
  once (unless the plugin was turned off in between). With `adopt` given, a load inside the call that
  binds that engine sheet takes it over (`#adoptEngineSheet()`): it writes nothing, sets up the sync
  endpoint and adopts the stored order, and the meta-phase resync of that call is skipped, since the
  engine sheet already holds what the `cell` entries decided. Only the first such load takes it over
  (`adopted`): a listener that loads other data in the same call gets an ordinary write.

**A move inside the hold is an order change like a sort once an engine order was adopted in it.**
`calculateAndSyncMoves()` sends nothing and a `'move'` sequence change leaves the stored order alone; the
release sends the order the grid ends on. A sheet with an array `manualRowMove` re-applies its moves in
`afterLoadData`, after this plugin adopted the engine order, and the move sent then was computed against
the held order and asked the engine for a row number past its sheet (`Invalid arguments …`, rows
scrambled). Without an adopted order (a first visit) the move reaches the engine through `moveRows`, as
on a plain grid's `loadData()`: held there, the release sent the order with `setRowOrder`, which turns
references into `#REF!` (`=A2*10` on a `[2, 3, 4, 0, 1]` order) where `moveRows` keeps them. The flag is
`AxisSyncer#adoptedWhileHeld`, set by `adoptEngineOrder()` during a hold and cleared when a hold starts or
ends (pinned in `../sheetsBar/__tests__/formulaSheets.unit.js` against a plain grid's `loadData()`).
The release clears the column axis even when sending the row order throws (`IndexSyncer#setOrderHeld()`).
`#getHeldEngineSequence()` reads the
stored order, then the order an empty sheet was filled in (`#fillSequence`), then the ascending tail,
the order `#getEngineElements()` reads. **Rows or columns inserted or removed inside the hold are not
supported**: the engine changes positionally through the held order, which the stored sequence then no
longer describes. Nothing in the sheets bar's switch does it. Pinned by
`__tests__/indexSyncer/axisSyncerHeldOrder.unit.js`.

The caller decides when the data is still the one the engine holds; the sheets bar compares the array
object and its length. `isHfOrderPhysical()` answers for the engine's order while held, so
`#syncFormulasToSourceData()` never writes engine text into data the engine holds in another order.

## Object rows: the sheet is only as wide and as aligned as `getSourceDataArray()` makes it

For array-of-objects data the sheet is built from `getSourceDataArray()`, which `DataSource#getAtRow`
assembles one visual column at a time. Two defects of that read broke every fill, paste and formula that
addressed a column through the engine (GitHub #13852), and both are invisible in a grid without
Formulas, because the grid reads cells through `getDataAtCell()`:

- **The loop used to stop at the number of keys in the first row.** `columns` can declare far more
  columns than a row has keys (`data: 'list.7'` reads one key each), so the array was shorter than the
  grid and the engine sheet ended where the keys did. Everything past it read `null` in a fill.
- **A column declared without `data` had no slot.** `colToProp()` answers its own index for such a
  column, and the old integer test took that for "an index that names no column". Every later column
  then sat one place to the left of its visual index, so the engine read the neighbor's value. It stays
  hidden while the shifted values happen to be equal, which is why the report said the fill worked
  "before Jan 2025": every value there was 0.

A declared column keeps its slot (`undefined` when nothing binds it), the same as a `{ data: null }`
column. The test for "names no column" is `toPhysicalColumn()`, not the integer prop, and "declared"
means a place in the `columns` array below `maxCols`: a column `maxCols` cuts off has no slot. (`minCols`
and `minSpareCols` build no column while `columns` is set, so they never reach this read.) The slots follow
the VISUAL column order, so a moved column takes its moved place. The loop's end is counted from that array, not from `countCachedColumns()`,
because the property cache only reaches the last column that has a `data` option, so a trailing
`Total` column would fall off the sheet. A `columns` function has no length to read, so a trailing
column without `data` still drops out there. Do not work
around either defect inside this plugin with a `getDataAtCell()` loop, because that would bypass the
`modifySourceData` hook and the value getters the sheet relies on.
Pinned by `src/__tests__/core/core.unit.js` and `tests/e2e/formulas-object-columns.spec.ts`.

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

These rules ride along.

- **The order must be a permutation of `0..size - 1`.** The engine validates entries as well as length, so an
  index the sequence no longer covers (the mid-batch state that used to produce `-1`) is ranked last rather
  than passed through, which the engine would reject as "not a permutation".
- **`#indexesSequence` names the elements the engine holds, in the engine's own order** — not the grid's
  sequence. The two are the same only while the sheet covers the whole grid. Once it does not, storing the
  grid's sequence would name elements the engine never received, and every later order, being relative to
  what the engine holds, would move the wrong rows or columns for the rest of the session. The exception is
  the paths where the engine changes itself: an insert, a removal and a move all leave it holding the
  grid's new sequence, so the stored order follows it there. An undo is not one of them anymore - it
  restores the grid's order, which reaches the engine as an ordinary order change.
- **How the sheet was filled decides where its new rows go.** A sheet fed its content (at load, or by the
  engine's own insert) holds it in physical order; a sheet that reported `0x0` is filled through addresses
  the grid computes from its own sequence, so its first row is whichever row the grid showed first **at the
  moment it was filled**. That sequence is captured when the empty sheet is found and used to extend the
  stored list, because the grid can have been reordered since — reading the current sequence there would
  conclude the engine already holds the new order and skip the sync that carries it.
- **The engine holds the grid's order up to the last element with content.** Translation reads HF index `i`
  as sequence position `i`, so every index the engine holds sits where the grid shows it. The compression
  keeps the engine's own elements in their relative order. The extra rows or columns of a sheet shorter
  than the grid are an empty tail the engine left out, and one behind the last element with content needs
  no row. One in front of it does, so the sheet is extended to the last index with content and the order
  covers the empty ones. The engine ends a sheet at its content and `addRows`/`addColumns` past it do not
  extend it, so the extension writes the last needed cell and clears it. That write and the order go in one
  `engine.batch()`: one change list, which shows the cleared cell as a `null` change, and one undo step.
  An order that would change nothing is skipped, because the engine records an undo entry and clears its
  redo stack for every order it is handed.
- **A padded blank is not content, and its label does not matter.** The sync remembers the elements it
  added only to carry an order (`#paddedElements`). While such a line is still empty in the engine, the
  next sync relabels it for what that order needs: `#planOrder()` walks back from the end of the target
  sequence, frees the padded blanks it meets there, and stops at the first element with content. Counting
  them as content made a blank moved to the top and back grow the sheet to the grid's full length (20,000
  rows measured: height 20,000 and 691 ms for the second `setIndexesSequence()`, against height 10 and
  5 ms before the pad existed), and every later sort then sent a full-length order. The set travels with
  the order: `EngineOrder.paddedElements` carries it through an undo, a redo and a sheet switch
  (`adoptEngineOrder()` drops entries the restored sequence does not hold), and an insert or a removal
  re-keys it by the physical indexes the mapper reports (`indexesInserted`/`indexesRemoved` local hooks,
  renumbered with the mapper's own `getIncreasedIndexes`/`getDecreasedIndexes`). An inserted line joins
  the set (it is an empty engine line; an insert at visual 0 above the padded blank grew the sheet to the
  grid's length otherwise), and a removed index is **not** dropped: an undo removes the grid's row but
  leaves the engine line, so the line carrying that label is still there, still empty, and dropping it made
  the next order count it as content and pad the sheet by one line per insert-and-undo. A stale entry
  only ever sits on an empty line, which the plan frees anyway. Any other change that is not a move clears
  it. Pinned in `paddedElementsTravel.unit.js` (2,000 rows: height 11 after each).
- **An order that moves a line an array formula spans is refused before anything is written.** The engine
  throws `SourceLocationHasArrayError` for it, and the padding write precedes the order, so a throw left the
  sheet one line taller. `#isOrderAllowed()` asks the engine first (`isItPossibleToSetRowOrder` /
  `isItPossibleToSetColumnOrder`) and `#syncOrderWithEngine()` warns and returns `false`, as for `maxRows`.
  The engine checks the lines the order moves and ignores where they go, and the lines added to carry the
  order hold nothing, so the check asks about a rotation of the moved lines the sheet already has. A single
  moved line has nothing to rotate with and is read cell by cell with `isCellPartOfArray()`.
- **Rows or columns the engine gains later are labelled by the sequence the grid had at the last sync.**
  A sync stores that sequence in `#fillSequence` unless the engine's own lines already sit where physical
  order puts them. The grid writes a new row at its sequence position, so labelling it by physical order
  put a value typed into it on a different row after the next order. An insert, a removal and a move store
  the grid's whole new sequence as the engine's order, which already names every line the engine can gain,
  so they reset `#fillSequence`; left set, `isEngineOrderPhysical()` stayed `false` after the order came
  back to identity.
- **A sync leaves the host's own engine batch alone.** `engine.batch()` resumes the evaluation
  unconditionally, so inside a batch of the host's, or after its `suspendEvaluation()`, it throws "Batch
  mode wasn't started" or ends the suspension early. The extension calls the three engine methods
  directly when `engine.isEvaluationSuspended()` is true. Pinned in `shortSheetOrderSync.unit.js`.
- **A reorder that moves a formula across the cell it refers to can turn the reference into `#REF!`.**
  That is the engine's own `setRowOrder`/`setColumnOrder`, measured on a plain engine with no extension
  involved. A full reverse of a sheet whose formula refers to a cell in another column is an example.

Still open: a move applied while the engine's sheet is empty reaches the engine through `syncMoves` but is
not reflected in the stored order. A sheet that the order would extend past the engine's `maxRows` or
`maxColumns` is not extended: the sync warns, the engine keeps its order, and the stored order stays what
the engine holds. The grid has already taken its order, so formulas read the wrong cells until the grid
takes an order the engine can hold.

Known limits of the pad:

- **The pad keeps the sheet's height or width.** The engine never shrinks a sheet, so once content has
  sat at the end of a long axis the sheet stays that long, and every later order is sent at that length.
  Moving only blank lines does not grow it, also after an undo, a sheet switch, an insert, or a removal.
  The one exception is the restore of an undo or a redo that changed the rows or columns: it trims the
  unused tail (see "A restore trims the lines the reload left behind").
- **A reference to a padded blank line follows the engine line, not the label.** Padded blanks are
  relabeled, so a formula that refers to one reads `#REF!` once the blank is freed or moved across
  content. That is the engine's own rewrite in `setRowOrder`/`setColumnOrder`, the same as for any
  reference moved across content.

### A reload reads a jagged array, and the first row sets the column count (DEV-1143)

`getSheetSerialized()` trims the trailing empty cells of **each row on its own**, so a sheet whose first row
ends in an emptied cell comes back jagged while `getSheetDimensions()` still reports the full width. The core
takes an array-of-arrays dataset's column count from its **first row**, so loading that array drops the last
column although the engine holds its data. `switchSheet()` is the one place the grid is loaded FROM the sheet,
and a grid built without `data` takes it on every `updateSettings()` (`#onAfterCellMetaReset`, the
`#hotWasInitializedWithEmptyData` branch), which is what a React or Vue re-render triggers. So
`switchSheet()` pads the serialized rows to the widest one (`padRowsToWidestRow()`, `null` for
the gaps) before `loadData()`. Pad **after** the unescape step, not before: the gaps are not engine values and
need no unescaping.

The padding applies to every `switchSheet()`, so a switch to a sheet with uneven rows now loads as wide as
its widest row (it used to load as wide as its first).

Three limits are deliberate.

- **The width is the widest row, not `getSheetDimensions()` and not the grid's current width.**
  `getSheetDimensions()` never shrinks (a sheet replaced by a 2x3 one still reports the old 15x5), so it cannot
  say how wide the content is. Taking the widest row keeps a sheet that an application replaces with a smaller
  one shrinking the grid on the next reload.
- **A column or row emptied in every cell still drops on a reload.** `getSheetDimensions()` keeps reporting the
  old size, but `getSheetSerialized()` omits a trailing column or row that is empty throughout, and the grid
  has no record that it was ever there. Padding to the dimensions would fix that and is not an option for the
  reason above.
- **A grid whose settings cap the column count is not padded (`#isColumnCountCappedBySettings()`).** That is
  a finite `maxCols` below the padded width, an array `columns`, a `dataSchema`, or a `columns` function that
  returns a falsy value for any of the first
  `width` columns (the core counts an array-of-arrays dataset under a function by keeping the columns it
  returns a truthy value for, so a function that accepts all of them leaves the count to the data). Under a
  cap the settings decide `countCols()`, so padding only raises `countSourceCols()` past it. That flips
  `#areSourceColumnsSkipped()`, and the next resync writes just the visible columns back into the sheet,
  deleting engine data (a sheet of `[['a', 'b'], ['c', 'd', 'e', 'f', 'g']]` came back as three columns under
  a three-entry `columns` array). The same hazard already exists for a rectangular sheet wider than the cap;
  it is untouched here. Decide by the predicate, not by the option's type: skipping the padding for every
  function brought the original bug back for a function that accepts all columns, and padding for every
  function deleted data for one that hides some. The check calls the user's `columns` function once per
  column of the widest row on each `switchSheet()`.

Pinned by `__tests__/sheetReloadDimensions.unit.js` and `tests/e2e/formulas-sheet-reload.spec.ts`.

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

## `beforeAutofill`: `orderIndex`, then registration order, decides who wins (DEV-3424)

`#onBeforeAutofill` is added in `enablePlugin()` at the default `orderIndex` 0. At init that call comes from
`afterPluginsInitialized` (`BasePlugin.init()` registers it with `addHookOnce`), which the last plugin's `init()`
fires inside `beforeInit`, before `updateSettings()` registers the `beforeAutofill` option. The last callback that
returns a value wins, so the option and any `addHook()` made after enabling beat the plugin, while a global hook,
an `addHook()` made before enabling, and the option when Formulas is enabled later lose. `updatePlugin()` keeps
the hook where it is, but `disablePlugin()` plus `enablePlugin()` re-adds it at the END of the `orderIndex` 0
group and flips the winner. Only `addHook('beforeAutofill', cb, 1)` is independent of timing. Pinned by
`tests/e2e/formulas-before-autofill-precedence.spec.ts`. Do not change the plugin's `orderIndex` or its
registration point without treating it as a behavior change.

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

## External engine changes

`valuesUpdated` is engine-wide. `#onEngineValuesUpdated` paints this grid once when the change list names this instance's sheet. It does not copy the engine value into source data, and it does not validate. An engine write the host makes paints at once, once per write: `engine.batch()` emits after its callback, so several writes in one `batch()` paint once. A paint never runs later than the write that caused it. A throw from `hot.render()` there (a user hook inside the engine's emit) is caught and reported with `warn`, so the engine call, the other grids and the listeners after this one run.

A plugin write runs inside `withPluginEngineWrite` (`indexSyncer/pluginEngineWrite.ts`), a per-engine scope. While one is open, the listener only hands its grid's paint to the scope. When the outermost scope on that engine ends, in a `finally`, each such grid paints once. A paint that throws does not stop the others, and the first error is rethrown to the caller after all have run (unless the write itself threw), as a dependent grid's render error reached the caller on develop. The scope is dropped before the paints run, so an engine write a paint's `afterRender` makes is an external write. HyperFormula emits inside `batch()` before `batch()` returns, so the scope wraps the `batch()` call, not a `setCellContents` nested in it. The grid that made the write is left out through `#writeOwnSheet()`, because the Core or the caller paints it. Plain `withPluginEngineWrite` is used where this grid must paint too (the out-of-bounds `afterChange` write, the `restored` undo write, the public `addSheet`). The axis syncer reaches `#writeOwnSheet()` through `IndexSyncer#getOwnEngineWrite()` for the two writes that emit: `batch` in `syncMoves`, and the order write in `#syncOrderWithEngine()`. The latter is one scope around the whole write, so the pad (`setCellContents` twice, then `setRowOrder` / `setColumnOrder`, see "The engine's sheet size" below) paints a dependent grid once, not once per engine call. `#isOrderAllowed()` only reads, and stays outside it. Pinned by the `a padded sheet, with a second grid that reads it` cases of `__tests__/externalEngineRender.unit.js`: a sequence or a sort that pads the sheet paints the dependent grid once and the editing grid not at all or once (its own sort render), where an unscoped write painted the editing grid one extra time. The SheetsBar plugin calls `Formulas#runEngineWrite` for its own engine calls, so a standalone grid on the engine paints whether or not the bar's grid has Formulas bound to it. A missing engine (a listener disabled the plugin mid-flow) runs `fn` with no scope, as develop did: `withPluginEngineWrite()` takes `null`, so a call site passes `this.engine` without `!`. A repaint that throws at the end of `addSheet` does not undo the registration: `#addSheet()` returns the name the engine took and the paint errors apart, `enablePlugin()` and `updatePlugin()` bind the sheet first and throw the first paint error at the end of the call, and the public `addSheet()` throws it after the sheet is in. Reading the error as "no sheet" left the grid unbound, and the next sync added a second sheet. A new plugin write needs a scope, or the listener paints it once per emit.

A grid whose data is written into its sheet registers it inside one `#writeOwnSheet()`: `addSheet` re-resolves a formula in another grid that named the sheet first (`#REF!` becomes the cell's value, or empty), and the fill follows. On the `updateSettings` path the fill comes later, from `#resyncSheet()` at the first render, so the registration scope calls `holdPluginEngineWritePaints()` and the grids it named paint when the resync scope ends, once, after the data is in. A grid whose fill never comes (a throw before the resync) keeps its stale paint until the next plugin write on that engine. A grid built from the sheet (`#hotWasInitializedWithEmptyData`) writes nothing and registers unscoped. `updateConfig` is not wrapped: it does not emit `valuesUpdated`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='formulas'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='formulas'`

`__tests__/` is unusually broad: `hfApi`, `initialization`, `validation`, `publicAPI`, `hooks`,
`featureIntegration`, `memoryLeak`, `redoState`, `indexSyncer/`, `plugins/`. A change here almost always
needs more than `formulas.spec.js`, and `memoryLeak.spec.js` is the one people forget.

## `HYPERLINK` cells and `renderMode: 'onChange'`

A `HYPERLINK` whose URL argument lives in another cell keeps its label when that cell changes, so the engine exports no value change for it and an incremental render would keep the stale `href`. `#onAfterRenderer` records every cell it wrapped in `#hyperlinkCells` (physical coordinates) and `#onEngineValuesUpdated` calls `hot.markCellChanged()` for each of them, so any engine update rebuilds the anchors on the next render. A cell that BECOMES a `HYPERLINK` while keeping the label it already showed is not in the set yet and changes nothing the paint compares, so `#onEngineValuesUpdated` also walks the engine's change list and marks every updated cell whose `#getHyperlinkHref` is non-null (`#markCellsThatBecameHyperlinks`). `markCellChanged()` touches stored meta only, so a recorded cell that scrolled out and was evicted costs nothing. The set is cleared in `disablePlugin`, at the top of `#onAfterLoadData`, and in the four create/remove row/column handlers: physical keys drift after a removal, and every one of those paths repaints all rendered cells, which re-registers them. Plain dependents need nothing: the render compares the formatted value, which HyperFormula already changed.

## Unfreezing: the target comes from the hook

`beforeColumnUnfreeze` stores the move from its third argument, `finalIndex`, which ManualColumnFreeze resolves
before the move. Do not derive it from `fixedColumnsStart`: with `restoreColumnPosition` the column does not land
at the freeze line, and an engine told otherwise reads and writes the wrong columns from then on, with no error
(`__tests__/manualColumnFreezeRestore.unit.js`; assert right after the unfreeze, because an undo resyncs the whole
order and hides it).

## Frozen end columns need nothing here

The freeze hooks (`beforeColumnFreeze` and friends) belong to `ManualColumnFreeze`, which only moves the start
freeze line. `ManualColumnFreeze` does not freeze or move columns that are in the end band, and
`ManualColumnMove` refuses a move across the end line, so the engine never sees a column leave or enter the
band. `fixedColumnsEnd` and the spare or minimum columns: `core.ts` (`adjustRowsAndCols`) creates no
`minSpareCols` or `minCols` column while `fixedColumnsEnd` is set, because a column appended after the last one
would take over the frozen position. So no spare column ever lands inside the band and the plugin has nothing
to work around. (`fixedRowsBottom` with `minSpareRows` still has the cosmetic quirk, which is not worked around.)
