---
id: b3f2a1c9
title: Lazy loading with pagination
metaTitle: Lazy loading with pagination - JavaScript Data Grid | Handsontable
description: Load data page-by-page as the user scrolls to the bottom of the grid, using the afterScrollVertically hook and hot.updateData() to append rows without resetting scroll position.
permalink: /recipes/performance/lazy-loading
canonicalUrl: /recipes/performance/lazy-loading
tags:
  - guides
  - tutorial
  - recipes
  - performance
  - pagination
  - lazy loading
  - infinite scroll
react:
  id: c4e7d1f8
  metaTitle: Lazy loading with pagination - React Data Grid | Handsontable
angular:
  id: d5f8e2a9
  metaTitle: Lazy loading with pagination - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Performance
type: how-to
---

In this tutorial, you will load grid data page by page as the user scrolls to the bottom of the grid. You will learn how to use the `afterScrollVertically` hook and `hot.updateData()` to append new rows without resetting the scroll position or grid state.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1

@[code](@/content/recipes/performance/lazy-loading/javascript/example1.js)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/performance/lazy-loading/react/example1.jsx)
@[code](@/content/recipes/performance/lazy-loading/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/performance/lazy-loading/angular/example1.ts)
@[code](@/content/recipes/performance/lazy-loading/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~25 minutes

This tutorial shows how to load data in pages as the user scrolls toward the bottom of a Handsontable grid. The grid starts with an initial data set and silently fetches the next page when the user approaches the last visible row -- without resetting the scroll position, selection, or column configuration.

This pattern is useful when working with large remote data sets where loading everything upfront would be too slow or memory-intensive.

[[toc]]

## What You'll Build

A task-list grid that:

- Displays an initial page of project tasks on load
- Detects when the user scrolls near the last row using `afterScrollVertically`
- Fetches the next page from a paginated REST API
- Appends the new rows with `hot.updateData()` -- preserving scroll position
- Shows a loading indicator while the fetch is in progress
- Stops fetching once all pages have been loaded

## Before you begin

- You need a working Handsontable installation. See the [Getting started](@/guides/getting-started/introduction/introduction.md) guide.
- This example fetches data from [JSONPlaceholder](https://jsonplaceholder.typicode.com/), a free public API. An active internet connection is required to run the live demo. The grid falls back to the built-in `INITIAL_DATA` array when the network is unavailable.
- Familiarity with `async/await` and the browser `fetch` API is helpful.

## Step 1 -- Set up state and constants

The example tracks three flags that control fetching behavior:

```javascript
let currentPage = 1;
let isLoading = false;
let hasMore = true;
```

- `currentPage` -- the last page that was successfully loaded. Increments after each successful fetch.
- `isLoading` -- prevents duplicate requests. Set to `true` at the start of a fetch and back to `false` when it completes.
- `hasMore` -- set to `false` when the API returns an empty result or the last page is reached. Stops any further fetch attempts.

You also define two constants that control fetch timing:

```javascript
const LOAD_THRESHOLD = 5;
const PAGE_SIZE = 20;
```

`LOAD_THRESHOLD` is the number of rows from the bottom of the loaded data that triggers the next fetch. A value of `5` means the fetch starts when the user is 5 rows away from the last row -- giving the network request time to complete before the user reaches the end.

## Step 2 -- Create the loading indicator

The loading indicator is created in JavaScript and inserted below the grid container:

```javascript
const loadingIndicator = document.createElement('div');

loadingIndicator.style.cssText =
  'display:none; padding:8px; text-align:center; color:#666; font-size:13px;';
loadingIndicator.textContent = 'Loading more tasks...';
container.insertAdjacentElement('afterend', loadingIndicator);
```

You show it at the start of a fetch and hide it when the fetch completes. When all data is loaded, you update its text to "All tasks loaded." and leave it visible so the user knows there is nothing more to fetch.

## Step 3 -- Write the `fetchNextPage` function

This function is the core of the recipe. It guards against duplicate calls, fetches the next page, and appends the rows:

```javascript
async function fetchNextPage() {
  if (isLoading || !hasMore) {
    return;
  }

  isLoading = true;
  loadingIndicator.style.display = 'block';

  try {
    const nextPage = currentPage + 1;
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/todos?_page=${nextPage}&_limit=${PAGE_SIZE}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const newRows = await response.json();

    if (newRows.length === 0 || nextPage >= TOTAL_PAGES) {
      hasMore = false;
      loadingIndicator.textContent = 'All tasks loaded.';
      loadingIndicator.style.display = 'block';
    } else {
      currentPage = nextPage;
      loadedData = [...loadedData, ...newRows];
      hot.updateData(loadedData);
    }
  } catch {
    loadingIndicator.textContent = 'Failed to load more tasks. Scroll down to retry.';
    loadingIndicator.style.display = 'block';
    isLoading = false;

    return;
  }

  isLoading = false;

  if (hasMore) {
    loadingIndicator.style.display = 'none';
  }
}
```

**What's happening:**

1. The `if (isLoading || !hasMore)` guard at the top ensures the function returns immediately if a request is already in flight or no more data exists. This prevents duplicate requests caused by fast scrolling.
2. `fetch()` requests the next page using `_page` and `_limit` query parameters -- a standard pagination pattern supported by most REST APIs.
3. When the response arrives, `loadedData` is updated using the spread operator to create a new array: `[...loadedData, ...newRows]`. This is required because `updateData()` expects a new array reference to detect the change.
4. `hot.updateData(loadedData)` replaces the grid's data source. Unlike `loadData()`, `updateData()` does not reset scroll position, selection state, or column configuration -- the user sees the new rows appended at the bottom without any visual jump.
5. Errors are caught and shown in the indicator. `isLoading` is reset to `false` so the user can retry by scrolling again.

**Why `updateData()` and not `loadData()`?**

`loadData()` resets the entire grid state -- it scrolls back to the top, clears the selection, and re-renders from scratch. That would break the scrolling experience. `updateData()` performs a diff and only updates what changed, leaving the viewport position intact.

## Step 4 -- Initialize the grid and attach the scroll hook

Create the grid with the initial data, then use `afterScrollVertically` to detect proximity to the last row:

```javascript
const hot = new Handsontable(container, {
  data: loadedData,
  colHeaders: ['ID', 'Task Title', 'Status', 'Assignee'],
  columns: [
    { data: 'id', type: 'numeric', width: 60, readOnly: true },
    { data: 'title', type: 'text', width: 340 },
    { data: 'completed', type: 'checkbox', width: 80, className: 'htCenter' },
    { data: 'userId', type: 'numeric', width: 100 },
  ],
  rowHeaders: true,
  height: 400,
  afterScrollVertically() {
    const lastVisibleRow = this.view.getLastFullyVisibleRow();
    const totalRows = this.countRows();

    if (lastVisibleRow >= 0 && lastVisibleRow >= totalRows - LOAD_THRESHOLD) {
      fetchNextPage();
    }
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:**

- `afterScrollVertically` fires after every vertical scroll event. Inside the callback, `this` refers to the Handsontable instance.
- `this.view.getLastFullyVisibleRow()` returns the visual index of the last row that is fully visible in the viewport. It returns `-1` when no rows are visible, so the `>= 0` check prevents triggering a fetch during the initial render.
- `this.countRows()` returns the total number of rows currently loaded in the grid.
- When `lastVisibleRow >= totalRows - LOAD_THRESHOLD`, the user is within `LOAD_THRESHOLD` rows of the bottom. This triggers `fetchNextPage()`, which will be a no-op if `isLoading` is already `true`.

**Why use `afterScrollVertically` instead of a scroll event listener?**

Attaching a native `scroll` event listener to the grid container requires knowing the internal scroll element, which is an implementation detail that can change. `afterScrollVertically` is a stable public API that fires at the right time, after Handsontable has updated the viewport.

## Step 5 -- Load the first remote page on init

After creating the grid, call `fetchNextPage()` once to replace the built-in `INITIAL_DATA` with live server data:

```javascript
fetchNextPage();
```

This runs immediately after the grid initializes. The grid displays `INITIAL_DATA` for a moment while the first network request is in flight, then `updateData()` replaces it with the server response. If the network is unavailable, the grid keeps showing `INITIAL_DATA`.

## How It Works - Complete Flow

1. **Grid initializes** with `INITIAL_DATA` (20 local rows) and `fetchNextPage()` runs immediately.
2. **First remote fetch** loads page 2 from the API. `updateData()` replaces `INITIAL_DATA` with 20 server rows. `currentPage` becomes 2.
3. **User scrolls down**. `afterScrollVertically` fires on every scroll event. When `lastVisibleRow >= totalRows - 5`, `fetchNextPage()` is called.
4. **Guard check**: if `isLoading` is `true` (a fetch is already in flight), the function returns immediately. This prevents duplicate requests no matter how fast the user scrolls.
5. **Fetch runs**: `isLoading` becomes `true`, the loading indicator appears, and the next page is fetched.
6. **Response arrives**: new rows are spread into `loadedData`, `updateData()` appends them to the grid, scroll position is unchanged, and `isLoading` resets to `false`.
7. **End of data**: when `nextPage >= TOTAL_PAGES` or the response is empty, `hasMore` becomes `false`. The loading indicator shows "All tasks loaded." and all future `fetchNextPage()` calls return immediately.

## What you learned

- How to use `afterScrollVertically` to detect when the user is near the bottom of loaded data.
- Why `hot.updateData()` is the correct method for appending rows -- it preserves scroll position and column state, unlike `hot.loadData()`.
- How to use `isLoading`, `hasMore`, and `currentPage` flags to prevent duplicate requests and handle end-of-data gracefully.
- How to show and update a loading indicator during an async fetch.

## Next steps

- Replace the JSONPlaceholder API with your own paginated endpoint. Most REST APIs support `_page`/`_limit` or `offset`/`limit` style pagination.
- Add column sorting or filtering. When the user sorts a column, you may want to reset `currentPage` and `loadedData` and reload from page 1 with the sort parameters forwarded to the API.
- Combine with the [DataProvider plugin](@/guides/tools-and-building/packages/packages.md) for a fully managed server-backed data grid with built-in loading states and error handling.
