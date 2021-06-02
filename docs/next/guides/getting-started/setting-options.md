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

Row

### Single cell

And finally, let's set the read-only only for one cell.

::: example #example3 --html 1 --js 2
```html
<div id="example3" class="hot"></div>
```
```js
const container = document.querySelector('#example3');

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

cells vs cell

## Show time

With a combination of the above configuration layers, you're able to manage a more complicated setup.

Consider the following example:

::: example #example4 --html 1 --js 2
```html
<div id="example4" class="hot"></div>
```
```js
const container = document.querySelector('#example4');

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

The above notation results in all cells being read-only, except for the first column, which is editable. The top-left cell and cell at row and column index `3, 3` are still read-only. Their properties are individually managed within the [cells](@/api/metaSchema.md#cells) option.

## All options

The most up to date list of options is available in the [Options](@/api/metaSchema.md) section of the API Reference. The table below is just a cheatsheet that can be useful if you're already familiar with the Handsontable API.
