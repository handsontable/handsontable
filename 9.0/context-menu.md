---
title: Context menu
permalink: /9.0/context-menu
canonicalUrl: /context-menu
---

# {{ $frontmatter.title }}

[[toc]]

## Context menu with default options

To run the basic configuration of the Context Menu, just set the contextMenu option to `true`.

From version `0.11`, context menu also works for row and column headers. When the context menu for the row header is opened, the column options are disabled. Likewise, when the context menu for the column header is opened, the row options are disabled

::: example #example1
```js
var example1 = document.getElementById('example1');
var settings1 = {
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
  contextMenu: true
};

var hot1 = new Handsontable(example1, settings1);
```
:::

## Context menu with specific options

You can limit options available in the context menu using contextMenu option as an array of keys which are strings:

| Key | Purpose | Extra conditions |
|----|----|----|
| `row_above` | Insert row above action | |
| `row_below` | Insert row above action | |
| `col_left` | Insert column left action | |
| `col_right` | Insert column right action | |
| `---------` | Separator | |
| `remove_row` | Insert column right action | |
| `clear_column` | Clear column values action | |
| `undo` | Undo action | Plugin [UndoRedo](api/plugins/undoRedo/undoRedo.md) turned on |
| `redo` | Redo action | Plugin [UndoRedo](api/plugins/undoRedo/undoRedo.md) turned on |
| `make_read_only` | Make read only action | |
| `alignment` | Alignment actions | |
| `cut` | Cut action | Plugin [CopyPaste](api/plugins/copyPaste/copyPaste.md) turned on |
| `copy` | Copy action | Plugin [CopyPaste](api/plugins/copyPaste/copyPaste.md) turned on |
| `freeze_column` | Freeze column action | Plugin [ManualColumnFreeze](api/plugins/manualColumnFreeze/manualColumnFreeze.md) turned on |
| `unfreeze_column` | Unfreeze column action | Plugin [ManualColumnFreeze](api/plugins/manualColumnFreeze/manualColumnFreeze.md) turned on |
| `borders` | Custom borders actions | Plugin [CustomBorders](api/plugins/customBorders/customBorders.md) turned on |
| `commentsAddEdit` | Add and edit comment actions | Plugin [Comments](api/plugins/comments/comments.md) turned on |
| `commentsRemove` | Remove comment action | Plugin [Comments](api/plugins/comments/comments.md) turned on |
| `commentsReadOnly` | Make comment read only action | Plugin [Comments](api/plugins/comments/comments.md) turned on |
| `mergeCells` | Merge and unmerge cells actions | Plugin [MergeCells](api/plugins/mergeCells/mergeCells.md) turned on |
| `add_child` | Insert child row action | Plugin [NestedRows](api/plugins/nestedRows/nestedRows.md) turned on |
| `detach_from_parent` | Detach from parent row action | Plugin [NestedRows](api/plugins/nestedRows/nestedRows.md) turned on |
| `hidden_columns_hide` | Hide column(s) action | Plugin [HiddenColumns](api/plugins/hiddenColumns/hiddenColumns.md) turned on |
| `hidden_columns_show` | Show hidden column(s) action | Plugin [HiddenColumns](api/plugins/hiddenColumns/hiddenColumns.md) turned on |
| `hidden_rows_hide` | Hide row(s) action | Plugin [HiddenRows](api/plugins/hiddenRows/hiddenRows.md) turned on |
| `hidden_rows_show` | Show hidden row(s) action | Plugin [HiddenRows](api/plugins/hiddenRows/hiddenRows.md) turned on |
| `filter_by_condition` | First conditions select element | Plugin [Filters](api/plugins/filters/filters.md) turned on |
| `filter_operators` | Operation select element | Plugin [Filters](api/plugins/filters/filters.md) turned on |
| `filter_by_condition2` | Second conditions select element | Plugin [Filters](api/plugins/filters/filters.md) turned on |
| `filter_by_value` | Value select element | Plugin [Filters](api/plugins/filters/filters.md) turned on |
| `filter_action_bar` | Action bar element | Plugin [Filters](api/plugins/filters/filters.md) turned on |

::: example #example2
```js
var example2 = document.getElementById('example2');
var settings2 = {
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
  contextMenu: ['row_above', 'row_below', 'remove_row']
};

var hot2 = new Handsontable(example2, settings2);
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
var example3 = document.getElementById('example3');
var settings3 = {
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
  contextMenu: {
    callback: function (key, selection, clickEvent) {
      // Common callback for all options
      console.log(key, selection, clickEvent);
    },
    items: {
      "row_above": {
        disabled: function () { // `disabled` can be a boolean or a function
          // Disable option when first row was clicked
          return this.getSelectedLast()[0] === 0; // `this` === hot3
        }
      },
      // A separator line can also be added like this:
      // "sp1": { name: '---------' }
      // and the key has to be unique
      "sp1": '---------',
      "row_below": {
        name: 'Click to add row below' // Set custom text for predefined option
      },
      "about": { // Own custom option
        name: function () { // `name` can be a string or a function
          return '<b>Custom option</b>'; // Name can contain HTML
        },
        hidden: function () { // `hidden` can be a boolean or a function
          // Hide the option when the first column was clicked
          return this.getSelectedLast()[1] == 0; // `this` === hot3
        },
        callback: function(key, selection, clickEvent) { // Callback for specific option
          setTimeout(function() {
            alert('Hello world!'); // Fire alert after menu close (with timeout)
          }, 0);
        }
      },
      "colors": { // Own custom option
        name: 'Colors...',
        submenu: {
          // Custom option with submenu of items
          items: [
            {
              // Key must be in the form "parent_key:child_key"
              key: 'colors:red',
              name: 'Red',
              callback: function(key, selection, clickEvent) {
                setTimeout(function() {
                  alert('You clicked red!');
                }, 0);
              }
            },
            { key: 'colors:green', name: 'Green' },
            { key: 'colors:blue', name: 'Blue' }
          ]
        }
      },
      "credits": { // Own custom property
        // Custom rendered element in the context menu
        renderer: function(hot, wrapper, row, col, prop, itemValue) {
          var elem = document.createElement('marquee');
          elem.style.cssText = 'background: lightgray;';
          elem.textContent = 'Brought to you by...';
          return elem;
        },
        disableSelection: true, // Prevent mouseoever from highlighting the item for selection
        isCommand: false // Prevent clicks from executing command and closing the menu
      }
    }
  }
};

var hot3 = new Handsontable(example3, settings3);
```
:::
