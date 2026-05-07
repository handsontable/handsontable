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

In this tutorial, you will build a custom cell renderer that draws an inline SVG bar chart from an array of numbers in each cell. You will learn how to register a named renderer with `registerRenderer`, bundle it into a cell type with `registerCellType`, and assign it to a read-only sparkline column.

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

- A named renderer registered with `registerRenderer` and bundled as a `sparklineBar` cell type via `registerCellType`.
- Bars scaled to a fixed global scale -- the tallest bar across the entire dataset fills the full SVG height. Editing one cell does not change proportions in other rows.
- Each row always shows five bar slots. A slot is left empty when its source value is missing or non-numeric.
- Safe handling when a row has no valid values or when every value in the dataset is zero.
- Optional coloring: green when a value is at or above the row average, red when below.
- Interactive behavior -- when you edit W1-W5, Handsontable re-renders the sparkline SVG for that row.

## Step 1: Call the base renderer first

Always call `baseRenderer` before you change the cell content. That keeps read-only styling, validation classes, and ARIA attributes consistent with other cells.

## Step 2: Map cell values to slots

Use `toSlots` to map each of the five week keys to either a number or `null`. Returning `null` instead of filtering keeps the slot count fixed at five so the SVG viewBox width never changes. Invalid or missing values produce an empty slot rather than a shifted bar.

## Step 3: Compute a global scale

Call `getGlobalMax` to find the largest absolute value across all rows in the dataset. All bars share this scale, so editing a single cell only changes that row's bar heights -- not the proportions in every other row. A global max of zero means every value in the dataset is zero, which is handled as an edge case.

## Step 4: Build the SVG

Use one `<rect>` per valid slot. Bar height is `(abs(value) / globalMax) * viewBoxHeight`. The viewBox is always `(5 × SLOT - GAP)` wide, so empty slots stay as blank space at their correct position. Average the valid numbers in the row to pick fill colors.

## Step 5: Register the renderer and cell type

Use `registerRenderer('sparklineBar', sparklineRenderer)` to name the renderer, then `registerCellType('sparklineBar', { renderer: 'sparklineBar' })` to bundle it as a cell type. Set `type: 'sparklineBar'` on the sparkline column instead of `renderer: 'sparklineBar'`. Keep that column `readOnly` and leave W1-W5 editable so each edit triggers a fresh render.

## Edge cases covered

| Case | Behavior |
| --- | --- |
| `null` / `undefined` / non-numeric week values | Empty slot -- bar is omitted, neighboring bars keep their positions |
| All week values missing in a row | Em dash, tooltip "No data" |
| All values zero across the entire dataset | Em dash, tooltip "All values are zero" |
| Mixed valid numbers | Bars scale to the global maximum absolute value |

## What you learned

- How to register a named custom renderer with `registerRenderer` and bundle it as a reusable cell type with `registerCellType`.
- How to compute a global scale from the full dataset so bars stay proportional across rows when data changes.
- How to preserve fixed slot positions by returning `null` for invalid values instead of filtering them out.
- How to handle edge cases -- null values, all-zero datasets, and empty rows -- so the renderer degrades gracefully to a placeholder instead of crashing.
- How keeping the sparkline column `readOnly` while leaving the data columns editable triggers a fresh render with updated bars after each edit.

## Next steps

- Explore [conditional row coloring](@/recipes/rendering-styling/conditional-row-coloring/conditional-row-coloring.md) for a simpler styling approach using CSS classes instead of custom SVG output.
- Read the [cell renderer guide](@/guides/cell-functions/cell-renderer/cell-renderer.md) for the full renderer API and lifecycle.

## Related

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) - renderer API and registration patterns.
