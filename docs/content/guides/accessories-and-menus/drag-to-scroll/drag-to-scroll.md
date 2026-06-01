---
type: reference
id: k3mw9bpx
title: Drag to scroll
metaTitle: Drag to scroll - JavaScript Data Grid | Handsontable
description: Scroll the grid automatically by dragging a cell selection or fill handle outside the visible viewport.
permalink: /drag-to-scroll
canonicalUrl: /drag-to-scroll
tags:
  - auto scroll
  - drag scroll
  - scroll on drag
  - selection scroll
  - fill handle scroll
react:
  id: j8nt5qra
  metaTitle: Drag to scroll - React Data Grid | Handsontable
angular:
  id: h2vz7cfs
  metaTitle: Drag to scroll - Angular Data Grid | Handsontable
vue:
  id: axdawq9z
  metaTitle: Drag to scroll - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: new
---

Drag any cell selection or fill handle outside the visible viewport to scroll the grid automatically while extending the selection.

[[toc]]

## Overview

The [`DragToScroll`](@/api/dragToScroll.md) plugin watches for mouse drags that move outside the grid's visible area. When the cursor crosses a viewport edge, the plugin scrolls the grid in that direction and extends the active selection to follow -- exactly as spreadsheet applications behave.

The plugin is enabled by default. It activates during two types of drags:

- **Cell selection drag** -- click a cell, hold, and drag beyond the edge to extend the selection.
- **Fill handle drag** -- drag the fill handle (the small square in the bottom-right corner of a selection) beyond the edge to autofill into additional rows or columns.

Scroll speed follows a logarithmic curve: it starts slow when the cursor is just past the edge, then accelerates as the cursor moves farther away. This gives you precise control for small selections and fast navigation for large ones.

## Enable drag to scroll

The plugin is enabled by default. To enable it explicitly, set [`dragToScroll`](@/api/options.md#dragtoscroll) to `true`:

```javascript
dragToScroll: true,
```

To see drag-to-scroll in action, click any cell in the grid below, hold the mouse button, and drag past any edge of the viewport.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/angular/example1.html)

:::

:::

## Configure scroll speed

Pass an object to [`dragToScroll`](@/api/options.md#dragtoscroll) to control how quickly the viewport scrolls:

```javascript
dragToScroll: {
  interval: {
    min: 20,
    max: 500,
  },
  rampDistance: 120,
},
```

The three parameters work together to shape the acceleration curve:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `interval.min` | `number` | `20` | Minimum scroll interval in milliseconds. This is the fastest the scroll gets -- reached when the cursor is at `rampDistance` pixels outside the edge. A lower value produces faster peak scrolling. |
| `interval.max` | `number` | `500` | Maximum scroll interval in milliseconds. This is the slowest the scroll starts -- applied when the cursor first crosses the viewport edge. A higher value produces a more gradual start. |
| `rampDistance` | `number` | `120` | Distance in pixels from the viewport edge over which the interval decreases from `max` to `min`. A shorter distance causes the scroll to reach peak speed more quickly. |

The interval decreases on a logarithmic scale as the cursor moves away from the viewport edge. This means the biggest speed increase happens close to the edge, and the rate of acceleration gradually falls off farther out.

<img src="/docs/svg/drag-to-scroll-interval-chart.svg" alt="Chart showing scroll interval decreasing logarithmically from interval.max at the viewport edge to interval.min at rampDistance pixels outside" style="max-width:580px;display:block;margin:1.5rem 0;">

Use the sliders below to adjust all three parameters. The grid reloads with the new settings so you can drag a selection outside the viewport to feel the difference.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/drag-to-scroll/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/drag-to-scroll/angular/example2.html)

:::

:::

## Disable drag to scroll

Set [`dragToScroll`](@/api/options.md#dragtoscroll) to `false` to turn off the plugin entirely. The viewport will not scroll when the cursor leaves it during a drag.

```javascript
dragToScroll: false,
```

## Related API reference

**Configuration options**

<div class="boxes-list">

- [`dragToScroll`](@/api/options.md#dragtoscroll)

</div>

**Plugins**

<div class="boxes-list">

- [`DragToScroll`](@/api/dragToScroll.md)

</div>
