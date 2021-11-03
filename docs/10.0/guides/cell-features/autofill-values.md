---
title: AutoFill values
metaTitle: AutoFill - Guide - Handsontable Documentation
permalink: /10.0/autofill-values
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
const container = document.querySelector('#example1');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
];

const hot = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  fillHandle: true, // possible values: true, false, "horizontal", "vertical",
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

hot.loadData(data);
```
:::

## Autofill in a vertical direction only and creating new rows

In this configuration, the fill handle is restricted to move only vertically. New rows are automatically added to the bottom of the table by changing `autoInsertRow` to `true`.

::: example #example2
```js
const container = document.querySelector('#example2');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
];

const hot = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  fillHandle: {
    direction: 'vertical',
    autoInsertRow: true
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
