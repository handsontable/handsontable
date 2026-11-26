# manualMove — moving columns and rows without a drag

This is **not a plugin**: it is the code `../../plugins/manualColumnMove/` and `../../plugins/manualRowMove/` share
to move columns and rows without dragging (WCAG 2.1.1 and 2.5.7). Read this before touching either plugin's
keyboard move or its menu items.

- `keyboardMove.ts` — `KeyboardMove`: the keyboard move (`Ctrl`/`Cmd`+`Alt`+`G`, the arrow keys, `Enter`,
  `Escape`), the one-place step the menu items call, the selection that follows the block, and the polite
  announcements. `COLUMN_MOVE_AXIS` and `ROW_MOVE_AXIS` say which axis it moves.
- `stepMove.ts` — the pure step math (`getStepDropIndex()`, `getRestoreDropIndex()`), unit-tested in `__tests__/`.
- `menuItems.ts` — the `move_column_left`, `move_column_right`, `move_row_up` and `move_row_down` items.

## What it owns, and what it does not

The mover owns the mode state, the shortcuts, the undo step of a keyboard move and the menu items. It never writes
an index map: every step is one call of the plugin's `dragColumns()` / `dragRows()` (the `MoveOwner` the plugin
passes in), so the hooks and `isMovePossible()` (trimmed bounds, the `fixedColumnsEnd` band) are the drag's. The
plugins own the cancel paths, as they do for a drag.

## The traps

- **A keyboard move is one undo step, and `Escape` records none.** `start()` opens an operation and holds it
  (`scope.hold()`, as the resize press does), every arrow step runs inside it (`#runInStep()`), and `#finish()`
  releases it: on `Enter`, on any other key, on a selection change, and on `cancel()`. `Escape` moves the block back
  inside the same transaction, and UndoRedo does not record a transaction that changed nothing. One step per press
  left three undo steps behind `Escape` that cancelled out. `dispose()` drops the hold without releasing it, for a
  grid being destroyed. A menu step is not inside a keyboard move, so it is one undo step of its own.
- **Any key that is not the mode's own ends the mode** (`onBeforeKeyDown`, registered on `beforeKeyDown`): the
  arrows of the axis, `Enter`, `Escape` and the modifiers alone keep it. Without that, a letter opened the editor,
  `Escape` closed it without changing the selection, and the next arrow moved the column instead of the selection.
  `Ctrl`/`Cmd`+`Alt`+`R` ends it the same way, so the move and the keyboard resize never run together.
- **A step the plugin refuses fires no hook and is announced.** `#getPossibleStep()` asks `isMovePossible()` before
  `drag*()`, so pressing an arrow into the `fixedColumnsEnd` band does not fire a pair of hooks with
  `movePossible: false` on each press, and the menu item is disabled for the same reason. A keyboard step that could
  not move (the edge, the band, a vetoing `before*Move` hook) announces `MANUAL_MOVE_BLOCKED`.
- **Every step goes through `drag*()`, not `move*()`.** `drag*()` converts the drop index with `countFinalIndex()`
  and calls `move*()`, so it is one pair of hooks, and the hooks get the drop index a pointer drop would give.
- **NestedRows turns the row move off.** Its `beforeRowMove` listener (`../../plugins/nestedRows/utils/rowMoveController.ts`)
  moves the rows itself, selects them, and returns `false`, so `dragRows()` reports no move: the mode lost its
  selection, nothing was announced, and the menu items stayed enabled on rows it refuses. The row plugin's
  `isEnabled()` answers `false` while NestedRows is enabled, so the shortcut does not start and the row items are
  hidden. Supporting it needs a move result from NestedRows, not a guess here.
- **A step passes the nearest visible index, and lands where a pointer drop would.** Hidden indexes in between are
  stepped over. The index after the passed one comes from the plugin (`dropIndexAfter()`): the column plugin steps
  over the hidden columns after it, the row plugin asks `getLowerHalfDropIndex()`, with its band and merged-cell
  exceptions. Do not compute it here, or the keyboard and the drag disagree.
- **The axis length is the drawn one** (`countCols()` / `countRows()`), not `getNotTrimmedIndexesLength()`:
  `maxCols` and `maxRows` cap the drawn tracks without trimming or hiding the rest, and a step into them made the
  block vanish from the grid, which a pointer drop cannot do.
- **`moveColumns()` and `moveRows()` leave the render to the caller**, so `#moveTo()` renders before it lays the
  selection on the moved block, as `#onMouseUp()` does.
- **The mover's own selection does not end the mode.** `afterSelection` ends it (`onSelectionChange`), so
  `#followSelection()` sets `#relaying` around its own `selectColumns()` / `selectRows()` / `selectCell()`. A
  header selection is re-laid with `selectColumns()` / `selectRows()`, because `selectCell()` refuses a range that
  holds headers and is not a single header.
- **One selection never starts both moves.** `ownsSelection()` splits them as the keyboard resize does
  (`isRowSelection()` in `../manualResize/axis.ts`): whole rows or a row header move rows, anything else moves
  columns. The menu items use the same rule to hide the other axis's items.
- **Shortcut traps, copied from the keyboard resize** (`../manualResize/AGENTS.md`): every callback returns `false`,
  `Enter` sits before `EDITOR_EDIT_GROUP`, and the starting chord is a letter, so it needs `stopPropagation` or the
  grid takes it as the start of an edit. `Control/Meta` is Cmd on macOS, so a test presses `ControlOrMeta+Alt+g`.
- **The update cycle keeps the mode.** The wrappers send the plugin option on every render, and `updatePlugin()`
  runs `disablePlugin(); enablePlugin();` with `#restarting` set, so the plugins call `cancel()` only on a real
  disable. `unregisterShortcuts()` never ends the mode by itself.
- **The menu items join the default menus** (`registerMenuEntries()` with `inDefaults: true`): the context menu for
  both axes, the column menu for columns. That is a visible change for every grid with `contextMenu: true` or
  `dropdownMenu: true` and a move plugin on.
- **The labels name screen sides.** "Move column left" moves toward the higher visual indexes in a right-to-left
  grid, and the arrow keys act in the direction they point (`COLUMN_MOVE_AXIS.getArrowKeys()`).

## Where to look next

- The plugins: `../../plugins/manualColumnMove/AGENTS.md`, `../../plugins/manualRowMove/AGENTS.md`.
- The pattern it copies: `../manualResize/AGENTS.md` ("Resizing without a drag").
- Registering menu items: `../menu/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=manualMove`
- `cd tests && npx playwright test --project=e2e-main e2e/manual-move-keyboard.spec.ts`
- The pointer check's `column-move` and `row-move` entries in `tests/a11y/checks/drag-operations.mjs`
  (`A11Y_CHECKS=pointer npm --prefix tests run test:a11y-checks`).
