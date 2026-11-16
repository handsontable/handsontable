---
type: how-to
title: Many grids on one page
metaTitle: Many grids on one page | Handsontable DataGrid for JavaScript
description: Keep a page with many Handsontable DataGrid instances fast with fixed grid heights, grids created as they scroll into view, and in-place column changes.
permalink: /many-grids
canonicalUrl: /many-grids
tags:
  - many-grids
  - multiple-instances
  - dashboard
  - lazy-loading
  - performance
react:
  metaTitle: Many grids on one page | Handsontable DataGrid for React
angular:
  metaTitle: Many grids on one page | Handsontable DataGrid for Angular
vue:
  metaTitle: Many grids on one page | Handsontable DataGrid for Vue
searchCategory: Guides
category: Optimization
menuTag: new
---
Keep a page with many Handsontable DataGrid instances fast, such as a dashboard or a form with a grid in every section, by giving each grid a fixed height, creating grids as they scroll into view, and changing columns in place.

[[toc]]

## What one grid costs

Every grid is a separate Handsontable instance. Each instance builds its own table, the extra tables that hold frozen rows, frozen columns, and headers, and its own set of page-level event listeners. It then draws every visible cell. None of that work is shared between grids, so the cost of a page grows with the number of grids on it.

In a test in Chromium on a desktop computer, creating a grid of 20 rows and 6 columns with headers took about 6 ms and added a few hundred DOM elements. Destroying it took under 0.5 ms. A hundred such grids took about 0.6 s to create.

Two things follow from those numbers:

- Creating a grid is the expensive part. Destroying one is cheap.
- Recreating a grid pays the full creation cost again. To change a grid, update it in place instead. See [Change columns without recreating the grid](#change-columns-without-recreating-the-grid).

Handsontable creates a grid as soon as you call the constructor or mount the component, even when the grid is far below the visible part of the page. A grid inside a hidden element (`display: none`) is created too, with its tables and listeners. It only waits to draw its cells until it shows on screen.

## Give each grid a fixed height

Set the height of every grid to a fixed value: either a number of pixels or a CSS length (such as `'75vh'`) in the [`height`](@/api/options.md#height) option, or a CSS `height` together with `overflow: hidden` (or `auto`) on the grid's container. The grid then scrolls its own rows inside that box, and scrolling the page costs it nothing. A container with a CSS `height` but no `overflow` doesn't size the grid.

A grid without a fixed height grows with its rows and lets the page scroll them. That includes [`height: 'auto'`](@/api/options.md#height), which costs the same as no height. Such a grid listens to the scroll events of the page, or of the nearest scrolling element around it. So every grid runs code on every scroll step, and the grids in view redraw their rows. In a test with 100 grids of 60 rows and 8 columns each, 40 page-scroll steps made hundreds of thousands of DOM changes when the grids had no height, and none when each grid had a height of 200 pixels.

Small grids pay for this too. Grids of 5 rows have no rows to redraw, but without a fixed height each of them still writes to its DOM on every scroll step. To show every row of a small grid, set a pixel height that fits all its rows. Row heights depend on the theme, so check the height in the theme you use, or set [`rowHeights`](@/api/options.md#rowheights) as well.

::: only-for javascript

```js
const hot = new Handsontable(container, {
  data,
  height: 300,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
```

:::

::: only-for react

```jsx
<HotTable
  // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
  data={data}
  height={300}
/>
```

:::

::: only-for angular

```ts
settings: GridSettings = {
  height: 300,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};
```

```html
<hot-table [data]="data" [settings]="settings"></hot-table>
```

:::

::: only-for vue

```js
const hotSettings = ref({
  data,
  height: 300,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
```

```html
<HotTable :settings="hotSettings" />
```

:::

For all the ways to size a grid, see [Grid size](@/guides/getting-started/grid-size/grid-size.md).

## Load the theme CSS once

A grid that builds its theme with the Theme API adds its own `<style>` element with that theme, about 45 KB. A grid does that when you pass a theme object in [`theme`](@/api/options.md#theme), or when it has no theme set at all: no `theme`, no [`themeName`](@/api/options.md#themename), and no `ht-theme-*` class on its container. With 100 grids, that is about 4.5 MB of CSS. The core styles are different: Handsontable adds them once for the page, however many grids it has.

On a page with many grids, load the theme's CSS files once and give each grid the theme's name, for example `themeName: 'ht-theme-main'`. Each grid then adds no styles of its own. If your page loads the core CSS file too, also set [`injectCoreCss: false`](@/api/options.md#injectcorecss). To change colors and sizes, use the `--ht-*` CSS variables.

For how to load the CSS files, see [Themes: Using CSS files](@/guides/styling/themes/themes.md#option-2-using-css-files).

## Create grids when they scroll into view

To avoid paying for grids the user never scrolls to, create each grid only when its container comes close to the visible part of the page. The browser's [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) API tells you when that happens.

Two details make this work:

- Give each container the height the grid will have, before the grid exists. A container that grows when its grid is created moves the rest of the page down, which can bring more containers into view at once.
- Set a `rootMargin`, so that each grid is created a little before it scrolls into view, and the user doesn't see an empty box.

If your grids scroll inside an element, such as a dashboard panel with `overflow: auto`, pass that element as the observer's `root`. Otherwise the margin applies to the browser window, not to the panel.

In a test with 100 grids, this approach created 4 grids when the page loaded. The other grids were created as the page scrolled down to them.

A grid that doesn't exist yet can't be reached with the keyboard, found with the browser's find-in-page, or read by a screen reader. A wider `rootMargin` creates more of the grids around the visible ones, which narrows that gap but doesn't close it.

::: only-for javascript

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    observer.unobserve(entry.target);

    new Handsontable(entry.target, {
      data: getInventoryData(entry.target.dataset.warehouse),
      colHeaders: ['SKU', 'Product', 'Supplier', 'In stock'],
      height: 300,
      // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
    });
  });
}, { rootMargin: '300px 0px' });

document.querySelectorAll('.inventory-grid').forEach((container) => {
  // reserve the grid's height before the grid exists
  container.style.height = '300px';
  observer.observe(container);
});
```

:::

::: only-for react

```jsx
import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';

function LazyGrid({ data }) {
  const containerRef = useRef(null);
  const [isNearView, setIsNearView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsNearView(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    // reserve the grid's height before the grid exists
    <div ref={containerRef} style={{ height: 300 }}>
      {isNearView && (
        <HotTable
          // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
          data={data}
          colHeaders={['SKU', 'Product', 'Supplier', 'In stock']}
          height={300}
        />
      )}
    </div>
  );
}
```

:::

::: only-for angular

From Angular 17 (stable from Angular 18), a `@defer` block with the `on viewport` trigger creates the grid when the placeholder scrolls into view. The placeholder reserves the grid's height.

```html
@for (warehouse of warehouses; track warehouse.id) {
  @defer (on viewport) {
    <hot-table [data]="warehouse.data" [settings]="settings"></hot-table>
  } @placeholder {
    <div style="height: 300px"></div>
  }
}
```

```ts
settings: GridSettings = {
  colHeaders: ['SKU', 'Product', 'Supplier', 'In stock'],
  height: 300,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};
```

In Angular 16, or to control how far ahead each grid is created, use an `IntersectionObserver` instead. In a component that wraps one grid, observe the host element in `ngAfterViewInit()` with a `rootMargin`. When the element intersects, set a field that a `*ngIf` on `hot-table` reads (an `@if` block from Angular 17), call `markForCheck()`, and disconnect the observer. Disconnect it in `ngOnDestroy()` too. Keep a fixed height on the host element, so the page doesn't move when the grid appears.

:::

::: only-for vue

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { HotTable } from '@handsontable/vue3';

const props = defineProps({ data: Array });

const container = ref(null);
const isNearView = ref(false);
const hotSettings = {
  colHeaders: ['SKU', 'Product', 'Supplier', 'In stock'],
  height: 300,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};

let observer;

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isNearView.value = true;
      observer.disconnect();
    }
  }, { rootMargin: '300px 0px' });

  observer.observe(container.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <!-- reserve the grid's height before the grid exists -->
  <div ref="container" style="height: 300px">
    <HotTable v-if="isNearView" :data="props.data" :settings="hotSettings" />
  </div>
</template>
```

:::

You can also destroy a grid that scrolls far away, to cap the number of live grids. In React, Vue, and Angular, that means unmounting the grid component. Before you do, weigh the costs:

- A destroyed grid loses its state, such as the selection, the scroll position, sorting, and the undo history. Recreate it from data you keep outside the grid.
- Scrolling back pays the full creation cost again. Destroy only grids that are well past the visible area, not the moment they leave it.
- Keep the container's height after you destroy the grid, or the page moves.
- Skip a grid that has the focus or an open editor. Destroying it moves the focus to the page and loses the text being typed.

## Keep the number of grids down

Each grid adds its own listeners to the page, for example for mouse, keyboard, and resize events. A single click anywhere on the page runs those listeners once or more for every grid. With a few grids this is not noticeable. With hundreds, every interaction does work in each of them.

When several grids show the same columns, consider one grid instead. For example, show each group as a parent row with its records as child rows, using the [`NestedRows`](@/guides/rows/row-parent-child/row-parent-child.md) plugin. Check its known limitations first: for example, it doesn't work with column filters or row sorting.

## Change columns without recreating the grid

To change which columns a grid shows, update the existing grid instead of creating a new one. Both of these work in place:

- Hide the columns you don't need, with the [`HiddenColumns`](@/guides/columns/column-hiding/column-hiding.md) plugin.
- Pass a new [`columns`](@/api/options.md#columns) array.

Hiding columns is usually a little cheaper. A new `columns` array makes the `AutoColumnSize` plugin measure the visible columns again, so it costs more when the column widths are automatic. Set [`colWidths`](@/api/options.md#colwidths) and the two cost about the same. Updating in place skips the cost of creating the grid, so it is usually faster than recreating it. The gain shrinks as the grid renders more cells. With [`renderAllColumns`](@/api/options.md#renderallcolumns) and a large [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset), the gain in JavaScript can be small, and in React a new `columns` array can even be slower than recreating the grid. Measure it with your own settings. In React, updating in place also keeps the cell components of component renderers mounted, while recreating the grid mounts every one of them again.

The two differ in what they keep:

- Hidden columns stay part of the grid. They are still in [`getData()`](@/api/core.md#getdata), they are copied to the clipboard by default, and their validators still run. Sorting, filters, and the columns that users moved or resized stay as they are.
- A new `columns` array removes the other columns from `getData()` and from copied data. It also resets sorting, filters, and the rows and columns that users moved, hid, or resized. The `hiddenColumns` option applies again, but a sort that `initialConfig` declares does not. If the update also carries `data`, as every update from the React and Angular wrappers does, only the column state resets (sorting, order, hiding, and width), and only when the columns changed. The rows keep their order, hiding, and trimming. A new array with the same columns, or with columns added or removed at the end, keeps the column state. To keep that state in every case, hide columns instead.

If you pass a new `columns` array, give each column its header in its own [`title`](@/api/options.md#title). A [`colHeaders`](@/api/options.md#colheaders) array is matched to the columns by position, so after you remove a column, the headers no longer match the columns below them.

::: only-for javascript

```js
// hide the "Supplier" column
// (enable the `hiddenColumns` option first, or this call throws)
hot.getPlugin('hiddenColumns').hideColumns([2]);
hot.render();

// or replace the column set, each column with its own header
hot.updateSettings({
  colHeaders: true,
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product' },
    { data: 'stock', title: 'In stock', type: 'numeric' },
  ],
});
```

:::

::: only-for react

Pass the new value as a prop. The wrapper updates the grid in place. Don't change the `key` of `HotTable` to change its columns, because a new `key` destroys the grid and creates a new one.

```jsx
<HotTable
  // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
  data={data}
  columns={columns}
  hiddenColumns={{ columns: hiddenColumnIndexes }}
  height={300}
/>
```

The `columns` prop takes plain Handsontable renderers. To render cells with React components, declare the columns as `HotColumn` children with a `renderer` prop instead. Adding or removing a `HotColumn` child also updates the grid in place.

When the `columns` array holds functions, such as renderers or validators, keep the array stable, for example as a module constant or with `useMemo`. A new function on every render makes the wrapper send the columns to the grid again on every render.

:::

::: only-for angular

Assign a new settings object. The wrapper updates the grid in place. Don't remove the `hot-table` element from the template and add it back, for example with `@if` or `*ngIf`, to change its columns, because that destroys the grid and creates a new one.

```ts
this.settings = {
  ...this.settings,
  // replace the `colHeaders` array with each column's own `title`
  colHeaders: true,
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product' },
    { data: 'stock', title: 'In stock', type: 'numeric' },
  ],
};
```

:::

::: only-for vue

Assign a new value to the settings. The wrapper updates the grid in place. Don't change the `key` of `HotTable` or toggle it with `v-if` to change its columns, because that destroys the grid and creates a new one.

```js
hotSettings.value = {
  ...hotSettings.value,
  // replace the `colHeaders` array with each column's own `title`
  colHeaders: true,
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product' },
    { data: 'stock', title: 'In stock', type: 'numeric' },
  ],
};
```

:::

## Keep the rendering options at their defaults

By default, a grid draws the rows and columns in view and a few more around them. These options make it draw more:

- [`renderAllRows`](@/api/options.md#renderallrows) and [`renderAllColumns`](@/api/options.md#renderallcolumns) draw every row or every column.
- A number in [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset) or [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) draws that many extra rows or columns on each side of the visible ones. The default, `'auto'`, draws one extra row or column on each side, and can add a few more in the direction you scroll.

On one grid the extra cells may not matter, and a larger offset can even make scrolling smoother. On a page with many grids, they add up. In a test, a grid of 1,000 rows and 60 columns, 300 pixels wide and 300 pixels high, drew about 70 cells with the defaults, and about 6,600 cells with `renderAllColumns: true` and `viewportRowRenderingOffset: 100`.

On a page with many grids, keep `renderAllRows` and `renderAllColumns` at `false`, and both offsets at `'auto'`. Also set fixed column widths, so that grids don't measure their columns when they load. See [Set constant row and column sizes](@/guides/optimization/performance/performance.md#set-constant-row-and-column-sizes).

If you raised these options to reach cells that are not drawn, there are cheaper ways:

- To find a cell in a test, add your test attributes in the [`afterRenderer`](@/api/hooks.md#afterrenderer) hook, and scroll the cell into view with [`scrollViewportTo()`](@/api/core.md#scrollviewportto) first.
- To let users find text, use the [`Search`](@/guides/navigation/searching-values/searching-values.md) plugin. The browser's find-in-page only sees the drawn cells.
- To avoid empty rows during fast scrolling, set a small offset, such as 10 to 20 rows.
- To read all the data, use [`getData()`](@/api/core.md#getdata) or export the data. Neither needs the cells to be drawn.

::: only-for react

A column rendered with a React component (the `renderer` prop of `HotColumn`) isn't sized to its content, so it keeps the default width. Set [`colWidths`](@/api/options.md#colwidths) for such columns. A function renderer in the `hotRenderer` prop draws cells without mounting a React component for each cell, which costs less on a page with many grids.

:::

## Related articles

### Related guides

<div class="boxes-list">

- [Performance](@/guides/optimization/performance/performance.md)
- [Grid size](@/guides/getting-started/grid-size/grid-size.md)
- [Row virtualization](@/guides/rows/row-virtualization/row-virtualization.md)
- [Column virtualization](@/guides/columns/column-virtualization/column-virtualization.md)
- [Column hiding](@/guides/columns/column-hiding/column-hiding.md)
- [Row parent-child](@/guides/rows/row-parent-child/row-parent-child.md)

</div>

### Related API reference

**Configuration options:**

<div class="boxes-list">

- [`columns`](@/api/options.md#columns)
- [`height`](@/api/options.md#height)
- [`hiddenColumns`](@/api/options.md#hiddencolumns)
- [`renderAllColumns`](@/api/options.md#renderallcolumns)
- [`renderAllRows`](@/api/options.md#renderallrows)
- [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
- [`viewportRowRenderingOffset`](@/api/options.md#viewportrowrenderingoffset)

</div>

**Core methods:**

<div class="boxes-list">

- [`destroy()`](@/api/core.md#destroy)
- [`updateSettings()`](@/api/core.md#updatesettings)

</div>
