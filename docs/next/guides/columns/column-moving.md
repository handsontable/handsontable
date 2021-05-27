---
title: Column moving
metaTitle: Column moving - Guide - Handsontable Documentation
permalink: /next/column-moving
canonicalUrl: /column-moving
---

# Column moving

[[toc]]

## Overview
This page shows you how to move columns in Handsontable.

## Enabling plugin

Use the setting `manualColumnMove: true` to enable this feature.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the grid.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(200, 20),
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  manualColumnMove: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
