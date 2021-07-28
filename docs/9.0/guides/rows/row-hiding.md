---
title: Row hiding
metaTitle: Row hiding - Guide - Handsontable Documentation
permalink: /9.0/row-hiding
canonicalUrl: /row-hiding
---

# Row hiding

[[toc]]

## Overview

The **Hidden Rows** plugin allows hiding specific rows from the table.

## Quick setup

The `hiddenRows` parameter accepts an object. To provide the rows to hide, specify the `rows` property for the object. It should be defined as an array of numbers representing the indexes of rows that need to be hidden.

See [the examples section](#example) for more details.

## Additional options

The plugin provides the option to display hidden row indicators in the headers to notify the user which rows have been hidden. To enable them, set the `indicators` property in the plugin's configuration object to `true`.

To change the selection area of the copy/paste range, set the `copyPasteEnabled` property to `true` or `false`. By default, this property is set to `true`. If set to `false`, the hidden rows are being skipped for copy/paste actions.

To show/hide certain rows directly from the [Context menu](@/guides/accessories-and-menus/context-menu.md), use the following keys: `hidden_rows_show` and `hidden_rows_hide`.

## Example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(12,5),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## API examples

To access the plugin instance call:

```js
const plugin = hot.getPlugin('hiddenRows');
```

To hide a single row, call the `hideRow` method of the plugin object:

```js
plugin.hideRow(4);
```

To hide multiple rows, either pass them as arguments to the `hideRow` method, or pass an array of indexes to the `hideRows` method:

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

To see the changes made, call `hot.render();` to re-render the table.
