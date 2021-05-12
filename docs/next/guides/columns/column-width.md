---
title: Column width
metaTitle: Column width - Guide - Handsontable Documentation
permalink: /next/column-width
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

By default, the column width adjusts to the width of the content. The minimum width is `50px`, indluding `1px` for borders on the sides. The column size can be passed as a `constant`, an `array` or a `function`.

The content inside a cell will be wrapped if it doesn't fit its size.

## Setting the column width as a constant

In this example we set the same width of `100px` for all columns across the entire grid.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
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

Here we set the width only for the first four columns. Each additional column would be automatically adjusted to the content.  

::: example #example2
```js
const container = document.querySelector('#example2');

const hot2 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 4),
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

Here we set the size of all columns as a function. In this particular example we take a column `index` (1, 2 ...) and multiply it by `40px` in each consecutive column. 

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

Set the option `manualColumnResize` to `true` to allow users to manually resize the column width by dragging the handle between the adjacent column headers. If you double-click on that handle then the width will be instantly adjusted to the size of the longest value in the column. Don't forget to enable column headers by setting `colHeaders` to `true`.

You can adjust the size of one or columns at the same time, even if the selected columns are not placed next to each other.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot4 = new Handsontable(container, {
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

You can adjust columns width to make them fit the table's width automatically. The width of a particular column will be calculated based on the size and number of other columns in the grid. This option makes sense only when you have at least one column in your data set, and less columns than is needed to enable the horizontal scrollbar.

::: tip
Use the **context menu** to insert or remove columns. This will help you understand how the grid reacts to changes.
:::

### Fit all columns equally

In this case you fit all columns to the container's width equally by setting the option like so: `stretchH: 'all'`.

::: example #example5
```js
const container = document.querySelector('#example5');

const hot5 = new Handsontable(container, {
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

In this example, first three columns will be set to be `80px` wide, and the last column will automatically fill the remaining space. This is possible thanks to the option `stretchH` set to `last`.

::: example #example6
```js
const container = document.querySelector('#example6');

const hot6 = new Handsontable(container, {
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

As mentioned above, the default width of the column is based on the widest value in any cell within the column. You may be wondered how it's possible for data sets containing hundreds of thousands of records.

This feature is made possible thanks to the `AutoColumnSize` plugin, which is enabled by default. Internally it divides the data set into smaller sets and then render only some of them to measure their size. Then, the size is applied to the entire column based on the width of the widest found value.

To increase the performance you can turn off this feature by defining the fixed size for the specifed column or all columns.  

## Size of the container

Setting the dimmensions of the container that holds Handsontable is well described on the [Grid Size](../grid-size) page. 
