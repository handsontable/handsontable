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
   between is silently dropped from the stack**, and the action then settles on an unrelated change. Keep
   the two write lists in one `setDataAtCell` call for the same reason — two calls settle on the first.
3. **The row-count guard measures `countSourceRows`, not `countRows`.** Its job is to remove the rows the
   change grew the dataset by: the rows a past-the-end write created, *and* the ones `minSpareRows` topped
   up when the edit filled the last spare row (that second one is why gating the guard on "some change was
   past the end" is not enough — `UndoRedo.spec.js` pins it). `countRows()` counts only what a filter or a
   trim leaves visible, so comparing it read a trim *lifted* since the edit as rows to delete, and took
   that many rows of the user's data off the end. `countRows` is still recorded, because it is part of the
   payload `beforeUndo`/`afterUndo` hand to listeners.

Formulas needs no change for the source path: it already ignores `UndoRedo.*` sources on
`afterSetSourceDataAtCell` and resolves a trimmed row's engine index physically — see `../formulas/AGENTS.md`.

One gap stays open, deliberately. `physicalRows` holds a **position in the source array, not a record
identity**, so a row removal that is not on the undo stack shifts every entry below it and the replay
lands one row off. That is the same class of gap the visual index had, one step further out: LIFO puts a
recorded removal's own undo first, so it only bites a removal performed with a blocked source. Do not read
the field as an ID.

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
