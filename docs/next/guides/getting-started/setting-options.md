---
title: Setting options
metaTitle: Setting options - Guide - Handsontable Documentation
permalink: /next/setting-options
canonicalUrl: /setting-options
tags:
  - properties
  - config
---

# Setting options

[[toc]]

## Overview

Handsontable uses cascading configuration, a fast way to provide configuration options for the entire table, including its columns and particular cells. To show you how it works, we use the [readOnly](@/api/metaSchema.md#readOnly) and [className](@/api/metaSchema.md#className) options, which we will play in all the examples below.

### Entire grid

By settings the [readOnly](@/api/metaSchema.md#readOnly) option, we tell Handsontable to propagate the option through the column settings down to the cells. Hence, all cells have a read-only state.

::: example #example1 --html 1 --css 2 --js 3
```html
<div id="example1" class="hot"></div>
```
```css
td.bg-read-only {
  background-color: #f2f4fb;
}
```
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  readOnly: true,
  className: 'bg-read-only',
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Single column

Moving on, let's set the read-only cells by setting the option to the specific column.

::: example #example2 --html 1 --js 2
```html
<div id="example2" class="hot"></div>
```
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  columns: [
    {},
    {},
    { readOnly: true },
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  ],
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Single row

Using the [cells](@/api/metaSchema.md#cells) option we can apply read-only option to entire
rows. In the example below, the second and last rows are read-only.

::: example #example3 --html 1 --js 2
```html
<div id="example3" class="hot"></div>
```
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  cells(row, column) {
    if (row === 1 || row === 4) {
      return { readOnly: true };
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

### Single cell

And finally, let's set the read-only only for one cell.

::: example #example4 --html 1 --js 2
```html
<div id="example4" class="hot"></div>
```
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  cells(row, column) {
    if (row === 1 && column === 1) {
      return { readOnly: true };
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

## `cells` vs `cell`

In the Options section of the API, you can find two similar options, [cell](@/api/metaSchema.md#cells-2) and [cell](@/api/metaSchema.md#cell). Using one of these options (or both), you can associate the custom properties or overwrite any entire table or column option for a particular cell. Both options allow you to set initial values for specific cells. You can check if the values are propagated by calling the [getCellMeta](@/api/core.md#getcellmeta) method. The method returns an object with all built-in options as well as those added by the developer.

#### `cell`

The [cell](@/api/metaSchema.md#cell) option works great for cases when you have to set initial values for your custom properties or change the initial values for the build-in options. Once the changes are propagated to the cells' meta-objects, they can be modified by the Handsontable while it is running. For example, the cell read-only state can be toggled by the context menu.

```js
// ...
cell: [
  { row: 1, col: 1, readOnly: true }
],
// ...

hot.getCellMeta(0, 0).readOnly === false; // By default the option is "false"
hot.getCellMeta(1, 1).readOnly === true; // the "cell" overwrites the value

// The state can be changed using API or UI e.g.
hot.setCellMeta(1, 1, 'readOnly', false);
```

#### `cells`

The [cells](@/api/metaSchema.md#cells-2) option works slightly differently. The `cells` option is a function that invokes the logic in it before the table's rendering cycle. The options returned by that function always overwrite the entire table or column options. Thus, if you implement logic incorrectly, you won't be able to change cells' state from API or UI - as the values will be constantly overwritten by the `cells` function. You can think of this option as an opportunity to transfer the responsibility of keeping the table cells option to your application.

If you want to stop, overwrite the cell meta object for particular cells, just return an empty object.

```js
// ...
cells(row, column) {
  if (row === 1 && column === 1) {
    return { readOnly: true };
  }
},
// ...

hot.getCellMeta(0, 0).readOnly === false; // By default the option is "false"
hot.getCellMeta(1, 1).readOnly === true; // the "cells" overwrites the value

// In this case, an attempt to change the state will have no effect. The `readOnly`
// property always returns `true`.
hot.setCellMeta(1, 1, 'readOnly', false);
```

## Show time

With a combination of the above configuration layers, you're able to manage a more complicated setup.

Consider the following example:

::: example #example5 --html 1 --js 2
```html
<div id="example5" class="hot"></div>
```
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  readOnly: true,
  columns: [
    { readOnly: false },
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
  cells(row, column) {
    if (row === 0 && column === 0) {
      return { readOnly: true }
    }

    if (row === 2 && column === 2) {
      return { readOnly: false }
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

The above notation results in all cells being read-only, except for the first column, which is editable. The top-left cell and cell at row and column index `3, 3` are still read-only. Their properties are individually managed within the [cells](@/api/metaSchema.md#cells-2) option.

## All options

The most up to date list of options is available in the [Options](@/api/metaSchema.md) section of the API Reference. The table below is just a cheatsheet that can be useful if you're already familiar with the Handsontable API.
