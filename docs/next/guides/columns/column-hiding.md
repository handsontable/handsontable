---
title: Column hiding
permalink: /next/column-hiding
canonicalUrl: /column-hiding
---

# Column hiding

[[toc]]

## Overview

The **Hidden Columns** plugin allows hiding specific columns from the table.

## Quick setup

The `hiddenColumns` parameter accepts an object. To provide the columns to hide, you need to specify the `columns` property for the object - it should be defined as an array of numbers, which represent the indexes of columns that need to be hidden.

## Additional options

The plugin allows displaying hidden column indicators in the headers, to notify the user which columns have been hidden.
To enable them, set the `indicators` property in the plugin's configuration object to `true`.

**Important note**: if you want to use both `nestedHeaders` and `hiddenColumns` alongside `indicators` you need to enable `colHeaders` option. Otherwise, the `indicators` will not appear.

You can change the selection area of copy/paste range by setting `copyPasteEnabled` property to `true` or `false`. By default this property is set to `true`. If set to `false`, then hidden columns are being skipped for copy/paste actions.

You can show/hide certain columns straight from the [Context menu](context-menu.md) using the following keys: `hidden_columns_show` and `hidden_columns_hide`.

## Example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Popular API methods

You can access the plugin instance by calling

```js
const plugin = hot.getPlugin('hiddenColumns');
```

To hide a single column, call the `hideColumn` method of the plugin object:

```js
plugin.hideColumn(4);
```

To hide multiple columns, you can either pass them as arguments to the `hideColumn` method, or pass an array of indexes to the `hideColumns` method:

```js
plugin.hideColumn(0, 4, 6);
// or
plugin.hideColumns([0, 4, 6]);
```

To restore the hidden column(s), use the following methods:

```js
plugin.showColumn(4);
```
```js
plugin.showColumn(0, 4, 6);
```
```js
plugin.showColumns([0, 4, 6]);
```
To see the changes you made, call `hot.render();` to re-render the table.
