---
title: Column hiding
metaTitle: Column hiding - Guide - Handsontable Documentation
permalink: /next/column-hiding
canonicalUrl: /column-hiding
---

# Column hiding

[[toc]]

## Overview

The `HiddenColumns` plugin allows hiding specific columns from the table.

## Quick setup

The `hiddenColumns` parameter accepts an object. The `columns` property needs to be specified for the object to hide specific columns. It should be defined as an array of numbers representing the indexes of columns that need to be hidden.

## Context menu

When you enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin, the [context menu](@/guides/accessories-and-menus/context-menu.md) automatically displays additional menu items to hide and show columns:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
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

You can also add the column hiding menu items by adding the `hidden_columns_show` and `hidden_columns_hide` strings to the `contextMenu` parameter:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Additional options

The plugin has a feature that enables hidden column indicators to be displayed in the headers to notify the user which columns have been hidden.
Set the `indicators` property in the plugin's configuration object to `true` to enable them.

::: tip
**Important note**: The `colHeaders` option needs to be enabled when using both `nestedHeaders` and `hiddenColumns` together with `indicators`. Otherwise, the `indicators` will not appear.
:::


To change the selection area of the copy/paste range, set the `copyPasteEnabled` property to `true` or `false`. By default, this property is set to `true`. If set to `false`, the hidden columns are skipped for copy/paste actions.

## Popular API methods

To access the plugin instance, call the `getPlugin` method:

```js
const plugin = hot.getPlugin('hiddenColumns');
```

To hide a single column, call the `hideColumn` method of the plugin object:

```js
plugin.hideColumn(4);
```

To hide multiple columns, either pass them as arguments to the `hideColumn` method, or pass an array of indexes to the `hideColumns` method:

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
To see the changes made, call `hot.render();` to re-render the table.
