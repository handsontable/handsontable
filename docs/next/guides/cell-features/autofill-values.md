---
title: AutoFill values
permalink: /next/autofill-values
canonicalUrl: /autofill-values
tags:
  - fill handle
  - smart fill
  - populate data
  - drag down
  - square
---

# AutoFill values

[[toc]]

## Overview

Autofill is a feature that enables you to copy the contents of a cell to another cell or range of cells within the grid.

## Autofill in all directions

Using the tiny square known as the 'fill handle' in the corner of the selected cell, you can drag it (drag-down) to repeat the values from the cell. Double click the fill handle in `cell B4` where the value is `30` to fill the selection down to the last value in neighbouring column, just like it would in Excel or Google Sheets.

::: example #example1
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
],
container = document.getElementById('example1'),
hot1;

hot1 = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  fillHandle: true // possible values: true, false, "horizontal", "vertical",
});

hot1.loadData(data);
```
:::

## Autofill in a vertical direction only and creating new rows

In this configuration, the fill handle is restricted to move only vertically. New rows are automatically added to the bottom of the table by changing `autoInsertRow` to `true`.

::: example #example2
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
],
container = document.getElementById('example2'),
hot2;

hot2 = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  fillHandle: {
    direction: 'vertical',
    autoInsertRow: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
