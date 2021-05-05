---
title: Row virtualization
permalink: /next/row-virtualization
canonicalUrl: /row-virtualization
tags:
  - dom
  - render all rows
  - offset
---

# Row virtualization

[[toc]]

## Overview

Virtualization allows Handsontable to process hundreds of thousands of records without hanging the browser. This technique draw only the visible part of the grid so you get the minimum items physically rendered in the `DOM`. The elements outside the viewport are rendered as you scroll across the grid. Depending on your configuration there might be a little offset of columns or rows renderered outside the viewport to make the scrolling performance smoother.

This feature is enabled by default and can be turned off by setting the `renderAllRows` to `true`. Remember that the data grid without virtualization enabled will work only with relatively small data sets.

 You can also experiment with the `viewportRowsRenderingOffset` config option, which determine the number of rows being displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, then the virtualization will be practically turned off. Be careful with it though as it will affect the overall performance of the grid.

To make the grid scrollable, set constant width and height to the container that holds Handsontable, and set the `overflow` property to `hidden` in the container's stylesheet. Then, if the table contains enough rows or columns, you will be able scroll through it.

The scrolling performance depends mainly on four factors:

* the amount of cells (number of rows multiplied by the number of columns),
* the amount and complexity of custom renderers in cells,
* the number of options enabled in the configuration,
* the performance of your setup (physical machine and a browser).

The demo below presents a data grid displaying 1 million cells (1000 rows x 1000 columns).

::: example #example1
```js
var example = document.getElementById('example1');
var hot1 = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(1000, 1000),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
