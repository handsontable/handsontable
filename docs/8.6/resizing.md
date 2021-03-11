---
title: Resizing
permalink: /8.6/resizing
canonicalUrl: /resizing
---

# {{ $frontmatter.title }}

To enable these features, use settings `manualColumnResize: true` and `manualRowResize: true`

The draggable resize handle appears:

* in the right part of the column header,
* in the bottom part of the row header.

Double click on the resize handle automatically adjusts size of the row or column.

For the selected rows or columns works simultaneously resizing.

::: example #example1
```js
var container = document.getElementById('example1');
var hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(200, 10),
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: 320,
  colWidths: [45, 100, 160, 60, 80, 80, 80],
  rowHeights: [50, 40, 100],
  manualColumnResize: true,
  manualRowResize: true
});
```
:::
