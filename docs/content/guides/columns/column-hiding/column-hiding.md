---
id: 6elqkmhr
title: Column hiding
metaTitle: Column hiding - JavaScript Data Grid | Handsontable
description:
  Hide individual columns to avoid rendering them as DOM elements. It helps you reduce screen
  clutter and improve the grid's performance.
permalink: /column-hiding
canonicalUrl: /column-hiding
react:
  id: u1aw329h
  metaTitle: Column hiding - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column hiding

Hide individual columns to reduce screen clutter and improve the grid's performance.

[[toc]]

## Overview

"Hiding a column" means that the hidden column doesn't get rendered as a DOM element.

When you're hiding a column:

- The source data doesn't get modified.
- The [`HiddenColumns`](@/api/hiddenColumns.md) plugin doesn't participate in data
  transformation<br>(the shape of the data returned by the
  [`getData*()` methods](@/api/core.md#getdata) stays intact).

## Enable column hiding

To enable column hiding, use the [`hiddenColumns`](@/api/options.md#hiddencolumns) option.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example1.js)
@[code](@/content/guides/columns/column-hiding/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example1.jsx)
@[code](@/content/guides/columns/column-hiding/react/example1.tsx)

:::

:::

## Set up column hiding

To set up your column hiding configuration, follow the steps below.

### Step 1: Specify columns hidden by default

To both enable column hiding and specify columns hidden by default, set the
[`hiddenColumns`](@/api/options.md#hiddencolumns) configuration option to an object.

In the object, add a [`columns`](@/api/options.md#columns) configuration option, and set it to an
array of column indexes.

Now, those columns are hidden by default:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example2.js)
@[code](@/content/guides/columns/column-hiding/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example2.jsx)
@[code](@/content/guides/columns/column-hiding/react/example2.tsx)

:::

:::

### Step 2: Show UI indicators

To easily see which columns are currently hidden, display UI indicators.

To enable the UI indicators, in the [`hiddenColumns`](@/api/options.md#hiddencolumns) object, set
the [`indicators`](@/api/hiddenColumns.md) property to `true`:

::: tip

If you use both the [`NestedHeaders`](@/api/nestedHeaders.md) plugin and the
[`HiddenColumns`](@/api/hiddenColumns.md) plugin, you also need to set the
[`colHeaders`](@/api/options.md#colheaders) property to `true`. Otherwise,
[`indicators`](@/api/hiddenColumns.md) won't work.

:::

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example3.js)
@[code](@/content/guides/columns/column-hiding/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example3.jsx)
@[code](@/content/guides/columns/column-hiding/react/example3.tsx)

:::

:::

### Step 3: Set up context menu items

To easily hide and unhide columns, add column hiding items to Handsontable's
[context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

Enable both the [`ContextMenu`](@/api/contextMenu.md) plugin and the
[`HiddenColumns`](@/api/hiddenColumns.md) plugin. Now, the context menu automatically displays
additional items for hiding and unhiding columns.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example4.js)
@[code](@/content/guides/columns/column-hiding/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example4.jsx)
@[code](@/content/guides/columns/column-hiding/react/example4.tsx)

:::

:::

You can also add the column hiding menu items individually, by adding the
[`hidden_columns_show`](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
and
[`hidden_columns_hide`](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
strings to the[ `contextMenu`](@/api/contextMenu.md) parameter:

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example5.js)
@[code](@/content/guides/columns/column-hiding/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example5.jsx)
@[code](@/content/guides/columns/column-hiding/react/example5.tsx)

:::

:::

### Step 4: Set up copy and paste behavior

By default, hidden columns are included in copying and pasting.

To exclude hidden columns from copying and pasting, in the [`hiddenColumns`](@/api/hiddenColumns.md)
object, set the [`copyPasteEnabled`](@/api/hiddenColumns.md) property to `false`:

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/javascript/example6.js)
@[code](@/content/guides/columns/column-hiding/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-hiding/react/example6.jsx)
@[code](@/content/guides/columns/column-hiding/react/example6.tsx)

:::

:::

## Column hiding API methods

For the most popular column hiding tasks, use the API methods below.

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by
utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

To see your changes, re-render your Handsontable instance with the
[`render()`](@/api/core.md#render) method.

### Access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance

To access the [`HiddenColumns`](@/api/hiddenColumns.md) plugin instance, use the
[`getPlugin()`](@/api/core.md#getplugin) method:

```js
const plugin = hot.getPlugin('hiddenColumns');
```

### Hide a single column

To hide a single column, use the [`hideColumn()`](@/api/hiddenColumns.md#hidecolumn) method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(4);

// re-render your Handsontable instance
hot.render();
```

### Hide multiple columns

To hide multiple columns:

- Either pass column indexes as arguments to the [`hideColumn()`](@/api/hiddenColumns.md#hidecolumn)
  method
- Or pass an array of column indexes to the [`hideColumns()`](@/api/hiddenColumns.md#hidecolumn)
  method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.hideColumn(0, 4, 6);
// or
plugin.hideColumns([0, 4, 6]);

// re-render your Handsontable instance
hot.render();
```

### Unhide a single column

To unhide a single column, use the [`showColumn()`](@/api/hiddenColumns.md#showcolumn) method:

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(4);

// re-render your Handsontable instance
hot.render();
```

### Unhide multiple columns

To unhide multiple columns:

- Either pass column indexes as arguments to the [`showColumn()`](@/api/hiddenColumns.md#showcolumn)
  method
- Or pass an array of column indexes to the [`showColumns()`](@/api/hiddenColumns.md#showcolumns)
  method

```js
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumn(0, 4, 6);
// or
plugin.showColumns([0, 4, 6]);

// re-render your Handsontable instance
hot.render();
```

## Related API reference

- Configuration options:
  - [`hiddenColumns`](@/api/options.md#hiddencolumns)
- Hooks:
  - [`afterHideColumns`](@/api/hooks.md#afterhidecolumns)
  - [`afterUnhideColumns`](@/api/hooks.md#afterunhidecolumns)
  - [`beforeHideColumns`](@/api/hooks.md#beforehidecolumns)
  - [`beforeUnhideColumns`](@/api/hooks.md#beforeunhidecolumns)
- Plugins:
  - [`HiddenColumns`](@/api/hiddenColumns.md)
