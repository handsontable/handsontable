---
title: Header tooltips [deprecated]
permalink: /8.6/header-tooltips
canonicalUrl: /8.6/header-tooltips
---

# {{ $frontmatter.title }}

[[toc]]

::: warning Deprecated plugin
This plugin is deprecated and will be removed in the next major release.
:::

## Overview

The _headerTooltips_ plugin allows adding tooltips to the table headers. These tooltips contain the header's label. It a useful feature when the label is wider than the header that is holding it.

## Quick setup

To enable the plugin, you simply need to set the `headerTooltips` property to `true` in Handsontable configuration. This will enable the the tooltips for both rows and columns.

## Available options

Instead of setting the `headerTooltips` property to `true`, you can define it as an object containing these options:

* the `rows` property defines if tooltips should be added to row headers,
* the `columns` property defines if tooltips should be added to column headers,
* the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).

See the examples for a live preview. Hover a mouse cursor over the header to see the tooltip.

## Live examples

### Tooltips displayed for both row and column headers

::: example #example1
```js
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
  data: Handsontable.helper.createSpreadsheetData(5,10),
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  headerTooltips: true
});
```
:::

### Tooltips displayed only for column headers, and only if their content's width exceeds the header width

::: example #example2
```js
var example2 = document.getElementById('example2');
var hot2 = new Handsontable(example2, {
  data: Handsontable.helper.createSpreadsheetData(4,7),
  width: '100%',
  height: 'auto',
  rowHeaders: true,
  colHeaders: ['A', 'B', 'Long column header label', 'D', 'Another long label', 'E', 'F'],
  colWidths: [null, null, 40, null, 50],
  headerTooltips: {
    rows: false,
    columns: true,
    onlyTrimmed: true
  }
});
```
:::
