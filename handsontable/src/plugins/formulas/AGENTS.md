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

> **`Formulas#validateDependentCells` translates before it reads (DEV-4027).** HF is fed trimmed rows and
> columns too, so with `trimRows` or Filters active an HF address is the visual one plus the trimmed lines
> before it. The method resolves each dependent's grid from the engine registry and translates through **that
> grid's own** Formulas plugin (`boundHot.getPlugin('formulas').rowAxisSyncer` / `columnAxisSyncer`), never
> `this.*AxisSyncer`: the syncers describe one sheet, and a dependent on another sheet lives in another grid
> with its own trims. An address with no visual position (`-1`, a trimmed line) is skipped, and the bounds are
> the bound grid's, not `this.hot`'s. A new reader of an engine address must do the same.
> The axis syncer's translation cache is also dropped when the mapper reports `indexesSequenceChanged`, not
> only `trimmedIndexesChanged`: inside a suspended execution a sort fires the sequence hook long before the
> mapper rebuilds its not-trimmed cache, so a table built in that window held the previous visual order and
> the dependent of a write after a sort in the same `batch()` was validated one row off
> (`batchEvaluation.unit.js`, "validates the row that holds the write after a sort inside the batch").
> Pinned by `__tests__/validateDependentCellsTrimmedRows.unit.js`.

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
brings the engine in line with the restored grid. It never calls `engine.undo()` or `engine.redo()` to
follow the grid's history: the grid's stack holds steps the engine never saw (hiding, resizing, a sort in
another grid on the same engine), so two stacks cannot be kept in step. HyperFormula still records its own
undo entries for every call this plugin makes, and nothing reads them. The one `engine.undo()` it makes
takes back its own validation probe in the same task (see "A change the Core can reject reaches the engine
only when the Core applies it"); it never reaches an entry of the grid's or the host's.

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
- **`captureState()` returns two versions, the stale bit and, while the order is not physical or the
  source data is stale, the engine's sheet.**
  `structureVersion` changes on every row or column insert, removal, move, **and every sequence
  change** (a sort included) and on a NestedRows detach; `dataVersion` on every cell write. UndoRedo
  calls `restoreState(state)` whenever a step changed either of them. When the structure version
  differs from the one the engine holds, the sheet is replaced and the held writes are dropped:
  - **In physical order, with the source data in step with the engine,** the source data is
    authoritative: `#loadSourceDataIntoSheet()`, the same path a data load takes. The write-back of
    engine-rewritten formulas (`#syncFormulasToSourceData`) runs inside the forward operation, so the
    journal holds it and the undo reverses it.
  - **A structural change made out of physical order leaves the source data stale, and the order
    returning to physical does not fix it.** The write-back is skipped while the order is not physical,
    so the source keeps the text the engine has since rewritten (an insert at visual 1 shifts every
    formula below it), and `#sourceHasStaleFormulas` records it. The next structural step in physical
    order writes the engine's text into the source and journals the stale text as its "before" value, so
    a state captured before that step must carry the engine's sheet: its undo reloaded the stale source
    otherwise, and the formulas ended up pointing at the wrong rows (DEV-3624). Rules for the flag:
    the skipped write-back sets it only when the engine holds a formula (`getSheetFormulas()`), because
    only a formula can have been rewritten; a sheet of plain values would otherwise serialize on every
    step until the next structural one (50x2 grid, reverse, insert, restore, 5 edits: 6 `getSheetSerialized`
    calls, 0 now);
    the state records it as its own field (`sourceHasStaleFormulas`, true only for a state that carries an
    engine sheet), and a restore sets the flag from that field, so a state captured while merely sorted
    reads false; a full sheet write from the source (`#writeSheet()`) clears it; a full write-back in
    physical order clears it only when it skipped no cell. A skipped cell is a `#REF!` the engine holds
    that an insert must not persist (`#readSourceChange()` returns `'skipped'`), or a formula in a column
    trimmed after the sheet was built (no visual column, so no prop to write to) whose text differs from
    the source's; the same text there is not stale and does not count. That column is read from the
    source by the property `columns` gives its physical index (`#isUnreachableCellStale()`), not by the
    engine's index: with a `columns` setting that skips a source column the two differ, and a match
    against the skipped column's cell cleared the flag over text the engine had rewritten. Clearing over a skipped cell left
    stale text with no engine sheet to restore. A cell edit and a partial (`cells`) write-back never
    clear it. **A skipped cell does not set the flag**: only a write-back out of physical order does, so a
    stale cell in a trimmed column of a grid that never left physical order is not recorded (open).
    Pinned by `__tests__/reorderedInsertUndo.unit.js`.
  - **A step that clears the flag is undone by loading the recorded sheet, not by writing cells.** A
    full write-back inside a data-only step (a `moveCells` move after the order returned) writes the
    engine's text into the source and journals the stale text as its "before" value. The same-structure
    restore would write that text into the engine, so `restoreState()` takes the structural branch when
    the restored state is stale and the grid's flag is not. That branch also trims the sheet's unused
    tail, which a plain data-only restore never does.
  - **Out of physical order** the source data cannot rebuild the engine: the write-back is skipped
    there, and the engine's references depend on HOW the order was reached. `engine.moveRows` keeps
    every reference on its data, while `engine.setRowOrder` - what the axis syncer sends for a sort
    or a restored sequence - turns some of them into `#REF!` (measured: `setRowOrder([2, 3, 4, 0, 1])`
    on a fresh sheet writes `=#REF!+1000` where the equivalent `moveRows` writes `=A5+1000`). So the
    state carries `engine.getSheetSerialized()` plus both syncers' `getEngineOrder()`, and the restore
    loads it with `setSheetContent()` and `adoptEngineOrder()`. Never "simplify" this into
    reload-then-reorder; that reproduces the `#REF!`. The snapshot's order is the grid's order at capture
    time, and the grid can have been reordered since (a `setIndexesSequence()` call is no undo step). So
    `adoptEngineOrder()` takes the recorded order over and then sends the grid's current order, unless the
    order is held: the engine ends in the grid's order, as if the reorder had come after the load. Taking
    the recorded order as final left the engine and the translation tables on different orders, and the
    undo of an edit then showed another row's values (`undoStaleOrder.unit.js`).

  With the same structure version, the held writes are written into the engine in one
  `engine.batch()`. The sheet snapshot is re-serialized on every step that writes data while the
  grid is sorted or moved, or while `#sourceHasStaleFormulas` is set - an O(cells) cost per step on
  those grids only, not measured. The flag stays set in physical order until the next full write-back
  that skips no cell, the next full sheet write, or the restore of a state that is not stale, so a grid
  reordered once and then restructured can pay the snapshot on every step after that.
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

**`getStateColumns()` answers `[]` when the two sides share the `structureVersion` and the
`sourceHasStaleFormulas` bit**, whatever order the grid is in: that restore writes the cells by prop and
never reads a recorded sheet, so the step names no column. Any step that reloads the sheet or loads a
serialized one restores a column layout, so it is dropped by a `columns` update that changes a column's
field (`../undoRedo/AGENTS.md`, "The epoch"). Do not key it on `engineSheet === null`: a state captured
while sorted or stale carries one, and the restore ignores it unless the structure or the stale bit
differs, so the step was dropped for nothing.

**That only holds because `restoreState()` compares the state with the OTHER side of the step**
(`context.other`), never with the grid's current `structureVersion` and flag. A `columns` update rewrites
the whole sheet outside any step, bumps the version and clears the flag, so a comparison against the grid
sent a step recorded while stale (both sides stale) down the reload branch, which loads the recorded sheet
with the previous column layout: column B kept reading the old `c` values after column C showed `d`. Without
a `context.other` the restore falls back to the grid's current values. Pinned by `should undo a step
recorded while stale against the columns a later update installed` in `__tests__/reorderedInsertUndo.unit.js`
(it uses an insert that leaves the source formulas right, so the values it asserts are not the open
stale-source defect above).

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

**A reload that changes no data writes nothing (DEV-3972).** A grid built with `data` resyncs its sheet from the
source data on every `updateSettings()` (`#resyncSheet()`, every React or Vue re-render). Writing it feeds the
content in physical order and then replays the grid's order, and no replay ends where the user's own moves left the
engine: the references other sheets and named expressions hold into the sheet already followed each drag and a
replay moves them again on every re-render; a range on the sheet ends on other cells when the replay takes another
path than the drags (`=SUM(A1:A3)` became `=SUM(A5:A5)`). So `#writeSheet(array, true)`, the resync's write, skips
the write and the replay when the escaped array reads the same as `#syncedContent`:
- **`#syncedContent`** is the escaped array the last full write fed the engine, in physical row order, kept in step
  with the grid's own writes: a cell write (`syncChangeWithEngine()`, `#writeSourceChangesToEngine()`, the
  write-back of rewritten formulas) records the value the ENGINE got at the cell's place in the array
  (`#recordSyncedCell()`), so a value a validator later rejects reads as a change and is written; an undo or redo
  that only writes cells writes each one through the same path, so it keeps the record (an edit and its undo were
  a full write and a replay of the order by the planned path, which moved a `SUM` range off its rows); a row insert
  or removal follows it by physical index (an empty row reads as `null`s, so a `minSpareRows` row matches; the rows
  go in with a loop, `insertEmptyRows()`, because a spread into `splice()` overflows the stack on a large insert,
  and a removal compacts the array in one pass, because a splice per row or per span is quadratic on a large or
  scattered removal: 50,000 of 100,000 rows took about 5.1 s per row, and per span for every other row 147 ms to
  2.6 s (large run-to-run noise), 3 ms in one pass); a column insert or removal, a `moveCells` move, a NestedRows
  detach (and any row change while NestedRows is on), an undo or redo restore that reloads the sheet, an adopted
  or loaded engine sheet, a rejected sheet, a sheet built from the engine, a column move on object rows or a projected `columns` list (read in visual order),
  and a reset of the grid's order (`IndexSyncer#onOrderReset()`, below) drop it, and the next resync writes in
  full. The array's column space, and for a projected `columns` list the place of each visual column, is
  read once when it is written (`#readSyncedColumnSpace()`), because a write can run inside an engine batch, where
  a read through the data hooks throws, and so a recorded cell is a lookup.
- **Equal is not enough**: the engine and the sheet id must be the recorded ones, and both axis syncers must hold
  the grid's order (`AxisSyncer#holdsGridOrder()`: not held, and the engine's order as the syncer knows it is the
  grid's sequence), so a load that reset the grid's order still writes. A reset no engine call follows (a
  `columns` update without `data` runs `initIndexMappers()`, a sequence change with the `init` source) makes the
  axis syncer store the reset order as the engine's, so `holdsGridOrder()` cannot see it: the syncer reports it
  (`IndexSyncer#onOrderReset()`) and the record is dropped. Skipped, the engine kept the dragged rows while the
  grid showed them in physical order, and every row read another row's values. A reset to the order the engine
  already holds (physical, as on a grid never dragged) reports nothing: Vue sends `columns` without `data` on every
  column change, and dropping the record there wrote the sheet in full each time where the base wrote nothing.
- **Cells compare with `Object.is()`, a `Date` by its time, any other object as changed** (`areSyncedValuesEqual()`).
  `!==` kept a sheet holding `NaN` from ever skipping, and took a `Date` the host changed in place
  (`setFullYear()`) for the same value, since the record held the same object. The record keeps a copy of each
  `Date` it is fed (`toSyncedValue()`).
- **An order sent as one order drops the record** (`IndexSyncer#onOrderSent()`, called by the axis syncer after
  every `setRowOrder()`/`setColumnOrder()`: a sort, a cleared sort, `setIndexesSequence()`, an order the move
  guards or the cost choice sent as one, a hold's release). Such an order keeps each moved formula's relative
  offsets (DEV-917), so the engine's text stops following the data, and only a write of the data repairs it once
  the order is gone. Skipping it made the damage permanent: sort, re-render, `clearSort()`, re-render showed
  `#REF!` where develop showed the value, and `getSourceData()` returned the engine's `=#REF!+A4`. The next resync
  therefore writes in full and replays the order as develop does; a write inside it that sends an order (a sorted
  grid's replay) records the content after it, because a second write of the same data and order would reproduce
  the same engine. So a sorted grid pays one full write per sort change and skips after that, and a cleared sort is
  repaired on the next re-render. Pinned by the `a re-render after a sort is cleared` cases (ColumnSorting,
  MultiColumnSorting, an edit between) in `__tests__/loadOrderAsMoves.unit.js`.
- **What still writes:** a value the host changed in place (`data[0][0] = 50; updateSettings({})`), a row count or
  layout change (DEV-2978, NestedRows toggled), a meta change that changes what the engine reads (a cell type, a
  `valueGetter`, the date and preserved-text escaping, since the comparison runs on the escaped array). A skipped
  resync still records the layout (`#recordSyncedLayout()`), bumps no `#sheetWriteCount` (the engine still holds
  every in-flight change) and leaves `#sourceHasStaleFormulas` as it was (the engine still holds the rewritten
  text). The scan itself stays: a resync reads and escapes the source as before, and only the `setSheetContent()`
  and the order replay are saved.
- **Cost:** a second array of the grid's size is kept (arrays of pointers, the values shared: 4.4 MB for a 200,000-cell
  sheet whose grid and engine took 481 MB in Jest), and every resync compares it cell by cell (the strict check comes
  first: a type tag read per cell took the comparison of 10,000 x 50 from 3 ms to 44 ms). It is kept from
  the first write, not from the first resync: started on the first resync, the first re-render after two or more
  drags would write in full and replay the order by the planned path, so a range can land on other rows (the
  reviewer's two-drag data: `SUM` rows 46 and 38 became 12 and 4; `moveRows([0], 4)` then `moveRows([0], 2)` took
  `=SUM(A1:A3)` from 4 to 2). One drag still replays to the same place, and the other-sheet and named-expression
  references stay right on that path, because a reload with them sends one order. Pinned by the `after two drags on
  the first re-render` cases.
- **Known limits:** a host that writes into the grid's engine sheet directly (`engine.setCellContents()`) is not
  overwritten by a re-render that leaves the data unchanged: develop's resync replaced it with the source data on
  the wrapper path (vanilla JavaScript kept it until some rewrite there too). A host that mutates in place a cell
  of a row the grid then writes is still seen (cell-precise records). An object-rows grid whose columns were moved,
  and a grid after an undo or a redo that changed its rows or columns (or the stale bit), write in full on the next
  re-render.

**A reload that does write takes an order reached by moves as moves.** Every full write (init, a resync whose data
changed, a sheet switch) feeds the engine its content in physical order and then runs `setupSyncEndpoint()`, which
sends the grid's current order (`#syncInitialOrder()`). The engine call decides what the formulas read afterwards:
`moveRows`/`moveColumns` keep every reference on its cell, while `setRowOrder`/`setColumnOrder` keep each moved
formula's relative offsets, so a reference across the moved lines becomes `#REF!` or reads a line past the data.
Sent as one order, a `manualRowMove: [2, 3, 4, 0, 1]` array showed `#REF!` at init, and `manualColumnMove: [0, 2,
1, 3]` turned `=A1+10` into `=B1+10` at init while a `loadData()` with the same array kept it (the move path). The
rules:
- **The kind of order follows how the grid reached it.** `#orderShifts` records what the engine took as an order (a
  sort, `setIndexesSequence()`); a move, an insert and a removal leave nothing there. `#applyInitialOrder()` reads
  `#orderShifts.size === 0` BEFORE it resets the stored order. A syncer built after a sort has no shifts, so the
  grid answers too: `IndexSyncer#isOrderSorted()` asks ColumnSorting and MultiColumnSorting (through
  `hot.getPlugin()`, `#isRowOrderSorted()` in the plugin), and a sorted row order goes as one order. A postponed
  `#applyInitialOrder()` carries the kind read when it was postponed, because by then the shifts are reset. So a
  reload reproduces what the grid showed only for an order reached by drags alone, or by drags and then orders: an
  insert or a removal after a drag leaves no shifts either, and the planned moves then take another path than the
  drags (`moveRow(4, 0)`, `alter('insert_row_above', 2, 1)`, a data-changing reload turned column B from `[30, 20,
  -, 40, 10, 50]` into `[20, 0, -, 30, 10, 40]`; develop's one order is wrong there too).
- **An order sent on top of moves is replayed the way the grid reached it** (`#orderBase`). When the first order
  since the engine's order was last physical is sent, the axis syncer records the order the moves had reached, and
  a reload sends the moves to it as moves (when they can go as moves) and only the rest as one order. A
  `manualRowMove` array with a `columnSorting.initialConfig` showed one set of values at init and another after the
  first `updateSettings({})`; it now shows the init values on every re-render. The record is dropped with the
  shifts, by an adopted engine order, and by an insert or a removal, whose renumbering the recorded moves no longer
  describe: the reload then sends one order, as develop does. **A sort keeps the documented sort limitation on a
  reload that writes**, and a sort always makes the next resync write (an order sent drops the record, above), so a
  re-render of a sorted grid replays the sort as one order exactly as develop does, and a re-render after the sort
  is cleared repairs what the sort rewrote. An initial `columnSorting.initialConfig` sorts after the engine is set
  up, so it reaches the engine as an order.
- **Moves are planned as blocks** (`planOrderMoves()` in `indexSyncer/orderMoves.ts`). Walking the places from the
  start, the line due at a place and the lines that follow it in both orders form a block; either the block moves
  up to the place, or the lines between the place and the block move down behind it, and the move that carries
  fewer lines is planned, so a line dragged down a long way moves as that line, not as the block it passed. A plan
  that needs a move of more than `ORDER_MOVE_MAX_LINES` (10,000) lines gives up: HyperFormula spreads a moved block
  into one call's arguments, which can overflow the stack (`RangeError`) for a block of about 100,000 rows,
  depending on how deep the call stack already is (seen through the grid, not in a bare engine). The moves go
  through `#runBatched()`, the one place that keeps a nested `engine.batch()` out of a host's open batch (the pad
  `#extendAndSetOrder()` uses it too).
- **Moves fall back to one order** (`#planSafeMoves()`), checked before anything is sent, because a batch of moves
  is not rolled back when one throws:
  - **an array formula in any line a move displaces**, not only in the lines the order moves (which is all
    `#isOrderAllowed()` checks): a move from below an array row to above it throws `SourceLocationHasArrayError`
    (`manualRowMove: [2, 1, 0]` with `=ARRAYFORMULA(B1:C1*10)` in row 1 threw at init). A move displaces only the
    lines between its block and its target, and each move starts at or after the place the one before settled, so
    every line ever displaced lies between the lowest start or target and the highest block end or target, read
    before the moves. The moves to an order base (`movesOnly`) are only tried, so a refused order warns once, from
    the call that sends the order;
  - **the engine's `maxRows`/`maxColumns`**: a move adds `count` lines before it moves them, so the sheet plus the
    largest block must fit (`maxRows: 3` with 3 rows and a `manualRowMove` array threw at init);
  - **another sheet or a named expression on the engine** (global or scoped to this sheet): a reload replaces this
    sheet only, so their references into it already follow the order, and a move would move them again; one order
    leaves them alone (coarse: no per-line dependents check);
  - **the cost** (`chooseOrderMoves()`), an estimate, not a guarantee. A move costs about one pass over the sheet,
    whatever lines it carries (a one-line move of 200,000 x 2 took 31 to 35 ms), so it is priced against what it
    follows or replaces. Every reorder sent as moves comes right after a full write of the sheet, and a move costs
    about a sixtieth of that write (10,000 x 4: 5 ms after a 210 ms write; 10,000 x 20: 18 ms after 1.2 s; 200,000
    x 2: 35 ms after 2.2 s), so `ORDER_MOVES_WITHIN_WRITE` (4) moves always go as moves, however tall the axis is:
    a one-row `manualRowMove` array or a short drag on a tall grid never falls back to the order that gives
    `#REF!`. Past those, moves are priced against one order, which rewrites every line that changes place and costs
    more per line as more change (100,000 x 2: 3,006 lines in 30 ms, 30,006 in 1.5 s, 100,001 in 12 to 17 s):
    `LINES_PER_CHANGED_LINE` (40) axis lengths per changed line, and never past `ORDER_MOVES_MAX` (30) moves, where
    HyperFormula's batch slows down sharply (40 moves of 2,000 x 4 took 21 ms, 50 took 216 to 988 ms). So the
    choice avoids the order's seconds on long sheets, and the moves it sends can cost a few to some tens of
    milliseconds more than one order, which stays within the run-to-run spread of the write they follow, on a
    reload that writes the sheet only, in exchange for references that stay right where one order gives `#REF!`. An
    earlier version priced every move as a full-axis rewrite against one order alone, so a one-row move array on a
    grid taller than about 80 rows fell back to one order; one before it planned the larger move and was slower
    than one order on small sheets (reviewer, 2,000 x 4 with ten drags of 50 rows: 27 ms against 9 ms). Measured on
    HyperFormula 3.3.0 in Jest, a full reload (`setSheetContent()`, then one order or the chosen moves inside
    `engine.batch()`), a formula per cell reading 7 rows down (`=A{r+7}+A{r}`), two runs, the second on a loaded
    machine ("+N": each one-row drag moves N rows down; "to top": to row 0):

    | Shape, drags | Lines changed | Write | One order (develop) | Chosen |
    |---|---|---|---|---|
    | 100 x 4, 1 drag +1 | 2 | 7 to 8 ms | 1 ms | 1 move, 2 ms |
    | 10,000 x 4, 1 drag +1 | 2 | 210 to 224 ms | 0 ms | 1 move, 4 to 5 ms |
    | 10,000 x 4, 3 drags +1 | 6 | 221 to 224 ms | 0 to 1 ms | 3 moves, 10 to 11 ms |
    | 200,000 x 2, 1 drag +1 | 2 | 2.2 s | 0 ms | 1 move, 35 ms |
    | 10,000 x 20, 1 drag +1 | 2 | 1.2 to 1.3 s | 0 ms | 1 move, 18 ms |
    | 100,000 x 2, 6 drags +500, 1,000 apart | 3,006 | 1.0 s | 31 to 32 ms | one order |
    | 100,000 x 2, 6 drags +5,000, 10,000 apart | 30,006 | 1.0 s | 1.5 to 1.6 s | 6 moves, 80 to 84 ms |
    | 200,000 x 2, row 0 dragged 100,000 rows down | 100,001 | 2.0 to 2.1 s | 11.8 to 16.8 s | 1 move, 57 to 63 ms |
    | 2,000 x 4, 10 drags +50, 100 apart | 510 | 44 to 81 ms | 11 to 12 ms | 10 moves, 7 to 18 ms |
    | 2,000 x 4, 20 drags +5, 10 apart | 120 | 42 to 87 ms | 2 to 5 ms | one order |
    | 10,000 x 4, 6 drags +500, 1,000 apart | 3,006 | 226 to 370 ms | 72 to 129 ms | 6 moves, 21 to 31 ms |
    | 10,000 x 4, 3 drags +1,500, 3,000 apart | 4,002 | 224 to 415 ms | 92 to 186 ms | 3 moves, 10 to 15 ms |
    | 5,000 x 30, 3 drags +500, 1,000 apart | 1,503 | 1.0 to 1.7 s | 352 to 607 ms | 3 moves, 40 to 55 ms |
    | 10,000 x 20, 3 drags +1,000, 2,000 apart | 3,003 | 1.2 to 2.3 s | 500 to 901 ms | 3 moves, 43 to 91 ms |
    | 10,000 x 20, 30 drags to top | 9,001 | 1.2 to 2.2 s | 1.7 to 3.9 s | 30 moves, 459 to 470 ms |

    A reorder the choice sends as one order records its shifts like a sort. Known limit: such an order keeps the
    old `#REF!` behavior. That includes five or more separate short drags on a tall grid (1,000 or 10,000 rows):
    past the four moves that always go, each short move is priced against an order of a few lines, so the reload
    sends one order, as develop does.
- **The hold's release follows the reload rule** (`AxisSyncer#setOrderHeld(false)`). The engine fed its content
  again inside `runWithEngineOrderHeld()` (`#reloadedWhileHeld`, set by `#applyInitialOrder()` while held) holds it
  in physical order, so the release sends an order reached by moves as moves, unless an order change other than a
  move was held back in the hold (`#orderChangedWhileHeld`) or the grid is sorted. An order reached by moves and
  then an order keeps its `#orderBase` across that reload (`#heldOrderBase`), and the release replays the moves to
  it as moves and only the rest as one order, as a reload outside the hold does; any order change in the hold after
  the reload drops it. A release with no reload in the hold, or with an engine order adopted (`adoptEngineOrder()`
  clears the flag), still sends one order: the engine there holds the order an earlier step left, not a fresh
  physical one. The base travels with the engine order (`EngineOrder.orderBase`), so an adopted order keeps it
  while it keeps its shifts. In the sheets bar the replay never runs: a workbook's engine holds several sheets, so
  the moves guard sends one order on any reload that writes, and a sheet's move array reaches the engine on its
  first visit through the move path. A re-render of a returned sheet whose sort sits on a move array therefore
  shows the one-order values, as develop does; the first visit and the return show a plain grid's values
  (`../sheetsBar/__tests__/formulaSheets.unit.js`).
- **Known limit, drags after drags:** a reload that writes (the data changed) after drags replays the order by the
  planned path, not by the drags' own moves, so a range on the sheet can end on other cells than the drags left it
  on, and where develop's one order showed `#REF!` this can show a plausible wrong number (row 0 dragged to the end
  of `[1, 2, 4, 8, 16]` with `=SUM(A1:A3)`, another cell changed in place, `updateSettings({})`: 1, where 204 is
  right and develop showed `#REF!`). An `ARRAYFORMULA` row moved by drags can likewise read another row after a
  data-changing re-render, as develop's does on any re-render. Replaying the recorded drag moves when no insert or
  removal happened since is the follow-up that would close it.
- **Known limit, a drag after a sort:** a drag made after a sort, with no reload between, is folded into the one
  order the next writing reload sends, the same class of result as develop's one order and inside the documented
  sort limitation. The values change on that reload, and differently from develop: a drag, a sort, a drag and a
  data-changing reload took rows `[4, 3, 2, 5, 1]` from `['#REF!', '#REF!', 1000, 1003, 1000]` to `['#REF!',
  '#REF!', 1001, 1000, 1000]` here and to `['#REF!', 1005, 1001, 1004, 1000]` on develop. With a reload between the
  sort and the drag the values stay as shown.
- Pinned by `__tests__/loadOrderAsMoves.unit.js` (the skip on a re-render after a drag, an edit, a range, other
  sheets and named expressions, a second grid, an edit and its undo, the same `data` array sent again, a removal of
  scattered rows, two drags on the first re-render, a `columns` update without `data` on a grid never dragged; the
  write after an undo that changed the rows, after a `columns` update without `data` on both axes; `NaN` and a `Date`
  changed in place; the host's in-place change; the array-formula, `maxRows` and other-sheet fallbacks; the hold
  release; the moves under an initial sort, also after a reload in a hold; a few moves on a tall grid; init, both axes, the sort control), `__tests__/indexSyncer/axisSyncerInitialOrder.unit.js`
  (moves on the mock engine, the cost fallback, a sort replayed as an order, the moves under an order replayed as
  moves, one order after an insert and after an insert and a removal that keep the length, one warning for a
  refused order, a sorted order from a new syncer and from a postponed sync),
  `__tests__/indexSyncer/orderMoves.unit.js` (the smaller move, the block cap, the cost choice),
  `__tests__/utils.unit.ts` (`insertEmptyRows()`), `__tests__/deferredResync.unit.js` (a settings update that
  leaves the data unchanged writes nothing), `__tests__/plugins/initialManualColumnMove.spec.js` and
  `tests/e2e/formulas-load-order-moves.spec.ts`.

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
carries a configured order on a later `loadData()`.** At init those plugins apply their arrays in
`enablePlugin`, so at the first `afterLoadData` the sequence is already non-identity and
`setupSyncEndpoint()` → `#syncInitialOrder()` sends it, as moves since DEV-3972 (see "A reload that does write
takes an order reached by moves as moves" in "Sequence syncing" above). On a `loadData()` after init the two
plugins re-apply the arrays in their own `afterLoadData`. Develop ran that before this listener,
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
  `UndoRedo` operations, which emit no sheet event. The validation probe's `engine.undo()` takes back a
  batch of cell writes only, which cannot add, remove, or rename a sheet, so it resets nothing. A host calling `engine.undo()` directly on a sheet
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
`{ hyperformula: engineClass }`.

**A sheet added to, removed from, or renamed in an engine the plugin built is handled by version
(`engine/sheetStructureChange.ts`).** `rebuildAndRecalculate()` rebuilds from `getSheetSerialized()`,
which writes a spilled array's values as plain data, so every spill on every sheet of the engine turns
into `#SPILL!`: a second grid binding to the engine adds a sheet and broke the first grid's spills that
way. Four rules.

- **From HyperFormula 3.1.1 on, no rebuild.** That version recalculates references to a sheet added or
  removed later by itself (`#REF!`, then the value, then `#REF!` again; HyperFormula issue #1116). Below
  it (`recalculatesSheetReferences()` reads the class's `version` static; an unreadable one or a 3.1.1
  prerelease counts as old), the rebuild stays on add and remove, because without it those references
  stay `#REF!`; spills still break there. The `TODO` at the gate in `register.ts` goes when the
  supported floor reaches 3.1.1, which is a support drop and therefore a major-release change.
- **`SHEET()` and `SHEETS()` are written again instead, on add, remove, and rename.** HyperFormula does
  not mark them as depending on the sheet list, so only the rebuild used to refresh them (and a rename
  never refreshed them). `recalculateSheetListFormulas()` scans every sheet's formulas and every named
  expression (global and each sheet scope) for a call to either one, in the engine's language
  (`getLanguage()`, falling back to the English name per function), and writes each again:
  `setCellContents()` for a cell, `changeNamedExpression()` with the expression's own `options` for a
  name. The cost is one `getSheetFormulas()` per sheet per sheet change, far below the rebuild it
  replaces. Every guard below has a test that goes red without it.
  - **A formula that reads a missing sheet is skipped.** HyperFormula throws when it is handed such a
    formula again (`NoSheetWithIdError` for a cell, `Sheet not initialized` for a named expression),
    inside the sheet event, which skipped every grid's own listener and left the engine unusable for
    the next `addSheet`. A cell is checked through `getCellPrecedents()` (a precedent on a negative
    sheet is a named expression, not a missing sheet); a named expression, which has no precedents
    API, through the sheet names its text references (`doesSheetExist()`). **Known limit:** such a
    formula keeps its old `SHEET()`/`SHEETS()` value. A plain reference reads `#REF!` anyway, but one
    inside `IFERROR()`, `IFNA()`, or `ISREF()` does not (`=IFERROR(Data!A1,0)+SHEETS()` stays stale).
    No engine call refreshes it, so the guide lists it.
  - **The text goes through `quoteUnreadableSheetNames()`**, with `canReadSheetNameUnquoted()` from
    `utils/formulaReferences.ts` (the one check this plugin and the sheets bar share), because the
    engine hands back `'2026'!A1` unquoted and writing that back turns the cell into `#ERROR!` (see
    "Sheet names the engine reads only in quotes").
  - **The writes run with the evaluation suspended, and the engine's undo stack is cleared before it
    resumes.** The rebuild cleared that stack, so an `engine.undo()` right after `addSheet()` never
    landed on a write the host did not make; without the clear it undid the refresh and left the
    sheet. Inside a host's own `batch()` or `suspendEvaluation()` the writes join it and nothing is
    cleared or resumed.
  - **Only a failing read or write is caught** (`warn`, `Formulas:` prefix). The resume, and the
    `valuesUpdated` emit it makes, run outside the `try`, so an error from an `afterFormulasValuesUpdate`
    hook reaches the caller. A write that throws inside the suspension still leaves that cell
    uncomputed in HyperFormula 3.3.0; the guards above keep the known throws out.
- **The refresh emits `valuesUpdated` inside the sheet event**, so `afterFormulasValuesUpdate` runs before
  the grids' own `sheetAdded` / `sheetRemoved` listeners (`afterSheetAdded`, the `#ownSheetExists`
  reset). That order is not new: HyperFormula's `removeSheet()` already emits `valuesUpdated` before
  `sheetRemoved` (`recomputeIfDependencyGraphNeedsIt()`), so a grid bound to the removed sheet was
  already exposed to a hook that reads it in that window.
- **`SHEET()` answers the sheet id plus one, not the sheet's position.** The rebuild renumbered sheet
  ids after a removal, and a grid bound to a later sheet then held an id `getSheetName()` no longer
  knew. Without it, surviving sheets keep their ids, so `SHEET("S3")` stays 3 after S2 is removed
  while `SHEETS()` drops to 2. This is a declared breaking change (19.0 migration guide). HyperFormula
  gives a new sheet `lastSheetId + 1` and steps back only when the removed sheet had the last id and no
  formula references it (`SheetMapping.removeSheetIfExists`); a removed sheet that is still referenced
  stays as a placeholder and keeps its id. So ids are not reused in general.

An engine instance the host passes in gets none of these listeners, as before, so `SHEET()`/`SHEETS()`
stay stale there. Pinned by `__tests__/sheetStructureChange.unit.js`.

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
  read drains it, and so does the next `updateSettings()` or `loadData()`. A call that carries `data` makes
  that draw itself before it rethrows (`repaintAfterFailedDataCall()` in `core.ts`), so the resync runs there
  and not on a later read. If the SCAN throws — a `cells()`
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
- **An update whose data reads the same writes nothing (DEV-3972).** The scan still runs, but the write and the
  order replay are skipped (see "A reload that changes no data writes nothing" above), so the counts below are
  "at most one": `__tests__/deferredResync.unit.js` changes a value in place where it counts a write.
- **One `setSheetContent` per update is also one engine undo entry per update.** Every write pushes a
  HyperFormula undo entry and clears its redo stack, and the grid records no action for a settings update,
  so the discarded second scan used to add an entry the grid could never match. Covered by `pushes exactly
  one engine undo entry per settings update`; it counts entries, it does not prove the two stacks agree
  after an `undo()`, because NestedRows clears the grid's history on enable.
- **`hot.view` is the init detector, on purpose.** The Core creates the view right after the first
  `updateSettings(settings, true)`, so it is absent during the construction-time `afterCellMetaReset`
  and present for every later one; `collapsibleColumns` and `emptyDataState` read the same signal. Covered
  by `fills the sheet before the first draw at construction`.
- **The plugin postpones no index sync, so its postpone callback does nothing.** `AxisSyncer` postpones the
  initial order (`#syncInitialOrder()` through `IndexSyncer#getPostponeAction()`) only while the engine or the
  sheet id is `null`, and it runs only from `IndexSyncer#setupSyncEndpoint()`, which the plugin calls with a
  sheet it has just written or bound. Each setup sends the grid's order itself, except the one in
  `#loadSheet()`, which sends none when a load follows (`syncOrder = !loadsData`; see
  "`sheetName`, `switchSheet()` and the engine instance"). `calculateAndSyncMoves()`
  passes its move to `getPostponeAction()` as an argument, which is ignored, so a move made with no sheet
  bound (ManualColumnMove's array at init) is never queued either; the setup sends that order. The one-off
  `init` listener the callback used to add, and the ready-step queue that replaced it, replayed nothing. Do not
  add a queue back: a replay after a setup sent the order a second time, the double transform that rewrote
  `=A1+10` to `=B1+10` (below). Pinned by `__tests__/noPostponedIndexSync.unit.js`, whose control shows the
  only path that postpones (a setup with no sheet) reaching the callback.
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
  (it reads the engine sheet as its data, and takes over the order the engine holds it in instead; see "Every path
  that binds or fills a sheet on a live grid sets the sync endpoint up"), and a load core is about to make (`isDataLoadPending()`,
  the sheets bar's switch), which feeds the sheet itself. Pinned by `__tests__/reenableSharedEngine.unit.js`
  and "writes the new data when a listener disables and re-enables the plugin mid-update".
- **An enable while a load is pending never adds back the sheet it was bound to.** `disablePlugin()` keeps
  `sheetName`, and an enable whose sheet the engine no longer holds adds it again from the grid's data. In the
  sheets bar's switch that data is the departing sheet's: a workbook whose bound sheet was removed while a sheet
  without formulas was shown got that sheet's rows back under the removed name on the next formulas sheet, so
  its references read them instead of `#REF!`. While a load is pending (`isDataLoadPending()`) the enable drops
  the stale `sheetName` and `sheetId` instead, and the switch's load binds the sheet the new settings name. Only
  dropping it matters for a sheet whose `formulas` names no `sheetName`: the load falls back to `this.sheetName`
  when no sheet is requested, so a kept stale name added the removed sheet back from that load. Not covered: an
  enable outside a load (`updateSheetSettings()` turning formulas on for the visible sheet) still adds it back.
  Pinned by "shows #REF! where formulas read a removed sheet when …" and "does not add a removed sheet back when
  the next formulas sheet names no engine sheet" in `../sheetsBar/__tests__/formulaSheets.unit.js`.
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

## A change the Core can reject reaches the engine only when the Core applies it (DEV-3760)

The Core applies a `setDataAtCell()` / `setDataAtRowProp()` change set to the source data only after the
validators of its cells answered, and `validateCell` always answers in a microtask, so a set with a
validated cell waits at least one microtask, and as long as an async validator takes (a server round
trip: seconds). The plugin used to write every change into the engine from `afterSetDataAtCell`, before
validation, so for the whole wait the grid showed values computed from the typed value (a `-7` typed into
a validated D3 made `=C3*D3` read -105 instead of 465), and kept them after a rejection. Now:

- **Only a change the Core can reject waits.** `#splitChangesByValidation()` sorts the set in
  `afterSetDataAtCell` by `#canCoreRejectChange()`: the cell has a validator (`getCellValidator()`) AND
  `allowInvalid === false`, read from the cell meta (`getCellMetaTransient()`, the same cascade). That is
  the condition `queueValidators()` drops a change under (`result === false && allowInvalid === false`,
  `afterValidate` included); a cell that accepts invalid values only gets an invalid mark, so its change
  always reaches the data. Every other in-bounds change, a `numeric`, `date` or `dropdown` column with the
  default `allowInvalid: true` included, is written at once, as before DEV-3760: same timing, same
  `afterFormulasValuesUpdate` count, same events in other grids. A change past the last row or column waits
  too: its row or column exists only once the Core applies the set. The record (`#changesAwaitingApply`, a
  `WeakMap` keyed by the change array, which the Core hands to `beforeChangeRender` too) keeps the waiting
  ones in `deferredChanges`.
- **`#onBeforeChangeRender` writes them**, in one batch, from the array the Core applies: a rejected change
  is spliced out of that array (`validateChanges()`), and so is a change the write ledger dropped because a
  newer applied write to the cell overtook it, so neither reaches the engine. A fully rejected set never
  fires `beforeChangeRender` and writes nothing, so it draws no data version and UndoRedo records no step
  for it; an accepted edit draws its version inside the operation the Core resumes for the apply, so it is
  one grid step. A validator correction (`*Validator` source) rewrites the change in place before the
  apply, so the corrected value is what is written. `beforeChangeRender`, not `afterChange`: the Core
  renders between the two, so the render paints the new results. A change past the last row of a set
  without a rejectable cell is written here too (the set applies synchronously, inside `setDataAtCell()`):
  it used to wait for `afterChange`, through a listener keyed by the change array (`#outOfBoundsWrites`),
  which is gone, so its `afterFormulasValuesUpdate` now fires before the render instead of after it.
- **Nothing takes a rejected change back any more.** The previous repair (`#onChangesRejected`, fed by a
  `@private` core `_addRejectedChangesListener()`, both removed) restored the engine after a rejection;
  with nothing written early for a cell the Core can reject, none of it is needed.
- **The deferred cells are left out of the dependent validation of the early write.**
  `#onAfterSetDataAtCell` adds their engine addresses to `changedCells`, so `validateDependentCells()` skips
  them: read from the engine, a deferred cell whose old formula reads an early-written cell was validated a
  second time by that old formula (source `undefined`), and an out-of-order answer left an invalid value
  with a valid mark. The Core validates them as changes. Pinned by `validates a deferred cell of a mixed set
  once, by its new value` (both sources).
- **So are the cells a deferred change also recalculates.** In a mixed set, the early write of an
  immediate cell recalculates a formula that reads a deferred cell too (`C = A1+B1`, A deferred, B immediate)
  from the deferred cell's OLD value. Validated then, its validator and `afterValidate` ran for a value the
  cell never ends with, and an out-of-order async answer of that stale validation overwrote the mark of the
  right one (C = 52 marked valid). `#splitDependentsOfDeferred()` walks `getCellDependents()` from the
  deferred cells (formulas and ranges, transitively, `#collectDependentKeys()`), leaves those cells out of the
  early validation, and keeps them on the record (`heldDependents`). `#onBeforeChangeRender` validates them
  with the write's own dependents (`uniqueCellChanges()`), with the final engine values, also when every
  deferred change was rejected and the apply writes nothing: the immediate changes still reach the data, so
  the set reaches `beforeChangeRender`. Pinned by `validates a dependent of a deferred and an immediate cell
  of one set once, at the apply` (reverse-order answers) and `validates a shared dependent when the deferred
  cell is rejected and the immediate one applies`. **Not covered by a test, documented** (two overlapping
  calls where the second overtakes the first's immediate cell would reach it): a set reaches
  no `beforeChangeRender` only when its array ends empty. A cell without `allowInvalid: false` can leave it
  only through the write ledger, when a newer applied write to the same cell overtook it, so a set whose
  immediate changes were all overtaken and whose deferred changes were all rejected or overtaken never
  validates its held dependents. The newer writes recalculated and validated them, and their marks stay. A
  dropped set (a `loadData()`) needs none: the data was replaced.
- **A cell of the set written at once that reads a deferred cell of the set is validated once, by the
  probe's result (`#findReadersOfDeferred()`).** Case: A1 deferred, B1 `=A1*5` with a validator and
  `allowInvalid: true` (written at once), both in one `setDataAtCell()`. The early write computed B1 from
  A1's OLD content, so the Core validated B1 by `#VALUE!` (A1 held `'x'`) and marked it invalid for the
  whole wait; the apply then validated it again as a held dependent, outside the edit's undo step, so what
  its validator or `afterValidate` wrote was undone with nothing. Before DEV-3760 it was validated once, by the new A1.
  Now `#onAfterSetDataAtCell` takes the immediate changes the walk from the deferred cells reaches (one walk,
  shared with `#splitDependentsOfDeferred()`; only a cell with a validator) and hands them to the probe as
  readers: the probe runs for them even without a deferred formula, writes every deferred plain value of the
  set into its second batch (a reader can read a deferred cell through a formula without a validator, which
  is not a reader), and reads their results into `#validationValues`, so the Core validates B1 by 20. The
  probe returns the readers it read a result for, and only those go on the record (`readersOfDeferred`);
  the apply leaves them out of the dependent validation when every deferred change was accepted (B1 holds
  the probe's result). After a rejection (a rejectable change missing from the array, `rejectableChanges` on
  the record) B1 holds a value computed from the old content, so the apply validates it again. Rules:
  - **A reader without a probe result is no reader.** Without a probe (`undoLimit` below 2, evaluation
    suspended) or when the probe read no result, it gets no entry (an entry without a result would hand the
    validator the formula text), the Core validates it by the engine's value, from the deferred cells' old
    content, and it stays a held dependent, validated again at the apply. Recorded
    as a reader, it was validated only by `#VALUE!` and ended invalid while holding 20. Pinned by
    `validates an immediate formula that reads a deferred cell again at the apply without a probe` (both
    limits).
  - **A cell the set changes more than once is no reader.** The Core validates every change, and
    `#onBeforeValidate` hands an entry with the same source to a change whose value does not match, so the
    earlier change took the last one's result and the last one read the engine's `#VALUE!`; the apply then
    skipped it, and it ended invalid. It stays a held dependent. Pinned by `validates an immediate formula
    changed twice in its set again at the apply`.
  - **The re-validation after a rejection joins the edit's undo step only when the reader's validator
    answered in its own call.** Inside the step, `validateCell()` holds it until the validator answers, so
    an async validator made `isUndoAvailable()` `false` and an `undo()` right after `afterChange` was lost
    for good. Whether a validator answers in its call cannot be known before it runs, so the plugin watches
    the Core's validation of the change: `#onBeforeValidate` starts `#trackReaderAnswer()` when it hands out
    a reader's entry, `#onAfterValidate` marks the answer, and a check queued from a microtask queued in
    `beforeValidate` (so it runs after the validator's own microtask, `validateCell()` queues it after the
    hook) records whether the answer had come. A reader that answered so is validated again through
    `validateDependentCells()`, inside the step, so what its validator or `afterValidate` writes is undone
    with the edit; any other one goes through `#validateDependentCellsUnrecorded()`, like a dependent, and
    such a write joins no step. Before DEV-3760 the reader was validated once, inside
    the step, by the rejected value then written into the engine. **Known limit:** a validator that
    answers in its call the first time and later asynchronously (a cache) holds the step after a rejection.
    **The watch lives two microtasks.** Each record (`ReaderAnswer`, in `#readerAnswers` per cell) leaves
    the map when its check runs, and the map is cleared on a load, on disable and on destroy: a reader
    validator that threw or never answered used to leave its record, and the next validation of the cell
    marked it instead of its own, so that reader was taken for an async one. `#onAfterValidate` marks the
    oldest unanswered record of the cell with the same value and source (what `beforeValidate` handed the
    validator). **Known limit:** another validation of the cell with that value and source that answers
    inside the watch (a `validateCells()` in the same task, with the engine already holding the value) marks
    it, and an async reader is then taken for a sync one; the Core passes no token of the validation to
    `afterValidate`. Pinned by `keeps what the afterValidate of a reader of a rejected cell writes at the
    apply in the edit's undo step` (sync), `keeps an edit undoable right after it is applied when an async
    validator of a reader of a rejected cell still works`, and `classes a reader by its own validation
    after a reader validation of the cell that never answered`.

  Pinned by `validates an immediate formula that reads a deferred cell of its set once, by the new value`,
  `validates an immediate formula again by the old value when the deferred cell it reads is rejected`, and
  `keeps what the afterValidate of an immediate formula reading a deferred cell writes in the edit's undo
  step`.
- **When the set holds a change the Core can reject, the apply's dependent validation joins no undo
  step.** `validateCell()` holds the step it runs in until the validator answers. Called from the apply,
  an async validator on a dependent (a total row over the column) held the edit's step for its whole run, so
  `isUndoAvailable()` was `false` and an `undo()` made right after `afterChange` was dropped. Before DEV-3760 the
  dependents were validated during the edit's own wait, so the step settled with the edit. So
  `#onBeforeChangeRender` validates them through `#validateDependentCellsUnrecorded()`, which runs each
  `validateCell()` under the grid's `operationScope.suppress()`, when the record says `hasRejectableChange`.
  **The cost: for a set with a deferred change, what the validator or `afterValidate` listener of a
  dependent validated at the apply writes (a `setCellMeta()`, a `*Validator` correction) is recorded in no
  step, so an undo of the edit does not undo it.** That covers every dependent of the deferred cells, a
  dependent the set's immediate cells share with them included (it is validated only at the apply). Before
  DEV-3760 those writes joined the edit's step. A dependent of the immediate cells only is validated by the
  early write inside the step. An apply without a rejectable change (a set past the last row
  only, or the whole-set write-back of a resync window when nothing was deferred) validates inside the step;
  so do the write of a restored state and a source write. There an async dependent validator
  still delays the step. Pinned by `makes an accepted edit undoable as soon as it is applied, while a
  dependent is still validated`, the Playwright step of `tests/e2e/editor-validation-wait-own-cell.spec.ts`,
  `undoes what a dependent's afterValidate writes with an edit written at once, as before`, and `undoes
  what a dependent's afterValidate writes with a write past the last row, as before`.

**A validator that reads a dependent formula while the change waits sees the pre-change result (intended).** A
cell the Core can reject reaches the engine only at the apply, so until then every formula that depends on it
holds its old result, and a validator of another cell that reads such a formula (through `getDataAtCell()` or the
engine) gets that result. A rejected value must not show through a dependent, and a validator that needs the
result for the new value reads it from the probe's entry (`#validationValues`) for its own cell only. Do not
write the pending value into the engine to change this: see "why the probe's write is not kept".

**A validated write a listener makes during an editor save joins the editor's save set.** A `setDataAtCell()` a
`beforeChange` or `afterChange` listener makes while an editor saves is marked as part of that save's sets
(`../columnSorting/AGENTS.md`, the header sort's wait), so a validator of that write that never answers keeps a
header sort waiting, as the editor's own validator would. An API write made outside a save does not.

**Known limit (the predicate is duplicated).** Formulas decides in `afterSetDataAtCell`; the Core reads
the cell's validator when it validates and `allowInvalid` when the validator answers (`queueValidators()`).
Any change of the cell's validator or `allowInvalid` between the two (an `afterSetDataAtCell` listener
registered after Formulas, or a `setCellMeta()` / `updateSettings()` made while the validator of a change
written at once still works) that turns it into a change the Core rejects leaves that change written: with
the restore gone, the engine keeps the rejected value until the next full write.

**Known limit (held dependents are engine addresses).** `heldDependents` keeps the engine addresses the
early write found. A row or column inserted or removed while a deferred change waits for its validator
moves the real dependent, so the apply validates the cell now at the old address and the moved dependent
is not validated. The Core has the same limit for the change itself, and it decides where the edit lands:
the waiting set is applied at its old visual coordinates, so after `alter('insert_row_above', 0)` an edit of
row 1 writes the record now at row 1 (the old row 0), and the apply's validation of the held dependent at
the old address validates the cell that write reaches (checked, insert above and remove
above). Translating only the held addresses through the structural change would validate the moved record,
which the edit no longer touches, and leave the cell it does reach unvalidated. The fix belongs to the Core:
move a waiting set with its records (row identity) or drop it on a structural change, as on a `loadData()`;
the dependents then follow by being read again at the apply.

**Known limit (a deferred cell past the last row starts no walk).** `#splitDependentsOfDeferred()` walks
from deferred cells the engine already holds. A deferred change past the last row has no engine cell yet,
so a dependent it shares with an immediate cell of the set (`=SUM(A1:A5)+B1`, A5 created by the set) is
validated by the early write from the old value, and an out-of-order async answer can leave its mark
wrong. Before DEV-3760 it behaved the same.

**The validator of a formula still gets its result: the validation probe.** `#onBeforeValidate` hands a
validator the engine's result for a formula cell (an error as its text, a date or time column's serial
turned into the grid's format, `#readValidationValue()` and `#toValidationValue()`). For a deferred cell
the engine does not hold the formula yet, so `#probeValidationValues()`, in `afterSetDataAtCell` after the
early write, writes it, reads the results, and takes the write back with `engine.undo()` plus
`clearRedoStack()`, all in the same task, so nothing paints it and the engine ends as it was. Rules:

- **Formulas first, then only the plain values they read** (`#runProbe()`): the deferred formulas go into
  one batch; a deferred plain value goes into a second batch only when a probed formula reads its cell
  (`getCellPrecedents()`, a range included, `isAddressInPrecedent()`). A named expression is reported as a
  precedent with `sheet: -1` and does not say which cells it reads, so when any probed formula reads one,
  every deferred plain value of the set goes into the second batch (pinned by `writes a plain value of the
  set a formula reads through a named expression into the probe`). Every formula of the set is in the
  first batch, so a chain through other formulas of the set is covered, and the validator sees what it saw
  when every change was written first: a formula reading another deferred cell of the set reads its new
  value, and one that reaches itself through a dependent is `#CYCLE!`. Each batch is undone. Writing the
  whole set instead made a paste of many values with one formula probe every cell. `calculateFormula()` is
  wrong for the cycle, for references into the set, for `ROW()` and for a spill (it evaluates in isolation
  at A1); `validation.spec.js` pins the cycle case.
- **`engine.undo()`, not writing the old content back**: the undo restores an array formula's spill
  exactly, where a serialized value written into a spilled cell breaks the spill. An empty batch still
  pushes an engine undo entry (checked on 3.3.0), so with room for both batches each undo takes back its
  own batch. The undo cannot add, remove or rename a sheet, so it does not reset `#ownSheetExists`. **The
  guard is `undoLimit` itself** (`engine.getConfig().undoLimit`): a probe pushes up to two batches, and an
  engine keeping fewer entries drops the first, so the second `undo()` threw `There is no operation to undo`
  out of `afterSetDataAtCell` with the formula left in the engine (the grid then read 30 over a source
  holding 2). Below 2 (`undoLimit: 0` or `1`) no probe is written: each deferred formula is calculated on
  its own with `calculateFormula()` (`#calculateDetached()`), with the limits above, and a formula the
  engine cannot parse is validated as its text. Pinned by `does not throw or keep the probe in the engine
  when the engine keeps one undo entry`.
- **Known limit: the host's own engine undo history.** Each probe batch is pushed and popped, and HF drops
  its oldest entry when the stack is at `undoLimit`, so a probe can evict the host's oldest engine undo
  entries (a two-batch probe on `undoLimit: 2` drops up to two). HF exposes `undoLimit` but no stack length, so the
  guard above cannot tell how full the stack is. The grid's undo never reads that stack.
- **A set without a deferred formula skips the round trip**, but every deferred in-bounds change still
  gets an entry in `#validationValues` (keyed by visual row and column, one entry per change, matched on the
  change's value and source, cleared in a microtask: the Core validates a set synchronously right after `afterSetDataAtCell`). An entry
  without a result hands the change's own value through, so a value written over a formula cell is
  validated as the value, not as the result the engine still holds there. With the engine's evaluation
  suspended (a host's `batch()`), no probe runs and a formula is validated as its text. **Known limit:** a
  `validateCells()` in the same task with the change's source, or a dependent validation of a pending cell
  written with source `undefined`, reads the pending entry. **A cell written more than once before the Core
  validates** (twice in one set, or by two sets in one task) has one entry per change: a validation takes
  the first entry with its value and source and removes it, since the Core validates in write order, so the
  same formula written by two sets around a write to its precedent gets each set's result. In one set, the
  cell's last value is the one in the probe, as the apply will hold; an earlier change with the same value
  shares that entry, and an earlier formula with another value is calculated on its own
  (`#calculateDetached()`, with its limits). Pinned by `validates each change of a set that writes one cell
  twice by its own value` and the two `validates the same formula ...` cases.
- **The probe is invisible to every grid on the engine**: it runs in `withPluginEngineProbe()`
  (`indexSyncer/pluginEngineWrite.ts`, a per-engine depth next to the write scope), and every grid's
  `#onEngineValuesUpdated` returns at once while `isPluginEngineProbe(engine)` answers `true`. So no grid
  fires `afterFormulasValuesUpdate` with probe values (a reader grid used to log the probe value and the
  undo for an edit later rejected) and none paints for it. Pinned by `fires no afterFormulasValuesUpdate in
  another grid on the engine for the probe of a rejected edit`.
- **Except what the round trip did not put back: a volatile formula.** `RAND()`, `NOW()` and `TODAY()`
  recalculate on the probe's batch and on each undo, so the engine ends with a value no grid heard, and a
  cell showed the old one until the next render (for a rejected edit, which the Core does not render, and
  under `renderMode: 'onChange'`). `#runProbe()` keeps the undo's changes (a later undo's value of a cell
  wins), and `#findChangesKeptByProbe()` takes the ones that are neither a cell the probe wrote nor one
  that reads it (`#collectDependentKeys()`, walked only when the undo changed a cell the probe did not
  write): those are the cells the round trip changed for good. `#announceProbeChangesKept()` hands them to
  every grid on the engine as an engine event, in a `'cells'` write of its own after the probe, so each
  fires `afterFormulasValuesUpdate` once with the kept value and paints once, this grid included. Nothing
  fires for the probe's write or for a dependent the undo put back. **Known limit:** a volatile formula
  that also reads a probed cell (`=RAND()+A1`) is taken for such a dependent and not announced. Pinned by
  `reports and paints the new value of a volatile formula the probe of a rejected edit recalculated`
  (a stubbed `Math.random`). **Cost:** the announce also runs on an ACCEPTED set, where the apply recalculates
  the volatile formula again anyway, so while the engine holds a volatile formula every probed set (a formula or
  a reader in a set with a deferred change) costs one extra dependency walk from the written addresses and one
  extra `afterFormulasValuesUpdate` and paint per grid on the engine. Announcing only after a rejection would need
  the validation result, which comes later than the probe; the cost is accepted.
- **The probe builds engine-bound values only for a set it runs for.** A set with no formula (raw value
  starting with `=`), no object (a `valueGetter` can turn one into a formula; the escape never makes one)
  and no reader skips the probe, so its values are not turned into engine values (`valueGetter`, the cell
  meta read of the escape): the apply does that once. A 10k plain paste read the cell meta twice per
  change. Pinned by `builds no engine-bound value for the probe of a set without a formula` (the
  `getCellMetaTransient()` count matches a column written at once). The cell's last write and its entry are
  looked up in `Set`s, so a set of thousands of formulas stays linear. A host's own `valuesUpdated` listener on the engine still sees both
  events. The probe depth lives in this bundle's module, so a grid from a second Handsontable bundle sharing
  the engine does not see it and still fires for the probe.
- **Cost, measured** (jsdom, Jest, 1000-row grid, a paste of 1000 values with one formula that reads A1
  into a column with a sync validator and `allowInvalid: false`, time to the apply, median of 6 runs):
  pre-DEV-3760 early write 42.8 ms (1000 `setCellContents`); deferred write without a probe 47.1 ms;
  probe of the whole set 52 ms (2000); probe of the formula and the value it reads 47.3 ms (1002).
- **Cost of a formula paste, measured, and why the probe's write is not kept.** Headless Chromium
  (Playwright, `handsontable.full.js`), a 2000-row grid, a paste (`populateFromArray()`, source
  `CopyPaste.paste`) into a column with a sync validator and `allowInvalid: false`, time from the call to
  `afterChange`, median of 7, against a develop build from before DEV-3760 (2e15365c43):
  - N formulas `=B{i}*2`: before DEV-3760 20.8 ms (N = 500) and 50.8 ms (N = 2000); with the deferred write
    28.2 ms and 80.3 ms. Each formula is written by the probe, undone, and written again by the apply. The review
    measured 22.5 → 39.4 ms and 196 → 387 ms on its own setup.
  - 2000 plain values next to 2000 readers `=A{i}*2` (validator, `allowInvalid: true`): before DEV-3760
    93 ms; with the deferred write and no probe for readers 108 ms; with the probe for readers 146 ms. The readers' probe writes the 2000 values and
    undoes them, the price of validating each reader by the new value.
  - 2000 plain values next to 2000 plain values with a validator (no reader): before DEV-3760 78.6 ms;
    with the deferred write 86.2 ms without the dependency walk, 86.8 ms with it. The dependency walk from the deferred cells costs nothing
    measurable, and no probe runs.

  Keeping the probe's write when nothing is rejected cannot meet the rule that a pending value never
  reaches a dependent: the Core validates in a microtask, always (`validateCell()`, "validation should be
  always asynchronous"), so `setDataAtCell()` returns before any validator runs, a sync one included (only
  `beforeValidate` fires inside the call), and a kept probe would be readable through every dependent
  (`getDataAtCell()`, another grid's render) from that return until the apply, with no way to know yet
  whether a validator is async. Taking it back later is also unsafe: anything a validator,
  `beforeValidate` or `afterValidate` listener writes into the engine meanwhile (a `*Validator` correction is
  a nested `setDataAtCell()` with its own early write) lands on top of it, and `engine.undo()` would take
  that write back instead. So the cost stays, for a paste of formulas into a column whose cells can reject
  it, and for a paste whose formulas written at once read such a column; a paste of plain values with no
  formula reading them runs no probe.

Pinned by `__tests__/deferredValidatedWrite.unit.js` (the wait for a rejected and an accepted value, a
mixed set, a sync validator, `allowInvalid: true` and a numeric column written at once, a formula validated
by its result, a value over a formula cell, a formula reading the set or a range of it, the probe's cells
and trace, a cycle, undo right after the apply, the mixed-set dependent validation, a reading grid) and the
dependents, Escape and undo steps of `tests/e2e/editor-validation-wait-own-cell.spec.ts`.

### The early-written cells of a waiting set

A waiting set can still have changes in the engine: every in-bounds change the Core cannot reject (no
validator, or `allowInvalid` left `true`). They keep the older rules.

A full sheet write from the source data inside the window (`#writeSheet`, reached from an `updateSettings()`
in the same synchronous task) scans data that does not hold the change yet and drops it from the engine:
the cell reads its raw formula text through `getDataAtCell()` and every formula depending on it keeps the
previous value, with no error. Pre-existing, reproduced on 18.1.1. So `#onAfterSetDataAtCell` records `#sheetWriteCount` and `sheetId` on the set, and
when the count has moved, or the sheet id has changed, by the time the Core applies it,
`#onBeforeChangeRender` writes the WHOLE set, early-written changes included, not just the deferred ones.
The rules:

- **A full write the engine refused leaves the set out.** `#clearRejectedSheet` empties a sheet the engine
  cannot hold and does not bump `#sheetWriteCount`; it bumps `#refusedSheetWriteCount` and records the write
  count (`#sheetWriteCountAtRefusal`). A set that waited across such a write, with no full write since, is
  not written at all (`#isSheetEmptiedSince()`): its cells would leave the refused sheet holding just those.
  Pinned by `does not write a change back into a sheet the engine refused to hold`.
- **A sheet switch in the window drops the set, and the plugin takes its early writes back.** Every
  sheet switch is a `loadData()` (`switchSheet()`, the sheets bar's `_applySettingsAndData()`), and the
  Core drops a change set that waited for its validators across a load instead of writing it into the
  loaded rows (`handsontable/AGENTS.md`, "A change waiting for an async validator is dropped"). A dropped
  set fires neither `beforeChangeRender` nor `afterChange`, so the Core calls the plugin's
  `#onChangesDropped` through the `@private` `_addDroppedChangesListener()`. It is registered in
  `enablePlugin()` and removed in `disablePlugin()` and `destroy()` (`BasePlugin` does not track it). Before the Core dropped such a set, it applied it to
  the switched-to sheet's data, and this plugin wrote it into that sheet to match; that was writing an edit
  into a record the user never touched, and it never shipped in a release. `#onBeforeChangeRender` still
  compares the sheet id as well as the count, for a set that reaches the render after the binding moved
  without a load. Pinned by `drops the change from both sheets when the sheet switched while the change was
  validated` (switch plus a full write) and `drops the change from both sheets when the switch alone ran
  while the change was validated` (switch only).
- **A dropped set puts the switched-AWAY sheet back.** `afterSetDataAtCell` already wrote the set's
  in-bounds changes the Core cannot reject (the only ones a waiting set can have written; see above) into
  the sheet the grid showed then, so without the restore one `setDataAtCell()` stayed in that sheet while
  its grid data never got it, and a switch back showed it. `#restoreSwitchedAwaySheet` writes the change
  set's OLD values back into the sheet recorded on the set (they are what that sheet held, since the grid's
  data was that sheet's when the change was made), skipping out-of-bounds changes (never written there)
  and a sheet removed from the engine. The restore runs in a `withPluginEngineWrite` scope that paints THIS
  grid too: the Core renders nothing for a dropped set, and `#writeOwnSheet()` left a cell of the sheet shown
  that reads the restored cell painting the value computed from the dropped one (pinned by `repaints this grid
  when the restore changes a cell its current sheet reads`). **While the grid still shows that sheet, the
  count of loads the plugin did not make decides (`#foreignLoadCount`, raised in `#onAfterLoadData` past
  its own-source return).** When it moved, the grid holds that load's data, and a restore would write the
  old value over it, so nothing is put back (pinned by `keeps the loaded values when loadData() on the same
  sheet drops the change`). Do not key this on `#sheetWriteCount`: a load the engine refuses
  (`#clearRejectedSheet()`) empties the sheet without counting a write, and the restore then wrote the old
  row's value into the loaded data (pinned by `keeps the loaded data when the engine refused the load that
  dropped the change`). When it did not move, every load was the plugin's own `switchSheet()` away and back,
  which loads the grid FROM the sheet, so the grid's data holds the dropped value as well, and
  `#restoreReloadedCells()` writes the old values in one `setSourceDataAtCell()` call under `suppress()`:
  its `afterSetSourceDataAtCell` puts the engine back, at the cells the first write recorded, translated
  from engine indexes, because the load built the rows from the engine sheet (pinned by `takes the dropped
  change out of the grid data when the grid switched away and back` and `puts every cell of a dropped set
  back in one source write`). A cell is restored only while the engine still holds what the first write
  left there (`WrittenCell#writtenContent`, read with `getCellSerialized()` after the write's batch): a cell
  write moves neither count, so a newer edit of the cell made after the switch back was overwritten with
  the dropped set's old value (pinned by `keeps a newer edit of the cell when a change dropped after a
  switch away and back answers`). **It restores the cells the first write
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
  engine before the change was dropped` (the removed-sheet case, which throws only with both deleted) and
  `does not put back a cell the engine refused the first write of` (the per-cell guard alone).
- **Each write is one batch, so one engine undo entry.** A grid undo never calls `engine.undo()` (it
  restores the engine from the state the plugin recorded), so only an app that calls `engine.undo()` itself
  would see a second entry. Pinned by the `setCellContents` count in `writes the out-of-bounds rows of a
  paste into the engine once, not again from afterChange`, and `does not write a dropped change past the
  last row into the loaded data` (a dropped set writes nothing).
- **The write-back repaints the other sheets' grids that read the cell** (the write scope, see `valuesUpdated` below), like
  the `afterSetDataAtCell` path: a grid on another sheet kept painting the old value while its data was
  already right. Pinned by `repaints another sheet's grid that reads the written-back cell`.
- **The write on apply validates the dependents it recalculated**, like the `afterSetDataAtCell` path: a
  dependent of a deferred change is validated only then, and a write-back after a resync validates again,
  against the settings in force at the apply (a validator an `updateSettings()` in the window swapped in,
  for one). Pinned by `validates the formulas that a write-back recalculated`.

**Overlapping async sets on one cell across a switch restore a stale old value (DEV-3308, open, now
narrower).** A cell the Core can reject is never written early any more, so this needs a cell without
`allowInvalid: false` written by two waiting sets. A second set on the same cell, written while the first is still waiting,
records the same old value as the first. When the first set applies on sheet A, the grid switches, and the
second set is dropped, `#restoreSwitchedAwaySheet` writes that old value into A over the first set's
applied value. **Compare-and-restore does NOT fix it** – the second set IS the last writer of the cell, so
its guard passes. The fix is to refresh the recorded old value of the other pending sets that wrote the
same cell when a set applies on its own sheet: a per-cell list of pending sets beside the `WeakMap`,
cleared when a set applies or is dropped. Pre-existing.

Cost: the split reads each change's cell meta once more (`getCellMetaTransient()` plus
`getCellValidator()`), as the Core does when it validates (part of the 47.1 ms above).

Tests: `__tests__/deferredValidatedWrite.unit.js`, `__tests__/validatedWriteResync.unit.js` (the resync,
switch, drop and refusal rules; its column A has a validator with the default `allowInvalid: true`, so it is
written early and restored as before, and `REJECTING_COLUMNS` sets `allowInvalid: false` for the cases that
need A to wait, the `the early-written cells of a mixed set` block among them) and
`__tests__/rejectedWriteStaysOut.unit.js` (every edit path ends with the engine and the grid agreeing after a
rejection: single cell with an async and a sync validator, a multi-cell `setDataAtCell()`, paste, autofill,
Ctrl+Enter, an `afterValidate` rejection, past the last row, a rejected formula, four overlap orders, a
reading grid, dependent validation, undo).

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

**A sheet bound by loading sets the sync endpoint before the load, and sends no order when a load
follows**
(`#loadSheet()` calls `setupSyncEndpoint(engine, sheetId, !loadsData)` right after
`#updateSheetNameAndSheetId()` and before `loadData()`; this covers `switchSheet()`, a grid built from an
engine sheet without `data`, and the plugin's own reloads). Before DEV-3760 it set no endpoint, with three
measured effects: (1) a grid built without `data` had no engine on its syncer, so the first sort or
`setIndexesSequence()` threw `Cannot read properties of null (reading 'getSheetDimensions')`; (2) its
initial `manualRowMove` never reached the engine, so formula results were wrong with no error; (3) a
`switchSheet()` on a data-built grid with a manual row move sent the re-applied move to the sheet it left
(old sheet rotated twice, new sheet never reordered). The endpoint has to exist BEFORE the load because
ManualRowMove/ManualColumnMove re-apply their arrays through `syncMoves` during it. `syncOrder` is
`!loadsData`: `false` when a load follows (an empty sheet has none, so the grid sends its order itself).
The load resets the grid's index maps, and the move plugins re-apply against identity, so sending the
pre-load order as well reordered the sheet twice (a plain `setupSyncEndpoint()` before the load measured
1, 2 and 2 order calls where the tests pin 0, 1 and 1).
Pinned by `__tests__/sheetBuiltGridSyncEndpoint.unit.js` and `tests/e2e/formulas-sheet-built-grid-sort.spec.ts`.

**A switch back to a sheet the grid left reads it through the order it was left in** (`#leftSheetOrders`,
`#rememberLeftSheetOrder()`, `#takeLeftSheetOrder()`). The first visit of a sheet moves its lines in the engine by
a configured `manualRowMove` / `manualColumnMove` array (or a sort or a drag), and the engine keeps that order
after the grid leaves. The next `switchSheet()` loaded the sheet in the engine's order as if it were physical, and
the arrays, re-applied on `afterLoadData`, moved it again: with `[2, 0, 1]`, A, B, A, B rotated each sheet on
every visit (before DEV-3760 the sheet rotated left, and the grid showed the arriving one with other rows' results, since it sent
the move to the sheet it left). Now a load that leaves a bound sheet records its engine order when it is not
physical, and a later load of that sheet reads it back in physical order through the record and takes the order
over (`#reloadKeepingOrder(data, plan, false)`: the order held, the order the load's listeners apply kept). When
nothing moved the lines after the array, the re-applied array lands on the order the engine holds and nothing is
sent. **A reorder made on the visit before (a drag) leaves the engine elsewhere**, and the hold's release sends the
difference. The release sends it as moves (`AxisSyncer#releaseAdoptedOrderAsMoves()`) when the difference is moves:
either moves alone reached the left order from physical (no order shifts, no order base), or moves reached it from
the last order the engine took as one order (`#orderPoint`, the grid sequence that order brought it to, kept with
the shifts, exported and adopted with the engine order) and the grid's order at the release is that point again.
The second case is a grid built with `data` on an engine with another sheet: its move array reaches the engine at
init as one order (the load fallback below), so the left order carries shifts, and a drag on top of it is undone by
moves on the return. The return keeps the values the grid showed before it left, not those of init: a range whose end
row the drag moved stays where the drag left it, because an engine move does not put a range end back. `sheetKept`: the sheet was not rewritten, so other sheets and named expressions followed every
move too, and `#planSafeMoves()` skips its readers-outside-the-sheet fallback; its array, `maxRows` and cost
fallbacks stay. One order there kept each moved formula's relative offsets: drag, switch away and back showed
`#REF!` (also in another sheet's `='A'!B2`) and an empty-cell `1000` (659bb5878a until this fix). A sort or a
`setIndexesSequence()` the grid does not return to (the load resets it), with or without a drag after it, or one set
in the hold, still goes back as one order, as a cleared sort or a reset sequence does on a grid that stays on the
sheet. The flag is cleared by every release, a later adoption or reload in the hold, and an order change other than a
move. **Pre-existing develop behavior, not changed here:** that data-built grid's cross-row references are off from
init (its move array goes as one order on a multi-sheet engine), and the next `updateSettings({})` after the return
moves them again (the loaded source data holds the engine's formula text, and the reload sends the one order on top
of it); develop drifts the same way, without `#REF!`. A record of another engine, or of a
sheet whose dimensions changed meanwhile (a host insert or removal), is dropped and the sheet loads as the engine
holds it; a host move that keeps the dimensions is not told apart (grid and engine stay equal, the records show in
the host's order). A sheet sorted on its last visit shows in its own order again (the load clears the sort) and
the engine follows. The records are cleared on enable, disable and `destroy()`; the sheets bar's switch holds the
order itself (`runWithEngineOrderHeld()`), so nothing is recorded or taken while an order hold is open. Pinned by
`__tests__/switchSheetRevisit.unit.js`.

**Every path that binds or fills a sheet on a live grid sets the sync endpoint up** (DEV-3760). The invariant: no
order change reaches the axis syncers while they point at no engine sheet. The paths, and what each one does:

- `#loadSheet()` (above), `#adoptEngineSheet()` (adopts a stored order), `#clearRejectedSheet()` (an empty sheet)
  and `#writeSheet()` (a load, a resync, an undo restore from the source) set it up themselves.
- The `enablePlugin()` branch that binds a sheet a shared engine still holds owes a resync, which runs at the
  next read or render. It sets the endpoint up as soon as its syncers exist, without an order
  (`setupSyncEndpoint(engine, sheetId, false)`); the resync's `#writeSheet()` rewrites the sheet and sends the
  grid's order once. Without it, an order change in that window (a sort or a move with rendering suspended, or
  right after a direct `enablePlugin()`) reached no engine: the drain put the order right, but a move was dropped
  until then and the guard below warned. An order change in the window still reaches the stale sheet, which the
  resync then replaces, so such an enable can send one order more than it ends with.
- The `enablePlugin()` branch that adds a sheet under the kept `sheetName` from the grid's data, and the
  `updatePlugin()` branch that adds one when nothing is bound, call `#setupSyncEndpointForFilledSheet()` (the
  enable once its syncers exist). Before DEV-3760 neither set an endpoint: `updateSettings({ formulas })` on a
  live grid, a re-enable with an engine class, and `disablePlugin(); enablePlugin()` all left the syncers with no
  engine, so the first sort threw `Cannot read properties of null (reading 'getSheetDimensions')`,
  and a guard that turned the throw into a skipped order left the formula column with its unsorted results.
- **The `updatePlugin()` branch no longer skips a call that carries `data`.** Core loads that data before the
  plugins update, so a plugin the same call enables never saw the load, never bound a sheet, and the grid
  showed its formulas as text (`updateSettings({ data, formulas })` on a grid built without Formulas). While a
  load is still to come (`isDataLoadPending()`) the load binds the sheet, as before; when the plugin was already
  enabled, its `afterLoadData` bound one, so the branch's `sheetName === null` keeps it out. **A call that passes
  `data` keeps it when its `sheetName` names a sheet the engine already holds** (`keepsDataOfCall`: no sheet bound
  yet, `data` in the call, no load pending): the grid's data is written into that sheet (`#loadSourceDataIntoSheet()`
  in one `#writeOwnSheet()`, whose `#writeSheet()` sets the endpoint up), as construction does. Before, both the
  `#requestedSheetName()` branch and this one called `#loadSheet()`, which loaded the engine sheet over the data the
  call had just passed. A call without `data` still loads the named sheet. Pinned by `writes the data passed in the
  same call into the sheet a shared engine already holds under the sheet name`.
- `#followEngineChange()` runs only while a load is pending, and that load fills and sets up the sheet.
- **A re-enable of a grid built from an engine sheet without `data`** (`disablePlugin(); enablePlugin()`, or
  `updateSettings({ formulas: false })` and back, with or without `sheetName`, to the same instance or to an engine
  class) goes through `#setupSyncEndpointForSheetBuiltGrid()`. The `!#hotWasInitializedWithEmptyData` check kept
  such a grid out of the resync branch above (it reads the sheet as its data, nothing is written to it), and no
  other branch set an endpoint, so a grid sorted before the disable reordered on its next sort while the engine
  kept its rows: sheet `[b, 2, =B1*2], [a, 1, =B2*2], [c, 3, =B3*2], [d, 4, =B4*2]`, sort B desc, re-enable, sort
  asc gave C `8, 6, 4, 2` for `2, 4, 6, 8`, and only the `noSyncEndpoint` warning fired. Only the old syncers knew
  the order the engine holds the sheet in, so `disablePlugin()` keeps the binding (`#sheetBuiltBindingAtDisable`:
  the engine sheet, the grid's row and column counts, the order from `exportEngineOrder()`, `null` while both axes
  are physical, and the reload snapshot `#loadedSheetContent` with `#foreignSheetChange`; cleared by the next enable
  and by `destroy()`). **One copy of the sheet is kept while the plugin is off**: the snapshot (the same array the
  grid held), from which the enable rebuilds the content of a sheet it adds back (`#sheetBuiltContent()`). With an
  order stored, the disable reads the live sheet once (`#keepSheetBuiltBinding()`): equal to the snapshot, only the
  snapshot is kept; different (a host change made after the grid's last write that no comparison found yet: a
  value, or a `moveRows()` that changes no value), the read is kept as the order's content, the snapshot is dropped
  (still one copy; a missing snapshot forces a full reload) and the change is marked foreign. A sheet added back with a foreign change is loaded as it is (`#loadSheet()`), because the stored order
  may not describe a host move. A first version kept both copies, two for a sorted grid; a second one read nothing
  and rebuilt from the snapshot, which lost such a host change when the engine class or a host `removeSheet()` made
  the enable add the sheet back (`keeps one copy of the sheet while off`, `with a host change, … before a direct
  disable`). With no order stored (both axes physical) nothing is read, and an added-back sheet is filled from the
  source data, which does not hold a host change either (pre-existing). The enable sets the endpoint up without an order and the new syncers
  adopt the stored one (`adoptEngineOrder()`), so the engine follows the grid's current order from it: a grid that
  kept its order sends nothing, and a sort or a move made while the plugin was off reaches the engine as one order
  (an adopted order is released as one order, as in "Sequence syncing"). With no order stored, the setup sends the
  grid's order by the load rule below. **The snapshot is put back too** (taken anew for a sheet added back from the content), so the
  next settings update reloads in place and keeps the sort state and the cell meta, as on a grid never turned off;
  without it that reload took `loadData()` and dropped both. A host change made while the plugin was off is still
  told by the comparison (a host `moveRows()` that changes no value makes the reload take `loadData()`).
  The binding is taken over only for the same engine sheet, or for the sheet the enable adds back from the stored
  content when the engine no longer holds it (an engine class builds a new engine). That content is written instead
  of the source data: the grid's source data holds the formula text of the engine's order
  (`#sourceHasStaleFormulas`), and filled in physical order and then reordered it read other cells (`#REF!` and
  zeros). **Otherwise the enable loads the engine sheet into the grid** (`#loadSheet()` once the plugin is enabled,
  as a switch to it would): another engine instance holding a sheet of the same name (it showed the first engine's
  records mapped onto the other sheet, and sent the grid's sort to the host's sheet), and a grid whose row or column
  count changed while the plugin was off (a row removed showed the results of other records, a row inserted showed a
  formula's text). The grid then shows the sheet as the engine holds it, in the engine's order, and the insert or
  removal made while off is dropped: the engine never got it, and a sheet-built grid reads the engine as its data.
  A host edit of the engine sheet made while the plugin was off shows mixed values until the next settings update:
  the grid keeps its source data, and the formula results read the host's values (pre-existing; the reload then
  shows the host's sheet). Edits made in the grid while the plugin was off show in the grid until the next settings
  update reloads the sheet, which drops them, as before (in between, an edited number shows next to a formula result computed from the old one); a sheet
  added back from the stored content does not hold them either (measured), while a fill from the source data (an
  engine class with no stored order) keeps them. Pinned by the `again after it was turned off, on a grid built from
  an engine sheet` cases and `sorts a grid built from an engine sheet that was sorted before Formulas was turned off
  and on` in `tests/e2e/formulas-enable-on-live-grid.spec.ts`.

**The setup sends the grid's current order the way every other load does** (`AxisSyncer#init()`, the load rule
in "Sequence syncing" above): the enable fills the sheet in physical order and starts new syncers, which know
nothing of how the grid reached its order. An order no sort set (moves, a `manualRowMove` array, a
`setIndexesSequence()` made while the plugin was off) goes as moves, so every cross-row reference stays on its
record, as in a grid built with Formulas and that move array. A sorted order (`#isRowOrderSorted()`) goes as one
order, as in a grid built with Formulas and the same `initialConfig` sort, and the next re-render sends it as one
order again, so the values do not change on it ("Sorting does not remap formula addresses" below). **Known
limit:** moves made under that sort go in the same one order, because nothing short of the sort plugins' pre-sort
order tells them apart, and reading it is the second mechanism the DEV-3760 narrowing (9d503c2047) removed; a grid
built with the move array and the sort sends the moves first and can read a cross-row reference differently. The
unit cases compare each enable against a grid that gets the same kind of call. Pinned by
`__tests__/enableOnLiveGridSyncEndpoint.unit.js` and `tests/e2e/formulas-enable-on-live-grid.spec.ts`.

**The null-engine guard in `AxisSyncer#syncOrderWithEngine` warns once and returns.** No known path reaches it.
The formulas, sheetsBar, sorting, move, undoRedo, formulaBuilder and nestedRows unit suites were instrumented and
never hit it. Reviews then found two windows, the shared-engine re-enable and the re-enable of a grid built from an
engine sheet above, and both are now closed and pinned by the `with a shared engine that still holds the sheet,
before anything reads or renders` and `again after it was turned off, on a grid built from an engine sheet` cases
(no warning, the engine follows the order). The one shape left in theory, not reproduced, is an enable whose
`#addSheet()` the engine refuses (its `addSheet()` throws): nothing is bound, so nothing sets an endpoint. It stays as a guard because a throw there ends the user's sort or move half-done; the
`warnOnce` names the lost order. The no-throw, warn-once contract is pinned on syncers unbound by hand (`warns once,
and does not throw, when an order reaches a syncer that is bound to no engine sheet`).

**Known limit: an enabled grid whose sheet the engine refused to add retries on every wrapper re-render.** The
`updatePlugin()` branch that adds a sheet runs whenever nothing is bound (`sheetName === null`), now also for a
call carrying `data`. If `#addSheet()` returned no name (the engine refused the sheet), a React or Vue re-render,
which always sends `data`, retries the add and its full source scan on every commit, where it used to retry on
settings-only calls alone. No path is known to reach that state short of an engine refusal.

**A reload of the sheet the syncers are synced with keeps the grid's order, and its state** (`#reloadInPlace()`,
or `#reloadKeepingOrder()` when anything but this grid changed the sheet). A grid built from an engine sheet without `data`
reloads that sheet on every `updateSettings()` (`#onAfterCellMetaReset`, the `#hotWasInitializedWithEmptyData`
branch, through `#loadSheet()`), and React and Vue call `updateSettings()` on every re-render. The engine holds the
sheet in the grid's order. A `loadData()` resets the grid's order, and ManualRowMove/ManualColumnMove re-apply
their arrays in `afterLoadData`: read as the engine holds it and taken as physical, the re-applied array moved
the rows once more per update and was sent to the engine again (rows `b, a, c` with `manualRowMove: [2, 0, 1]`
showed `c, b, a`, then `a, c, b`, then `b, a, c`). A `loadData()` also drops every change still waiting for its
validator (core bumps its load generation), so an edit made right before a re-render never landed, and it
resets the sort plugins' state, so a sorted grid kept its sorted rows with no sort config and `clearSort()`
could not bring the manual order back. So when the bound sheet is the one both syncers point at (same engine,
same sheet id, no `runWithEngineOrderHeld()` running), the reload:

- reads the sheet back in **physical** order (`#toPhysicalOrder()`, through `listEngineElements()` and the
  syncers' `getEngineOrder()`), after the unescape step, which already reads engine order. Physical indexes
  stay what they were, so the syncers' engine order, padded lines and order shifts stay valid.
- covers the whole axis on an axis the engine holds out of physical order: the engine leaves out trailing
  lines that hold nothing, and a blank line the order put last is one of them, so read as it is the line in
  front of it took its place. An axis in physical order is read as before, so a line emptied there still drops
  on a reload (DEV-1143) and a sheet the host replaced by a smaller one still shrinks the grid.
- **loads it with `updateData()`** (`#reloadInPlace()`), not `loadData()`, **only when nothing but this grid
  changed the engine sheet since the grid last loaded it** (`#canReloadInPlace()`); then every physical index
  still names the record it named. `updateData()` keeps the index maps, so the order, a sort, moves, hidden
  lines and manual sizes stay; ManualRowMove/ManualColumnMove listen to `afterLoadData` only, so nothing is
  re-applied and nothing
  is sent to the engine (0 order calls per update); ColumnSorting and MultiColumnSorting keep their config, the
  indicator, the order `clearSort()` goes back to, and a header-click sort that waits for the edited cell's
  validator (`#awaitingHeaderSorts`, dropped on `afterLoadData` only); and the Core keeps a change waiting for its
  validator and writes it at its coordinates of the reloaded rows, which hold the same records because the order
  is kept. Nothing of the old hold/adopt machinery runs on this path: the syncers' record is never reset
  (`setupSyncEndpoint()` is not called), so there is nothing to adopt or put back. A user's drag survives the
  update too, as on a grid built with `data`.
- **falls back to `loadData()` (`#reloadKeepingOrder()`) on any change someone else made**: the host through the
  engine API (`setCellContents()`, `setSheetContent()`, `addRows()`, `removeRows()`, `moveRows()`,
  `setRowOrder()`, and the column twins), or another grid bound to the same sheet. Such a change can move or
  replace the records under the grid's physical indexes (`fitToLength()` only cuts or appends the LAST index),
  so on `updateData()` the cell meta (`readOnly` included), a hidden row, a Filters condition and a waiting edit
  stayed on the index and landed on another record (the waiting edit was written into a record the user never
  touched, and reached the engine). The load drops all of them instead, as before this path existed. **How a
  foreign change is told** (`#canReloadInPlace()`): HyperFormula 3.3.0 emits no event at all for a host
  `addRows()`, `removeRows()` or `moveRows()` that changes no value (measured; removing a row whose formulas'
  results do not change included), so `valuesUpdated` cannot tell. The plugin keeps a **snapshot** of the bound
  sheet in the shape `getSheetSerialized()` returns (`#loadedSheetContent`): taken, copied, at every load of the
  sheet into the grid (`#recordLoadedSheet()`), and, for a grid built from the sheet only, kept in step with every
  write of this grid to the engine (`#trackOwnEngineWrite()`, run inside `#writeOwnSheet()`, `runEngineWrite()`
  and the plain `withPluginEngineWrite()` scopes of this file, so the axis syncer's own-write scope, the deferred
  write on apply, the undo and redo restore and the structural writes are all covered). A reload is in place only
  when the sheet equals the snapshot **exactly** (`areSheetContentsEqual()`, `===` per cell: formula text, `7`
  against `'7'`, an empty cell) and no foreign change was found since (`#foreignSheetChange`). Every plugin write
  runs in a scope (see "External engine changes" below), so any difference is a change someone else made, whatever
  the order or the stale formula text. The writes come in three kinds (`OwnEngineWriteKind`), so a write costs no
  more than it did before the snapshot existed, except an order or a move:
  1. **A cell write** (`'cells'`: `#writeChangesToEngine()`, which carries an edit, a paste, a validator's
     correction, the early write and the write on apply; the restore of written cells; the switched-away restore)
     refreshes only the cells of the bound sheet the engine reported changed while it ran (`valuesUpdated`,
     collected by `#collectTrackedChanges()`, read again with `getCellSerialized()` into the snapshot by
     `setSheetSnapshotCell()`, which grows the snapshot past its extent and trims the empty tail the way
     `getSheetSerialized()` does). The engine names every cell whose content is set, and every value it
     recalculated, so spilled values follow too (measured: `getSheetSerialized()` writes a spilled value as plain
     data in its cell, and a write to a precedent, a new spilling formula, a value over a spilled cell, and a
     cleared anchor all report the cells they change; pinned by `reloads in place after the grid's own writes that
     spill, change a spill, or clear one`). A cell the write set itself (`#noteOwnCellWrite()`) takes whatever the
     engine holds. A cell the engine only recalculated takes the engine's content only while neither side is a
     formula: a recalculation never changes a formula's text, so a formula that differs there (or a formula where
     the snapshot held none) is a change of someone else's, and `#foreignSheetChange` is set instead of taking it
     in. Without that rule, a host `moveRows()` of rows that hold only formulas reading the edited cell
     (`=$A$1*2`, `=$A$1*3`) was taken in by the edit's refresh, and the meta stayed on the swapped record (`takes a
     host move of rows that only recalculate from the grid's own edit as a change ...`). No check runs first: a
     host change made before the write stays visible because the cells it touched are not read again, unless this
     write set them, and then the snapshot holds what the engine and the grid both hold. A host's structural change
     shifted lines this write does not refresh, so it stays visible as well (`takes a host change made before the
     grid's own edit as a change ...`).
  2. **A structural write** (`'structural'`, the default: an order or a move from the axis syncer, MoveCells, an
     undo or redo restore of the sheet, a NestedRows detach, the sheets bar's own writes) reads the snapshot again
     in full when it ends. Read in full, it would take in a host change made before it, so it first compares the
     sheet with the snapshot, and a difference sets `#foreignSheetChange` until the next load. The two reads are
     noise next to the operation (a sort of 10,000 rows takes about 1.9 s in jsdom, a drag shows no change), and
     keeping them keeps a sorted or dragged grid in place on the next re-render, which is the point of the reload.
     Measured in headless Chrome on a 100,000 x 5 sheet-built grid (two formula columns, median of 5): the two
     reads add about 80 ms to a header sort ascending (8.19 s against 8.24 s for a data-built grid on develop, which
     cannot sort a sheet-built grid at all), about 160 ms to a descending one (17.03 s against 16.95 s), and about
     80 ms to a one-row move (0.77 s against 0.78 s; 0.27 s of serialization against 0.19 s). **Do not replace the
     read after with a permutation of the snapshot**: the engine rewrites formula text on every order it takes,
     so a permuted snapshot never equals `getSheetSerialized()` and every reload would fall back to `loadData()`.
     Measured on `[b, 2, =B1*2, =SUM($B$1:$B$4)]...`: a sort turns `=B1*2` into `=B3*2` and `=A1` into `=#REF!`
     (relative offsets kept), a move turns `=B1+1` into `=B4+1` and `$B$1:$B$4` into `$B$1:$B$3` (references follow
     their cells, and a range shrinks). Keeping the snapshot in step without the read means reimplementing the
     engine's reference transformation. The snapshot is a second full copy of the sheet for the grid's lifetime,
     needed because the engine reports no event for a host's structural change that changes no value.
  3. **An insert or a removal** of rows or columns (`'resets'`) reads nothing and drops the snapshot when it ends,
     so the next reload takes `loadData()`, as every reload did before this path existed, and takes a new snapshot;
     the re-render after it reloads in place again. The two full reads cost an insert or a removal about 20 ms at
     200k cells (84 to 104 ms in jsdom), so they were dropped (`reads no sheet when the grid inserts a row ...`).
     A host change made before it is dropped with the snapshot, so it cannot be taken in either (`takes a host
     change made before the grid's own row insert as a change`).
  Nested writes join the outermost one (`#joinTrackedWrite()`): a reset makes the whole write reset, and a
  structural write nested in a cell write turns the whole write structural (the cells collected so far are
  refreshed first, then the check runs).
  Two more details: **the load's snapshot is a copy**, because the rows the grid loads can be the very arrays
  `getSheetSerialized()` returned and the grid writes into them (an uncopied snapshot followed every edit and never
  matched again); and a validation probe takes its own write back before it ends (`isPluginEngineProbe()`), so it
  is not tracked, a write that throws counts as foreign, and a write after which the binding moved drops the
  snapshot, and so does binding another sheet (`#updateSheetNameAndSheetId()`) and `destroy()`. A cell a waiting
  change set wrote early is part of the snapshot, so a host write over it is a change:
  the load drops the set, and `#onChangesDropped` leaves the host's value, which the engine holds (`leaves the grid
  and the engine agreeing when the host writes a cell a waiting change wrote early`).
  **A grid built with `data` keeps no snapshot** (`#recordLoadedSheet()` records one only for a grid built from the
  sheet), so its writes cost nothing extra and it holds no copy of a sheet it switched to; its
  `switchSheet(<its sheet>)` takes `loadData()`, as before this path existed. A first version recorded the load's
  snapshot for it too: never kept in step with its writes, it was a full copy for the grid's lifetime that went
  stale with the first edit (review of PR #14243; pinned by `keeps no copy of the sheet on a grid built with data
  after switchSheet()`). The source rows are not compared any more: two rows
  that differ only in formulas (a report sheet reading another sheet), or only by a number against its text,
  passed that comparison when the host moved them. Do not bring it back, and do not bring back a line-count check
  either: the snapshot covers both.
- reads an axis as the engine holds it when the record no longer describes the sheet (`#planReloadAxis()`,
  `stale`): a line the engine left out while the grid holds content in it (`#readOwnSourceRows()`, the projection
  suspended) means the host removed lines or replaced the sheet with a smaller one through the engine API.
  Then the reload falls back to `loadData()` (`#reloadKeepingOrder()`): that axis is taken as physical (the
  order adopted is physical and the grid shows the sheet in the engine's order, so the grid shrinks as it does
  without a move and as it did before DEV-3760), the load runs inside `runWithEngineOrderHeld()`, the plugin's own
  `afterLoadData` (the early return for its own source) adopts the recorded order of the other axis
  (`#reloadEngineOrder`) before the move plugins re-apply their arrays, so those moves are held
  (`adoptedWhileHeld`), and the grid's order is put back after the load, so the release sends nothing. Covering
  the axis through the stale record kept phantom blank lines and moved records. Do not bound the cover with
  `getSheetDimensions()` instead: measured on HyperFormula 3.3.0, `setSheetContent()` with a smaller sheet keeps
  the old height (it would not shrink), and a `moveRows()` that puts a blank row last drops it from the height
  (the blank line would drop again). Lines the engine gained are read through the record (`listEngineElements()`
  names them after the recorded ones), and the order put back names them after the grid's lines, so the grid
  shows them where the engine has them.
  **Cost**, measured in jsdom on a 10,000 x 20 sheet-built grid with one formula column (AutoColumnSize and
  AutoRowSize off, rendering suspended, medians of five interleaved runs against `ff330cdc00`): an edit 0.8 ms
  (0.8), a row insert 75.2 ms (74.2), a row removal 75.8 ms (76.1), a re-render after an edit 24.0 ms (24.7), a
  plain re-render 22.7 ms (24.6). A cell write pays one `getCellSerialized()` per changed cell; an order or a move
  pays two `getSheetSerialized()` reads (about 8 ms each at that size) and a comparison (0.4 ms). Re-reading the
  whole sheet after every write, as a first version did, made an edit 29.5 ms instead of 14 with rendering on. The
  plugin keeps one copy of the sheet's content alive (dropped on `disablePlugin()`, `destroy()` and a switch to
  another sheet). Pinned by `does not read the grid's source rows on a reload of ...` and `keeps the state of a grid
  with blank spare rows past the sheet, reading no row`.
- sets `#sourceHasStaleFormulas` when the engine order is not physical and the sheet holds a formula: the
  engine's text names lines in the engine's order, now stored in physical rows, so a step that brings the
  order back to physical and then restructures must undo from the engine sheet, not from that text.

Do not "re-apply the array instead" on the `loadData()` path: after a drag the array is not the engine's order,
and the release then sent it with `setRowOrder`, which wrote `#REF!` (the first attempt). Do not "re-apply the
sort config" there either: ColumnSorting clears back to the order in force when it sorts, which would be the
sorted order put back.

**What a re-render of a sheet-built grid fires and keeps changed with the `updateData()` path**, to the
behavior a grid built with `data` already has on a re-render. These are user-observable, so the changelog and
the formulas guide (`formula-calculation.md`, "A grid built from an engine sheet") name them:

- **The events.** `updateSettings()` used to fire `beforeLoadData`/`afterLoadData('Formulas.switchSheet')` and
  `afterChange(null, 'loadData')`. It now fires `beforeUpdateData`/`afterUpdateData('Formulas.switchSheet')` and
  `afterChange(null, 'updateData')`. A host that rebuilt its own state in `afterLoadData`, or keyed an
  `afterChange` listener on `'loadData'`, no longer gets the call on a re-render. A reload that falls back to
  `loadData()` (any change someone else made) still fires the load events.
- **AutoColumnSize.** The load ran a full `recalculateAllColumnsWidth()` sweep on every re-render; `updateData()`
  runs none. A value the host writes into the engine sheet is a foreign change, so that re-render takes
  `loadData()` and its sweep, as before. Measured before the foreign-change gate existed, the in-place path also
  refit it from `afterFormulasValuesUpdate` (the engine reports the written cell). Pinned by `fits a column to a
  value the host wrote into the engine sheet after a re-render` in `tests/e2e/formulas-sheet-built-grid-sort.spec.ts`
  (longer, then shorter again).
- **The state.** The cell meta stays (a `setCellMeta()` value and the invalid marks survive a re-render, where the
  load dropped them), runtime hiding and trimming stay, Filters keeps its conditions and re-reads its states
  (`afterUpdateData`), FormulaBuilder's `afterUpdateData` drops its remembered focus as its `afterLoadData` did,
  and an editor that waits for its validator is not closed (a load closed it, `_endValidationWait()`).
- **UndoRedo history.** It is kept when the reloaded rows hold the same values as the ones it was recorded on, so
  an edit made before a re-render can be undone after it. The rows are compared by value for at most
  `MAX_COPIED_ROWS` (1000, `../undoRedo/sameRows.ts`), so a sheet-built grid of more than 1000 rows still clears
  the history on every re-render, as before. The first reload of a moved or sorted grid with formulas loads the
  engine's formula text, which names lines in the engine's order, so its rows differ and the history starts over
  there, once; a sheet the host changed starts it over too. A re-render after an undo of an insert or a removal
  drops the redo stack (`isRedoAvailable()` is `false`), the same as an `updateData()` with copied rows on a grid
  built with `data`: the undo is kept, the redo is not.

A first load, a switch to another sheet, and a reload inside `runWithEngineOrderHeld()` (the sheets bar) take
the old `loadData()` path, so the initial counts above (0, 1, 1) hold. A grid built with `data` reloads from the
sheet only through `switchSheet(<the sheet it is bound to>)`, which is a same-sheet reload and takes this path
too: it now keeps its order and state there, where it rotated before DEV-3760.

Six limits:

- **On the `loadData()` path, a host that reorders the engine sheet, or writes it with the same shape, is read
  through the record.** The grid shows the engine's lines where the engine has them (the record maps engine line
  `i` to the grid's position `i`), but the physical identity of the records drifts. The load drops the state
  keyed by physical indexes, so nothing lands on the wrong record; the identity of the rows themselves still
  drifts. Two grids that reorder one sheet were already broken before this.
- **A foreign change that leaves the serialized sheet exactly as it was is not seen** (two identical rows swapped,
  a cell written with the content it holds). The records under the indexes hold the same content then, so the
  state follows content that is the same.
- **A plugin write that bypasses `#trackOwnEngineWrite()` reads as foreign** (none known: every engine mutation
  of this file runs in one of the tracked scopes), and so would a cell write the engine reports no change for while
  it runs. Measured, neither host wrapper causes that: under a host's `suspendEvaluation()` the plugin's own
  `engine.batch()` resumes the evaluation (as on `ff330cdc00`), so `valuesUpdated` fires inside the tracked write
  and the reload stays in place; inside a host's `batch()` the grid's write throws `Batch mode wasn't started` (as on
  `ff330cdc00`), the value still lands, and the next reload agrees. Such a write costs only the old behavior on the
  next re-render; it would hide a foreign change only if a host change exactly undid it.
- **A cell write takes in a host change to non-formula content of a cell it recalculates.** A spilled value is
  plain data in the serialized sheet, so a host write of a plain value into a cell that the grid's own edit then
  spills over is taken in with the spill. So is a host value a spill now runs into (the anchor shows `#SPILL!` and
  the host value stays, `=SEQUENCE()` grown over a cell the host wrote): the engine reports that cell, and neither
  side holds a formula there. In both cases the cell holds what the engine and the grid both hold, and no record
  moves. A formula is never taken in this way (see the cell write above).
- **A host that removes only lines that are blank in the grid is not detected.** The check needs a line the
  engine left out that holds content in the grid, so after the host removes the blank row a move put last
  (`removeRows()` on rows `[a], [null], [c]` with `manualRowMove: [2, 0]`), the grid keeps that blank row
  while the engine has two. Nothing is lost, since the line was blank.
- **A reload after the host inserted or removed lines is a `loadData()`**, on an axis in physical order and out
  of it. On that path the cell meta, the hidden lines, the Filters conditions, the waiting edits and the sort
  state are dropped as before (on a moved axis the rows keep the order put back), because the grid's physical
  indexes no longer name the records they named. The host changed the sheet behind the grid, so the records under
  that state are not the ones it was set on anyway. The same holds for any other foreign change.

Pinned by the `Formulas reload of a moved sheet-built grid` block in
`__tests__/sheetBuiltGridSyncEndpoint.unit.js` and by `__tests__/sheetBuiltGridReloadState.unit.js`. They cover:

- rows, columns, both, a new array;
- a drag with `true` and with an array;
- the cross-row results of the rows and the drag case;
- a blank line the move put last, and the trailing blank lines of the sheet;
- a host that shrinks the sheet by `removeRows`, by a smaller `setSheetContent()`, or by `removeColumns`;
- a host that adds a row at the end or in the middle;
- a host that removes or inserts rows or columns on a grid without a move, and a host that removes one row and
  inserts another, rewrites a cell or moves a row (with and without a move), also on a sheet whose rows differ
  only in formulas or only by a number against its text, and a host change made before an own edit: the cell
  meta, a hidden line, a Filters condition and a waiting edit are dropped, not moved onto another record; blank
  spare rows do not count; a host write over a cell a waiting set wrote early leaves the grid and the engine
  agreeing; a host change before the grid's own row insert is seen; the grid's own writes that spill, change a
  spill or clear one stay in place;
- a moved, dragged and sorted grid with cross-row formulas reloads in place on every re-render;
- the grid's own edits (a number typed as text, a formula), a hidden row, a cell meta value and a sort survive the
  re-render that follows them;
- sorting, the sort config and indicator across reloads and `clearSort()` back to the manual order (both
  sorting plugins, with and without a move);
- a change waiting for its validator across a reload, accepted and rejected, without a move, with a move and
  with a sort, and a header-click sort that waits for it;
- undo of a move, undo after the order came back, and undo of an edit made before a reload.

The `updateSettings()`, sort-state and waiting-edit steps of `tests/e2e/formulas-sheet-built-grid-sort.spec.ts`
cover it in a browser.

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
  `exportEngineOrder(true)` also returns the engine sheet's content (`#readableSheet()` of
  `getSheetSerialized()`), for a caller whose sheet will be bound to another engine sheet later (an engine
  built from the class, or one the next load overwrites). An `adopt` that carries `content` is taken over
  by the first load whatever sheet it binds, and `#adoptEngineSheet()` writes the content with
  `setSheetContent()` before it adopts the order. The content is always written, even when the binding
  matches the stored engine and sheet id: a grid-level class keeps one engine sheet, which the loads of
  the other sheets overwrote in between.

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
- **The syncer records how far each order moved a line (`#orderShifts`, `getOrderShift()`).** An order
  (`set*Order`) keeps a moved formula's relative offsets, a move, an insert, and a removal keep its
  references on their cells, so a caller reading the engine's text back into the data (the sheets bar's
  write-back) shifts back only the order's part. The shifts add up per physical line, re-key on an insert
  or a removal like `#paddedElements` (a removed line's entry is dropped), travel in
  `EngineOrder.orderShifts`, and clear once the order is physical again, where the engine's text is the
  data's. Pinned in `axisSyncerOrderShifts.unit.js`.
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
core's init sequence (`initializePlugins()` in `../base/base.ts`), which runs inside `beforeInit`, before
`updateSettings()` registers the `beforeAutofill` option. The last callback that
returns a value wins, so the option and any `addHook()` made after enabling beat the plugin, while a global hook,
an `addHook()` made before enabling, and the option when Formulas is enabled later lose. `updatePlugin()` keeps
the hook where it is, but `disablePlugin()` plus `enablePlugin()` re-adds it at the END of the `orderIndex` 0
group and flips the winner. Only `addHook('beforeAutofill', cb, 1)` is independent of timing. Pinned by
`tests/e2e/formulas-before-autofill-precedence.spec.ts`. Do not change the plugin's `orderIndex` or its
registration point without treating it as a behavior change.

## Sheets other grids are bound to

`getSheetNamesBoundElsewhere(engine)` (`@private`) names every sheet of `engine` that a Handsontable instance
other than this one is bound to, read from the engine registry list (`getRegisteredHotInstanceList()`). Not `getRegisteredHotInstances()`: its map is keyed by `sheetId`, so two grids on one sheet collapse into the later one. The sheets bar
leaves those sheets out when it builds tabs from a shared engine, so it never lists, renames over, or removes
another grid's sheet. It takes the engine as an argument because the bar asks before it binds a sheet.

## Engine-detach listeners

`addEngineDetachListener()` (`@private`) lets another plugin release what it subscribed on the engine
before the engine goes away. In `disablePlugin()` they run FIRST, before any cleanup, and in `destroy()`
right before `unregisterEngine()`; the engine still works in both: an engine the plugin built itself is
destroyed right after, when this grid was its last user. The FormulaBuilder plugin destroys its builder
there, and that cancels an open formula edit, whose render runs this plugin's `afterRenderer`. Run after
the `HYPERLINK` cleanup, that render wrapped the anchors again and refilled `#hyperlinkCells`. The
listener set lives on the plugin instance across enable cycles and is cleared in `destroy()`.

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

A plugin write runs inside `withPluginEngineWrite` (`indexSyncer/pluginEngineWrite.ts`), a per-engine scope. While one is open, the listener only hands its grid's paint to the scope. When the outermost scope on that engine ends, in a `finally`, each such grid paints once. A paint that throws does not stop the others, and the first error is rethrown to the caller after all have run (unless the write itself threw), as a dependent grid's render error reached the caller on develop. The scope is dropped before the paints run, so an engine write a paint's `afterRender` makes is an external write. HyperFormula emits inside `batch()` before `batch()` returns, so the scope wraps the `batch()` call, not a `setCellContents` nested in it. The grid that made the write is left out through `#writeOwnSheet()`, because the Core or the caller paints it. Plain `withPluginEngineWrite` is used where this grid must paint too (the `restored` undo write, the public `addSheet`, the restore of a dropped set). The deferred write of a change set (`beforeChangeRender`, past-the-last-row changes included) goes through `#writeOwnSheet()`, because the Core renders right after it. The axis syncer reaches `#writeOwnSheet()` through `IndexSyncer#getOwnEngineWrite()` for the two writes that emit: `batch` in `syncMoves`, and the order write in `#syncOrderWithEngine()`. The latter is one scope around the whole write, so the pad (`setCellContents` twice, then `setRowOrder` / `setColumnOrder`, see "The engine's sheet size" below) paints a dependent grid once, not once per engine call. `#isOrderAllowed()` only reads, and stays outside it. Pinned by the `a padded sheet, with a second grid that reads it` cases of `__tests__/externalEngineRender.unit.js`: a sequence or a sort that pads the sheet paints the dependent grid once and the editing grid not at all or once (its own sort render), where an unscoped write painted the editing grid one extra time. The SheetsBar plugin calls `Formulas#runEngineWrite` for its own engine calls, so a standalone grid on the engine paints whether or not the bar's grid has Formulas bound to it. A missing engine (a listener disabled the plugin mid-flow) runs `fn` with no scope, as develop did: `withPluginEngineWrite()` takes `null`, so a call site passes `this.engine` without `!`. A repaint that throws at the end of `addSheet` does not undo the registration: `#addSheet()` returns the name the engine took and the paint errors apart, `enablePlugin()` and `updatePlugin()` bind the sheet first and throw the first paint error at the end of the call, and the public `addSheet()` throws it after the sheet is in. Reading the error as "no sheet" left the grid unbound, and the next sync added a second sheet. A new plugin write needs a scope, or the listener paints it once per emit.

A grid whose data is written into its sheet registers it inside one `#writeOwnSheet()`: `addSheet` re-resolves a formula in another grid that named the sheet first (`#REF!` becomes the cell's value, or empty), and the fill follows. On the `updateSettings` path the fill comes later, from `#resyncSheet()` at the first render, so the registration scope calls `holdPluginEngineWritePaints()` and the grids it named paint when the resync scope ends, once, after the data is in. A grid whose fill never comes (a throw before the resync) keeps its stale paint until the next plugin write on that engine. A grid built from the sheet (`#hotWasInitializedWithEmptyData`) writes nothing and registers unscoped. `updateConfig` is not wrapped: it does not emit `valuesUpdated`.

## `batchEvaluation`: one recalculation per suspended execution (DEV-202)

With `formulas.batchEvaluation: true`, the plugin writes a grid makes while its execution is suspended
(`batch()`, `batchExecution()`, `suspendExecution()`) are recalculated once, when it resumes. Off (the default),
every path below takes the branch it took before: no hold exists, so `runEngineBatch()` is `engine.batch(fn)`.

- **The hold is per engine** (`engine/evaluationHold.ts`, a module-level `WeakMap`). A grid joins it on
  `afterSuspendExecution` (the setting is read there, live) and leaves on `afterResumeExecution`. Every render
  suspends the execution (AutoColumnSize, AutoRowSize), so join and leave must stay a `Set` add and delete: the
  engine listeners are attached at the first suspension the plugin makes, not on join.
- **Lazy suspension.** The engine is suspended at the first plugin engine write made while the hold has a
  holder (`beginHeldEngineWrite()`), so a suspension that writes only index maps (filters, hiding, autosizing)
  never touches the engine. Any grid's write joins an owned suspension, a grid that did not opt in included.
- **The join helper replaces the 11 plugin `engine.batch()` calls** (`runEngineBatch(engine, fn,
  { joinsAnySuspension, movesCells })`): an owned suspension, or one started now, is joined and returns `[]`;
  otherwise `engine.batch(fn)`, so a host-owned suspension is ended as before. `#restorePeerRewrites()` and
  `AxisSyncer#extendAndSetOrder()` pass `joinsAnySuspension`: they already joined any suspension. The direct writes
  (`#writeSourceChangesToEngine()` forward, `addRows`, `addColumns`) call `beginHeldEngineWrite()` and keep their
  direct call. `#writeSheet()` calls `beginHeldSheetWrite()` first, only while the engine is held (an empty write
  scope would release the paints `holdPluginEngineWritePaints()` parked), before `#internalOperationPending`: it
  joins a suspension that is open and never starts one. `#clearRejectedSheet()`, `#loadEngineSheet()` (the restore
  flushes before it) and `#adoptEngineSheet()` (a load, see below) are unchanged. `paste()` throws while suspended,
  so the MoveCells copy flushes first and stays unheld.
- **A removal never shares a recalculation with a cell write.** The two removals pass `movesCells`, and so does
  a sheet write (`beginHeldSheetWrite()`); a held write of the other kind than the ones held since the last
  recalculation recalculates those first (`heldWriteKind`). A cell write that shared a recalculation with a removal
  validated the `#REF!` the removal made (a row or a column), which nothing validates without the option, and a
  sheet rewrite that joined a held write validated every cell it set. Inserts, moves, orders, `moveCells` and the
  restore pass nothing: no test showed a difference, so they join.
- **Before an insert, a removal or a move, the held writes are validated, not only recalculated**
  (`#validateHeldWritesNow()`, `takeHeldRecalculations()`). HyperFormula reports the changes of a suspension that
  set a cell and then moved it at the addresses from after the move, while the written cells are recorded at the
  addresses from before it (a formula write, then an insert above it: the release validated the cell above the
  dependent `SUM`). The grid moves its cells before the engine does (`afterCreateRow` writes the engine), so they
  are validated from `beforeCreateRow`/`Col` and `beforeRemoveRow`/`Col` (not for `auto`, which adds and gives back
  rows at the end), `beforeRowMove`, `beforeColumnMove` and `beforeColumnSort` (a write, then a sort: the order
  reports every value cell it moves at its new address, and the release validated them all). The sort listener
  also runs for a sort that is cancelled or impossible, which costs one early recalculation and validation, the
  per-write result without the option. A freeze, `moveCells` and a NestedRows detach showed no difference and
  have no listener. A sort that comes BEFORE a write inside the same `batch()` takes effect
  when the batch resumes, because the index mappers are suspended until then. So the write lands on the row the
  unsorted order names, and its dependents are validated at the release, on the sorted rows, which hold the
  write (`hot.batch(() => { sort; setDataAtCell(4, 0, 50) })` on the `runValidatedBatch` fixture: `5:2=100`, the
  row that holds the 50 after the sort). Without the option the dependents are validated at the write, against
  the mapping that is not sorted yet, so `afterValidate` reports `4:2=66`, an untouched row (develop does the
  same). The option's result is the right one, so the sort-then-write case is pinned with the option on only
  ("validates the row that holds the write after a sort inside the batch"), not against parity with the option
  off. `switchSheet()` validates in
  `#loadSheet()`, before the load.
  `beforeLoadData`/`beforeUpdateData` validate only the other sheets' dependents (`leavingSheetId`): the Core
  destroys the data map before those hooks, so the dependents on this grid's own sheet of a write made before a
  host's `loadData()`/`updateData()` in the same hold are not validated (without the option they are, against the
  data the load replaces; pinned by "never validates the loaded data ..."). A throw there is reported with `warn`,
  or the load stops with no data map.
- **Ownership is `owned` AND `engine.isEvaluationSuspended()`.** An `evaluationSuspended` listener sets `owned`
  from `suspending`, which is set only around the plugin's own `suspendEvaluation()`. HyperFormula 3.3.0 emits
  `valuesUpdated` BEFORE `evaluationResumed`, and a listener of the first can suspend the
  engine again, so the `evaluationResumed` listener always records the change list, but drops `owned` and runs the
  deferred reads (`runAfterEvaluationFlush()`) only while the engine is still resumed. Every resume is recorded,
  whoever makes it: a host's `resumeEvaluation()` that ends the plugin's suspension leaves nothing to resume
  later, and its changes are still validated. Pinned by "a suspension the host owns" (red without the listener).
- **The plugin's own resume claims its recalculation after it returns** (`claimOwnRecalculation()`). An
  `afterFormulasValuesUpdate` listener runs inside the resume, before its `evaluationResumed`, and a write it makes
  resumes first (an unheld `engine.batch()`, or a `hot.batch()` of its own): read at event time, `hold.changed`
  gave those inner resumes the outer writes' cells, and the outer recalculation validated nothing. So
  `flushEvaluationHold()` takes `hold.changed` before `resumeEvaluation()`, and once it returns it finds its own
  entry by the change list (the event and the return value are the same array) and gives it those cells; cells
  written during the resume go back to `hold.changed`. `resuming` is a depth counter: a nested release resets
  nothing, so its settle leaves the end of the hold to the outer release.
- **Flush on read.** `#flushEvaluation()` comes after the cheap type early return, so a plain cell never ends
  the hold: `#onModifyData`, `#onModifySourceData`, `#onBeforeValidate`, `#onPaintFormulaText`,
  `#onBeforeCopyOrCut`, `#getHyperlinkHref`, `#onBeforeAutofill`, `#captureEngineSheet`,
  `exportEngineOrder(true)`, `#loadSheet` (before the switch), the MoveCells copy, `#syncHotDataAfterMoveCells`,
  `#syncPeerSources` (only when a peer grid writes), the `#restoreStructure` pre-read and `#onChangesDropped`.
  Other plugins call the `@private` `flushEngineEvaluation(engine?)`: FormulaBuilder (`afterRenderer`,
  `#readCellText`, and `commitInlineEdit()`/`commitInlineEditToSelection()` right after their
  `finishEditing()`), ExportFile (`getNamedExpressions`, `getEngineCellFacts`), SheetsBar (`#flushEngine` before
  `planEngineWorkbook()`, the copy's named expressions and serialized sheet, `getFillRangeData`) and ImportFile
  (before the mapping). `#readEngineContent()` after a
  `setDataAtCell()` write is deferred, not flushed: it would recalculate once per write.
- **AutoColumnSize needs no pre-draw recalculation.** Recalculating a holder from `#onBeforeRenderStart`, ahead of
  AutoColumnSize's `beforeRender` listener, was tried (an `afterFormulasValuesUpdate` that fires after that
  listener consumed its queue looked able to paint a changed value at the old width) and removed: in a browser a
  full render makes AutoColumnSize sample the visible columns, and the sampling reads the cells through
  `modifyData`, which recalculates first, so no draw paints the new value cut off (`tests/e2e/
  formulas-batch-evaluation.spec.ts`, "measures the formula column before the draw"). Do not add the earlier flush back
  without a reproduction in a real browser.
- **`#onBeforeRender` flushes only for a grid that holds the engine.** Unconditional, a second grid that writes
  inside the first grid's `batch()` ended the hold on each of its own renders. A non-holder therefore flushes from
  the first formula cell of its draw. A paint asked for while this grid prepares a draw that starts with the engine
  held (`#onBeforeRenderStart`, `beforeRender` at `orderIndex: -1`, to the end of `#onBeforeRender`: AutoColumnSize's
  sampling reads cells in between) or draws a held engine (`#isDrawingHeldEngine`, to `afterRender`) is left to that
  draw
  (`#deferPaintToDraw()`), never rendered inside it. A full draw reads every cell after the recalculation, so
  nothing more is needed. A fast draw (a selection) repaints only what it adds, so `#onAfterRender` renders once
  more: dropping the paint there left the formula cells on screen at their old values. A draw that throws never
  reaches `afterRender`, so a microtask (`#onDrawEndCheck`) resets the state and paints. A draw that starts with
  nothing held paints as before, so the option off changes nothing there.
- **Validation.** A held cell write records its cells (`recordHeldWrite()`). Each recalculation keeps the cells
  the writes before it set, and the release validates the dependents of every recalculation that ended held cell
  writes, minus those cells, each cell once (`collectHeldDependents()`). A recalculation with no held cell write
  (a load, an insert, a host batch) validates nothing, as before. Undo and redo need their change list at once
  (DEV-2036): `#runRestoreWrite()` flushes right after the write and takes that recalculation out of the hold
  (`flushEvaluationHoldNow()`). **Each dependent is validated by the grid bound to its sheet**
  (`#validateHeldDependents()`), whichever grid ends the hold or inserts, removes, moves or loads before it:
  `validateDependentCells()` used to check an address against the size of the grid it runs on, so a one-row grid
  that inserted a row inside a taller grid's `batch()` skipped every dependent below its first row, and a grid
  built inside the hold (no data map yet) read its row count from nothing. It now bounds and translates through
  the grid bound to the dependent's sheet itself; the held path still hands each dependent to that grid's plugin.
- **A grid that leaves while another grid on the engine is still suspended recalculates and validates its writes
  anyway** (`#recalculateAndValidateHeldWrites()`, from `#releaseEvaluationHold()`): the hold stays open for the other
  grid, but this grid's execution is over, and left to the last grid's release its dependents would wait for a
  resume that may never come (a grid that suspends across an `await`). Without the setting they are validated at
  once. Pinned by "validates the dependents of its writes when it leaves".
- **Release.** The grid leaves first, then the flush and the settle run in one write scope, so the grids paint
  after the validation. A paint can suspend a grid's execution again (its render's autosizing), so a release
  re-entered during the plugin's own resume (`resuming`) leaves the end to the outer one. When the host holds the
  engine suspended, the hold ends and validates at the host's resume, unless a grid holds the engine again before
  then: `joinEvaluationHold()` clears `onSettled`, so that grid's release ends it. Left set, the host's resume
  kept the hold open, and the next owned resume ended it from its own `evaluationResumed`, before it claimed the
  cells of its writes, so their dependents were never validated. The settle runs in a `finally`, so a throwing
  `afterFormulasValuesUpdate` listener leaves no stale entries for the next hold. A holder's `disablePlugin()`
  releases first and drops `#sheetResyncPending` before it: the validation reads the grid, which drained the owed
  resync into an extra full write (measured); a grid that holds nothing keeps the old order. `destroy()` releases after its engine listeners are off and before `unregisterEngine()`: the
  view, the data and the index mappers are gone by then, so its own sheet's dependents are skipped and the grids
  bound to the other sheets validate theirs. A sheet switch only flushes; the grid stays a holder.
- **A release a throwing listener skipped is made before the next draw.** `Hooks.run` runs the global bucket
  first, so a global `afterResumeExecution` listener that throws skips the plugin's release whatever its
  `orderIndex`, and the grid stayed a holder: every later plugin write on the engine, from any grid, was held.
  `#onBeforeRender` of any grid on the engine takes out the holders whose execution is not suspended
  (`leaveResumedHolders()`) and ends the hold when none is left. A `batch()` renders on its way out, so its hold
  ends there; a `batchExecution()` or a bare pair keeps the engine held until any grid on it draws. A read
  recalculates the held writes but leaves the stale holder in place, so the next write is held again. `enablePlugin()`
  resets the draw state (`#isPreparingDraw`, `#isDrawingHeldEngine`): a plugin turned off inside a draw never
  reached the listener that ends it, and the next engine change was then left to a draw that never came.
- **`SHEET()`/`SHEETS()` under an owned suspension** clear the engine's undo stack at once, without resuming.

Measured on the 11x3 fixture (jsdom, HyperFormula 3.3.0, `valuesUpdated` with the option off / on): ten
`setDataAtCell()` in `batch()` 10 / 1; in `batchExecution()` 10 / 10 and in a bare `suspendExecution()` pair
10 / 10 (each write renders, each render flushes); ten formulas into plain cells in `batch()` 1 (on); ten `setSourceDataAtCell()` in
`batch()` 10 / 1; a write, an insert, a write and a removal in `batch()` 3 / 3 (each structure change validates the
writes before it); ten writes over formula cells in `batch()` 10 / 1; the undo and the redo of the batch 1 each.
**`#onModifySourceData` reads a formula cell with `getCellFormula()`, not `getCellSerialized()`.** The Core reads
the old value of every cell it writes there, and `getCellSerialized()` (`getCellFormula() ?? getRawValue()` in
HyperFormula) refuses while the engine is suspended, so a flush per write made ten overwrites 10 / 10. The text
needs no recalculation. Only a cell with no formula of its own (a value an array formula spilled) still flushes
and reads `getCellSerialized()`. Pinned by the two `getSourceDataAtCell()`/overwrite cases; the spilled-value flush by the
"a value an array formula spilled" cases (removing it throws "Computations are suspended"). **Known limit:** ten
formulas written into a validated column (`numeric`, `date`, `dropdown`, a `validator`) in `batch()` stay 10 / 10:
`afterSetDataAtCell` writes the engine before the Core validates (`core.ts`), and `#onBeforeValidate` reads the
formula's value for the validator. It is in the guide.
Other limits: a later write
to the same cell in one hold makes `writtenContent` the later content; a cell written in a hold is validated by the
Core only, also when a later write in the same recalculation changes it; the last holder leaving inside a host's
resume (its `valuesUpdated`) ends the hold before that resume is recorded; and a Walkontable scroll draw fires no
`beforeRender`, so a hold that outlives the task (a host pair across an `await`) can paint a grid inside such a
draw. Tests: `__tests__/batchEvaluation.unit.js`.

**How the hold meets the DEV-3760 paths** (merged after both landed):
- **The deferred write of a change the Core can reject** (`#onBeforeChangeRender`) joins a hold like any cell
  write, so it reports no dependents; `#validateChangedDependents()` records its cells (`recordHeldWrite()`) and the
  release validates their dependents, against the recalculated values. That validation runs where the release runs
  (the resume), not outside the edit's undo step as `#validateDependentCellsUnrecorded()` does without a hold. The
  dependents the early write left to the apply (`heldDependents`) are still validated at the apply, which flushes.
  The early write of the immediate changes is validated as develop's `afterSetDataAtCell` validated it. Its cells
  are recorded (`recordHeldWrite()`) **before** the probe: the probe can flush the hold, and a flush whose
  recalculation names no written cell validates nothing (`collectHeldDependents()`), so recorded after it the
  dependents of the early write were never validated.
- **The validation probe flushes the hold first** when the set has something to probe (a deferred formula or a
  reader): it writes and reads the engine, and a suspended engine would skip it and hand the validator the formula
  text. A set with nothing to probe keeps the hold. A flush runs before `#readValidationValue()` too.
- **The sheet snapshot of a grid built from a sheet (`#trackOwnEngineWrite()`) survives a `'cells'` write made
  while the plugin holds the engine suspended.** `getSheetSerialized()` and `getCellSerialized()` refuse then, and
  the engine holds its `valuesUpdated` back until the resume, so the write keeps its cells in `#heldSnapshotCells`
  (`#holdTrackedCells()`) and one deferred read (`runAfterEvaluationFlush()`) takes them into the snapshot once
  the engine resumes, with the cells that resume's `valuesUpdated` names (`#refreshHeldSnapshotCells()`, by the
  rule of `#refreshTrackedCells()`). Dropping the snapshot there made every `updateSettings()` after an edit inside
  `batch()` reload through `loadData()`: the rows stayed sorted with an empty sort config, and the cell meta was
  gone. A `'structural'` or `'resets'` write made while suspended still drops the snapshot, and so does a cell
  write inside a suspension the host owns (nothing tells when the engine can be read); the deferred read does
  nothing when the snapshot it was recorded against is gone. A host's plain value written into a plain cell inside
  the plugin's hold comes in with that resume and reads as a recalculated cell, so the reload stays in place and
  shows it; a host change that moves a formula still reads as foreign. The disable's `#keepSheetBuiltBinding()` and
  the enable's `#recordLoadedSheet()` flush before they read. Tests: `__tests__/sheetBuiltGridReloadState.unit.js`
  ("with batchEvaluation").

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
