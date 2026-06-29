---
type: how-to
title: Row moving
metaTitle: Row moving - JavaScript Data Grid | Handsontable
description: Change the order of rows, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /row-moving
canonicalUrl: /row-moving
react:
  metaTitle: Row moving - React Data Grid | Handsontable
angular:
  metaTitle: Row moving - Angular Data Grid | Handsontable
vue:
  metaTitle: Row moving - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
---
Change the order of rows, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).

[[toc]]

## Enable the `ManualRowMove` plugin

To enable row moving, set the [`manualRowMove`](@/api/options.md#manualrowmove) option to `true`.

A draggable move handle appears above the selected row header. You can click and drag it to any location in the row header body.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-moving/javascript/example1.js)
@[code](@/content/guides/rows/row-moving/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-moving/react/example1.jsx)
@[code](@/content/guides/rows/row-moving/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-moving/angular/example1.ts)
@[code](@/content/guides/rows/row-moving/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-moving/vue/example1.vue)

:::

:::

## Set a pre-defined row order

Instead of setting [`manualRowMove`](@/api/options.md#manualrowmove) to `true`, you can pass an **array of physical row indexes** to define the initial visual order of rows on render.

Each position in the array corresponds to a visual (display) position, and the value at that position is the physical (source data) row index. For example:

```js
manualRowMove: [2, 0, 1]
```

This renders the rows in the following order:
- Visual position 0 → physical row `2`
- Visual position 1 → physical row `0`
- Visual position 2 → physical row `1`

The array must contain all physical row indexes (its length must equal the total number of rows). After the initial render, users can still drag rows to change the order further.

## Result

After completing this guide, you can reorder rows by dragging them with the mouse or by calling `dragRows()` and `moveRows()` programmatically. You can also set a pre-defined row order at initialization.

## API reference

### dragRows vs moveRows

There are significant differences between the plugin's [`dragRows`](@/api/manualRowMove.md#dragrows) and [`moveRows`](@/api/manualRowMove.md#moverows) API functions. Both of them change the order of rows, but they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

Both of these methods trigger the [`beforeRowMove`](@/api/hooks.md#beforerowmove) and [`afterRowMove`](@/api/hooks.md#afterrowmove) hooks, but only [`dragRows`](@/api/manualRowMove.md#dragrows) passes the `dropIndex` argument to them.

The [`dragRows`](@/api/manualRowMove.md#dragrows) method has a `dropIndex` parameter, which points to where the elements are being dropped.

<span class="img-invert">

![dragRows method](/img/drag_action.svg)

</span>


The [`moveRows`](@/api/manualRowMove.md#moverows) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

<span class="img-invert">

![moveRows method](/img/move_action.svg)

</span>

The [`moveRows`](@/api/manualRowMove.md#moverows) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](@/api/manualRowMove.md#ismovepossible) API method and the `movePossible` parameters `beforeRowMove` and `afterRowMove` hooks help in determine such situations.

### Related API reference

**Configuration options**

<div class="boxes-list">

- [manualRowMove](@/api/options.md#manualrowmove)

</div>

**Core methods**

<div class="boxes-list">

- [toVisualRow](@/api/core.md#tovisualrow)

</div>

**Hooks**

<div class="boxes-list">

- [afterRowMove](@/api/hooks.md#afterrowmove)
- [beforeRowMove](@/api/hooks.md#beforerowmove)

</div>

**Plugins**

<div class="boxes-list">

- [ManualRowMove](@/api/manualRowMove.md)

</div>
