---
type: reference
title: Keyboard shortcuts
metaTitle: Keyboard shortcuts - JavaScript Data Grid | Handsontable
description: Access all Handsontable features using just your keyboard. Use shortcuts you know from Google Sheets or Microsoft Excel.
permalink: /keyboard-shortcuts
canonicalUrl: /keyboard-shortcuts
tags:
  - key bindings
  - keymap
  - key mapping
  - keyboard navigation
  - hotkey
  - accessibility
  - function key
  - commands
  - shortcut keys
react:
  metaTitle: Keyboard shortcuts - React Data Grid | Handsontable
angular:
  metaTitle: Keyboard shortcuts - Angular Data Grid | Handsontable
vue:
  metaTitle: Keyboard shortcuts - Vue Data Grid | Handsontable
searchCategory: Guides
category: Navigation
menuTag: updated
---
Access all Handsontable features using just your keyboard. Use shortcuts you know from Google Sheets or Microsoft Excel.

## Overview

[[toc]]

This page lists all of Handsontable's default keyboard shortcuts.

To register these keys with [`addShortcut()`](@/api/shortcutContext.md#addshortcut), use key-name strings instead of display glyphs. For example, use `control/meta` for <kbd>⌘</kbd> and `ArrowLeft` for <kbd>←</kbd>. For the full naming convention, see [custom shortcuts](@/guides/navigation/custom-shortcuts/custom-shortcuts.md#addshortcut-parameters).

## Navigation keyboard shortcuts

These keyboard shortcuts work when you navigate the grid. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

By default, <kbd>Tab</kbd> moves the active cell one column to the right and <kbd>Shift</kbd>+<kbd>Tab</kbd> moves it one column to the left — matching standard spreadsheet navigation in Excel and Google Sheets. This behavior is controlled by the [`tabMoves`](@/api/options.md#tabmoves) option (default: `{ row: 0, col: 1 }`) and can be customized.

| Windows                                      | macOS                                       | Action                                                                                          |  Excel  | Sheets  |
| -------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys                                   | Arrow keys                                  | Move one cell up, down, left, or right                                                          | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Backspace**</kbd> | <kbd>⌘</kbd>+<kbd>**Backspace**</kbd> | Scroll the viewport to show the focused cell or header                                          | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**↑**</kbd>         | <kbd>⌘</kbd>+<kbd>**↑**</kbd>         | Move to the first cell of the current column                                                    | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**↓**</kbd>         | <kbd>⌘</kbd>+<kbd>**↓**</kbd>         | Move to the last cell of the current column                                                     | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**←**</kbd>         | <kbd>⌘</kbd>+<kbd>**←**</kbd>         | Move to the leftmost cell of the current row                                                    | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**→**</kbd>         | <kbd>⌘</kbd>+<kbd>**→**</kbd>         | Move to the rightmost cell of the current row                                                   | &check; | &check; |
| <kbd>**F2**</kbd>                            | <kbd>**F2**</kbd>                           | Enter the editing mode of the active cell                                                       | &check; | &check; |
| <kbd>**Enter**</kbd>                         | <kbd>**Enter**</kbd>                        | Enter the editing mode of the active cell                                                       | &cross; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>    | <kbd>⇧</kbd>+<kbd>**Enter**</kbd>   | Enter the editing mode of the active cell                                                       | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**Enter**</kbd> | Save and close editor                                         | &check; | &check; |
| Alphanumeric keys                            | Alphanumeric keys                           | Enter the editing mode of the active cell and enter the pressed key's value into the cell      | &check; | &check; |
| <kbd>**Tab**</kbd>                           | <kbd>**Tab**</kbd>                          | Move to the next cell to the right by default<sup>\*</sup> (if there's only one column available, move one cell down) — direction set by [`tabMoves`](@/api/options.md#tabmoves)   | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>      | <kbd>⇧</kbd>+<kbd>**Tab**</kbd>     | Move to the previous cell to the left by default<sup>\*</sup> (if there's only one column available, move one cell up) — direction set by [`tabMoves`](@/api/options.md#tabmoves) | &check; | &check; |
| <kbd>**Home**</kbd>                          | <kbd>**Home**</kbd>                         | Move to the first non-frozen cell of the current row<sup>\*</sup>                               | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Home**</kbd>      | <kbd>⌘</kbd>+<kbd>**Home**</kbd>      | Move to the first non-frozen cell of the grid<sup>\*</sup>                                      | &cross; | &check; |
| <kbd>**End**</kbd>                           | <kbd>**End**</kbd>                          | Move to the last non-frozen cell of the current row<sup>\*</sup>                                | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**End**</kbd>       | <kbd>⌘</kbd>+<kbd>**End**</kbd>       | Move to the last non-frozen cell of the grid<sup>\*</sup>                                       | &cross; | &check; |
| <kbd>**Page Up**</kbd>                       | <kbd>**Page Up**</kbd>                      | Move one screen up                                                                              | &check; | &check; |
| <kbd>**Page Down**</kbd>                     | <kbd>**Page Down**</kbd>                    | Move one screen down                                                                            | &check; | &check; |

<sup>\*</sup> This action depends on your layout direction.

## Selection keyboard shortcuts

These keyboard shortcuts help you select cells. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                                                                               | macOS                                                                                               | Action                                                                            |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**A**</kbd> | <kbd>⌘</kbd>+<kbd>**A**</kbd>  | Select all cells                                                      | &check; | &check; |
|<kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Space**</kbd> |<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**Space**</kbd> | Select all cells and headers                                                      | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                                                              | <kbd>⌃</kbd>+<kbd>**Space**</kbd>                                                            | Select the entire column<sup>\*</sup>                                             | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                             | <kbd>⇧</kbd>+<kbd>**Space**</kbd>                                                           | Select the entire row                                                             | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd>                                             | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**↑**</kbd>                                            | Extend the selection to the first cell of the current column<sup>\*\*</sup>       | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd>                                             | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**↓**</kbd>                                            | Extend the selection to the last cell of the current column<sup>\*\*</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd>                                             | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**←**</kbd>                                            | Extend the selection to the leftmost cell of the current row<sup>\*\*</sup>       | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd>                                             | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**→**</kbd>                                            | Extend the selection to the rightmost cell of the current row<sup>\*\*</sup>      | &check; | &check; |
| <kbd>**Shift**</kbd> + Arrow keys                                                                     | <kbd>⇧</kbd> + Arrow keys                                                                   | Extend the selection by one cell                                                  | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Home**</kbd>                                                              | <kbd>⇧</kbd>+<kbd>**Home**</kbd>                                                            | Extend the selection to the first non-frozen cell of the current row<sup>\*\*\*</sup> | &check; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**End**</kbd>                                                               | <kbd>⇧</kbd>+<kbd>**End**</kbd>                                                             | Extend the selection to the last non-frozen cell of the current row<sup>\*\*\*</sup>  | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>                                                           | <kbd>⇧</kbd>+<kbd>**Page Up**</kbd>                                                         | Extend the selection by one screen up                                             | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Page Down**</kbd>                                                         | <kbd>⇧</kbd>+<kbd>**Page Down**</kbd>                                                       | Extend the selection by one screen down                                           | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                                                              | <kbd>⌘</kbd>+<kbd>**Enter**</kbd>                                                             | Fill the selected range of cells with the value of the active cell<sup>\*\*\*\*</sup> | &cross; | &check; |
| <kbd>**Delete**</kbd>                                                                                 | <kbd>**Delete**</kbd>                                                                               | Clear the contents of the selected cells                                          | &check; | &check; |
| <kbd>**Backspace**</kbd>                                                                              | <kbd>**Backspace**</kbd>                                                                            | Clear the contents of the selected cells                                          | &check; | &check; |

<sup>*</sup> Does not work on macOS with multiple keyboard layouts. To work around this issue, add <kbd>Fn</kbd> to the key combination.<br>
<sup>\*\*</sup> In case of multiple selection layers, only the last selection layer gets extended.<br>
<sup>\*\*\*</sup> This action depends on your layout direction.<br> 
<sup>\*\*\*\*</sup> This action works only for selections of two or more cells. The active highlight must be on a cell, not on a row header, column header, or corner.<br>

## Edition keyboard shortcuts

These keyboard shortcuts work when you're editing a cell's contents. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                               | macOS                                                       | Action                                                             |  Excel  | Sheets  |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | :-----: | :-----: |
| Arrow keys                                            | Arrow keys                                                  | Move the cursor through the text                                   | &check; | &check; |
| Alphanumeric keys                                     | Alphanumeric keys                                           | Enter the pressed key's value into the cell                        | &check; | &check; |
| <kbd>**Enter**</kbd>                                  | <kbd>**Enter**</kbd>                                        | Complete the cell entry and move to the cell below                 | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>             | <kbd>⇧</kbd>+<kbd>**Enter**</kbd>                   | Complete the cell entry and move to the cell above                 | &check; | &check; |
| <kbd>**Tab**</kbd>                                    | <kbd>**Tab**</kbd>                                          | Complete the cell entry and move to the next cell (right by default)<sup>\*</sup> — direction set by [`tabMoves`](@/api/options.md#tabmoves)     | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>               | <kbd>⇧</kbd>+<kbd>**Tab**</kbd>                     | Complete the cell entry and move to the previous cell (left by default)<sup>\*</sup> — direction set by [`tabMoves`](@/api/options.md#tabmoves) | &check; | &check; |
| <kbd>**Delete**</kbd>                                 | <kbd>**Delete**</kbd>                                       | Delete one character after the cursor<sup>\*</sup>                 | &check; | &check; |
| <kbd>**Backspace**</kbd>                              | <kbd>**Backspace**</kbd>                                    | Delete one character before the cursor<sup>\*</sup>                | &check; | &check; |
| <kbd>**Home**</kbd>                                   | <kbd>**Home**</kbd>                                         | Move the cursor to the beginning of the text<sup>\*</sup>          | &check; | &check; |
| <kbd>**End**</kbd>                                    | <kbd>**End**</kbd>                                          | Move the cursor to the end of the text<sup>\*</sup>                | &check; | &check; |
| <kbd>**Ctrl**</kbd> + Arrow keys                      | <kbd>⌘</kbd> + Arrow keys                             | Move the cursor to the beginning or to the end of the text         | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd> + Arrow keys | <kbd>⌘</kbd>+<kbd>⇧</kbd> + Arrow keys        | Extend the selection to the beginning or to the end of the text    | &check; | &check; |
| <kbd>**Page Up**</kbd>                                | <kbd>**Page Up**</kbd>                                      | Complete the cell entry and move one screen up                     | &check; | &check; |
| <kbd>**Page Down**</kbd>                              | <kbd>**Page Down**</kbd>                                    | Complete the cell entry and move one screen down                   | &check; | &check; |
| <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd>               | <kbd>⌥</kbd>+<kbd>**Enter**</kbd>                  | Insert a line break                                                | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>              | <kbd>⌃</kbd>/<kbd>⌘</kbd>+<kbd>**Enter**</kbd> | Insert a line break                                                | &cross; | &check; |
| <kbd>**Escape**</kbd>                                 | <kbd>**Escape**</kbd>                                       | Cancel the cell entry and exit the editing mode                    | &check; | &check; |

<sup>\*</sup> This action depends on your layout direction.

### Checkbox editor keyboard shortcuts

These keyboard shortcuts work in the [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell editor.

| Windows                  | macOS                    | Action                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ----------------------------- | :-----: | :-----: |
| <kbd>**Space**</kbd>     | <kbd>**Space**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Check or uncheck the checkbox | &cross; | &check; |
| <kbd>**Delete**</kbd>    | <kbd>**Delete**</kbd>    | Uncheck the checkbox          | &cross; | &check; |
| <kbd>**Backspace**</kbd> | <kbd>**Backspace**</kbd> | Uncheck the checkbox          | &cross; | &check; |

### `handsontable` editor keyboard shortcuts

These keyboard shortcuts work in the [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cell editor.

| Windows          | macOS            | Action                                 |  Excel  | Sheets  |
| ---------------- | ---------------- | -------------------------------------- | :-----: | :-----: |
| <kbd>**↑**</kbd> | <kbd>**↑**</kbd> | Move to the cell above the active cell | &cross; | &cross; |
| <kbd>**↓**</kbd> | <kbd>**↓**</kbd> | Move to the cell below the active cell | &cross; | &cross; |

### Select editor keyboard shortcuts

These keyboard shortcuts work in the [`select`](@/guides/cell-types/select-cell-type/select-cell-type.md) cell editor.

| Windows          | macOS            | Action                          |  Excel  | Sheets  |
| ---------------- | ---------------- | ------------------------------- | :-----: | :-----: |
| <kbd>**↑**</kbd> | <kbd>**↑**</kbd> | Select the previous option      | &cross; | &cross; |
| <kbd>**↓**</kbd> | <kbd>**↓**</kbd> | Select the next option          | &cross; | &cross; |

### Autocomplete editor keyboard shortcuts

The [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cell editor uses the same keyboard shortcuts as the [`handsontable` editor](#handsontable-editor-keyboard-shortcuts). In strict mode, a few of these shortcuts behave differently -- see [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode).

### Dropdown editor keyboard shortcuts

The [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell editor is an [autocomplete editor](#autocomplete-editor-keyboard-shortcuts) with strict mode always on, so it uses the same keyboard shortcuts as [Autocomplete strict mode](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md#autocomplete-strict-mode).

### MultiSelect editor keyboard shortcuts

These keyboard shortcuts work in the [`multiselect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) cell editor.

| Windows                             | macOS                               | Action                                                                                                                                          |  Excel  | Sheets  |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | :-----: | :-----: |
| <kbd>**↑**</kbd> / <kbd>**↓**</kbd>  | <kbd>**↑**</kbd> / <kbd>**↓**</kbd>  | Move the focus between items in the dropdown list                                                                                                | &cross; | &cross; |
| <kbd>**Space**</kbd>                 | <kbd>**Space**</kbd>                 | Toggle the selection of the focused item                                                                                                         | &cross; | &cross; |
| <kbd>**Enter**</kbd>                 | <kbd>**Enter**</kbd>                 | Toggle the focused item's selection, or close the editor and commit the selection, depending on the [`enterCommits`](@/api/options.md#entercommits) option | &cross; | &cross; |

For the full behavior, including how [`searchInput`](@/api/options.md#searchinput) affects initial focus, see [Keyboard navigation](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md#keyboard-navigation).

### Numeric editor keyboard shortcuts

The [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell editor is a text editor, so it uses the standard [edition keyboard shortcuts](#edition-keyboard-shortcuts) above. It has no numeric-specific key bindings.

### Date editor keyboard shortcuts

The [`intl-date`/`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell editor opens the browser's native date picker. Keyboard navigation inside the picker comes from the browser, so it varies between browsers and operating systems.

### Time editor keyboard shortcuts

The [`intl-time`/`time`](@/guides/cell-types/time-cell-type/time-cell-type.md) cell editor opens the browser's native time picker. Keyboard navigation inside the picker comes from the browser, so it varies between browsers and operating systems.

### Password editor keyboard shortcuts

The [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md) cell editor is a text editor, so it uses the standard [edition keyboard shortcuts](#edition-keyboard-shortcuts) above. It has no password-specific key bindings.

## Plugin keyboard shortcuts

These keyboard shortcuts work with particular plugins.

### Clipboard keyboard shortcuts

These keyboard shortcuts work when the [`CopyPaste`](@/api/copyPaste.md) plugin is enabled.

| Windows                              | macOS                               | Action                                                          |  Excel  | Sheets  |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**X**</kbd> | <kbd>⌘</kbd>+<kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**C**</kbd> | <kbd>⌘</kbd>+<kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**V**</kbd> | <kbd>⌘</kbd>+<kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

### Cell merging keyboard shortcuts

These keyboard shortcuts work when the [`MergeCells`](@/api/mergeCells.md) plugin is enabled.

| Windows                              | macOS                                | Action                              |  Excel  | Sheets  |
| ------------------------------------ | ------------------------------------ | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | <kbd>⌃</kbd>+<kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

### Undo and redo keyboard shortcuts

These keyboard shortcuts work when the [`UndoRedo`](@/api/undoRedo.md) plugin is enabled.

| Windows                                                   | macOS                                                    | Action               |  Excel  | Sheets  |
| --------------------------------------------------------- | -------------------------------------------------------- | -------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Z**</kbd>                      | <kbd>⌘</kbd>+<kbd>**Z**</kbd>                      | Undo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Y**</kbd>                      | <kbd>⌘</kbd>+<kbd>**Y**</kbd>                      | Redo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd> | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**Z**</kbd> | Redo the last action | &check; | &check; |

### Context menu keyboard shortcuts

These keyboard shortcuts work in context menus. To activate them, enable the [`ContextMenu`](@/api/contextMenu.md) plugin.

| Windows                                                                                               | macOS                                                                                                | Action                                                        |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**\\**</kbd> or <kbd>⇧</kbd>+<kbd>**F10**</kbd> | Open the context menu                                         | &cross; | &check; |
| Arrow keys                                                                                            | Arrow keys                                                                                           | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>                                                                                | <kbd>**Page Up**</kbd>                                                                               | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd>                                                                              | <kbd>**Page Down**</kbd>                                                                             | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>                                                                                 | <kbd>**Escape**</kbd>                                                                                | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>                                                                                  | <kbd>**Enter**</kbd>                                                                                 | Run the action of the selected menu item                      | &check; | &cross; |

### Column groups keyboard shortcuts

These keyboard shortcuts work in [column groups](@/guides/columns/column-groups/column-groups.md), also known as "nested headers". To activate them, enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin.

The <kbd>**Enter**</kbd> shortcut works only when a collapsible column group header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows              | macOS                | Action                              |  Excel  | Sheets  |
| -------------------- | -------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Collapse or expand the column group | &cross; | &cross; |

### Row parent-child keyboard shortcuts

These keyboard shortcuts work in [row groups](@/guides/rows/row-parent-child/row-parent-child.md), also known as "nested rows". To activate them, enable the [`NestedRows`](@/api/nestedRows.md) plugin.

The <kbd>**Enter**</kbd> shortcut works only when a row header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows              | macOS                | Action                           |  Excel  | Sheets  |
| -------------------- | -------------------- | -------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Collapse or expand the row group | &cross; | &cross; |

### Rows sorting keyboard shortcuts

These keyboard shortcuts work with [rows sorting](@/guides/rows/rows-sorting/rows-sorting.md). To activate them, enable the [`ColumnSorting`](@/api/columnSorting.md), or the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin.

These header-focused shortcuts work only when a column header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows                                  | macOS                                   | Action                                                                                                                                                   |  Excel  | Sheets  |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd>                     | <kbd>**Enter**</kbd>                    | Sort by the focused column, cycling through ascending, descending, and original order                                                                    | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>⇧</kbd>+<kbd>**Enter**</kbd> | Append the focused column to the active sort criteria. Requires the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin.                         | &cross; | &cross; |

### Column menu keyboard shortcuts

These keyboard shortcuts work with the [column menu](@/guides/accessories-and-menus/column-menu/column-menu.md). To activate them, enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

The <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> shortcut works from a data cell. The <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Enter**</kbd> shortcut works only when a column header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows                                                  | macOS                                                       | Action                                                                                                       |  Excel  | Sheets  |
| -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | :-----: | :-----: |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> | <kbd>⇧</kbd>+<kbd>⌥</kbd>+<kbd>**↓**</kbd> | Open the column menu. Works in any cell, if the respective column header displays the menu button.           | &cross; | &cross; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                | <kbd>⌘</kbd>+<kbd>**Enter**</kbd>                   | Open the column menu. Works only when a column header with the column menu button is focused.                | &cross; | &cross; |
| Arrow keys                                               | Arrow keys                                                  | Move one available menu item up, down, left, or right.                                                       | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**↑**</kbd> or <kbd>**Home**</kbd> | <kbd>⌘</kbd>+<kbd>**↑**</kbd> or <kbd>**Home**</kbd> | Move to the first available menu item.                                                                       | &check; | &cross; |
| <kbd>**Ctrl**</kbd>+<kbd>**↓**</kbd> or <kbd>**End**</kbd> | <kbd>⌘</kbd>+<kbd>**↓**</kbd> or <kbd>**End**</kbd>  | Move to the last available menu item.                                                                        | &check; | &cross; |
| <kbd>**Page Up**</kbd>                                  | <kbd>**Page Up**</kbd>                              | Move one visible menu page up.                                                                               | &check; | &cross; |
| <kbd>**Page Down**</kbd>                                | <kbd>**Page Down**</kbd>                            | Move one visible menu page down.                                                                             | &check; | &cross; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                               | Close the column menu or submenu.                                                                            | &check; | &check; |
| <kbd>**Enter**</kbd> or <kbd>**Space**</kbd>             | <kbd>**Enter**</kbd> or <kbd>**Space**</kbd>         | Run the action of the selected menu item, or open its submenu.                                               | &check; | &cross; |

### Column filter keyboard shortcuts

These keyboard shortcuts work with the [column filter](@/guides/columns/column-filter/column-filter.md). To activate them, enable the [`Filters`](@/api/filters.md) plugin and the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

| Windows                             | macOS                                  | Action            |  Excel  | Sheets  |
| ----------------------------------- | -------------------------------------- | ----------------- | :-----: | :-----: |
| <kbd>**Alt**</kbd>+<kbd>**A**</kbd> | <kbd>⌥</kbd>+<kbd>**A**</kbd> | Clear all filters | &cross; | &cross; |
| <kbd>**Tab**</kbd> | <kbd>**Tab**</kbd> | Move focus to the next filtering component in the open filter menu. | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> | <kbd>⇧</kbd>+<kbd>**Tab**</kbd> | Move focus to the previous filtering component in the open filter menu. | &cross; | &cross; |
| <kbd>**↑**</kbd> / <kbd>**↓**</kbd> | <kbd>**↑**</kbd> / <kbd>**↓**</kbd> | When the filter search input is focused, move through the **Filter by value** list. | &cross; | &cross; |
| <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | <kbd>**Enter**</kbd> / <kbd>**Space**</kbd> | When **Select all** or **Clear all** is focused, run the action. | &cross; | &cross; |

### Comments keyboard shortcuts

These keyboard shortcuts work with [comments](@/guides/cell-features/comments/comments.md). To activate them, enable the [`Comments`](@/api/comments.md) plugin.

| Windows                                                 | macOS                                                      | Action                                                                     |  Excel  | Sheets  |
|---------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------| :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Alt**</kbd>+<kbd>**M**</kbd> | <kbd>⌃</kbd>+<kbd>⌥</kbd>+<kbd>**M**</kbd> | Add or edit a comment                                                      | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                | <kbd>⌘</kbd>+<kbd>**Enter**</kbd>                    | Save and exit the current comment                                          | &cross; | &check; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                                      | Exit the current comment without saving                                    | &cross; | &cross; |
| <kbd>**Tab**</kbd>                                      | <kbd>**Tab**</kbd>                                         | Save and exit the current comment, move the selection to the next cell     | &cross; | &cross; |
| <kbd>**Shift + Tab**</kbd>                              | <kbd>**Shift + Tab**</kbd>                                 | Save and exit the current comment, move the selection to the previous cell | &cross; | &cross; |


## API reference

For the list of [options](@/guides/configuration/configuration-options/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to keyboard navigation, see the following API reference pages:

**APIs**

<div class="boxes-list">

- [ShortcutContext](@/api/shortcutContext.md)
- [ShortcutManager](@/api/shortcutManager.md)

</div>

**Configuration options**

<div class="boxes-list">

- [enterBeginsEditing](@/api/options.md#enterbeginsediting)
- [enterMoves](@/api/options.md#entermoves)
- [tabMoves](@/api/options.md#tabmoves)

</div>

**Core methods**

<div class="boxes-list">

- [getShortcutManager()](@/api/core.md#getshortcutmanager)
- [isListening()](@/api/core.md#islistening)
- [listen()](@/api/core.md#listen)
- [unlisten()](@/api/core.md#unlisten)

</div>

**Hooks**

<div class="boxes-list">

- [afterDocumentKeyDown](@/api/hooks.md#afterdocumentkeydown)
- [beforeKeyDown](@/api/hooks.md#beforekeydown)

</div>

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 14.3.0: Enhanced navigation and bug fixes](https://handsontable.com/blog/handsontable-14.3.0-enhanced-navigation-and-bug-fixes)
- [Handsontable 12.0.0: RTL support, and a new keyboard shortcuts API](https://handsontable.com/blog/handsontable-12.0.0-data-grid-rtl-support-and-a-new-keyboard-shortcuts-api)

</div>

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/issues) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>
