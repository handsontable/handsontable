---
type: explanation
title: Understanding rendering
metaTitle: Understanding rendering - JavaScript Data Grid | Handsontable
description: Learn what a render does, which cells it covers, what it costs, and when you need to call render() yourself.
permalink: /rendering
canonicalUrl: /rendering
tags:
  - render
  - rerender
  - repaint
  - rendering-cycle
  - performance
react:
  metaTitle: Understanding rendering - React Data Grid | Handsontable
angular:
  metaTitle: Understanding rendering - Angular Data Grid | Handsontable
vue:
  metaTitle: Understanding rendering - Vue Data Grid | Handsontable
searchCategory: Guides
category: Optimization
menuTag: new
---
Learn what a render does, which cells it covers, what it costs, and when you need to call [`render()`](@/api/core.md#render) yourself.

[[toc]]

## Background

Handsontable does not keep every cell of your data set in the DOM. It renders only the part of the grid that you can see, plus a small buffer around it. As you scroll, it reuses the same DOM elements for new cells. This is called [row virtualization](@/guides/rows/row-virtualization/row-virtualization.md) and [column virtualization](@/guides/columns/column-virtualization/column-virtualization.md), and it is what lets the grid hold hundreds of thousands of records without freezing the browser.

A render is the step that brings those DOM elements back in sync with your data and your configuration. Handsontable runs it for you at the right moments, so most applications never call [`render()`](@/api/core.md#render) at all. You need it when you change something that Handsontable cannot detect on its own -- cell metadata, or a value outside the grid that one of your renderers reads.

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. Use a reference to the `HotTable` component and read its `hotInstance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

::: only-for angular

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. Use a reference to the `HotTable` component and read its `hotInstance` property.

For more information, see the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page.

:::

:::

::: only-for vue

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. Use a template ref on the `HotTable` component and read its `hotInstance` property.

For more information, see the [Referencing the Handsontable instance in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) page.

:::

:::

## How it works

### What a render does

A render recalculates the grid's layout, redraws its cells, and applies the result to the DOM. For every cell it draws, Handsontable:

1. Resets the cell's `td` element to a blank state.
2. Resolves the cell's metadata, which includes running the [`cells`](@/api/options.md#cells) function if you defined one.
3. Runs the cell's [renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md), which writes the value, the CSS classes, and any other markup.

A render redraws the grid in place. It does not change your data, your selection, or your scroll position.

### What a render covers

A render covers the cells that are currently rendered, not your whole data set. That is the viewport plus the buffer set by [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) and [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset).

So on a grid of 100,000 rows showing 30 of them, a render redraws those 30 rows and the buffer around them. It does not touch the other 99,970.

Two options change this. If you set [`renderAllRows`](@/api/options.md#renderallrows) or [`renderAllColumns`](@/api/options.md#renderallcolumns) to `true`, you turn virtualization off on that axis, every row or column lives in the DOM, and a render then covers all of them.

### What a render costs

The cost of a render scales with the number of cells it draws, multiplied by the work your renderers and your [`cells`](@/api/options.md#cells) function do for each of them. The number of records you hold is not what drives it.

This has two consequences:

- A render on a grid with 1,000,000 records costs about the same as a render on a grid with 100 records, as long as both show the same number of cells. (Handsontable still keeps some per-record caches, such as row heights, so a render that has to rebuild one of them costs more.)
- Work you put inside a renderer or inside the [`cells`](@/api/options.md#cells) function runs again on every render, for every drawn cell. A small cost there adds up quickly. See [Avoid the `cells` option when possible](@/guides/optimization/performance/performance.md#avoid-the-cells-option-when-possible).

What makes an application slow is rarely one render. It is many renders in a row, which is what [batching](@/guides/optimization/batch-operations/batch-operations.md) exists to prevent.

### When Handsontable renders on its own

Handsontable picks the moments for you. It renders after every CRUD operation, while you scroll, when rows or columns are hidden or trimmed, and at the end of [`updateSettings()`](@/api/core.md#updatesettings). Anything that changes the grid through the Handsontable API is covered.

### When you call `render()` yourself

Call [`render()`](@/api/core.md#render) when you change something that Handsontable cannot detect. The common case is [`setCellMeta()`](@/api/core.md#setcellmeta), which writes to the cell's metadata but does not repaint the grid:

```js
hot.setCellMeta(0, 0, 'className', 'my-highlight');
hot.render(); // without this, the class is stored but not visible
```

Because [`setCellMeta()`](@/api/core.md#setcellmeta) never renders on its own, several calls followed by one [`render()`](@/api/core.md#render) already cost exactly one render:

```js
hot.setCellMeta(0, 0, 'className', 'my-highlight');
hot.setCellMeta(1, 0, 'readOnly', true);
hot.setCellMeta(2, 0, 'type', 'date');
hot.render(); // one render applies all three changes
```

::: warning

[`batch()`](@/api/core.md#batch) does not repaint the grid by itself. It suppresses the renders that other operations would have triggered, and adds none of its own. A callback holding nothing but [`setCellMeta()`](@/api/core.md#setcellmeta) calls therefore leaves the grid unpainted.

When you mix metadata changes with CRUD operations, batch the sequence and call [`render()`](@/api/core.md#render) **inside** the callback:

```js
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.setCellMeta(0, 0, 'className', 'my-highlight');
  hot.render();
});
```

:::

The same applies when an external condition that your renderer reads has changed, but your data has not. If your renderer colors rows based on a value held outside the grid, update that value and then call [`render()`](@/api/core.md#render).

### Why direct DOM changes disappear

Handsontable reuses `td` elements as you scroll, so before it runs a renderer it resets the element: the cell's `class` attribute, its inline `style`, its `dir` attribute, and its accessibility attributes are all cleared. Treat anything written onto a `td` from outside a renderer as lost at the next render, and rely only on what a renderer writes back.

This is why a change you make straight on the DOM disappears at the next render:

```js
// Do not do this. The next render removes the class.
hot.getCell(0, 0).classList.add('my-highlight');
```

Set the class through the cell's metadata instead, so that a renderer reapplies it every time:

```js
hot.setCellMeta(0, 0, 'className', 'my-highlight');
hot.render();
```

If you need markup that no option covers, write a [custom renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md). A renderer runs on every render, so what it writes is always reapplied.

### Observe renders

Two hooks let you see the rendering cycle:

- [`beforeRender`](@/api/hooks.md#beforerender) fires before the cells are drawn.
- [`afterRender`](@/api/hooks.md#afterrender) fires after they are drawn.

Both receive an `isForced` argument. It tells you what triggered the render, not how much work it did. It is `true` for a render that [`render()`](@/api/core.md#render), a settings change, or a data change triggered, and `false` for one triggered by something lighter, such as a selection move. A `false` render can still redraw cells: if the selection moves to a row or column that is not rendered yet, Handsontable draws the new band.

```js
hot.addHook('afterRender', (isForced) => {
  console.log(isForced ? 'forced render' : 'light render');
});
```

Scrolling does not fire either hook. The engine repaints the viewport directly while you scroll, without going through the render path these hooks observe.

Use these hooks to count renders while you profile. If you see many in a row for one user action, batch that action.

## Trade-offs

### There is no per-cell or per-row render

Every repaint redraws the whole rendered part. You cannot repaint one cell or one row on its own, and no API offers it.

This is a deliberate trade. Virtualization already keeps the drawn cell count low and roughly constant, so a render is bounded by the size of the viewport rather than the size of your data. The lever you have is the number of renders, not their size. Use [`batch()`](@/api/core.md#batch) to keep that number down.

### `render()`, `updateSettings()`, and `refreshDimensions()`

Three methods repaint the grid, and they are not interchangeable.

| Method | What it does | Use it when |
|---|---|---|
| [`render()`](@/api/core.md#render) | Redraws the rendered cells. Leaves the configuration alone. | Cell metadata or an external value your renderer reads has changed. |
| [`updateSettings()`](@/api/core.md#updatesettings) | Applies new configuration options, reinitializes the affected plugins, then renders. | An option, a column definition, or the data source has changed. |
| [`refreshDimensions()`](@/api/core.md#refreshdimensions) | Re-measures the container, then resizes the grid's elements and renders when the size changed. | The container was resized while the grid was hidden. |

Pick the narrowest one that does the job. [`updateSettings()`](@/api/core.md#updatesettings) does the most work of the three, so do not reach for it when a render is enough.

You rarely need [`refreshDimensions()`](@/api/core.md#refreshdimensions) at all: Handsontable calls it for you on a window resize and through a `ResizeObserver` on the container. The gap is a container resized while the grid is hidden, inside a `display: none` tab or accordion. The observer callback is skipped there, so call the method yourself once the grid becomes visible again. On a grid with no fixed `height` -- one that scrolls with the page -- the method renders on every call, even when the size did not change, so it is not free in a resize or scroll handler. For container sizing, see [Grid size](@/guides/getting-started/grid-size/grid-size.md).

## Related articles

**Related guides**

<div class="boxes-list">

- [Batch operations](@/guides/optimization/batch-operations/batch-operations.md)
- [Performance](@/guides/optimization/performance/performance.md)
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)

</div>

**Configuration options**

<div class="boxes-list">

- [cells](@/api/options.md#cells)
- [renderAllColumns](@/api/options.md#renderallcolumns)
- [renderAllRows](@/api/options.md#renderallrows)
- [viewportColumnRenderingOffset](@/api/options.md#viewportcolumnrenderingoffset)
- [viewportRowRenderingOffset](@/api/options.md#viewportrowrenderingoffset)

</div>

**Core methods**

<div class="boxes-list">

- [batch()](@/api/core.md#batch)
- [refreshDimensions()](@/api/core.md#refreshdimensions)
- [render()](@/api/core.md#render)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [updateSettings()](@/api/core.md#updatesettings)

</div>

**Hooks**

<div class="boxes-list">

- [afterRender](@/api/hooks.md#afterrender)
- [afterViewRender](@/api/hooks.md#afterviewrender)
- [beforeRender](@/api/hooks.md#beforerender)
- [beforeViewRender](@/api/hooks.md#beforeviewrender)

</div>
