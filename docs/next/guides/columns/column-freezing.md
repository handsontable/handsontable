---
title: Column freezing
permalink: /next/column-freezing
canonicalUrl: /column-freezing
tags:
  - fixing columns
  - snapping columns
  - pinning columns 
---

# {{ $frontmatter.title }}

[[toc]]

## Freeze columns at initialization

To make the columns on the left hand side frozen (we call them "fixed"), you need to pass the option `fixedColumnsLeft` in the Settings object. Remember that the container in which you initialize the data grid will need additional CSS attributes to be set: `width` and `overflow: hidden`.

::: example #example1
```js
var example = document.getElementById('example1');

var hot1 = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsLeft: 2,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## User-triggered freeze

In order to manually freeze a column, you need to set the `manualColumnFreeze` config item to `true` in Handsontable initialization. When the Manual Column Freeze plugin is enabled, you can freeze any non-fixed column and unfreeze any fixed column in your Handsontable instance using the Context Menu.

::: tip
A frozen column won't go back to the original position after you unfreeze it.
:::

::: example #example2
```js
var
  myData = Handsontable.helper.createSpreadsheetData(100, 50),
  container = document.getElementById('example2'),
  hot2;

hot2 = new Handsontable(container, {
  data: myData,
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
