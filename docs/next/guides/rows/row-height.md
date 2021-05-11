---
title: Row height
permalink: /next/row-height
canonicalUrl: /row-height
tags:
  - resizing rows
  - wrap content
  - overflow
  - crop content
  - row size
  - height
  - max-height
  - min-height
  - row dimmensions
  - manual resize
---

# Row height

[[toc]]

## Overview

By default, the row height adjusts to the height of the content. The minimum height is `23px`. The row height can be passed as a `constant`, an `array` or a `function`.

The content inside a cell gets wrapped if it doesn't fit the cell's size.

## Setting the row height as a constant

In this example we set the same height of `40px` for all rows across the entire grid.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(4, 5),
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the row height in an array

Here we set the height only for the first rows. Each additional row would be automatically adjusted to the content.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot2 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(4, 5),
  width: '100%',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: [40, 40, 40, 40],
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the row height using a function

Here we set the size of all rows as a function. In this particular example we take a row `index` (1, 2 ...) and multiply it by `20px` in each consecutive row. 

::: example #example3
```js
const container = document.querySelector('#example3');

const hot3 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 5),
  width: '100%',
  colHeaders: true,
  rowHeaders: true,
  rowHeights(index) {
    return (index + 1) * 20;
  },
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Adjust the row height manually

Set the option `manualRowResize` to `true` to allow users to manually resize the row height by dragging the handle between the adjacent row headers. Don't forget to enable row headers by setting `rowHeaders` to `true`.

You can adjust the size of one or rows at the same time, even if the selected rows are not placed next to each other.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot4 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
