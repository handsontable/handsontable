---
title: Column hiding
metaTitle: Column hiding - Guide - Handsontable Documentation
permalink: /next/column-hiding
canonicalUrl: /column-hiding
---

# Column hiding

[[toc]]

You can hide columns, using the [`HiddenColumns`](@/api/hiddenColumns.md) plugin.

## About column hiding

"Hiding a column" means that the hidden column doesn't get rendered as a DOM element.

When you're hiding a column:
- The source data doesn't get modified.
- The [`HiddenColumns`](@/api/hiddenColumns.md) plugin doesn't participate in data transformation<br>(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

## Enabling column hiding

To simply enable column hiding (without further configuration), set the [`hiddenColumns`](@/api/metaSchema.md#hiddencolumns) [configuration option](@/guides/getting-started/setting-options.md) to `true`:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: true,
});
```
:::

## Setting up column hiding

To set up your column hiding configuration, follow the steps below.

### Step 1: Specify columns hidden by default

To both enable column hiding and specify columns hidden by default, set the [`hiddenColumns`](@/api/metaSchema.md#hiddencolumns) [configuration option](@/guides/getting-started/setting-options.md)  to an object.

In the object, add a `columns` property, and set it to an array of column indexes.

Now, those columns are hidden by default:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenColumns` plugin
  hiddenColumns: {
    // specify columns hidden by default
    columns: [3, 5, 9]
  }
});
```
:::

### Step 2: Show UI indicators

To easily see which columns are currently hidden, display UI indicators.

To enable the UI indicators, in the `hiddenColumns` object, set the `indicators` property to `true`:

::: tip
If you use both the [`NestedHeaders`](@/api/nestedheaders.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin, you also need to set the `colHeaders` property to `true`. Otherwise, `indicators` won't work.
:::

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  hiddenColumns: {
    columns: [3, 5, 9],
    // show UI indicators to mark hidden columns
    indicators: true
  }
});
```
:::

### Step 3: Set up context menu items

To easily hide and unhide columns, add column hiding items to Handsontable's [context menu](@/guides/accessories-and-menus/context-menu.md).

Enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenColumns`](@/api/hiddenColumns.md) plugin. Now, the [context menu](@/guides/accessories-and-menus/context-menu.md) automatically displays additional items for hiding and unhiding columns.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenColumns` plugin
  // automatically adds the context menu's column hiding items
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  }
});
```
:::

You can also add the column hiding menu items individually, by adding the [`hidden_columns_show`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) and [`hidden_columns_hide`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) strings to the `contextMenu` parameter:

::: example #example5
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  // individually add column hiding context menu items
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true
  }
});
```
:::

### Step 4: Set up copy and paste behavior

By default, hidden columns are included in copying and pasting.

To exclude hidden columns from copying and pasting, in the `hiddenColumns` object, set the `copyPasteEnable` property to `false`:

::: example #example6
```js
const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(5, 12),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: [`hidden_columns_show`, `hidden_columns_hide`],
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
    // exclude hidden columns from copying and pasting
    copyPasteEnabled: false
  }
});
```
:::

## Column hiding API methods

For the most popular column hiding tasks, use the API methods below.

To see your changes, re-render your Handsontable instance with the [`render()`](@/api/core.md#render) method.

### Accessing the `HiddenColumns` plugin instance

To access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance, use the [`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenColumns');
```

### Hiding a single column

To hide a single column, use the [`hideColumn()`](@/api/hiddencolumns.md#hidecolumn) method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(4);
```

### Hiding multiple columns

To hide multiple columns:
- Either pass column indexes as arguments to the `hideColumn()` method
- Or pass an array of column indexes to the `hideColumns()` method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(0, 4, 6);
// or
plugin.hideColumns([0, 4, 6]);
```

### Unhiding a single column

To unhide a single column, use the `showColumn()` method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(4);
```

### Unhiding multiple columns

To unhide multiple columns:
- Either pass column indexes as arguments to the `showColumn()` method
- Or pass an array of column indexes to the `showColumns()` method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(0, 4, 6);
// or
plugin.showColumns([0, 4, 6]);
```