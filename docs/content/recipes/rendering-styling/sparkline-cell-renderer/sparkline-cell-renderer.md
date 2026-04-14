---
id: e4a91c2b
title: Sparkline cell renderer
metaTitle: Sparkline cell renderer - JavaScript Data Grid | Handsontable
description: Build a custom Handsontable cell renderer that draws an inline SVG bar chart from an array of numbers in each cell.
permalink: /recipes/rendering-styling/sparkline-cell-renderer
canonicalUrl: /recipes/rendering-styling/sparkline-cell-renderer
tags:
  - guides
  - tutorial
  - recipes
  - renderer
react:
  id: f8d03a71
  metaTitle: Sparkline cell renderer - React Data Grid | Handsontable
angular:
  id: a1c9e582
  metaTitle: Sparkline cell renderer - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Rendering and styling
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.js)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.ts)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.css)

:::

:::

## Overview

This recipe shows how to store a short series of numbers in a single cell (for example weekly sales) and render it as a mini bar chart with inline SVG. No charting library is required.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Libraries:** None

## What you'll build

- A registered renderer that reads an array value like `[4, 8, 2, 9, 5]`.
- Bars scaled so the tallest bar uses the full SVG height (fixed viewBox, `preserveAspectRatio="none"` so the chart stretches with the cell).
- Safe handling when the value is missing, not an array, empty, or all zeros.
- Optional coloring: green when a value is at or above the row average, red when below.

## Step 1: Call the base renderer first

Always call `baseRenderer` before you change the cell content. That keeps read-only styling, validation classes, and ARIA attributes consistent with other cells.

## Step 2: Normalize the cell value

Coerce each entry to a number and drop `NaN` values. If the result is empty, or if every number is zero, show an em dash and set `title` for a short tooltip instead of drawing bars.

## Step 3: Build the SVG

Use one `<rect>` per value. Bar height is `(abs(value) / maxAbs) * viewBoxHeight` so proportions match the largest magnitude in that row. Average the finite numbers in the array to pick fill colors.

## Step 4: Register and assign the renderer

Use `registerRenderer('sparklineBar', sparklineRenderer)` and set `renderer: 'sparklineBar'` on the column that holds the arrays. The sample uses `readOnly: true` on that column because the demo focuses on display.

## Edge cases covered

| Case | Behavior |
| --- | --- |
| `null` / `undefined` / non-array | Treated as no data |
| Empty array | Em dash, tooltip "No data" |
| All zeros | Em dash, tooltip "All values are zero" |
| Mixed valid numbers | Bars scale to the maximum absolute value |

## Related

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) - renderer API and registration patterns.
