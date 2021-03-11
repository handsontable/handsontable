---
title: Nested headers
permalink: /8.6/nested-headers
canonicalUrl: /nested-headers
---

# {{ $frontmatter.title }}

[[toc]]

## Overview

The _Nested Rows_ plugin allows creating a nested header structure, using the `colspan` attribute.

**Note:** the plugin supports a _nested_ structure, which means that a header cannot be wider than its "parent" element. In other words, headers cannot overlap each other.

## Setup

To make a header wider (covering multiple columns), its corresponding configuration array element should be provided as an object with `label` and `colspan` properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

For example:

```js
nestedHeaders: [
  ['A', {label: 'B', colspan: 8}, 'C'],
  ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
  ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
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
  nestedHeaders: [
    ['A', {label: 'B', colspan: 8}, 'C'],
    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ]
});
```
:::

## Limitations

The maximum number for `colspan` value of nested headers is 1000. This constraint is based on [_HTML table specification_](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan) which sets the limit of `colspan` to 1000.
