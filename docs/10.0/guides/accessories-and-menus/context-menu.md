---
title: Context menu
metaTitle: Context menu - Guide - Handsontable Documentation
permalink: /10.0/context-menu
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

To run the basic configuration of the Context Menu, just set the `contextMenu` option to `true`.

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

You can define items in the menu by passing the `contextMenu` option as an array of keys which are strings:

| Key | Purpose | Extra conditions |
|----|----|----|
| `row_above` | Insert row above action | |
| `row_below` | Insert row above action | |
| `col_left` | Insert column left action | |
| `col_right` | Insert column right action | |
| `---------` | Separator | |
| `remove_row` | Insert column right action | |
| `clear_column` | Clear column values action | |
| `undo` | Undo action | Plugin [UndoRedo](@/api/undoRedo.md) turned on |
| `redo` | Redo action | Plugin [UndoRedo](@/api/undoRedo.md) turned on |
| `make_read_only` | Make read only action | |
| `alignment` | Alignment actions | |
| `cut` | Cut action | Plugin [CopyPaste](@/api/copyPaste.md) turned on |
| `copy` | Copy action | Plugin [CopyPaste](@/api/copyPaste.md) turned on |
| `freeze_column` | Freeze column action | Plugin [ManualColumnFreeze](@/api/manualColumnFreeze.md) turned on |
| `unfreeze_column` | Unfreeze column action | Plugin [ManualColumnFreeze](@/api/manualColumnFreeze.md) turned on |
| `borders` | Custom borders actions | Plugin [CustomBorders](@/api/customBorders.md) turned on |
| `commentsAddEdit` | Add and edit comment actions | Plugin [Comments](@/api/comments.md) turned on |
| `commentsRemove` | Remove comment action | Plugin [Comments](@/api/comments.md) turned on |
| `commentsReadOnly` | Make comment read only action | Plugin [Comments](@/api/comments.md) turned on |
| `mergeCells` | Merge and unmerge cells actions | Plugin [MergeCells](@/api/mergeCells.md) turned on |
| `add_child` | Insert child row action | Plugin [NestedRows](@/api/nestedRows.md) turned on |
| `detach_from_parent` | Detach from parent row action | Plugin [NestedRows](@/api/nestedRows.md) turned on |
| `hidden_columns_hide` | Hide column(s) action | Plugin [HiddenColumns](@/api/hiddenColumns.md) turned on |
| `hidden_columns_show` | Show hidden column(s) action | Plugin [HiddenColumns](@/api/hiddenColumns.md) turned on |
| `hidden_rows_hide` | Hide row(s) action | Plugin [HiddenRows](@/api/hiddenRows.md) turned on |
| `hidden_rows_show` | Show hidden row(s) action | Plugin [HiddenRows](@/api/hiddenRows.md) turned on |
| `filter_by_condition` | First conditions select element | Plugin [Filters](@/api/filters.md) turned on |
| `filter_operators` | Operation select element | Plugin [Filters](@/api/filters.md) turned on |
| `filter_by_condition2` | Second conditions select element | Plugin [Filters](@/api/filters.md) turned on |
| `filter_by_value` | Value select element | Plugin [Filters](@/api/filters.md) turned on |
| `filter_action_bar` | Action bar element | Plugin [Filters](@/api/filters.md) turned on |

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
