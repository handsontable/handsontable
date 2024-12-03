---
id: d2in9k81
title: Row moving
metaTitle: Row moving - JavaScript Data Grid | Handsontable
description: Change the order of rows, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /row-moving
canonicalUrl: /row-moving
react:
  id: g5mksyu1
  metaTitle: Row moving - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row moving

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

## Drag and move actions of `manualRowMove` plugin

There are significant differences between the plugin's [`dragRows`](@/api/manualRowMove.md#dragrows) and [`moveRows`](@/api/manualRowMove.md#moverows) API functions. Both of them change the order of rows, but they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

Both of these methods trigger the [`beforeRowMove`](@/api/hooks.md#beforerowmove) and [`afterRowMove`](@/api/hooks.md#afterrowmove) hooks, but only [`dragRows`](@/api/manualRowMove.md#dragrows) passes the `dropIndex` argument to them.

The [`dragRows`](@/api/manualRowMove.md#dragrows) method has a `dropIndex` parameter, which points to where the elements are being dropped.

<span class="img-invert">

![dragRows method]({{$basePath}}/img/drag_action.svg)

</span>


The [`moveRows`](@/api/manualRowMove.md#moverows) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

<span class="img-invert">

![moveRows method]({{$basePath}}/img/move_action.svg)

</span>

The [`moveRows`](@/api/manualRowMove.md#moverows) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](@/api/manualRowMove.md#ismovepossible) API method and the `movePossible` parameters `beforeRowMove` and `afterRowMove` hooks help in determine such situations.

## Related API reference

- Options:
  - [`manualRowMove`](@/api/options.md#manualrowmove)
- Core methods:
  - [`toVisualRow`](@/api/core.md#tovisualrow)
- Hooks:
  - [`afterRowMove`](@/api/hooks.md#afterrowmove)
  - [`beforeRowMove`](@/api/hooks.md#beforerowmove)
- Plugins:
  - [`ManualRowMove`](@/api/manualRowMove.md)
