---
title: Filter rows with a search box
metaTitle: Filter rows with a search box | Handsontable DataGrid for JavaScript
description: Learn how to hide the rows that do not match a search query in Handsontable DataGrid by connecting the Search and HiddenRows plugins.
permalink: /recipes/filtering-and-search/search-as-filter
canonicalUrl: /recipes/filtering-and-search/search-as-filter
tags:
  - guides
  - tutorial
  - recipes
  - search
  - filtering
  - hidden rows
react:
  metaTitle: Filter rows with a search box | Handsontable DataGrid for React
angular:
  metaTitle: Filter rows with a search box | Handsontable DataGrid for Angular
vue:
  metaTitle: Filter rows with a search box | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Filtering and Search
type: tutorial
menuTag: new
---

In this tutorial, you will add a search input that hides every row without a matching cell in Handsontable DataGrid. You will learn how to pass the results of the `Search` plugin's `query()` method to the `HiddenRows` plugin.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/filtering-and-search/search-as-filter/javascript/example1.js)
@[code](@/content/recipes/filtering-and-search/search-as-filter/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/filtering-and-search/search-as-filter/react/example1.jsx)
@[code](@/content/recipes/filtering-and-search/search-as-filter/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/filtering-and-search/search-as-filter/angular/example1.ts)
@[code](@/content/recipes/filtering-and-search/search-as-filter/angular/example1.html)

:::

:::

## Before you begin

- Add a search input above the grid, as in the [External search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) recipe.

## Step 1: Enable the Search and HiddenRows plugins

Set `search` and `hiddenRows` to `true` in the grid settings:

```typescript
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: true,
  // licenseKey: 'your-license-key', get a key at https://handsontable.com/pricing/
});

const searchPlugin = hot.getPlugin('search');
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
```

## Step 2: Find the matching rows

On every input event, call `query()` and collect the rows that contain at least one result:

```typescript
searchInput.addEventListener('input', () => {
  const query = searchInput.value;
  const results = searchPlugin.query(query);
  const matchingRows = new Set(results.map(({ row }) => row));
});
```

`query()` returns one `{ row, col, data }` object per matching cell. It also checks the cells of hidden rows, so a row that the previous query hid can match the next one.

## Step 3: Hide the other rows

In the same listener, list every row that is not in the set. Then replace the hidden rows and render the grid:

```typescript
const rowsToHide = [];

if (query !== '') {
  for (let row = 0; row < hot.countRows(); row += 1) {
    if (!matchingRows.has(row)) {
      rowsToHide.push(row);
    }
  }
}

hiddenRowsPlugin.showRows(hiddenRowsPlugin.getHiddenRows());
hiddenRowsPlugin.hideRows(rowsToHide);
hot.render();
```

An empty query matches nothing, so the `query !== ''` check keeps `rowsToHide` empty and every row is shown again.

The `HiddenRows` plugin hides rows without removing them from the data. For details, see the [Row hiding](@/guides/rows/row-hiding/row-hiding.md) guide.

## What you learned

- How to enable the `Search` and `HiddenRows` plugins together.
- How to turn the results of `query()` into a set of matching rows.
- How to hide the other rows with `showRows()` and `hideRows()`, and show all rows when the query is empty.

## Next steps

- Debounce the input for large datasets, as in the [External search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) recipe.
- Explore [highlight search matches](@/recipes/filtering-and-search/highlight-search-matches/highlight-search-matches.md) to wrap the matched text in `<mark>` tags.
- Filter by a separate condition per column with the [Multi-column filter panel](@/recipes/filtering-search/multi-column-filter-panel/multi-column-filter-panel.md) recipe.
