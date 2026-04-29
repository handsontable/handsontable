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
type: tutorial
---

In this tutorial, you will build a custom cell renderer that draws an inline SVG bar chart from an array of numbers in each cell. You will learn how to register a named renderer with `registerRenderer` and assign it to a read-only sparkline column.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.js)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.ts)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/react/example1.css)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/react/example1.jsx)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/angular/example1.ts)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/angular/example1.html)
@[code](@/content/recipes/rendering-styling/sparkline-cell-renderer/angular/example1.css)

:::

:::

## Overview

This recipe shows how to edit weekly values in table cells and render a mini bar chart with inline SVG in a separate sparkline column. No charting library is required.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Libraries:** None

## What you'll build

- A registered renderer that reads each row's `w1` to `w5` values.
- Bars scaled so the tallest bar uses the full SVG height (fixed viewBox, `preserveAspectRatio="none"` so the chart stretches with the cell).
- Safe handling when the value is missing, not an array, empty, or all zeros.
- Optional coloring: green when a value is at or above the row average, red when below.
- Interactive behavior - when you edit W1-W5, Handsontable re-renders the sparkline SVG for that row.

## Step 1: Call the base renderer first

Always call `baseRenderer` before you change the cell content. That keeps read-only styling, validation classes, and ARIA attributes consistent with other cells.

## Step 2: Normalize the cell value

Coerce each `w1`-`w5` entry to a number and drop `NaN` values. If the result is empty, or if every number is zero, show an em dash and set `title` for a short tooltip instead of drawing bars.

## Step 3: Build the SVG

Use one `<rect>` per value. Bar height is `(abs(value) / maxAbs) * viewBoxHeight` so proportions match the largest magnitude in that row. Average the finite numbers in the array to pick fill colors.

## Step 4: Register and assign the renderer

Use `registerRenderer('sparklineBar', sparklineRenderer)` and set `renderer: 'sparklineBar'` on a dedicated sparkline column. Keep that sparkline column read-only, and keep W1-W5 editable so each edit triggers a fresh render.

## Edge cases covered

| Case | Behavior |
| --- | --- |
| `null` / `undefined` / non-numeric week values | Treated as no data |
| All week values missing | Em dash, tooltip "No data" |
| All zeros | Em dash, tooltip "All values are zero" |
| Mixed valid numbers | Bars scale to the maximum absolute value |

## What you learned

- How to register a named custom renderer with `registerRenderer` and reference it by name in column settings.
- How to build an inline SVG bar chart from an array of numbers, normalizing bar heights to the maximum absolute value in each row.
- How to handle edge cases -- null values, all-zero arrays, and empty arrays -- so the renderer degrades gracefully to a placeholder instead of crashing.
- How keeping the sparkline column `readOnly` while leaving the data columns editable triggers a fresh render with updated bars after each edit.

## Next steps

- Explore [conditional row coloring](@/recipes/rendering-styling/conditional-row-coloring/conditional-row-coloring.md) for a simpler styling approach using CSS classes instead of custom SVG output.
- Read the [cell renderer guide](@/guides/cell-functions/cell-renderer/cell-renderer.md) for the full renderer API and lifecycle.

## Related

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) - renderer API and registration patterns.
