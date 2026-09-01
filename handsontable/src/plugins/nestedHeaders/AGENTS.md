# NestedHeaders + CollapsibleColumns — architecture

Non-obvious internals of `NestedHeaders` and its tight partner `CollapsibleColumns`. Read this before
changing the header tree, the move/reparent logic, or collapse behavior. Surface API lives in JSDoc and
`docs/content/guides/columns/column-groups/`; this file is the stuff that is **not** discoverable by
skimming the public option.

## Mental model (read this first)

```
authored nestedHeaders setting
  → SourceSettings           (#sourceSettings — normalized, PHYSICAL-keyed, never mutated by moves)
  → deriveVisualSettings()   (applies ColumnArrangement + #membershipOverrides)
  → #derivedSettings         (VISUAL-keyed, move-aware)
  → HeadersTree.buildTree()  (TreeNode forest; collapse/identity logic lives here)
  → generateMatrix()         (#matrix — 2D [headerLevel][visualColumn]; the ONLY thing the DOM reads)
  → header renderers         (afterGetColumnHeaderRenderers)
```

**The one principle that explains the whole design: _derive, don't mutate._** `#sourceSettings` is the
authored truth and is never rewritten by a column move. Everything that "follows the move" is recomputed
into `#derivedSettings` from (source + arrangement + overrides). If you find yourself wanting to mutate
the source or the tree to reflect a move, you are fighting the architecture — record an override instead.

`StateManager` (`stateManager/index.ts`) owns all of this. `NestedHeaders` (the plugin) is mostly hooks,
selection/keyboard wiring, and the renderers; `CollapsibleColumns` is UI (buttons) + two hiding maps and
delegates every structural decision to the same `StateManager`.

## Matrix vs Tree — they are not interchangeable

| | `HeadersTree` | matrix (`generateMatrix`) |
|---|---|---|
| Shape | TreeNode forest (parent→children) | `matrix[level][visualColumn]` |
| Purpose | collapse state, ancestry, identity across moves | flat per-`<th>` settings |
| Drives DOM? | **No** | **Yes** — renderers read `getHeaderSettings(level, visualCol)` |

The matrix is regenerated from the tree on every structural/visibility change. `createHeaderSettings`
in `matrixGenerator.ts` **strips `crossHiddenColumns` and `columnDropMode`** from the matrix node — the
former is a visibility detail, the latter a structural input only the tree derive needs. Don't expect to
read `columnDropMode` off the matrix.

`colspan` (matrix) = visible-column count, excludes hidden columns. `origColspan` = authored span. A
`<th>` whose run is partly hidden gets `colspan` shrunk; column-header **height** must use `origRowspan`,
not the shrunk value.

## Coordinate systems (the usual three, and they bite here)

- **Physical** — index in source data. `#sourceSettings` and `#membershipOverrides` are physical-keyed.
- **Visual** — after trimming/moves. The tree, `#derivedSettings`, and the matrix are visual-keyed; a
  tree node's `columnIndex` is **visual**.
- **Renderable** — after hiding. Renderers receive a renderable index and call
  `columnIndexMapper.getVisualFromRenderableIndex()` before touching the matrix.

`ColumnArrangement` (`stateManager/columnArrangement.ts`) is the physical↔visual adapter the derive runs
against. With no moves it is the identity arrangement (visual ≡ physical ≡ authored). The plugin installs
a live adapter wrapping `hot.columnIndexMapper` so the structure follows moves.

## Membership overrides & reparenting (the move model)

When a move makes a group's columns non-contiguous, the derive needs a fact it cannot infer from the
final arrangement alone: *which group does a moved column now belong to?* That fact is
`#membershipOverrides: Map<physical, Map<level, ownerIdentity>>`.

- `ownerIdentity >= 0` → adopted into the group anchored at that authored owner column.
- `ownerIdentity < 0` → standalone; encoded as the sentinel `-1 - physical` (so the physical index is
  recoverable). See `resolveOwnerKey` / `computeOwnerIndex` in `deriveSettings.ts`.

`reparentColumns` (in `stateManager/index.ts`) decides overrides from the **pre-move** layout, then
applies them, so a whole group moved together stays intact. The load-bearing rule:

```
enclosing >= 0 && authoredLayers[level][enclosing]?.columnDropMode !== 'split'  // → adopt at this level
```

i.e. a foreign column dropped strictly inside a group is **adopted** unless that group opted into
`columnDropMode: 'split'`. **A group always reclaims its OWN columns** regardless of `columnDropMode` —
an origin column's authored owner *is* that group, so it rejoins by contiguity; only foreign columns are
affected by the flag. (`columnDropMode` is the renamed, future-proofed successor to the old boolean
`splittable`: `'adopt'` = old `false`/default, `'split'` = old `true`. Values are an open enum so a
future `'reject'`/`'displace'` can be added without a breaking change.)

**Override lifetime — reset vs preserved is deliberate, don't "simplify" it:**
- **Reset** (`#resetMembershipOverrides`) on `setState`, `insertColumns`, `removeColumns` — authored
  identities/physical indexes shift, so old overrides are stale and would mis-adopt.
- **Preserved** on `rebuildState` (move), `mergeStateWith`, `mapState` — these use identity shift, so
  overrides stay valid.

## State rebuild paths

| Path | Trigger | Collapse kept | Overrides reset | Regens matrix |
|---|---|---|---|---|
| `setState` | new `nestedHeaders` config | no | **yes** | yes |
| `rebuildState` | column move | yes (by authored identity) | no | yes |
| `insertColumns` | `afterCreateCol` | yes | **yes** | yes |
| `removeColumns` | `afterRemoveCol` | yes | **yes** | yes |
| `mergeStateWith` / `mapState` | CollapsibleColumns sync | yes | no | yes |
| `triggerNodeModification` | collapse/expand click | n/a | no | **only if modified** |

Collapse is re-applied after a rebuild **by authored group identity, not visual column** — so a
`columnDropMode: 'split'` group that fragments across non-adjacent visual columns has every fragment
re-collapsed (same authored identity, multiple same-label banners).

`triggerNodeModification` is split into a public method (regenerates the matrix once when something
changed) and an internal `#applyNodeModification` (matrix-free). The collapse-reapply loops call the
internal form so a single trailing `#applySyncVisibility` regenerates the matrix **once** — calling the
public one in a loop regenerates per iteration (expensive). If you call `triggerNodeModification` from
outside, do not assume each call rebuilds the matrix.

## CollapsibleColumns relationship (priority ordering is load-bearing)

- `NestedHeaders.PLUGIN_PRIORITY = 280`, `CollapsibleColumns.PLUGIN_PRIORITY = 290`. Lower runs first, so
  on insert/remove/move **NestedHeaders rebuilds the tree (+ applies overrides + re-attaches collapse)
  before** CollapsibleColumns re-derives its `visibleWhen` hidden set against the finalized tree. Reverse
  the order and `visibleWhen` is derived against a stale tree.
- `CollapsibleColumns` declares `static PLUGIN_DEPS = ['plugin:NestedHeaders']` and reads the same
  StateManager via `nestedHeadersPlugin.getStateManager()`. The data flow is one-directional:
  CollapsibleColumns **reads** tree/matrix state and **writes** hiding maps; NestedHeaders never asks
  CollapsibleColumns what is collapsed — it reads the hiding maps back through `syncVisibility`.
- **Two separate hiding maps**, both type `'hiding'` on `columnIndexMapper`:
  - `this.pluginName` (`'collapsibleColumns'`) — legacy first-visible-child collapse. This is what
    `getCollapsedColumns()` reports (PHYSICAL indexes).
  - `'collapsibleColumns.visibleWhen'` — columns hidden by per-header `visibleWhen` markers in
    *declarative* groups. Kept separate so `getCollapsedColumns()` stays a faithful record of explicit
    collapses. A consumer wanting "all hidden header columns" must consider both.
- **`visibleWhen`** (`'collapsed' | 'expanded' | 'always'`, default `'expanded'`) is per-child and only
  meaningful in a *declarative* group (a group where at least one child sets it). Derivation never hides
  every child — the first stays visible so the collapse indicator survives.
- On a move that would split a *collapsed* group, CollapsibleColumns **preemptively expands it** in
  `beforeColumnMove`, so reading `getCollapsedGroups()` inside/after that hook can show fewer groups than
  before.

## Hook timing & move gotchas (hard-won)

- `columnIndexMapper.moveIndexes` is **not batched**: it sets `indexesChangeSource = 'move'` and fires a
  synchronous `cacheUpdated`. NestedHeaders rebuilds in its `cacheUpdated` local hook when the change
  source is a move (or a pending rebuild flag is set).
- `manualColumnFreeze.freezeColumn`/`unfreezeColumn` call `columnIndexMapper.moveIndexes` **directly**,
  bypassing `beforeColumnMove`/`afterColumnMove`. So a captured move can still be "open" when an
  unrelated reorder (freeze) fires `cacheUpdated`.
- Guard against that with `#capturedMoveExplainsReorder` (in `nestedHeaders.ts`): it only reparents if
  the residual sequence (everything except the captured columns) is unchanged between pre- and post-move
  — otherwise the capture didn't cause this reorder and is skipped.
- The captured move state (`#movedPhysicalColumns`, `#preMoveColumnSequence`) is cleared **only after it
  is consumed** in the cacheUpdated handler, not unconditionally — a CollapsibleColumns auto-expand fires
  a synchronous hidden-only `cacheUpdated` *before* `moveIndexes`, and clearing eagerly dropped the
  pending move.

## TypeScript notes

- `utils/dataStructures/tree.ts` `TreeNode<T>` is generic with a permissive default; nestedHeaders
  consumes `TreeNode<HeaderNodeData>` so consumers don't cast `node.data`. Don't reintroduce
  `node.data as HeaderNodeData` casts — fix the generic instead.
- `ColumnDropMode` is declared in `stateManager/utils.ts` and re-used across the pipeline; import the
  type, don't inline `'adopt' | 'split'` string unions.

## Testing

- E2E: `npm run test:e2e --prefix handsontable -- --testPathPattern='nestedHeaders'`
- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern='nestedHeaders'`
- Move/reparent behavior: `__tests__/plugins/manualColumnMove/` — `general.spec.js` (cooperation:
  follow-data, collapse coordination, insert/remove, freeze) plus one file per `columnDropMode`
  strategy (`adopt.spec.js`, `split.spec.js`). **Add a new drop strategy's tests in its own
  `<strategy>.spec.js` here.** Collapse + hidden interplay: `__tests__/hidingColumns.spec.js`.
  Derive/override logic: `__tests__/stateManager/*.unit.ts`.
- Discipline for move/derive fixes: write the test, confirm green, toggle the fix off to confirm red,
  restore. The derive bugs in this area pass shallow tests easily.
