---
title: Column width
metaTitle: Column width - Guide - Handsontable Documentation
permalink: /9.0/column-width
canonicalUrl: /column-width
tags:
  - resizing columns
  - stretching columns
  - column size
  - width
  - max-width
  - min-width
  - column dimmensions
  - manual resize
---

# Column width

[[toc]]

## Overview

By default, the column width adjusts to the width of the content. However, if the width of the column content is less than `50px`, including `1px` for borders on the sides, the column width remains constant at `50px`. The column size can be passed as a `constant`, an `array` or a `function`.

The content inside a cell will be wrapped if it doesn't fit the cell's width.

## Setting the column width as a constant

In this example we set the same width of `100px` for all columns across the entire grid.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 50),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  colWidths: 100,
  manualColumnResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the column width in an array

In this example, the width is only set for the first four columns. Each additional column would automatically adjust to the content.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  colWidths: [50, 100, 200, 400],
  manualColumnResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the column width using a function

In this example, the size of all columns is set using a function by taking a column `index` (1, 2 ...) and multiplying it by `40px` for each consecutive column.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot3 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  colWidths(index) {
    return (index + 1) * 40;
  },
  manualColumnResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Adjust the column width manually

Set the option `manualColumnResize` to `true` to allow users to manually resize the column width by dragging the handle between the adjacent column headers. If you double-click on that handle, the width will be instantly adjusted to the size of the longest value in the column. Don't forget to enable column headers by setting `colHeaders` to `true`.

You can adjust the size of one or multiple columns simultaneously, even if the selected columns are not placed next to each other.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 6),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  colWidths: [200, 100, 100], // initial width of the first 3 columns
  manualColumnResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Column stretching

You can adjust the width of the columns to make them fit the table's width automatically. The width of a particular column will be calculated based on the size and number of other columns in the grid. This option only makes sense when you have at least one column in your data set and fewer columns than needed to enable the horizontal scrollbar.

::: tip
Use the **context menu** to insert or remove columns. This will help you understand how the grid reacts to changes.
:::

### Fit all columns equally

This example fits all columns to the container's width equally by setting the option `stretchH: 'all'`.

::: example #example5
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 3),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  stretchH: 'all', // 'none' is default
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Stretch only the last column

In this example, the first three columns are set to be 80px wide, and the last column automatically fills the remaining space. This is achieved by setting the option `stretchH: 'last'`.

::: example #example6
```js
const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 4),
  width: '100%',
  height: 'auto',
  colWidths: 80,
  colHeaders: true,
  rowHeaders: true,
  stretchH: 'last',
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## A note about the performance

As mentioned above, the default width of the column is based on the widest value in any cell within the column. You may be wondering how it's possible for data sets containing hundreds of thousands of records.

This feature is made possible thanks to the [AutoColumnSize](@/api/autoColumnSize.md) plugin, which is enabled by default. Internally it divides the data set into smaller sets and renders only some of them to measure their size. The size is then applied to the entire column based on the width of the widest found value.

To increase the performance, you can turn off this feature by defining the fixed size for the specified column or all columns.

## Size of the container

Setting the dimensions of the container that holds Handsontable is described in detail on the [Grid Size](@/guides/getting-started/grid-size.md) page.
