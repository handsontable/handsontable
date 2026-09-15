# ContextMenu plugin — and the shared Menu class

`ContextMenu` (`'contextMenu'`) provides the right-click menu over cells and headers. It owns the shared `Menu` class that `DropdownMenu` reuses. Read this before touching `contextMenu.ts`, the `menu/` UI, or anything that `dropdownMenu` builds on.

## Context Menu vs Column Menu

`DropdownMenu` is built on the shared `Menu` class from `contextMenu` but is configured and triggered independently. When in doubt about which plugin owns a behavior, use this table.

| | Context menu | Column menu (dropdown menu) |
|---|---|---|
| **Plugin class / key** | `ContextMenu` / `'contextMenu'` | `DropdownMenu` / `'dropdownMenu'` |
| **Trigger** | Right-click (or `Ctrl+Shift+\` / `Shift+F10`) | Column header button (or `Shift+Alt+ArrowDown`) |
| **Scope** | Cells and headers across rows and columns | Column-specific operations only |
| **Hook prefix** | `beforeContextMenu*`, `afterContextMenu*` | `beforeDropdownMenu*`, `afterDropdownMenu*` |

## A plugin contributing menu items must register on BOTH hooks

The two menus build their item lists from separate hooks: `afterContextMenuDefaultOptions` and `afterDropdownMenuDefaultOptions`. A plugin that registers on only one is absent from the other, and **nothing raises**. Until DEV-2758 that was actively misleading: `ItemsFactory` turned a key it could not resolve into a bare `{ name, key }` placeholder, so the menu rendered a row labeled with the RAW KEY that did nothing when clicked. That was issue #5429 — `freeze_column` worked in `contextMenu` and rendered a dead row in `dropdownMenu` for seven years.

An unresolvable key in the **array** form is now **skipped**, with a `warnOnce()` naming both the key and the menu it came from. So the failure is quiet in the UI and loud in the console instead of the other way round. It is still a failure: the item does not appear, so registering on both hooks remains the fix, not the warning.

The menu name comes from `ItemsFactory`'s third constructor argument (each plugin passes its own `PLUGIN_KEY`). It is part of the `warnOnce` dedup key as well as the text, because both menus share one `hot.rootElement` scope — without it, a key unresolvable in *both* menus warns once and names neither.

Two cases are deliberately outside the skip. A key naming a built-in `ITEMS` member with no current entry is dropped silently, exactly as before — `allowInsert*`/`allowRemove*` suppress theirs at render time. And the **object** form of `items` is untouched by this PR: there a plain string value is the item's *label*, not a key to resolve, so nothing is looked up and nothing is reported. Do not describe the skip as covering every unresolvable key.

Register one handler on both hooks, as `manualColumnFreeze.ts` does. Eight plugins still register on the context menu hook only — `comments`, `customBorders`, `copyPaste`, `exportFile`, `mergeCells`, `hiddenRows`, `hiddenColumns`, `nestedRows` — so `copy`, `mergeCells`, `commentsAddEdit`, `borders` and the hiding keys are all still absent as dropdown menu keys.

### The skip runs only AFTER the default-options hook — never move it into `getItems()`

`prepareMenuItems()` calls `ItemsFactory#getItems()` **twice**: once to build the list handed to the hook, then `setPredefinedItems()`, then again. On the first pass every plugin key is unknown *by design*, and the placeholder emitted there is load-bearing — `nestedRows/ui/contextMenu.ts` runs `rangeEach(0, items.length - 1, …)` and inserts its entries only when the list is **non-empty**. Filtering inside `getItems()` unconditionally makes `contextMenu: ['add_child']` yield an empty first-pass list, nestedRows never inserts, and `add_child` vanishes — re-breaking issue #9894. The `#predefinedItemsSet` flag is what confines the skip to the second pass; `__tests__/itemsFactory.unit.js` pins both halves.

An array entry can also be a full item definition **object** rather than a key string. Those are merged in further down and must never reach the unresolved-key path, which is why the skip is guarded by `!isObject(name)`.

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

Both menus now rebuild their item list on every `open()` (`prepareMenuItems()`), so the list tracks the current settings. Before that, `DropdownMenu` built its list once in `enablePlugin`, which left it frozen: a plugin enabled later through `updateSettings` never reached the menu, and one disabled later kept entries that still ran. Do not move item building back into `enablePlugin` — and note that the `Menu` instance and its local hooks are still created there, deliberately, so `prepareMenuItems()` stays safe to call repeatedly.

One thing a rebuild does **not** cover: `CommandExecutor` never evicts a command it registered, and `execute()` gates on `disabled`, not `hidden`. So an item contributed by a plugin that is now off is still reachable through `plugin.executeCommand(key)`. An item whose availability depends on its plugin being enabled needs that check on **both** `hidden()` and `disabled()`.

## A menu item's state goes on the item, never inside its `name`

`menuItemRenderer` writes an item's resolved `name` through `fastInnerHTML`, which is a Trusted Types sink. Anything an item bakes into that string as markup therefore takes the whole menu down under a CSP carrying `require-trusted-types-for 'script'`, and it is the grid's own markup, so no `sanitizer` should be needed for it.

That is what DEV-2650 fixed. `markLabelAsSelected()` (`contextMenu/utils.ts`) and its byte-for-byte copy `markSelected()` (`customBorders/utils.ts`) prefixed a label with `<span class="selected">✓</span>`, so a read-only selection or a bordered one threw. Neither is used any more, and both were kept as legacy exports — their modules ship a declaration file, so a consumer on `moduleResolution: node` can import them whatever the `exports` map says. An item declares `checked` instead — `boolean` or a function, resolved by `isItemChecked()` in `menu/utils.ts` the same way `isItemDisabled` resolves `disabled` — and the renderer builds the span with `createElement`.

Four things to keep right when touching this:

- **Insert the mark AFTER calling `fastInnerHTML`.** It replaces everything the wrapper holds, so a span appended first is wiped. The rendered DOM must stay `[span.selected, text]`; four legacy positioning specs measure that span's offset.
- **Declaring `checked` makes an item checkable**, so it is announced as `menuitemcheckbox` and carries `aria-checked`. That is not a convenience: `aria-checked` is invalid on a plain `menuitem`, so leaving these items as menu items would draw a mark a screen reader cannot perceive — worse than the markup-in-the-label it replaced, which at least reached the accessible name. Five of the six in-tree items rely on this; only `make_read_only` declares `checkable` itself. An explicit `ariaChecked` still wins, and predates the flag, so that is the one way the mark and the announced state can still be made to disagree.
- **The checkbox branch labels from `ariaLabel ?? itemValue`.** These five items declare no `ariaLabel`, and reading one unconditionally would write the string `"undefined"` as the accessible name.
- **Returning a node from `name` does not work.** The renderer does `String(itemValue)`, and `name` is publicly documented as a string or a function returning one. A new item property is the additive route; widening `name` is not.

## `className` is `string | string[]` — never do string surgery on it

The `className` cell meta accepts a space-separated string **or** an array (both are documented in `metaSchema`). Always normalize it with `normalizeClassNames()` from `handsontable/src/helpers/dom/element.ts` and then work on whole tokens.

Two shipped bugs came from ignoring this. Both `.replace()`-based: #7427 (an array `className` threw on `.split`) and #7122, where `utils.ts` removed an alignment token with `.replace('htRight', '')` and then "tidied up" with `.replace('  ', '')`. That deleted the double space instead of collapsing it, so the two surviving class names were glued into one (`class_namehtMiddle`) and both stopped matching. The same substring matching also chopped custom classes that merely contained an alignment name (`htTopBar` → `Bar`).

Match alignment classes by exact token (`classNames.includes('htRight')`), as `exportFile/types/xlsx/cell-style.ts` already does — never `indexOf`/`includes` on the raw string.

## In a nested-iframe spec, read the event coordinates AFTER the mousedown

`positioning.spec.js` builds the grid in an iframe inside an iframe, driven from the test page's own
`Handsontable` — a cross-realm grid — and scrolls both documents so the cell sits partly outside the
outer frame's viewport. The `mousedown` that precedes the `contextmenu` selects the cell, and the
selection's window-scroll strategy (`core/viewportScroll/scrollStrategies/*`) calls `scrollIntoView`
on it, which scrolls the frames it sits outside of. The engine reads a cross-realm window's scroll
offset correctly since DEV-2789 (`getScrollTop` used to return `undefined` there, which kept that
strategy from ever deciding the page must move), so this now happens for a cross-realm grid exactly
as it always did for a grid built in its own realm. A real `contextmenu` event carries the pointer's
current coordinates; a spec that computed `clientX`/`clientY` from the cell's position **before** the
mousedown fired the event at where the cell used to be, and the menu opened there, 104px from the
cell. Take the position after the mousedown and two frames, as the spec does now — and expect the
same from any spec that right-clicks a cell that is not fully visible in every ancestor frame.

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
  `close()` sets `closing` before its teardown and `closed` in a `finally`. That is what makes the
  stranding impossible whatever exits early. Do not move the commit point, and do not add a second
  place that sets `opened`.
- **Re-entry is a no-op in both transitions.** `open()` does nothing unless `isClosed()`, and
  `close()` does nothing unless `isOpened()`. So a `close()` from an item callback mid-build is
  ignored and the open in progress wins — tearing the grid down under its own `init()` is what
  broke the page before — and a `close()` or `open()` re-entered from a teardown hook does nothing.
- **`#rollbackFailedOpen()` is resource cleanup now, not the guarantee.** It still releases what
  `#open()` acquired — the menu grid, the scroll listeners, the visible container, the HOST grid's
  `outsideClickDeselects` — so mirror every new side effect of `#open()` in it. A miss now leaks
  instead of breaking the page. It rethrows, so the application's own bug still reaches it and
  Sentry. The scroll listeners were missed exactly this way on the first attempt.
- **Anything that mutates the HOST grid belongs inside the guard.** `outsideClickDeselects` is set
  to `false` on `this.hot`; a throw before it is restored pins it off for the life of the page.
- **The container is shown only once the item list is settled.** Above that point `open()` can still
  bail — the empty-items early return, or a throw from an item's own `hidden()` — and an earlier flip
  left an empty themed box over the page. It must still happen before the grid is built, because
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
  it is destroyed in a `catch` before the rethrow. The hover timer re-fires every 300ms, so without
  that a single throwing sub-menu item leaks one fully-wired `Menu` per tick.
- **`destroy()` while `opening` is cleaned up by the throw it causes.** A `hot.destroy()` from inside
  an item callback cannot close the menu — `close()` is a no-op mid-build — but the renderer reads
  the destroyed grid's settings as soon as the callback returns, which throws, and the rollback
  releases the menu grid. Measured: no menu grid left in the page, a listener count of 0, and one
  page error naming the destroyed instance.

Coverage is `tests/e2e/menu-open-failure.spec.ts`: the throw path, and — for both plugins — a probe
that fails if `isOpened()` ever reports a menu without a navigator, a `close()` and a nested `open()`
fired mid-build, and the three public hooks. Note what that spec cannot do by watching for errors:
a leaked `mousedown` listener early-returns once the menu reports itself closed, so "no page error"
is green whether or not the listener is still attached. The leak assertion reads
`Handsontable._getListenersCounter()` instead (`handsontable/src/index.ts`, exposed for the
memory-leak tests). Any new assertion there needs the same care.

## Where to look next

- DropdownMenu specifics: `handsontable/src/plugins/dropdownMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
