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
  width: 400,
  height: 300
});
```

Depending on your needs, you can apply [configuration options](@/api/options.md) to different elements of your grid, such as:
- [The entire grid](#grid-options)
- [Individual columns (or a range of columns)](#column-options)
- [Individual rows (or a range of rows)](#row-options)
- [Individual cells (or a range of cells)](#cell-options)
- [Individual grid elements, based on any logic you implement](#cells)

For the full list of available configuration options, see the [configuration options' API reference](@/api/options.md).

### Cascading configuration

Handsontable's configuration is cascaded down from the top-level [`GlobalMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/globalMeta.js) options, through the mid-level [`ColumnMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/columnMeta.js) options, to the bottom-level [`CellMeta`](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/metaLayers/cellMeta.js) options. For more details on Handsontable's cascading configuration, see [this file](https://github.com/handsontable/handsontable/blob/master/src/dataMap/metaManager/index.js).

### Plugin options

Configuration options can come:
* From Handsontable's [Core](@/api/core.md)
* From Handsontable's [plugins](@/api/plugins.md)
* From Handsontable's [hooks](@/api/hooks.md)

To find out where a given option comes from, check the **Category** label in the [configuration options' API reference](@/api/options.md).

To use an option that comes from a Handsontable plugin, you need to import and register that plugin when [initializing](@/guides/getting-started/installation.md#initialize-the-grid) your Handsontable instance.

For more details on importing and registering plugins, see [this section](@/guides/building-and-testing/modules.md#importing-plugins).

## Setting grid options

To apply a configuration option to the entire grid:

- Pass your option as a second argument of the [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid), using the [object literal notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):
    ```js
    const hot = new Handsontable(container, {
      // configuration options, applied to the entire grid
      width: 400,
      height: 300
    });
    ```

#### Example

To configure each cell in the grid as read-only, apply the [`readOnly`](@/api/options.md#readonly) option as a top-level grid option. The top-level grid options are cascaded down, through the mid-level [column options](#setting-column-options), and to the bottom-level [cell options](#setting-cell-options).

As a result, each cell in the grid is read-only:

::: example #example1 --html 1 --css 2 --js 3
```html
<div id="example1" class="hot"></div>
```
```css
td.read-only-background {
  background-color: #f2f4fb;
}
```
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(scontainer, {
  // configuration options, in the object literal notation
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  // `readOnly` option, applied to each cell of the entire grid
  readOnly: true,
  className: 'read-only-background',
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true
});
```
:::

## Setting column options

To apply a configuration option to an individual column (or a range of columns):

1. Within [Handsontable constructor](@/guides/getting-started/installation.md#initialize-the-grid)'s second argument, add an option called [`columns`](@/api/options.md#columns).
    ```js
    const hot = new Handsontable(container, {
      // some top-level options, applied to the entire grid
      width: 400,
      height: 300,
      // `columns` option
      columns: 
    });
    ```
2. To the [`columns`](@/api/options.md#columns) option, assign an array of objects.<br>
   Each object represents one column, and the objects' order represents the columns' order.
    ```js
    const hot = new Handsontable(container, {
      columns: [
        {}, // column options for the first column
        {}, // column options for the second column
        {}, // column options for the third column
      ],
    });
    ```

3. In the object that represents your required column, add your column options.
    ```js
    const hot = new Handsontable(container, {
      columns: [
        {},
        {},
        // column options, applied to each cell of the third column
        {
          readOnly: true,
          className: 'read-only-background'
        },
      ],
    });
    ```

#### Example

We've got a grid with ten columns. The third column and the ninth column are set as [`readOnly`](@/api/options.md#readonly), and are assigned a [`className`](@/api/options.md#classname). The mid-level column options are cascaded down to the bottom-level [cell options](#setting-cell-options).

As a result, each cell in the third and ninth columns is read-only and has the `read-only-background` class:

::: example #example2 --html 1 --css 2 --js 3
```html
<div id="example2" class="hot"></div>
```
```css
td.read-only-background {
  background-color: #f2f4fb;
}
```
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  width: 'auto',
  height: 'auto',
  columns: [
    {},
    {},
    {
      readOnly: true,
      className: 'read-only-background'
    },
    {},
    {},
    {},
    {},
    {},
    {
      readOnly: true,
      className: 'read-only-background'
    },
    {},
  ],
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting row options

Using the [cells](@/api/options.md#cells) option we can apply read-only option to entire
rows. In the example below, the second and last rows are read-only.

::: example #example3 --html 1 --css 2 --js 3
```html
<div id="example3" class="hot"></div>
```
```css
td.read-only-background {
  background-color: #f2f4fb;
}
```
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  cells(row, column) {
    if (row === 1 || row === 4) {
      return {
        readOnly: true,
        className: 'read-only-background'
      };
    }
  },
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting cell options

And finally, let's make one of the cells read-only.

::: example #example4 --html 1 --css 2 --js 3
```html
<div id="example4" class="hot"></div>
```
```css
td.read-only-background {
  background-color: #f2f4fb;
}
```
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  cells(row, column) {
    if (row === 1 && column === 1) {
      return {
        readOnly: true,
        className: 'read-only-background'
      };
    }
  },
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### `cells` vs `cell`

In the Options section of the API, you can find two similar options, [cell](@/api/options.md#cells-2) and [cell](@/api/options.md#cell). Using one of these options (or both), you can associate the custom properties or overwrite an entire table or column option for a particular cell. Both options allow you to set initial values for specific cells. You can check if the values are propagated by calling the [getCellMeta](@/api/core.md#getcellmeta) method. The method returns an object with all built-in options as well as those added by the developer.

#### `cell`

The [cell](@/api/options.md#cell) option works great for cases when you have to set initial values for your custom properties or change the initial values for the built-in option. Once the changes are propagated to the cells' meta-objects, they can be modified by the Handsontable while it is running. For example, the cell read-only state can be modified by the context menu.

```js
// ...
cell: [
  { row: 1, col: 1, readOnly: true, className: 'read-only-background' }
],
// ...

hot.getCellMeta(0, 0).readOnly === false; // By default the option is "false"
hot.getCellMeta(1, 1).readOnly === true; // the "cell" overwrites the value

// The state can be changed using API or UI e.g.
hot.setCellMeta(1, 1, 'readOnly', false);
```

#### `cells`

The [cells](@/api/options.md#cells-2) option works slightly differently. The `cells` option is a function that invokes the logic in it before the table's rendering cycle. The options returned by that function always overwrite the entire table or column options. Thus, if you implement logic incorrectly, you won't be able to change cells' state from API or UI - as the values will be constantly overwritten by the `cells` function. You can think of this option as an opportunity to transfer the responsibility of keeping the table cells option to your application.

If at some point you want to stop overwriting the cell meta object for particular cells, return an empty object, `null` or `undefined` value.

```js
// ...
cells(row, column) {
  if (row === 1 && column === 1) {
    return {
      readOnly: true,
      className: 'read-only-background'
    };
  }
},
// ...

hot.getCellMeta(0, 0).readOnly === false; // By default the option is "false"
hot.getCellMeta(1, 1).readOnly === true; // the "cells" overwrites the value

// In this case, an attempt to change the state will have no effect. The `readOnly`
// property always returns `true`.
hot.setCellMeta(1, 1, 'readOnly', false);
```