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
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/editing-validation/dependent-dropdowns/javascript/example1.js)
@[code](@/content/recipes/editing-validation/dependent-dropdowns/javascript/example1.ts)

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
