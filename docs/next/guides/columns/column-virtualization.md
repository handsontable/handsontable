---
title: Column virtualization
permalink: /next/column-virtualization
canonicalUrl: /column-virtualization
tags:
  - dom
  - render all columns
  - offset
---

# Column virtualization

[[toc]]

## Overview

To process the large number of columns in a browser Handsontable utilizes the virtulization process that allows to display only the visible part of the grid with a small offset for a better scrolling experience. This feature is turned on by default and can be turned off only for rows, not columns.

 However, you can experiment with the `viewportColumnRenderingOffset` config option, which determine the number of columns being displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, then the virtualization will be practically turned off. Be careful with it though as it will affect the overall performance of the grid.

To make the grid scrollable, set constant width and height to the container holding Handsontable and set the `overflow` property to `hidden` in the container's stylesheet. Then, if the table contains enough rows or columns, you can scroll through it.

The scrolling performance depends mainly on four factors:

* the amount of cells (number of rows multiplied by the number of columns),
* the amount and complexity of custom renderers in cells,
* the number of options enabled in the configuration,
* the performance of your setup (physical machine and a browser).

The demo below presents a data grid displaying one million cells (1000 rows x 1000 columns).

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
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
