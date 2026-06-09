---
id: a8d14c7b
title: Multi-column filter panel
metaTitle: Multi-column Filter Panel - JavaScript Data Grid | Handsontable
description: Build an external filter panel with a category dropdown and a price range that controls Handsontable filtering through the Filters plugin API.
permalink: /recipes/filtering-search/multi-column-filter-panel
canonicalUrl: /recipes/filtering-search/multi-column-filter-panel
tags:
  - guides
  - tutorial
  - recipes
  - filtering
  - search
  - filters plugin
react:
  id: c3e8f291
  metaTitle: Multi-column Filter Panel - React Data Grid | Handsontable
angular:
  id: f6b25d0a
  metaTitle: Multi-column Filter Panel - Angular Data Grid | Handsontable
vue:
  id: ypksrbh0
  metaTitle: Multi-column Filter Panel - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Filtering and Search
type: how-to
---

In this tutorial, you will build an external filter panel with a category dropdown and a price range slider that controls Handsontable filtering. You will learn how to apply multiple conditions at once through the `Filters` plugin API and clear them all with a single button.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/javascript/example1.js)
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/javascript/example1.ts)
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/javascript/example1.css)
:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/filtering-search/multi-column-filter-panel/react/example1.css)
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/react/example1.jsx)
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/filtering-search/multi-column-filter-panel/angular/example1.ts)
@[code](@/content/recipes/filtering-search/multi-column-filter-panel/angular/example1.html)

:::

:::

## Overview

This recipe shows how to control the Filters plugin from a filter panel outside of the grid. The panel includes controls aligned with the grid columns, and it applies all active filters together with AND logic.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Libraries:** Handsontable only

## What You'll Build

An external filter panel that:
- Enables `filters: true` while hiding the built-in filter menu UI.
- Uses `hot.getPlugin('filters')` to control filtering through API calls.
- Applies a text filter with `addCondition(columnIndex, 'contains', [value])`.
- Applies a numeric range filter with `addCondition(columnIndex, 'between', [min, max])`.
- Clears and re-applies all active conditions every time controls change.
- Includes a **Clear all filters** button that restores all rows.

## Step 1 - Enable filtering and create the grid

Enable the Filters plugin in Handsontable configuration:

```typescript
const hot = new Handsontable(container, {
  data: productData,
  colHeaders: ['Product', 'Category', 'Price', 'Stock'],
  columns: [
    { data: 'name' },
    { data: 'category' },
    { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00', culture: 'en-US' } },
    { data: 'stock', type: 'numeric' },
  ],
  filters: true,
  dropdownMenu: false,
  licenseKey: 'non-commercial-and-evaluation',
});
```

Setting `dropdownMenu: false` keeps the filter panel external, while the Filters plugin remains active.

## Step 2 - Get the plugin and apply conditions

Get the plugin instance and apply conditions every time a filter value changes:

```typescript
const filtersPlugin = hot.getPlugin('filters');

const applyFilters = () => {
  filtersPlugin.clearConditions();

  if (enteredName) {
    filtersPlugin.addCondition(0, 'contains', [enteredName]);
  }

  if (selectedCategory) {
    filtersPlugin.addCondition(1, 'eq', [selectedCategory]);
  }

  if (minPrice && maxPrice) {
    filtersPlugin.addCondition(2, 'between', [Number(minPrice), Number(maxPrice)]);
  } else if (minPrice) {
    filtersPlugin.addCondition(2, 'gte', [Number(minPrice)]);
  } else if (maxPrice) {
    filtersPlugin.addCondition(2, 'lte', [Number(maxPrice)]);
  }

  filtersPlugin.filter();
  hot.render();
};
```

This pattern guarantees each update uses the current set of active controls.

## Step 3 - Add clear-all behavior

Add a button that clears control values, removes all conditions, and shows all rows again:

```typescript
clearAllButton.addEventListener('click', () => {
  nameInput.value = '';
  categorySelect.value = '';
  minPriceInput.value = '';
  maxPriceInput.value = '';
  filtersPlugin.clearConditions();
  filtersPlugin.filter();
  hot.render();
});
```

## How it works

1. User changes one or more controls in the external panel.
2. The code clears previously applied conditions.
3. The code re-applies current conditions for product name, category, and price.
4. `filtersPlugin.filter()` updates the visible rows.
5. **Clear all filters** resets controls and restores the full dataset.

The full implementation is available in the runnable example above.

## What you learned

- How to use `filtersPlugin.clearConditions()` and `filtersPlugin.addCondition()` to apply fresh conditions on every control change.
- How to call `filtersPlugin.filter()` to update the visible rows after adding conditions, and how `hot.render()` keeps the view in sync.
- How to build a clear-all button that resets external controls, removes all conditions, and restores the full dataset.
- Why you must enable the `Filters` plugin with `filters: true` and pair it with `dropdownMenu: true` to expose per-column filter UI alongside your external panel.

## Next steps

- Explore [external search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) to add a text search that works alongside the filter panel.
- Read the [Filters plugin API](@/api/filters.md) reference for the full list of built-in condition types (between, contains, begins with, and more).
