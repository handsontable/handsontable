# DropdownMenu plugin — column header menu

`DropdownMenu` (`'dropdownMenu'`) provides the column-header dropdown menu. It is **built on the shared `Menu` class from `contextMenu`** but configured and triggered independently — do not duplicate that Menu logic here.

## Specifics

- **Trigger**: the column header button (or `Shift+Alt+ArrowDown`). Not right-click — that is `ContextMenu`.
- **Scope**: column-specific operations only (not cells or row headers).
- **Hook prefix**: `beforeDropdownMenu*`, `afterDropdownMenu*`.

## The keyboard-triggered menu positions itself off the button's ICON, and that measurement must read the real element

`registerShortcuts()`'s `Control/Meta`+`Enter` and `Shift`+`Alt/Option`+`ArrowDown` handlers open the menu
anchored to the change-type button's glyph, not its full hit-area box (`#getButtonRect()`). Before icons became
elements that method read `getComputedStyle(button, '::before').width` — sizing itself off the LEGACY
`iconsMap()`-generated pseudo-element rule, entirely separate from the real `<i class="ht-icon
ht-icon-menu">` child `syncIcon(this.hot, button, BUTTON_ICON_CLASS_NAME, 'menu')` already appends. Removing that
generated CSS made `beforeStyle.width` resolve to `auto` (unparseable → `NaN`), which silently tripped the
function's own fallback branch and returned the WHOLE button rect instead of throwing — so the menu still
opened, just several pixels off from where the icon actually is. Nothing but a geometry assertion catches
that class of drift: `#getButtonRect()` now measures the real `.ht-icon` child directly
(`button.querySelector('.ht-icon').getBoundingClientRect()`), falling back to the button's own rect only
when no icon exists at all (an external theme mapping that clears the slot). If this method's fallback ever
fires in a real grid, the icon and the button rect have diverged again — treat that as a bug, not a
tolerance to widen. `__tests__/helpers/helpers.js`'s `getDropdownMenuButtonIconOffset`/
`getDropdownMenuButtonIconWidth` mirror the same fix and must stay in sync with this method's approach.

## The first item list is built on `afterInit`, so a later plugin's keys resolve

`DropdownMenu` (priority 230) enables before `Filters` (250), and `Filters` registers `afterDropdownMenuDefaultOptions` in its own `enablePlugin()`. A list built inside `DropdownMenu#enablePlugin()` therefore cannot resolve a Filters key, and the unresolved-key warning (`ItemsFactory#getItems()`, second pass) fired once per key of an explicit `dropdownMenu` list that named Filters items, although `filters` was on and the menu rendered every item. `callOnPluginsReady()` does not help: by the time a plugin's `enablePlugin()` runs, every plugin is already marked ready, so the callback runs at once.

- **While the grid is being built (`!this.hot.view`), the first `prepareMenuItems()` runs from `afterInit`**, when every plugin has enabled. That keeps the init-time warning for a key whose plugin is off or misspelled.
- **After the grid is built, `enablePlugin()` builds with `prepareMenuItems(false)`.** The key is still skipped, because a placeholder would register a dead command under the raw key and make `executeCommand()` think the key is known, but it is not reported: another plugin enabling later in the same `updateSettings()` pass can still contribute it. The next `open()` or `executeCommand()` reports it. So a misspelled key set by `updateSettings()` warns on the first open, not at the call.
- A listener passed in the grid settings (`afterDropdownMenuDefaultOptions`, `beforeDropdownMenuSetItems`) is attached by the init-pass `updateSettings()`, after the plugins have enabled. The old enable-time build therefore ran before it existed and never reached it; the `afterInit` build does, so such a listener now runs once at init.
- An `open()` or `executeCommand()` made before `afterInit` (from an `afterLoadData` listener, say) still builds with reporting on, so it can raise the same false positive. It needs a hook that fires mid-build and an unknown key, so it is left as it is.
- `ContextMenu` is not affected: it builds on `open()` and `executeCommand()`, never in `enablePlugin()`.

Pinned by `tests/e2e/menu-unresolved-key-warning.spec.ts` and `contextMenu/__tests__/itemsFactory.unit.js`.

## Where to look next

- Full ContextMenu vs Column Menu comparison and the shared `Menu` class: `handsontable/src/plugins/contextMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.

## The button icon goes through `syncIcon()` on every header render, on purpose

The button survives header re-renders (`#onAfterGetColHeader` returns early on `existingButton`), so
an icon built once with `createIcon()` kept whichever `icons` mapping was active at first build for the
life of the element - a runtime `theme.params({ icons })` or theme switch never reached it. Both the create path and the reuse path now call `syncIcon(this.hot, button,
BUTTON_ICON_CLASS_NAME, 'menu')`. That is cheap by design: `syncIcon()` re-applies the mapping only when
`ThemeManager#getIconsRevision()` moved, which since the same review happens only when the icons mapping
really changed (not on a density or color-scheme override), so an ordinary redraw pays one class check
per header. The mousedown gate in `#onBeforeOnCellMouseDown` matches the button by ancestor
(`closest`), not by the target's own class - a renderer callback may put its own markup inside the icon.
Pinned by "a runtime icons remap reaches the reused header button, filters select, and select editor
icons" in `tests/e2e/icon-elements.spec.ts`.

## `DropdownMenuSettings` lists the keys `validateSettings()` accepts

`src/settingsSchema` reads the exported `DropdownMenuSettings` interface in `dropdownMenu.ts` as the full key list of
the `dropdownMenu` object, and reports any other key as `unknownOption`. The plugin types its `callback` and
`uiContainer` reads in `enablePlugin()` with it. `ItemsFactory` reads `items` untyped. A key the plugin starts to read
must be added there in the same change, with a type that accepts every value the plugin tolerates, or a valid
configuration is flagged.
