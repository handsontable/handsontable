---
id: f2q8n4k1
title: Row validation with error summary
metaTitle: Row Validation Error Summary Recipe - JavaScript Data Grid | Handsontable
description: Validate every row on a Submit action, list failures outside the grid, highlight cells with htInvalid, and clear state when the user fixes a cell.
permalink: /recipes/editing-validation/row-validation-error-summary
canonicalUrl: /recipes/editing-validation/row-validation-error-summary
tags:
  - guides
  - tutorial
  - recipes
  - validation
react:
  id: g5r1m7p3
  metaTitle: Row Validation Error Summary Recipe - React Data Grid | Handsontable
angular:
  id: h8s4n9q6
  metaTitle: Row Validation Error Summary Recipe - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Editing and Validation
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/editing-validation/row-validation-error-summary/javascript/example1.js)
@[code](@/content/recipes/editing-validation/row-validation-error-summary/javascript/example1.ts)
@[code](@/content/recipes/editing-validation/row-validation-error-summary/javascript/example1.css)

:::

:::

## Overview

Run validation for **all rows** when the user clicks **Submit orders**. Keep rules in a map from **column index** to a small function that returns `null` when the value is valid, or a string message when it is not. Collect every failure, show them in a list under the grid, and mark bad cells with `htInvalid` using `setCellMeta` plus `render()`. When the user edits a cell that was marked invalid, clear that cell's highlight and update the summary.

**Difficulty:** Beginner  
**Time:** ~15 minutes

## Steps

1. **Rule map** - `Record<number, (value) => string | null>` keyed by visual column index.
2. **Submit handler** - Loop `row` from `0` to `hot.countRows() - 1` and `col` over columns that have rules. Push `{ row, col, message }` for each failure.
3. **Summary** - Render the list as plain HTML (for example `Row 3, Unit price: must be greater than 0`).
4. **Highlight** - For each issue, `hot.setCellMeta(row, col, 'className', 'htInvalid')` and optionally `setCellMeta(..., 'title', message)` for a native tooltip. Call `hot.render()`.
5. **Reset between submits** - Before validating again, remove `className` and `title` from every cell you highlighted last time (`removeCellMeta`).
6. **`afterChange`** - If the change touches a cell that is still in your invalid set, remove its meta, drop it from the summary, and `render()`.

## Acceptance checks

- Invalid cells use the `htInvalid` class after **Submit orders**.
- The summary lists every problem with row number, column label, and message.
- Fixing a highlighted cell removes that row from the summary and the red styling; **Submit orders** with a clean grid shows no issues.

## Full example

The demo uses object data (`item`, `qty`, `price`) as a small order form. See the embedded example for the complete `validationRules` map and the Submit button wiring.

```typescript
const validationRules: Record<number, (value: unknown) => string | null> = {
  0: (value) => (String(value ?? '').trim() ? null : 'Item name is required'),
  // ...
};

submitBtn.addEventListener('click', () => {
  // clear old highlights, scan all rows, renderSummary(issues), applyHighlights(hot, issues)
});
```
