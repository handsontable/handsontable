# UndoRedo plugin — transactions, snapshots and a journal

The `undoRedo` plugin records every user action as one **step** and restores it on undo and redo. A
step never replays the action backwards. It holds a **snapshot** of the grid state before and after the
action, and a **journal** of the data and cell meta the action changed. Undo restores the "before"
snapshot and replays the journal backwards; redo restores the "after" snapshot and replays it forwards.
Read this before touching anything in this directory, `core/operationScope.ts`,
`dataMap/dataJournal.ts` or `translations/indexMapperSnapshot.ts`.

`PLUGIN_PRIORITY = 1000` (the highest), and `SETTING_KEYS` is `true`.

## Files

| File | Role |
|---|---|
| `../../core/operationScope.ts` | The transaction scope, one per `Core`: `run()`, `hold()`/`resume()`, `suppress()`, the journal |
| `../../dataMap/dataJournal.ts` | Journal entry types and the recorders `DataMap` and `Core` call |
| `../../translations/indexMapperSnapshot.ts` | Copy-on-change capture and restore of every index map on one axis |
| `snapshot/gridState.ts` | `GridStateTracker`: both axes, the plugin states, the settings `alter()` changes |
| `entry.ts` | Builds the public step (`actionType`, `changes`, ...) and the selection each direction puts back |
| `restore.ts` | `restoreStep()`: the restore order below, veto handling |
| `restoredCells.ts` | The cells a restore wrote, addressed in the grid it leaves behind |
| `stepColumns.ts` | Whether a step addresses a column whose field a `columns` update changed |
| `undoRedo.ts` | The stacks, the hooks, the epoch, the settings check, the legacy `done()` path |

## How a step is recorded

1. **Every mutator opens an operation.** Core entry points (`setDataAtCell`, `populateFromArray`,
   `alter`, `setCellMeta`, `batch`, ...) run inside `operationScope`; plugins call
   `this.runOperation(name, fn)` (`BasePlugin`). The outermost operation opens a **transaction**; nested
   ones join it and only append to `operations`. The root name becomes the step's `actionType`.
2. **The journal is written at the lowest level**, not from hooks: `DataMap` records row and column
   inserts and removals (the removal content included), `Core` records cell writes (raw source values,
   read with `getRawAtCellByProp`, never through `modifySourceData`) and `setCellMeta`/`removeCellMeta`.
   `recordMetaRowsShift()` covers meta rows moved by hand (NestedRows, `spliceCellsMeta`).
3. **Validation is asynchronous**, so a write holds its transaction (`hold()`) and applies the changes in
   `resume()`. A held transaction is off the stack, so a new action opens a new one: **the undo stack
   is in commit order**, not call order. `validateCell()` takes a hold of its own and runs the
   validator, `afterValidate` and the callback inside `resume()`, so **an async continuation keeps
   the recording context of the call that started it**: a `setCellMeta()` from `afterValidate`
   joins the edit's step instead of becoming a step of its own. A hold taken while recording is
   suppressed resumes suppressed (`OperationScope#hold()`), so the re-validation after a restore
   stays unrecorded. The no-validator branch takes no hold on purpose: Formulas validates dependents
   on every edit, and a hold there made every edit settle a tick later.
   **A continuation that throws settles its transaction at once** (`OperationScope#broken`): a
   validator that throws never leaves the `ValidatorsQueue`, so the hold of the change waiting for
   the queue is never released, and a structural step would block undo for the grid's life. The step
   is recorded with what it did before the throw (UndoRedo never reads `aborted`). A hold of it
   resumed later runs as an operation of its own, never inside the settled transaction - the record
   holds `transaction.journal` by reference, so an entry appended after the push would change a
   recorded step.
   **Commit order has one exception: a transaction that settles while a RECORDED one is held AFTER it
   already journaled a change joins that one's step** (`#findHost()`, `#joined`). The host's early
   changes (a `batch()` that removed a row before its validated edit) come before the other
   transaction's and its later ones after, so undone apart, one of them replays at addresses the
   other renumbered - a meta write on the row below a removal was undone at the post-removal row.
   While such a host is pending, `#onTransactionOpen` neither moves `#lastState` nor runs the
   structure check: the host's partial changes are its own, not changes made outside any step.
   **An unrecorded transaction is never a host** (root source `auto` or `UndoRedo.*`, or opened under
   `ignoreNewActions`): it records no step, so an edit that joined it was lost with it - a public
   `runOperation(name, fn, 'auto')` with an async-validated write dropped the user's edit made
   meanwhile. While one is held, `#onTransactionOpen` moves `#lastState` past its partial changes (the
   next step starts after them) but skips the structure check, and its own settle judges its journal
   against the lengths it started from, read back with `readStartLengths()` - `#lastState` has moved
   past its first changes by then, so judged against it, its row added at the end read as a row
   added in the middle and dropped the history. The
   joined journals are merged by the order their entries were recorded (`OperationScope#append()`
   stamps every entry; `getEntryOrder()`), and a forward cell write merges into its last entry only
   while that entry is still the latest recorded anywhere (`isLatestEntry()`). Two plain async
   edits journal nothing until they resume, so they still stack in commit order.
4. **Undo and redo wait for a held change.** While a held transaction that already journaled a
   change waits for its validator (`#hasHeldChange()` - the host of step 3, or an unrecorded one),
   `isUndoAvailable()`/`isRedoAvailable()` answer `false` and `undo()`/`redo()` do nothing - the grid
   holds half of a change no recorded state describes. It is any change, not only rows or columns:
   a row removal that joins a host whose own journal holds only meta left `#lastState` behind, so an
   undo read it as a
   change made outside any step and dropped the whole history; and undoing an earlier row insert
   moved the meta the host had written away from the row its journal names. A call made then is
   dropped, not queued. A plain edit waiting for its validator journals nothing yet and blocks
   nothing. Corner: a validator that never answers (as opposed to one that throws), in an operation
   that also changed something first, blocks undo until `loadData`/`updateData`. In a recorded
   operation it also takes in every edit made after it: each one joins that host (step 3), so none
   becomes a step of its own.
5. **Each `writeChangesToData()` call journals its own cell run** (`ReversedCellRun`): it appends
   only while its own entry is still the last one. A nested write from `afterChange` therefore gets
   an entry of its own after the outer one, instead of being merged into the outer run's reversed
   order. Writes without a run (`setSourceDataAtCell`) keep merging forward. **A source write that
   leaves the raw value as it was is not journaled** (`writeSourceChange` compares the raw values by
   reference): the value the cell already held, or a row past the end that `setAtCell()` never
   reaches. `setSourceDataAtCell()` was never recorded before the journal, and a no-op step would
   only empty the redo stack. **A grid write (`writeChange`) is journaled even then**: an edit that
   writes the value the cell holds is an undo step, as it always was - `UndoRedo.spec.js` pins it
   ("should save the undo action even if a new value is the same as the previous one"). The old
   recorder's `hasDifferences` was computed and never read, so do not take it as a precedent.
6. **The step's source is the one `beforeChange` reports.** `setDataAtCell()` and
   `setDataAtRowProp()` record `'edit'` for a call with no source, and every data setter takes an
   array-form source from its second argument (`readOperationSource()` in `core.ts`, the one place
   that reads it - the `setSourceDataAtCell` wrapper once missed the lift). The bodies keep their own
   lift, which also takes a non-string second argument, for the hooks. `setSourceDataAtCell`'s body
   has none: it reads its replay flag through `readOperationSource()` too (its body once missed that,
   and ran the `valueSetter` and validator again on an array-form undo), and passes the fourth
   argument to its hooks and validator, as it always did.
7. **`batchExecution()` is an operation like `batch()`** - everything inside it is one `'batch'` step.
8. **On settle** (`#onTransactionSettle`) the tracker captures the "after" state. "Before" is the state
   the previous step ended in, read at settle time - so a step that committed while this one waited for
   a validator is not undone together with it, unless it joined this one (step 3). A transaction with an empty journal and an unchanged
   snapshot is not recorded. `BLOCKED_SOURCES` (`UndoRedo.undo`, `UndoRedo.redo`, `auto`) are judged
   by the ROOT source only - a nested `auto` write inside a user action is part of that action's step.

## How a step is restored (`restoreStep`)

Everything runs inside `operationScope.suppress()` (nothing the restore does is recorded) and one
`safeBatch()`:

1. **Physical order for the replay.** When the journal adds or removes rows or columns, both axes are
   reset to the identity sequence with no trims, so a visual index names the physical row of the same
   number and `alter()` replays each entry on the record it names. Never replay in visual order - that
   is what broke multi-column removal on a moved column order (the old skipped spec).
2. **A reshaped source (NestedRows)** is put back by reference from the plugin's
   `captureSourceStructure()`, after `beforeCreateRow`/`beforeRemoveRow` were asked about the rows it
   adds and removes (they do not go through `alter()`). Its row entries then move the cell meta rows
   only, and `afterCreateRow`/`afterRemoveRow` report them. Its cell writes are mapped to the restored
   shape's rows (`createRestoredShapeRowMapper()`), because the shape jumps to the end state in one go
   while each write addresses the rows as they were when it was recorded.
3. **The journal**, backwards for undo, forwards for redo. Cell writes go through
   `setSourceDataAtCell` with the `UndoRedo.*` source: no `beforeChange`, no validator gate, no
   `valueSetter` translation (the values are stored values), and `sourceDataValidator` is skipped.
4. **The snapshot**: index maps, then plugin states, then settings. Only what the step changed is
   written back, so a change made outside any step since survives. Two refinements:
   - **Settings are merged per field**: a setting the step changed takes the target value, every other
     one keeps the value it had before the restore. The replay moves the frozen counts; a later
     `updateSettings({ fixedRowsBottom })` must survive.
   - **Plugin states the step did not change are put back to their pre-restore value** when the replay
     reset the order (`forceOrder`) - a replayed removal shifts merges it never touched. Only when the
     replay moved them: `captureState(base)` returning `base` means it did not, and the state is left
     alone. Re-applied anyway, an unmoved state loses what no capture holds - Filters re-imports its
     applied conditions and drops one added but not applied yet.
   - **Trims and hides the step did not change are kept** after a structural replay. The replay lifts
     every trim, and every map snapshot has another length after an insert or a removal, so identity
     cannot tell what the step changed. `readKeptFlags()` compares the flags before the step, moved
     through the journal, with the flags after it, and puts the live flags of each unchanged map back
     last. A `trimRows` or `hiddenRows` settings update made after the step survives its undo. A map
     whose only change was losing flagged rows the step removed counts as unchanged too
     (`readRemovedFlags()`): its live flags are kept, and an undo flags the rows it brings back
     (`restoredIndexes`), so the removed hidden row returns hidden and a later hide stays.
5. **A veto** of any replayed row or column change reverts the replay and puts the grid back; the step
   stays on its stack, `beforeUndo` has fired and `afterUndo` does not. The stack hooks had already
   announced the pop, so the step goes back through a before/after pair of its own (`#putBackStep`):
   the last stack a listener was told about is always the stack as it is.
6. **A full render when the batch ends** (`hot.render()` inside the batch only flags one). A step that
   changed only cell meta - a comment, a border, a `className` - asks for no render itself, and the
   draw that ends the batch is a fast one, which keeps every cell as it was painted.
7. **A second render only when something needs it** (`#revalidateChangedCells`): after the
   validators of the restored cells ran, or after a step that inserted or removed rows or columns -
   AutoColumnSize measures only the columns the previous draw showed, so it sizes a column the restore
   brought back on the next render (`autoColumnSize.spec.js`, "when removing single column"). An undo
   of an edit with no validator skips it; rendering twice there cost about 4 ms on a 100k-row grid.

After the restore: `afterChange` fires once, with every cell the restore wrote (`restoredCells.ts`),
the visible ones are re-validated, and the selection is put back for the step types that always did
(`change`, `row_move`, `col_move`, `move_cells`) - see `describeStepSelection` in `entry.ts`. All
three run suppressed: what an `afterChange`, an `afterValidate` or a selection listener writes in reply
is part of the undo, and a recorded step there would empty the redo stack the undo is filling.

## Traps

- **A journal position is only valid in the numbering it was recorded in.** A cell write recorded after
  a row removal in the same step addresses rows as they were after the removal. Anything that reports
  restored cells must map them with `restoredCells.ts` (reverse the earlier structural entries for an
  undo, apply the later ones for a redo). Reading `op.physicalRow` against the final maps reports the
  wrong row - that is how a restored row was validated twice. A restore of a reshaped source WRITES
  through the same mapping (`toFinalIndex()`): without it, the formula text Formulas rewrites when a
  nested parent is removed was written back onto the last child of the restored parent.
- **A replay writes a prop the way `DataMap#set` wrote it, and the journal reads it the way `DataMap#get`
  reads it**: a key the row owns is a literal key, a dotted name is walked only with `dataDotNotation`,
  anything else is a literal key (`DataSource#setAtCell` with `byProp`, `getRawAtCellByProp`). The
  general `setProperty()` always walks dots, so with `dataDotNotation: false` an undo created `row.a.b`
  and left `row['a.b']` at the new value. `setSourceDataAtCell()` outside a replay keeps walking dots.
- **Undo and redo do not run the operation again.** A step's own hooks - `beforeColumnSort`,
  `beforeFilter`, `beforeRowMove`, `beforeMoveCells` - do not fire and cannot veto. `beforeUndo`/
  `beforeRedo` are the veto points, and both are asked BEFORE the stack changes: a vetoed step stays
  where it was and no stack hook fires. 18.x popped the step before `beforeUndo`, because Formulas
  stepped HyperFormula there; Formulas no longer listens to it, so nothing needs that order. The row
  and column create/remove hooks DO fire, because the replay goes through `alter()` (or the NestedRows
  path above), and `afterChange` fires once.
- **Never `deepClone` a step or a record.** Hooks receive the step object itself. A plugin that puts
  a live object into its details (a `CellRange`) must put a plain copy (`deepClone(range)` at describe
  time), or the step changes with the selection.
- **`captureState(previous)` must return `previous` by reference when nothing changed.** The tracker
  compares states by identity to decide what a step changed; a fresh equal object makes every step look
  like it changed the plugin, and the restore then re-applies it on every undo.
- **`restoreState()` must be hook-silent for what it re-applies** - the hooks fired when the user acted.
- **Derived index maps are never captured** (`autoRowSize`, `autoColumnSize`, `stretchColumns`, the
  NestedHeaders widths, `Pagination`, `*.columnMeta` - `DERIVED_INDEX_MAP_NAMES`). They are rebuilt
  from the rest. Pagination is there because it recomputes its page map on every index cache update:
  it records the page instead, and rebuilds the map in `restoreState()`. The Filters menu components'
  `Filters.component.<id>` maps are derived too: they hold the menu's UI state (a column's whole value
  list, rewritten on every edit in a column filtered by value), and `importConditions()` rebuilds them.
  **A map registered under
  `this.pluginName` carries the capitalized registry name** (`'Pagination'`, not the settings key), and
  an entry in the wrong case silently matches nothing - pin a new entry with a unit test.
- **A method that suppresses recording must call its body directly, never re-enter through the
  instance.** `init()`, `updateSettings()`, `loadData()` and `updateData()` run their bodies
  (`applyInit()`, ...) inside `operationScope.suppress()`. An earlier cut re-entered as
  `instance.updateSettings(...)`, so every wrapper or spy of the public method saw two calls - the Vue
  and Angular wrapper suites and a dropdown-editor Playwright spec failed on it.
- **The journal keeps the write order, and a step's `changes` field must not.** `applyChanges()` walks
  its list backwards, so its cell run is recorded with `reversed: true` and `collectChanges()` reads it
  backwards: `changes` lists the cells in the order they were passed, as it always did. Reordering the
  journal itself would break the replay of a cell written twice in one call.
- **A replayed insertion can land in part** (`maxRows` clamps it). `alterRuns()` takes the rows that
  did land out again before it reverts the earlier runs. A removal that lands in part cannot be taken
  back - its rows are gone. `alterRuns()` counts the columns in the index mapper, not with
  `countSourceCols()`: that one reads the first source row, so with every row removed it answered 0
  before and after each column change, and every column replay read as vetoed.
- **A menu item that writes cell meta over a selection groups it into one operation.** The context
  menu's **Read only** item runs one `read_only_toggle` operation, so one undo step reverts the whole
  selection, and it still fires the public `beforeReadOnlyToggle` hook with its `stateBefore` snapshot
  (DEV-136). The comment items do the same. Without the operation every `setCellMeta()` would be a
  step of its own.
- **A write that must not become a step runs under `operationScope.suppress()`.** The Comments
  editor's box size is the example: its resize observer reports every frame of a drag. A write left
  outside any operation is not enough - the core entry points (`setCellMeta`) open one themselves.
- **A restore that cannot land is refused before any hook**: a step whose source shape was recorded by
  a plugin that is disabled now stays on its stack (`#canRestore`).
- **The cells an undo fills back into removed rows and columns are validated again, on purpose.**
  The journal does not carry `valid` (the validator writes it directly, outside `setMeta`), so
  skipping them brings an invalid cell back without its marker, and leaves a formula in a restored row
  validated by nobody: Formulas leaves every cell the restore reported to this plugin
  (`formulas/__tests__/validation.spec.js`, #dev-2036). It also keeps the second render a structural
  undo needs - with no cell to validate, `#revalidateChangedCells` returned before it, and
  AutoColumnSize never measured the column the undo brought back. The cost is one validator call per
  restored visible cell that has a validator.
- **`maxHistory` is validated by the plugin itself** (`#readMaxHistory`, `warnOnce`), not through
  `SETTINGS_VALIDATORS`: `PLUGIN_KEY` is `undoRedo` while the setting is `undo`, so BasePlugin never
  hands the value to a validator. `updatePlugin()` re-reads it only when the payload has an `undo`
  key, drops the steps past a lowered limit at once, and a redo trims too - with `0` a push is
  trimmed away right after it.
- **Every drop of a step announces itself** (`#dropSteps`): the `before`/`after` stack hook pair of
  each stack that changes, not vetoable (the return value is ignored). `#resetHistory` goes through
  it, so a toolbar that follows the hooks never keeps an Undo button for a history that is gone. The
  public `clear()` stays silent, as it always was.

## The epoch

Steps describe one dataset. `loadData`, `updateData`, and - outside any step - a row or column count
change or a change to the set of index map NAMES (a plugin that owns a map turned on or off) drop the
whole history (`#resetHistory`; `#detectStructureChange` runs when a transaction opens and before every
undo/redo). A step from an older epoch is never restored. A transaction takes the epoch it OPENED in
(`#openEpochs`), not the one it settles in: a `batch()` that calls `updateData()` journaled changes to the
replaced dataset, and recorded in the new epoch it would write them into the new data on undo. The names are compared, not the map objects:
a settings update that disables and enables a plugin again (a framework wrapper does it on every
render) re-registers the same names and keeps the history (`haveSameIndexMaps`). No warning is logged
on a drop: `updateData` is routine in the wrappers, so one would fire on every data prop change.

An UNRECORDED transaction - a blocked one (root source `auto`, the grid's own rows) or an ignored one
(a legacy `done()` action's undo or redo) - does not open an epoch when it only adds or removes rows
and columns at the END of an axis (`changesOnlyAxisEnds`): Enter on the last row with `minSpareRows`
must not wipe the history. Anything else it inserts or removes renumbers the rows the recorded steps
address, so it drops the history. The tail case is safe because a restore never resizes an axis to a
snapshot: it resizes the axis to the length the data implies (`countSourceRows()`,
`getInitialColumnCount()` - what `updateData()` fits it to) and fits a snapshot of another length to it
(`fitSequence()` - indexes past the snapshot's end keep their current state). Resizing to the
snapshot is what left the index mapper shorter than the data. The data length is needed on the other
side too: removing the last column empties the ROW axis while the rows stay in the data, and the
replay of that removal brings the column back but not the rows. The reverse needs the opposite rule:
with every row removed, plain array data implies no column count (it counts the columns in the first
row) while the grid keeps its columns, so the column axis keeps the index mapper's length then.
Sized from the data, every undo made on a grid with no rows emptied the column axis.

**A settings update is checked at once** (`#checkSettingsUpdate`, from `updatePlugin()` - `SETTING_KEYS`
is `true`, so it runs for every `updateSettings()`). Three rules keep it cheap and correct:

- **It runs only while no transaction is pending and the history is not empty.** While one is
  (`batch(() => updateSettings(...))`, or an edit waiting for its validator), the next transaction to
  open checks the row count and the map names, and the `columns` check is owed
  (`#owesColumnsCheck`): it runs from `#onTransactionSettle` once the last pending transaction
  settles, and `#columnProps` is not refreshed before it, so it still holds the fields the steps
  were made on (a narrower `columns` would otherwise refresh it to the new fields and pass every
  step). Without that, a field swap made while an edit was validated was never checked, and a
  re-send of the same `columns` (a wrapper re-render) then dropped the steps. The pending step itself
  goes when the update changed the column count: its states span the change. With an empty history
  there is nothing to protect, and the React wrapper calls `updateSettings()` on every render, so
  the capture is skipped there.
- **A row count or index map names change drops everything, now** - `isUndoAvailable()` is accurate
  right after the update. A structural change made while recording is suppressed (from a hook) still
  waits for the next transaction.
- **A `columns` update keeps the history.** Cell writes are journaled by prop, so they survive any
  reshape. `#columnProps` holds the field each physical column showed when the kept steps were
  recorded (read at record time when it is `null` or its length differs; `null` whenever both
  stacks are empty). When the new mapping differs, `addressesChangedColumn()` (`stepColumns.ts`)
  tests every step: a meta entry, a removed row's metas or accessor values, a column index map the
  step changed, the column order and trims a structural restore forces back, `fixedColumnsStart`,
  `colHeaders`, and the plugin states through `getStateColumns()`. A column insert or removal always
  fails. A failing step drops **with every step that can only be restored after it**
  (`#dropStepsWhere`: undo stack `[0..i]`, redo stack `[0..j]`), so the stacks keep no hole. When
  the mapping is the same but `columns` is now set, the column insert and removal steps drop anyway:
  `alter()` refuses them. Then `#lastState` becomes the current state, or the lazy check would read
  the new column count as a change made outside any step.

## The plugin contract (`../base/base.ts`)

Optional methods, found by `typeof plugin.captureState === 'function'`:

- `captureState(previous)` / `restoreState(state)` - state that lives neither in an index map nor in
  cell meta: MergeCells (merges and their physical anchors), Filters (applied conditions),
  NestedHeaders (group membership after moves), CollapsibleColumns (collapsed header groups),
  NestedRows (collapsed parents), CustomBorders (a model version - the borders live in the `borders`
  cell meta, and `restoreState()` rebuilds the model from it), Pagination (the page and the page
  size), Formulas (see `../formulas/AGENTS.md`).
- `restoreState(state, context?)` gets a `PluginRestoreContext` - `{ other, direction, reordered }`:
  the plugin's state on the other side of the step, `'undo'` or `'redo'`, and whether the replay
  reset the order. A plugin uses it to apply only what the step changed, so a change made outside
  any step survives: MergeCells adds and removes only the merges that differ between `other` and
  `state` (and falls back to a full rebuild when `reordered` or when a merge to remove is not where
  it was, or when a merge to put back overlaps a live merge the step did not make), Formulas reads
  the peer rewrites from `other` on undo. No context is passed when the restore puts back a state no
  step changed.
- `getStateColumns(state, other)` - the physical columns whose state differs between the two sides
  of a step, for the `columns` check above. `null` or no method means "cannot tell" and the step
  drops, with every older one. Pagination, NestedRows, and CustomBorders answer `[]`; Filters the
  columns whose conditions differ; Formulas `[]` only for a data-only step in physical order;
  MergeCells the physical columns of the merges that differ (each captured merge carries
  `physicalColumns`, since the anchor holds the first one only); NestedHeaders and
  CollapsibleColumns `[]` (the membership changes only with moves, inserts and removals, which fail
  on their own, and the columns a collapse hides are in the hiding maps, checked per column).
- `captureSourceStructure(previous)` / `restoreSourceStructure(state)` - only for a plugin that
  reshapes the source array itself (NestedRows: the tree shape, by reference).

A plugin whose state lives in index maps (hiding, trimming, moves, sort states, resize widths) or in
the settings `alter()` changes needs no adapter - it only has to run its mutators in `runOperation()`.

## Legacy `done()`

`done(wrappedAction, source)` still stacks a custom action with `undo(hot, cb)`/`redo(hot, cb)`. It
runs the old callback protocol (`#undoCustomAction`), including `canUndo`/`canRedo` and the
`ignoreNewActions` flag. Keep it working: it is public API. An action that settles with
`{ wasUndone: false }` or `{ wasRedone: false }` is put back the way a vetoed replay is - with its own
stack hook pair, and with no `afterUndo`/`afterRedo`.

## Known gaps

- A multi-operation step on a NestedRows grid that MOVES rows (a detach, a row move) and edits cells
  can put an edit on another row. The cell writes are mapped to the restored tree shape through the
  step's `insertRows`/`removeRows` entries only; a move is journaled as `metaRows` entries, which
  `spliceCellsMeta()` also records for a meta-only shift, so they cannot be read as data moves.
- The value maps and the row and column order of a structural step are restored from its snapshot,
  so a size or an order set outside any step after the step (a `manualColumnResize` or
  `manualColumnMove` settings update) is lost on undo. Trims and hides are kept (step 4 of the
  restore above).
- While a Formulas grid is sorted or moved, every step that writes data re-serializes the engine sheet
  (O(cells) time; the unchanged rows share their arrays with the previous snapshot, so the memory
  grows with the rows that changed).
- An accessor function re-created on every render (an inline `data: row => ...` in React) reads as
  another field, so each render drops the steps that address its column. Documented in the guide's
  known limitations and section 24.
- A replayed removal that removes a different number of rows or columns than it recorded cannot be
  taken back (`alterRuns()`): its rows are gone. Also in the guide's known limitations.
- A settings update that changes the row count while a transaction that already journaled a change
  is pending (a join host) is folded into that step's "after" state instead of dropping the history.
- Every transaction that joins a host adds its names to the step's `operations` and `sources`, a
  no-op one included (an AutoRowSize `batchExecution()` during a scroll reads as a `'batch'` entry).
  Only a capture per settle could tell a no-op from a hide, which changes no journal either.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=undoRedo` (and `operationScope`,
  `dataJournal`, `indexMapperSnapshot`).
- `npm run test:e2e --prefix handsontable -- --testPathPattern=plugins/undoRedo`
- Playwright: `tests/e2e/undo-index-transformations.spec.ts` (the headline index-transformation
  cases), `tests/e2e/undo-plugin-state.spec.ts` (one step per plugin action: hiding, trimming,
  freezing, resizing - the drag and the double-click included -, collapsing, borders, comments, pages),
  plus the per-feature `*-undo.spec.ts` files.
- More unit files by topic: `removeRowsAndColumns.unit.js`, `indexTransformations.unit.js` and
  `pluginState.unit.js` (their shared setup is `__tests__/helpers/grid.js`), plus
  `../formulas/__tests__/undoRedo.unit.js`. More browser specs by topic: `tests/e2e/column-summary-undo.spec.ts`
  and `tests/e2e/autofill-merge-undo.spec.ts`.
- **A closed undo bug gets its case in the file for what it tests**, with the task id in a comment above
  it - never in a file or a test named after the report. **A ColumnSummary case must run in a browser:**
  the summary is calculated on the first visible render, jsdom grids are never visible, and a jsdom
  summary test passes with nothing calculated.
