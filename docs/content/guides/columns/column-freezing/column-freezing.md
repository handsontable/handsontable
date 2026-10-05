---
type: how-to
title: Column freezing
metaTitle: Column freezing - JavaScript Data Grid | Handsontable
description: Lock (freeze) the position of specified columns at the start or end of the grid, keeping them visible while scrolling to another area of the grid.
permalink: /column-freezing
canonicalUrl: /column-freezing
tags:
  - fixing columns
  - snapping columns
  - pinning columns
  - fixedColumns
  - fixedColumnsEnd
  - freezing columns at the end
  - right frozen columns
react:
  metaTitle: Column freezing - React Data Grid | Handsontable
angular:
  metaTitle: Column freezing - Angular Data Grid | Handsontable
vue:
  metaTitle: Column freezing - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
menuTag: updated
---
Lock the position of specified columns, keeping them visible when scrolling.

[[toc]]

## Overview

Column freezing locks specific columns of a grid in place, keeping them visible while scrolling to
another area of the grid. We refer to frozen columns as _fixed_.

You can freeze columns at the start or at the end of the grid. You can freeze them during initialization and by the user.

## Freeze columns at initialization

To freeze columns at initialization, use the [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) option. Then, configure the container of your grid with the following CSS attributes: `width` and
`overflow: hidden`.

If your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md) is `ltr`, columns get frozen from the left side of the table. If your layout direction is `rtl`, columns get frozen from the right side of the table.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example1.js)
@[code](@/content/guides/columns/column-freezing/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example1.jsx)
@[code](@/content/guides/columns/column-freezing/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-freezing/angular/example1.ts)
@[code](@/content/guides/columns/column-freezing/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/columns/column-freezing/vue/example1.vue)

:::

:::

## Freeze columns at the end

To freeze the last columns of the grid, use the [`fixedColumnsEnd`](@/api/options.md#fixedcolumnsend) option. The frozen columns stay at the end edge of the grid while the rest of the grid scrolls horizontally. The default value is `0`.

The _end_ edge depends on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md):

- If the layout direction is `ltr`, the end edge is the right side of the grid.
- If the layout direction is `rtl`, the end edge is the left side of the grid.

`fixedColumnsEnd` counts from the last column. For example, `fixedColumnsEnd: 2` freezes the last two columns of the grid.

You can combine `fixedColumnsEnd` with `fixedColumnsStart`. The following example freezes the first column (SKU) and the last column (Total):

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example3.js)
@[code](@/content/guides/columns/column-freezing/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example3.jsx)
@[code](@/content/guides/columns/column-freezing/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-freezing/angular/example3.ts)
@[code](@/content/guides/columns/column-freezing/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/columns/column-freezing/vue/example3.vue)

:::

:::

### Freeze all four edges

Combine `fixedColumnsStart` and `fixedColumnsEnd` with [`fixedRowsTop`](@/api/options.md#fixedrowstop) and [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom) to freeze every edge of the grid. For more about frozen rows, see [Row freezing](@/guides/rows/row-freezing/row-freezing.md).

In the following example, the first row (Target) and the last row (Total) stay at the top and bottom edges. The first column (SKU) and the last column (Total) stay at the start and end edges:

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example4.js)
@[code](@/content/guides/columns/column-freezing/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example4.jsx)
@[code](@/content/guides/columns/column-freezing/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-freezing/angular/example4.ts)
@[code](@/content/guides/columns/column-freezing/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/columns/column-freezing/vue/example4.vue)

:::

:::

### How fixedColumnsEnd interacts with other settings

- **Overlap.** If `fixedColumnsStart` and `fixedColumnsEnd` together exceed the number of columns, `fixedColumnsStart` takes priority. Handsontable reduces the end columns to the columns that remain. The `fixedColumnsEnd` value you set doesn't change.
- **Hidden columns.** Hidden and trimmed columns don't take a frozen slot. Hiding a column inside the end band shrinks the frozen area by that column.
- **Size limit.** The [frozen area size limit](#frozen-area-size-limit) applies to the start and end columns together. Keep the combined width of all frozen columns smaller than the width of the grid.
- **Changing the value.** You can change `fixedColumnsEnd` at any time with [`updateSettings()`](@/api/core.md#updatesettings). When you remove columns that belong to the end band, Handsontable lowers the value by the number of removed frozen columns.

- **Inserted columns.** An explicit insert doesn't move the end band, the same way inserting a row doesn't move [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom). The band is always the last `fixedColumnsEnd` columns. A column you insert inside the band, or after it (for example with **Insert column right** on the last end column, or `alter('insert_col_end')`), takes a frozen slot, and the first column of the band becomes scrollable. To keep the same columns frozen, raise `fixedColumnsEnd` yourself, for example in the [`afterCreateCol`](@/api/hooks.md#aftercreatecol) hook.
- **Spare and minimum columns.** While `fixedColumnsEnd` is above `0`, Handsontable doesn't add empty columns for [`minSpareCols`](@/api/options.md#minsparecols) or [`minCols`](@/api/options.md#mincols). A column added after the last end column would take over the frozen position and unfreeze the column that holds your data. Pressing <kbd>**Enter**</kbd> or <kbd>**Tab**</kbd> at the last column doesn't add a column either.
- **End and Ctrl+End.** <kbd>**End**</kbd> and <kbd>**Ctrl**</kbd>+<kbd>**End**</kbd> move to the last column that isn't frozen at the end. They don't move into the end columns. To reach the end columns, use the arrow keys or <kbd>**Tab**</kbd>. If the start and end columns cover every column of the grid, <kbd>**End**</kbd> and <kbd>**Ctrl**</kbd>+<kbd>**End**</kbd> do nothing.

### Known limitations

- [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) freezes and unfreezes columns on the start side only. It doesn't change `fixedColumnsEnd`.
- XLSX export and import don't carry frozen end columns.
- You can't move a column across the boundary between the scrollable columns and the frozen end columns with [`manualColumnMove`](@/api/options.md#manualcolumnmove).

## User-triggered freeze

To enable manual column freezing, set [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) to `true`. This lets you freeze and unfreeze columns by using the grid's [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) or [column menu](@/guides/accessories-and-menus/column-menu/column-menu.md).

Mind that when you unfreeze a frozen column, it doesn't go back to the original position.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/javascript/example2.js)
@[code](@/content/guides/columns/column-freezing/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-freezing/react/example2.jsx)
@[code](@/content/guides/columns/column-freezing/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-freezing/angular/example2.ts)
@[code](@/content/guides/columns/column-freezing/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/columns/column-freezing/vue/example2.vue)

:::

:::

## Frozen area size limit

Freeze only as many columns as fit within the grid's width.

Handsontable always draws frozen columns in full. It never shrinks them, and it never scrolls them. If the frozen columns need more space than the grid has, they cover the whole grid. The remaining columns stay out of reach: the horizontal scrollbar still moves, but the view no longer changes.

This applies to the total width of the frozen columns, not to how many there are. A single frozen column that you resize wider than the grid causes the same result.

To avoid this, keep the combined width of your frozen columns smaller than the width of the grid. If your grid has to work at several sizes, pick a number of frozen columns that fits the narrowest one.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [fixedColumnsStart](@/api/options.md#fixedcolumnsstart)
- [fixedColumnsEnd](@/api/options.md#fixedcolumnsend)
- [fixedRowsTop](@/api/options.md#fixedrowstop)
- [fixedRowsBottom](@/api/options.md#fixedrowsbottom)
- [manualColumnFreeze](@/api/options.md#manualcolumnfreeze)

</div>

**Plugins**

<div class="boxes-list">

- [ManualColumnFreeze](@/api/manualColumnFreeze.md)

</div>
