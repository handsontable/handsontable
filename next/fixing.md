---
id: fixing
title: Fixing
sidebar_label: Fixing
slug: /fixing
---

Specify two fixed rows with `fixedRowsTop: 2` and two fixed columns with `fixedColumnsLeft: 2` option.

**Note:** You'll need horizontal scrollbars, so just set a container `width` and `overflow: hidden` in CSS.

_If you're looking for an option to manually fix columns, see the [Freezing](freezing.md) section of this documentation._

```js hot-preview=example1,hot1
var example = document.getElementById('example1');
var hot1 = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedRowsTop: 2,
  fixedColumnsLeft: 2
});
```
