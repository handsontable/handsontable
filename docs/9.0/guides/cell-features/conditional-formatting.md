---
title: Conditional formatting
metaTitle: Conditional formatting - Guide - Handsontable Documentation
permalink: /9.0/conditional-formatting
canonicalUrl: /conditional-formatting
---

# Conditional formatting

[[toc]]

## Overview

Conditional formatting can be used to set the font, color, typeface, etc., for cell content and can also be used to format the style of a cell, all based on a predefined set of criteria.

## Example of conditional formatting

<style>
.make-me-red {
  color: #FF5A12;
}
</style>

This demo shows how to use the cell type renderer feature to make some conditional formatting:

1. The first row is read-only and formatted as bold green text.
2. All cells in the Nissan column are formatted as italic text.
3. Empty cells are formatted with a silver background.
4. Negative numbers are formatted as red text.


::: example #example1
```js
const container = document.getElementById('example1');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', -5, '', 12, 13],
  ['2018', '', -11, 14, 13],
  ['2019', '', 15, -12, 'readOnly']
];

function firstRowRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.style.fontWeight = 'bold';
  td.style.color = 'green';
  td.style.background = '#CEC';
}

function negativeValueRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  // if row contains negative number
  if (parseInt(value, 10) < 0) {
    // add class "negative"
    td.className = 'make-me-red';
  }

  if (!value || value === '') {
    td.style.background = '#EEE';

  } else {
    if (value === 'Nissan') {
      td.style.fontStyle = 'italic';
    }

    td.style.background = '';
  }
}
// maps function to a lookup string
Handsontable.renderers.registerRenderer('negativeValueRenderer', negativeValueRenderer);

const hot = new Handsontable(container, {
  data: data,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  afterSelection(row, col, row2, col2) {
    const meta = this.getCellMeta(row2, col2);

    if (meta.readOnly) {
      this.updateSettings({fillHandle: false});

    } else {
      this.updateSettings({fillHandle: true});
    }
  },
  cells(row, col) {
    const cellProperties = {};
    const data = this.instance.getData();

    if (row === 0 || data[row] && data[row][col] === 'readOnly') {
      cellProperties.readOnly = true; // make cell read-only if it is first row or the text reads 'readOnly'
    }

    if (row === 0) {
      cellProperties.renderer = firstRowRenderer; // uses function directly

    } else {
      cellProperties.renderer = 'negativeValueRenderer'; // uses lookup map
    }

    return cellProperties;
  }
});
```
:::
