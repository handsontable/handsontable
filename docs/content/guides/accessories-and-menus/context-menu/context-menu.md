---
id: 3hrrxxln
title: Context menu
metaTitle: Context menu - JavaScript Data Grid | Handsontable
description: Quickly access contextual actions such as removing rows, inserting columns or copying data, by opening the context menu.
permalink: /context-menu
canonicalUrl: /context-menu
tags:
  - contextual menu
  - shortcut menu
  - pop-up menu
  - right-click menu
react:
  id: r2x6mh6h
  metaTitle: Context menu - React Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
---

# Context menu

Quickly access contextual actions such as removing rows, inserting columns or copying data, by opening the context menu.

[[toc]]

## Context menu with default options

Enable the context menu with the default configuration:

```js
contextMenu: true,
```

To see the context menu, right-click on a cell:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/context-menu/react/example1.tsx)

:::

:::


## Context menu with selected options

You can define the items in the menu by passing the [`contextMenu`](@/api/options.md#contextmenu) option as an array of keys:

| Key                                                      | Action and required plugins                                                                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`row_above`](@/api/contextMenu.md)                      | Insert a row above                                                                                                                                          |
| [`row_below`](@/api/contextMenu.md)                      | Insert a row below                                                                                                                                          |
| [`col_left`](@/api/contextMenu.md)                       | Insert a column to the left                                                                                                                                 |
| [`col_right`](@/api/contextMenu.md)                      | Insert a column to the right                                                                                                                                |
| [`---------`](@/api/contextMenu.md)                      | Add a separator to the items in the menu                                                                                                                                    |
| [`remove_row`](@/api/contextMenu.md)                     | Remove the selected row   
| [`remove_col`](@/api/contextMenu.md)                     | Remove the selected column                                                                                                                                  |
| [`clear_column`](@/api/contextMenu.md)                   | Delete the data of the selected columns                                                                                                                     |
| [`undo`](@/api/contextMenu.md)                           | Undo the last action. Requires: [`UndoRedo`](@/api/undoRedo.md)                                                                                                      |
| [`redo`](@/api/contextMenu.md)                           | Redo the last action. Requires: [`UndoRedo`](@/api/undoRedo.md)                                                                                                      |
| [`make_read_only`](@/api/contextMenu.md)                 | Make the selected cells read-only                                                                                                                           |
| [`alignment`](@/api/contextMenu.md)                      | Align the text in the cell                                                                                                                                                  |
| [`cut`](@/api/contextMenu.md)                            | Cut the contents of the selected cells to the system clipboard. Requires: [`CopyPaste`](@/api/copyPaste.md)                                                          |
| [`copy`](@/api/contextMenu.md)                           | Copy the contents of the selected cells to the system clipboard. Requires: [`CopyPaste`](@/api/copyPaste.md)                                                         |
| [`copy_with_column_headers`](@/api/contextMenu.md)       | Copy the contents of the selected cells and their nearest column headers. Requires: [`CopyPaste`](@/api/copyPaste.md) with `copyColumnHeaders` set to `true`                                              |
| [`copy_with_column_group_headers`](@/api/contextMenu.md) | Copy the contents of the selected cells and all their related column headers. Requires: [`NestedHeaders`](@/api/nestedHeaders.md) and [`CopyPaste`](@/api/copyPaste.md) with `copyColumnGroupHeaders` set to `true`         | 
| [`copy_column_headers_only`](@/api/contextMenu.md)       | Copy the contents of column headers that are nearest to the selected cells. Requires: [`CopyPaste`](@/api/copyPaste.md) with `copyColumnHeadersOnly` set to `true`                                               |
| [`freeze_column`](@/api/contextMenu.md)                  | Freeze the selected column. Requires: [`ManualColumnFreeze`](@/api/manualColumnFreeze.md)                                                                            |
| [`unfreeze_column`](@/api/contextMenu.md)                | Unfreeze the selected column. Requires: [`ManualColumnFreeze`](@/api/manualColumnFreeze.md)                                                                          |
| [`borders`](@/api/contextMenu.md)                        | Add borders around the selected cells. Requires: [`CustomBorders`](@/api/customBorders.md)                                                                           |
| [`commentsAddEdit`](@/api/contextMenu.md)                | Add or edit a comment. Requires: [`Comments`](@/api/comments.md)                                                                                                     |
| [`commentsRemove`](@/api/contextMenu.md)                 | Remove the comment. Requires: [`Comments`](@/api/comments.md)                                                                                                        |
| [`commentsReadOnly`](@/api/contextMenu.md)               | Make the comment read-only. Requires: [`Comments`](@/api/comments.md)                                                                                                |
| [`mergeCells`](@/api/contextMenu.md)                     | Merge or unmerge the selected cells. Requires: [`MergeCells`](@/api/mergeCells.md)                                                                                   |
| [`add_child`](@/api/contextMenu.md)                      | Insert a child row. Requires: [`NestedRows`](@/api/nestedRows.md)                                                                                                    |
| [`detach_from_parent`](@/api/contextMenu.md)             | Detach the selected row from its parent row. Requires: [`NestedRows`](@/api/nestedRows.md)                                                                           |
| [`hidden_columns_hide`](@/api/contextMenu.md)            | Hide the selected columns. Requires: [`HiddenColumns`](@/api/hiddenColumns.md)                                                                                       |
| [`hidden_columns_show`](@/api/contextMenu.md)            | Show the hidden columns. Requires: [`HiddenColumns`](@/api/hiddenColumns.md)                                                                                             |
| [`hidden_rows_hide`](@/api/contextMenu.md)               | Hide the selected rows. Requires: [`HiddenRows`](@/api/hiddenRows.md)                                                                                                |
| [`hidden_rows_show`](@/api/contextMenu.md)               | Show hidden rows. Requires: [`HiddenRows`](@/api/hiddenRows.md)                                                                                                      |
| [`filter_by_condition`](@/api/contextMenu.md)            | Add the first filter condition. Requires: [`Filters`](@/api/filters.md)                                                                                                |
| [`filter_by_condition2`](@/api/contextMenu.md)           | Add the second filter condition. Requires: [`Filters`](@/api/filters.md)                                                                                               |
| [`filter_operators`](@/api/contextMenu.md)               | Select a filter parameter. Requires: [`Filters`](@/api/filters.md)                                                                                                   |
| [`filter_by_value`](@/api/contextMenu.md)                | Add a filter value. Requires: [`Filters`](@/api/filters.md)                                                                                                          |
| [`filter_action_bar`](@/api/contextMenu.md)              | Apply the configured filter. Requires: [`Filters`](@/api/filters.md)                                                                                                 |

To see the context menu, right-click on a cell:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/context-menu/react/example2.tsx)

:::

:::

::: only-for react

## Context menu with custom options

In addition to built-in options, you can equip your context menu with custom options.

To see the context menu, right-click on a cell:

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/react/example4.jsx)
@[code](@/content/guides/accessories-and-menus/context-menu/react/example4.tsx)

:::

:::

## Context menu with a fully custom configuration

This example shows how to:

- Add common callback for all options
- Dynamically disable option
- Set custom text for predefined option
- Add own custom option
- Add callback for specific option

To see the context menu, right-click on a cell:

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example3.js)
@[code](@/content/guides/accessories-and-menus/context-menu/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/react/example3.jsx)
@[code](@/content/guides/accessories-and-menus/context-menu/react/example3.tsx)

:::

:::

## Related keyboard shortcuts

| Windows                                                                                               | macOS                                                                                                | Action                                                        |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | Open the context menu                                         | &cross; | &check; |
| Arrow keys                                                                                            | Arrow keys                                                                                           | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>                                                                                | <kbd>**Page Up**</kbd>                                                                               | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd>                                                                              | <kbd>**Page Down**</kbd>                                                                             | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>                                                                                 | <kbd>**Escape**</kbd>                                                                                | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>                                                                                  | <kbd>**Enter**</kbd>                                                                                 | Run the action of the selected menu item                      | &check; | &cross; |

## Related articles

### Related guides

<div class="boxes-list gray">
 
- [Adding comments via the context menu](@/guides/cell-features/comments/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)
::: only-for javascript
- [Custom context menu in React](@/react/guides/accessories-and-menus/context-menu/context-menu.md)
- [Custom context menu in Angular](@/guides/integrate-with-angular/angular-custom-context-menu-example/angular-custom-context-menu-example.md)
- [Custom context menu in Vue 2](@/guides/integrate-with-vue/vue-custom-context-menu-example/vue-custom-context-menu-example.md)
- [Custom context menu in Vue 3](@/guides/integrate-with-vue3/vue3-custom-context-menu-example/vue3-custom-context-menu-example.md)
:::

</div>

### Related blog articles

<div class="boxes-list">

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

</div>

### Related API reference

- Configuration options:
  - [`allowInsertColumn`](@/api/options.md#allowinsertcolumn)
  - [`allowInsertRow`](@/api/options.md#allowinsertrow)
  - [`allowRemoveColumn`](@/api/options.md#allowremovecolumn)
  - [`allowRemoveRow`](@/api/options.md#allowremoverow)
  - [`contextMenu`](@/api/options.md#contextmenu)
  - [`dropdownMenu`](@/api/options.md#dropdownmenu)
- Hooks:
  - [`afterContextMenuDefaultOptions`](@/api/hooks.md#aftercontextmenudefaultoptions)
  - [`afterContextMenuHide`](@/api/hooks.md#aftercontextmenuhide)
  - [`afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)
  - [`afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions)
  - [`afterDropdownMenuHide`](@/api/hooks.md#afterdropdownmenuhide)
  - [`afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)
  - [`afterOnCellContextMenu`](@/api/hooks.md#afteroncellcontextmenu)
  - [`beforeContextMenuSetItems`](@/api/hooks.md#beforecontextmenusetitems)
  - [`beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow)
  - [`beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)
  - [`beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow)
  - [`beforeOnCellContextMenu`](@/api/hooks.md#beforeoncellcontextmenu)
- Plugins:
  - [`ContextMenu`](@/api/contextMenu.md)
