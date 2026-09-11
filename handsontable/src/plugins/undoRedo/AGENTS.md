# UndoRedo plugin — the action stack

The `undoRedo` plugin records reversible actions and replays them. Read this before touching `undoRedo.ts`,
`utils.ts` or any file in `actions/`.

`PLUGIN_PRIORITY = 1000` — **the highest of every plugin**, so it enables last and every other plugin's
hooks are already registered before it starts recording. `SETTING_KEYS` is `true`, meaning it updates on
every `updateSettings()` call whatever the payload.

## One action per file, all extending `actions/_base.ts`

```
cellAlignment  columnMove  columnSort  createColumn  createRow  dataChange
filters  fixedCounts  mergeCells  moveCells  removeColumn  removeRow
rowMove  unmergeCells
```

Adding an action means a new file plus a registration in `actions/index.ts`. Do not add a branch to
`undoRedo.ts`.

## A throwing action resets the flag and is discarded

Both `undo()` and `redo()` carry the same contract:

> An action that throws never reaches its settle callback. Without the reset, **every later user action
> would be silently dropped from the stack for the rest of the session.** The popped action itself is
> deliberately discarded: it applied only partially, so neither replaying its undo nor redoing it can be
> trusted to land on a consistent grid.

So the failure mode is "one action is lost", never "the stack dies". Keep it that way.

## The redo settle protocol

Most actions settle the redo by calling back with **no argument**. An action that can legitimately fail to
redo — **currently only `MoveCellsAction`** — reports `{ wasRedone: false }`, which pushes the action back
onto the **undone** stack instead of the done stack.

An action that can legitimately fail to undo — **currently only `RemoveRowAction` with a nested
snapshot** — exposes `canUndo(hot)`. `UndoRedo.undo()` calls it **before** `beforeUndo`. Formulas
always calls `engine.undo()` in `beforeUndo`, so a veto or a disabled NestedRows plugin discovered
only while applying the snapshot would leave HyperFormula restored and Handsontable empty. A late
`{ wasUndone: false }` still puts the action back on the done stack and must **not** emit `afterUndo`.
Write `settings.fixedRowsTop` / `fixedRowsBottom` **after** that restore lands: those two assignments
mutate the settings object by reference, and a refused nested undo would otherwise leave the
frozen-row counts of a state that never came back. Nested cell-meta restore must reopen the origin
that filed each key (`startCellOptionMetaRecording`, a plain `setCellMeta`, or
`disableUserDefinedMetaRecording`); a bare write files everything as user-defined and #5661
returns. The merge snapshot type is `import type { PhysicalRowMergeSnapshot }` from MergeCells —
type-only, so registering UndoRedo still does not pull that plugin into the bundle.

## `MoveCellsAction` is the asymmetric one, in three ways

1. **Its `undo` restores both regions with `restoreRegion` instead of replaying the move**, so
   `afterMoveCells` never fires on the undo path. The Formulas plugin has to compensate for that on undo and
   must **not** be listed for redo (redo does replay the move) — see `../formulas/AGENTS.md`.
2. **Values are restored through `populateFromArray`**, deliberately: that triggers the normal data-write
   path and lets Formulas re-register formula strings in HyperFormula.
3. **Movable meta is restored sparsely.** Clear the movable keys the region carries *now* that the snapshot
   does not record (they arrived with the move being undone), then write the recorded ones back. Scanning the
   current state instead of blanket-removing over the whole region keeps the per-cell `removeCellMeta` hook
   dispatch proportional to **styled cells**, not to region area.

The movable key set is **imported from `../../utils/movableMeta.ts`** (`MOVABLE_META_KEYS`,
`collectMovableMeta`), not duplicated: undo must restore exactly the key set `moveCellRange` moved, and two
copies would drift the moment a key is added to one. Note that is the **core** `src/utils/`, not this
directory's own `undoRedo/utils.ts` — it lives outside the MoveCells plugin **so this action does not import
another plugin**, since registering just `UndoRedo` must not pull MoveCells code into the bundle.

## Two hook-argument hazards, both from `Hooks.run` threading

`Hooks.run` threads a truthy return value into the next listener's first argument, and the **global bucket
runs before per-instance listeners**. Two consequences that are already guarded:

- **`ColumnMoveAction`**: only a global `Handsontable.hooks.add` listener runs ahead of this one, and its
  return value would replace `movedColumns` — so the shape is checked before `.slice()` is called on it.
- **`MoveCellsAction`**: the veto check covers the documented `false` value **and** any garbage a preceding
  listener folded into the argument.

Any new action reading a hook argument needs the same shape guard.

## `DataChangeAction` runs late on `beforeChange`, on purpose

It is registered to run **after** other `beforeChange` hooks (including the user's), so it sees nullified
entries and records **only effective changes** — a listener setting `changes[i] = null` must not leave a
phantom entry on the stack.

## `DataChangeAction` addresses rows PHYSICALLY, and that shaped three things (DEV-2665)

The action records a `physicalRows` array alongside `changes`, and the replay routes each change by it.
A visible row is written through `setDataAtCell` at its **current** visual index; a trimmed one has no
visual index at all and is written with `setSourceDataAtCell`. Do not "simplify" this back to replaying
the recorded visual row — that row index only describes the grid state the edit happened in, and a filter
applied since puts another record there (it grew a phantom row, or silently did nothing).

Three traps come with it, and each one has a measured defect behind it.

1. **`beforeChange` runs before the rows exist.** A write past the last row is recorded while
   `applyChanges()` has not created its rows yet, so `toPhysicalRow()` returns `null` for it. `null` is
   therefore *meaningful*: it is what makes the replay address the grid visually, which is what re-creates
   the row. Do not coerce it to a number, and do not treat it as "no row".
2. **The settle callback rides on `afterChange`, which a source-only replay never fires.** So `#replay()`
   settles itself when the grid-write list comes out empty, and the source writes go **first** so the
   `afterChange` settle still runs after the whole replay landed. An armed hook left behind is not a
   cosmetic leak: `ignoreNewActions` stays on until it fires, so **every action the user performs in
   between is silently dropped from the stack**, and the action then settles on an unrelated change. The
   grid list therefore has to stay **one** `setDataAtCell` call — split it in two and the settle runs on
   the first one's `afterChange`, while the second is still to come.
3. **The rows the change created are named INDIVIDUALLY, and measured in source rows.** Two separate
   mistakes are already burned in here. Measuring against `countRows()` is wrong because it counts only
   what a filter or a trim leaves visible, so a trim *lifted* since the edit reads as rows to delete —
   and gating the guard on "some change was past the end" instead does not work either, because
   `minSpareRows` tops the spares up when an edit fills the last spare row and grows the dataset with no
   change addressing a new row at all (`UndoRedo.spec.js`'s minSpareRows case pins that). And passing an
   **amount** to `alter('remove_row', undefined, n)` is wrong even with the right number, because
   `alter()` counts an amount back from the last **visible** row: with anything trimmed that is a
   different record, so it deleted a row the change never touched, and with everything trimmed it handed
   listeners a `beforeRemoveRow(NaN, 0, [])` round. Hence `#collectCreatedRows()` — one
   `[visualRow, 1]` group per trailing source row, trimmed ones skipped because they have no visual
   index. `countRows` is still recorded, because it is part of the payload `beforeUndo`/`afterUndo` hand
   to listeners.

Formulas needs no change for the source path: it already ignores `UndoRedo.*` sources on
`afterSetSourceDataAtCell` and resolves a trimmed row's engine index physically — see `../formulas/AGENTS.md`.

Four gaps stay open, deliberately. Each one is a known defect, not an oversight — say so rather than
rediscovering them.

- **`physicalRows` is a position, not an identity.** A row removal that is not on the undo stack shifts
  every entry below it, and the replay then lands one row off. Same class of gap the visual index had,
  one step further out: LIFO puts a recorded removal's own undo first, so it bites only a removal
  performed with a blocked source. Do not read the field as an ID, and do not write "a removed row's
  value is discarded" anywhere — that only holds for a removal at the very **end** of the dataset.
- **The data is restored physically, the selection and the merge geometry still visually.** After a
  reorder this action did not record, the values land on the right records while
  `selectCells(this.selected)` highlights whatever now sits at the recorded visual coordinates.
  `remergeCellsGeometryOnly` carries the same issue and one of its own: it runs *after*
  `#collectCreatedRows()` has removed rows, so a paste that destroyed a merge, appended rows and was
  followed by a reorder can re-merge at shifted coordinates. Both need a physical form for a *range*,
  which `CellRange` cannot describe.
- **`allowInvalid: false` can still strand the stack.** When a validator rejects every grid change,
  `validateChanges` splices them all out, `applyChanges` fires no `afterChange`, and the settle never
  runs — so `ignoreNewActions` stays on for the rest of the session. Pre-existing, and the `try/catch` in
  `#replay()` does **not** cover it (nothing throws). The action is at least no longer *half*-applied:
  the source writes are held inside the settle path, behind that same `afterChange`, so a rejected grid
  write leaves nothing written. Do not hoist them back ahead of `setDataAtCell()`. A real fix for the
  stranding needs a completion signal from Core that survives an all-rejected validation round.
- **A row that never existed is replayed at its recorded visual index, and that index can drift.**
  There is nothing to re-derive — the row had no physical index when `beforeChange` recorded it. The
  index is trusted only while it still names a row this change appended, or no row at all; a trim
  lifted since then can slide it onto a record that existed all along, and `#collectWrites()` drops the
  change rather than blanking that record. Dropping it means a past-the-end edit is not reverted in
  that case, which is the lesser of the two.
- **The column half of the guard still counts visible columns.** `countCols()` is
  `min(maxCols, notTrimmedColumns)`, so a `maxCols` raised since the edit reads as columns this change
  added. It is the same defect the row half above fixed, left alone because the column axis is outside
  DEV-2665 and `countSourceCols()` reads the first row's keys, which is not a reliable count.

## `CellAlignmentAction` restores an ABSENT value as absent

Falling back to a horizontal alignment when nothing was recorded used to leave the cell aligned left after
undoing a *vertical* alignment, and made the class name grow on every undo/redo cycle. Restore exactly what
was recorded, including "nothing". Header coordinates are skipped — alignment classes are collected within
cell ranges only.

## Undo/redo bypasses the Formulas plugin's change listeners

`'UndoRedo.undo'` and `'UndoRedo.redo'` are blocked sources in `../formulas/`, because HyperFormula reverts
through its own stack (`beforeUndo` calls `engine.undo()`). **The two stacks must stay in step** — the same
number of actions on both sides. The full rule, including which action types write cell data and therefore
need catching up in `afterUndo`/`afterRedo`, is in `../formulas/AGENTS.md`.

## The prop double-translation bug is FIXED (DEV-2721)

Historical, kept because the failure shape is instructive. `setDataAtRowProp` used to read the old value
through `getAtCell`, which re-ran `colToProp`, so undo faithfully replayed a wrong value
(issues #4118 / #7031). PR #13322 fixed it — the old value is now read **by prop**
(`getAtCellByProp`) — and fixed the spec in the same change.

**The lesson is the part to keep: a spec can pass *because of* a bug.** The object-data undo spec passed
while `name` never changed, because it wrote a literal `"0"` key and read the old value from `name`. The
spec now addresses the cell by the object's own key and carries a comment saying so. When a data-addressing
fix makes a green spec go red, suspect the spec.

## Where to look next

- The plugin whose change listeners this one bypasses: `../formulas/AGENTS.md`.
- Actions whose snapshots this plugin takes: `../moveCells/AGENTS.md`, `../mergeCells/AGENTS.md`,
  `../filters/AGENTS.md`, `../columnSorting/AGENTS.md`, `../customBorders/AGENTS.md`.
- Hook dispatch and the global bucket: `../../../.ai/HOOKS.md`, `../../core/hooks/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='undoRedo'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='undoRedo'`

`__tests__/actions/` holds a spec per action — put a new action's coverage there, not in the 2.5k-line
`UndoRedo.spec.js`. There are also dedicated `hooks`, `keyboardShortcuts`, `scroll` and `selection` specs,
plus `../mergeCells/__tests__/undoRedo.spec.js` for that interaction.
