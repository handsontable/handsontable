---
title: Performance tips
permalink: /8.3/performance-tips
canonicalUrl: /performance-tips
---

# {{ $frontmatter.title }}

[[toc]]

Handsontable performs multiple calculations to display the grid properly. The most demanding actions are performed on load, change and scroll events. Every single operation decreases the performance, but most of them are unavoidable.

We use Performance Lab to measure the execution times in various configurations. Some tests have shown that there are methods which may potentially boost the performance of your application. Those work only in certain cases, but we hope they can be successfully applied to your app as well.

## Set constant size

You can try setting a constant size for your table's columns. This way, Handsontable won't have to calculate the optimal width for each column. In order to do that, define the column widths in the colWidths property of your Handsontable instance configuration, for example:

```js
var hot = new Handsontable(obj, {
  // other options
  colWidths: [50, 150, 45]
});
```

For more information, see [our documentation](api/dataMap/metaManager/metaSchema.md#colwidths).

As Handsontable won't do the column width calculations, you need to make sure, that your table contents fit inside the columns with the provided widths.

## Turn off autoRowSize and/or autoColumnSize

You can tweak the value of the `autoRowSize` and `autoColumnSize` options. They allow you to define the amount of width/height-related calculations made during the table's initialization.

For more information, see our documentation for [rows](api/dataMap/metaManager/metaSchema.md#autorowsize) and [columns](api/dataMap/metaManager/metaSchema.md#autocolumnsize).

## Define the number of pre-rendered rows and columns

You can explicitly specify the number of rows and columns to be rendered outside of the visible part of the table. In some cases you can achieve better results by setting a lower number (as less elements get rendered), but sometimes setting a larger number may also work well (as less operations are being made on each scroll event). Tweaking these settings and finding the sweet spot may improve the feeling of your Handsontable implementation.

For more information, see our documentation for [rows](api/dataMap/metaManager/metaSchema.md#viewportrowrenderingoffset) and [columns](api/dataMap/metaManager/metaSchema.md#viewportcolumnrenderingoffset).

## Rule of thumb: don't use too much styling

Changing your background, font colors etc. shouldn't lower the performance, however adding too many CSS animations, transitions and other calculation-consuming attributes may impact the performance, so keep them at a reasonable level.

## Suspend rendering

By default, Handsontable will call the render after each CRUD operation. Usually, this is expected behavior, however, in some use cases, you may find it slightly excessive. By using one of batching methods you can suspend render and call it just once, in the end, for example:

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

Visit the [suspend rendering](suspend-rendering.mdx) page to find more information on how to use batching.

## Use modules

If you need only a few parts of Handsontable you can think of importing them as **modules**. Eventually, this can lead to lowering the bundle size. In short - it can be done in several steps:

- import the base
- import the module you want to use and its registering method
- register it
- use it

The example shows to import and register `ContextMenu`

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, ContextMenu } from 'handsontable/plugins';

registerPlugin(ContextMenu);

// switch the context menu on
new Handsontable(container, {
  contextMenu: true,
  // rest of the settings
});
```

You can also optimize the use of **moment.js**. To find out more about this topic check out the [modules page](modules.md).
