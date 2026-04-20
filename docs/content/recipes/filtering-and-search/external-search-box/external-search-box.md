---
id: b4c9e21f
title: External search box
metaTitle: External search box recipe - JavaScript Data Grid | Handsontable
description: Learn how to add an external search input that highlights matching cells in Handsontable as you type.
permalink: /recipes/filtering-and-search/external-search-box
canonicalUrl: /recipes/filtering-and-search/external-search-box
tags:
  - guides
  - tutorial
  - recipes
  - search
  - filtering
react:
  id: a8e3d17c
  metaTitle: External search box recipe - React Data Grid | Handsontable
angular:
  id: d2f7b43a
  metaTitle: External search box recipe - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Filtering and Search
---

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/filtering-and-search/external-search-box/javascript/example1.js)
@[code](@/content/recipes/filtering-and-search/external-search-box/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/filtering-and-search/external-search-box/react/example1.jsx)
@[code](@/content/recipes/filtering-and-search/external-search-box/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/filtering-and-search/external-search-box/angular/example1.ts)
@[code](@/content/recipes/filtering-and-search/external-search-box/angular/example1.html)

:::

:::

## Overview

This recipe shows how to place a search input outside Handsontable and use the built-in `Search` plugin to highlight matching cells in real time.

**Difficulty:** Beginner.
**Time:** ~10 minutes.
**Libraries:** None.

## What you'll build

An implementation that:

- Keeps the search input outside the grid.
- Calls `hot.getPlugin('search').query(value)` on every keystroke.
- Calls `hot.render()` after each query to apply the highlight.
- Uses Handsontable's default search result styling.
- Clears highlights when the input is empty.

## Step 1: Enable the Search plugin

Set `search: true` in grid settings:

```typescript
const hot = new Handsontable(container, {
  data,
  search: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

This enables the plugin and the default `htSearchResult` highlight class.

## Step 2: Add an external input

Render a text input above the grid container:

```typescript
const controls = document.createElement('div');
const searchInput = document.createElement('input');

searchInput.type = 'search';
searchInput.placeholder = 'Search in table...';
controls.appendChild(searchInput);

container.parentElement?.insertBefore(controls, container);
```

The input lives outside Handsontable, so you can style and place it like any other app control.

## Step 3: Bind the input to `query()`

Listen to input events, query the plugin, and re-render:

```typescript
const searchPlugin = hot.getPlugin('search');

searchInput.addEventListener('input', () => {
  searchPlugin.query(searchInput.value);
  hot.render();
});
```

`query()` updates each cell's `isSearchResult` metadata. `hot.render()` applies the updated highlight state.

## Step 4 (optional): Debounce for large datasets

If you search very large tables, debounce the input callback to reduce render frequency:

```typescript
function debounce<T extends (...args: any[]) => void>(callback: T, wait = 120) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), wait);
  };
}
```

Use this wrapper around your search handler when needed.
