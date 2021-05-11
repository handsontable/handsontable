---
title: Row hiding
permalink: /next/row-hiding
canonicalUrl: /row-hiding
---

# Row hiding

[[toc]]

## Overview

The **Hidden Rows** plugin allows hiding specific rows from the table.

## Quick setup

The `hiddenRows` parameter accepts an object. To provide the rows to hide, you need to specify the `rows` property for the object - it should be defined as an array of numbers, which represents the indexes of rows that need to be hidden.

See [the examples section](#example) for more details.

## Additional options

The plugin allows displaying hidden row indicators in the headers, to notify the user which rows have been hidden.
To enable them, set the `indicators` property in the plugin's configuration object to `true`.

You can change the selection area of copy/paste range by setting `copyPasteEnabled` property to `true` or `false`. By default this property is set to `true`. If set to `false`, then hidden rows are being skipped for copy/paste actions.

You can show/hide certain rows straight from the [Context menu](context-menu.md) using the following keys: `hidden_rows_show` and `hidden_rows_hide`.

## Example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(12,5),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## API examples

You can access the plugin instance by calling

```js
const plugin = hot.getPlugin('hiddenRows');
```

To hide a single row, call the `hideRow` method of the plugin object:

```js
plugin.hideRow(4);
```

To hide multiple rows, you can either pass them as arguments to the `hideRow` method, or pass an array of indexes to the `hideRows` method:

```js
plugin.hideRow(0, 4, 6);
// or
plugin.hideRows([0, 4, 6]);
```

To restore the hidden row(s), use the following methods:

```js
plugin.showRow(4);
```
```js
plugin.showRow(0, 4, 6);
```
```js
plugin.showRows([0, 4, 6]);
```

To see the changes you made, call `hot.render();` to re-render the table.
