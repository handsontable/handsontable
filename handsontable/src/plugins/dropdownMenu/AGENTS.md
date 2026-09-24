# DropdownMenu plugin — column header menu

`DropdownMenu` (`'dropdownMenu'`) provides the column-header dropdown menu. It is **built on the shared `Menu` class from `contextMenu`** but configured and triggered independently — do not duplicate that Menu logic here.

## Specifics

- **Trigger**: the column header button (or `Shift+Alt+ArrowDown`). Not right-click — that is `ContextMenu`.
- **Scope**: column-specific operations only (not cells or row headers).
- **Hook prefix**: `beforeDropdownMenu*`, `afterDropdownMenu*`.

## The keyboard-triggered menu positions itself off the button's ICON, and that measurement must read the real element (DEV-3003)

`registerShortcuts()`'s `Control/Meta`+`Enter` and `Shift`+`Alt/Option`+`ArrowDown` handlers open the menu
anchored to the change-type button's glyph, not its full hit-area box (`#getButtonRect()`). Before DEV-3003
task 22 that method read `getComputedStyle(button, '::before').width` — sizing itself off the LEGACY
`iconsMap()`-generated pseudo-element rule, entirely separate from the real `<i class="ht-icon
ht-icon-menu">` child `button.appendChild(createIcon(this.hot, 'menu'))` already appends. Removing that
generated CSS made `beforeStyle.width` resolve to `auto` (unparseable → `NaN`), which silently tripped the
function's own fallback branch and returned the WHOLE button rect instead of throwing — so the menu still
opened, just several pixels off from where the icon actually is. Nothing but a geometry assertion catches
that class of drift: `#getButtonRect()` now measures the real `.ht-icon` child directly
(`button.querySelector('.ht-icon').getBoundingClientRect()`), falling back to the button's own rect only
when no icon exists at all (an external theme mapping that clears the slot). If this method's fallback ever
fires in a real grid, the icon and the button rect have diverged again — treat that as a bug, not a
tolerance to widen. `__tests__/helpers/helpers.js`'s `getDropdownMenuButtonIconOffset`/
`getDropdownMenuButtonIconWidth` mirror the same fix and must stay in sync with this method's approach.

## Where to look next

- Full ContextMenu vs Column Menu comparison and the shared `Menu` class: `handsontable/src/plugins/contextMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
