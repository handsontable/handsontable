---
id: p7oq0ph7
title: Configuration options
metaTitle: Configuration options - JavaScript Data Grid | Handsontable
description: Configure the data grid down to each column, row, and cell, using various built-in options that control Handsontable's behavior and user interface.
permalink: /configuration-options
canonicalUrl: /configuration-options
tags:
  - properties
  - config
  - options
react:
  id: gmpbmisy
  metaTitle: Configuration options - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Configuration options

Configure your grid down to each column, row, and cell, using various built-in options that control Handsontable's behavior and user interface.

[[toc]]

## Overview

::: only-for javascript

To apply configuration options, pass them as a second argument of the Handsontable constructor, using the object literal notation:

```js
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  // configuration options, in the object literal notation
  licenseKey: "non-commercial-and-evaluation",
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
  ],
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

:::

::: only-for react

To apply configuration options, pass them as individual props of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) or [`HotColumn`](@/guides/columns/react-hot-column/react-hot-column.md) components.

```jsx
<HotTable
  autoWrapRow={true}
  autoWrapCol={true}
  licenseKey="non-commercial-and-evaluation"
  data={[
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
  ]}
  width={400}
  height={300}
  colHeaders={true}
  rowHeaders={true}
  customBorders={true}
  dropdownMenu={true}
  multiColumnSorting={true}
  filters={true}
  manualRowMove={true}
/>
```

:::

Depending on your needs, you can apply configuration options to different elements of your grid, such as:
- [The entire grid](#set-grid-options)
- [Individual columns](#set-column-options)
- [Individual rows](#set-row-options)
- [Individual cells](#set-cell-options)
- [Individual grid elements, based on any logic you implement](#implement-custom-logic)

For the full list of available configuration options, see the [configuration options' API reference](@/api/options.md).

### Cascading configuration

Handsontable's configuration cascades down:
- From the top-level grid options ([`GlobalMeta`](https://github.com/handsontable/handsontable/blob/master/handsontable/src/dataMap/metaManager/metaLayers/globalMeta.js))
- Through the mid-level column options ([`ColumnMeta`](https://github.com/handsontable/handsontable/blob/master/handsontable/src/dataMap/metaManager/metaLayers/columnMeta.js))
- To the bottom-level cell options ([`CellMeta`](https://github.com/handsontable/handsontable/blob/master/handsontable/src/dataMap/metaManager/metaLayers/cellMeta.js))

When you modify the mid-level column options (using the [`columns`](@/api/options.md#columns) option):
- The options that you change overwrite the top-level grid options.
- The options that you change cascade down to the bottom-level cell options.
- Any unchanged options are inherited from the top-level grid options.

When you modify the bottom-level cell options (using the [`cell`](@/api/options.md#cell) option):
- The options that you change overwrite the top-level grid options.
- The options that you change overwrite the mid-level column options.
- Any unchanged options are inherited from the mid-level column options or the top-level grid options.

When you modify any options with the [`cells`](@/api/options.md#cells) function, the changes overwrite all other options.

::: tip

The [`cells`](@/api/options.md#cells) option is a function invoked before Handsontable's [rendering cycle](@/guides/optimization/batch-operations/batch-operations.md). Implemented incorrectly, it can slow Handsontable down. Use the [`cells`](@/api/options.md#cells) option only if the [`cell`](@/api/options.md#cell) option, the [`columns`](@/api/options.md#columns) option, and the [`setCellMeta()`](#change-cell-options) method don't meet your needs.

:::

For more details on Handsontable's cascading configuration, see the [MetaManager class](https://github.com/handsontable/handsontable/blob/master/handsontable/src/dataMap/metaManager/index.js).

### Plugin options

Configuration options can come from:
- Handsontable's [Core](@/api/core.md)
- Handsontable's [plugins](@/api/plugins.md)
- Handsontable's [hooks](@/api/hooks.md)

If you use Handsontable through [modules](@/guides/tools-and-building/modules/modules.md): to use an option that comes from a Handsontable plugin, you need to import and register that plugin when initializing your Handsontable instance.

To find out if an option comes from a plugin, check the `Category` label in the [configuration options' API reference](@/api/options.md).

## Set grid options



::: only-for javascript

To apply configuration options to the entire grid, pass your options as a second argument of the Handsontable constructor, using the object literal notation.

:::

::: only-for react

To apply configuration options to the entire grid, pass your options as individual props of the [`HotTable`](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component) or [`HotColumn`](@/guides/columns/react-hot-column/react-hot-column.md) components.

:::

For example, to set the entire grid's [width](@/api/options.md#width) and [height](@/api/options.md#height):

::: only-for javascript

```js
const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  width: 400,
  height: 300
});
```

:::

::: only-for react

```jsx
<HotTable width={400} height={300} />
```

:::

#### Example

To configure each cell in the grid as read-only, apply the [`readOnly`](@/api/options.md#readonly) option as a top-level grid option.

The top-level grid options cascade down:
- To the mid-level column options
- To the bottom-level cell options

As a result, each cell in the grid is read-only:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example1.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/react/example1.jsx)
@[code](@/content/guides/getting-started/configuration-options/react/example1.tsx)

:::

:::

## Set column options

To apply configuration options to an individual column (or a range of columns), use the [`columns`](@/api/options.md#columns) option.

::: only-for javascript

  ```js
  const hot = new Handsontable(container, {
    columns: [
      {},
      {},
      // column options, apply to each cell of the third (by physical index) column
      {
        readOnly: true,
      },
    ],
  });
```

:::

::: only-for react

```jsx
<HotTable
  columns={[
    {width: 100}, // column options for the first (by physical index) column
    {width: 100}, // column options for the second (by physical index) column
    {width: 100}, // column options for the third (by physical index) column
  ]}
/>
```
Alternatively, you can use the [`HotColumn`](@/guides/columns/react-hot-column/react-hot-column.md) component to configure columns declaratively:
```jsx
<HotTable>
  <HotColumn width={100}/>
  <HotColumn width={100}/>
  <HotColumn width={100}/>
</HotTable>
```

:::

#### Example

In the example below, the [`columns`](@/api/options.md#columns) option is set to a function.

The function applies the [`readOnly: true`](@/api/options.md#readonly) option to each column that has a physical index of either `2` or `8`.

The modified mid-level column options:
- Overwrite the top-level grid options
- Cascade down to the bottom-level cell options

As a result, each cell in the third and ninth columns is read-only:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example2.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/react/example2.jsx)
@[code](@/content/guides/getting-started/configuration-options/react/example2.tsx)

:::

:::

## Set row options

To apply configuration options to an individual row (or a range of rows), use the [`cells`](@/api/options.md#cells) option.

Any options modified through [`cells`](@/api/options.md#cells) overwrite all other options.

::: only-for javascript

 The function can take three arguments:<br>
- `row`: a row coordinate (a physical index)
- `col`: a column coordinate (a physical index)
- `prop`: if your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for a column's data source object.<br>
If your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.

```js
const hot = new Handsontable(container, {
  // the `cells` options overwrite all other options
  cells(row, col, prop) {
    if (row === 1 || row === 4) {
      return {
        // row options, which apply to each cell of the second row
        // and to each cell of the fifth row
        readOnly: true,
      };
    }
  }
});
```

:::

::: only-for react

The function can take three arguments:<br>

- `row`: a row coordinate (a physical index)
- `col`: a column coordinate (a physical index)
- `prop`: if your [`data`](@/api/options.md#data) is
  an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for a
  column's data source object.<br>
  If your [`data`](@/api/options.md#data) is
  an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.
```jsx
<HotTable cells={(row, col, prop) => {
  if (row === 1 || row === 4) {
    return {
      // row options, which apply to each cell of the second row
      // and to each cell of the fifth row
      readOnly: true,
    };
  }
}}/>
```

:::

#### Example

In the example below, the [`cells`](@/api/options.md#cells) option sets each cell in the first and fourth row as [`readOnly`](@/api/options.md#readonly).

Options modified through [`cells`](@/api/options.md#cells) overwrite all other options.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example3.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/react/example3.jsx)
@[code](@/content/guides/getting-started/configuration-options/react/example3.tsx)

:::

:::

## Set cell options

To apply configuration options to individual cells, use the [`cell`](@/api/options.md#cell) option.

::: only-for javascript

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
  autoWrapRow: true,
  autoWrapCol: true,
});
```

:::

::: only-for react

```jsx
<HotTable cell={[
  { // bottom-level cell options overwrite the top-level grid options
    // apply only to a cell with coordinates (0, 0)
    row: 0,
    col: 0,
  },
  {
    // bottom-level cell options overwrite the top-level grid options
    // apply only to a cell with coordinates (1, 1)
    row: 1,
    col: 1,
  }
]}/>
```

:::

#### Example

In the example below, the [`cell`](@/api/options.md#cell) option sets cell `A1`(`0, 0`) and cell `B2`(`1, 1`) as [`readOnly`](@/api/options.md#readonly).

The modified [`cell`](@/api/options.md#cell) options:
- Overwrite the top-level grid options
- Overwrite mid-level column options

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example4.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/react/example4.jsx)
@[code](@/content/guides/getting-started/configuration-options/react/example4.tsx)

:::

:::

### Read cell options

When Handsontable is running, you can check a cell's current options, using the [`getCellMeta()`](@/api/core.md#getcellmeta) method.

The [`getCellMeta()`](@/api/core.md#getcellmeta) method returns an object with:
- All built-in options (stored in the [`CellMeta`](https://github.com/handsontable/handsontable/blob/master/handsontable/src/dataMap/metaManager/metaLayers/cellMeta.js) [prototype](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes))
- Any options you add

For example:

::: only-for javascript

```js
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
  ],
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

:::

::: only-for react

```jsx
// Consider the HotTable component with the `cell` option declared:
<HotTable
  cell={[
    {
      row: 1,
      col: 1,
      readOnly: true
    }
  ]}
/>

// for cell (0, 0), the `readOnly` option is the default (`false`)
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// for cell (1, 1), the `cell` option overwrote the default `readOnly` value
// returns `true`
hot.getCellMeta(1, 1).readOnly;
```

:::

### Change cell options

When Handsontable is running, you can change the initial cell options, using the [`setCellMeta()`](@/api/core.md#setcellmeta) method.

For example:

::: only-for javascript

```js
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
  ],
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

:::

::: only-for react

```jsx
// changes the `readOnly` option of cell (1, 1) back to `false`
hot.setCellMeta(1, 1, 'readOnly', false);

// returns `false`
hot.getCellMeta(1, 1).readOnly;
```

:::

## Implement custom logic

You can apply configuration options to individual grid elements (columns, rows, cells), based on any logic you implement, using the [`cells`](@/api/options.md#cells) option.

The [`cells`](@/api/options.md#cells) option overwrites all other options.

::: only-for javascript

The function can take three arguments:<br>
   - `row`: a row coordinate (a physical index)
   - `col`: a column coordinate (a physical index)
   - `prop`: if your [`data`](@/api/options.md#data) is an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for a column's data source object.<br>
   If your [`data`](@/api/options.md#data) is an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.

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

:::

::: only-for react

The function can take three arguments:<br>

- `row`: a row coordinate (a physical index)
- `col`: a column coordinate (a physical index)
- `prop`: if your [`data`](@/api/options.md#data) is
  an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), `prop` is a property name for a
  column's data source object.<br>
  If your [`data`](@/api/options.md#data) is
  an [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), `prop` is the same as `col`.
```jsx
<HotTable
  cells={(row, col) => {
    if ((row === 1 || row === 5) && col === 1) {
      return {
        readOnly: true,
      };
    }
  }}
/>
```

:::
#### Example

In the example below, the modified [`cells`](@/api/options.md#cells) options overwrite the top-level grid options.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example5.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example5.ts)

:::

:::

::: only-for react

```jsx
// for cell (0, 0), the `readOnly` option is the default (`false`)
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// for cell (1, 1), the `cell` option overwrote the default `readOnly` value
// returns `true`
hot.getCellMeta(1, 1).readOnly;

// changes the `readOnly` option of cell (1, 1) back to `false`
hot.setCellMeta(1, 1, 'readOnly', false);

// returns `false`
hot.getCellMeta(1, 1).readOnly;
```

:::

## Configuration example

In the example below, some cells are read-only, and some cells are editable:
- By default, all cells are read-only (as set in the top-level grid options).
- For the first column, the mid-level column options overwrite the top-level grid options.<br>
  As a result, the first column cells are editable.
- For cell `A1` (`0, 0`), the bottom-level cell options overwrite both the mid-level column options, and the top-level grid options.<br>
  As a result, cell `A1` (`0, 0`) is read-only, despite being part of the editable first column.
- For cell `C3` (`3, 3`), the [`cells`](@/api/options.md#cells) option overwrites all other options.<br>
  As a result, cell `C3` (`3, 3`) is editable, despite not being part of the editable first column.

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/javascript/example6.js)
@[code](@/content/guides/getting-started/configuration-options/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/configuration-options/react/example6.jsx)
@[code](@/content/guides/getting-started/configuration-options/react/example6.tsx)

:::

:::


## Related API reference

- Configuration options:
  - [List of all options](@/api/options.md)
  - [`cell`](@/api/options.md#cell)
  - [`cells`](@/api/options.md#cells)
  - [`columns`](@/api/options.md#columns)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
  - [`getSettings()`](@/api/core.md#getsettings)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
  - [`updateSettings()`](@/api/core.md#updatesettings)
  - [`spliceCellsMeta()`](@/api/core.md#splicecellsmeta)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)
