---
id: qiasr3y1
title: Column headers
metaTitle: Column headers - JavaScript Data Grid | Handsontable
description: Use default column headers (A, B, C), or set them to custom values provided by an array or a function.
permalink: /column-header
canonicalUrl: /column-header
react:
  id: 5e0tnexi
  metaTitle: Column headers - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column headers

Use default column headers (A, B, C), or set them to custom values provided by an array or a function.

[[toc]]

## Overview

Column headers are gray-colored rows used to label each column or group of columns. By default, these headers are populated with letters in alphabetical order.

To reflect the type or category of data in a particular column, give it a custom name and then display it in a column header. For example, instead of letters as labels such as `A, B, C, ...` name them `ID, Full name, Country, ...`.

## Default headers

Setting the [`colHeaders`](@/api/options.md#colheaders) option to `true` enables the default column headers as shown in the example below:

::: only-for javascript

::: example #example1 --js 1 --ts 3

@[code](@/content/guides/columns/column-header/javascript/example1.js)
@[code](@/content/guides/columns/column-header/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react

@[code](@/content/guides/columns/column-header/react/example1.jsx)

:::

:::

## Header labels as an array
An array of labels can be used to set the [`colHeaders`](@/api/options.md#colheaders) as shown in the example below:

::: only-for javascript

::: example #example2 --js 1 --ts 3

@[code](@/content/guides/columns/column-header/javascript/example2.js)
@[code](@/content/guides/columns/column-header/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react

@[code](@/content/guides/columns/column-header/react/example2.jsx)

:::

:::

## Header labels as a function
The [`colHeaders`](@/api/options.md#colheaders) can also be populated using a function as shown in the example below:

::: only-for javascript

::: example #example3 --js 1 --ts 3

@[code](@/content/guides/columns/column-header/javascript/example3.js)
@[code](@/content/guides/columns/column-header/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react

@[code](@/content/guides/columns/column-header/react/example3.jsx)

:::

:::

## Nested headers

More complex data structures can be displayed with multiple headers, each representing a different category of data. To learn more about nested headers, see the [column groups](@/guides/columns/column-groups/column-groups.md) page.

## Related articles

### Related guides

<div class="boxes-list gray">

- [Column groups](@/guides/columns/column-groups/column-groups.md)

</div>

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`colHeaders`](@/api/options.md#colheaders)
  - [`columnHeaderHeight`](@/api/options.md#columnheaderheight)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)
  - [`title`](@/api/options.md#title)
- Core methods:
  - [`getColHeader()`](@/api/core.md#getcolheader)
  - [`hasColHeaders()`](@/api/core.md#hascolheaders)
- Hooks:
  - [`afterGetColHeader`](@/api/hooks.md#aftergetcolheader)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`beforeHighlightingColumnHeader`](@/api/hooks.md#beforehighlightingcolumnheader)
  - [`modifyColHeader`](@/api/hooks.md#modifycolheader)
  - [`modifyColumnHeaderHeight`](@/api/hooks.md#modifycolumnheaderheight)
- Plugins:
  - [`NestedHeaders`](@/api/nestedHeaders.md)
