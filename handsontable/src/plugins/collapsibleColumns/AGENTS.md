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

## The indicator is a real element (DEV-3003), and the append order is load-bearing

`#onAfterGetColHeader` still writes the glyph through `fastInnerText(el, '+' | '-')` — that call
**replaces every child of `el`**, so `el.appendChild(createIcon(this.hot, 'collapseOn' | 'collapseOff'))`
runs strictly *after* it in both branches. Appending before would have the icon wiped out on the very
next line.

That ordering is also what makes plain `createIcon()` + `appendChild()` safe here, with no `syncIcon()`
slot bookkeeping needed: `fastInnerText` runs on **every** draw, unconditionally, in both the collapsed
and expanded branches, so the icon slot is always empty by the time `appendChild` runs — there is never
a stale icon to dedupe against. Forcing several renders in a row still leaves exactly one icon, because
each draw starts by wiping the previous one.

The `'+'`/`'-'` text stays. It is not new user-visible content: `text-indent: -100px; font-size: 0;` on
`.collapsibleIndicator` (`_collapsible-columns.scss`) already hid it before this change, so it was
always a no-CSS fallback rather than visible glyph text — same reasoning as the context menu check mark
(task 7), which kept its text for the same reason.

**Two pseudo-elements shared one selector, and only one of them was the glyph.** `_collapsible-columns.scss`
had `&::before` (glyph: `color` in every `.expanded`/`.collapsed`/hover/active-highlight rule, matching
the icon's `mask + background-color: currentColor` pattern) and `&::after` (chrome: `background-color` +
`box-shadow` border, sitting at `z-index: 0` behind the glyph's `z-index: 1`). Only `::before` was
retired — its `@include mixins.pseudo` was dropped so the leftover `iconsMap` rule (width/height/
mask-image/background-color, no `content` of its own) paints nothing, exactly like the sorting and
pagination migrations. `::after` keeps its `@include mixins.pseudo` untouched.

**The shared `.ht-icon` rule serves BOTH plugins on purpose — do not scope it to `.collapsibleIndicator`
alone.** The retired `::before` (and its state-color rules) lived on the selector list
`.collapsibleIndicator, .ht_nestingButton` — Nested Rows' own collapse button, migrated by task 14. The
replacement `> .ht-icon` rule (position/size/centering/z-index) and every re-keyed `color` rule stay on
that same shared selector list, so task 14 only has to make `ui/headers.ts` append an `<i class="ht-icon
ht-icon-collapse-on/-off">` the same way — it should not need to touch this SCSS block at all.

**The NestedHeaders ghost table (`utils/ghostTable.ts`) builds its own `.collapsibleIndicator` clone for
width measurement, and now appends the same icon** (`indicator.appendChild(createIcon(this.hot,
'collapseOff'))`, after `indicator.textContent = '-'` for the same replace-all-children reason). This
does **not** change any measured width: unlike the column-sorting arrow (task 9), `.collapsibleIndicator`
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
