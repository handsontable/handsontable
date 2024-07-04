---
id: 37786931
title: Row hiding
metaTitle: Row hiding - JavaScript Data Grid | Handsontable
description: Hide individual rows to avoid rendering them as DOM elements. It helps you reduce screen clutter and improve the grid's performance.
permalink: /row-hiding
canonicalUrl: /row-hiding
react:
  id: al1djb6l
  metaTitle: Row hiding - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row hiding

Hide individual rows to avoid rendering them as DOM elements. It helps you reduce screen clutter and improve the grid's performance.

[[toc]]

## Overview

"Hiding a row" means that the hidden row doesn't get rendered as a DOM element.

When you're hiding a row:
- The source data doesn't get modified.
- The [`HiddenRows`](@/api/hiddenRows.md) plugin doesn't participate in data transformation<br>(the shape of the data returned by the [`getData*()` methods](@/api/core.md#getdata) stays intact).

## Enable row hiding

To enable row hiding, use the [`hiddenRows`](@/api/options.md#hiddenrows) option.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example1.js)
@[code](@/content/guides/rows/row-hiding/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example1.jsx)
@[code](@/content/guides/rows/row-hiding/react/example1.tsx)

:::

:::

## Set up row hiding

To set up your row hiding configuration, follow the steps below.

### Step 1: Specify rows hidden by default

To both enable row hiding and specify rows hidden by default, set the [`hiddenRows`](@/api/options.md#hiddenrows) configuration option  to an object.

In the object, add a `rows` property, and set it to an array of row indexes.

Now, those rows are hidden by default:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example2.js)
@[code](@/content/guides/rows/row-hiding/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example2.jsx)
@[code](@/content/guides/rows/row-hiding/react/example2.tsx)

:::

:::

### Step 2: Show UI indicators

To easily see which rows are currently hidden, display UI indicators.

To enable the UI indicators, in the `hiddenRows` object, set the `indicators` property to `true`:

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example3.js)
@[code](@/content/guides/rows/row-hiding/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example3.jsx)
@[code](@/content/guides/rows/row-hiding/react/example3.tsx)

:::

:::

### Step 3: Set up context menu items

To easily hide and unhide rows, add row hiding items to Handsontable's [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

Enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the [`HiddenRows`](@/api/hiddenRows.md) plugin. Now, the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) automatically displays additional items for hiding and unhiding rows.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example4.js)
@[code](@/content/guides/rows/row-hiding/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example4.jsx)
@[code](@/content/guides/rows/row-hiding/react/example4.tsx)

:::

:::

You can also add the row hiding menu items individually, by adding the [`hidden_rows_show`](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) and [`hidden_rows_hide`](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) strings to the `contextMenu` parameter:

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example5.js)
@[code](@/content/guides/rows/row-hiding/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example5.jsx)
@[code](@/content/guides/rows/row-hiding/react/example5.tsx)

:::

:::

### Step 4: Set up copy and paste behavior

By default, hidden rows are included in copying and pasting.

To exclude hidden rows from copying and pasting, in the `hiddenRows` object, set the `copyPasteEnabled` property to `false`:

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/javascript/example6.js)
@[code](@/content/guides/rows/row-hiding/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-hiding/react/example6.jsx)
@[code](@/content/guides/rows/row-hiding/react/example6.tsx)

:::

:::

## Row hiding API methods

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

For the most popular row hiding tasks, use the API methods below.

To see your changes, re-render your Handsontable instance with the [`render()`](@/api/core.md#render) method.

### Access the `HiddenRows` plugin instance

To access the [`HiddenRows`](@/api/hiddenRows.md) plugin instance, use the [`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenRows');
```

### Hide a single row

To hide a single row, use the [`hideRow()`](@/api/hiddenRows.md#hiderow) method:

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.hideRow(4);
```

### Hide multiple rows

To hide multiple rows:
- Either pass row indexes as arguments to the `hideRow()` method
- Or pass an array of row indexes to the `hideRows()` method

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.hideRow(0, 4, 6);
// or
plugin.hideRows([0, 4, 6]);
```

### Unhide a single row

To unhide a single row, use the `showRow()` method:

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.showRow(4);
```

### Unhide multiple rows

To unhide multiple rows:
- Either pass row indexes as arguments to the `showRow()` method
- Or pass an array of row indexes to the `showRows()` method

```js
const plugin = hot.getPlugin('hiddenRows');

plugin.showRow(0, 4, 6);
// or
plugin.showRows([0, 4, 6]);
```

## Related API reference

- Configuration options:
  - [`hiddenRows`](@/api/options.md#hiddenrows)
- Hooks:
  - [`afterHideRows`](@/api/hooks.md#afterhiderows)
  - [`afterUnhideRows`](@/api/hooks.md#afterunhiderows)
  - [`beforeHideRows`](@/api/hooks.md#beforehiderows)
  - [`beforeUnhideRows`](@/api/hooks.md#beforeunhiderows)
- Plugins:
  - [`HiddenRows`](@/api/hiddenRows.md)
