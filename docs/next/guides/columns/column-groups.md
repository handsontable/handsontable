---
title: Column groups
metaTitle: Column groups - Guide - Handsontable Documentation
permalink: /next/column-groups
canonicalUrl: /column-groups
tags:
  - nested headers
  - collapsing columns
---

# Column groups

[[toc]]

## Overview

Columns in Handsontable may be grouped using multiple levels of headers. We refer to them as "nested headers" as they utilize a tree structure.

## Nested headers

The **Nested Headers** plugin allows creating a nested header structure using the `colspan` attribute. The header cannot be wider than its parent element, i.e., headers cannot overlap each other.

To make a header that spans across multiple columnns, its corresponding configuration array element should be provided as an object with `label` and `colspan` properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

The maximum value for `colspan` for nested headers is 1000, meaning that the maximum number of columns that a header can span is 1000.  This constraint is based on [_HTML table specification_](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan), which sets the limit of `colspan` to 1000.

### Configuration

```js
nestedHeaders: [
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
]
```

### Example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
    ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Collapsible headers

The **Collapsible Columns** plugin enables columns and their headers to be collapsed/expanded.

This plugin adds multi-column headers which have buttons. Clicking these buttons will collapse or expand all "child" headers, leaving the first one visible.

The [Nested Headers](#nested-headers.md) plugin needs to be enabled for this to work properly.

### Configuration

To enable the Collapsible Columns plugin, either set the `collapsibleColumns` property to:

* `true` - this will enable the functionality for _all_ multi-column headers, every column with the `colspan` attribute defined will be extended with the "expand/collapse" button
* An array of objects containing information specifying which headers should have the "expand/collapse" buttons for example:

```js
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true } // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
]
```

### Example

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5, 10),
  colHeaders: true,
  rowHeaders: true,
  colWidths: 60,
  height: 'auto',
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
    ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
  collapsibleColumns: [
    { row: -4, col: 1, collapsible: true },
    { row: -3, col: 1, collapsible: true },
    { row: -2, col: 1, collapsible: true },
    { row: -2, col: 3, collapsible: true }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
