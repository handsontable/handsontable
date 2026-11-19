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

In this tutorial, you will add a search input that hides every row without a matching cell in Handsontable DataGrid. You will learn how to pass the results of the `Search` plugin's `query()` method to the `HiddenRows` plugin, and how to report the number of visible rows.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/filtering-and-search/search-as-filter/javascript/example1.js)
@[code](@/content/recipes/filtering-and-search/search-as-filter/javascript/example1.ts)
@[code](@/content/recipes/filtering-and-search/search-as-filter/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/filtering-and-search/search-as-filter/react/example1.css)
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

This recipe uses only the built-in Handsontable API. No extra dependencies are required.

- Set up a Handsontable project. If you have not done it yet, follow the [Installation](@/guides/getting-started/installation/installation.md) guide.
- Read the [External search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) recipe. This tutorial builds on its input and `query()` flow.

## Step 1: Enable the Search and HiddenRows plugins

Set `search: true` and add the `hiddenRows` option to the grid settings:

```typescript
const hot = new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Role', 'Team', 'Location'],
  height: 'auto',
  search: true,
  hiddenRows: {
    indicators: false,
  },
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});

const searchPlugin = hot.getPlugin('search');
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
```

The `Search` plugin finds and highlights matching cells. The `HiddenRows` plugin hides rows without removing them from the data. `indicators: false` keeps the row headers free of the hidden-row markers.

## Step 2: Add the search input

Render a labeled input and a status element above the grid container:

```typescript
const searchLabel = document.createElement('label');
const searchInput = document.createElement('input');
const searchStatus = document.createElement('span');

searchLabel.setAttribute('for', 'search-filter-input');
searchLabel.textContent = 'Filter rows';

searchInput.id = 'search-filter-input';
searchInput.type = 'search';

searchStatus.setAttribute('aria-live', 'polite');
```

The label gives the input an accessible name. The `aria-live="polite"` attribute makes screen readers announce the status text each time it changes.

## Step 3: Run the query and collect the matching rows

Call `query()` and build a set of the rows that contain at least one result:

```typescript
type SearchResult = { row: number; col: number; data: unknown };

const filterRows = (value: string) => {
  const query = value.trim();
  const results = searchPlugin.query(query) as SearchResult[];
  const matchingRows = new Set(results.map(({ row }) => row));
};
```

`query()` returns one `{ row, col, data }` object per matching cell. Each `row` is a visual row index, which is the index type that the `HiddenRows` methods take. `query()` also checks the cells of hidden rows, so a row that the previous query hid can match the next one.

## Step 4: Hide the rows that do not match

Inside `filterRows()`, list every row that is not in the set, then replace the hidden rows:

```typescript
const totalRows = hot.countRows();
const rowsToHide: number[] = [];

if (query !== '') {
  for (let row = 0; row < totalRows; row += 1) {
    if (!matchingRows.has(row)) {
      rowsToHide.push(row);
    }
  }
}

hot.batch(() => {
  hiddenRowsPlugin.showRows(hiddenRowsPlugin.getHiddenRows());
  hiddenRowsPlugin.hideRows(rowsToHide);
  hot.render();
});
```

`showRows()` and `hideRows()` change the plugin's state without repainting the grid. `hot.batch()` holds the rendering until the callback ends, so the `hot.render()` call inside it paints the new rows and the new highlight once.

An empty query matches nothing in `query()`, which also clears the highlight. The `query !== ''` check keeps `rowsToHide` empty in that case, so every row is shown again.

## Step 5: Debounce the input

Wait 120 ms after the last keystroke before you filter:

```typescript
const debounce = (callback: (value: string) => void, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (value: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(value), delay);
  };
};

const runSearch = debounce(filterRows);

searchInput.addEventListener('input', () => {
  runSearch(searchInput.value);
});
```

Each run reads every cell and repaints the grid. The debounce limits that work to one run per pause in typing.

## Step 6: Show the result counter

At the end of `filterRows()`, write the number of visible rows to the status element:

```typescript
const visibleRows = totalRows - rowsToHide.length;

searchStatus.textContent = visibleRows === 0
  ? `No rows match "${query}"`
  : `Showing ${visibleRows} of ${totalRows} rows`;
```

Call `filterRows('')` once after you create the grid, so the counter shows the total before the first keystroke.

## Limits of this approach

- **Hidden rows are still part of the data.** `countRows()` and `getData()` return all rows, hidden or not. Row headers keep their original numbers, so a filtered grid shows gaps, for example 1, 10. If you select a range that spans hidden rows and copy it, the copied data includes the hidden rows. To leave them out, set `copyPasteEnabled: false` in the `hiddenRows` option.
- **The recipe owns the grid's hidden rows.** Every query shows all hidden rows before it hides the rows that do not match. Rows that other code hides are shown again when the query changes.
- **The query applies to every column.** For a separate condition per column, use the [Multi-column filter panel](@/recipes/filtering-search/multi-column-filter-panel/multi-column-filter-panel.md) recipe or the [Column filter](@/guides/columns/column-filter/column-filter.md) guide.

## What you learned

- How to enable the `Search` and `HiddenRows` plugins together.
- How to turn the results of `query()` into a set of matching visual row indexes.
- How to replace the hidden rows with `showRows()` and `hideRows()` inside one `hot.batch()` call.
- How to show all rows and clear the highlight when the query is empty.
- How to report the number of visible rows in an `aria-live` region.

## Next steps

- Explore [highlight search matches](@/recipes/filtering-and-search/highlight-search-matches/highlight-search-matches.md) to wrap the matched text in `<mark>` tags.
- Read the [Row hiding](@/guides/rows/row-hiding/row-hiding.md) guide for the other `hiddenRows` options.
- Read the [Searching values](@/guides/navigation/searching-values/searching-values.md) guide to replace the default query method.
