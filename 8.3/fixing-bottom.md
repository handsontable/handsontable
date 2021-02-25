---
title: Fixing bottom rows
permalink: /8.3/fixing-bottom
canonicalUrl: /fixing-bottom
---

# {{ $frontmatter.title }}

You can fix the bottom rows of the table, by using the `fixedRowsBottom` config option. This way, when you're scrolling the table, the fixed rows will stay at the bottom edge of the table's container.

Example below shows a table with two bottom rows fixed.

::: example #example1
```js
var
  myData = Handsontable.helper.createSpreadsheetData(100, 50),
  container = document.getElementById('example1'),
  hot1;

hot1 = new Handsontable(container, {
  data: myData,
  rowHeaders: true,
  colHeaders: true,
  fixedRowsBottom: 2
});
```
:::
