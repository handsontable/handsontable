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

Set `search` to `true`, and turn on `hiddenRows` with `copyPasteEnabled: false`, so that copied data leaves out the hidden rows:

```typescript
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: {
    copyPasteEnabled: false,
  },
});
```

## Step 2: Find the matching rows

When the input changes, pass its value to `query()` and collect the row of each result:

```typescript ins={9-14}
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: {
    copyPasteEnabled: false,
  },
});

type SearchResult = { row: number; col: number; data: unknown };

searchInput.addEventListener('input', () => {
  const results = hot.getPlugin('search').query(searchInput.value) as SearchResult[];
  const matchingRows = new Set(results.map(result => result.row));
});
```

`query()` returns one `{ row, col, data }` object per matching cell. It checks hidden rows too, so a row that the previous query hid can match the next one.

## Step 3: Hide the other rows

List the rows without a match. Then, in one `batch()` call, show the rows that the previous query hid, hide the listed rows, and render the grid:

```typescript ins={15-30}
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: {
    copyPasteEnabled: false,
  },
});

type SearchResult = { row: number; col: number; data: unknown };

searchInput.addEventListener('input', () => {
  const results = hot.getPlugin('search').query(searchInput.value) as SearchResult[];
  const matchingRows = new Set(results.map(result => result.row));

  const hiddenRows = hot.getPlugin('hiddenRows');
  const rowsToHide: number[] = [];

  if (searchInput.value !== '') {
    for (let row = 0; row < hot.countRows(); row += 1) {
      if (!matchingRows.has(row)) {
        rowsToHide.push(row);
      }
    }
  }

  hot.batch(() => {
    hiddenRows.showRows(hiddenRows.getHiddenRows().filter(row => row !== null));
    hiddenRows.hideRows(rowsToHide);
    hot.render();
  });
});
```

An empty query matches nothing, so the `if` check keeps `rowsToHide` empty and every row stays visible.

The `batch()` call makes the two changes one undo step. `getHiddenRows()` returns `null` for a hidden row that a column filter also removes, so the code drops those entries. Such a row stays hidden until you clear the filter and the search runs again.

The `HiddenRows` plugin hides rows without removing them from the data. For details, see the [Row hiding](@/guides/rows/row-hiding/row-hiding.md) guide.

## Step 4: Debounce the input (optional)

Each input event checks every cell and renders the grid. For a large dataset, wait until the typing stops before you filter:

```typescript ins={11-18,20,40}
const hot = new Handsontable(container, {
  data,
  search: true,
  hiddenRows: {
    copyPasteEnabled: false,
  },
});

type SearchResult = { row: number; col: number; data: unknown };

const debounce = (callback: () => void, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

searchInput.addEventListener('input', debounce(() => {
  const results = hot.getPlugin('search').query(searchInput.value) as SearchResult[];
  const matchingRows = new Set(results.map(result => result.row));

  const hiddenRows = hot.getPlugin('hiddenRows');
  const rowsToHide: number[] = [];

  if (searchInput.value !== '') {
    for (let row = 0; row < hot.countRows(); row += 1) {
      if (!matchingRows.has(row)) {
        rowsToHide.push(row);
      }
    }
  }

  hot.batch(() => {
    hiddenRows.showRows(hiddenRows.getHiddenRows().filter(row => row !== null));
    hiddenRows.hideRows(rowsToHide);
    hot.render();
  });
}));
```

The listener now runs once, 120 ms after the last keystroke.

## What you learned

- How to enable the `Search` and `HiddenRows` plugins together.
- How to turn the results of `query()` into a set of matching rows.
- How to hide the other rows with `showRows()` and `hideRows()`, and show all rows when the query is empty.
- How to debounce the input so that the filter runs once per pause in typing.

## Next steps

- Explore [highlight search matches](@/recipes/filtering-and-search/highlight-search-matches/highlight-search-matches.md) to wrap the matched text in `<mark>` tags.
- Filter by a separate condition per column with the [Multi-column filter panel](@/recipes/filtering-search/multi-column-filter-panel/multi-column-filter-panel.md) recipe.
