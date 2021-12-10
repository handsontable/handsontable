---
title: Row height
metaTitle: Row height - Guide - Handsontable Documentation
permalink: /10.0/row-height
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

By default, the row height adjusts to the height of the content. The minimum height is `23px`. The row height can be passed as a `constant`, an `array`, or a `function`.

The content inside a cell gets wrapped if it doesn't fit the cell's size.

## Setting the row height as a constant

We set the same height of `40px` for all rows across the entire grid in this example.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(4, 5),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the row height in an array

In this example, the height is only set for the first rows. Each additional row would be automatically adjusted to the content.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(4, 5),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: [40, 40, 40, 40],
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting the row height using a function

The row height can be set using a function. In this example, the size of all rows is set using a function that takes a row `index` (1, 2 ...) and multiplies it by `20px` for each consecutive row.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 5),
  width: '100%',
  height: 'auto',
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

You can adjust the size of one or multiple rows simultaneously, even if the selected rows are not placed next to each other.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 5),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
