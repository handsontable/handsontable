---
title: Cache the output of an expensive cell renderer
metaTitle: Cache the output of an expensive cell renderer - JavaScript Data Grid | Handsontable
description: Compute a slow cell value once per data record and reuse it on every render, by keying the cache by the record instead of the td element.
permalink: /recipes/performance/expensive-cell-renderer
canonicalUrl: /recipes/performance/expensive-cell-renderer
tags:
  - recipes
  - performance
  - custom-renderer
  - cache
  - weakmap
  - scrolling
react:
  metaTitle: Cache the output of an expensive cell renderer - React Data Grid | Handsontable
angular:
  metaTitle: Cache the output of an expensive cell renderer - Angular Data Grid | Handsontable
vue:
  metaTitle: Cache the output of an expensive cell renderer - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Performance
type: tutorial
menuTag: new
---

In this tutorial, you will make an expensive custom renderer cheap by computing its output once per data record and reusing it on every later render. You will learn why a cache keyed by the `td` element does not work, how to key it by the record instead, and how to invalidate it when the data changes.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --html 3

@[code](@/content/recipes/performance/expensive-cell-renderer/javascript/example1.js)
@[code](@/content/recipes/performance/expensive-cell-renderer/javascript/example1.ts)
@[code](@/content/recipes/performance/expensive-cell-renderer/javascript/example1.html)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/performance/expensive-cell-renderer/react/example1.jsx)
@[code](@/content/recipes/performance/expensive-cell-renderer/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/performance/expensive-cell-renderer/angular/example1.ts)
@[code](@/content/recipes/performance/expensive-cell-renderer/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~15 minutes

Handsontable calls a cell renderer for every rendered cell on every render -- after each scroll, sort, edit, or `render()` call. A renderer that computes something slow from the cell's data -- a chart, a parsed document, a formatted summary -- repeats that work for the same record again and again. A cache fixes that, but only if you pick the right key.

[[toc]]

## What you'll build

An order grid with 300 customers, where the **Trend** column turns twelve monthly sales figures into a text sparkline and a percent change. The grid:

- Counts renderer calls and computations, and shows both counters under the grid.
- Computes each record's trend once, however often the grid renders.
- Recomputes a record only when its `sales` array is replaced.
- Has a **Render again** button, which repaints the grid without a single new computation, and an **Update the first row** button, which triggers exactly one.

## Before you begin

- You need a working Handsontable installation. See the [Getting started](@/guides/getting-started/introduction/introduction.md) guide.
- Read [Understanding rendering](@/guides/optimization/rendering/rendering.md) to know what a render covers and why direct DOM changes disappear.
- You should be familiar with [custom renderer functions](@/guides/cell-functions/cell-renderer/cell-renderer.md).

## Step 1 -- Write the slow computation as a plain function

Keep the expensive work in a function that takes the data in and returns the output, with nothing else in between:

```javascript
function buildTrend(sales) {
  const glyphs = '▁▂▃▄▅▆▇█';
  const min = Math.min(...sales);
  const max = Math.max(...sales);
  const range = max - min || 1;
  const bars = sales
    .map((value) => glyphs[Math.round(((value - min) / range) * (glyphs.length - 1))])
    .join('');
  const change = Math.round(((sales[sales.length - 1] - sales[0]) / sales[0]) * 100);

  return `${bars} ${change >= 0 ? '+' : ''}${change}%`;
}
```

**What's happening:** `buildTrend()` is a pure function. The same input always gives the same output, and it reads nothing from the grid or the DOM. That is what makes its result safe to cache. In this recipe the computation is small so the demo stays responsive; in your app it is whatever costs the most in your renderer.

## Step 2 -- Count what the renderer does

Two counters make the effect of the cache visible:

```javascript
const stats = { rendererCalls: 0, computations: 0 };
```

The renderer increments `rendererCalls` on every call and `computations` only when it runs `buildTrend()`. The [`afterViewRender`](@/api/hooks.md#afterviewrender) hook writes both counters under the grid:

```javascript
afterViewRender() {
  statsElement.textContent = `Renderer calls: ${stats.rendererCalls} | Computations: ${stats.computations}`;
}
```

**Why `afterViewRender`, and why not write the counters from inside the renderer?** `afterViewRender` runs once per draw, after every cell renderer has finished, and it also runs for the draws that scrolling triggers -- which [`afterRender`](@/api/hooks.md#afterrender) does not report. A renderer runs once per cell, so a DOM write there would run hundreds of times per draw.

## Step 3 -- Key the cache by the data record, not by the `td`

```javascript
const trendCache = new WeakMap();
```

The cache is a `WeakMap` whose keys are the row objects of your data source. It holds one entry per record, and each entry remembers the input it was computed from:

```javascript
{ input: sales, output: buildTrend(sales) }
```

**Why not key the cache by the `td` element?** Handsontable renders only the visible cells plus a small buffer, and it keeps a fixed set of `td` elements for them. As you scroll, each `td` is rewritten to show a different record. A cache keyed by the `td` -- a `WeakMap` of `td` to output, or a property set on the element -- therefore misses on almost every renderer call while you scroll, and the expensive work runs for cells that were computed a moment ago. The record is the thing that stays the same between renders, so it is the key.

**Why a `WeakMap`?** When a record leaves the data set and nothing else references it, its cache entry is released with it. A plain `Map` would keep every record alive.

## Step 4 -- Use the cache in the renderer

```javascript
const trendRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);
  stats.rendererCalls += 1;

  const record = data[instance.toPhysicalRow(row)];
  const sales = value;

  if (!record || !Array.isArray(sales) || sales.length === 0) {
    td.textContent = '—';

    return;
  }

  let entry = trendCache.get(record);

  if (!entry || entry.input !== sales) {
    stats.computations += 1;
    entry = { input: sales, output: buildTrend(sales) };
    trendCache.set(record, entry);
  }

  td.textContent = entry.output;
};
```

**What's happening:**

1. [`baseRenderer()`](@/api/renderers.md) applies the standard cell classes, so the cell still reacts to `readOnly`, validation, and the rest of the cell meta.
2. `row` is a visual index, and your `data` array is in physical order, so [`toPhysicalRow()`](@/api/core.md#tophysicalrow) translates it before the lookup. Without the translation, sorting the grid would pair a cell with the wrong record. Read the record from your own array: [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) returns a copy of the row on every call, so a `WeakMap` keyed by its result never hits.
3. The guard covers the two rows that have no record to key on: a spare row added by [`minSpareRows`](@/api/options.md#minsparerows), and a row the renderer sees while [`alter()`](@/api/core.md#alter) is still running. `undefined` is not a valid `WeakMap` key, so caching one throws and takes the whole draw down with it. An empty cell is caught by the same check.
4. `value` is the cell's value -- here, the `sales` array, handed to the renderer as the same array that sits in the record, not a copy. If the record has an entry and the entry was computed from this same array, the renderer reuses the output. Otherwise it computes, stores, and moves on.
5. The renderer always writes `td.textContent`, because the grid resets a `td` before it runs a renderer. Only what the renderer writes back survives.

**The renderer closes over `data`, so keep that binding current.** This renderer indexes the same array it gave the grid. If you later swap the data set with [`updateData()`](@/api/core.md#updatedata) or [`loadData()`](@/api/core.md#loaddata), the grid holds the new array while the closure still points at the old one, and every lookup returns a stale record or `undefined` -- with no error. Point the closure at the new array in the same step, or key the cache by the cell value instead, which needs no closure at all (see [Variations](#variations)).

Attach the renderer to the column:

```javascript
columns: [
  { data: 'id', type: 'numeric', width: 70, readOnly: true },
  { data: 'customer', type: 'text', width: 170 },
  { data: 'region', type: 'text', width: 90 },
  { data: 'sales', renderer: trendRenderer, width: 190, readOnly: true },
],
```

## Step 5 -- Invalidate when the data changes

The entry stores the input it was computed from, so the cache invalidates itself when the input is replaced. The **Update the first row** button replaces the first record's `sales` array:

```javascript
const nextSales = data[0].sales.map((value, month) => Math.round(value * (1 + month / 10)));

hot.setSourceDataAtCell(0, 'sales', nextSales);
```

The button first calls [`scrollViewportTo({ row: 0 })`](@/api/core.md#scrollviewportto), because a cell outside the rendered band is not painted at all -- without it, a reader who has scrolled away sees no counter change. [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell) then writes the new array into the record and renders the grid. On that render, `entry.input !== sales` is `true` for that one record, and `computations` grows by one. Every other cell hits the cache.

**Replace, do not mutate.** The renderer compares inputs by identity. A change made in place, such as `data[0].sales[11] = 5000`, leaves the array's identity unchanged, so the cached output stays stale. Either replace the array, as above, or delete the entry by hand before you render:

```javascript
trendCache.delete(data[0]);
hot.render();
```

The same rule applies to a primitive value: the `input !== value` check compares two strings or two numbers by value, so an edited cell is recomputed on its own.

## How it works -- complete flow

1. **First render.** The renderer runs for every rendered cell of the **Trend** column, and `computations` equals the number of rendered rows: every record is new to the cache.
2. **Scroll down.** The renderer runs again for every cell in the new viewport, but `computations` grows only by the rows that were not rendered before.
3. **Scroll back up.** `rendererCalls` keeps growing; `computations` does not move. Every record on screen is already in the cache.
4. **Render again.** `rendererCalls` grows by the number of rendered cells; `computations` stays where it was.
5. **Update the first row.** The grid scrolls back to the top and `computations` grows by exactly one.

## Variations

- **The value is an object.** When the cell's value is itself an object or an array, you can key the `WeakMap` by the value and skip the record lookup: the grid hands the renderer the value itself, not a copy. A replaced value is then a new key, and the old entry is released with the old value.
- **The renderer mounts a component.** If your renderer mounts a framework component or builds a large DOM subtree, cache the container element itself and move it into the `td` the renderer receives. Three rules make that safe, and the [React wrapper](@/guides/integrate-with-react/react-installation/react-installation.md) follows all three in its own renderer bridge:
  1. **Put the table in the key, not only the coordinates.** A cell in a frozen column is drawn twice, once in the master table and once in the overlay clone. One element has one parent, so a container shared by both draws lands in whichever table rendered last and leaves the other `td` empty. Key by instance, table, row, and column together.
  2. **Move it only when it is not already there.** Check `container.parentNode === contentRoot` first. Re-inserting on every draw detaches and remounts the component each time, which is the cost you are trying to avoid.
  3. **Insert into the cell's content root, not into the `td`.** Use `getCellContentRoot(td)` from `handsontable/helpers/dom/element` as the parent. On a row with an exact height the cell holds a clipping wrapper, and a node placed beside it instead of inside it makes the row grow back.

  Keep the cache bounded to the viewport: drop entries for coordinates that are no longer rendered, or the container cache grows with every row the user scrolls past.
- **Renders that are not scrolls.** The [`renderMode`](@/api/options.md#rendermode) option set to `'onChange'` lets a render skip cells whose data, meta, and position did not change since their last paint. It does not skip cells while you scroll, because a scrolled cell shows another record, so the cache in this recipe is still what saves the computation there. The two combine well: the option removes the renderer call, the cache removes the computation.

## What you learned

- A renderer runs for every rendered cell on every render, so a slow computation inside it runs far more often than the data changes.
- The grid reuses `td` elements for different records as you scroll, so a `td` is the wrong cache key. The data record, or the cell coordinates, is the right one.
- A `WeakMap` keyed by the record releases entries together with the records.
- Storing the input next to the output makes the cache invalidate itself when the input is replaced. In-place mutation keeps the same identity, so it needs an explicit `delete()`.
- How to translate a visual row index to a physical one before reading the data source.
- Why a renderer needs a guard for a row with no record: a `WeakMap` cannot take `undefined` as a key, and a throw inside a renderer takes the whole draw down.

## Next steps

- If your renderer only formats the value -- units, dates, text transforms -- use the [`valueFormatter`](@/api/options.md#valueformatter) option instead of a custom renderer.
- Reduce the number of renders with [`batch()`](@/api/core.md#batch) when you change many cells at once. See [Batch operations](@/guides/optimization/batch-operations/batch-operations.md).
- Skip unchanged cells on non-scroll renders with [`renderMode: 'onChange'`](@/guides/optimization/rendering/rendering.md#skip-the-cells-that-did-not-change).
- For a renderer that draws an SVG chart in the cell, see the [Sparkline cell renderer](@/recipes/rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer.md) recipe.
