---
type: reference
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
  metaTitle: Context menu - React Data Grid | Handsontable
angular:
  metaTitle: Context menu - Angular Data Grid | Handsontable
vue:
  metaTitle: Context menu - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: updated
---
The context menu provides cell-level actions accessible by right-clicking. This page lists all available menu items and their configuration keys.

[[toc]]

## Context menu with default options

Enable the context menu with the default configuration:

```js
contextMenu: true,
```

To see the context menu, right-click on a cell. On touch devices, long-press a cell to open the context menu.

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

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/context-menu/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/context-menu/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/context-menu/vue/example1.vue)

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
| [`export_file`](@/api/contextMenu.md)                    | Open the Export submenu with "To CSV" and "To Excel" items. Requires: [`ExportFile`](@/api/exportFile.md). The Excel item is hidden when no XLSX engine is configured. |

To see the context menu, right-click on a cell. On touch devices, long-press a cell to open the context menu.

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

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/context-menu/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/context-menu/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/context-menu/vue/example2.vue)

:::

:::

::: only-for react

## Context menu with custom options

In addition to built-in options, you can equip your context menu with custom options.

To see the context menu, right-click on a cell. On touch devices, long-press a cell to open the context menu.

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/context-menu/react/example4.jsx)
@[code](@/content/guides/accessories-and-menus/context-menu/react/example4.tsx)

:::

:::

::: only-for vue

## Context menu with custom options

In addition to built-in options, you can equip your context menu with custom options.

To see the context menu, right-click on a cell. On touch devices, long-press a cell to open the context menu.

::: example #example4 :vue3

@[code](@/content/guides/accessories-and-menus/context-menu/vue/example4.vue)

:::

:::

## Context menu with a fully custom configuration

To fully customize the context menu, set `contextMenu` to an object with an `items` property. Each key in `items` identifies one menu entry. The value can be:

- A predefined item key string such as `'row_above'` — includes the built-in item unchanged.
- The string `'---------'` — inserts a horizontal separator line.
- A configuration object — defines a custom item or overrides a predefined one.

This means you can freely mix built-in items with custom ones in the same menu:

```js
contextMenu: {
  // Optional: a shared callback fired on every item click.
  callback(key, selection, clickEvent) {
    console.log(key, selection, clickEvent);
  },
  items: {
    row_above: {},                   // predefined item, unchanged
    sp1: '---------',               // separator
    row_below: {
      name: 'Click to add row below', // override a predefined item's label
    },
    myOption: {                      // fully custom item
      name: 'My custom action',
      callback() { /* ... */ },
    },
  },
},
```

The top-level object also accepts a `uiContainer` property (an `HTMLElement`) to control which DOM element the context menu is appended to.

### Menu item configuration options

Each configuration object in `items` can have these properties:

| Option | Description |
| ------ | ----------- |
| `key` | The unique identifier for the item. For top-level items, this is the key of the `items` object (for example `'row_above'` or `'myOption'`). For submenu items, it must follow the `parent_key:child_key` format (for example `'colors:red'`). |
| `name` | The label shown in the menu. Can be a `string` or a function returning a string. Supports HTML. When a function, `this` refers to the Handsontable instance. |
| `disabled` | Whether the item is grayed out and non-clickable. Can be a `boolean` or a function returning a boolean. When a function, `this` refers to the Handsontable instance. |
| `hidden` | Whether the item is hidden from the menu entirely. Can be a `boolean` or a function returning a boolean. When a function, `this` refers to the Handsontable instance. |
| `callback` | A function called when the item is clicked. Receives `key`, `selection`, and `clickEvent` as arguments. |
| `submenu` | Defines a nested submenu. Takes an object with an `items` array. Each submenu item's `key` must follow the `parent_key:child_key` format. |
| `renderer` | A custom function for rendering the item's HTML. Must return an `HTMLElement`. |
| `disableSelection` | When `true`, hovering over the item does not highlight it. |
| `isCommand` | When `false`, clicking the item does not execute a command or close the menu. |

The following example shows how to:

- Add a shared callback for all options
- Dynamically disable an option
- Override the label of a predefined option
- Add a fully custom option with its own callback
- Add a custom option with a submenu
- Use a custom renderer


To see the context menu, right-click on a cell. On touch devices, long-press a cell to open the context menu.

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

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/context-menu/angular/example3.ts)
@[code](@/content/guides/accessories-and-menus/context-menu/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/accessories-and-menus/context-menu/vue/example3.vue)

:::

:::

## Related keyboard shortcuts and gestures

| Windows                                                                                               | macOS                                                                                                | Action                                                        |  Excel  | Sheets  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**\\**</kbd> or <kbd>**Shift**</kbd>+<kbd>**F10**</kbd> | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**\\**</kbd> or <kbd>⇧</kbd>+<kbd>**F10**</kbd> | Open the context menu                                         | &cross; | &check; |
| Long-press (touch devices)                                                                            | Long-press (touch devices)                                                                           | Open the context menu                                         | &cross; | &check; |
| Arrow keys                                                                                            | Arrow keys                                                                                           | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>                                                                                | <kbd>**Page Up**</kbd>                                                                               | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd>                                                                              | <kbd>**Page Down**</kbd>                                                                             | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>                                                                                 | <kbd>**Escape**</kbd>                                                                                | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>                                                                                  | <kbd>**Enter**</kbd>                                                                                 | Run the action of the selected menu item                      | &check; | &cross; |

## Related articles

**Related guides**

<div class="boxes-list">

- [Adding comments via the context menu](@/guides/cell-features/comments/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack/icon-pack.md)
::: only-for javascript
- [Custom context menu in React](@/react/guides/accessories-and-menus/context-menu/context-menu.md)
- [Custom context menu in Angular](@/angular/guides/accessories-and-menus/context-menu/context-menu.md)
- [Custom context menu in Vue 3](@/vue/guides/accessories-and-menus/context-menu/context-menu.md)
:::

</div>

**Related blog articles**

<div class="boxes-list">

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

</div>

**Configuration options**

<div class="boxes-list">

- [allowInsertColumn](@/api/options.md#allowinsertcolumn)
- [allowInsertRow](@/api/options.md#allowinsertrow)
- [allowRemoveColumn](@/api/options.md#allowremovecolumn)
- [allowRemoveRow](@/api/options.md#allowremoverow)
- [contextMenu](@/api/options.md#contextmenu)
- [dropdownMenu](@/api/options.md#dropdownmenu)

</div>

**Hooks**

<div class="boxes-list">

- [afterContextMenuDefaultOptions](@/api/hooks.md#aftercontextmenudefaultoptions)
- [afterContextMenuHide](@/api/hooks.md#aftercontextmenuhide)
- [afterContextMenuShow](@/api/hooks.md#aftercontextmenushow)
- [afterDropdownMenuDefaultOptions](@/api/hooks.md#afterdropdownmenudefaultoptions)
- [afterDropdownMenuHide](@/api/hooks.md#afterdropdownmenuhide)
- [afterDropdownMenuShow](@/api/hooks.md#afterdropdownmenushow)
- [afterOnCellContextMenu](@/api/hooks.md#afteroncellcontextmenu)
- [beforeContextMenuSetItems](@/api/hooks.md#beforecontextmenusetitems)
- [beforeContextMenuShow](@/api/hooks.md#beforecontextmenushow)
- [beforeDropdownMenuSetItems](@/api/hooks.md#beforedropdownmenusetitems)
- [beforeDropdownMenuShow](@/api/hooks.md#beforedropdownmenushow)
- [beforeOnCellContextMenu](@/api/hooks.md#beforeoncellcontextmenu)

</div>

**Plugins**

<div class="boxes-list">

- [ContextMenu](@/api/contextMenu.md)

</div>

## Related

<div class="boxes-list">

- [Custom shortcuts](@/guides/navigation/custom-shortcuts/custom-shortcuts.md)
- [Adding comments via the context menu](@/guides/cell-features/comments/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard/clipboard.md#context-menu)

</div>
