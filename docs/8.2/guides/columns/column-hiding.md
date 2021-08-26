---
title: Column hiding
metaTitle: Column hiding - Guide - Handsontable Documentation
permalink: /8.2/column-hiding
canonicalUrl: /column-hiding
---

# Column hiding

[[toc]]

Use the [`HiddenColumns`](@/api/hiddenColumns.md) plugin to hide specific columns in your table.

## About column hiding

"Hiding a column" means that the hidden column doesn't get rendered.

The [`HiddenColumns`](@/api/hiddenColumns.md) plugin doesn't modify the source data, and doesn't participate in data transformation (the shape of data returned by the [`getData*` methods](@/api/core.md#getdata) stays intact).

## Enabling column hiding

To simply enable column hiding (without further configuration), set the [`hiddenColumns` option](@/api/metaSchema.md#hiddencolumns) to `true`:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Setting up column hiding

To set up your column hiding configuration, follow the steps below.

### Step 1: Specify columns hidden by default

To both enable column hiding and hide specific columns by default, set the [`hiddenColumns` option](@/api/metaSchema.md#hiddencolumns) to an object.

In the object, add a `columns` property, and set it to an array of column indexes if your choice. Those columns are now hidden by default:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: {
    // specify columns that are hidden by default
    columns: [3, 5, 9]
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Step 2: Show UI indicators

Handsontable can display UI indicators that let your end user see where columns are currently hidden.

To enable the UI indicators, in the `hiddenColumns` object, set the `indicators` property to `true`:

::: tip
If you use both the [`NestedHeaders`](@/api/nestedheaders.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin, you also need to set the `colHeaders` property to `true`. Otherwise, `indicators` won't work.
:::

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  hiddenColumns: {
    columns: [3, 5, 9],
    // show UI indicators to mark hidden columns
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Step 3: Set up context menu items

If you enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin, the [context menu](@/guides/accessories-and-menus/context-menu.md) automatically displays additional items that let your end user hide or show columns:

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enabling the `HiddenColumns` plugin
  // automatically adds the context menu's column hiding items
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

You can also add the column hiding menu items individually, by adding the [`hidden_columns_show`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) and [`hidden_columns_hide`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) strings to the `contextMenu` parameter:

::: example #example5
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  // individually add column hiding context menu items
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Step 4: Set up copy and paste behavior

By default, hidden columns are included when the end user copies and pastes data.

To exclude hidden columns from copying and pasting, in the `hiddenColumns` object, set the `copyPasteEnable` property to `false`:

::: example #example6
```js
const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(5,12),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
    // exclude hidden columns from copying and pasting
    copyPasteEnabled: false
  },
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Column hiding API methods

For the most popular column hiding tasks, use the API methods below.

To see the changes that you made, re-render your table with the [`hot.render()`](@/api/core.md#render) method afterward.

### Accessing the `HiddenColumns` plugin instance

To access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance, call the [`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenColumns');
```

### Hiding a single column

To hide a single column, call the [`hideColumn()`](@/api/hiddencolumns.md#hidecolumn) method of the [`HiddenColumns`](@/api/hiddenColumns.md) plugin object:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(4);
```

### Hiding multiple columns

To hide multiple columns:
- Either pass column indexes as arguments to the `hideColumn` method
- Or pass an array of column indexes to the `hideColumns` method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(0, 4, 6);
// or
plugin.hideColumns([0, 4, 6]);
```

### Showing hidden columns

To restore hidden column(s), use the following methods:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(4);
// or
plugin.showColumn(0, 4, 6);
// or
plugin.showColumns([0, 4, 6]);
```
