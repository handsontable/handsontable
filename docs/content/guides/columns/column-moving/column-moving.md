---
type: how-to
title: Column moving
metaTitle: Column moving - JavaScript Data Grid | Handsontable
description: Change the order of columns, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /column-moving
canonicalUrl: /column-moving
react:
  metaTitle: Column moving - React Data Grid | Handsontable
angular:
  metaTitle: Column moving - Angular Data Grid | Handsontable
vue:
  metaTitle: Column moving - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
---
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

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-moving/angular/example1.ts)
@[code](@/content/guides/columns/column-moving/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/columns/column-moving/vue/example1.vue)

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

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-moving/angular/example2.ts)
@[code](@/content/guides/columns/column-moving/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/columns/column-moving/vue/example2.vue)

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

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-moving/angular/example3.ts)
@[code](@/content/guides/columns/column-moving/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/columns/column-moving/vue/example3.vue)

:::

:::

## Set a pre-defined column order

Instead of setting [`manualColumnMove`](@/api/options.md#manualcolumnmove) to `true`, you can pass an **array of physical column indexes** to define the initial visual order of columns on render.

Each position in the array corresponds to a visual (display) position, and the value at that position is the physical (source data) column index. For example:

```js
manualColumnMove: [1, 0, 2]
```

This renders the columns in the following order:
- Visual position 0 → physical column `1`
- Visual position 1 → physical column `0`
- Visual position 2 → physical column `2`

The array must contain all physical column indexes (its length must equal the total number of columns). After the initial render, users can still drag columns to change the order further.

## Drag and move actions of the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin

There are significant differences between the plugin's [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) and [`moveColumns`](@/api/manualColumnMove.md#movecolumns) API functions. Both of them change the order of columns, but they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

Both of these methods trigger the [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks, but only [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) passes the [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) argument to them.

The [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) method has a [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) parameter, which points to where the elements are being dropped.

<span class="img-invert">

![dragColumns method](/img/drag_action.svg)

</span>

The [`moveColumns`](@/api/manualColumnMove.md#movecolumns) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

<span class="img-invert">

![moveColumns method](/img/move_action.svg)

</span>

The [`moveColumns`](@/api/manualColumnMove.md#movecolumns) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](@/api/manualColumnMove.md#ismovepossible) API method and the `movePossible` parameters [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks help in determine such situations.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [manualColumnMove](@/api/options.md#manualcolumnmove)

</div>

**Core methods**

<div class="boxes-list">

- [colToProp()](@/api/core.md#coltoprop)
- [isColumnModificationAllowed()](@/api/core.md#iscolumnmodificationallowed)
- [propToCol()](@/api/core.md#proptocol)
- [toPhysicalColumn()](@/api/core.md#tophysicalcolumn)
- [toVisualColumn()](@/api/core.md#tovisualcolumn)

</div>

**Hooks**

<div class="boxes-list">

- [afterColumnMove](@/api/hooks.md#aftercolumnmove)
- [beforeColumnMove](@/api/hooks.md#beforecolumnmove)

</div>

**Plugins**

<div class="boxes-list">

- [ManualColumnMove](@/api/manualColumnMove.md)

</div>
