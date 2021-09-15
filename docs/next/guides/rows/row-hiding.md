---
title: Row hiding
metaTitle: Row hiding - Guide - Handsontable Documentation
permalink: /next/row-hiding
canonicalUrl: /row-hiding
---

# Row hiding

[[toc]]

You can hide rows, using the [`HiddenRows`](@/api/hiddenRows.md) plugin.

## About row hiding

"Hiding a row" means that the hidden row doesn't get rendered as a DOM element.

When you're hiding a row:
- The source data doesn't get modified.
- The [`HiddenRows`](@/api/hiddenRows.md) plugin doesn't participate in data transformation<br>(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

## Enabling row hiding

To simply enable row hiding (without further configuration), set the [`hiddenRows`](@/api/metaSchema.md#hiddenrows) [configuration option](@/guides/getting-started/setting-options.md) to `true`:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenRows` plugin
  hiddenRows: true
});
```
:::

## Setting up row hiding

To set up your row hiding configuration, follow the steps below.

### Step 1: Specify rows hidden by default

To both enable row hiding and specify rows hidden by default, set the [`hiddenRows`](@/api/metaSchema.md#hiddenrows) [configuration option](@/guides/getting-started/setting-options.md)  to an object.

In the object, add a `rows` property, and set it to an array of row indexes.

Now, those rows are hidden by default:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  // enable the `HiddenRows` plugin
  hiddenRows: {
    // specify rows hidden by default
    rows: [3, 5, 9]
  }
});
```
:::

### Step 2: Show UI indicators

To easily see which rows are currently hidden, display UI indicators.

To enable the UI indicators, in the `hiddenRows` object, set the `indicators` property to `true`:

::: tip
If you use both the [`NestedHeaders`](@/api/nestedheaders.md) plugin and the [`HiddenRows`](@/api/hiddenRows.md) plugin, you also need to set the `colHeaders` property to `true`. Otherwise, `indicators` won't work.
:::

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: {
    rows: [3, 5, 9],
    // show UI indicators to mark hidden rows
    indicators: true
  }
});
```
:::

### Step 3: Set up context menu items

To easily hide and unhide rows, add row hiding items to Handsontable's [context menu](@/guides/accessories-and-menus/context-menu.md).

Enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenRows`](@/api/hiddenRows.md) plugin. Now, the [context menu](@/guides/accessories-and-menus/context-menu.md) automatically displays additional items for hiding and unhiding rows.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenRows` plugin
  // automatically adds the context menu's row hiding items
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true
  }
});
```
:::

You can also add the row hiding menu items individually, by adding the [`hidden_rows_show`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) and [`hidden_rows_hide`](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) strings to the `contextMenu` parameter:

::: example #example5
```js
const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  // individually add row hiding context menu items
  contextMenu: [`hidden_rows_show`, `hidden_rows_hide`],
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true
  }
});
```
:::

### Step 4: Set up copy and paste behavior

By default, hidden rows are included in copying and pasting.

To exclude hidden rows from copying and pasting, in the `hiddenRows` object, set the `copyPasteEnable` property to `false`:

::: example #example6
```js
const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: Handsontable.helper.createSpreadsheetData(12, 5),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: [`hidden_rows_show`, `hidden_rows_hide`],
  hiddenRows: {
    rows: [3, 5, 9],
    indicators: true,
    // exclude hidden rows from copying and pasting
    copyPasteEnabled: false
  }
});
```
:::

## Row hiding API methods

For the most popular row hiding tasks, use the API methods below.

To see your changes, re-render your Handsontable instance with the [`render()`](@/api/core.md#render) method.

### Accessing the `HiddenRows` plugin instance

To access the [`HiddenRows`](@/api/hiddenRows.md) plugin instance, use the [`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenRows');
```

### Hiding a single row

To hide a single row, use the [`hideRow()`](@/api/hiddenrows.md#hiderow) method:

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.hideRow(4);
```

### Hiding multiple rows

To hide multiple rows:
- Either pass row indexes as arguments to the `hideRow()` method
- Or pass an array of row indexes to the `hideRows()` method

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.hideRow(0, 4, 6);
// or
plugin.hideRows([0, 4, 6]);
```

### Unhiding a single row

To unhide a single row, use the `showRow()` method:

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.showRow(4);
```

### Unhiding multiple rows

To unhide multiple rows:
- Either pass row indexes as arguments to the `showRow()` method
- Or pass an array of row indexes to the `showRows()` method

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.showRow(0, 4, 6);
// or
plugin.showRows([0, 4, 6]);
```