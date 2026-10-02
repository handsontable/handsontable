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
- **`captureState()` runs on every undo transaction, so it must not walk the header tree each time.** It
  returns `previous` when the state manager's `getCollapsedGroupsVersion()` is the one recorded for
  `previous`, and walks the tree (`exportCollapsedGroups()`) only after the version moved. The version is
  kept in a `WeakMap` beside the state, not inside it: after a version change with the same groups,
  `previous` must be returned by reference (see `../undoRedo/AGENTS.md`), and a version stored inside it would
  then be stale, so every later step would walk the tree again.
- **The state carries the header config version (`getConfigVersion()`), and `restoreState()` skips a state
  from another configuration.** A group is recorded by header level and authored column, so after
  `updateSettings({ nestedHeaders })` the same identity can name a different group of the new
  configuration, and a redo would mark a group collapsed that the user never collapsed. The config version
  is stored inside the state (unlike the collapsed-groups version) because it changes what the state means,
  so a state from another configuration is never returned as `previous`. The collapse hiding map is still
  restored from the step's snapshot, like every index map. A config change expands the tree but does not
  clear that map (older behavior), so right after it the collapsed columns stay hidden with no group
  collapsed. The same config sent again (a wrapper re-render) is not another configuration: the version
  stays, so an undo and a redo across it put the group back with its hidden columns.
- **`getStateColumns()` answers `[]`.** A group is recorded by header position, and the columns a
  collapse hides are in this plugin's hiding maps, which the UndoRedo check of a `columns` settings
  update reads column by column. Without the method a collapse step - and every step older than it -
  dropped on any `columns` update that changed a field.
- **The indicator press is stopped by setting the grid's `isImmediatePropagationEnabled = false` flag only, never with the `stopImmediatePropagation()` helper from `helpers/dom/event`.** The helper also sets `cancelBubble`, so the press never reaches `document`, where a dropdown menu or context menu listens for the `mousedown` that closes it, and the menu stays open over a group that just collapsed or expanded (DEV-214). The flag alone is enough: `tableView` checks it right after `beforeOnCellMouseDown` and skips selection handling. The helper stays right for callers that really must stop bubbling.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='collapsibleColumns'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='collapsibleColumns'`
