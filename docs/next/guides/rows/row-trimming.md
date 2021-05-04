---
title: Row trimming
permalink: /next/row-trimming
canonicalUrl: /row-trimming
---

# Row trimming

[[toc]]

## Overview

The _Trim Rows_ plugin allows trimming specific rows from the table. Rows being trimmed **aren't included** in a `DataMap` (gets by the [getData](api/core.md#getData) method) and they **aren't rendered**.

## Setup

To enable the plugin, you need to set the `trimRows` property to an array of row indexes.
See the [examples](#example) section for a live demo.

## Example

Note that the second, third and sixth rows are missing.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 4),
  colHeaders: true,
  rowHeaders: true,
  trimRows: [1, 2, 5],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## API examples

You can access the plugin instance by calling

```js
const plugin = hot.getPlugin('trimRows');
```

To trim a single row, call the `trimRow` method of the plugin object:

```js
plugin.trimRow(4);
```
To trim multiple rows, you can either pass them as arguments to the `trimRow` method, or pass an array of indexes to the `trimRows` method:

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

To see the changes you made, call `hot.render();` to re-render the table.
