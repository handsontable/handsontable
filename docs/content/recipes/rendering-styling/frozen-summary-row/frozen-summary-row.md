---
id: k9m2xp4q
title: Frozen summary row
metaTitle: Frozen summary row recipe - JavaScript Data Grid | Handsontable
description: Pin a read-only totals row at the bottom with fixedRowsBottom, recalculate on afterChange, and style it with the cells callback.
permalink: /recipes/rendering-styling/frozen-summary-row
canonicalUrl: /recipes/rendering-styling/frozen-summary-row
tags:
  - guides
  - tutorial
  - recipes
  - fixed rows
  - summary
react:
  id: n4w7rt8y
  metaTitle: Frozen summary row recipe - React Data Grid | Handsontable
angular:
  id: h3j6vs2b
  metaTitle: Frozen summary row recipe - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Rendering and styling
type: how-to
---

In this tutorial, you will pin a read-only totals row at the bottom of the grid. You will learn how to use `fixedRowsBottom`, recalculate aggregates on `afterChange`, and style the summary row with the `cells` callback.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/rendering-styling/frozen-summary-row/javascript/example1.js)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/javascript/example1.ts)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/rendering-styling/frozen-summary-row/react/example1.css)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/react/example1.jsx)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/rendering-styling/frozen-summary-row/angular/example1.ts)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/angular/example1.html)
@[code](@/content/recipes/rendering-styling/frozen-summary-row/angular/example1.css)

:::

:::

## Overview

This recipe pins a single **summary** row to the bottom of the grid so it stays visible while you scroll. The row shows **sum**, **average**, and **count** for each numeric column, skips non-numeric values, stays **read-only**, and updates whenever data changes.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Libraries:** None (core Handsontable only)

## What you will build

- A grid with at least five data rows and three numeric columns, plus one frozen bottom row.
- Aggregates that ignore the summary row and ignore values that are not finite numbers.
- Distinct styling (weight and background) applied through the [`cells`](@/api/options.md#cells) callback.

## Prerequisites

- Basic Handsontable setup with [`registerAllModules`](@/api/registry.md#registerallmodules).
- Familiarity with [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom) and [`afterChange`](@/api/hooks.md#afterchange).

## Step 1: Include the summary row in your data

Add one extra row at the end of your dataset. That row is both the **last logical row** and the row you freeze with `fixedRowsBottom: 1`. Keeping it in `data` lets you use normal APIs ([`setDataAtRowProp`](@/api/core.md#setdataatrowprop), renderers, validators) like any other row.

## Step 2: Freeze the bottom row

Set [`fixedRowsBottom: 1`](@/api/options.md#fixedrowsbottom) so the summary row is always visible at the bottom of the viewport.

## Step 3: Compute sum, average, and count

For each numeric column, scan **only** data rows above the summary row. Use a small helper that returns a number for numeric strings and finite numbers, and `null` for everything else - so stray text does not break the aggregation.

For each column, compute:

- **Sum** - sum of parsed values.
- **Avg** - sum divided by how many numeric values you counted.
- **Count** - number of numeric values (not including blanks or non-numeric text).

Write the formatted string into the summary cells with [`setDataAtRowProp`](@/api/core.md#setdataatrowprop).

## Step 4: Recalculate on load and on edits

- Call your refresh function from [`afterInit`](@/api/hooks.md#afterinit) so the summary is correct on first render.
- Call it from [`afterChange`](@/api/hooks.md#afterchange) whenever a **data** cell changes.

Pass a custom `source` string (for example `updateSummary`) into `setDataAtRowProp` so your `afterChange` handler can **ignore** changes that only update the summary row. That avoids extra refresh passes or feedback loops.

## Step 5: Make the summary row read-only and styled

Use the [`cells`](@/api/options.md#cells) callback (row, column, prop) to return metadata **only** for the summary row:

- Set [`readOnly: true`](@/api/options.md#readonly) so users cannot edit totals.
- Set [`className`](@/api/options.md#classname) (for example `htSummaryRow`, and `htRight` on numeric columns) and define those classes in a small CSS file.
- For summary cells that display text aggregates, set [`type: 'text'`](@/api/options.md#type) so Handsontable does not run the numeric cell renderer on those strings.

Prefer Handsontable theme variables (for example `--ht-background-color-extra-light`) so the row still looks correct with different themes.

## Related guides

- [Row freezing](@/guides/rows/row-freezing/row-freezing.md) - fixed rows top and bottom.
- [Column summary](@/guides/columns/column-summary/column-summary.md) - built-in [`ColumnSummary`](@/api/columnSummary.md) plugin when you want declarative summaries instead of a custom row.

## What you learned

- How `fixedRowsBottom` pins the last N rows at the bottom of the grid so they stay visible during scrolling.
- How to recalculate summary values in `afterChange` and `afterInit` and write them back with `hot.setDataAtRowProp()`.
- How to use the `cells` callback to mark only the summary row as `readOnly` and apply a custom `className` for styling.
- Why you should use Handsontable theme CSS variables (such as `--ht-background-color-extra-light`) in your summary row styles so the row stays visually consistent across themes.

## Next steps

- Explore [conditional row coloring](@/recipes/rendering-styling/conditional-row-coloring/conditional-row-coloring.md) to style data rows based on cell values while keeping the summary row fixed.
- Explore the [ColumnSummary plugin](@/api/columnSummary.md) for a declarative, built-in alternative to a custom summary row.

## API reference

<div class="boxes-list">

- [fixedRowsBottom](@/api/options.md#fixedrowsbottom)
- [cells](@/api/options.md#cells)
- [afterChange](@/api/hooks.md#afterchange)
- [afterInit](@/api/hooks.md#afterinit)
- [setDataAtRowProp](@/api/core.md#setdataatrowprop)

</div>
