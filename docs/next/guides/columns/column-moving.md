---
title: Column moving
metaTitle: Column moving - Guide - Handsontable Documentation
permalink: /next/column-moving
canonicalUrl: /column-moving
---

# Column moving

[[toc]]

This page shows how to move columns in Handsontable.

## Enabling plugin

To enable this feature, use settings `manualColumnMove: true`.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the column header body.

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
