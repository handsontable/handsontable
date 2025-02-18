---
id: 5w6juytv
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
  id: ddjw4zt88
  metaTitle: Keyboard shortcuts - React Data Grid | Handsontable
searchCategory: Guides
category: Navigation
---

# Keyboard shortcuts

Access all Handsontable features using just your keyboard. Use shortcuts you know from Google Sheets or Microsoft Excel.

## Overview

[[toc]]

This page lists all of Handsontable's default keyboard shortcuts.

## Navigation keyboard shortcuts

These keyboard shortcuts work when you navigate the grid. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                      | macOS                                       | Action                                                                                          |  Excel  | Sheets  |
| -------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys                                   | Arrow keys                                  | Move one cell up, down, left, or right                                                          | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Backspace**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Backspace**</kbd> | Scroll the viewport to show the focused cell                                                    | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**↑**</kbd>         | <kbd>**Cmd**</kbd>+<kbd>**↑**</kbd>         | Move to the first cell of the current column                                                    | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**↓**</kbd>         | <kbd>**Cmd**</kbd>+<kbd>**↓**</kbd>         | Move to the last cell of the current column                                                     | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**←**</kbd>         | <kbd>**Cmd**</kbd>+<kbd>**←**</kbd>         | Move to the leftmost cell of the current row                                                    | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**→**</kbd>         | <kbd>**Cmd**</kbd>+<kbd>**→**</kbd>         | Move to the rightmost cell of the current row                                                   | &check; | &check; |
| <kbd>**F2**</kbd>                            | <kbd>**F2**</kbd>                           | Enter the editing mode of the active cell                                                       | &check; | &check; |
| <kbd>**Enter**</kbd>                         | <kbd>**Enter**</kbd>                        | Enter the editing mode of the active cell                                                       | &cross; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>    | <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>   | Enter the editing mode of the active cell                                                       | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | Save and close editor                                         | &check; | &check; |
| Alphanumeric keys                            | Alphanumeric keys                           | Enter the editing mode of the active cell and enter the pressed key's value into the cell      | &check; | &check; |
| <kbd>**Tab**</kbd>                           | <kbd>**Tab**</kbd>                          | Move to the next cell<sup>\*</sup> (if there's only one column available, move one cell down)   | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>      | <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>     | Move to the previous cell<sup>\*</sup> (if there's only one column available, move one cell up) | &check; | &check; |
| <kbd>**Home**</kbd>                          | <kbd>**Home**</kbd>                         | Move to the first non-frozen cell of the current row<sup>\*</sup>                               | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Home**</kbd>      | <kbd>**Cmd**</kbd>+<kbd>**Home**</kbd>      | Move to the first non-frozen cell of the grid<sup>\*</sup>                                      | &cross; | &check; |
| <kbd>**End**</kbd>                           | <kbd>**End**</kbd>                          | Move to the last non-frozen cell of the current row<sup>\*</sup>                                | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**End**</kbd>       | <kbd>**Cmd**</kbd>+<kbd>**End**</kbd>       | Move to the last non-frozen cell of the grid<sup>\*</sup>                                       | &cross; | &check; |
| <kbd>**Page Up**</kbd>                       | <kbd>**Page Up**</kbd>                      | Move one screen up                                                                              | &check; | &check; |
| <kbd>**Page Down**</kbd>                     | <kbd>**Page Down**</kbd>                    | Move one screen down                                                                            | &check; | &check; |

<sup>\*</sup> This action depends on your layout direction.

## Selection keyboard shortcuts

These keyboard shortcuts help you select cells. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                                                                               | macOS                                                                                               | Action                                                                            |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**A**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**A**</kbd>  | Select all cells                                                      | &check; | &check; |
|<kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Space**</kbd> |<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Space**</kbd> | Select all cells and headers                                                      | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                                                              | <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                                                            | Select the entire column                                                          | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                             | <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                                                           | Select the entire row                                                             | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd>                                             | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd>                                            | Extend the selection to the first cell of the current column<sup>\*\*</sup>       | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd>                                             | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd>                                            | Extend the selection to the last cell of the current column<sup>\*\*</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd>                                             | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd>                                            | Extend the selection to the leftmost cell of the current row<sup>\*\*</sup>       | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd>                                             | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd>                                            | Extend the selection to the rightmost cell of the current row<sup>\*\*</sup>      | &check; | &check; |
| <kbd>**Shift**</kbd> + Arrow keys                                                                     | <kbd>**Shift**</kbd> + Arrow keys                                                                   | Extend the selection by one cell                                                  | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Home**</kbd>                                                              | <kbd>**Shift**</kbd>+<kbd>**Home**</kbd>                                                            | Extend the selection to the first non-frozen cell of the current row<sup>\*</sup> | &check; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**End**</kbd>                                                               | <kbd>**Shift**</kbd>+<kbd>**End**</kbd>                                                             | Extend the selection to the last non-frozen cell of the current row<sup>\*</sup>  | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>                                                           | <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>                                                         | Extend the selection by one screen up                                             | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Page Down**</kbd>                                                         | <kbd>**Shift**</kbd>+<kbd>**Page Down**</kbd>                                                       | Extend the selection by one screen down                                           | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                                                              | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                                                             | Fill the selected range of cells with the value of the active cell                | &cross; | &check; |
| <kbd>**Delete**</kbd>                                                                                 | <kbd>**Delete**</kbd>                                                                               | Clear the contents of the selected cells                                          | &check; | &check; |
| <kbd>**Backspace**</kbd>                                                                              | <kbd>**Backspace**</kbd>                                                                            | Clear the contents of the selected cells                                          | &check; | &check; |

<sup>\*</sup> This action depends on your layout direction.<br> <sup>\*\*</sup> In case of multiple selection layers, only the last selection layer gets extended.

## Edition keyboard shortcuts

These keyboard shortcuts work when you're editing a cell's contents. They come from Handsontable's [`Core`](@/api/core.md), so they work out of the box, with no need for additional plugins.

| Windows                                               | macOS                                                       | Action                                                             |  Excel  | Sheets  |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | :-----: | :-----: |
| Arrow keys                                            | Arrow keys                                                  | Move the cursor through the text                                   | &check; | &check; |
| Alphanumeric keys                                     | Alphanumeric keys                                           | Enter the pressed key's value into the cell                        | &check; | &check; |
| <kbd>**Enter**</kbd>                                  | <kbd>**Enter**</kbd>                                        | Complete the cell entry and move to the cell below                 | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>             | <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd>                   | Complete the cell entry and move to the cell above                 | &check; | &check; |
| <kbd>**Tab**</kbd>                                    | <kbd>**Tab**</kbd>                                          | Complete the cell entry and move to the next cell<sup>\*</sup>     | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>               | <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd>                     | Complete the cell entry and move to the previous cell<sup>\*</sup> | &check; | &check; |
| <kbd>**Delete**</kbd>                                 | <kbd>**Delete**</kbd>                                       | Delete one character after the cursor<sup>\*</sup>                 | &check; | &check; |
| <kbd>**Backspace**</kbd>                              | <kbd>**Backspace**</kbd>                                    | Delete one character before the cursor<sup>\*</sup>                | &check; | &check; |
| <kbd>**Home**</kbd>                                   | <kbd>**Home**</kbd>                                         | Move the cursor to the beginning of the text<sup>\*</sup>          | &check; | &check; |
| <kbd>**End**</kbd>                                    | <kbd>**End**</kbd>                                          | Move the cursor to the end of the text<sup>\*</sup>                | &check; | &check; |
| <kbd>**Ctrl**</kbd> + Arrow keys                      | <kbd>**Cmd**</kbd> + Arrow keys                             | Move the cursor to the beginning or to the end of the text         | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd> + Arrow keys | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd> + Arrow keys        | Extend the selection to the beginning or to the end of the text    | &check; | &check; |
| <kbd>**Page Up**</kbd>                                | <kbd>**Page Up**</kbd>                                      | Complete the cell entry and move one screen up                     | &check; | &check; |
| <kbd>**Page Down**</kbd>                              | <kbd>**Page Down**</kbd>                                    | Complete the cell entry and move one screen down                   | &check; | &check; |
| <kbd>**Alt**</kbd>+<kbd>**Enter**</kbd>               | <kbd>**Option**</kbd>+<kbd>**Enter**</kbd>                  | Insert a line break                                                | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>              | <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd> | Insert a line break                                                | &cross; | &check; |
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

## Plugin keyboard shortcuts

These keyboard shortcuts work with particular plugins.

### Clipboard keyboard shortcuts

These keyboard shortcuts work when the [`CopyPaste`](@/api/copyPaste.md) plugin is enabled.

| Windows                              | macOS                               | Action                                                          |  Excel  | Sheets  |
| ------------------------------------ | ----------------------------------- | --------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**X**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**X**</kbd> | Cut the contents of the selected cells to the system clipboard  | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**C**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**C**</kbd> | Copy the contents of the selected cells to the system clipboard | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**V**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**V**</kbd> | Paste from the system clipboard                                 | &check; | &check; |

### Cell merging keyboard shortcuts

These keyboard shortcuts work when the [`MergeCells`](@/api/mergeCells.md) plugin is enabled.

| Windows                              | macOS                                | Action                              |  Excel  | Sheets  |
| ------------------------------------ | ------------------------------------ | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

### Undo and redo keyboard shortcuts

These keyboard shortcuts work when the [`UndoRedo`](@/api/undoRedo.md) plugin is enabled.

| Windows                                                   | macOS                                                    | Action               |  Excel  | Sheets  |
| --------------------------------------------------------- | -------------------------------------------------------- | -------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Z**</kbd>                      | <kbd>**Cmd**</kbd>+<kbd>**Z**</kbd>                      | Undo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Y**</kbd>                      | <kbd>**Cmd**</kbd>+<kbd>**Y**</kbd>                      | Redo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd> | Redo the last action | &check; | &check; |

### Context menu keyboard shortcuts

These keyboard shortcuts work in context menus. To activate them, enable the [`ContextMenu`](@/api/contextMenu.md) plugin.

| Windows                                                                                               | macOS                                                                                                | Action                                                        |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | Open the context menu                                         | &cross; | &check; |
| Arrow keys                                                                                            | Arrow keys                                                                                           | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>                                                                                | <kbd>**Page Up**</kbd>                                                                               | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd>                                                                              | <kbd>**Page Down**</kbd>                                                                             | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>                                                                                 | <kbd>**Escape**</kbd>                                                                                | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>                                                                                  | <kbd>**Enter**</kbd>                                                                                 | Run the action of the selected menu item                      | &check; | &cross; |

### Column groups keyboard shortcuts

These keyboard shortcuts work in [column groups](@/guides/columns/column-groups/column-groups.md), also known as "nested headers". To activate them, enable the [`NestedHeaders`](@/api/nestedHeaders.md) plugin.

| Windows              | macOS                | Action                              |  Excel  | Sheets  |
| -------------------- | -------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Collapse or expand the column group | &cross; | &cross; |

### Row parent-child keyboard shortcuts

These keyboard shortcuts work in [row groups](@/guides/rows/row-parent-child/row-parent-child.md), also known as "nested rows". To activate them, enable the [`NestedRows`](@/api/nestedRows.md) plugin.

| Windows              | macOS                | Action                           |  Excel  | Sheets  |
| -------------------- | -------------------- | -------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Collapse or expand the row group | &cross; | &cross; |

### Rows sorting keyboard shortcuts

These keyboard shortcuts work with [rows sorting](@/guides/rows/rows-sorting/rows-sorting.md). To activate them, enable the [`ColumnSorting`](@/api/columnSorting.md), or the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin.

| Windows                                  | macOS                                   | Action                                                                                                                                                   |  Excel  | Sheets  |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd>                     | <kbd>**Enter**</kbd>                    | Sort data by the selected column, in ascending, descending, or the original order                                                                        | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | Sort data by multiple columns, in ascending, descending, or the original order. Requires the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin. | &cross; | &cross; |

### Column menu keyboard shortcuts

These keyboard shortcuts work with the [column menu](@/guides/columns/column-menu/column-menu.md). To activate them, enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

| Windows                                                  | macOS                                                       | Action                                                                                                       |  Excel  | Sheets  |
| -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | :-----: | :-----: |
| <kbd>**Shift**</kbd>+<kbd>**Alt**</kbd>+<kbd>**↓**</kbd> | <kbd>**Shift**</kbd>+<kbd>**Option**</kbd>+<kbd>**↓**</kbd> | Open the column menu. Works in any cell, if the respective column header displays the menu button.           | &cross; | &cross; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                   | Open the column menu. Works only when you're selecting a column header that displays the column menu button. | &cross; | &cross; |

### Column filter keyboard shortcuts

These keyboard shortcuts work with the [column filter](@/guides/columns/column-filter/column-filter.md). To activate them, enable the [`Filters`](@/api/filters.md) plugin and the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

| Windows                             | macOS                                  | Action            |  Excel  | Sheets  |
| ----------------------------------- | -------------------------------------- | ----------------- | :-----: | :-----: |
| <kbd>**Alt**</kbd>+<kbd>**A**</kbd> | <kbd>**Option**</kbd>+<kbd>**A**</kbd> | Clear all filters | &cross; | &cross; |

### Comments keyboard shortcuts

These keyboard shortcuts work with [comments](@/guides/cell-features/comments/comments.md). To activate them, enable the [`Comments`](@/api/comments.md) plugin.

| Windows                                                 | macOS                                                      | Action                                                                     |  Excel  | Sheets  |
|---------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------| :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Alt**</kbd>+<kbd>**M**</kbd> | <kbd>**Ctrl**</kbd>+<kbd>**Option**</kbd>+<kbd>**M**</kbd> | Add or edit a comment                                                      | &cross; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                    | Save and exit the current comment                                          | &cross; | &check; |
| <kbd>**Escape**</kbd>                                   | <kbd>**Escape**</kbd>                                      | Exit the current comment without saving                                    | &cross; | &cross; |
| <kbd>**Tab**</kbd>                                      | <kbd>**Tab**</kbd>                                         | Save and exit the current comment, move the selection to the next cell     | &cross; | &cross; |
| <kbd>**Shift + Tab**</kbd>                              | <kbd>**Shift + Tab**</kbd>                                 | Save and exit the current comment, move the selection to the previous cell | &cross; | &cross; |


## API reference

For the list of [options](@/guides/getting-started/configuration-options/configuration-options.md), methods, and [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) related to keyboard navigation, see the following API reference pages:

- APIs:
  - [`ShortcutContext`](@/api/shortcutContext.md)
  - [`ShortcutManager`](@/api/shortcutManager.md)
- Configuration options:
  - [`enterBeginsEditing`](@/api/options.md#enterbeginsediting)
  - [`enterMoves`](@/api/options.md#entermoves)
  - [`tabMoves`](@/api/options.md#tabmoves)
- Core methods:
  - [`getShortcutManager()`](@/api/core.md#getshortcutmanager)
  - [`isListening()`](@/api/core.md#islistening)
  - [`listen()`](@/api/core.md#listen)
  - [`unlisten()`](@/api/core.md#unlisten)
- Hooks:
  - [`afterDocumentKeyDown`](@/api/hooks.md#afterdocumentkeydown)
  - [`beforeKeyDown`](@/api/hooks.md#beforekeydown)

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list gray">

- [View related topics](https://github.com/handsontable/handsontable/issues) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>
