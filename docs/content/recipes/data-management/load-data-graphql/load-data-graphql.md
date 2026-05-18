---
id: 2a7d9f1c
title: Load data from a GraphQL API
metaTitle: Load Data from a GraphQL API - JavaScript Data Grid | Handsontable
description: Learn how to fetch data from a GraphQL API and load it into Handsontable with loading and error states.
permalink: /recipes/data-management/load-data-graphql
canonicalUrl: /recipes/data-management/load-data-graphql
tags:
  - recipes
  - data management
  - GraphQL
  - fetch
  - loading state
  - error handling
react:
  id: 8c3e5b7a
  metaTitle: Load Data from a GraphQL API - React Data Grid | Handsontable
angular:
  id: f1d4a6c9
  metaTitle: Load Data from a GraphQL API - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

This tutorial shows two GraphQL approaches for Handsontable. The first approach loads data on the client with `fetch`, `loadData()`, and `updateData()`. The second approach uses the server-side DataProvider architecture for paging, sorting, filtering, and CRUD callbacks.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-graphql/javascript/example1.js)
@[code](@/content/recipes/data-management/load-data-graphql/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-graphql/react/example1.jsx)
@[code](@/content/recipes/data-management/load-data-graphql/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-graphql/angular/example1.ts)
@[code](@/content/recipes/data-management/load-data-graphql/angular/example1.html)

:::

:::

## Approach 1 - Client-side fetch with `loadData()` and `updateData()`

- Sending a GraphQL POST request to `https://graphqlzero.almansi.me/api` from the browser.
- Initializing Handsontable with an empty dataset.
- Filling the table with `hot.loadData()` when the response arrives.
- Showing loading, success, and error states in the interface.
- Defining a column configuration that matches API fields.

## How it works

1. Create Handsontable with `data: []`.
2. Create a status element and retry button above the grid.
3. Start `loadUsers()` and set status to loading.
4. Send a GraphQL query and map nested fields (`company.name`, `address.city`) to flat row objects.
5. Call `hot.loadData(rows)` and show a success message.
6. If the request fails, show an error message and keep the table empty.

## Using `updateData()` to preserve sorting and other states

The first example resets all grid state on every data load - column sort order, selection, and column order all go back to defaults. This is fine when no user state exists yet, but it creates a jarring experience in a running app where the user has already sorted or filtered the data.

`hot.updateData()` replaces the dataset while keeping every registered grid state intact. The second example demonstrates this: sort any column by clicking its header, then click **Refresh**. The sort order survives the data update.

::: only-for javascript vue

::: example #example2 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-graphql/javascript/example2.js)
@[code](@/content/recipes/data-management/load-data-graphql/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-graphql/react/example2.jsx)
@[code](@/content/recipes/data-management/load-data-graphql/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-graphql/angular/example2.ts)
@[code](@/content/recipes/data-management/load-data-graphql/angular/example2.html)

:::

:::

## What the second example covers

- Enabling `columnSorting` so the user can sort by any column header.
- Using `hot.loadData()` for the first query - there is no existing state to preserve.
- Using `hot.updateData()` for every subsequent refresh to keep column sort order, selection, and column order intact.
- Extracting a shared `fetchUsers()` helper that both functions call.
- Keeping the "Refresh" button hidden until the grid has data, and the "Retry" button visible only on error.

## `loadData()` vs `updateData()`

Both methods replace the grid's dataset. The difference is what they reset:

| Method | Resets sort order | Resets selection | Resets column order | Use when |
|---|---|---|---|---|
| `loadData()` | Yes | Yes | Yes | Initial load, schema change, or hard reset |
| `updateData()` | No | No | No | Periodic refresh or live-data feed |

## Approach 2 - Server-side GraphQL with `dataProvider`

Use this approach when your dataset is large, or when you need server-driven pagination, sorting, filtering, and CRUD. Instead of downloading all rows in one browser request, Handsontable requests only the current page through `dataProvider.fetchRows`.

```javascript
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',
    fetchRows: async (queryParameters, { signal }) => {
      const response = await fetch('/graphql', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: buildUsersQuery(queryParameters),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const payload = await response.json();

      if (payload.errors?.length) {
        throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed.');
      }

      return {
        rows: payload.data.users.data,
        totalRows: payload.data.users.meta.totalCount,
      };
    },
    onRowsCreate: async (rowsCreatePayload) => {
      await createRowsMutation(rowsCreatePayload);
    },
    onRowsUpdate: async (rows) => {
      await updateRowsMutation(rows);
    },
    onRowsRemove: async (rowIds) => {
      await removeRowsMutation(rowIds);
    },
  },
  pagination: { pageSize: 10 },
  columnSorting: true,
  filters: true,
  emptyDataState: true,
  notification: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

The example above maps directly to the latest server-side data guides and APIs:

- Overview and plugin behavior: [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- Required settings and query fields: [Server-side configuration](@/guides/getting-started/server-side-data/server-side-data-configuration.md)
- Fetch lifecycle, hooks, and REST/GraphQL examples: [Server-side fetching and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md)
- Mutation callbacks and rollback behavior: [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md)
- Upgrade checklist from client-only loading: [Migrate to server-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md)

## Client-side recipe vs server-side DataProvider

| Approach | Where data lives | Sorting/filtering | Pagination | CRUD | Use when |
|---|---|---|---|---|---|
| Client-side `fetch` + `loadData()` / `updateData()` | Browser memory | Client-side | Manual, if you build it | Manual | Small/medium datasets, quick integration |
| `dataProvider` + GraphQL backend | Backend + paged slices in browser | Server-side via query parameters | Built in with `pagination` | Built in via callbacks | Large datasets, production server-driven flows |

## GraphQL request specifics

GraphQL requires one extra check compared to REST:

- Send requests with `method: 'POST'`.
- Use `Content-Type: application/json`.
- Put your operation in `body: JSON.stringify({ query: '...' })`.
- Check `errors` in the JSON response body, even when HTTP status is `200`.

For basic scenarios, `fetch` is sufficient. In larger applications, a dedicated GraphQL client such as `graphql-request` or Apollo Client can simplify caching, retries, and schema-aware tooling.

## Step 1: Define the GraphQL query

Keep the user fields aligned with your Handsontable columns:

```javascript
const USERS_QUERY = `
  query {
    users {
      data {
        id
        name
        username
        email
        address { city }
        company { name }
      }
    }
  }
`;
```

**What's happening:**
- The query requests the same user dataset shape used by the REST recipe.
- Nested GraphQL fields (`address.city`, `company.name`) are flattened later by `mapUsersToGridRows()`.

## Step 2: Send a GraphQL POST request

Use `fetch` with a JSON payload that contains the query string.

```javascript
const response = await fetch('https://graphqlzero.almansi.me/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: USERS_QUERY }),
});
```

**What's happening:**
- GraphQL APIs typically use POST for operations.
- The payload format is always JSON with a `query` field.

## Step 3: Validate both HTTP status and GraphQL errors

GraphQL APIs can return HTTP 200 while still reporting operation errors.

```javascript
const payload = await response.json();

if (payload.errors?.length) {
  throw new Error(payload.errors[0]?.message ?? 'GraphQL request failed.');
}
```

**What's happening:**
- HTTP status validation catches transport-level failures.
- `payload.errors` catches GraphQL execution and validation failures.
- The same `catch` block handles both cases and updates the recipe UI consistently.

## Step 4: Use `loadData()` for initial query and `updateData()` for refreshes

`loadData()` is used once for initial population, and `updateData()` is used for subsequent refreshes to preserve state.

```javascript
hot.loadData(mapUsersToGridRows(users)); // initial query
hot.updateData(mapUsersToGridRows(users)); // refresh query
```

**What's happening:**
- `loadData()` resets state - ideal for first render.
- `updateData()` preserves state - ideal after users have interacted with the grid.

## Related

<div class="boxes-list">

- [Saving data](@/guides/getting-started/saving-data/saving-data.md)
- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)

</div>

## What you learned

- How to send a GraphQL POST request with `fetch` using `Content-Type: application/json` and a `query` field in the body.
- Why you must check `payload.errors` in addition to HTTP status, because GraphQL APIs return HTTP 200 even for operation errors.
- How `hot.loadData()` resets all grid state on first load and `hot.updateData()` preserves column sort order and selection on subsequent refreshes.
- How to use the `dataProvider` architecture for server-side pagination, sorting, filtering, and CRUD when your dataset is too large for client-side loading.

## Next steps

- Explore [Load data from a REST API](@/recipes/data-management/load-data-rest-api/load-data-rest-api.md) for the same client-side and server-side approaches with a REST backend.
- Read the [Server-side data guides](@/guides/getting-started/server-side-data/server-side-data.md) for the full `dataProvider` configuration reference.
