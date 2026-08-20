# NestedRows — architecture

The plugin turns a nested source array (`__children`) into a flat grid, and collapses or expands
those branches. Read this before changing anything here: the collapse path has two sources of truth
and several methods that look usable but are not.

## The one fact that drives every design choice

**Collapsing a parent _trims_ its descendants — it does not hide them.**

`collapsedRowsMap` is a `TrimmingMap`, created in `enablePlugin()`:

```ts
this.collapsedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap('nestedRows', 'trimming');
```

A trimmed row is dropped from the DataMap and from `countRows()`, so **it has no visual index at
all** — `hot.toVisualRow(physicalRow)` returns `null` for it. Compare `hiddenRows`, where a hidden
row keeps its visual index. That single difference explains the whole public API:

| Surface | Index type | Why |
|---|---|---|
| `collapseParent`, `expandParent`, `toggleParent`, `isParentCollapsed`, `isParent`, `getRowLevel`, `getRowParent`, `countChildren` | **visual** | They act on a row the user can see, so the house rule holds |
| `getCollapsedParents()`, `expandToRow()` | **physical** | They address rows the collapse itself hid. A parent collapsed inside another collapsed parent cannot be named with a visual index, so the state would be impossible to represent or store |
| the four collapse/expand hooks | **physical** | Matches the column hooks, and it is what an app must save to restore state later |

`trimRows` is physical throughout for the same reason. When you add anything to this plugin, decide
the index type from *whether the row can be trimmed*, not from the house rule alone.

## Files

| File | Role |
|---|---|
| `nestedRows.ts` | The plugin. Lifecycle, 21 core hooks, the shortcut, and the **public API** |
| `data/dataManager.ts` | The tree: flatten, cache, read structure, add/detach/move children |
| `ui/collapsing.ts` | All collapse/expand logic and the hook choke point |
| `ui/headers.ts` | The `+`/`-` button and the indent markers in row headers |
| `ui/contextMenu.ts` | "Insert child row" / "Detach from parent", and it overrides `row_above`/`row_below` |
| `utils/rowMoveController.ts` | Replaces ManualRowMove entirely (see below) |

Note the file names: `ui/headers.ts` and `ui/contextMenu.ts`, not `headersUI.ts`.

## Public API and the choke point

Every collapse and expand goes through **one** method:

```
CollapsingUI#toggleCollapsedRows(physicalParents, action, shouldRunHooks = true)
```

It computes `current` / `destination` / `possible`, fires the cancelable `before*` hook, performs the
change, then fires `after*` with whether the state really changed, and renders once. Four callers
reach it, and they must all keep reaching it or the UI and the API will drift apart:

1. the row header button — `CollapsingUI#toggleState` (a `beforeOnCellMouseDown` listener)
2. the <kbd>Enter</kbd> shortcut — `registerShortcuts()` in `nestedRows.ts`
3. `collapsingUI.collapseAll()` / `expandAll()`
4. every public method on `NestedRows`

**Validity is the choke point's job, not the wrappers'.** A public method only translates its visual
index to physical. "Not a parent" and "out of bounds" are reported as `possible: false`, with both
hooks still firing — that matches `collapsibleColumns`, whose `hooks.spec.js` asserts
`beforeColumnCollapse([], [], false)` for an impossible action. An early return in a wrapper breaks
that mirror silently.

The hooks (`beforeRowCollapse`, `afterRowCollapse`, `beforeRowExpand`, `afterRowExpand`) are declared
in `src/core/settings.ts` and registered in `src/core/hooks/constants.ts`. See
`handsontable/.ai/HOOKS.md` for the two-step and the machine-enforced `allSettings` gate.

## Two sources of truth

- `collapsingUI.collapsedRows` — physical indexes of parents whose children **you collapsed**.
- `plugin.collapsedRowsMap` — which physical rows are **currently trimmed**.

They are written in different places and can drift. Keep this in mind:

- `collapseAll()` records only **top-level** parents while trimming every descendant. So after
  `collapseAll()`, a deep parent is invisible but is *not* in `collapsedRows`. That is intentional and
  self-consistent: it was never explicitly collapsed, and expanding its ancestor restores it.
- `areChildrenCollapsed(row)` reads the **map**; `isAnyParentCollapsed(rowObj)` reads
  **`collapsedRows`**. They answer different questions — do not swap them.

## Landmines

- **`areChildrenCollapsed()` is vacuously `true` for a row with no children.** It starts from
  `allCollapsed = true` and only the children loop can flip it. Any "is this collapsed?" check must
  first confirm the row is a parent — that is why `isParentCollapsed()` guards with
  `dataManager.isParent()`.
- **`dataManager.getRowIndex()`, `getRowObjectParent()`, and `getRowObjectLevel()` return `null` for a
  row object the cache does not know.** `rewriteCache()` builds a brand new `WeakMap` on every
  `loadData`, `updateData`, `addChild`, `detachFromParent`, `filterData`, `spliceData`, and row move,
  so any object an app held from before becomes unknown. These used to throw
  `TypeError: Cannot read properties of undefined`, which is what forced one customer to retry inside
  `requestAnimationFrame`. Never re-introduce the non-null assertion, and never feed the result
  straight into the trimming map — filter `null` out first.
- **`collapseRow()` and `expandRow()` are dead code.** They delegate with `doTrimming` defaulting to
  `false`, so they neither trim nor render. Do not expose them and do not copy their names.
- **`updatePlugin()` rebuilds everything.** It unregisters the trimming map and constructs a new
  `CollapsingUI`, `DataManager`, `HeadersUI`, `ContextMenuUI`, and `RowMoveController`. Any state that
  must survive has to be copied into a local **before** `disablePlugin()` and replayed after
  `enablePlugin()`. The existing `collapsedRowsStash` cannot carry it — that object dies with the old
  instance. Replay with `shouldRunHooks = false`: it repeats a choice the user already made, and
  firing hooks there reports a collapse on every settings update.
- **In React, `updatePlugin()` runs on every re-render.** `SettingsMapper.getSettings()` copies every
  prop except `children` into the `updateSettings` payload, so the `nestedRows` key is always present
  and `BasePlugin#onUpdateSettings` always fires. Anything you keep outside the settings object is
  lost there unless it is explicitly preserved. This regressed once before — see `CHANGELOG.md` for
  "using `updateSettings()` caused the state of nested rows to reset".
- **`collapsedRowsStash.stash()` temporarily expands everything.** Any operation wrapped in
  stash/applyStash briefly un-trims all rows. It is used around add child, detach child, row move,
  and filtering.
- **Construction order matters.** `CollapsingUI`, `HeadersUI`, `ContextMenuUI`, and
  `RowMoveController` all capture `plugin.dataManager` (and some capture `plugin.collapsingUI`) in
  their constructors. Reassigning `plugin.dataManager` later leaves four stale references.
- **The `recursive` parameters of `collapseChildRows()` and `expandChildRows()` are never read.**
  Recursion is unconditional. Do not rely on passing `false`.
- **Do not use `arr.push(...bigArray)` here.** `collapsing.ts` and `nestedRows.ts` are both listed in
  `handsontable/.ai/CONCERNS.md` as stack-overflow risks with 10k+ rows. Build index lists with a loop.
- **`batchExecution` does not suspend rendering.** Use `hot.batch()` when a method performs two
  passes (as `expandToLevel()` does), or the grid renders the intermediate state.

## How it interacts with the rest of the grid

- **Pagination** declares a hard conflict against `nestedRows`
  (`registerConflict` in `pagination.ts`). It is the only machine-enforced incompatibility; the
  sorting and filtering limitations in the guide are prose only.
- **MergeCells** detects a collapse by watching the row trimming map, because no hook existed when it
  was written. The new hooks are a better signal — worth migrating.
- **Filters** are hijacked: the `filterData` hook physically splices `__children` and rewrites the
  cache, so filtering **mutates the nested source structure** instead of trimming indexes.
- **ManualRowMove is cancelled outright.** `rowMoveController.onBeforeRowMove` returns `false`, does
  its own `__children` restructuring, and then fires `afterRowMove` by hand. So a nested-rows move is
  a source-data change, not an index permutation — `IndexesSequence` is untouched, and visual and
  physical order never diverge because of a move. Only trimming makes them diverge.
- **UndoRedo** deletes `__children` before storing undo data, because this plugin restores the tree
  itself.

## Tests

| Location | Covers |
|---|---|
| `__tests__/ui/collapsing.spec.js` | The public API, the four hooks, and collapsed-state integrity |
| `__tests__/data/dataManager.spec.js` | Every DataManager method, including stale-object safety |
| `__tests__/keyboardShortcuts.spec.js` | <kbd>Enter</kbd> on a row header |
| `__tests__/integration/manualRowMove.spec.js` | The richest file — moves into and around collapsed parents |
| `__tests__/nestedRows.types.ts` | Type coverage for the public surface |
| `tests/e2e/nested-rows-api.spec.ts` | Playwright: hooks, cancelling, and post-`loadData` safety |

Physical layouts of the shared fixtures, which the specs depend on:

- `getSimplerNestedData()` — 18 rows, three top-level parents at physical **0, 6, 12**, five leaf
  children each.
- `getMoreComplexNestedData()` — 13 rows, parents at physical **0** (level 0), **3** (level 1),
  **4** (level 2), **8** (level 0), **10** (level 1).

Getting these wrong is the most common reason a new spec here fails; check the layout before assuming
the code is broken. Remember too that collapsing shifts visual indexes, so a physical row is only
equal to its visual row while nothing above it is trimmed.

Other suites reach into this plugin's internals: `columnSummary.spec.js` and the `formulas` specs call
`collapsingUI` directly. Keep those members working.

## Docs coupling

- The API reference page is generated from the JSDoc in this folder, and `@private` members are
  dropped. A public method with a thin doc block ships a thin docs page.
- The guide is `docs/content/guides/rows/row-parent-child/`. Its examples must use the public API —
  they called `collapsingUI.collapseChildren()` for years, which is how customers learned to do the
  same.

## Deliberate non-goals

- No method collapses or expands more than one parent per call. Callers loop inside
  `hot.batchExecution()`.
- No `getChildren()`. Children can be trimmed, so it would have to return physical indexes for little
  gain; `__children` is already reachable through `getSourceDataAtRow()`.
