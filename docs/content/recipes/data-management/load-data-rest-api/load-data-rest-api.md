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
  - dataProvider
  - pagination
  - server-side data
react:
  id: 7c4d2e9a
  metaTitle: Load Data from a REST API - React Data Grid | Handsontable
angular:
  id: a3b8c2d1
  metaTitle: Load Data from a REST API - Angular Data Grid | Handsontable
vue:
  id: o4k4wnz7
  metaTitle: Load Data from a REST API - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

This tutorial shows how to fetch JSON from a REST API and populate Handsontable after initialization. It starts the grid with `data: []`, shows a loading message, then displays success or error feedback in the UI.

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/react/example1.jsx)
@[code](@/content/recipes/data-management/load-data-rest-api/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-rest-api/angular/example1.ts)
@[code](@/content/recipes/data-management/load-data-rest-api/angular/example1.html)

:::

:::

::: only-for javascript

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

::: only-for react

::: example #example2 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/react/example2.jsx)
@[code](@/content/recipes/data-management/load-data-rest-api/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-rest-api/angular/example2.ts)
@[code](@/content/recipes/data-management/load-data-rest-api/angular/example2.html)

:::

:::

::: only-for javascript

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
  status.style.color = hasError
    ? 'var(--ht-cell-error-foreground-color, #c62828)'
    : 'var(--ht-foreground-color, #202124)';
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

## Using `dataProvider` for automatic pagination and sorting

The first two examples manage the fetch lifecycle yourself: you call `loadData()` or `updateData()` at the right time and maintain loading state manually. Handsontable's `dataProvider` option flips this model -- you provide a `fetchRows` function and three CRUD callbacks, and the plugin drives everything else: initial load, pagination, column sorting, request cancellation, and loading overlays.

::: only-for react

::: example #example3 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/react/example3.jsx)
@[code](@/content/recipes/data-management/load-data-rest-api/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-rest-api/angular/example3.ts)
@[code](@/content/recipes/data-management/load-data-rest-api/angular/example3.html)

:::

:::

::: only-for javascript

::: example #example3 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example3.js)
@[code](@/content/recipes/data-management/load-data-rest-api/javascript/example3.ts)

:::

:::

## What the third example covers

- Configuring `dataProvider` with `rowId`, `fetchRows`, and CRUD callbacks.
- Sorting rows in `fetchRows` from the `sort` query parameter before returning a page.
- Slicing rows in `fetchRows` using the `page` and `pageSize` query parameters.
- Enabling `pagination`, `columnSorting`, and `emptyDataState` so the plugin drives navigation and loading overlays.
- Using `beforeDataProviderFetch`, `afterDataProviderFetch`, and `afterDataProviderFetchError` hooks for status feedback.
- Passing an `AbortSignal` to `fetch` so superseded requests are cancelled automatically.

## When to use each approach

| Approach | When to use |
|---|---|
| `loadData()` | One-shot load on page init; or when you want to reset all grid state (sort, selection) together with the data. |
| `updateData()` | Periodic refresh where the user's sort order, selection, and column layout must survive the data update. |
| `dataProvider` | Backend-driven pagination, sorting, and filtering; CRUD that round-trips to a server; any dataset too large to keep in the browser. |

## Step 1: Cache the remote response

The `dataProvider` plugin calls `fetchRows` every time the user changes page or clicks a sort header. If the API does not support server-side pagination or sorting (as with `jsonplaceholder`), fetch the full dataset once and reuse it.

```javascript
let cachedRows = null;

async function loadAllRows(signal) {
  if (cachedRows !== null) {
    return cachedRows;
  }

  const response = await fetch('https://jsonplaceholder.typicode.com/users', { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const users = await response.json();

  cachedRows = users.map((u) => ({
    id: u.id, name: u.name, username: u.username,
    email: u.email,
    city: u.address?.city ?? '',
    company: u.company?.name ?? '',
  }));

  return cachedRows;
}
```

**What's happening:**
- `cachedRows` starts as `null`. The first call hits the network; every later call returns the same array.
- `signal` is the `AbortSignal` from `fetchRows` -- passing it to `fetch` cancels the network request if the user sorts or changes pages before the current fetch finishes.
- The raw API response is mapped to flat row objects that match your `columns` `data` keys.

**In production:** Pass `page`, `pageSize`, `sort`, and `filters` directly to your API query string -- no client-side caching needed. The client-side sort and slice shown in Steps 4 and 5 replace the server query.

## Step 2: Replace the `data` array with a `dataProvider` object

Instead of passing `data: []` and calling `hot.loadData()`, pass a `dataProvider` object. Handsontable ignores any `data` array when the provider is complete.

```javascript
new Handsontable(gridContainer, {
  dataProvider: {
    rowId: 'id',
    fetchRows: ...,
    onRowsCreate: async () => {},
    onRowsUpdate: async () => {},
    onRowsRemove: async () => {},
  },
  // ...
});
```

**What's happening:**
- `rowId: 'id'` tells the plugin which property on each row object carries the stable row identity. It is required for the CRUD callbacks, refetch bookkeeping, and `modifyRowHeader` numbering across pages.
- All five keys (`rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`) must be valid for the configuration to be complete. If any are missing, the plugin stays enabled but the affected operations no-op.

## Step 3: Implement `fetchRows`

`fetchRows` is the only required async function. It receives `queryParameters` and an options object that carries an `AbortSignal`.

```javascript
async fetchRows({ page, pageSize, sort }, { signal }) {
  const rows = await loadAllRows(signal);
  // ...
  return { rows: pagedSlice, totalRows: rows.length };
}
```

**What's happening:**
- `page` -- 1-based page index driven by the Pagination plugin.
- `pageSize` -- rows per page; matches `pagination: { pageSize: 5 }` in grid options.
- `sort` -- `{ prop, order }` object when a column header is sorted, or `null` when unsorted.
- `{ signal }` -- AbortSignal from the plugin. Pass it to your `fetch` call so superseded requests are cancelled.
- Return `{ rows, totalRows }`. `totalRows` is the unsliced count -- the Pagination plugin uses it to calculate the page count and navigation controls.

## Step 4: Apply sort from query parameters

When `sort` is non-null, sort a copy of the rows array before slicing. Never mutate the cached array.

```javascript
if (sort) {
  rows = [...rows].sort((a, b) => {
    const av = a[sort.prop];
    const bv = b[sort.prop];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;

    return sort.order === 'asc' ? cmp : -cmp;
  });
}
```

**What's happening:**
- `sort.prop` is the `data` key of the sorted column (for example `'name'` or `'email'`).
- `sort.order` is `'asc'` or `'desc'`.
- The spread `[...rows]` prevents mutating the cached array. Sorting is referentially transparent -- the cache always holds the original order.

**In production:** You would not sort in the browser at all. Pass `sort.prop` and `sort.order` as query parameters to your API (`?_sort=name&_order=asc` for `jsonplaceholder`-style, or your own convention).

## Step 5: Apply pagination from query parameters

Slice the (sorted) array using `page` and `pageSize`.

```javascript
const start = (page - 1) * pageSize;

return {
  rows: rows.slice(start, start + pageSize),
  totalRows: rows.length,
};
```

**What's happening:**
- `page` is 1-based, so page 1 starts at index 0, page 2 starts at index `pageSize`, and so on.
- `totalRows` is the length of the full sorted array -- not the slice. The Pagination plugin uses this to render the correct total page count.

**In production:** Pass `page` and `pageSize` to your API (`?_page=1&_limit=5` for `jsonplaceholder`) and return the server's own `total` or `count` field as `totalRows`.

## Step 6: Provide CRUD callbacks

All three callbacks must be valid functions for the `dataProvider` configuration to be complete. For a read-only API, return resolved promises without calling the server.

```javascript
onRowsCreate: async () => {},
onRowsUpdate: async () => {},
onRowsRemove: async () => {},
```

**What's happening:**
- The plugin serializes CRUD calls -- a second mutation waits for the first to finish.
- After each callback resolves, the plugin automatically refetches the current page.
- These no-ops accept any user edit from the context menu but discard it on the next refetch. For a truly read-only grid, set `readOnly: true` on each column to prevent edits in the first place (as this example does).

**In production:** Implement `POST`, `PATCH`, and `DELETE` calls here. See the [Server-side data guide](@/guides/getting-started/server-side-data/server-side-data.md) for payload shapes and the full CRUD lifecycle.

## Step 7: Enable `pagination`, `columnSorting`, and `emptyDataState`

```javascript
pagination: { pageSize: 5 },
columnSorting: true,
emptyDataState: true,
```

**What's happening:**
- `pagination: { pageSize: 5 }` enables the Pagination plugin and sets 5 rows per page. The plugin renders navigation controls below the grid and passes `page` and `pageSize` into every `fetchRows` call.
- `columnSorting: true` enables server-driven single-column sorting. Clicking a header sets `sort` in the next `fetchRows` call. (`multiColumnSorting` is incompatible with `dataProvider` -- use `columnSorting` only.)
- `emptyDataState: true` renders a loading overlay while `fetchRows` is in flight and an "empty" state when the response contains zero rows.

## Step 8: Use fetch hooks for status feedback

```javascript
beforeDataProviderFetch: ({ skipLoading }) => {
  if (!skipLoading) {
    status.textContent = 'Loading...';
  }
},
afterDataProviderFetch: () => {
  status.textContent = 'Loaded from REST API via dataProvider.';
},
afterDataProviderFetchError: (error) => {
  status.textContent = `Error: ${error.message}`;
  status.style.color = 'var(--ht-cell-error-foreground-color, #c62828)';
},
```

**What's happening:**
- `beforeDataProviderFetch` fires before every fetch. The `skipLoading` flag is `true` for internal refetches triggered after a sort or CRUD operation -- skip updating the status label in those cases so the label does not flash "Loading..." on every column header click.
- `afterDataProviderFetch` fires after a successful fetch. Update the status label to confirm data was loaded.
- `afterDataProviderFetchError` fires when `fetchRows` rejects with a non-abort error. Update the status label with the error message. If you also set `dialog: true` in the grid options, the built-in Dialog plugin shows an error modal in addition to this hook.

## Related

<div class="boxes-list">

- [Saving data](@/guides/getting-started/saving-data/saving-data.md)
- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)

</div>

## What you learned

- How to initialize Handsontable with `data: []` and populate it after an async fetch with `hot.loadData()`.
- How `hot.loadData()` resets all grid state and `hot.updateData()` preserves column sort order, selection, and column order on refreshes.
- How to use `beforeDataProviderFetch`, `afterDataProviderFetch`, and `afterDataProviderFetchError` hooks for status feedback during `dataProvider` fetches.
- How the `dataProvider` architecture handles pagination, server-side sorting, and CRUD automatically -- removing the need for manual data management.

## Next steps

- Explore [Load data from a GraphQL API](@/recipes/data-management/load-data-graphql/load-data-graphql.md) for the same patterns with a GraphQL backend.
- Explore [Auto-save changes to a backend](@/recipes/data-management/auto-save-backend/auto-save-backend.md) to persist grid edits automatically after a debounce delay.
