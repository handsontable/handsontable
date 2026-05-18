---
id: a7f4d2c1
title: Highlight search matches
metaTitle: Highlight Search Matches - JavaScript Data Grid | Handsontable
description: Learn how to highlight matched text fragments with a custom renderer that safely uses mark tags and updates in real time from a search input.
permalink: /recipes/filtering-and-search/highlight-search-matches
canonicalUrl: /recipes/filtering-and-search/highlight-search-matches
tags:
  - guides
  - tutorial
  - recipes
  - search
  - renderer
react:
  id: e9b3f6a2
  metaTitle: Highlight Search Matches - React Data Grid | Handsontable
angular:
  id: c4d8e1b5
  metaTitle: Highlight Search Matches - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Filtering and Search
type: how-to
---

In this tutorial, you will highlight matched text fragments inside cells using a custom renderer. You will learn how to wrap matching substrings in `<mark>` tags safely and keep the highlights in sync with an external search input.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/recipes/filtering-and-search/highlight-search-matches/javascript/example1.html)
@[code](@/content/recipes/filtering-and-search/highlight-search-matches/javascript/example1.js)
@[code](@/content/recipes/filtering-and-search/highlight-search-matches/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/filtering-and-search/highlight-search-matches/react/example1.jsx)
@[code](@/content/recipes/filtering-and-search/highlight-search-matches/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/filtering-and-search/highlight-search-matches/angular/example1.ts)
@[code](@/content/recipes/filtering-and-search/highlight-search-matches/angular/example1.html)

:::

:::

## Overview

This recipe shows how to highlight matched text fragments with a custom renderer that wraps matches in a `<mark>` element. You can use this approach when you want richer highlighting than the default Search plugin class.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None (pure Handsontable + browser APIs)

## What You'll Build

A search experience that:
- Highlights only matched fragments inside each cell with `<mark>`
- Keeps non-matching cells unchanged
- Escapes both user input and cell values before inserting HTML
- Updates in real time when the user types in an external search field
- Uses `search.query()` to keep `isSearchResult` metadata in sync

## Step 1: Import dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Search } from 'handsontable/plugins';
import { rendererFactory } from 'handsontable/renderers';

registerAllModules();
```

Use `rendererFactory` to build a custom renderer, and use the `Search` plugin for match detection.

## Step 2: Keep the search term in external state

```typescript
let currentSearchTerm = '';
```

The renderer reads `currentSearchTerm`, so typing in the external input updates rendering after `search.query()` and `hot.render()`.

## Step 3: Add safe HTML helpers

```typescript
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Because the renderer sets `innerHTML`, escape both the source text and the query before composing HTML. This prevents injecting arbitrary markup from data or user input.

## Step 4: Build a `<mark>` renderer

```typescript
const highlightRenderer = rendererFactory(({ td, value, cellProperties }) => {
  const cellText = value === null || value === undefined ? '' : String(value);
  const query = currentSearchTerm.trim();

  if (!query || !cellProperties.isSearchResult) {
    td.textContent = cellText;
    return;
  }

  const escapedCellText = escapeHtml(cellText);
  const escapedQuery = escapeHtml(query);
  const splitter = new RegExp(`(${escapeRegExp(escapedQuery)})`, 'gi');
  const highlighted = escapedCellText
    .split(splitter)
    .map(fragment => (
      fragment.toLocaleLowerCase() === escapedQuery.toLocaleLowerCase()
        ? `<mark>${fragment}</mark>`
        : fragment
    ))
    .join('');

  td.innerHTML = highlighted;
});
```

This renderer:
- Renders plain text for non-matches
- Highlights only cells flagged by the Search plugin
- Wraps matching fragments with `<mark>`

## Step 5: Wire the external input to the Search plugin

```typescript
searchField.addEventListener('input', (event) => {
  currentSearchTerm = (event.target as HTMLInputElement).value;
  searchPlugin.query(currentSearchTerm);
  hot.render();
});
```

This keeps metadata and rendering synchronized on every keystroke.

## Step 6: Register the renderer

You can register the custom renderer in two ways:

- Per-column, by setting `renderer: highlightRenderer` only on selected columns.
- Globally, by setting `renderer: highlightRenderer` in the root Handsontable options.

This recipe uses per-column registration so numeric IDs keep the default renderer.

## Complete example

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Search } from 'handsontable/plugins';
import { rendererFactory } from 'handsontable/renderers';

registerAllModules();

type RowData = {
  id: number;
  title: string;
  owner: string;
  status: string;
};

const data: RowData[] = [
  { id: 101, title: 'Search API docs', owner: 'Alex', status: 'In progress' },
  { id: 102, title: 'Renderer refactor', owner: 'Mia', status: 'Review' },
  { id: 103, title: 'Fix keyboard shortcut', owner: 'Noah', status: 'Done' },
  { id: 104, title: 'Search UX tests', owner: 'Ava', status: 'In progress' },
];

let currentSearchTerm = '';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const highlightRenderer = rendererFactory(({ td, value, cellProperties }) => {
  const cellText = value === null || value === undefined ? '' : String(value);
  const query = currentSearchTerm.trim();

  if (!query || !cellProperties.isSearchResult) {
    td.textContent = cellText;
    return;
  }

  const escapedCellText = escapeHtml(cellText);
  const escapedQuery = escapeHtml(query);
  const splitter = new RegExp(`(${escapeRegExp(escapedQuery)})`, 'gi');
  const highlighted = escapedCellText
    .split(splitter)
    .map(fragment => (
      fragment.toLocaleLowerCase() === escapedQuery.toLocaleLowerCase()
        ? `<mark>${fragment}</mark>`
        : fragment
    ))
    .join('');

  td.innerHTML = highlighted;
});

const container = document.querySelector('#example1')!;
const searchField = document.querySelector('#search_field')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['ID', 'Title', 'Owner', 'Status'],
  rowHeaders: true,
  height: 'auto',
  search: true,
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'title', renderer: highlightRenderer },
    { data: 'owner', renderer: highlightRenderer },
    { data: 'status', renderer: highlightRenderer },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});

const searchPlugin: Search = hot.getPlugin('search');

searchField.addEventListener('input', (event) => {
  currentSearchTerm = (event.target as HTMLInputElement).value;
  searchPlugin.query(currentSearchTerm);
  hot.render();
});
```

## How it works

1. User types in the external search field.
2. `search.query()` marks matching cells with `isSearchResult`.
3. `hot.render()` runs the custom renderer.
4. Matching fragments are wrapped in `<mark>`.
5. Non-matching cells render as plain text.

## Related

<div class="boxes-list">

- [Searching values](@/guides/navigation/searching-values/searching-values.md)
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)
- [Search plugin API](@/api/search.md)

</div>

## What you learned

- How to write a custom cell renderer that reads the `isSearchResult` flag and the current search term from the plugin state.
- How to safely insert `<mark>` tags around matched text fragments to highlight partial matches inside cell content.
- Why you must escape special regex characters in the search term before building a `RegExp` to avoid runtime errors.
- How to combine `search.query()` and `hot.render()` to keep highlights in sync with every keystroke.

## Next steps

- Explore [external search box](@/recipes/filtering-and-search/external-search-box/external-search-box.md) for a simpler approach using the default `htSearchResult` highlight class without a custom renderer.
- Extend the renderer to also highlight matches in the column header row by overriding `afterGetColHeader`.
