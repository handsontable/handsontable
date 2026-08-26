---
type: how-to
title: Column moving
metaTitle: Column moving - JavaScript Data Grid | Handsontable
description: Change the order of columns, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /column-moving
canonicalUrl: /column-moving
tags:
  - moving
  - manual column move
  - ManualColumnMove
react:
  metaTitle: Column moving - React Data Grid | Handsontable
angular:
  metaTitle: Column moving - Angular Data Grid | Handsontable
vue:
  metaTitle: Column moving - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
menuTag: updated
---
Change the order of columns, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).

[[toc]]

## Enable the plugin

To enable column moving, set the [`manualColumnMove`](@/api/options.md#manualcolumnmove) configuration option to `true`.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the grid.

A column has to be selected before you can drag it. You can start the drag anywhere on the selected column's
header, including on the sorting label when [column sorting](@/guides/rows/rows-sorting/rows-sorting.md) is
enabled. Handsontable tells a click from a drag by whether the pointer moves: press and release without moving
to sort the column, and press and drag to move it.

When column sorting is enabled, only the header label and its sort indicator sort on click. Pressing the header
around them selects the column without sorting it, so you can select a column and drag it in one gesture.

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

For more on how physical and visual indexes relate, see [Understanding data and indexes](@/guides/getting-started/understanding-data-and-indexes/understanding-data-and-indexes.md).

## Data model behavior

Moving columns does not reorder your source data. Handsontable stores the new order as index metadata through its [`IndexMapper`](@/api/indexMapper.md), and leaves the original data untouched. This affects how you read and save the data:

- [`getData()`](@/api/core.md#getdata) returns cells in their current visual order, so it reflects any moves. Call it inside the [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hook to get an order-accurate snapshot to persist.
- [`getSourceData()`](@/api/core.md#getsourcedata) returns cells in their original physical order, ignoring any moves.

### Don't feed the snapshot back into the grid

Sending the reordered snapshot back to the grid as its new data applies the move a second time. [`updateData()`](@/api/core.md#updatedata) keeps the current column order on purpose, so Handsontable re-applies the order map it already holds on top of your already-reordered data. One drag then moves the column twice.

Treat the snapshot as output only. Send it to your backend, and leave the grid's own data alone.

::: only-for react angular vue

The data you bind to [`data`](@/api/options.md#data) does not change when a user moves a column, so you have to decide who owns the order. The two models are the same as for rows, and mixing them causes the same double move -- see [Choose who owns the row order](@/guides/rows/row-moving/row-moving.md#choose-who-owns-the-row-order).

If you let Handsontable own the order, seed the starting order with [`initialState`](@/api/options.md#initialstate) rather than [`manualColumnMove`](@/api/options.md#manualcolumnmove). Handsontable reads [`initialState`](@/api/options.md#initialstate) only when it creates the grid, so a re-render can't apply the order a second time:

```js
initialState: {
  manualColumnMove: [1, 0, 2],
},
```

The array both enables column moving and sets the starting order, so don't also pass [`manualColumnMove`](@/api/options.md#manualcolumnmove) at the top level. A regular setting takes precedence over the same key in [`initialState`](@/api/options.md#initialstate), so `manualColumnMove: true` alongside the code above would discard the order.

If you own the order yourself, cancel the move by returning `false` from [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and reorder your own data. Reordering columns means reordering each row's cells, or reordering your [`columns`](@/api/options.md#columns) definitions, so it takes more work than reordering rows.

:::

## Control column moving

Use the [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) hook to decide whether each column move is allowed. Returning `false` cancels the move while keeping the [`manualColumnMove`](@/api/options.md#manualcolumnmove) plugin enabled.

Both [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) run only when the pointer actually drags a column. A click on a column header does not fire them.

In the following example, select **Allow column moving** before you drag a column to a new position. Clear the checkbox to block column moving again.

:::: only-for javascript

::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-moving/javascript/example4.html)
@[code](@/content/guides/columns/column-moving/javascript/example4.js)
@[code](@/content/guides/columns/column-moving/javascript/example4.ts)

:::

::::

:::: only-for react

::: example #example4 :react --jsx 1 --tsx 2

@[code](@/content/guides/columns/column-moving/react/example4.jsx)
@[code](@/content/guides/columns/column-moving/react/example4.tsx)

:::

::::

:::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-moving/angular/example4.ts)
@[code](@/content/guides/columns/column-moving/angular/example4.html)

:::

::::

:::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/columns/column-moving/vue/example4.vue)

:::

::::

## Result

After completing this guide, you can reorder columns by dragging them with the mouse or by calling `dragColumns()` and `moveColumns()` programmatically. You can also set a pre-defined column order at initialization or use `beforeColumnMove` to block individual moves.

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
