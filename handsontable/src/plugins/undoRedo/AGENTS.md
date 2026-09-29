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
| `undoRedo.ts` | The stacks, the hooks, the epoch, the legacy `done()` path |

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
   is in commit order**, not call order.
4. **On settle** (`#onTransactionSettle`) the tracker captures the "after" state. "Before" is the state
   the previous step ended in, read at settle time - so a step that committed while this one waited for
   a validator is not undone together with it. A transaction with an empty journal and an unchanged
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
   only, and `afterCreateRow`/`afterRemoveRow` report them.
3. **The journal**, backwards for undo, forwards for redo. Cell writes go through
   `setSourceDataAtCell` with the `UndoRedo.*` source: no `beforeChange`, no validator gate, no
   `valueSetter` translation (the values are stored values), and `sourceDataValidator` is skipped.
4. **The snapshot**: index maps, then plugin states, then settings. Only what the step changed is
   written back, so a change made outside any step since survives. Two refinements:
   - **Settings are merged per field**: a setting the step changed takes the target value, every other
     one keeps the value it had before the restore. The replay moves the frozen counts; a later
     `updateSettings({ fixedRowsBottom })` must survive.
   - **Plugin states the step did not change are put back to their pre-restore value** when the replay
     reset the order (`forceOrder`) - a replayed removal shifts merges it never touched.
5. **A veto** of any replayed row or column change reverts the replay and puts the grid back; the step
   stays on its stack, `beforeUndo` has fired and `afterUndo` does not.
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
(`change`, `row_move`, `col_move`, `move_cells`) - see `describeStepSelection` in `entry.ts`.

## Traps

- **A journal position is only valid in the numbering it was recorded in.** A cell write recorded after
  a row removal in the same step addresses rows as they were after the removal. Anything that reports
  restored cells must map them with `restoredCells.ts` (reverse the earlier structural entries for an
  undo, apply the later ones for a redo). Reading `op.physicalRow` against the final maps reports the
  wrong row - that is how a restored row was validated twice.
- **Undo and redo do not run the operation again.** A step's own hooks - `beforeColumnSort`,
  `beforeFilter`, `beforeRowMove`, `beforeMoveCells` - do not fire and cannot veto. `beforeUndo`/
  `beforeRedo` are the veto points. The row and column create/remove hooks DO fire, because the replay
  goes through `alter()` (or the NestedRows path above), and `afterChange` fires once.
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
  back - its rows are gone.
- **A write that must not become a step runs under `operationScope.suppress()`.** The Comments
  editor's box size is the example: its resize observer reports every frame of a drag. A write left
  outside any operation is not enough - the core entry points (`setCellMeta`) open one themselves.
- **A restore that cannot land is refused before any hook**: a step whose source shape was recorded by
  a plugin that is disabled now stays on its stack (`#canRestore`).

## The epoch

Steps describe one dataset. `loadData`, `updateData`, and - outside any step - a row or column count
change or a change to the set of index map NAMES (a plugin that owns a map turned on or off) drop the
whole history (`#resetHistory`; `#detectStructureChange` runs when a transaction opens and before every
undo/redo). A step from an older epoch is never restored. The names are compared, not the map objects:
a settings update that disables and enables a plugin again (a framework wrapper does it on every
render) re-registers the same names and keeps the history (`haveSameIndexMaps`). No warning is logged
on a drop: `updateData` is routine in the wrappers, so one would fire on every data prop change.

## The plugin contract (`../base/base.ts`)

Optional methods, found by `typeof plugin.captureState === 'function'`:

- `captureState(previous)` / `restoreState(state)` - state that lives neither in an index map nor in
  cell meta: MergeCells (merges and their physical anchors), Filters (applied conditions),
  NestedHeaders (group membership after moves), CollapsibleColumns (collapsed header groups),
  NestedRows (collapsed parents), CustomBorders (a model version - the borders live in the `borders`
  cell meta, and `restoreState()` rebuilds the model from it), Pagination (the page and the page
  size), Formulas (see `../formulas/AGENTS.md`).
- `captureSourceStructure(previous)` / `restoreSourceStructure(state)` - only for a plugin that
  reshapes the source array itself (NestedRows: the tree shape, by reference).

A plugin whose state lives in index maps (hiding, trimming, moves, sort states, resize widths) or in
the settings `alter()` changes needs no adapter - it only has to run its mutators in `runOperation()`.

## Legacy `done()`

`done(wrappedAction, source)` still stacks a custom action with `undo(hot, cb)`/`redo(hot, cb)`. It
runs the old callback protocol (`#undoCustomAction`), including `canUndo`/`canRedo` and the
`ignoreNewActions` flag. Keep it working: it is public API.

## Known gaps

- A multi-operation step on a NestedRows grid (a `batch()` with a row change and edits) replays its
  cell writes against the restored tree shape, so an edit recorded after a row change can land one row
  off.
- The index maps of a structural step are restored from its snapshot, so a trim or hide made outside
  any step after the step is lost on undo.
- While a Formulas grid is sorted or moved, every step that writes data re-serializes the engine sheet
  (O(cells)).

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=undoRedo` (and `operationScope`,
  `dataJournal`, `indexMapperSnapshot`).
- `npm run test:e2e --prefix handsontable -- --testPathPattern=plugins/undoRedo`
- Playwright: `tests/e2e/undo-index-transformations.spec.ts` (the headline index-transformation
  cases), `tests/e2e/undo-plugin-state.spec.ts` (one step per plugin action: hiding, trimming,
  freezing, resizing - the drag included -, collapsing, borders, comments, pages), plus the
  per-feature `*-undo.spec.ts` files.
