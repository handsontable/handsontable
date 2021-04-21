---
title: Collapsing columns
permalink: /next/collapsing-columns
canonicalUrl: /collapsing-columns
---

# {{ $frontmatter.title }}

[[toc]]

## Overview

The _Collapsible Columns_ plugin enables collapsing columns, covered by a header with the `colspan` property defined.
The plugin adds a "expand/collapse" button multi-column headers (created with the Nested Headers plugin). Clicking these buttons will collapse (or expands) all "child" headers, leaving the first one visible.

**Node:** You'll need to enable the [Nested Headers](nested-headers.md) plugin in order for this plugin to work properly.

**Note:** Please keep in mind that collapsed rows **are included** in a `DataMap` (gets by the [getData](api/core.md#getData) method), but they **aren't rendered**.

## Setup and configuration

To enable the Collapsible Columns plugin, you can either set the `collapsibleColumns` property to:

* `true` - this will enable the functionality for _all_ multi-column headers. (Every column with the `colspan` attribute defined will be extended with the "expand/collapse" button)
* an array of objects containing information about which headers should have the "expand/collapse" buttons. The structure in this case looks like this:

  ```
  collapsibleColumns: [
    {row: -4, col: 1, collapsible: true}, // Add the button to the 4th-level (counting from the first table row upwards) header of the 1st column.
    {row: -3, col: 5, collapsible: true} // Add the button to the 3rd-level (counting from the first table row upwards) header of the 5th column.
  ]
  ```

## Example

::: example #example1
```js
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
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
  ]
});
```
:::
