# Shared menu library — `Menu`, `ItemsFactory`, `CommandExecutor` and `registerMenuEntries()`

This is **not a plugin**, which is why it sits under `src/utils/` and not under `src/plugins/`. It is the menu code that `ContextMenu` and `DropdownMenu` share: the `Menu` class and its helpers (`menu/`), the predefined items (`predefinedItems/`), `ItemsFactory`, `CommandExecutor`, `menuEntries.ts` and the item types (`types.ts`). `MenuItemConfig` and `PredefinedMenuItemKey` are still exported publicly from `plugins/contextMenu`. Read this before touching any of it, or a plugin that contributes menu items. The ContextMenu plugin itself is in `../../plugins/contextMenu/AGENTS.md`.

## The old `plugins/contextMenu/` paths are legacy re-exports

This library used to live in `src/plugins/contextMenu/`. Every module it had there (`utils`, `itemsFactory`, `commandExecutor`, `menu/*`, `predefinedItems/*`) is kept as a one-line re-export of its `src/utils/menu/` twin, default export included. They are not in the `exports` map, but the package ships their declaration files, so a consumer on `moduleResolution: node` (or another resolver that ignores the map) can still import them. Legacy means kept, with no warning. Add code here, never there, and import the library from `utils/menu` in core code. `plugins/contextMenu/__tests__/legacyModulePaths.unit.js` checks that each old path exposes the same bindings as its twin, so a module added to, renamed in or removed from `utils/menu` that had an old path fails there.

## A plugin contributing menu items registers them through `registerMenuEntries()`

The two menus build their item lists from separate hooks: `afterContextMenuDefaultOptions` and `afterDropdownMenuDefaultOptions`. A plugin that registers on only one is absent from the other, and **nothing raises**. Until DEV-2758 that was actively misleading: `ItemsFactory` turned a key it could not resolve into a bare `{ name, key }` placeholder, so the menu rendered a row labeled with the RAW KEY that did nothing when clicked. That was issue #5429 — `freeze_column` worked in `contextMenu` and rendered a dead row in `dropdownMenu` for seven years.

An unresolvable key in the **array** form is now **skipped**, with a `warnOnce()` naming both the key and the menu it came from. So the failure is quiet in the UI and loud in the console instead of the other way round. It is still a failure: the item does not appear, so registering the entries for the menu remains the fix, not the warning.

The menu name comes from `ItemsFactory`'s third constructor argument (each plugin passes its own `PLUGIN_KEY`). It is part of the `warnOnce` dedup key as well as the text, because both menus share one `hot.rootElement` scope — without it, a key unresolvable in *both* menus warns once and names neither.

Two cases are deliberately outside the skip. A key naming a built-in `ITEMS` member with no current entry is dropped silently, exactly as before — `allowInsert*`/`allowRemove*` suppress theirs at render time. And the **object** form of `items` is untouched by this PR: there a plain string value is looked up as an item key first and, when no item has that key, becomes the item's *label*, so nothing is reported. Do not describe the skip as covering every unresolvable key.

Register through `registerMenuEntries(plugin, createEntries, targets)` (`menuEntries.ts`), not through the two hooks by hand. `targets` names each menu the entries go to, and each target takes two optional settings:

- `inDefaults` (default `true`) decides whether the entries join the list shown for the `true` option. With `false` the entries are only *available*: the hook adds an entry only when the menu's setting lists its key (an array of keys, an array item object with that `key`, or a key of the object form's `items`, or a string value there, which `ItemsFactory#getItems()` resolves as a key: `{ items: { myHide: 'hidden_columns_hide' } }`). Under `true` it adds nothing, so the `true` list and the hook's `options.items` stay as they were, and `ItemsFactory` needs no record of which keys sit outside the defaults. Decide from the settings, never from a mark on the entry objects: a listener that replaces `options.items` with copies (`options.items.map(item => ({ ...item }))`) drops such a mark. An item an application adds through the same hook under one of these keys stays in the `true` list, because the plugin pushes nothing there to replace it.
- `orderIndex` is the hook's order index, for entries that must land after another plugin's (ManualColumnFreeze places its dropdown entries after Filters this way).

Pick `inDefaults` per menu. Whatever reaches the dropdown hook with `inDefaults: true` is added to every `dropdownMenu: true` grid, which is a visible change for existing users, so a plugin new to the dropdown starts with `inDefaults: false`. An entry that belongs to one menu only (a row action such as `add_child`) targets that menu only. Entries that join the defaults get a separator in front of them. Available-only entries get none, because their position comes from the user's list.

`createEntries` runs on every build of every targeted menu and must return new objects each time, each with its `key`. The hooks go through the plugin's `addHook()`, so `disablePlugin()` removes them from both menus.

Nine plugins use it: ManualColumnFreeze (both menus, both in defaults), HiddenColumns (context menu in defaults, dropdown menu available only), and `comments`, `copyPaste`, `customBorders`, `exportFile`, `hiddenRows`, `mergeCells` and `rowSelection` (context menu only), so `copy`, `mergeCells`, `commentsAddEdit`, `borders` and the row-hiding keys are still absent as dropdown menu keys. `nestedRows` still adds to the context menu hook by hand, because it also rewrites the built-in `row_above` and `row_below` callbacks (`../../plugins/nestedRows/ui/contextMenu.ts`). `filters` adds its items to the dropdown menu hook by hand; its items work only there. A `createEntries` that returns an empty list adds nothing, not even a separator.

A plugin file under `src/plugins/` other than `contextMenu/` must not import from `**/contextMenu/*`: the `no-restricted-imports` rule in `handsontable/.eslintrc.js` fails it. Import the shared library from `src/utils/menu/` instead. The public entry `../contextMenu` stays allowed.

### The skip runs only AFTER the default-options hook — never move it into `getItems()`

`prepareMenuItems()` calls `ItemsFactory#getItems()` **twice**: once to build the list handed to the hook, then `setPredefinedItems()`, then again. On the first pass every plugin key is unknown *by design*, and the placeholder emitted there is load-bearing — `../../plugins/nestedRows/ui/contextMenu.ts` runs `rangeEach(0, items.length - 1, …)` and inserts its entries only when the list is **non-empty**. Filtering inside `getItems()` unconditionally makes `contextMenu: ['add_child']` yield an empty first-pass list, nestedRows never inserts, and `add_child` vanishes — re-breaking issue #9894. The `#predefinedItemsSet` flag is what confines the skip to the second pass; `__tests__/itemsFactory.unit.js` pins both halves. `getItems(pattern, false)` is a quiet second pass: it still skips the key but reports nothing.

An array entry can also be a full item definition **object** rather than a key string. Those are merged in further down and must never reach the unresolved-key path, which is why the skip is guarded by `!isObject(name)`.

**The object-form placeholder must be a COPY of the user's item, never the user's object (DEV-3140).** On the first pass a plugin key such as `commentsAddEdit` is unknown, so `getItems()` falls back to the user's own object as the placeholder. `setPredefinedItems()` then merges the plugin's rich entry into that placeholder with `extend(items[key], value)`, and the plugin's properties win. If the placeholder IS the user's object, the plugin's `disabled` overwrites the user's `disabled` in place, and the final pass has nothing left to re-apply — `disabled()` was never called, while `hidden()` survived only because the plugin defines none. Any plugin item property the plugin also defines (`disabled`, `name`, `callback`) was lost the same way. The copy in `getItems()` keeps the user's object intact, so the final pass re-applies the user's values on top of the plugin's entry. `DropdownMenu` runs the same two passes, so this reaches the Filters items too: a user `hidden()` on `filter_by_value` and its siblings now REPLACES the plugin's own `hidden()` (`isHiddenInMenu()`: the `hide()` flag, the per-column `filters` switch, the active-`dataProvider` rule) instead of being silently discarded. Replacing rather than combining is the same rule every other overridden property follows. Pinned by `__tests__/itemsFactory.unit.js` and `tests/e2e/context-menu-item-override.spec.ts`.

### `execute()` resolves the PARENT name first, and the whole name only as a fallback

Object-form `items` take their key verbatim, so `{ items: { 'alignment:left': … } }` registers a command under the full string, colon included. `CommandExecutor#execute()` used to split on `:` unconditionally and look up only the first segment, so that command was never found and a click threw `Menu command 'alignment' not exists.` (issue #5027). `#findCommand()` now falls back to the whole-name lookup — but **only where the split path used to throw**, and the order matters:

1. `commands[parent]` exists → walk its `submenu` for the subcommand, exactly as before.
2. Otherwise `commands[<whole name>]` exists → return it.
3. Otherwise throw.

Reversing 1 and 2 looks equivalent and is not. Both entries exist at once whenever object-form `items` declare the parent *and* the colon key side by side (`{ items: { alignment: {}, 'alignment:left': {…} } }`): the parent carries the predefined submenu with the real callback, while the colon key is the caller's bare `{ name, key }`. Matching the whole name first hands back the bare entry, which has no `callback`, so an alignment that used to work silently stops running. Pinned by `__tests__/commandExecutor.unit.js`.

Both lookups go through `hasOwnProperty()` — `commands` is a plain object, so a bare index answers `toString` and `constructor` with the inherited member, which then slips past every gate in `execute()` and runs the common callback instead of reporting an unknown command.

`hasCommand()` is the boolean form of the same rule. `DropdownMenu#executeCommand` asks it rather than re-implementing the two lookups, because that method rebuilds the whole item list when a name looks unknown — so a copy of the rule that went stale would re-fire both item hooks on every colon-keyed command.

A subcommand name that matches no submenu entry is a `warnOnce()` and a no-op. It previously read `disabled` off `undefined` and threw a `TypeError`; silence would have been worse than either, since a mistyped *parent* still throws.

Note what none of this does: it does not attach a predefined subcommand's callback to a caller's item. `{ 'alignment:left': { name: 'Left' } }` renders and no longer throws, but it does nothing when clicked, because no `callback` was supplied. Resolving predefined subcommand keys at any menu level is the open request in issue #5027 and was deliberately not built — it would mean changing the shallow `extend` merge that #9894 depends on.

Both menus now rebuild their item list on every `open()` (`prepareMenuItems()`), so the list tracks the current settings. Before that, `DropdownMenu` built its list once in `enablePlugin`, which left it frozen: a plugin enabled later through `updateSettings` never reached the menu, and one disabled later kept entries that still ran. Do not move item building back into `enablePlugin` — and note that the `Menu` instance and its local hooks are still created there, deliberately, so `prepareMenuItems()` stays safe to call repeatedly. `DropdownMenu` still builds once there, quietly, so that a key of a plugin that enables later (Filters) is not reported as unresolved – see `../../plugins/dropdownMenu/AGENTS.md`, "The enable-time build is quiet".

One thing a rebuild does **not** cover: `CommandExecutor` never evicts a command it registered, and `execute()` gates on `disabled`, not `hidden`. So an item contributed by a plugin that is now off is still reachable through `plugin.executeCommand(key)`. An item whose availability depends on its plugin being enabled needs that check on **both** `hidden()` and `disabled()`.

## `executeCommand()` passes no `selection`: a menu item reads the selection off the instance

A menu click hands every item callback `(key, selection, event)`. `DropdownMenu#executeCommand(name, ...params)` (and `ContextMenu`'s) forwards only what the caller passes, so `selection` is `undefined` unless the caller supplies it. An item callback that reads `selection[0]` throws `Cannot read properties of undefined` on every programmatic call: `clear_column` did. A predefined item reads `this.getSelectedRange()` itself and treats the `selection` argument as an optional override (`utils/menu/predefinedItems/clearColumn.ts`). `executeCommand()` also runs the item's `disabled()` first, so a command that needs a column selection does nothing for a cell selection, and a key the menu did not register throws `Menu command '<key>' not exists.` The default dropdown items are `col_left`, `col_right`, `remove_col`, `clear_column`, `make_read_only` and `alignment`; `undo`, `redo` and the row items work only when the `dropdownMenu` setting lists them. The shared rule, for `ContextMenu` too: an item callback treats `selection` as an optional override. `clear_column` does not import `normalizeSelection()` because `menu/utils.ts` imports `predefinedItems`, which would close an import cycle. Pinned by `tests/e2e/menu-execute-command.spec.ts`.

## A menu item's state goes on the item, never inside its `name`

`menuItemRenderer` writes an item's resolved `name` through `fastInnerHTML`, which is a Trusted Types sink. Anything an item bakes into that string as markup therefore takes the whole menu down under a CSP carrying `require-trusted-types-for 'script'`, and it is the grid's own markup, so no `sanitizer` should be needed for it.

That is what DEV-2650 fixed. `markLabelAsSelected()` (`utils.ts`) and its byte-for-byte copy `markSelected()` (`../../plugins/customBorders/utils.ts`) prefixed a label with `<span class="selected">✓</span>`, so a read-only selection or a bordered one threw. Neither is used any more, and both were kept as legacy exports — their modules ship a declaration file, so a consumer on `moduleResolution: node` can import them whatever the `exports` map says. An item declares `checked` instead — `boolean`, `MENU_ITEM_MIXED` (`'mixed'`), or a function returning one, resolved by `getItemCheckedState()` in `menu/utils.ts` the same way `isItemDisabled` resolves `disabled` — and the renderer builds the span with `createElement`. `isItemChecked()` survives as the two-state reader and answers `false` for mixed.

Five things to keep right when touching this:

- **Insert the mark AFTER calling `fastInnerHTML`.** It replaces everything the wrapper holds, so a span appended first is wiped. The rendered DOM must stay `[span.selected, text]`; four legacy positioning specs measure that span's offset.
- **Declaring `checked` makes an item checkable**, so it is announced as `menuitemcheckbox` and carries `aria-checked`. That is not a convenience: `aria-checked` is invalid on a plain `menuitem`, so leaving these items as menu items would draw a mark a screen reader cannot perceive — worse than the markup-in-the-label it replaced, which at least reached the accessible name. Five of the six in-tree items rely on this; only `make_read_only` declares `checkable` itself. An explicit `ariaChecked` still wins, and predates the flag, so that is the one way the mark and the announced state can still be made to disagree.
- **The checkbox branch labels from `ariaLabel ?? itemValue`.** These five items declare no `ariaLabel`, and reading one unconditionally would write the string `"undefined"` as the accessible name.
- **Returning a node from `name` does not work.** The renderer does `String(itemValue)`, and `name` is publicly documented as a string or a function returning one. A new item property is the additive route; widening `name` is not.
- **A mark drawn from a selection must tell "all" from "some" (DEV-124).** `checkSelectionConsistency()` (`utils.ts`) answers "at least one cell" despite its name, and from 2015 until DEV-124 both read-only items drew their mark from it — so one read-only cell in a writable range showed a full check and announced `aria-checked="true"`. Draw a mark from `getSelectionCheckState()` instead, which returns `true`, `false` or `MENU_ITEM_MIXED` and stops after two cells on a mixed selection. The *click* is a separate question: `make_read_only` still acts on "at least one" (a partly read-only selection is cleared), which `plugins/contextMenu/__tests__/predefinedItems/readOnly.spec.js` pins, so do not "fix" the callback to match the mark — and it asks `checkSelectionConsistency()`, which stops at the first read-only cell, because the three-state helper reads a fully read-only selection to the end. Since DEV-136, the click also decides from that same short-circuit whether it needs a second, full pass to snapshot the selection for the public `beforeReadOnlyToggle` hook; the undo itself runs on the journal of the `readOnly` writes, which the click groups into one `read_only_toggle` operation. A comparator returns `null` for a cell that must not count: both read-only items leave out a hidden cell under a merged block (`hidden` meta, the same signal the auto-size plugins skip on), because MergeCells stretches the selection over the whole block while the block's state sits on its top-left cell, and the comment item also leaves out a cell with no comment `value`, including value-less comment meta that older versions of its click wrote. That item's click now sets one state for the whole range too – see `../../plugins/comments/AGENTS.md`. The read-only item also leaves out a read-only column summary cell (DEV-148), whose `readOnly` state belongs to ColumnSummary (`getLockedCellCheck()` asks `getPlugin('columnSummary').isLockedSummaryCell()`, resolved once per call, not per cell). That cell is left out of the mark, the direction check and the write loop, and the item is `hidden()` when the selection holds nothing else. It is not a mark-only exclusion: the summary is always read-only, so counting it in the direction check made every column holding one resolve to "make writable" forever. The write loop skips it, so the step's journal never holds it and undo and redo leave it alone; ColumnSummary also vetoes the write itself in `beforeSetCellMeta` – see `../../plugins/columnSummary/AGENTS.md`. Since DEV-149 the same lock covers a cell whose `readOnly` comes from the `cells` option, because `cells()` is re-applied over every `setCellMeta()` value, and counting such a cell in the direction check made every column holding one resolve to "make writable" forever. `isReadOnlyOwnedByCells()` runs `cells` on a probe object that inherits from the transient meta and reports an own `readOnly` key on the probe (`this.readOnly = ...`) or on the returned object, `true` or `false`. **The `cells` lock applies only when the selection also holds a cell `cells` does not own** (a lazy `hasCellFreeOfCells` walk, run once per call and only after an owned cell is met): a grid whose `cells()` sets `readOnly` on every cell, like the API reference example or the trusted-types fixture, keeps the item, its mark and its old no-op click, instead of losing the item. The lock check takes the cell's transient meta, which every caller has already read, and the click files the locked cells each walk meets in a set so the write loop does not read every cell again: the unit tests pin those read counts. The lock check reports who owns the cell (`'summary'` or `'cells'`): the make-read-only snapshot records a read-only `cells()`-owned cell as `true`, so `beforeReadOnlyToggle` listeners and the step's description see it as it is, while a column summary cell stays out of it as before. A `readOnly` set from `beforeGetCellMeta`/`afterGetCellMeta` hooks is not detected. Undo and redo replay the step's journal, which never holds a locked `cells()`-owned cell, so they leave its stored value alone. One limit remains: `cells()` runs a second time per visited cell (`getCellMetaTransient` already ran it once), which a very large selection with an expensive `cells()` will feel when the menu opens. Specs cannot see a menu write through `getCellMeta()`, which runs `cells()` again on every read: record `afterSetCellMeta` instead (`tests/fixtures/demo/cells-read-only.html`). It is not a mark-only exclusion: the summary is always read-only, so counting it in the direction check made every column holding one resolve to "make writable" forever. The write loop skips it, so the step's journal never holds it and undo and redo leave it alone; ColumnSummary also vetoes the write itself in `beforeSetCellMeta` – see `../../plugins/columnSummary/AGENTS.md`. Since DEV-149 the same lock covers a cell whose `readOnly` comes from the `cells` option (the function is called again on the transient meta and the cell counts as owned when the result has an own `readOnly` key, `true` or `false`), because `cells()` is re-applied over every `setCellMeta()` value, and counting such a cell in the direction check made every column holding one resolve to "make writable" forever. The lock check takes the cell's transient meta, which every caller has already read, and the click files the locked cells each walk meets in a set so the write loop does not read every cell again: the DEV-124/DEV-136 unit tests pin the read counts. A `readOnly` set from `beforeGetCellMeta`/`afterGetCellMeta` hooks is not detected. Undo and redo replay the step's journal, which never holds a locked `cells()`-owned cell, so they leave its stored value alone. One limit remains: `cells()` now runs a second time per visited cell (`getCellMetaTransient` already ran it once), which a very large selection with an expensive `cells()` will feel when the menu opens. With nothing toggleable (reachable through `executeCommand()`, which ignores `hidden`), the click returns before firing `beforeReadOnlyToggle`, so it records no empty undo step. `checkSelectionConsistency()` itself stays exported as legacy. Three details that bit while adding the state. (1) The mixed mark is `span.htMixed`, **not** `span.selected` plus a modifier: `selected` is what the active-row `:has()` background matches (`.htItemWrapper .selected` in `_dropdown-menu.scss`), and a partly-on item is neither. Neither span paints a glyph itself — each holds a real `<i class="ht-icon ht-icon-<name>">` child, appended by `createIcon()` and positioned absolutely inside the span; the span is a positioning wrapper only. (2) Its glyph is the design system's existing `collapseOff` icon (`checkMark.appendChild(createIcon(mainTableHot, isMixed ? 'collapseOff' : 'check'))` in `menu/menuItemRenderer.ts`), sourced from `icons/main.mjs`/`icons/horizon.mjs` in the Figma theme generator (`scripts/themes/figma/`) and rendered to CSS by `iconStyles()` — the successor to the deleted `iconsMap()` pseudo-element generator; `templates/iconStyles.ts` (the emitted artifact) and `utils/helpers/iconStyles.mjs` (the generation-time runtime copy) are asserted identical by `__tests__/iconStyles.test.mjs`. The generated outputs — `ht-icons-*.css`, the icon block at the end of each `ht-theme-<name>.css`, and `variables/helpers/iconStyles.ts` — are deterministic functions of `icons/*.mjs` plus the scope selector, so they can be regenerated without the gitignored `tokens.json`. Renaming or adding an icon touches four lists (both `icons/*.mjs`, `IconKey`, `ICON_NAMES`, `VALID_ICON_KEYS`) — see `scripts/themes/figma/.ai/CONVENTIONS.md`. (3) `MENU_ITEM_MIXED` and `MenuItemCheckedState` are declared in `utils.ts` and re-exported from `menu/utils.ts`, not the other way round: `menu/utils.ts` imports `SEPARATOR` from `predefinedItems`, whose items import `utils.ts`, so a value import in that direction closes a cycle. `isItemCheckable()` accepts the one `'mixed'` literal and no other string, so an unrelated string `checked` still does not change an item's role.

## `className` is `string | string[]` — never do string surgery on it

The `className` cell meta accepts a space-separated string **or** an array (both are documented in `metaSchema`). Always normalize it with `normalizeClassNames()` from `handsontable/src/helpers/dom/element.ts` and then work on whole tokens.

Two shipped bugs came from ignoring this. Both `.replace()`-based: #7427 (an array `className` threw on `.split`) and #7122, where `utils.ts` removed an alignment token with `.replace('htRight', '')` and then "tidied up" with `.replace('  ', '')`. That deleted the double space instead of collapsing it, so the two surviving class names were glued into one (`class_namehtMiddle`) and both stopped matching. The same substring matching also chopped custom classes that merely contained an alignment name (`htTopBar` → `Bar`).

Match alignment classes by exact token (`classNames.includes('htRight')`), as `../../plugins/exportFile/types/xlsx/cell-style.ts` already does — never `indexOf`/`includes` on the raw string.

The `stateBefore` snapshot that `beforeCellAlignment` and the undo step's description receive holds the alignment tokens only (`getAlignmentClassNames()`, `utils.ts`), and `undefined` for a cell with none (DEV-857). It used to carry the cell's whole user `className`, so a custom class such as `htBlue` showed up as alignment state. Narrow the snapshot, never the write: `align()` still keeps the custom classes, and undo replays the cell meta journal, not `stateBefore`. Pinned by `__tests__/utils.unit.js` and `tests/e2e/context-menu-alignment-state-before.spec.ts`.

## `filterSeparators()` drops separators only, never an item for sharing a label (DEV-868)

`filterSeparators()` (`menu/utils.ts`) runs on every menu build and trims leading and trailing separators and collapses runs of them. Its last step used to compare `name` between every item and the one kept before it, so two neighbors with the same STRING `name` collapsed into one row, in object form and array form alike, with distinct keys. A function `name` survived only because two function references never compare equal, which is why the report read "a string name has to be unique". `removeDuplicatedSeparators()` now skips an item only when it and the previously kept item both carry the separator name. Items with no `name` at all are kept too. The test is `name === separator`, an exact match, while the renderer's `isItemSeparator()` is an unanchored regex: two neighbors carrying the same non-canonical dashed name (`'----------'`) used to collapse by the equal-name rule and now both render as separator rows. Use the exported `SEPARATOR`. Never compare display names in this file: a label is not an identity, and a menu may repeat one. Pinned by `menu/__tests__/filterSeparators.unit.js` and `tests/e2e/menu-duplicate-names.spec.ts`.

## Hovering a sub-menu is a timer, and both directions use it

Opening a sub-menu on hover was always debounced 300ms. Closing one was instant, and that asymmetry
was the bug in DEV-66: the sub-menu is drawn beside the parent, so reaching any item except the
first means moving right AND down, across the parent rows below the anchor. Every crossed row hit
the hover handler, which called `openSubMenu(row)` — and that closes every open sub-menu **before**
it checks whether the new row even has one, so the sub-menu died mid-move and nothing replaced it.
Six of the seven alignment options could not be pointed at directly.

Closing now waits the same `SUB_MENU_HOVER_DELAY` (300ms). Five things hold that together, and each
of them has a measured failure behind it.

- **The delay lives in `afterOnCellMouseOver`, never inside `openSubMenu()`.** `defaultShortcutsList`
  calls `openSubMenu()` directly for ArrowRight and Enter, and the keyboard must stay instant.
- **`mouseleave` on the menu container is the load-bearing cancel, not the arrival at the sub-menu.**
  The sub-menu box is TALLER than the parent menu, so its lower items hang below it over the grid;
  the reported path leaves the menu, crosses ~150px of grid and enters the sub-menu from below. The
  switch armed by the last crossed parent row fires out there, so a fix that only cancels on arrival
  still loses the sub-menu. It is also what cancels a pending *open* when the pointer brushes an
  anchor row and leaves — that debounce was never cancelled at all before.
- **`mouseleave`, never `mouseout`.** `mouseout` fires when moving between rows *inside* the menu,
  which is exactly when the timers must survive. The handler carries the `#suppressHoverSubMenuToggle`
  guard for the same reason the two hover guards do: a scroll that repositions the menu under a
  stationary cursor makes the browser recompute `:hover` and dispatch pointer events with no real
  movement (#12719), and that must not cancel a sub-menu the user is still waiting for.
- **A sub-menu container is a SIBLING of its parent's container in the portal, not a descendant.**
  So the parent's own `mouseleave` already fires when the pointer moves into the sub-menu; a
  `mouseenter` listener on the sub-menu is redundant, and registering one per open leaks an entry on
  the parent's `eventManager` for the life of the menu.
- **"Is this row's sub-menu open" is asked of the sub-menu, never of a remembered row index.**
  Escape and ArrowLeft call `close()` on the *sub-menu itself*, never the parent's
  `closeSubMenu()`, so the entry in `hotSubMenus` outlives the closing — by design; the next
  `openSubMenu()` is what destroys it. A remembered index therefore goes on naming a row whose
  sub-menu is already gone, the handler's "already open on this row" branch returns early forever,
  and **the anchor row stops responding to the mouse for the life of the menu**. The old code
  self-healed by accident, because its unconditional `openSubMenu()` cleared the stale entry on the
  way through. `#isSubMenuOpenAtRow()` reads `hotSubMenus[key]?.isOpened()` instead, which is false
  after such a close, so the hover falls through to the switch and reopens.
  Do **not** "fix" this by deleting the entry in an `afterClose` hook: nothing else destroys that
  sub-menu, so its `eventManager` listeners leak and `test/e2e/MemoryLeakTest.js` goes red with a
  non-zero listener count — measured, 24 of them.

- **`openSubMenu()` clears both hover timers on the way in.** Opening settles what they were still
  deciding, so neither may outlive it. The case that bites is the keyboard: hovering moves the page
  cursor but never the menu selection, so the pointer can rest on one row while ArrowRight or Enter
  opens the selected row's sub-menu. The route is real — open with ArrowRight, close with ArrowLeft
  (focus returns to the parent, and the `hotSubMenus` entry stays), rest the pointer on another row
  so a switch is armed, then press ArrowRight again. Without the clear, that switch fires 300ms
  later and tears down what the key just opened.

Resting on a plain row for longer than the delay still closes the sub-menu — the delay is a delay,
not a block. Coverage is `tests/e2e/submenu-hover-delay.spec.ts`; it must move the pointer with
`steps` and settle past 300ms before asserting survival, or it passes on a build with the cancels
removed. The legacy Jasmine suite dispatches one synthetic `mouseover` per element and cannot
express a pointer path at all.

## `isOpened()` means "can be driven", `isClosed()` means "nothing in play" — they are not opposites

`Menu` walks one lifecycle, held in `#lifecycle`: `closed` → `opening` → `opened` → `closing` →
`closed`. Two questions sit on top of it, and while the menu is opening or closing **both are false**:

| Question | True when | Ask it before |
|---|---|---|
| `isOpened()` | the menu is fully built — its grid, navigator and keyboard controller all exist — and `close()` has not started | driving the menu: `close()`, `focus()`, `executeCommand()`, a navigator or shortcut call |
| `isClosed()` | no menu grid is in play at all | starting another menu: the plugins' `open()` guards, `DropdownMenu#executeCommand`'s item rebuild |

The window between them is the point. Building the menu paints its items, and painting calls each
item's `name()`, `disabled()`, `checked()` and `ariaLabel()` — public, documented callbacks — so
application code runs while the menu is half built.

`isOpened()` used to be `this.hotMenu !== null`, and `open()` assigns `hotMenu` before it builds the
grid, so it said "open" through that whole window. That was DEV-41, and it was page-wide rather than
menu-wide: one throw from `name()` left the menu "open" for good; `onDocumentMouseDown`, bound to
`document`, sent **every click anywhere** into `close()` on a menu with no navigator;
`DropdownMenu#open()` early-returned forever; and `hot.destroy()` threw too, which skipped
`eventManager.destroy()` and leaked the document listener past an SPA route change — which is why it
read as flaky. A throw is only one way in. A callback that asks `isOpened()`, calls `close()`, or
calls `open()` again reached the same half-built menu without throwing.

Rules for anyone touching this:

- **Never derive "open" from `hotMenu`.** It is assigned partway through `opening` and cleared
  partway through `closing`. That was the whole bug.
- **Pick the question by what you are about to do.** Driving the menu → `isOpened()`. Starting one →
  `isClosed()`. A plugin's `open()` guard that asked `isOpened()` would let a nested `open()` from an
  item callback announce the menu a second time — the old code early-returned there only because
  `hotMenu` happened to be set already. The keyboard `runOnlyIf` guards still ask `!isOpened()`: a
  key event cannot land mid-transition, so both answers are equal there.
- **The reset is structural — keep it that way.** `open()` sets `opening` and runs `#open()` inside a
  `finally` that returns the menu to `closed` unless `#open()` reached its single commit point.
  Do not move the commit point, and do not add a second place that sets `opened`.
- **An application error during teardown propagates, and the menu's own state still resets.**
  `close()` tears down inside a `try` and resets in the `finally`; `destroy()` releases the theme
  hook, the event manager and the container in its own `finally`. Every teardown line runs
  application code — clearing the navigator deselects through the grid's hooks, sub-menu teardown
  destroys grids, `afterClose` reaches the plugins' `after*Hide` — and when that code throws, the
  error reaches the caller, exactly as it does everywhere else in the grid (`runHooks` has no
  `try` anywhere, and `hot.destroy()` stops at the first plugin that throws). What the menu
  guarantees is narrower and is the DEV-41 fix itself: it is never left mid-transition. An earlier
  round wrapped every teardown step, and every caller, so that no step could be skipped; each
  rethrow then made the next caller up the stack look unguarded, which is how the wrapping spread
  to `destroy()`, `disablePlugin()` and `updatePlugin()` in three plugins. Do not reintroduce that.
  A resource a throw can strand is best handled by making the next `open()` cope: `#resetToClosed()`
  empties the container, so a grid whose `destroy()` never ran cannot leave DOM for the next open to
  build on top of.
- **Re-entry is a no-op in both transitions.** `open()` does nothing unless `isClosed()`, and
  `close()` does nothing unless `isOpened()`. So a `close()` from an item callback mid-build is
  ignored and the open in progress wins — tearing the grid down under its own `init()` is what
  broke the page before — and a `close()` or `open()` re-entered from a teardown hook does nothing.
- **`#rollbackFailedOpen()` is resource cleanup, not the guarantee.** It resets the state first, and
  `#resetToClosed()` must stay throw-free for that to work: it runs outside the `catch`, so a throw
  there skips the release below it AND escapes as the caller's error. That is why its last line
  guards the host with `!this.hot.isDestroyed`. An item callback that calls `hot.destroy()` reaches
  exactly this path — the renderer then reads the destroyed grid and throws — and writing
  `outsideClickDeselects` back to a destroyed host threw on the way out, so the half-built menu grid
  was never destroyed: **79 document listeners survived the host's teardown** (measured; 0 with the
  guard). Touch the host from a teardown path only behind that check. The rollback then destroys the
  half-built grid and fires `afterClose`, both inside its one `catch`. It still releases what
  `#open()` acquired — the menu grid, the scroll listeners, the visible container, the HOST grid's
  `outsideClickDeselects` — so mirror every new side effect of `#open()` in it. A miss now leaks
  instead of breaking the page. The scroll listeners were missed exactly this way on the first
  attempt. `open()` rethrows the original error, so the application's own bug still reaches it and
  Sentry — which is why the rollback DROPS its own failures instead of rethrowing them: a grid that
  cannot tear down after a failed init, or a throwing `after*Hide` listener, would otherwise replace
  the real cause. `openSubMenu()` guards its `subMenu.destroy()` the same way.
- **Anything that mutates the HOST grid belongs inside the guard.** `outsideClickDeselects` is set
  to `false` on `this.hot`; a throw before it is restored pins it off for the life of the page.
- **Acquire nothing above the `try`.** The visible container, the document scroll listeners, the host
  grid's `outsideClickDeselects` and the menu grid are all taken inside it, because the rollback is
  the only thing that releases them — `close()` bails unless the menu is open. The container is
  still shown only once the item list is settled: above that point `open()` can bail, through the
  empty-items return or a throw from an item's own `hidden()`, and an earlier flip left an empty
  themed box over the page. It must also stay before the grid is built, because
  `updateMenuDimensions()` measures rendered rows and a `display: none` container measures as zero.
- **The rollback fires `afterClose` even though `afterOpen` never fired, and marks the menu `closed`
  first.** The callers announce the menu before opening it (`beforeDropdownMenuShow` /
  `beforeContextMenuShow`), so staying silent strands an application that tracks the documented
  before/after pair. Every listener on that hook only restores focus and emits the matching
  `*Hide`, and each finds the menu closed, exactly as after `close()`.
- **No public hook sees a different answer.** `before*Show` runs before `open()` and reads `false`;
  `after*Show` runs after the commit point and reads `true`; `after*Hide` runs after the reset and
  reads `false` — all as before the lifecycle existed. That, plus `Menu` being `@private`, is why
  the lifecycle is not a breaking change. The spec below pins all three.
- **`openSubMenu()` registers into `hotSubMenus` only after `subMenu.open()` returns.** A sub-menu
  that throws while opening is therefore unreachable from `closeAllSubMenus()` and `destroy()`, so
  it is destroyed in a `catch` before the rethrow. Every hover that reaches the row tries again, and
  without that `catch` each attempt leaks another set of the sub-menu's document listeners. It is
  the listeners that pile up, not containers: `createContainer()` finds an existing sub-menu
  container by its `...Sub_<name>` class and reuses it. That `<name>` is the item's display LABEL
  with every character outside A-Z, a-z, and 0-9 turned into `_`, so it changes with the language:
  under `ar-AR` the Alignment submenu's class is all underscores and `.htContextMenuSub_Alignment`
  matches nothing. A test that opens a submenu in a translated grid finds it by
  `[class*="htContextMenuSub_"]` (or `htDropdownMenuSub_`), as the RTL menu specs under
  `visual-tests/tests/js-only/` do; the visual suite's `waitFor*SubmenuToAppear()` helpers apply the
  same mapping to the label they are given. `closeSubMenu()` does the parent's
  bookkeeping — the `hotSubMenus` entry, `aria-expanded` — BEFORE destroying the sub-menu, so a
  throwing teardown cannot leave a destroyed menu registered.
- **`destroy()` while `opening` stops the build, through `#isDestroyed`.** `close()` cannot do it —
  it is a no-op mid-build — so `destroy()` marks the menu and `#open()` checks the mark twice: after
  the item list is filtered (nothing acquired yet, so it just returns) and again before the commit
  point (rollback, then return). Without that, a build carried on into a menu that reports itself
  open, holds a grid and the keyboard, and keeps the host grid's `outsideClickDeselects` switched
  off, with nothing left that could close it. Both halves are reachable from application code that
  is doing nothing exotic: an item's `hidden()` or `name()` calling `updateSettings()` or
  `disablePlugin()` on the plugin being painted. A `hot.destroy()` from an item callback is the one
  case that cleaned itself up before the mark existed, and only by accident: the renderer reads the
  destroyed grid's settings, that throws, and the rollback runs. `destroy()` fires `afterClose`
  itself when it finds the menu `opening`, because the rollback that ends that build fires into the
  list `clearLocalHooks()` has already emptied — without it the callers keep their `before*Show`
  with no hide hook to match, exactly what the rollback's own hook call exists to prevent.
- **Every `Menu` adds an `afterSetTheme` hook to the HOST grid, and `destroy()` takes it off again.**
  A sub-menu is built and destroyed on every hover, so a missed `removeHook` collects one dead menu
  per hover for the grid's lifetime. `Handsontable._getListenersCounter()` cannot see it — grid
  hooks are not DOM listeners — so the spec counts the hook list instead.

Coverage is `tests/e2e/menu-open-failure.spec.ts`: the throw path, and — for both plugins — a probe
that fails if `isOpened()` ever reports a menu without a navigator, a `close()` and a nested `open()`
fired mid-build, the three public hooks, a throwing hide listener during the rollback, a throwing
sub-menu item, and a throwing sub-menu teardown (a global `afterDestroy` on the sub-menu's grid).
It also covers, for both plugins: a settings change from an item's `name()` and from its `hidden()`,
a `close()` that was ignored mid-build followed by a command, and the sub-menu's grid hook. The
sub-menu teardown test pins the contract above — the error reaches the page, and the menu is still
closed with an empty container that the next open builds into.
Every "no page error" read there goes through the page object's `settle()` first: a web-first poll
cannot prove a negative, because `expect.poll(...).toEqual([])` passes on its first read and waits
for nothing. Note what that spec cannot do by watching for errors:
a leaked `mousedown` listener early-returns once the menu reports itself closed, so "no page error"
is green whether or not the listener is still attached. The leak assertion reads
`Handsontable._getListenersCounter()` instead (`handsontable/src/index.ts`, exposed for the
memory-leak tests). Any new assertion there needs the same care.

## Tab from the menu must mark Tab navigation (DEV-102)

`menu/defaultShortcutsList.ts` handles Tab / Shift+Tab by calling `hot.selection.transformStart`
with the same `(0, ±1)` delta as an arrow key, then closing the menu. MergeCells snaps a non-Tab
horizontal `transformStart` to the merge's top row, so this path has to call
`selection.markTabNavigation()` (and `markEndSource()` after the transform) or Tab from an open
menu would leave a merged cell on the top row instead of the row it cycles along. It does not go
through `inlineStart`/`inlineEnd`, so the grid Tab commands cannot cover it. Pinned by
`tests/e2e/merge-cells-horizontal-exit.spec.ts`.

## `checkSelectionConsistency()` abandoned the search after the FIRST empty range (FIXED, DEV-136)

`arrayEach()` stops iterating the moment a callback returns exactly `false`. The per-range callback
used to `return result` — `false` while nothing had matched yet — so a range with no match stopped
the whole walk right there, and a match sitting in a LATER range (a multi-layer selection, e.g. a
Ctrl+click adding a second block) was never found. `predefinedItems/readOnly.ts` and `plugins/comments/contextMenuItem/readOnlyComment.ts` (relative to `src/`) both decide
their toggle from this helper, so a selection shaped that way toggled the wrong way — and, since
DEV-136, corrupted the read-only toggle's undo snapshot too (its "no match found" fast path trusts
this helper's `false` to mean every visited cell was proven writable, which a truncated search cannot
guarantee). Fixed by returning `!result` instead: continue while no match has been found yet, stop
once it has. Pinned by `__tests__/utils.unit.js`.

## The positioner clamps to the viewport AFTER it picks a side (DEV-3623)

`Positioner` chooses a side from the room around the cursor: below or above it (`Cursor#fitsBelow()`,
`fitsAbove()`), then to the right or left (`fitsOnRight()`, `fitsOnLeft()`, mirrored in RTL). When the
first side does not fit, it falls back to the other. It never asked whether the fallback fits, so a menu
that fits on neither side of its point went past the viewport's edge. A 218px column dropdown on a 390px
phone started 26px left of the screen, and its first controls were clipped (issue #14048, reported on
16.2.0 and still present in 18.1.2). A 372px context menu on a 390px-tall window opened below its point
and ran 105px past the bottom. `#clampHorizontally()` and `#clampVertically()` now run last and hold
`style.left` and `style.top` inside the viewport.

- **Clamp, never add a predicate.** The `fits*` checks do not describe the placement they gate.
  `fitsOnLeft()` ignores `#offset.left`, which the dropdown sets to the button width. `fitsOnRight()`
  always adds `cellWidth`, while `setPositionOnRightOfCursor()` adds it for submenus only. Another
  predicate inherits the same drift. The clamps read what the `setPositionOn*()` methods wrote, so they
  hold whatever those did.
- **The edges are in the frame `style.left` and `style.top` are written in: the window's page
  coordinates.** Horizontally they are the window's `scrollX`, and that offset plus
  `documentElement.clientWidth`. Vertically they are `scrollY`, and that offset plus
  `documentElement.clientHeight`. Both client sizes leave the scrollbar out. `innerHeight`, which
  `fitsBelow()` uses to pick the side, counts a horizontal scrollbar, so a menu pinned to the bottom with
  it would end under the bar on a classic-scrollbar platform (headless Chromium hides scrollbars, so no
  spec shows it). A clamp against `0` passes at rest and
  breaks on a scrolled window. In an RTL document `scrollX` is `0` at rest and goes negative as the
  window scrolls toward the inline end. A custom `uiContainer` with its own containing block is the
  exception (`Menu#captureScrollFollowBaseline` explains why a measured rect is used there): the position
  is then not a page coordinate. The positioner was already off in that case, and the clamps inherit it.
- **A menu larger than the viewport keeps the edge the window cannot scroll to.** That is the top edge,
  and the left edge in an LTR document or the right edge in an RTL one, so the menu overflows the way the
  page can still scroll. The edge comes from the DOCUMENT's computed `direction`, not from the menu's
  `dir`, which follows the grid: an RTL grid in an LTR page keeps its left edge, because an LTR page has
  no negative `scrollX` to reach a strip cut off on the left. `clampIntoRange()` takes the edge to keep
  as `preferMin`, and an RTL document passes it `false`, so do not merge the two directions.
- **`keepInViewport: true` reaches it, and so does the vertical-only mode.** The Filters condition list
  passes `keepInViewport: false` and `scrollInViewport: true`: it takes the other branch of `updatePosition()`
  and then runs only this clamp (no flip, no horizontal fit). The menus that do reach it are the context menu, the dropdown
  menu, their submenus, and the sheets bar menus. The sheets bar already lifts its upward menu by hand
  and pins it to the top in a squeeze, which the clamp agrees with.
- **It moves a menu only when the menu would leave the viewport**, so every placement that was inside
  it stays where it was. A menu that fits neither below nor above its point now covers the point
  instead of leaving the screen, and a submenu that fits on neither side of its parent overlaps the
  parent menu. The legacy specs that pinned such a menu outside the viewport changed with it: the RTL
  dropdown keyboard specs (the last column's button at x = -27) and the RTL `open()` specs of both menus
  expect the viewport's left edge, and the iframe context menu spec gives its outer frame room for the
  whole menu. Several of these pass on `main` and fail on `horizon`, whose menus are wider and taller
  and whose grid overflows the page by more, so run a spec of this kind on all three themes
  (`npm run test:e2e -- --theme=horizon`).
- **Pinned by** `menu/__tests__/positioner.unit.ts` (both axes and directions, a menu larger than the
  viewport, and scroll offsets) and `tests/e2e/menu-viewport-clamp.spec.ts` (the issue's menus on a 320px
  viewport, a short viewport, a window scrolled on both axes in both document directions with the grid inset
  from the viewport's edge, and a submenu).

## On a touch device a menu taller than the viewport is capped and scrolls in itself (DEV-996)

The clamp above keeps the menu's top edge visible, but a menu taller than the viewport still ran past its bottom edge, and nothing inside it could scroll: `updateMenuDimensions()` sized the menu grid's holder to the summed row heights, and the holder is `overflow: visible`. Only a window scroll reached the lower items, which a page that does not scroll (an app shell, a frame sized to its content) never offers. On a phone held sideways that is every filter menu.

`#capHeightToViewport()` (called last in `updateMenuDimensions()`) caps the holder at `documentElement.clientHeight` minus the menu box's own border and padding, and gives the holder `overflow-y: auto` and `overflow-x: hidden`. Rules to keep:

- **Only a touch device is capped (`isMobileOrIpadOS()`), plus a menu that opts in with `scrollInViewport` (below).** A desktop browser keeps the old behavior for every other menu: the window scrolls to the rest of a tall menu, and the keyboard shortcuts of both menus depend on it. Fourteen legacy specs pin it (`contextMenu` and `dropdownMenu` `keyboardShortcuts`: PageUp, PageDown, Home and ArrowDown on 200-item menus, and Ctrl+Enter placement), and the cap broke each of them when it was applied everywhere. Widening the cap to desktop is a visible change of how a very tall menu behaves, not a bug fix.
- **The hider keeps the full content height.** Only the holder is capped, so its `scrollHeight` covers every item. The grid has `renderAllRows: true`, which is what makes summing the rendered cells correct; do not turn that off without changing the sum.
- **`updateMenuDimensions()` runs more than once per open.** The first call is at `afterInit`, before `setPosition()`. The Filters plugin calls it again after the dropdown shows (`#onAfterDropdownMenuShow`) and on every condition change, so the content can grow or shrink after the menu was placed. Each call starts by dropping the previous cap (the height, and the overflow styles of a menu that WAS capped), so a menu that fits again carries no cap style. When the cap changed and the menu is already placed, the menu is placed again from its last `setPosition()` (`#lastPosition`, through `#placeAgain()`), because the vertical clamp keeps the top edge and a menu that grew would otherwise run past the bottom. A menu whose cap did not change is not moved. Both fields reset in `#resetToClosed()`. **The replay moves a literal position by the distance its anchor travelled** (the anchor's rectangle is recorded with the arguments): a literal is viewport-relative and `Cursor` adds the window's scroll offset when it reads one, so replaying it unchanged after the window scrolled put the menu that many pixels below its anchor. An event position is document-relative and replays as is.
- **A menu that fits gets no cap style, and an uncapped menu's overflow is never cleared.** Walkontable writes `overflow: visible` on the holder of the menu grid, and clearing it hands the holder to the stylesheet's `overflow: auto`, which draws 17px scrollbars on a desktop menu at a browser zoom with classic scrollbars. So the reset runs only for a menu that was capped, and restores `visible`. A viewport that reports `clientHeight` 0 (a hidden frame) skips the cap.
- **A `keepInViewport` menu is capped on a touch device; a menu with `scrollInViewport` is capped on every device.** The Filters condition list (`keepInViewport: false`) opens under its select, and a viewport-sized cap alone would still leave its end outside, because nothing moves its top. Its menu therefore sets the internal option `scrollInViewport: true` (DEV-3994): the cap applies on desktop too, and `Positioner` gets a vertical-only mode (`keepVerticallyInViewport`) that keeps the below-and-right placement and then runs `#clampVertically()`. A list that fits the viewport shifts up to end inside it and carries no cap style; a taller one is capped and scrolls in itself. **Do not give that menu `keepInViewport: true` instead:** that also turns on flip-above and the horizontal fit test, whose `Cursor#fitsOnRight` adds the select's width to the menu's, so a list under a select in the last column would open to the left of the select, and the RTL offset in `select.ts` runs through the same path. The context, dropdown and sheets bar menus never set the option, so the legacy keyboard specs above stay out of reach. The move happens once, when the list opens: scroll-follow keeps the offset it measured after the clamp and does not run the clamp or the cap again, and the placement is replayed only when the cap changes. On a touch device the list is moved and capped as well (it was neither before). Pinned by `tests/e2e/filters-condition-list-viewport.spec.ts` (desktop, `?page=locked`, wheel and keyboard reach the last item).
- **The chrome is measured, never hard-coded** (`container.offsetHeight` minus the holder's computed `height`), because border and padding are theme tokens. It subtracts the holder's own used height, not the content's, and not its `offsetHeight` (the sheets bar menu gives the content-box holder block padding, which sits outside `style.height` and is chrome): the sheets bar menu's stylesheet caps its holder at `max-height: 232px`, and the content height read as negative chrome there, so the cap never applied.
- **The holder is widened by its scrollbar** (`offsetWidth - clientWidth`) so a classic scrollbar does not clip the items' right edge. Overlay scrollbars (iOS, macOS) measure 0.
- **The cap lives in inline styles that Walkontable rewrites on a full draw** (`alignOverlaysWithTrimmingContainer()` resets the holder's `width`, `height` and `overflow` for a grid with no scroll owner). The only full draw of the menu grid after open is Filters' `changeComponentsVisibility()`, and both of its callers call `updateMenuDimensions()` right after, which re-applies the cap. Any other full draw of the menu grid (a new `hotMenu.render()`, an `updateSettings()` on it) must be followed by `updateMenuDimensions()` too, or the menu overflows again.
- **A touch drag on the capped menu scrolls and runs nothing**: Walkontable's `event.ts` defers the synthesized mousedown to `touchend` and drops it once the finger moved. `onDocumentScroll` ignores scrolls inside `.htMenu`, so scrolling inside the menu neither repositions nor closes it. A selection that moves to an item below the fold (the keyboard, `selectCell()`) scrolls the capped holder without help. **Two exceptions to "ignores scrolls inside the menu":** a scroll of a menu's own holder closes that menu's open submenus (the rows move under a submenu that would stay where it was), and the capped holder carries `overscroll-behavior: contain`, so a swipe that reaches the end of the menu is not handed on to a scrollable page, which would move the open menu off its anchor.
- **The cap is measured against the layout viewport** (`documentElement.clientHeight`, the same measure as the positioner), so the iOS soft keyboard does not shrink it, and a menu left open across an orientation change or a window resize keeps the height it opened with.

Pinned by `tests/e2e/menu-viewport-cap.spec.ts`, which runs as an iPhone on a `?page=locked` fixture: a fixed, clipping `body` that nothing scrolls, not even `scrollIntoView()`, which still moves an `overflow: hidden` window. On a scrollable page a tall menu is reached by scrolling the window, so the cap tests would pass without the cap. The tests size the viewport from the measured menu, because a menu's height is a theme token. The page object's `refreshMenuDimensions()` stands in for the Filters plugin's second measurement, and `selectFilterCondition()` runs the real chain from the condition select's `select` hook (the list has its own spec and page object, `filters-condition-list-viewport.spec.ts`). The sheets bar's `max-height` case has no spec.

## A tapped menu item runs on `touchend`, and the menu cancels that `touchend`

On a touch screen `beforeOnCellMouseUp` is Walkontable's `touchend`, so the command runs before the
browser synthesizes the tap's compatibility `mousedown`, `mouseup` and `click`. Those events used to
land after the command, on whatever the command had shown: the sheets bar's Rename opens an input,
the compat `mousedown` focused the menu's `td.current`, the input blurred, the blur committed an
empty rename and the repaint removed the input. `Menu#endTapBeforeCommand()` therefore calls
`preventDefault()` on a cancelable touch `touchend` before `executeCommand()`, which tells the
browser to send none of them. A command never needs them: it ran already. Keep it before the
command, because a command that throws must not leave the compat events armed. **Only a row that
runs a command and closes the menu is ended this way** (`shouldAutoCloseMenu`, the negation of
`isCommandPassive()`). A passive row needs the tap's mouse events: the Filters controls inside the
dropdown menu (`isCommand: false` rows) answer the `click` and take the focus from it, and a submenu
parent opens its submenu from the tap's `mouseover`. Ending every tap broke both on touch screens:
the filter search took no focus, checkboxes and OK did nothing, and no submenu opened. A tap on a link or a form control that an item renderer puts in a row (`TAP_ACTIVATED_CONTROLS`: `a[href]`, `button`, `input`, `select`, `textarea`, `label`) is left alone too: the browser follows the link or toggles the control from the tap's `click`. A test that counts
`click`s after a menu tap reads 0 for the tap (`tests/e2e/touch-tap-to-edit.spec.ts`, #12803);
pinned by `tests/e2e/sheets-bar-touch-menus.spec.ts`, which also taps the Filters controls and a submenu parent.
