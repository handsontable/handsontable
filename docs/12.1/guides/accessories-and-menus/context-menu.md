---
title: Context menu
metaTitle: Context menu - Guide - Handsontable Documentation
permalink: /12.1/context-menu
canonicalUrl: /context-menu
tags:
  - contextual menu
  - shortcut menu
  - pop-up menu
  - right-click menu
---

# Context menu

[[toc]]

## Context menu with default options

To run the basic configuration of the Context Menu, just set the [`contextMenu`](@/api/options.md#contextmenu) option to `true`.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16]
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Context menu with specific options

You can define items in the menu by passing the [`contextMenu`](@/api/options.md#contextmenu) option as an array of keys which are strings:

| Key                                  | Purpose                          | Extra conditions                                                   |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| [`row_above`](@/api/contextMenu.md) | Insert row above action          |                                                                    |
| [`row_below`](@/api/contextMenu.md)                          | Insert row below action          |                                                                    |
| [`col_left`](@/api/contextMenu.md)                           | Insert column left action        |                                                                    |
| [`col_right`](@/api/contextMenu.md)                          | Insert column right action       |                                                                    |
| [`---------`](@/api/contextMenu.md)                          | Separator                        |                                                                    |
| [`remove_row`](@/api/contextMenu.md)                         | Remove row action                |                                                                    |
| [`clear_column`](@/api/contextMenu.md)                       | Clear column values action       |                                                                    |
| [`undo`](@/api/contextMenu.md)                               | Undo action                      | Plugin [UndoRedo](@/api/undoRedo.md) turned on                     |
| [`redo`](@/api/contextMenu.md)                               | Redo action                      | Plugin [UndoRedo](@/api/undoRedo.md) turned on                     |
| [`make_read_only`](@/api/contextMenu.md)                     | Make read only action            |                                                                    |
| [`alignment`](@/api/contextMenu.md)                          | Alignment actions                |                                                                    |
| [`cut`](@/api/contextMenu.md)                                | Cut action                       | Plugin [CopyPaste](@/api/copyPaste.md) turned on                   |
| [`copy`](@/api/contextMenu.md)                               | Copy action                      | Plugin [CopyPaste](@/api/copyPaste.md) turned on                   |
| [`freeze_column`](@/api/contextMenu.md)                      | Freeze column action             | Plugin [ManualColumnFreeze](@/api/manualColumnFreeze.md) turned on |
| [`unfreeze_column`](@/api/contextMenu.md)                    | Unfreeze column action           | Plugin [ManualColumnFreeze](@/api/manualColumnFreeze.md) turned on |
| [`borders`](@/api/contextMenu.md)                            | Custom borders actions           | Plugin [CustomBorders](@/api/customBorders.md) turned on           |
| [`commentsAddEdit`](@/api/contextMenu.md)                    | Add and edit comment actions     | Plugin [Comments](@/api/comments.md) turned on                     |
| [`commentsRemove`](@/api/contextMenu.md)                     | Remove comment action            | Plugin [Comments](@/api/comments.md) turned on                     |
| [`commentsReadOnly`](@/api/contextMenu.md)                   | Make comment read only action    | Plugin [Comments](@/api/comments.md) turned on                     |
| [`mergeCells`](@/api/contextMenu.md)                         | Merge and unmerge cells actions  | Plugin [MergeCells](@/api/mergeCells.md) turned on                 |
| [`add_child`](@/api/contextMenu.md)                          | Insert child row action          | Plugin [NestedRows](@/api/nestedRows.md) turned on                 |
| [`detach_from_parent`](@/api/contextMenu.md)                 | Detach from parent row action    | Plugin [NestedRows](@/api/nestedRows.md) turned on                 |
| [`hidden_columns_hide`](@/api/contextMenu.md)                | Hide column(s) action            | Plugin [HiddenColumns](@/api/hiddenColumns.md) turned on           |
| [`hidden_columns_show`](@/api/contextMenu.md)                | Show hidden column(s) action     | Plugin [HiddenColumns](@/api/hiddenColumns.md) turned on           |
| [`hidden_rows_hide`](@/api/contextMenu.md)                   | Hide row(s) action               | Plugin [HiddenRows](@/api/hiddenRows.md) turned on                 |
| [`hidden_rows_show`](@/api/contextMenu.md)                   | Show hidden row(s) action        | Plugin [HiddenRows](@/api/hiddenRows.md) turned on                 |
| [`filter_by_condition`](@/api/contextMenu.md)                | First conditions select element  | Plugin [Filters](@/api/filters.md) turned on                       |
| [`filter_operators`](@/api/contextMenu.md)                   | Operation select element         | Plugin [Filters](@/api/filters.md) turned on                       |
| [`filter_by_condition2`](@/api/contextMenu.md)               | Second conditions select element | Plugin [Filters](@/api/filters.md) turned on                       |
| [`filter_by_value`](@/api/contextMenu.md)                    | Value select element             | Plugin [Filters](@/api/filters.md) turned on                       |
| [`filter_action_bar`](@/api/contextMenu.md)                  | Action bar element               | Plugin [Filters](@/api/filters.md) turned on                       |

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16]
  ],
  rowHeaders: true,
  colHeaders: true,
  contextMenu: ['row_above', 'row_below', 'remove_row'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Context menu with fully custom configuration

This example shows how to:

* add common callback for all options
* dynamically disable option
* set custom text for predefined option
* add own custom option
* add callback for specific option

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16]
  ],
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  contextMenu: {
    callback(key, selection, clickEvent) {
      // Common callback for all options
      console.log(key, selection, clickEvent);
    },
    items: {
      row_above: {
        disabled() { // `disabled` can be a boolean or a function
          // Disable option when first row was clicked
          return this.getSelectedLast()[0] === 0; // `this` === hot
        }
      },
      // A separator line can also be added like this:
      // 'sp1': { name: '---------' }
      // and the key has to be unique
      sp1: '---------',
      row_below: {
        name: 'Click to add row below' // Set custom text for predefined option
      },
      about: { // Own custom option
        name() { // `name` can be a string or a function
          return '<b>Custom option</b>'; // Name can contain HTML
        },
        hidden() { // `hidden` can be a boolean or a function
          // Hide the option when the first column was clicked
          return this.getSelectedLast()[1] == 0; // `this` === hot
        },
        callback(key, selection, clickEvent) { // Callback for specific option
          setTimeout(() => {
            alert('Hello world!'); // Fire alert after menu close (with timeout)
          }, 0);
        }
      },
      colors: { // Own custom option
        name: 'Colors...',
        submenu: {
          // Custom option with submenu of items
          items: [
            {
              // Key must be in the form 'parent_key:child_key'
              key: 'colors:red',
              name: 'Red',
              callback(key, selection, clickEvent) {
                setTimeout(() => {
                  alert('You clicked red!');
                }, 0);
              }
            },
            { key: 'colors:green', name: 'Green' },
            { key: 'colors:blue', name: 'Blue' }
          ]
        }
      },
      credits: { // Own custom property
        // Custom rendered element in the context menu
        renderer(hot, wrapper, row, col, prop, itemValue) {
          const elem = document.createElement('marquee');

          elem.style.cssText = 'background: lightgray;';
          elem.textContent = 'Brought to you by...';

          return elem;
        },
        disableSelection: true, // Prevent mouseoever from highlighting the item for selection
        isCommand: false // Prevent clicks from executing command and closing the menu
      }
    }
  }
});
```
:::

## Related keyboard shortcuts

| Windows                  | macOS                    | Action                                                        |  Excel  | Sheets  |
| ------------------------ | ------------------------ | ------------------------------------------------------------- | :-----: | :-----: |
| Arrow keys               | Arrow keys               | Move one available menu item up, down, left, or right         | &check; | &check; |
| <kbd>**Page Up**</kbd>   | <kbd>**Page Up**</kbd>   | Move to the first visible item of the context menu or submenu | &check; | &cross; |
| <kbd>**Page Down**</kbd> | <kbd>**Page Down**</kbd> | Move to the last visible item of the context menu or submenu  | &check; | &cross; |
| <kbd>**Escape**</kbd>    | <kbd>**Escape**</kbd>    | Close the context menu or submenu                             | &check; | &check; |
| <kbd>**Enter**</kbd>     | <kbd>**Enter**</kbd>     | Run the action of the selected menu item                      | &check; | &cross; |

## Related articles

### Related guides

- [Adding comments via the context menu](@/guides/cell-features/comments.md#adding-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Custom context menu in React](@/guides/integrate-with-react/react-custom-context-menu-example.md)
- [Custom context menu in Angular](@/guides/integrate-with-angular/angular-custom-context-menu-example.md)
- [Custom context menu in Vue 2](@/guides/integrate-with-vue/vue-custom-context-menu-example.md)
- [Custom context menu in Vue 3](@/guides/integrate-with-vue3/vue3-custom-context-menu-example.md)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)

### Related blog articles

- [Customize Handsontable context menu](https://handsontable.com/blog/customize-handsontable-context-menu)

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