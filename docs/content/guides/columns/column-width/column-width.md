---
type: how-to
title: Column widths
metaTitle: Column widths - JavaScript Data Grid | Handsontable
description: Configure column widths, using an array or a function. Let your users manually change column widths using Handsontable's interface.
permalink: /column-width
canonicalUrl: /column-width
tags:
  - resizing columns
  - stretching columns
  - column size
  - width
  - max-width
  - min-width
  - column dimensions
  - manual resize
react:
  metaTitle: Column widths - React Data Grid | Handsontable
angular:
  metaTitle: Column widths - Angular Data Grid | Handsontable
vue:
  metaTitle: Column widths - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
menuTag: updated
---
Configure column widths, using an array or a function. Let your users manually change column widths using Handsontable's interface.

[[toc]]

## Overview

By default, the column width adjusts to the width of the content. However, if the width of the content is less than `50px`, including `1px` for borders on the sides, the column width remains constant at `50px`. You can pass the column size as a constant, an array, or a function.

The content inside a cell will be wrapped if it doesn't fit the cell's width.

## Set the column width as a constant

In this example we set the same width of `100px` for all columns across the entire grid.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example1.js)
@[code](@/content/guides/columns/column-width/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example1.jsx)
@[code](@/content/guides/columns/column-width/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example1.ts)
@[code](@/content/guides/columns/column-width/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/columns/column-width/vue/example1.vue)

:::

:::

## Set the column width in an array

In this example, the width is only set for the first four columns. Each additional column would automatically adjust to the content.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example2.js)
@[code](@/content/guides/columns/column-width/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example2.jsx)
@[code](@/content/guides/columns/column-width/react/example2.tsx)

:::

:::


::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example2.ts)
@[code](@/content/guides/columns/column-width/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/columns/column-width/vue/example2.vue)

:::

:::

## Set the column width using a function

In this example, the size of all columns is set using a function by taking a column `index` (1, 2 ...) and multiplying it by `40px` for each consecutive column.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example3.js)
@[code](@/content/guides/columns/column-width/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example3.jsx)
@[code](@/content/guides/columns/column-width/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example3.ts)
@[code](@/content/guides/columns/column-width/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/columns/column-width/vue/example3.vue)

:::

:::

## Adjust the column width manually

Set the option [`manualColumnResize`](@/api/options.md#manualcolumnresize) to `true` to allow users to manually resize the column width by dragging the handle between the adjacent column headers. If you double-click on that handle, the width will be instantly adjusted to the size of the longest value in the column. Don't forget to enable column headers by setting [`colHeaders`](@/api/options.md#colheaders) to `true`.

You can adjust the size of one or multiple columns simultaneously, even if the selected columns are not placed next to each other.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example4.js)
@[code](@/content/guides/columns/column-width/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example4.jsx)
@[code](@/content/guides/columns/column-width/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example4.ts)
@[code](@/content/guides/columns/column-width/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/columns/column-width/vue/example4.vue)

:::

:::

## Column stretching

You can adjust the width of the columns to make them fit the table's width automatically. The width of a particular column will be calculated based on the size and number of other columns in the grid. This option only makes sense when you have at least one column in your data set and fewer columns than needed to enable the horizontal scrollbar.

::: tip

Use the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) to insert or remove columns. This will help you understand how the grid reacts to changes.

:::

### Fit all columns equally

This example fits all columns to the container's width equally by setting the option [`stretchH: 'all'`](@/api/options.md#stretchh).

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example5.js)
@[code](@/content/guides/columns/column-width/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example5.jsx)
@[code](@/content/guides/columns/column-width/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example5.ts)
@[code](@/content/guides/columns/column-width/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/columns/column-width/vue/example5.vue)

:::

:::

### Stretch only the last column

In this example, the first three columns are set to be 80px wide, and the last column automatically fills the remaining space. This is achieved by setting the option [`stretchH: 'last'`](@/api/options.md#stretchh).

::: only-for javascript

::: example #example6 --js 1 --ts 2

@[code](@/content/guides/columns/column-width/javascript/example6.js)
@[code](@/content/guides/columns/column-width/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-width/react/example6.jsx)
@[code](@/content/guides/columns/column-width/react/example6.tsx)

:::

:::


::: only-for angular

::: example #example6 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-width/angular/example6.ts)
@[code](@/content/guides/columns/column-width/angular/example6.html)

:::

:::

::: only-for vue

::: example #example6 :vue3

@[code](@/content/guides/columns/column-width/vue/example6.vue)

:::

:::

## A note about the performance

As mentioned above, the default width of the column is based on the widest value in any cell within the column. You may be wondering how it's possible for data sets containing hundreds of thousands of records.

This feature is made possible thanks to the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin, which is enabled by default. Internally it divides the data set into smaller sets and renders only some of them to measure their size. The size is then applied to the entire column based on the width of the widest found value.

To increase the performance, you can turn off this feature by defining the fixed size for the specified column or all columns.

::: tip

If you call [`scrollViewportTo()`](@/api/core.md#scrollviewportto) and your columns have non-standard widths (for example, set by a custom renderer or CSS), make sure `AutoColumnSize` is enabled. Without it, the method may scroll to an incorrect position.

:::

## Size of the container

Setting the dimensions of the container that holds Handsontable is described in detail on the [Grid size](@/guides/getting-started/grid-size/grid-size.md) page.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [autoColumnSize](@/api/options.md#autocolumnsize)
- [colWidths](@/api/options.md#colwidths)
- [manualColumnResize](@/api/options.md#manualcolumnresize)
- [stretchH](@/api/options.md#stretchh)

</div>

**Core methods**

<div class="boxes-list">

- [getColWidth()](@/api/core.md#getcolwidth)
- [scrollViewportTo()](@/api/core.md#scrollviewportto)

</div>

**Hooks**

<div class="boxes-list">

- [afterColumnResize](@/api/hooks.md#aftercolumnresize)
- [beforeColumnResize](@/api/hooks.md#beforecolumnresize)
- [beforeStretchingColumnWidth](@/api/hooks.md#beforestretchingcolumnwidth)
- [modifyAutoColumnSizeSeed](@/api/hooks.md#modifyautocolumnsizeseed)
- [modifyColWidth](@/api/hooks.md#modifycolwidth)

</div>

**Plugins**

<div class="boxes-list">

- [AutoColumnSize](@/api/autoColumnSize.md)
- [ManualColumnResize](@/api/manualColumnResize.md)

</div>
