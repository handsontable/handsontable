---
title: Row freezing
metaTitle: Row freezing - Guide - Handsontable Documentation
permalink: /10.0/row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
---

# Row freezing

[[toc]]

## Overview
Row freezing locks specific rows of a grid in place, keeping them visible while scrolling to another area of the grid.

## Example

The following example specifies two fixed rows with `fixedRowsTop: 2`. Horizontal scroll bars are needed, so set a container `width` and `overflow: hidden` in CSS.

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
  fixedRowsTop: 2,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
