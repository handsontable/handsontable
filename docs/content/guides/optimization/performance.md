---
title: Performance
metaTitle: Performance - Guide - Handsontable Documentation
permalink: /performance
canonicalUrl: /performance
tags:
  - speed
---

# Performance

[[toc]]

## Overview

Handsontable performs multiple calculations to display the grid properly. The most demanding actions are performed on load, change, and scroll events. Every single operation decreases the performance, but most of them are unavoidable.

We use Performance Lab to measure the execution times in various configurations. Some tests have shown that there are methods that may potentially boost the performance of your application. These only work in certain cases, but we hope they can be successfully applied to your app as well.

## Set constant size

You can set a constant size for your table's columns. This way, Handsontable won't have to calculate the optimal width for each column. To do this, define the column widths by setting the [`colWidths`](@/api/options.md#colwidths) configuration option:

::: only-for javascript
```js
const hot = new Handsontable(obj, {
  // other options
  colWidths: [50, 150, 45]
});
```
:::

::: only-for react
```js
<HotTable
  colWidths={[50, 150, 45]}
/>
```
:::

For more information, see [our documentation](@/api/options.md#colwidths).

::: tip
When using this setting, Handsontable won't perform the column width calculations, so you will need to ensure that your table contents fit inside the columns with the provided widths.
:::

## Turn off autoRowSize and/or autoColumnSize

You can configure the value of the [`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) options. These allow you to define the amount of width/height-related calculations made during the table's initialization.

For more information, see our documentation for [rows](@/api/options.md#autorowsize) and [columns](@/api/options.md#autocolumnsize).

## Define the number of pre-rendered rows and columns

You can explicitly specify the number of rows and columns to be rendered outside of the visible part of the table. Better results can be achieved by setting a lower number, as fewer elements get rendered in some cases. However, sometimes setting a larger number may also work well as fewer operations are being made on each scroll event. Fine-tuning these settings and finding the sweet spot may improve the feeling of your Handsontable implementation.

For more information, see our documentation for [rows](@/api/options.md#viewportrowrenderingoffset) and [columns](@/api/options.md#viewportcolumnrenderingoffset).

## Rule of thumb: don't use too much styling

Changing your background, font colors, etc., shouldn't lower the performance. However, adding too many CSS animations, transitions, and other calculation-consuming attributes may impact the performance, so keep them at a reasonable level.

## Suspend rendering

By default, Handsontable will call the render after each CRUD operation. Usually, this is expected behavior, but you may find it slightly excessive in some use cases. By using one of the batching methods, you can suspend rendering and call it just once at the end. For example:

::: only-for react
::: tip
To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotInstance` property.

For more information, see the [`Instance Methods`](@/guides/getting-started/react-methods.md) page.
:::
:::

```js
hot.batch(() => {
  hot.alter('insert_row', 5, 45);
  hot.setDataAtCell(1, 1, 'x');

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated and table render will be called once after executing the callback
});
```

See the [batch operations](@/guides/optimization/batch-operations.md) page to find more information on how to use batching.

## Related articles

### Related guides

- [Batch operations](@/guides/optimization/batch-operations.md)
- [Row virtualization](@/guides/rows/row-virtualization.md)
- [Column virtualization](@/guides/columns/column-virtualization.md)
- [Modules](@/guides/tools-and-building/modules.md)
- [Bundle size](@/guides/optimization/bundle-size.md)

### Related API reference

- Configuration options:
  - [`autoColumnSize`](@/api/options.md#autocolumnsize)
  - [`autoRowSize`](@/api/options.md#autorowsize)
  - [`colWidths`](@/api/options.md#colwidths)
  - [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
  - [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)
