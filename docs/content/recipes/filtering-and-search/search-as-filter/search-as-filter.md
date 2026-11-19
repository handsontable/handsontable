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

```javascript
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: true,
});
```

## Step 2: Find the matching rows

When the input changes, pass its value to `query()` and collect the row of each result:

```javascript ins={7-10}
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: true,
});

searchInput.addEventListener('input', () => {
  const results = hot.getPlugin('search').query(searchInput.value);
  const matchingRows = new Set(results.map(result => result.row));
});
```

`query()` returns one `{ row, col, data }` object per matching cell. It checks hidden rows too, so a row that the previous query hid can match the next one.

## Step 3: Hide the other rows

List the rows without a match. Then show the rows that the previous query hid, hide the listed rows, and render the grid:

```javascript ins={11-24}
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: true,
});

searchInput.addEventListener('input', () => {
  const results = hot.getPlugin('search').query(searchInput.value);
  const matchingRows = new Set(results.map(result => result.row));

  const hiddenRows = hot.getPlugin('hiddenRows');
  const rowsToHide = [];

  if (searchInput.value !== '') {
    for (let row = 0; row < hot.countRows(); row += 1) {
      if (!matchingRows.has(row)) {
        rowsToHide.push(row);
      }
    }
  }

  hiddenRows.showRows(hiddenRows.getHiddenRows());
  hiddenRows.hideRows(rowsToHide);
  hot.render();
});
```

An empty query matches nothing, so the `if` check keeps `rowsToHide` empty and every row stays visible.

The `HiddenRows` plugin hides rows without removing them from the data. For details, see the [Row hiding](@/guides/rows/row-hiding/row-hiding.md) guide.

## What you learned

- How to enable the `Search` and `HiddenRows` plugins together.
- How to turn the results of `query()` into a set of matching rows.
- How to hide the other rows with `showRows()` and `hideRows()`, and show all rows when the query is empty.

## Next steps

- Debounce the input for large datasets, as in the [External search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) recipe.
- Explore [highlight search matches](@/recipes/filtering-and-search/highlight-search-matches/highlight-search-matches.md) to wrap the matched text in `<mark>` tags.
- Filter by a separate condition per column with the [Multi-column filter panel](@/recipes/filtering-search/multi-column-filter-panel/multi-column-filter-panel.md) recipe.
