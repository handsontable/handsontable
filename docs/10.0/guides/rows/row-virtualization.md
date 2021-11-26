---
title: Row virtualization
metaTitle: Row virtualization - Guide - Handsontable Documentation
permalink: /10.0/row-virtualization
canonicalUrl: /row-virtualization
tags:
  - dom
  - render all rows
  - offset
---

# Row virtualization

[[toc]]

## Overview

Virtualization allows Handsontable to process hundreds of thousands of records without causing the browser to hang. This technique draws only the visible part of the grid, displaying the minimum items physically rendered in the `DOM`. The elements outside the viewport are rendered when you scroll across the grid. Depending on your configuration, there might be a small offset of columns or rows rendered outside the viewport to make the scrolling performance smoother.

This feature is enabled by default and can be turned off by setting the `renderAllRows` to `true`.

::: tip
Note that the data grid without virtualization enabled will only work with relatively small data sets.
:::

## Configuring row virtualization

You can experiment with the `viewportRowsRenderingOffset` config option, which determines the number of rows displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, then the virtualization will be practically turned off.

::: warning
Proceed with caution, as it will affect the overall performance of the grid.
:::

To make the grid scrollable, set the constant width and height to the same as the container holding Handsontable and set the `overflow` property to `hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

* Number of cells - number of rows multiplied by the number of columns
* Amount and complexity of custom renderers in cells
* Number of options enabled in the configuration
* Performance of your setup - physical machine and a browser

The example below presents a data grid displaying 1 million cells (1000 rows x 1000 columns):

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
