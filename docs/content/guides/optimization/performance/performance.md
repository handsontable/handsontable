---
type: how-to
id: w6bvsin5
title: Performance
metaTitle: Performance - JavaScript Data Grid | Handsontable
description: Boost your grid's performance by setting a constant column size, suspending rendering, deciding how many rows and columns are pre-rendered, and more.
permalink: /performance
canonicalUrl: /performance
tags:
  - speed
react:
  id: gbdbrlc8
  metaTitle: Performance - React Data Grid | Handsontable
angular:
  id: 34wyxzpj
  metaTitle: Performance - Angular Data Grid | Handsontable
vue:
  id: 983rpyud
  metaTitle: Performance - Vue Data Grid | Handsontable
searchCategory: Guides
category: Optimization
menuTag: updated
---
Boost your grid's performance by setting a constant column size, suspending rendering, deciding how many rows and columns are pre-rendered, and more.

[[toc]]

## Overview

Handsontable performs multiple calculations to display the grid properly. The most demanding actions are performed on load, change, and scroll events. Every single operation decreases the performance, but most of them are unavoidable.

To measure Handsontable's execution times in various configurations, we use our own library called [Performance Lab](https://github.com/handsontable/performance-lab). Some tests have shown that there are methods that may potentially boost the performance of your application. These only work in certain cases, but we hope they can be successfully applied to your app as well.

## Set constant row and column sizes

Configure your [column widths](@/guides/columns/column-width/column-width.md) and [row heights](@/guides/rows/row-height/row-height.md) in advance. This way, Handsontable doesn't have to calculate them.

::: only-for javascript

```js
const hot = new Handsontable(obj, {
  colWidths: [50, 150, 45],
  rowHeights: [40, 40, 40, 40],
});
```

:::

::: only-for react

```js
<HotTable
  colWidths={[50, 150, 45]}
  rowHeights={[40, 40, 40, 40]}
/>
```

:::

::: only-for angular

```ts
settings = {
  colWidths: [50, 150, 45],
  rowHeights: [40, 40, 40, 40],
};
```

```html
<hot-table [settings]="settings"></hot-table>
```

:::

When taking this approach, make sure that the contents of your cells fit in your row and column sizes, or let the user change [column widths](@/guides/columns/column-width/column-width.md#adjust-the-column-width-manually) and [row heights](@/guides/rows/row-height/row-height.md#adjust-row-heights-manually) manually.

Read more:

- [Grid size](@/guides/getting-started/grid-size/grid-size.md)
- [Column widths](@/guides/columns/column-width/column-width.md)
- [Row heights](@/guides/rows/row-height/row-height.md)
- [`colWidths`](@/api/options.md#colwidths)
- [`rowHeights`](@/api/options.md#rowheights)

## Turn off autoRowSize and/or autoColumnSize

You can configure the value of the [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options. These allow you to define the amount of width/height-related calculations made during the table's initialization.

For more information, see our documentation for [rows](@/api/options.md#autorowsize) and [columns](@/api/options.md#autocolumnsize).

## Define the number of pre-rendered rows and columns

You can explicitly specify the number of rows and columns to be rendered outside of the visible part of the table. Better results can be achieved by setting a lower number, as fewer elements get rendered in some cases. However, sometimes setting a larger number may also work well as fewer operations are being made on each scroll event. Fine-tuning these settings and finding the sweet spot may improve the feeling of your Handsontable implementation.

For more information, see our documentation for [rows](@/api/options.md#viewportrowrenderingoffset) and [columns](@/api/options.md#viewportcolumnrenderingoffset).

## Rule of thumb: don't use too much styling

Changing your background, font colors, etc., shouldn't lower the performance. However, adding too many CSS animations, transitions, and other calculation-consuming attributes may impact the performance, so keep them at a reasonable level.

## Avoid the `cells` option when possible

The [`cells`](@/api/options.md#cells) option is a function invoked before each of Handsontable's [rendering cycles](@/guides/optimization/batch-operations/batch-operations.md). Because it runs on every render for every visible cell, even a small amount of work inside it adds up quickly and can noticeably slow down the grid.

Prefer lighter alternatives when they meet your needs:

- [`cell`](@/api/options.md#cell) - a static array of per-cell options, evaluated once.
- [`columns`](@/api/options.md#columns) - a static array of per-column options, evaluated once.
- [`setCellMeta()`](@/api/core.md#setcellmeta) - updates a single cell's metadata imperatively, without re-evaluating every cell.

Use the [`cells`](@/api/options.md#cells) option only if the above alternatives can't express the logic you need.

## Suspend rendering

By default, Handsontable will call the render after each CRUD operation. Usually, this is expected behavior, but you may find it slightly excessive in some use cases. By using one of the batching methods, you can suspend rendering and call it just once at the end. For example:

::: only-for react
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::
:::

::: only-for angular
::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::
:::

```js
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setDataAtCell(1, 1, 'x');

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated and table render will be
  // called once after executing the callback
});
```

See the [batch operations](@/guides/optimization/batch-operations/batch-operations.md) page to find more information on how to use batching.

## Consider using pagination

If you're struggling with performance when dealing with large datasets, consider enabling the [`pagination`](@/api/options.md#pagination) option. Instead of rendering all your data at once, pagination allows you to display only a subset of rows at a time, significantly reducing the rendering load and improving overall performance.

The Pagination plugin is particularly useful when:
- You have thousands of rows of data
- Your users don't need to see all data simultaneously
- You want to maintain responsive scrolling and editing performance

For more information, see our [Pagination guide](@/guides/rows/rows-pagination/rows-pagination.md).

## Related articles

### Related guides

<div class="boxes-list">

- [Batch operations](@/guides/optimization/batch-operations/batch-operations.md)
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
- [Pagination](@/guides/rows/rows-pagination/rows-pagination.md)
- [Modules](@/guides/tools-and-building/modules/modules.md)
- [Bundle size](@/guides/optimization/bundle-size/bundle-size.md)

</div>

### Related blog articles

<div class="boxes-list">

- [Handsontable 15.1.0: Performance and stability improvements](https://handsontable.com/blog/handsontable-15.1.0-performance-and-stability-improvements)
- [Handsontable 14.5.0: Improved performance and flexible column header class](https://handsontable.com/blog/handsontable-14.5.0-improved-performance-and-flexible-column-header-class)
- [Handsontable 10.0.0: Improved performance and consistency](https://handsontable.com/blog/handsontable-10.0.0-improved-performance-and-consistency)

</div>

### Related API reference

**Configuration options:**

<div class="boxes-list">

- [`pagination`](@/api/options.md#pagination)
- [`autoColumnSize`](@/api/options.md#autocolumnsize)
- [`autoRowSize`](@/api/options.md#autorowsize)
- [`cell`](@/api/options.md#cell)
- [`cells`](@/api/options.md#cells)
- [`colWidths`](@/api/options.md#colwidths)
- [`columns`](@/api/options.md#columns)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

</div>

**Core methods:**

<div class="boxes-list">

- [`setCellMeta()`](@/api/core.md#setcellmeta)

</div>
