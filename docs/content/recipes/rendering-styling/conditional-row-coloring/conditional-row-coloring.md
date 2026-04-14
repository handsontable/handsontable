---
id: ceb1a2d8
title: Conditional row coloring
metaTitle: Conditional row coloring - JavaScript Data Grid | Handsontable
description: Color entire rows from a status column using the cells callback, className, and scoped CSS that updates after edits.
permalink: /recipes/rendering-styling/conditional-row-coloring
canonicalUrl: /recipes/rendering-styling/conditional-row-coloring
tags:
  - guides
  - tutorial
  - recipes
  - styling
react:
  id: f7c3e91a
  metaTitle: Conditional row coloring - React Data Grid | Handsontable
angular:
  id: b2d804e6
  metaTitle: Conditional row coloring - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Rendering and styling
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.js)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.ts)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.css)

:::

:::

[[toc]]

## Overview

This recipe shows how to tint every cell in a row based on a **status** value (`active`, `pending`, or `inactive`). You map each status to a CSS class, set that class through Handsontable metadata, and keep colors correct on first load and after the user edits **Status**.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Libraries:** None beyond Handsontable.

## Map status values to row classes

Use a small lookup object so the mapping stays in one place.

```typescript
const STATUS_ROW_CLASSES: Record<string, string> = {
  active: 'ht-demo-row-status-active',
  pending: 'ht-demo-row-status-pending',
  inactive: 'ht-demo-row-status-inactive',
};
```

Prefix custom classes (for example `ht-demo-`) so they do not clash with Handsontable internals.

## Apply the class with the `cells` callback

The [`cells`](@/api/options.md#cells) setting runs while cell metadata is built. Return a [`className`](@/api/options.md#classname) object for each cell so the same row class is applied to every column in that row.

The callback receives **physical** row and column indexes. Read the status from the dataset using the **visual** row so sorting and row moves still match what the user sees:

```typescript
cells(
  this: CellProperties,
  row: number,
  _column: number,
  _prop: string | number,
): CellMeta {
  const hot = this.instance;
  const visualRow = hot.toVisualRow(row);

  if (visualRow === null || visualRow < 0) {
    return {};
  }

  const status = hot.getDataAtRowProp(visualRow, 'status');
  const rowClass = statusToRowClass(status);

  if (!rowClass) {
    return {};
  }

  return { className: rowClass };
},
```

Handsontable runs a full render after typical data changes (including dropdown edits), which refreshes this metadata, so row colors stay in sync after edits without extra hooks.

Use a regular `cells` function (not an arrow function) so `this` is the current [`CellProperties`](@/api/cellProperties.md) object and `this.instance` is the grid instance.

## Scoped CSS for row states

Keep rules under your preview root (here `#example1`) so they only affect this demo. Use theme tokens where possible so the table still fits light, dark, and custom themes.

See `example1.css` in the demo tabs for full rules. They set row background tints for **active** and **pending**, and a muted background plus secondary text color for **inactive**.

## `cells` callback vs custom renderer

| Approach | Pros | Trade-offs |
| -------- | ---- | ---------- |
| **`cells` + `className`** | Styling lives in CSS. Works with built-in cell types and editors. One place defines the row class for all columns. | You rely on Handsontable to merge `className` into the DOM. Very large grids should still profile render cost. |
| **Custom [`renderer`](@/api/renderers.md)** | Full control of `innerHTML`, extra markup, and per-cell logic in one function. | If you only use a renderer to add classes, you duplicate logic across columns or wrap the default renderer yourself. Row-wide styling is usually easier with `cells`. |

You can combine both: use `cells` for row-level classes and a custom renderer only where cell content needs special HTML.

### Renderer-only sketch

If you prefer classes inside a renderer, read the row status and update `td.className` (and call the default text renderer if you still want standard cell output):

```typescript
import { textRenderer } from 'handsontable/renderers';

function statusAwareRenderer(
  hot: Handsontable.Core,
  physicalRow: number,
  ...args: Parameters<typeof textRenderer>
) {
  const visualRow = hot.toVisualRow(physicalRow);
  const status =
    visualRow !== null && visualRow >= 0
      ? hot.getDataAtRowProp(visualRow, 'status')
      : undefined;
  const rowClass = statusToRowClass(status);

  if (rowClass) {
    args[0].className = rowClass;
  }

  textRenderer(...args);
}
```

For a whole grid, you would register this renderer on each column (or set it in `cells` as `renderer`), which is why the `className`-only `cells` approach is often shorter for row coloring.

## Acceptance checklist

- **Correct on load and after edits:** Changing **Status** updates data, triggers a render, and rebuilds cell meta so classes match the new value.
- **Scoped CSS:** Selectors are prefixed with `#example1` so styles do not leak globally.
- **Clean code:** Status-to-class mapping is a single object; the `cells` callback stays small and uses `toVisualRow` for correct data reads.

## Related

- [Configuration options: cell and row metadata](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
- [`className` option](@/api/options.md#classname)
