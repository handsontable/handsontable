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

The two menus build their item lists from separate hooks: `afterContextMenuDefaultOptions` and `afterDropdownMenuDefaultOptions`. A plugin that registers on only one is absent from the other, and **nothing raises**. Until DEV-2758 that was actively misleading: `ItemsFactory` turned a key it could not resolve into a bare `{ name, key }` placeholder, so the menu rendered a row labelled with the RAW KEY that did nothing when clicked. That was issue #5429 — `freeze_column` worked in `contextMenu` and rendered a dead row in `dropdownMenu` for seven years.

An unresolvable key is now **skipped**, with a `warnOnce()` naming it. So the failure is quiet in the UI and loud in the console instead of the other way round. It is still a failure: the item does not appear, so registering on both hooks remains the fix, not the warning.

Register one handler on both hooks, as `manualColumnFreeze.ts` does. Eight plugins still register on the context menu hook only — `comments`, `customBorders`, `copyPaste`, `exportFile`, `mergeCells`, `hiddenRows`, `hiddenColumns`, `nestedRows` — so `copy`, `mergeCells`, `commentsAddEdit`, `borders` and the hiding keys are all still absent as dropdown menu keys.

### The skip runs only AFTER the default-options hook — never move it into `getItems()`

`prepareMenuItems()` calls `ItemsFactory#getItems()` **twice**: once to build the list handed to the hook, then `setPredefinedItems()`, then again. On the first pass every plugin key is unknown *by design*, and the placeholder emitted there is load-bearing — `nestedRows/ui/contextMenu.ts` runs `rangeEach(0, items.length - 1, …)` and inserts its entries only when the list is **non-empty**. Filtering inside `getItems()` unconditionally makes `contextMenu: ['add_child']` yield an empty first-pass list, nestedRows never inserts, and `add_child` vanishes — re-breaking issue #9894. The `#predefinedItemsSet` flag is what confines the skip to the second pass; `__tests__/itemsFactory.unit.js` pins both halves.

An array entry can also be a full item definition **object** rather than a key string. Those are merged in further down and must never reach the unresolved-key path, which is why the skip is guarded by `!isObject(name)`.

### `execute()` matches the whole command name before splitting on `:`

Object-form `items` take their key verbatim, so `{ items: { 'alignment:left': … } }` registers a command under the full string. `CommandExecutor#execute()` therefore tries `this.commands[commandName]` first and only then splits — without that, the lookup searched for an `alignment` command that was never registered and threw `Menu command 'alignment' not exists.` on click (issue #5027). The split path still resolves a documented subcommand such as `executeCommand('alignment:left')` against the predefined `alignment` submenu, because nothing registers that key at the top level.

Note what this does **not** do: it does not attach a predefined subcommand's callback to a user's item. `{ 'alignment:left': { name: 'Left' } }` renders and no longer throws, but it does nothing when clicked, because the user supplied no `callback`. Resolving predefined subcommand keys at any menu level is the open request in issue #5027 and was deliberately not built — it would mean changing the shallow `extend` merge that #9894 depends on.

Both menus now rebuild their item list on every `open()` (`prepareMenuItems()`), so the list tracks the current settings. Before that, `DropdownMenu` built its list once in `enablePlugin`, which left it frozen: a plugin enabled later through `updateSettings` never reached the menu, and one disabled later kept entries that still ran. Do not move item building back into `enablePlugin` — and note that the `Menu` instance and its local hooks are still created there, deliberately, so `prepareMenuItems()` stays safe to call repeatedly.

One thing a rebuild does **not** cover: `CommandExecutor` never evicts a command it registered, and `execute()` gates on `disabled`, not `hidden`. So an item contributed by a plugin that is now off is still reachable through `plugin.executeCommand(key)`. An item whose availability depends on its plugin being enabled needs that check on **both** `hidden()` and `disabled()`.

## `className` is `string | string[]` — never do string surgery on it

The `className` cell meta accepts a space-separated string **or** an array (both are documented in `metaSchema`). Always normalize it with `normalizeClassNames()` from `handsontable/src/helpers/dom/element.ts` and then work on whole tokens.

Two shipped bugs came from ignoring this. Both `.replace()`-based: #7427 (an array `className` threw on `.split`) and #7122, where `utils.ts` removed an alignment token with `.replace('htRight', '')` and then "tidied up" with `.replace('  ', '')`. That deleted the double space instead of collapsing it, so the two surviving class names were glued into one (`class_namehtMiddle`) and both stopped matching. The same substring matching also chopped custom classes that merely contained an alignment name (`htTopBar` → `Bar`).

Match alignment classes by exact token (`classNames.includes('htRight')`), as `exportFile/types/xlsx/cell-style.ts` already does — never `indexOf`/`includes` on the raw string.

## Where to look next

- DropdownMenu specifics: `handsontable/src/plugins/dropdownMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
