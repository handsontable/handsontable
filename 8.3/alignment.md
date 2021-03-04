---
title: Alignment
permalink: /8.3/alignment
canonicalUrl: /alignment
---

# {{ $frontmatter.title }}

To initialize Handsontable with predefined horizontal and vertical alignment, provide className cells details in form of a grid, `columns` or `cell` setting (see code sample below).

Available classNames:

* Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`,
* Vertical: `htTop`, `htMiddle`, `htBottom`.

Alignment changes can be tracked using `afterSetCellMeta` hook callback.

::: example #example1
```js
var container = document.getElementById('example1'),
  hot1;

hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 18),
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
  ],
  afterSetCellMeta: function (row, col, key, val) {
    console.log("cell meta changed", row, col, key, val);
  }
});
```
:::
