---
title: Column virtualization
metaTitle: Column virtualization - Guide - Handsontable Documentation
permalink: /10.0/column-virtualization
canonicalUrl: /column-virtualization
tags:
  - dom
  - render all columns
  - offset
---

# Column virtualization

[[toc]]

## Overview

To process a large number of columns in a browser Handsontable utilizes the virtualization process to display only the visible part of the grid with a small offset for a better scrolling experience. This feature is turned on by default and can be turned off only for rows, not columns.

## Configuring the column virtualization
You can experiment with the `viewportColumnRenderingOffset` config option, which determines the number of columns being displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, the virtualization will be practically turned off.

::: warning
Proceed with caution, as it will affect the overall performance of the grid.
:::

To make the grid scrollable, set the constant width and height to same as the container holding Handsontable and height and set the `overflow` property to `hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

* Number of cells - number of rows multiplied by the number of columns
* Amount and complexity of custom renderers in cells
* Number of options enabled in the configuration
* Performance of your setup - physical machine and browser

The demo below presents a data grid displaying one million cells (1000 rows x 1000 columns).

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
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
