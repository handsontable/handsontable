# DropdownMenu plugin — column header menu

`DropdownMenu` (`'dropdownMenu'`) provides the column-header dropdown menu. It is **built on the shared `Menu` class from `contextMenu`** but configured and triggered independently — do not duplicate that Menu logic here.

## Specifics

- **Trigger**: the column header button (or `Shift+Alt+ArrowDown`). Not right-click — that is `ContextMenu`.
- **Scope**: column-specific operations only (not cells or row headers).
- **Hook prefix**: `beforeDropdownMenu*`, `afterDropdownMenu*`.

## Where to look next

- Full ContextMenu vs Column Menu comparison and the shared `Menu` class: `handsontable/src/plugins/contextMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
