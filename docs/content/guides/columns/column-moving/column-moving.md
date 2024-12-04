---
id: aq1vywt4
title: Column moving
metaTitle: Column moving - JavaScript Data Grid | Handsontable
description: Change the order of columns, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /column-moving
canonicalUrl: /column-moving
react:
  id: zhlikwwh
  metaTitle: Column moving - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column moving

Change the order of columns, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).

[[toc]]

## Enable the plugin

To enable column moving, set the [`manualColumnMove`](@/api/options.md#manualcolumnmove) configuration option to `true`.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the grid.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/javascript/example1.js)
@[code](@/content/guides/columns/column-moving/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/react/example1.jsx)
@[code](@/content/guides/columns/column-moving/react/example1.tsx)

:::

:::

#### Move column headers

When you move columns, the default column headers (A, B, C) stay in place.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/javascript/example2.js)
@[code](@/content/guides/columns/column-moving/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/react/example2.jsx)
@[code](@/content/guides/columns/column-moving/react/example2.tsx)

:::

:::

But, if you configure the [`colHeaders`](@/api/options.md#colheaders) option with your own column labels (e.g., One, Two, Three), your headers move along with the columns.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/javascript/example3.js)
@[code](@/content/guides/columns/column-moving/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-moving/react/example3.jsx)
@[code](@/content/guides/columns/column-moving/react/example3.tsx)

:::

:::

## Drag and move actions of the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin

There are significant differences between the plugin's [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) and [`moveColumns`](@/api/manualColumnMove.md#movecolumns) API functions. Both of them change the order of columns, but they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

Both of these methods trigger the [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks, but only [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) passes the [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) argument to them.

The [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) method has a [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) parameter, which points to where the elements are being dropped.

<span class="img-invert">

![dragColumns method]({{$basePath}}/img/drag_action.svg)

</span>

The [`moveColumns`](@/api/manualColumnMove.md#movecolumns) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

<span class="img-invert">

![moveColumns method]({{$basePath}}/img/move_action.svg)

</span>

The [`moveColumns`](@/api/manualColumnMove.md#movecolumns) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](@/api/manualColumnMove.md#ismovepossible) API method and the `movePossible` parameters [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks help in determine such situations.

## Related API reference

- Configuration options:
  - [`manualColumnMove`](@/api/options.md#manualcolumnmove)
- Core methods:
  - [`colToProp()`](@/api/core.md#coltoprop)
  - [`isColumnModificationAllowed()`](@/api/core.md#iscolumnmodificationallowed)
  - [`propToCol()`](@/api/core.md#proptocol)
  - [`toPhysicalColumn()`](@/api/core.md#tophysicalcolumn)
  - [`toVisualColumn()`](@/api/core.md#tovisualcolumn)
- Hooks:
  - [`afterColumnMove`](@/api/hooks.md#aftercolumnmove)
  - [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove)
- Plugins:
  - [`ManualColumnMove`](@/api/manualColumnMove.md)
