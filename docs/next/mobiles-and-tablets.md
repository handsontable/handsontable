---
title: Mobiles and tablets
permalink: /next/mobiles-and-tablets
canonicalUrl: /mobiles-and-tablets
---

# {{ $frontmatter.title }}

Currently Handsontable supports only iPad 4 and other mobile devices in a basic scope. Mobile editor and selecting modes are enabled automatically if you're viewing Handsontable on a mobile device.

**Open this page on iPad 4 and play with the demo below:**

::: example #example1
```js
var
  container = document.getElementById('example1'),
  hot;

hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(50, 26),
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  fixedRowsTop: 2,
  fixedColumnsLeft: 2
});
```
:::
