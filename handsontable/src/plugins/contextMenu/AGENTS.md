# ContextMenu plugin

`ContextMenu` (`'contextMenu'`) provides the right-click menu over cells and headers. The shared `Menu` class, `ItemsFactory`, `CommandExecutor`, the predefined items and `registerMenuEntries()` live in `src/utils/menu/` – see `../../utils/menu/AGENTS.md` before touching them. The `.ts` files under `menu/`, `predefinedItems/` and beside this file (other than `contextMenu.ts`, `index.ts` and `feature.generated.ts`) are legacy re-exports of those modules; never add code to them. Read this before touching `contextMenu.ts`.

## Context Menu vs Column Menu

`DropdownMenu` is built on the shared `Menu` class from `src/utils/menu/` but is configured and triggered independently. When in doubt about which plugin owns a behavior, use this table.

| | Context menu | Column menu (dropdown menu) |
|---|---|---|
| **Plugin class / key** | `ContextMenu` / `'contextMenu'` | `DropdownMenu` / `'dropdownMenu'` |
| **Trigger** | Right-click (or `Ctrl+Shift+\` / `Shift+F10`) | Column header button (or `Shift+Alt+ArrowDown`) |
| **Scope** | Cells and headers across rows and columns | Column-specific operations only |
| **Hook prefix** | `beforeContextMenu*`, `afterContextMenu*` | `beforeDropdownMenu*`, `afterDropdownMenu*` |

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

## `ContextMenu#close()` drops its `itemsFactory` only once the menu really closed

`Menu#close()` is ignored while the menu is still opening, and a null factory makes the next command rebuild the items — firing the public `beforeContextMenuSetItems` hook again — under a menu that is on screen. `DropdownMenu#executeCommand()` already asks `isClosed()` before rebuilding. The lifecycle behind `isClosed()`: `../../utils/menu/AGENTS.md`.

## Where to look next

- Shared menu library (`Menu`, `registerMenuEntries()`, item state, lifecycle): `handsontable/src/utils/menu/AGENTS.md`.
- DropdownMenu specifics: `handsontable/src/plugins/dropdownMenu/AGENTS.md`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
