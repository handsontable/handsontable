---
title: Merge cells
permalink: /next/merge-cells
canonicalUrl: /merge-cells
---

# Merge cells

To enable the merge cells feature, set the `mergeCells` option to be `true` or an array. To initialize Handsontable with predefined merged cells, provide merged cells details in form of an array: `mergeCells: [{row: 1, col: 1, rowspan: 2, colspan: 2}]`

::: example #example1
```js
var container = document.getElementById('example1'),
  hot;

hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  height: 320,
  colWidths: 47,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: [
    {row: 1, col: 1, rowspan: 3, colspan: 3},
    {row: 3, col: 4, rowspan: 2, colspan: 2},
    {row: 5, col: 6, rowspan: 3, colspan: 3}
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
