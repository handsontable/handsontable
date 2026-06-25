---
id: k7m3p9q2
title: Add a column to an object-based dataset
metaTitle: Add a column to an object-based dataset - JavaScript Data Grid | Handsontable
description: Learn how to add a column at runtime through the context menu when your grid uses an object-based dataset, where the built-in column-insert items do not apply.
permalink: /recipes/context-menu/add-column-object-data
canonicalUrl: /recipes/context-menu/add-column-object-data
tags:
  - recipes
  - context menu
  - columns
  - object data
react:
  id: r4n8t1w5
  metaTitle: Add a column to an object-based dataset - React Data Grid | Handsontable
angular:
  id: a6c2v7x3
  metaTitle: Add a column to an object-based dataset - Angular Data Grid | Handsontable
vue:
  id: v9b5d3f8
  metaTitle: Add a column to an object-based dataset - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Context Menu
menuTag: new
type: how-to
---

In this tutorial, you will add a column to an object-based dataset through a custom context menu item. You will learn why the built-in column-insert items are unavailable for object data and how to extend the `columns` setting at runtime.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --css 2

@[code](@/content/recipes/context-menu/add-column-object-data/javascript/example1.js)
@[code](@/content/recipes/context-menu/add-column-object-data/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/context-menu/add-column-object-data/react/example1.css)
@[code](@/content/recipes/context-menu/add-column-object-data/react/example1.jsx)
@[code](@/content/recipes/context-menu/add-column-object-data/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/context-menu/add-column-object-data/angular/example1.ts)
@[code](@/content/recipes/context-menu/add-column-object-data/angular/example1.html)
@[code](@/content/recipes/context-menu/add-column-object-data/angular/example1.css)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~15 minutes

When your data is an array of objects, each column maps to an object property through the `columns` setting. The built-in **Insert column left** and **Insert column right** menu items rely on `alter('insert_col_start')`, which Handsontable rejects for object data:

> Cannot create new column. When data source in an object, you can only have as much columns as defined in first data row, data schema or in the 'columns' setting.

To add a column over object data, you extend the `columns` setting yourself, add the matching property to every row, and re-apply the configuration with `updateSettings`. This recipe wires that into a custom **Add column** menu item.

## Before you begin

You need a working Handsontable instance with an object-based dataset. If you are starting fresh, install it first:

```bash
npm install handsontable
```

Then import and register all modules:

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 1: Set up the object dataset and column configuration

```javascript
const data = [
  { sku: 'SKU-4821', supplier: 'Harbor Goods', stock: 142, category: 'Electronics' },
  // ...more rows
];

const columns = [
  { data: 'sku', width: 120 },
  { data: 'supplier', width: 170 },
  { data: 'stock', width: 90 },
  { data: 'category', width: 130 },
];
const colHeaders = ['SKU', 'Supplier', 'Stock', 'Category'];
```

**What's happening:**

- `data` is an array of row objects. Each object key (`sku`, `supplier`, ...) maps to one column.
- `columns` binds each column to a property through its `data` key. The column order follows this array, not the order of keys inside the row objects.
- Keep `columns` and `colHeaders` in variables you can mutate. The custom menu item edits these arrays and feeds them back through `updateSettings`.

## Step 2: Configure the context menu without the built-in column items

```javascript
contextMenu: {
  items: {
    add_column: { /* defined in Step 3 */ },
    sep1: '---------',
    row_above: { name: 'Insert row above' },
    row_below: { name: 'Insert row below' },
    remove_row: { name: 'Remove row' },
  },
},
```

**What's happening:**

- Passing an object to `contextMenu.items` lists the exact items that appear. The built-in `col_left` and `col_right` keys are omitted because they throw on object data.
- `add_column` is a custom key that replaces them with logic that works for object data.
- `'---------'` is the predefined separator token. It renders a visual divider between the custom action and the built-in row operations.

## Step 3: Implement "Add column"

```javascript
let newColumnCount = 0;

// inside contextMenu.items
add_column: {
  name: 'Add column',
  callback(key, selection) {
    const insertAt = selection[0].start.col + 1;

    newColumnCount += 1;
    const newKey = `custom_${newColumnCount}`;

    // 1. Add the new property to every source row object.
    hot.getSourceData().forEach((row) => {
      row[newKey] = '';
    });

    // 2. Extend the `columns` and `colHeaders` arrays at the clicked position.
    columns.splice(insertAt, 0, { data: newKey, width: 130, className: 'ht-new-column' });
    colHeaders.splice(insertAt, 0, `Custom ${newColumnCount}`);

    // 3. Apply the new structure.
    hot.updateSettings({ columns, colHeaders });
  },
},
```

**What's happening:**

1. `selection[0].start.col` is the visual index of the right-clicked column. Adding `1` inserts the new column directly to its right; use the value as-is to insert to its left.
2. `newColumnCount` produces a unique property key (`custom_1`, `custom_2`, ...) so each new column binds to a fresh object property. Use a counter rather than a random value to keep keys predictable.
3. `hot.getSourceData()` returns the array of row objects. Adding `row[newKey] = ''` gives every row an empty value for the new column, so the cells start blank and editable.
4. `columns.splice(insertAt, 0, ...)` inserts the new column descriptor, and `colHeaders.splice(...)` inserts its header. The `className` marks the new column for styling.
5. `hot.updateSettings({ columns, colHeaders })` re-applies the configuration. Because each row object now has the new property, the column renders with the data already in place.

## How it works - complete flow

1. The user right-clicks a cell. Handsontable opens the context menu with the custom **Add column** item and the selected built-in row items.
2. **Add column** computes the insert position from the clicked column, generates a unique property key, and adds that property to every row object.
3. The `columns` and `colHeaders` arrays gain a matching entry at the same position.
4. `updateSettings` re-maps the columns. The new column appears with a highlighted header background and accepts edits like any other column.

## What you learned

- Object data cannot use the built-in `col_left` / `col_right` items, because `alter('insert_col_*')` is rejected when the data source is an object.
- Omit those keys from `contextMenu.items` and add a custom item instead.
- To add a column over object data: add the property to each row object, extend `columns` and `colHeaders`, then call `updateSettings`.
- Column order follows the `columns` array, so `splice` controls where the new column appears.
- `selection[0].start.col` gives you the right-clicked column for positioning.

## Next steps

- Set [`dataSchema`](@/api/options.md#dataschema) so rows added later also include the new property.
- Add a `disabled()` function to the menu item to limit how many columns users can add.
- Explore the [Context menu guide](@/guides/accessories-and-menus/context-menu/context-menu.md) for the full list of built-in item keys and advanced configuration.
