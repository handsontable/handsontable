# CollapsibleColumns — architecture

**CollapsibleColumns and NestedHeaders share one engine — the NestedHeaders `StateManager`.** Before
changing anything structural here, read the combined knowledge base:

➡️ **`src/plugins/nestedHeaders/AGENTS.md`** (header tree, derive/move/reparent, collapse, coordinate
systems, hook timing). It documents both plugins together because they are inseparable.

## What lives here vs there

This plugin is **UI + hiding maps**; the structural logic is in NestedHeaders' `StateManager`.

- `CollapsibleColumns` owns: the collapse/expand buttons (`collapsibleIndicator`), click/keyboard input,
  selection adjustment after hide, and **two hiding `IndexMap`s** on `columnIndexMapper`.
- It does **not** own the header tree. It reads tree/matrix state via
  `nestedHeadersPlugin.getStateManager()` and triggers collapse through `triggerNodeModification`.

## The few CollapsibleColumns-specific facts to keep straight

- `PLUGIN_PRIORITY = 290`, and `static PLUGIN_DEPS = ['plugin:NestedHeaders']`. NestedHeaders is 280, so
  it rebuilds the tree (and applies move/reparent overrides) **before** this plugin re-derives its
  `visibleWhen` hidden set. This ordering is load-bearing — see the NestedHeaders doc.
- **Two separate hiding maps**, both type `'hiding'`:
  - `this.pluginName` (`'collapsibleColumns'`) — legacy first-visible-child collapse;
    `getCollapsedColumns()` reports this map (PHYSICAL indexes).
  - `'collapsibleColumns.visibleWhen'` — columns hidden by per-header `visibleWhen` markers in
    declarative groups. Kept separate **on purpose** so `getCollapsedColumns()` stays a faithful record
    of explicit collapses. "All hidden header columns" must consider both maps.
- Collapse/expand mutates the tree node (`isCollapsed`) and regenerates the matrix once; this plugin then
  re-derives `visibleWhen` and updates its map only when the set changed. Before-hook veto runs collected
  rollbacks — including for declarative groups that flipped `isCollapsed` but reported no affected columns.
- On a move that would split a *collapsed* group, this plugin **preemptively expands it** in
  `beforeColumnMove`, so `getCollapsedGroups()` read in/after that hook can return fewer groups.
- Hook-payload coordinate spaces are mixed under active moves/trim: `currentCollapsedColumns` is PHYSICAL,
  `destinationCollapsedColumns` mixes physical + visual with no conversion. Re-read `getCollapsedColumns()`
  after structural changes rather than caching a hook payload.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='collapsibleColumns'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='collapsibleColumns'`
