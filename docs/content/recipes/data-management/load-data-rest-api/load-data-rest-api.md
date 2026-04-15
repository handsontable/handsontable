---
id: 1f8a3c7d
title: Load data from a REST API
metaTitle: Load Data from a REST API - JavaScript Data Grid | Handsontable
description: Fetch JSON data from a REST API and load it into Handsontable with loading and error states.
permalink: /recipes/data-management/load-data-rest-api
canonicalUrl: /recipes/data-management/load-data-rest-api
tags:
  - recipes
  - data management
  - REST API
  - fetch
  - loading state
  - error handling
react:
  id: 7c4d2e9a
  metaTitle: Load Data from a REST API - React Data Grid | Handsontable
angular:
  id: 3b6f1d8e
  metaTitle: Load Data from a REST API - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
---

## Overview

This recipe shows how to fetch JSON from a REST API and populate Handsontable after initialization. It starts the grid with `data: []`, shows a loading message, then displays success or error feedback in the UI.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example1.js)
@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example1.ts)

:::

:::

## What this recipe covers

- Fetching data from `https://jsonplaceholder.typicode.com/users`.
- Initializing Handsontable with an empty dataset.
- Filling the table with `hot.loadData()` when the response arrives.
- Showing loading, success, and error states in the interface.
- Defining a column configuration that matches API fields.

## How it works

1. Create Handsontable with `data: []`.
2. Create a status element and retry button above the grid.
3. Start `loadUsers()` and set status to loading.
4. Fetch users and map nested fields (`company.name`, `address.city`) to flat row objects.
5. Call `hot.loadData(rows)` and show a success message.
6. If the request fails, show an error message and keep the table empty.

## Using `updateData()` to preserve sorting and other states

The first example resets all grid state on every data load -- column sort order, selection, and column order all go back to defaults. This is fine when no user state exists yet, but it creates a jarring experience in a running app where the user has already sorted or filtered the data.

`hot.updateData()` replaces the dataset while keeping every registered grid state intact. The second example demonstrates this: sort any column by clicking its header, then click **Refresh**. The sort order survives the data update.

::: only-for javascript vue

::: example #example2 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example2.js)
@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example2.ts)

:::

:::

## What the second example covers

- Enabling `columnSorting` so the user can sort by any column header.
- Using `hot.loadData()` for the first fetch -- there is no existing state to preserve.
- Using `hot.updateData()` for every subsequent refresh to keep column sort order, selection, and column order intact.
- Extracting a shared `fetchUsers()` helper that both functions call.
- Keeping the "Refresh" button hidden until the grid has data, and the "Retry" button visible only on error.

## `loadData()` vs `updateData()`

Both methods replace the grid's dataset. The difference is what they reset:

| Method | Resets sort order | Resets selection | Resets column order | Use when |
|---|---|---|---|---|
| `loadData()` | Yes | Yes | Yes | Initial load, schema change, or hard reset |
| `updateData()` | No | No | No | Periodic refresh or live-data feed |

## Step 1: Enable column sorting

Add `columnSorting: true` to the grid options. Handsontable renders a sort-indicator arrow in each column header, and the sort state is preserved by `updateData()`.

```javascript
const hot = new Handsontable(gridContainer, {
  data: [],
  // ...column definitions...
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:**
- Clicking a column header cycles through ascending, descending, and no sort.
- The sort state is one of the registered states that `updateData()` leaves untouched.
- `loadData()`, by contrast, resets the sort state to "no sort" on every call.

## Step 2: Add a "Refresh" button to the toolbar

Create a second button next to the status label and add it to the status bar.

```javascript
const refreshButton = document.createElement('button');

refreshButton.type = 'button';
refreshButton.textContent = 'Refresh';
refreshButton.hidden = true; // hidden until the initial load succeeds
refreshButton.style.marginBottom = '0';

statusBar.appendChild(refreshButton);
```

**What's happening:**
- The button starts hidden so it does not appear during the initial loading phase.
- `setUiState()` makes it visible only when the grid contains data and no error is active.

## Step 3: Track four UI states

The second example has one more status constant than the first -- a "Refreshing..." state shown while a refresh is in progress.

```javascript
const STATUS_LOADING   = 'Loading users...';
const STATUS_READY     = 'Users loaded. Sort a column, then click "Refresh" to see that the column sort order is preserved.';
const STATUS_REFRESHING = 'Refreshing...';
const STATUS_REFRESHED = 'Data refreshed -- column sort order was preserved.';
const STATUS_ERROR     = 'Failed to load users. Try again.';
```

**What's happening:**
- `STATUS_LOADING` -- shown during the first fetch.
- `STATUS_READY` -- shown after the first load; prompts the user to sort a column.
- `STATUS_REFRESHING` -- shown while a refresh request is in flight.
- `STATUS_REFRESHED` -- shown after a successful refresh; confirms that sort order was kept.
- `STATUS_ERROR` -- shown when any request fails.

## Step 4: Update `setUiState()` to manage both buttons

The helper controls the "Refresh" button alongside the existing "Retry" button.

```javascript
function setUiState({ loading = false, hasError = false, message = '' } = {}) {
  status.textContent = message;
  status.style.color = hasError ? '#c62828' : '#202124';
  retryButton.hidden = !hasError;            // visible only on error
  refreshButton.hidden = hasError || loading; // visible only when data is ready
  refreshButton.disabled = loading;
  retryButton.disabled = loading;
}
```

**What's happening:**
- `refreshButton.hidden = hasError || loading` -- the Refresh button appears only in the "ready" or "refreshed" state.
- `retryButton.hidden = !hasError` -- the Retry button appears only on error.
- Both buttons are disabled while any request is in progress to prevent double-clicks.

## Step 5: Extract `fetchUsers()` as a shared helper

Both `initialLoad()` and `refreshUsers()` need to call the same endpoint. Extract the fetch logic into its own function so neither handler duplicates it.

```javascript
async function fetchUsers() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  if (!response.ok) {
    throw new Error(`Request failed with status: ${response.status}`);
  }

  return response.json();
}
```

**What's happening:**
- The function throws when the HTTP status is not `2xx`, so callers can catch it in a unified `catch` block.
- The `mapUsersToGridRows()` helper (unchanged from the first example) runs in each caller, keeping `fetchUsers()` focused on the network concern only.

## Step 6: Use `loadData()` for the initial fetch

On the first load there is no state to preserve, so `loadData()` is the right choice. It also performs a clean reset if the user retries after an error.

```javascript
async function initialLoad() {
  setUiState({ loading: true, message: STATUS_LOADING });

  try {
    const users = await fetchUsers();

    hot.loadData(mapUsersToGridRows(users));
    setUiState({ message: STATUS_READY });
  } catch (_error) {
    hot.loadData([]);
    setUiState({ hasError: true, message: STATUS_ERROR });
  }
}
```

**What's happening:**
1. Set the UI to the "Loading..." state and disable both buttons.
2. Fetch users from the API.
3. Call `hot.loadData()` -- resets all states (sort order, selection) and renders the fresh data.
4. On success, show `STATUS_READY`, which prompts the user to sort a column before refreshing.
5. On error, clear the grid with `hot.loadData([])` and show the Retry button.

## Step 7: Use `updateData()` for subsequent refreshes

When the user clicks **Refresh**, call `hot.updateData()` instead of `hot.loadData()`. The grid replaces its data while keeping the sort order exactly as the user left it.

```javascript
async function refreshUsers() {
  setUiState({ loading: true, message: STATUS_REFRESHING });

  try {
    const users = await fetchUsers();

    hot.updateData(mapUsersToGridRows(users));
    setUiState({ message: STATUS_REFRESHED });
  } catch (_error) {
    // On error, do not clear the grid -- the existing data is still valid.
    setUiState({ hasError: true, message: STATUS_ERROR });
  }
}
```

**What's happening:**
1. Set the UI to "Refreshing..." and hide the Refresh button.
2. Fetch users from the API.
3. Call `hot.updateData()` -- replaces the data while keeping column sort order, selection, and column order intact.
4. On success, show `STATUS_REFRESHED` and make the Refresh button available again.
5. On error, show the Retry button. The grid keeps its current data because `updateData()` was never called -- no data is lost.

**Key difference from `loadData()`:**
- `loadData()` fires `beforeLoadData` / `afterLoadData` hooks and resets all registered state.
- `updateData()` fires `beforeUpdateData` / `afterUpdateData` hooks and preserves all registered state.

## SSR note - current wrapper approach

If you use the React wrapper in an SSR framework (for example Next.js App Router), keep the table in a client component:

```tsx
"use client";

import { HotTable } from "@handsontable/react-wrapper";
```

Run your API fetch inside client-side lifecycle code (for example `useEffect`) and pass the loaded data to `HotTable`. This matches the current SSR-safe usage pattern in the `develop` branch docs.

## Related

<div class="boxes-list">

- [Saving data](@/guides/getting-started/saving-data/saving-data.md)
- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)

</div>
