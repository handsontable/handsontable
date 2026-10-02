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

## The indicator is a real element, updated in place on every draw

`#onAfterGetColHeader` runs for every collapsible header on every draw, so it must not rebuild the
indicator. `#syncIndicatorContent()` keeps two children: the leading `'+'`/`'-'` text node, updated
through `textContent` only when the state flips (inserted once if missing), and one icon kept through
`syncIcon()` with the `collapsibleIndicator__icon` slot class, which swaps `collapseOn`/`collapseOff` on a
state change and re-applies the theme mapping only when the icons revision moved.

**Never write the text with `fastInnerText()` here.** Once the text node has a sibling (the icon),
`fastInnerText()` always takes its slow lane - it empties the element and builds a new text node - so
the icon would have to be rebuilt after it on every draw, re-running any icon renderer callback per
header per scroll frame. That was the first version of the element, and review flagged it.
Pinned by "a draw with no state change keeps the indicator's icon and text nodes" in
`tests/e2e/icon-elements.spec.ts`.

The `'+'`/`'-'` text stays. It is not new user-visible content: `text-indent: -100px; font-size: 0;` on
`.collapsibleIndicator` (`_collapsible-columns.scss`) already hid it before this change, so it was
always a no-CSS fallback rather than visible glyph text — same reasoning as the context menu check mark,
which kept its text for the same reason.

**Two pseudo-elements shared one selector, and only one of them was the glyph.** `_collapsible-columns.scss`
had `&::before` (glyph: `color` in every `.expanded`/`.collapsed`/hover/active-highlight rule, matching
the icon's `mask + background-color: currentColor` pattern) and `&::after` (chrome: `background-color` +
`box-shadow` border, sitting at `z-index: 0` behind the glyph's `z-index: 1`). Only `::before` was
retired — its `@include mixins.pseudo` was dropped so the leftover `iconsMap` rule (width/height/
mask-image/background-color, no `content` of its own) paints nothing, exactly like the sorting and
pagination migrations. `::after` keeps its `@include mixins.pseudo` untouched.

**The shared `.ht-icon` rule serves BOTH plugins on purpose — do not scope it to `.collapsibleIndicator`
alone.** The retired `::before` (and its state-color rules) lived on the selector list
`.collapsibleIndicator, .ht_nestingButton` — Nested Rows' own collapse button. The
replacement `> .ht-icon` rule (position/size/centering/z-index) and every re-keyed `color` rule stay on
that same shared selector list, so Nested Rows only has to make `ui/headers.ts` append an `<i class="ht-icon
ht-icon-collapse-on/-off">` the same way — it does not touch this SCSS block at all.

**The NestedHeaders ghost table (`utils/ghostTable.ts`) builds its own `.collapsibleIndicator` clone for
width measurement, and now appends the same icon** (`indicator.appendChild(createIcon(this.hot,
'collapseOff'))`, after `indicator.textContent = '-'` for the same replace-all-children reason). This
does **not** change any measured width: unlike the column-sorting arrow, `.collapsibleIndicator`
is not absolutely positioned — its box is a fixed `width`/`height` in `--ht-icon-button-hit-area-size`,
set on the element itself, so it reserves the same space in flow whether or not an icon child is
present. The icon was still added there for DOM parity with the real header, the same reason every
other node in `#buildHeaderLabel` (`.relative`, `.colHeader`, `.changeType`) mirrors the real table
instead of only approximating it.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='collapsibleColumns'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='collapsibleColumns'`
- E2E icon coverage: `tests/e2e/icon-elements.spec.ts`, `test.describe('collapsible nested-header
  indicator')`, against `tests/fixtures/demo/icon-elements.html?nestedHeaders=1`.
