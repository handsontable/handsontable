---
title: Column freezing
metaTitle: Column freezing - Guide - Handsontable Documentation
permalink: /10.0/column-freezing
canonicalUrl: /column-freezing
tags:
  - fixing columns
  - snapping columns
  - pinning columns
---

# Column freezing

[[toc]]

## Overview

Column freezing locks specific columns of a grid in place, keeping them visible while scrolling to another area of the grid. We refer to frozen columns as *fixed*. Columns can be frozen during initialization and by the user.

## Freeze columns at initialization

To freeze the columns on the left-hand side, you need to pass the option `fixedColumnsLeft` in the Settings object. The container you initialize the data grid in will need additional CSS attributes configured: `width` and `overflow: hidden`.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsLeft: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## User-triggered freeze

To manually freeze a column, you need to set the `manualColumnFreeze` config item to `true` in the Handsontable initialization. When the Manual Column Freeze plugin is enabled, you can freeze any non-fixed column and unfreeze any fixed column in your Handsontable instance using the Context Menu.

::: tip
A frozen column won't go back to the original position after you unfreeze it.
:::

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsLeft: 2,
  contextMenu: true,
  manualColumnFreeze: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
