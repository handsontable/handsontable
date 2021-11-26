---
title: Text alignment
metaTitle: Text alignment - Guide - Handsontable Documentation
permalink: /10.0/text-alignment
canonicalUrl: /text-alignment
---

# Text alignment

[[toc]]

## Overview

Text alignment functionality enables you to predefine the horizontal and vertical alignment of how the text is displayed in the cells.

## Horizontal and vertical alignment

To initialize Handsontable with predefined horizontal and vertical alignment, provide the alignment details for the `className` cells in the form of a grid, configuring `cells` by `col`,`row`, and `className`. Cells can be configured individually, or the entire grid can be configured. See the code sample below for an example.

Available class names:

* Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`,
* Vertical: `htTop`, `htMiddle`, `htBottom`.

Alignment changes can be tracked using `afterSetCellMeta` callback.

## Basic example

The following code sample configures the grid to use `htCenter` and configures individual cells to use different alignments.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 18),
  colWidths: 100,
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 }
  ],
  className: 'htCenter',
  cell: [
    { row: 0, col: 0, className: 'htRight' },
    { row: 1, col: 1, className: 'htLeft htMiddle' },
    { row: 3, col: 4, className: 'htLeft htBottom' }
  ],
  afterSetCellMeta(row, col, key, val) {
    console.log('cell meta changed', row, col, key, val);
  }
});
```
:::
