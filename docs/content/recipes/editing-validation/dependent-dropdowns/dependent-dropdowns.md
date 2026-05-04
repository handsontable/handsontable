---
id: b4n8q1z5
title: Dependent dropdowns
metaTitle: Dependent Dropdowns Recipe - JavaScript Data Grid | Handsontable
description: Drive a child column dropdown from a parent column using a dependency map, afterChange, setCellMeta, and render.
permalink: /recipes/editing-validation/dependent-dropdowns
canonicalUrl: /recipes/editing-validation/dependent-dropdowns
tags:
  - guides
  - tutorial
  - recipes
  - dropdown
  - validation
react:
  id: c6m2r9s3
  metaTitle: Dependent Dropdowns Recipe - React Data Grid | Handsontable
angular:
  id: d8k4t7u1
  metaTitle: Dependent Dropdowns Recipe - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Editing and Validation
type: tutorial
---

In this tutorial, you will drive a child column dropdown from a parent column using a dependency map. You will learn how to use `afterChange`, `setCellMeta`, and `render` to update dropdown source options dynamically when the user selects a value in the parent column.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/editing-validation/dependent-dropdowns/javascript/example1.js)
@[code](@/content/recipes/editing-validation/dependent-dropdowns/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/editing-validation/dependent-dropdowns/react/example1.jsx)
@[code](@/content/recipes/editing-validation/dependent-dropdowns/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/editing-validation/dependent-dropdowns/angular/example1.ts)
@[code](@/content/recipes/editing-validation/dependent-dropdowns/angular/example1.html)

:::

:::

## Overview

Use a **parent** `dropdown` column and a **child** `dropdown` whose `source` list depends on the parent value (for example, Category and Subcategory). When the parent changes, you refresh the child's `source` with `setCellMeta`, clear the child's value, and call `render()` so the editor picks up the new options.

**Difficulty:** Beginner  
**Time:** ~10 minutes

## Steps

1. **Dependency map** - Hold valid child labels per parent value (for example, `Fruit` -> `Apple`, `Banana`).
2. **`afterChange`** - When the parent column changes, read the new parent value, compute `newOptions`, and run `hot.setCellMeta(row, childCol, 'source', newOptions)`.
3. **Reset the child** - Call `hot.setDataAtCell(row, childCol, '')` so the old subcategory does not stay when it is invalid for the new category.
4. **`afterInit`** - Set each row's child `source` from that row's current parent so every row is consistent on load.
5. **`hot.render()`** - Apply meta and view updates immediately after your changes.

## Full example

The runnable demo below wires Category (column 0) to Subcategory (column 1).

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const CATEGORY_COL = 0;
const SUBCATEGORY_COL = 1;

const dependencyMap: Record<string, string[]> = {
  Fruit: ['Apple', 'Banana', 'Orange'],
  Vegetable: ['Carrot', 'Pea', 'Broccoli'],
  Grain: ['Rice', 'Wheat', 'Oats'],
};

// ... see the embedded example for afterInit, columns, and afterChange
```

## Acceptance checks

- Changing **Category** updates the **Subcategory** list for that row.
- **Subcategory** clears when **Category** changes.
- Each parent key in `dependencyMap` shows only its mapped children in the dropdown.

## What you learned

- How to use `afterChange` to detect when a parent column changes and update the child column's dropdown source for that specific row.
- How `setCellMeta(row, col, 'source', newOptions)` replaces the dropdown options for a single cell without affecting other rows.
- How `afterInit` initializes each row's child dropdown from the current parent value so the grid is consistent on load.
- Why calling `hot.render()` after `setCellMeta` is necessary to apply the updated source to the visible cells.

## Next steps

- Extend the pattern to three-level dependent dropdowns (Region → Country → City) by chaining additional `afterChange` handlers.
- Explore [row validation with error summary](@/recipes/editing-validation/row-validation-error-summary/row-validation-error-summary.md) to validate that the selected subcategory is always consistent with its parent.
