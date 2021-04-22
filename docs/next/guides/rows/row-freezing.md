---
title: Row freezing
permalink: /next/row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
---

# {{ $frontmatter.title }}

[[toc]]

Specify two fixed rows with `fixedRowsTop: 2`. You'll need horizontal scrollbars, so just set a container `width` and `overflow: hidden` in CSS.

::: example #example1
```js
var example = document.getElementById('example1');
var hot1 = new Handsontable(example, {
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
