---
title: Column groups
permalink: /next/column-groups
canonicalUrl: /column-groups
---

# {{ $frontmatter.title }}

[[toc]]

## Overview

Columns in Handsontable may be grouped using multiple levels of headers. We prefer to call them "nested headers" as they utilize a tree structure.

## Nested headers

The **Nested Headers** plugin allows creating a nested header structure using the `colspan` attribute. The header cannot be wider than its parent element. In other words, headers cannot overlap each other.

To make a header to span across multiple columnns, its corresponding configuration array element should be provided as an object with `label` and `colspan` properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

The maximum number for `colspan` value of nested headers is 1000. This constraint is based on [_HTML table specification_](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan) which sets the limit of `colspan` to 1000.

### Configuration

```js
nestedHeaders: [
  ['A', {label: 'B', colspan: 8}, 'C'],
  ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
  ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
]
```

### Example

::: example #example1
```js
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
  data: Handsontable.helper.createSpreadsheetData(5,10),
  colHeaders: true,
  rowHeaders: true,
  nestedHeaders: [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Collapsible headers

The **Collapsible Columns** plugin enables to collapse/expand the columns and their headers.

This plugin adds button multi-column headers. Clicking these button will collapse or expands all "child" headers, leaving the first one visible.

You'll need to enable the [Nested Headers](nested-headers.md) plugin in order for this plugin to work properly.

### Configuration

To enable the Collapsible Columns plugin, you can either set the `collapsibleColumns` property to:

* `true` - this will enable the functionality for _all_ multi-column headers. (Every column with the `colspan` attribute defined will be extended with the "expand/collapse" button)
* an array of objects containing information about which headers should have the "expand/collapse" buttons. The structure in this case looks like this:

  ```js
  collapsibleColumns: [
    {row: -4, col: 1, collapsible: true}, // Add the button to the 4th-level (counting from the first table row upwards) header of the 1st column.
    {row: -3, col: 5, collapsible: true} // Add the button to the 3rd-level (counting from the first table row upwards) header of the 5th column.
  ]
  ```

### Example

::: example #example2
```js
var example2 = document.getElementById('example2');
var hot2 = new Handsontable(example2, {
  data: Handsontable.helper.createSpreadsheetData(5,10),
  colHeaders: true,
  rowHeaders: true,
  colWidths: 60,
  nestedHeaders: [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
  collapsibleColumns: [
    {row: -4, col: 1, collapsible: true},
    {row: -3, col: 1, collapsible: true},
    {row: -2, col: 1, collapsible: true},
    {row: -2, col: 3, collapsible: true}
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
