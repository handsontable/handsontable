---
title: Configuration options
metaTitle: Configuration options - Guide - Handsontable documentation
permalink: /next/setting-options
canonicalUrl: /setting-options
tags:
  - properties
  - config
---

# Configuration options

[[toc]]

Customize Handsontable with configuration options.

## About configuration options

You can heavily customize Handsontable's look and behavior with numerous [configuration options](@/api/options.md).

To apply configuration options, pass them as a second argument of the [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid), using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):

```js
const container = document.getElementById('example');

const hot = new Handsontable(container, {
  // configuration options, in the object literal notation
  licenseKey: "non-commercial-and-evaluation",
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  width: 400,
  height: 300,
  colHeaders: true,
  rowHeaders: true,
  customBorders: true,
  dropdownMenu: true,
  multiColumnSorting: true,
  filters: true,
  manualRowMove: true,
});
```

Depending on your needs, you can apply [configuration options](@/api/options.md) to different elements of your grid, such as:
- [The entire grid](#setting-grid-options)
- [Individual columns](#setting-column-options)
- [Individual rows](#setting-row-options)
- [Individual cells](#setting-cell-options)
- [Individual grid elements, based on any logic you implement](#implementing-custom-logic)

For the full list of available configuration options, see the [configuration options' API reference](@/api/options.md).

### Cascading configuration

Handsontable's configuration cascades down:
- From the top-level [grid options](#setting-grid-options) ([`GlobalMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/globalMeta.js))
- Through the mid-level [column options](#setting-column-options) ([`ColumnMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/columnMeta.js))
- To the bottom-level [cell options](#setting-cell-options) ([`CellMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/cellMeta.js))

When you modify the mid-level [column options](#setting-column-options) (using the [`columns`](@/api/options.md#columns) option):
- The options that you change overwrite the top-level [grid options](#setting-grid-options).
- The options that you change cascade down to the bottom-level [cell options](#setting-cell-options).
- Any unchanged options are inherited from the top-level [grid options](#setting-grid-options).

When you modify the bottom-level [cell options](#setting-cell-options) (using the [`cell`](@/api/options.md#cell) option):
- The options that you change overwrite the top-level [grid options](#setting-grid-options).
- The options that you change overwrite the mid-level [column options](#setting-column-options).
- Any unchanged options are inherited from the mid-level [column options](#setting-column-options) or the top-level [grid options](#setting-grid-options).

When you modify any options with the [`cells`](@/api/options.md#cells) function, the changes overwrite all other options.
::: tip
The [`cells`](@/api/options.md#cells) option is a function invoked before Handsontable's [rendering cycle](@/guides/advanced-topics/batch-operations.md). Implemented incorrectly, it can slow Handsontable down. Use the [`cells`](@/api/options.md#cells) option only if the [`cell`](@/api/options.md#cell) option, the [`columns`](@/api/options.md#columns) option, and the [`setCellMeta()`](#changing-cell-options) method don't meet your needs.
:::

For more details on Handsontable's cascading configuration, see the [MetaManager class](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/index.js).

### Plugin options

Configuration options can come from:
* Handsontable's [Core](@/api/core.md)
* Handsontable's [plugins](@/api/plugins.md)
* Handsontable's [hooks](@/api/hooks.md)

If you use Handsontable through [modules](@/guides/building-and-testing/modules.md): to use an option that comes from a Handsontable plugin, you need to [import and register](@/guides/building-and-testing/modules.md#importing-plugins) that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.

To find out if an option comes from a plugin, check the `Category` label in the [configuration options' API reference](@/api/options.md).

## Setting grid options

To apply configuration options to the entire grid:

- Pass your options as a second argument of the [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid), using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer).

For example, to set the entire grid's [width](@/api/options.md#width) and [height](@/api/options.md#height):
```js
const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  width: 400,
  height: 300
});
```

::: tip
If you use Handsontable through [modules](@/guides/building-and-testing/modules.md): to use an option that comes from a Handsontable plugin, [import and register](@/guides/building-and-testing/modules.md#importing-plugins) that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.
:::

#### Example

To configure each cell in the grid as read-only, apply the [`readOnly`](@/api/options.md#readonly) option as a top-level grid option.

The top-level grid options cascade down:
- To the mid-level [column options](#setting-column-options)
- To the bottom-level [cell options](#setting-cell-options)

As a result, each cell in the grid is read-only:

::: example #example1 --html 1 --js 2
```html
<div id="example1" class="hot"></div>
```
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  // configuration options, in the object literal notation
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  // the `readOnly` option, applies to each cell of the entire grid
  readOnly: true,
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true
});

// check a cell's options
// returns `true`
hot.getCellMeta(0, 0).readOnly;
```
:::

## Setting column options

To apply configuration options to an individual column (or a range of columns), use the [`columns`](@/api/options.md#columns) option.

1. Within [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid)'s second argument, add an option called [`columns`](@/api/options.md#columns).
    ```js
    const hot = new Handsontable(container, {
      // top-level grid options that apply to the entire grid
      width: 400,
      height: 300,
      // the `columns` option
      columns: []
    });
    ```
2. Set the [`columns`](@/api/options.md#columns) option to an array of objects.<br>
   Each object represents one column.<br>
   The objects' order represents the columns' order (i.e. the columns' physical indexes).
    ```js
    const hot = new Handsontable(container, {
      columns: [
        {}, // column options for the first column
        {}, // column options for the second column
        {}, // column options for the third column
      ],
    });
    ```
3. In the object that represents your required column, add your column options.<br>
   For example, to make each cell of the third column read-only:
    ```js
    const hot = new Handsontable(container, {
      columns: [
        {},
        {},
        // column options, apply to each cell of the third column
        {
          readOnly: true,
        },
      ],
    });
    ```

::: tip
If you use Handsontable through [modules](@/guides/building-and-testing/modules.md): to use an option that comes from a Handsontable plugin, [import and register](@/guides/building-and-testing/modules.md#importing-plugins) that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.
:::

#### Example

In the example below, the [`columns`](@/api/options.md#columns) option is set to a function.

The function applies the `readOnly: true` option to each column that has a physical index of either `2` or `8`.

The modified mid-level column options:
- Overwrite the top-level [grid options](#setting-grid-options)
- Cascade down to the bottom-level [cell options](#setting-cell-options)

As a result, each cell in the third and ninth columns is read-only:

::: example #example2 --html 1 --js 2
```html
<div id="example2" class="hot"></div>
```
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  // top-level grid options
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // in the top-level grid options, all cells are editable
  readOnly: false,
  columns(index) {
    return {
      type: index > 0 ? 'numeric' : 'text',
      readOnly: index === 2 || index === 8
    }
  }
});

// check a cell's options
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// returns `true`
hot.getCellMeta(0, 2).readOnly;
```
:::

## Setting row options

To apply configuration options to an individual row (or a range of rows), use the [`cells`](@/api/options.md#cells) option.

Any options modified through [`cells`](@/api/options.md#cells) overwrite all other options.

::: tip
The [`cells`](@/api/options.md#cells) option is a function invoked before Handsontable's [rendering cycle](@/guides/advanced-topics/batch-operations.md). Implemented incorrectly, it can slow Handsontable down. Use the [`cells`](@/api/options.md#cells) option only if the [`cell`](@/api/options.md#cell) option, the [`columns`](@/api/options.md#columns) option, and the [`setCellMeta()`](#changing-cell-options) method don't meet your needs.
:::

1. Within [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid)'s second argument, add an option called [`cells`](@/api/options.md#cells), and set it to a function.
    ```js
    const hot = new Handsontable(container, {
      // top-level grid options that apply to the entire grid
      width: 400,
      height: 300,
      // the `cells` option
      cells() {
        
      };
    });
    ```
2. The function can take three arguments:<br>
   - `row`: a row coordinate (a **physical** index)
   - `col`: a column coordinate (a **physical** index)
   - `prop`: if your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects), `prop` is a property name for a column's data source object.<br>
   If your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.
    ```js
    const hot = new Handsontable(container, {
      // the `cells` option set to a function
      cells(row, col, prop) {
        // the `cells` function's body
      }
    });
    ```
3. In the [`cells`](@/api/options.md#cells) function's body, implement a logic that selects your required row(s).<br>
   For example, to make each cell of the first row and each cell of the fourth row read-only:
    ```js
    const hot = new Handsontable(container, {
      // the `cells` options overwrite all other options
      cells(row, col, prop) {
        if (row === 1 || row === 4) {
          return {
            // row options, apply to each cell of the first row
            // and to each cell of the fourth row
            readOnly: true,
          };
        }
      }
    });
    ```

::: tip
If you use Handsontable through [modules](@/guides/building-and-testing/modules.md): to use an option that comes from a Handsontable plugin, [import and register](@/guides/building-and-testing/modules.md#importing-plugins) that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.
:::

#### Example

In the example below, the [`cells`](@/api/options.md#cells) option sets each cell in the first and fourth row as [`readOnly`](@/api/options.md#readonly).

Options modified through [`cells`](@/api/options.md#cells) overwrite all other options.

::: example #example3 --html 1 --js 2
```html
<div id="example3" class="hot"></div>
```
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // the `cells` options overwrite all other options
  // apply only to each cell of rows 1 and 4, as specified in the function's body
  cells(row) {
    if (row === 1 || row === 4) {
      return {
        readOnly: true,
      };
    }
  },
});

// check a cell's options
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// returns `true`
hot.getCellMeta(0, 1).readOnly;
```
:::

## Setting cell options

To apply configuration options to individual cells, use the [`cell`](@/api/options.md#cell) option.

1. Within [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid)'s second argument, add an option called [`cell`](@/api/options.md#cell).
    ```js
    const hot = new Handsontable(container, {
      // top-level grid options that apply to the entire grid
      width: 400,
      height: 300,
      // the `cell` option
      cell: []
    });
    ```
2. Set the [`cell`](@/api/options.md#cell) option to an array of objects.<br>
    ```js
    const hot = new Handsontable(container, {
      // the `cell` option set to an array of objects
      cell: [
        {},
        {}
      ],
    });
    ```
3. In each object, set your configuration options for one particular cell.<br>
   To select a cell, use the `row` and `col` coordinates.<br>
   For example, to make cells `A1` (`0, 0`) and `B2` (`1, 1`) read-only:
    ```js
    const hot = new Handsontable(container, {
      cell: [
        {
          // cell options, apply only to a cell with coordinates (0, 0)
          row: 0,
          col: 0,
          readOnly: true,
        },
        {
          // cell options, apply only to a cell with coordinates (1, 1)
          row: 1,
          col: 1,
          readOnly: true,
        }
      ],
    });
    ```

::: tip
If you use Handsontable through [modules](@/guides/building-and-testing/modules.md): to use an option that comes from a Handsontable plugin, [import and register](@/guides/building-and-testing/modules.md#importing-plugins) that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.
:::

#### Example

In the example below, the [`cell`](@/api/options.md#cell) option sets cell `A1`(`0, 0`) and cell `B2`(`1, 1`) as [`readOnly`](@/api/options.md#readonly).

The modified [`cell`](@/api/options.md#cell) options:
- Overwrite the top-level [grid options](#setting-grid-options)
- Overwrite mid-level [column options](#setting-column-options)

::: example #example4 --html 1 --js 2
```html
<div id="example4" class="hot"></div>
```
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  licenseKey: 'non-commercial-and-evaluation',
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  readOnly: false,
  cell: [
    {
      // bottom-level cell options overwrite the top-level grid options
      // apply only to a cell with coordinates (0, 0)
      row: 0,
      col: 0,
      readOnly: true,
    },
    {
      // bottom-level cell options overwrite the top-level grid options
      // apply only to a cell with coordinates (1, 1)
      row: 1,
      col: 1,
      readOnly: true,
    }
  ]
});

// check a cell's options
// returns `true`
hot.getCellMeta(0, 0).readOnly;

// returns `false`
hot.getCellMeta(0, 1).readOnly;
```
:::

### Checking cell options

When Handsontable is running, you can check a cell's current options, using the [`getCellMeta()`](@/api/core.md#getcellmeta) method.

The [`getCellMeta()`](@/api/core.md#getcellmeta) method returns an object with:
- All built-in options (stored in the [`CellMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/cellMeta.js) [prototype](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes))
- Any options you add

For example:

```js
const container = document.querySelector('example');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  licenseKey: 'non-commercial-and-evaluation',
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // in the top-level grid options, all cells are read-only
  readOnly: false,
  cell: [
    {
      // bottom-level cell options overwrite the top-level grid options
      // apply only to a cell with coordinates (1, 1)
      row: 1,
      col: 1,
      readOnly: true,
    }
  ]
});

// for cell (0, 0), the `readOnly` option is the default (`false`)
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// for cell (1, 1), the `cell` option overwrote the default `readOnly` value
// returns `true`
hot.getCellMeta(1, 1).readOnly;
```

### Changing cell options

When Handsontable is running, you can change the initial cell options, using the [`setCellMeta()`](@/api/core.md#setcellmeta) method.

For example:

```js
const container = document.querySelector('example');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  licenseKey: 'non-commercial-and-evaluation',
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // in the top-level grid options, all cells are read-only
  readOnly: false,
  cell: [
    {
      // bottom-level cell options overwrite the top-level grid options
      // apply only to a cell with coordinates (1, 1)
      row: 1,
      col: 1,
      readOnly: true,
    }
  ]
});

// for cell (0, 0), the `readOnly` option is the default (`false`)
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// for cell (1, 1), the `cell` option overwrote the default `readOnly` value
// returns `true`
hot.getCellMeta(1, 1).readOnly;

// change the `readOnly` option of cell (1, 1) back to `false`
hot.setCellMeta(1, 1, 'readOnly', false);

// returns `false`
hot.getCellMeta(1, 1).readOnly;
```

## Implementing custom logic

You can apply configuration options to individual grid elements (columns, rows, cells), based on any logic you implement, using the [`cells`](@/api/options.md#cells) option.

The [`cells`](@/api/options.md#cells) option overwrites all other options.

::: tip
The [`cells`](@/api/options.md#cells) option is a function invoked before Handsontable's [rendering cycle](@/guides/advanced-topics/batch-operations.md). Implemented incorrectly, it can slow Handsontable down. Use the [`cells`](@/api/options.md#cells) option only if the [`cell`](@/api/options.md#cell) option, the [`columns`](@/api/options.md#columns) option, and the [`setCellMeta()`](#changing-cell-options) method don't meet your needs.
:::

1. Within [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid)'s second argument, add an option called [`cells`](@/api/cells.md#cells), and set it to a function.
    ```js
    const hot = new Handsontable(container, {
      // top-level grid options that apply to the entire grid
      width: 400,
      height: 300,
      // the `cells` option
      cells() {
        
      };
    });
    ```
2. The function can take three arguments:<br>
   - `row`: a row coordinate (a **physical** index)
   - `col`: a column coordinate (a **physical** index)
   - `prop`: if your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data.md#array-of-objects), `prop` is a property name for a column's data source object.<br>
   If your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.
    ```js
    const hot = new Handsontable(container, {
      // the `cells` option set to a function
      cells(row, col, prop) {
        // the `cells` function's body
      }
    });
    ```
3. In the [`cells`](@/api/options.md#cells) function's body, implement a logic that selects your required columns, rows, or cells (as combinations of `row` and `col` coordinates).<br>
   For example:
    ```js
    const hot = new Handsontable(container, {
      cells(row, col) {
        if ((row === 1 || row === 5) && col === 1) {
          return {
            readOnly: true,
          };
        }
      }
    });
    ```

#### Example

In the example below, the modified [`cells`](@/api/options.md#cells) options overwrite the top-level grid options.

::: example #example5 --html 1 --js 2
```html
<div id="example5" class="hot"></div>
```
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // the `cells` option overwrites the top-level grid options
  // apply only to cells selected by your custom logic
  cells(row, col) {
    if ((row === 1 || row === 3) && col === 1) {
      return {
        readOnly: true,
      };
    }
  }
});
```
:::

## Configuration example

In the example below, some cells are read-only, and some cells are editable:
- By default, all cells are read-only (as set in the top-level [grid options](#setting-grid-options)).
- For the first column, the mid-level [column options](#setting-column-options) overwrite the top-level [grid options](#setting-grid-options).<br>
  As a result, the first column cells are editable.
- For cell `A1` (`0, 0`), the bottom-level [cell options](#setting-cell-options) overwrite both the mid-level [column options](#setting-column-options), and the top-level [grid options.](#setting-grid-options)<br>
  As a result, cell `A1` (`0, 0`) is read-only, despite being part of the editable first column.
- For cell `C3` (`3, 3`), the [`cells` option](#implementing-custom-logic) overwrites all other options.<br>
  As a result, cell `C3` (`3, 3`) is editable, despite not being part of the editable first column.

::: example #example6 --html 1 --js 2
```html
<div id="example6" class="hot"></div>
```
```js
const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  // in the top-level grid options, all cells are read-only
  readOnly: true,
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // mid-level column options overwrite the top-level grid options
  columns: [
    // each cell in the first column is editable
    {
      readOnly: false,
      className: '',
    },
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  ],
  // bottom-level cell options overwrite the mid-level column options
  // and ovewrite the top-level grid-options
  cell: [
    {
      // cell (0, 0) is read-only
      row: 0,
      col: 0,
      readOnly: true,
    },
  ],
  // the `cells` option's logic overwrites all other options
  cells(row, col) {
    // cell (2, 2) is editable
    if (row === 2 && col === 2) {
      return {
        readOnly: false,
        className: '',
      }
    }
  },
});
```
:::
