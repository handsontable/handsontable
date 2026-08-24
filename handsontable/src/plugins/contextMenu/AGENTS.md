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

## Where to look next

- DropdownMenu specifics: `handsontable/src/plugins/dropdownMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
