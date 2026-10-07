---
type: how-to
title: Row freezing
metaTitle: Row freezing - JavaScript Data Grid | Handsontable
description: Lock (freeze) the position of specified rows, keeping them visible while scrolling to another area of the grid. This feature is sometimes called "pinned rows".
permalink: /row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
  - fixedRows
react:
  metaTitle: Row freezing - React Data Grid | Handsontable
angular:
  metaTitle: Row freezing - Angular Data Grid | Handsontable
vue:
  metaTitle: Row freezing - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: updated
---
Lock the position of specified rows, keeping them visible when scrolling.

You can combine frozen rows with frozen columns on both sides of the grid. To freeze all four edges, see [Column freezing](@/guides/columns/column-freezing/column-freezing.md#freeze-all-four-edges).

[[toc]]

## Overview

Row freezing locks specific rows of a grid in place, keeping them visible while scrolling to another area of the grid.

This feature is sometimes called "pinned rows".

## Example

The following example specifies two fixed rows with `fixedRowsTop: 2`. Horizontal scroll bars are needed, so set a container `width` and `overflow: hidden` in CSS.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-freezing/javascript/example1.js)
@[code](@/content/guides/rows/row-freezing/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-freezing/react/example1.jsx)
@[code](@/content/guides/rows/row-freezing/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-freezing/angular/example1.ts)
@[code](@/content/guides/rows/row-freezing/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-freezing/vue/example1.vue)

:::

:::

## Freeze rows at the bottom

To pin rows to the bottom edge of the grid -- sometimes called footer rows -- use the `fixedRowsBottom` option. The specified number of rows stays visible at the bottom of the viewport while you scroll through the rest of the data.

```js
const hot = new Handsontable(container, {
  data: getData(),
  // freeze the last two rows as a footer
  fixedRowsBottom: 2,
  licenseKey: 'non-commercial-and-evaluation',
});
```

You can combine `fixedRowsTop` and `fixedRowsBottom` to keep both a header and a footer row in view at the same time.

## Freeze rows by dragging

To let users change the number of frozen rows by dragging, enable the [`freezeBar`](@/api/options.md#freezebar) option. The [`FreezeBar`](@/api/freezeBar.md) plugin draws a bar on the edge of the frozen rows, and users drag it to the row boundary where they want the freeze line. The bar also works with the keyboard. Drags are limited to the number of rows that leave room to scroll.

The plugin changes the counts on the grid and doesn't write them back to the settings you passed in. To keep the counts in your own state, copy them in the [`afterFreezeChange`](@/api/hooks.md#afterfreezechange) hook.

The plugin hides the bars for rows when the [`Pagination`](@/api/pagination.md) plugin is on, because Pagination doesn't support frozen rows. For the full guide, see [Column freezing: Freeze columns by dragging](@/guides/columns/column-freezing/column-freezing.md#freeze-columns-by-dragging).

## Result

After completing this guide, the rows you specify with `fixedRowsTop` or `fixedRowsBottom` stay visible while you scroll through the rest of the grid.

## Frozen area size limit

When your grid has a defined [`height`](@/api/options.md#height), freeze only as many rows as fit within it.

By default, Handsontable draws frozen rows in full. It never shrinks them, and it never scrolls them. If the frozen rows need more space than the grid has, they cover the whole grid. The remaining rows stay out of reach: the vertical scrollbar still moves, but the view no longer changes.

This applies to the total height of the frozen rows, not to how many there are. Taller rows reach the limit sooner. Both `fixedRowsTop` and `fixedRowsBottom` behave this way.

To keep the rest of the grid reachable, set the [`limitFixedToViewport`](@/api/options.md#limitfixedtoviewport) option to `true`:

```js
fixedRowsTop: 40,
fixedRowsBottom: 2,
limitFixedToViewport: true,
```

With this option on, Handsontable draws only as many frozen rows as fit and keeps a strip of the grid scrollable. The option changes what the grid draws, not what you configured:

- [`getSettings()`](@/api/core.md#getsettings) still returns the values of `fixedRowsTop` and `fixedRowsBottom`.
- Handsontable measures the grid again when it resizes. The frozen rows come back when the grid grows.
- The top rows have priority over the bottom rows.
- The [`FreezeBar`](@/api/freezeBar.md) plugin shows the bar on the line where the drawn frozen area ends.
- Sorting and filtering still treat the rows you configured as frozen. A row that the grid does not draw as frozen stays out of the sort and the filter.

The option works the same way for frozen columns. Read more in [Column freezing](@/guides/columns/column-freezing/column-freezing.md#frozen-area-size-limit).

If you leave the option off, keep the combined height of your frozen rows smaller than the grid's height. If your grid has to work at several sizes, pick a number of frozen rows that fits the shortest one.

Without a defined `height`, the grid grows to fit its rows, so the frozen rows cannot outgrow it and this limit does not apply. Read more in [Grid size](@/guides/getting-started/grid-size/grid-size.md).

## Related API reference

**Configuration options**

<div class="boxes-list">

- [fixedRowsBottom](@/api/options.md#fixedrowsbottom)
- [fixedRowsTop](@/api/options.md#fixedrowstop)
- [freezeBar](@/api/options.md#freezebar)
- [limitFixedToViewport](@/api/options.md#limitfixedtoviewport)

</div>

**Plugins**

<div class="boxes-list">

- [FreezeBar](@/api/freezeBar.md)

</div>

**Hooks**

<div class="boxes-list">

- [beforeFreezeChange](@/api/hooks.md#beforefreezechange)
- [afterFreezeChange](@/api/hooks.md#afterfreezechange)

</div>
