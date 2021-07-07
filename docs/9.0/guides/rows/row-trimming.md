---
title: Row trimming
metaTitle: Row trimming - Guide - Handsontable Documentation
permalink: /9.0/row-trimming
canonicalUrl: /row-trimming
---

# Row trimming

[[toc]]

## Overview

The _Trim Rows_ plugin allows the trimming of specific rows from the table. Rows being trimmed **aren't rendered** and **aren't included** in a `DataMap`, which can be retrieved by calling the [getData](@/api/core.md#getdata) method.

## Setup

The `trimRows` property needs to be set to an array of row indexes to enable the plugin.
See the [examples](#example) section for a live demo.

## Example

Note that the second, third, and sixth rows are missing in the following example:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 4),
  colHeaders: true,
  rowHeaders: true,
  trimRows: [1, 2, 5],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## API examples

The plugin instance can be accessed by calling:

```js
const plugin = hot.getPlugin('trimRows');
```

To trim a single row, call the `trimRow` method of the plugin object:

```js
plugin.trimRow(4);
```
To trim multiple rows, either pass them as arguments to the `trimRow` method, or pass an array of indexes to the `trimRows` method:

```js
plugin.trimRow(0, 4, 6);
// or
plugin.trimRows([0, 4, 6]);
```

To restore the trimmed row(s), use the following methods:

```js
plugin.untrimRow(4);
```
```js
plugin.untrimRow(0, 4, 6);
```
```js
plugin.untrimRows([0, 4, 6]);
```

To see the changes made, call `hot.render();` to re-render the table.
