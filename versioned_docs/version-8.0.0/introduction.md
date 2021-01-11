---
id: introduction
title: Mock Page
sidebar_label: Mock Page
slug: /
---

This page just prevent 404 error, it might be seen only on localhost.

**In the case of Stage or Production usages rewriting should happen.**

## snippet for v 8.0.0


```js title="index.js" hot-preview=example2,hot2
var
  container = document.getElementById('example2'),
  hot2;

hot2 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(6, 6),
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: [
    {row: 1, col: 1, rowspan: 3, colspan: 3},
    {row: 3, col: 4, rowspan: 2, colspan: 2}
  ],
  className: "htCenter",
  cell: [
    {row: 0, col: 0, className: "htRight"},
    {row: 1, col: 1, className: "htLeft htMiddle"},
    {row: 3, col: 4, className: "htLeft htBottom"}
  ]
});
console.log('demo 2 loaded');
```
