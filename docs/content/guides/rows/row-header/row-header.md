---
id: j1zswn3i
title: Row headers
metaTitle: Row headers - JavaScript Data Grid | Handsontable
description: Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.
permalink: /row-header
canonicalUrl: /row-header
tags:
  - custom headers
  - bind rows with headers
  - row id
react:
  id: prlcpqk8
  metaTitle: Row headers - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row headers

Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.

[[toc]]

## Overview

Row headers are gray-colored columns that are used to label each row. By default, these headers are filled with numbers displayed in ascending order.

To turn the headers on, set the option [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

## Bind rows with headers

You can bind row numbers with row headers. This is used mostly to differentiate two business cases in which Handsontable is most often used.

1. When moving a row in a typical grid-like application, the numbers in the row headers remain intact. Only the content is moved.

2. In a data grid, each row has its unique ID. Therefore, the column header should follow its row whenever it changes its position in the grid.

### Basic example

To enable the plugin, set the [`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders) property to `true`. Move the rows in the example below to see what this plugin does.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example1.js)
@[code](@/content/guides/rows/row-header/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example1.jsx)
@[code](@/content/guides/rows/row-header/react/example1.tsx)

:::

:::

## Tree grid

A tree grid enables you to represent the nested data structures within the data grid. To learn more about this feature, see the [Row parent-child](@/guides/rows/row-parent-child/row-parent-child.md) page.

## Related articles

### Related guides

<div class="boxes-list gray">

- [Row parent-child](@/guides/rows/row-parent-child/row-parent-child.md)

</div>

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders)
  - [`rowHeaders`](@/api/options.md#rowheaders)
- Core methods:
  - [`getRowHeader()`](@/api/core.md#getrowheader)
  - [`hasRowHeaders()`](@/api/core.md#hasrowheaders)
- Hooks:
  - [`afterGetRowHeader`](@/api/hooks.md#aftergetrowheader)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`beforeHighlightingRowHeader`](@/api/hooks.md#beforehighlightingrowheader)
  - [`modifyRowHeader`](@/api/hooks.md#modifyrowheader)
  - [`modifyRowHeaderWidth`](@/api/hooks.md#modifyrowheaderwidth)
- Plugins:
  - [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)
