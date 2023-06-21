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

::: example #example1

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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

:::

::: only-for react

::: example #example1 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
        ['2017', 10, 11, 12, 13, 15, 16],
        ['2018', 10, 11, 12, 13, 15, 16],
        ['2019', 10, 11, 12, 13, 15, 16],
        ['2020', 10, 11, 12, 13, 15, 16],
        ['2021', 10, 11, 12, 13, 15, 16]
      ]}
      rowHeaders={true}
      colHeaders={true}
      contextMenu={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```

:::

:::


## Context menu with specific options

You can define items in the menu by passing the [`contextMenu`](@/api/options.md#contextmenu) option as an array of keys which are strings:

| Key                                                      | Action, required plugins                                                                                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`row_above`](@/api/contextMenu.md)                      | Insert a row above                                                                                                                                          |
| [`row_below`](@/api/contextMenu.md)                      | Insert a row below                                                                                                                                          |
| [`col_left`](@/api/contextMenu.md)                       | Insert a column to the left                                                                                                                                 |
| [`col_right`](@/api/contextMenu.md)                      | Insert a column to the right                                                                                                                                |
| [`---------`](@/api/contextMenu.md)                      | The menu items separator                                                                                                                                    |
| [`remove_row`](@/api/contextMenu.md)                     | Remove the selected row                                                                                                                                     |
| [`clear_column`](@/api/contextMenu.md)                   | Delete the data of the selected columns                                                                                                                     |
| [`undo`](@/api/contextMenu.md)                           | Undo the last action ([`UndoRedo`](@/api/undoRedo.md))                                                                                                      |
| [`redo`](@/api/contextMenu.md)                           | Redo the last action ([`UndoRedo`](@/api/undoRedo.md))                                                                                                      |
| [`make_read_only`](@/api/contextMenu.md)                 | Make the selected cells read-only                                                                                                                           |
| [`alignment`](@/api/contextMenu.md)                      | Align text                                                                                                                                                  |
| [`cut`](@/api/contextMenu.md)                            | Cut the contents of the selected cells to the system clipboard ([`CopyPaste`](@/api/copyPaste.md))                                                          |
| [`copy`](@/api/contextMenu.md)                           | Copy the contents of the selected cells to the system clipboard ([`CopyPaste`](@/api/copyPaste.md))                                                         |
| [`copy_with_column_headers`](@/api/contextMenu.md)       | Copy the contents of the selected cells and their nearest column headers ([`CopyPaste`](@/api/copyPaste.md))                                                |
| [`copy_with_column_group_headers`](@/api/contextMenu.md) | Copy the contents of the selected cells and all their related column headers ([`CopyPaste`](@/api/copyPaste.md), [`NestedHeaders`](@/api/nestedHeaders.md)) |
| [`copy_column_headers_only`](@/api/contextMenu.md)       | Copy the contents of column headers that are nearest to the selected cells ([`CopyPaste`](@/api/copyPaste.md))                                              |
| [`freeze_column`](@/api/contextMenu.md)                  | Freeze the selected column ([`ManualColumnFreeze`](@/api/manualColumnFreeze.md))                                                                            |
| [`unfreeze_column`](@/api/contextMenu.md)                | Unfreeze the selected column ([`ManualColumnFreeze`](@/api/manualColumnFreeze.md))                                                                          |
| [`borders`](@/api/contextMenu.md)                        | Add borders around the selected cells ([`CustomBorders`](@/api/customBorders.md))                                                                           |
| [`commentsAddEdit`](@/api/contextMenu.md)                | Add or edit a comment ([`Comments`](@/api/comments.md))                                                                                                     |
| [`commentsRemove`](@/api/contextMenu.md)                 | Remove the comment ([`Comments`](@/api/comments.md))                                                                                                        |
| [`commentsReadOnly`](@/api/contextMenu.md)               | Make the comment read-only ([`Comments`](@/api/comments.md))                                                                                                |
| [`mergeCells`](@/api/contextMenu.md)                     | Merge or unmerge the selected cells ([`MergeCells`](@/api/mergeCells.md))                                                                                   |
| [`add_child`](@/api/contextMenu.md)                      | Insert a child row ([`NestedRows`](@/api/nestedRows.md))                                                                                                    |
| [`detach_from_parent`](@/api/contextMenu.md)             | Detach the selected row from its parent row ([`NestedRows`](@/api/nestedRows.md))                                                                           |
| [`hidden_columns_hide`](@/api/contextMenu.md)            | Hide the selected columns ([`HiddenColumns`](@/api/hiddenColumns.md))                                                                                       |
| [`hidden_columns_show`](@/api/contextMenu.md)            | Show hidden columns ([`HiddenColumns`](@/api/hiddenColumns.md))                                                                                             |
| [`hidden_rows_hide`](@/api/contextMenu.md)               | Hide the selected rows ([`HiddenRows`](@/api/hiddenRows.md))                                                                                                |
| [`hidden_rows_show`](@/api/contextMenu.md)               | Show hidden rows ([`HiddenRows`](@/api/hiddenRows.md))                                                                                                      |
| [`filter_by_condition`](@/api/contextMenu.md)            | Add a first filter condition ([`Filters`](@/api/filters.md))                                                                                                |
| [`filter_by_condition2`](@/api/contextMenu.md)           | Add a second filter condition ([`Filters`](@/api/filters.md))                                                                                               |
| [`filter_operators`](@/api/contextMenu.md)               | Select a filter parameter ([`Filters`](@/api/filters.md))                                                                                                   |
| [`filter_by_value`](@/api/contextMenu.md)                | Add a filter value ([`Filters`](@/api/filters.md))                                                                                                          |
| [`filter_action_bar`](@/api/contextMenu.md)              | Apply the configured filter ([`Filters`](@/api/filters.md))                                                                                                 |

To see the context menu, right-click on a cell:

::: only-for javascript

::: example #example2

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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
  contextMenu: ['row_above', 'row_below', 'remove_row', 'clear_column'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```

:::

:::

::: only-for react

::: example #example2 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
        ['2017', 10, 11, 12, 13, 15, 16],
        ['2018', 10, 11, 12, 13, 15, 16],
        ['2019', 10, 11, 12, 13, 15, 16],
        ['2020', 10, 11, 12, 13, 15, 16],
        ['2021', 10, 11, 12, 13, 15, 16]
      ]}
      rowHeaders={true}
      colHeaders={true}
      contextMenu={['row_above', 'row_below', 'remove_row', 'clear_column']}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```

:::

:::

::: only-for react

## Context menu with custom options

In addition to built-in options, you can equip your context menu with custom options.

To see the context menu, right-click on a cell:

::: example #example4 :react

```jsx
import { HotTable } from '@handsontable/react';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <div>
      <HotTable
        id="hot"
        data={[
          ['A1', 'B1', 'C1', 'D1', 'E1'],
          ['A2', 'B2', 'C2', 'D2', 'E2'],
          ['A3', 'B3', 'C3', 'D3', 'E3'],
          ['A4', 'B4', 'C4', 'D4', 'E4'],
          ['A5', 'B5', 'C5', 'D5', 'E5'],
        ]}
        colHeaders={true}
        height="auto"
        contextMenu={{
          items: {
            'row_above': {
              name: 'Insert row above this one (custom name)'
            },
            'row_below': {},
            'separator': ContextMenu.SEPARATOR,
            'clear_custom': {
              name: 'Clear all cells (custom)',
              callback: function() {
                this.clear();
              }
            }
          }
        }}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  )
}

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```

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

::: example #example3

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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

:::

::: only-for react

::: example #example3 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
        ['2017', 10, 11, 12, 13, 15, 16],
        ['2018', 10, 11, 12, 13, 15, 16],
        ['2019', 10, 11, 12, 13, 15, 16],
        ['2020', 10, 11, 12, 13, 15, 16],
        ['2021', 10, 11, 12, 13, 15, 16]
      ]}
      rowHeaders={true}
      colHeaders={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      contextMenu={{
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
              items: [{
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
      }}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```

:::

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

- [Adding comments via the context menu](@/guides/cell-features/comments.md#add-comments-via-the-context-menu)
- [Clipboard: Context menu](@/guides/cell-features/clipboard.md#context-menu)
- [Icon pack](@/guides/accessories-and-menus/icon-pack.md)
::: only-for javascript
- [Custom context menu in React](@/react/guides/accessories-and-menus/context-menu.md)
- [Custom context menu in Angular](@/guides/integrate-with-angular/angular-custom-context-menu-example.md)
- [Custom context menu in Vue 2](@/guides/integrate-with-vue/vue-custom-context-menu-example.md)
- [Custom context menu in Vue 3](@/guides/integrate-with-vue3/vue3-custom-context-menu-example.md)

:::

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
