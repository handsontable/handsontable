---
type: tutorial
id: xm9k2p7q
title: Server-side data
metaTitle: Server-side data - JavaScript Data Grid | Handsontable
description: Load paged data with Handsontable DataProvider—fetchRows, CRUD callbacks, migration from client-side arrays, pagination, sorting, filters, REST and GraphQL examples, and a JavaScript monorepo project with two Node servers.
permalink: /server-side-data
canonicalUrl: /server-side-data
tags:
  - data provider
  - server-side
  - pagination
  - REST
react:
  id: ym8j3n4r
  metaTitle: Server-side data - React Data Grid | Handsontable
angular:
  id: zn7h5m6s
  metaTitle: Server-side data - Angular Data Grid | Handsontable
vue:
  id: 8ct2kiul
  metaTitle: Server-side data - Vue Data Grid | Handsontable
searchCategory: Guides
category: Getting started
menuTag: new
---
Use the [`dataProvider`](@/api/options.md#dataprovider) option so Handsontable loads row data from your backend instead of keeping the full dataset in the browser. The grid stays aligned with paging, column sorting, and (optionally) column filters that run on the server. The same configuration wires **create**, **update**, and **remove** to your API. When the `dataProvider` object is **complete** (all required keys valid), Handsontable ignores a static [`data`](@/api/options.md#data) array and loads rows only through `fetchRows`. If you still pass a `data` array with a complete provider, Handsontable logs a console warning that `data` is ignored.

[[toc]]

## Demo

The example below splits **in-memory server logic** (catalog, simulated latency, filters, CRUD, optional failed fetch) from **grid settings** (columns, [`emptyDataState`](@/api/emptyDataState.md), [`notification`](@/api/notification.md), hooks). Row `id` values are used for [`rowId`](@/api/options.md#dataprovider) only, not shown as a column. Use **Reload data** after a simulated failure, or **Simulate failed fetch** to reject the next `fetchRows` — with `notification` enabled, the [Notification](@/api/notification.md) plugin shows **Could not load data** as an error toast. [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) and [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) update the same status line (for example `#example1-status`) in the bordered area above the buttons for both outcomes. Replace `createInventoryDemoServer()` with your API module in a real app.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/getting-started/server-side-data/javascript/example1.html)
@[code](@/content/guides/getting-started/server-side-data/javascript/example1.js)
@[code](@/content/guides/getting-started/server-side-data/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/server-side-data/react/example1.jsx)
@[code](@/content/guides/getting-started/server-side-data/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/server-side-data/angular/example1.ts)
@[code](@/content/guides/getting-started/server-side-data/angular/example1.html)

:::

:::

## What the DataProvider plugin does

When you pass a **complete** `dataProvider` configuration, Handsontable:

- Calls your `fetchRows` function with query parameters (`page`, `pageSize`, `sort`, `filters`) and an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).
- Expects `fetchRows` to resolve with `{ rows, totalRows }`. Rows must be objects (or arrays) compatible with your [`columns`](@/api/options.md#columns) `data` keys. If `rows` is missing or not an array, Handsontable treats it as `[]`. If `totalRows` is missing or not a non-negative number, it falls back to `rows.length`. After a successful response, if `totalRows` implies fewer pages than the requested `page`, Handsontable automatically refetches the last valid page (for example after deletes on the last page).
- Uses [`rowId`](@/api/options.md#dataprovider) so updates, removes, and server operations can target stable row identity.
- Sends create, update, and remove work through `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` (see [Create, update, and remove](#create-update-and-remove)).
- Registers a default [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource) handler that returns `true` when the configuration is complete, so the [Pagination](@/api/pagination.md) and [Filters](@/api/filters.md) plugins can run in server-driven mode together with [`columnSorting`](@/api/options.md#columnsorting) (single-column sort only; see [Sorting and filtering](#sorting-and-filtering)).

You must supply all of `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove`. If any callback is missing or invalid, the plugin stays enabled but the affected operations no-op until the configuration is valid. A truthy non-object value (for example `dataProvider: true`) enables the plugin instance but is never a complete configuration. If a key fails validation (for example `rowId` is neither a string nor a function), Handsontable emits a console warning like other plugin settings and keeps the previous stored value for that key.

## Migrate from client-side data

Use this checklist when moving from a full in-memory `data` array and hooks such as [`afterChange`](@/api/hooks.md#afterchange) to `dataProvider`:

1. **Stable row ids** — Set `rowId` to a property name (for example `'id'`) or a function. Every row from the server must include that field.
2. **`fetchRows`** — Replace ad hoc `loadData` calls with `fetchRows(queryParameters, { signal })`. Read `page`, `pageSize`, `sort`, and `filters` from `queryParameters`, call your API, return `{ rows, totalRows }`, and honor `signal` for cancellation. Drop or stop updating the old `data` array; with a complete provider, it is not used.
3. **CRUD callbacks** — Implement `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` for your backend. Until all three are valid functions (with `rowId` and `fetchRows`), the configuration is incomplete.
4. **Pagination and sort** — Set [`pagination`](@/api/options.md#pagination) to `true` or pass an object (for example `{ pageSize: 10 }` so `fetchRows` receives that `pageSize` in `queryParameters`). Use [`columnSorting`](@/api/options.md#columnsorting) for single-column server sort. Keep [`multiColumnSorting`](@/api/options.md#multicolumnsorting), [`trimRows`](@/api/options.md#trimrows), [`manualRowMove`](@/api/options.md#manualrowmove), and [`manualColumnMove`](@/api/options.md#manualcolumnmove) off if you need DataProvider to run; when any of them is truthy, the DataProvider plugin does not enable (see [Conflicting options](#plugins-and-options-that-conflict-with-dataprovider)).
5. **Save hooks** — If you only used [`afterChange`](@/api/hooks.md#afterchange) to POST each edit, remove that and rely on `onRowsUpdate` batches instead. Keep unrelated hooks (validation UI, analytics, etc.).
6. **Filters (optional)** — Enable [`filters`](@/api/options.md#filters) and translate `queryParameters.filters` on the server. See [Column filter](@/guides/columns/column-filter/column-filter.md#server-side-filtering).
7. **Frameworks** — Pass `dataProvider` inside grid settings (`HotTable`, `hot-table`, or Vue `:settings`). After `updateSettings` in React, preserve selection with `selection.exportSelection()` and `selection.importSelection()` on the Handsontable instance where your wrapper documents it.

## Required configuration sketch

```js
dataProvider: {
  rowId: 'id', // or (row) => row.id
  fetchRows: async (queryParameters, { signal }) => {
    // queryParameters: { page, pageSize, sort, filters }
    const res = await fetch(buildUrl(queryParameters), { signal });
    const json = await res.json();

    return { rows: json.data, totalRows: json.total };
  },
  onRowsCreate: async (payload) => { /* POST */ },
  onRowsUpdate: async (rows) => { /* PATCH */ },
  onRowsRemove: async (rowIds) => { /* DELETE */ },
},
pagination: { pageSize: 10 }, // or `true`; `pageSize` is read from Pagination into `fetchRows` queryParameters (not a dataProvider key)
columnSorting: true, // server-side sort (one column)
filters: true, // server-side column filters; read queryParameters.filters in fetchRows
emptyDataState: true, // loading spinner and empty overlay while fetching / when no rows
notification: true, // built-in error toast when fetchRows or CRUD callbacks reject (including refetch after mutation)
```

Use [`pagination`](@/api/options.md#pagination) so you can change pages and page size in the UI. With DataProvider, the Pagination plugin copies its **`pageSize`** and current **page** into every `fetchRows` call as `queryParameters.pageSize` and `queryParameters.page` (including [`initialPage`](@/guides/rows/rows-pagination/rows-pagination.md) when that is how the UI selects the first page). There is no `pageSize` field on the `dataProvider` object; set rows per page with `pagination: { pageSize: 10 }`, or `pagination: true` for the plugin’s default page size. With [`rowHeaders`](@/api/options.md#rowheaders) enabled, the DataProvider plugin uses [`modifyRowHeader`](@/api/hooks.md#modifyrowheader) so row headers reflect a **global** 1-based row index across pages (for example row `0` on page 2 with `pageSize: 5` shows header `6`), not only the index within the loaded slice. See the [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md) guide for the full configuration object.

The sketch also sets [`filters`](@/api/options.md#filters) for server-driven column filters, [`emptyDataState`](@/api/options.md#emptydatastate) for loading and empty overlays with asynchronous fetches, and [`notification`](@/api/options.md#notification) so request failures from the DataProvider can show an error toast in the Notification plugin (see [Fetch hooks and loading UI](#fetch-hooks-and-loading-ui)). Omit or adjust any of these if you do not need that feature.

## Query parameters

`fetchRows` receives:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `page` | number | 1-based page index. |
| `pageSize` | number | Rows per page: same value as the [Pagination](@/api/pagination.md) plugin’s `pageSize` setting when Pagination is enabled. |
| `sort` | object or `null` | Object with `prop` (column `data` key) and `order` (`'asc'` or `'desc'`). `null` when unsorted. |
| `filters` | array or `null` | Server-side filter payload when the Filters plugin runs in server mode (same condition shapes as the Filters API, with `prop` instead of a column index). |

`page` and `pageSize` come from the [Pagination](@/api/pagination.md) plugin when it is enabled, including **`pagination: { pageSize: n }`** so your API receives `n` rows per request. If you omit `pagination` or leave Pagination off, Handsontable still calls `fetchRows` with a fixed **page 1** and the library default page size (10) until you enable pagination or drive pages yourself via [`fetchData`](@/api/dataProvider.md#fetchdata) (you can pass `{ pageSize: n }` there as an override).

Respect `signal` so outdated requests abort when you sort, filter, or change pages quickly.

## Create, update, and remove

With a complete `dataProvider` configuration, Handsontable sends **create**, **update**, and **remove** operations to your backend through three callbacks. Valid edits appear in the grid immediately; if the server rejects an update (or the mutation promise rejects), or if [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation) returns `false`, affected cells roll back. **Cell and column validators** run before `onRowsUpdate`; if any cell in the batch fails, Handsontable does not call `onRowsUpdate`, fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) with a validation failure, and reverts the edit. If `rowId` resolves to `null` or `undefined` for a row, Handsontable cannot send an update or remove for that row (edits revert; remove from the UI throws). Programmatic [`updateRows`](@/api/dataProvider.md#updaterows) and [`removeRows`](@/api/dataProvider.md#removerows) throw if an id is missing. Row insert from the context menu is skipped when the table already has as many rows as [`maxRows`](@/api/options.md#maxrows).

### `onRowsCreate`

Called when you insert rows (for example from the context menu). Payload shape:

- `position`: `'above'` or `'below'`.
- `referenceRowId`: anchor row id when inserting next to a row (from `rowId`); may be `undefined` when there is no anchor (for example some programmatic inserts).
- `rowsAmount`: how many rows to create in one request.

Your API should create the rows and return a promise. Handsontable refetches the current query after success.

Create, update, and remove requests are **serialized**: if you trigger another mutation before the previous one finishes, work runs in order so your backend sees a single stream of operations.

### `onRowsUpdate`

Called with an array of `{ id, changes, rowData }`:

- `id` — stable row id (same as `rowId`).
- `changes` — map of property names to new cell values.
- `rowData` — optional full row snapshot; Handsontable fills it when applying edits from the grid.

One batch usually corresponds to one user action (typing a cell, paste, autofill, clear column, and similar). Implement your PATCH or PUT logic here, then rely on the refetch that follows a successful mutation.

### `onRowsRemove`

Called with an array of row ids to delete. After success, Handsontable refetches and may move to the previous page if the current page becomes empty.

### Programmatic CRUD

From the plugin instance (`hot.getPlugin('dataProvider')`), you can also call [`createRows`](@/api/dataProvider.md#createrows), [`updateRows`](@/api/dataProvider.md#updaterows), and [`removeRows`](@/api/dataProvider.md#removerows) with the same shapes as the callbacks above.

### Mutation hooks

- [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation) — `(operation, payload)`; return `false` to cancel. For **create** and **remove**, the server callback is not invoked and there is no refetch. For **update** from the grid, `false` reverts optimistic cell values and skips `onRowsUpdate`; cell validators run only when the hook allows the mutation to continue.
- [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation) — runs after the server mutation callback succeeds and before the post-mutation refetch.
- [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) — runs when the mutation callback throws or rejects, when validation fails before the request, or when the refetch after a successful update fails.

`operation` is `'create'`, `'update'`, or `'remove'`. The hook `payload` is a wrapper object, not the same reference as the callback argument: `'create'` uses `{ rowsCreate }` (same inner shape as `onRowsCreate`), `'update'` uses `{ rows }` (the array passed to `onRowsUpdate`), and `'remove'` uses `{ rowsRemove }` (the id array passed to `onRowsRemove`).

### Undo stack

When `onRowsUpdate` is set, Handsontable skips stacking certain edit sources on the local undo stack so client undo does not fight server-backed data (including `edit`, paste, cut, autofill, **Clear column** from the context menu, and revert after a failed `onRowsUpdate`). See [Undo/Redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md) for the general model.

## Sorting and filtering

- Use [`columnSorting`](@/api/options.md#columnsorting) for server-backed sorting. If [`multiColumnSorting`](@/api/options.md#multicolumnsorting) is enabled, the DataProvider plugin does not run (see [Conflicting options](#plugins-and-options-that-conflict-with-dataprovider)); keep it off for server-driven data.
- Enable [`filters`](@/api/options.md#filters) and export conditions from the UI; when **`fetchRows` is configured**, Handsontable maps those conditions into `queryParameters.filters`, resets to page 1, and refetches (Filters skip client-side row trimming). If Filters are on but `fetchRows` is missing (incomplete `dataProvider` object), filtering stays **client-side** on whatever rows are currently loaded.
- With a complete `dataProvider` configuration, the column menu does **not** offer **Filter by value** (only the current page is loaded, so value lists would be incomplete). Use condition-based filters (for example text, numeric, or date conditions) for server-side filtering. Programmatic `addCondition(..., 'by_value', ...)` is ignored when server-backed `fetchRows` is active.

## Plugins and options that conflict with DataProvider

[`trimRows`](@/api/options.md#trimrows), [`manualRowMove`](@/api/options.md#manualrowmove), [`manualColumnMove`](@/api/options.md#manualcolumnmove), and [`multiColumnSorting`](@/api/options.md#multicolumnsorting) each **block the DataProvider plugin** when the option is truthy. Those row and column features can still enable; DataProvider does not. Handsontable logs a console warning (one message for the first incompatible option the runtime reports). On the **initial** table load, if a conflict applies, your [`dataProvider`](@/api/options.md#dataprovider) setting may be cleared to `false` so the plugin stays off. If a conflict appears later through [`updateSettings`](@/api/core.md#updatesettings), the `dataProvider` object is usually left in settings; the plugin remains disabled until you turn off the incompatible option. Remove or disable the conflicting options if you need server-backed `fetchRows` and CRUD.

## Fetch hooks and loading UI

- [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) — return `false` to cancel a fetch. The argument merges query fields with optional `skipLoading` (set on internal refetches after sort or CRUD). That flag is **not** passed to `fetchRows`.
- [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) — result includes `rows`, `totalRows`, `queryParameters`, `columnSortConfig`, and `filtersConditionsStack` (the latter two mirror ColumnSorting and Filters state for the query that just ran).
- [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) — `(error, queryParameters)` when `fetchRows` throws or rejects with a non-abort error.
- [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort) — `(queryParameters, reason)` when a fetch is superseded, aborted, or ends with `AbortError`.

When [`notification`](@/api/options.md#notification) is enabled, the [Notification](@/api/notification.md) plugin shows an error toast if `fetchRows` rejects or if `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` rejects, including when a refetch after a successful mutation fails. The title is translated per operation (load vs create vs update vs remove). The message text prefers a string `message`, `error`, or `detail` from a JSON body, including when that body is nested on the error object (`error.response?.data`, `error.data`, or `error.body`, as with some HTTP clients). Otherwise it falls back to an `Error` message, a string rejection, or a generic fallback. **Fetch** errors also add a **Refetch** button that calls `hot.getPlugin('dataProvider').fetchData()` again; that toast stays until you dismiss it or use Refetch. If Notification is disabled, use [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) for failed loads and refetches, and [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) for rejected mutation callbacks; you supply your own error UI.

The [Empty data state / loading](@/guides/accessories-and-menus/empty-data-state/empty-data-state.md) overlay follows DataProvider for the `"loading"` branch: [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) turns loading on when `skipLoading` is not set; [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) and [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) turn it off. [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort) does **not** clear loading by itself (for example when you change page while a request is in flight), so the overlay stays until a fetch finishes successfully or with an error. Refetches after column sort or CRUD pass `skipLoading: true` into [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch), so the Empty data state plugin skips the full loading overlay for those internal loads.

## DataProvider plugin methods

From `hot.getPlugin('dataProvider')`:

- [`fetchData`](@/api/dataProvider.md#fetchdata) — refetch with optional overrides (`page`, `pageSize`, `sort`, `filters`, and client-only `skipLoading`). Overrides are merged into the current query; `page` is clamped to at least 1, and Handsontable may issue a follow-up fetch if `totalRows` from the server implies a lower last page than requested. After init, changing the `dataProvider` object through [`updateSettings`](@/api/core.md#updatesettings) runs the plugin’s update path and triggers a **refetch** when the grid is already rendered.
- **`updateSettings` and loaded rows** — When [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource) is `true`, Handsontable only resets the in-memory placeholder to an empty array during init or when the `updateSettings` payload includes [`data`](@/api/options.md#data) or [`dataProvider`](@/api/options.md#dataprovider). Other keys alone (for example `height` or `colHeaders`) do not clear the current page of rows or force a refetch; the DataProvider plugin refetches when its settings change. If you update `columns` without `data` or `dataProvider`, the data map is rebuilt but the same rule avoids wiping the grid with an empty dataset by accident.
- [`getQueryParameters`](@/api/dataProvider.md#getqueryparameters) — current `page`, `pageSize`, `sort`, `filters`.
- [`getRowId`](@/api/dataProvider.md#getrowid) — resolve the id for a visual row.
- [`createRows`](@/api/dataProvider.md#createrows), [`updateRows`](@/api/dataProvider.md#updaterows), [`removeRows`](@/api/dataProvider.md#removerows) — programmatic CRUD through the same server callbacks.

## Examples (REST and GraphQL)

These **end-to-end** patterns pair a browser grid with a small backend:

- **REST (warehouse stock)** — SKU / bin / quantity columns with an Express-style JSON API (`GET` / `PATCH` / `POST` / `DELETE` on `/api/stock-lines`). Reference server: [`server-rest.mjs`](https://github.com/handsontable/handsontable/blob/develop/examples/next/docs/js/data-provider/server-rest.mjs) (the same file ships in every `data-provider` example folder).
- **GraphQL (support queue)** — Paged open tickets, sort mapping, and mutations aligned to a helpdesk-style schema. Reference server: [`server-graphql.mjs`](https://github.com/handsontable/handsontable/blob/develop/examples/next/docs/js/data-provider/server-graphql.mjs) (same layout in each example folder).

The JavaScript, React, Vue 3, and Angular examples under [`examples/next/docs/`](https://github.com/handsontable/handsontable/tree/develop/examples/next/docs) each run **both** backends on one page (default ports 4010 and 4011). See [CodeSandbox examples](#codesandbox-examples) below.

In **TypeScript** projects, you can import `DataProviderQueryParameters`, `DataProviderFetchOptions`, and related interfaces from `handsontable/plugins/dataProvider` (same pattern as the framework examples that share `dataProviderClients` with the REST and GraphQL clients).

When you enable [`filters`](@/api/options.md#filters), add the parameters your backend needs and serialize `queryParameters.filters` the way your storage layer expects. Handle errors with [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) and [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

## CodeSandbox examples

Runnable projects under the Handsontable examples monorepo (Devbox):

**End-to-end backends (Node servers + UI)**

Each folder includes the same Express servers (`server-rest.mjs`, `server-graphql.mjs`, `start-servers.mjs`). Run `npm run server`, then `npm run start` for the framework dev server.

- [JavaScript (Vite)](https://codesandbox.io/p/devbox/github/handsontable/handsontable/tree/develop/examples/next/docs/js/data-provider) — override URLs with `VITE_API_BASE` and `VITE_GRAPHQL_URL`.
- [React (CRA)](https://codesandbox.io/p/devbox/github/handsontable/handsontable/tree/develop/examples/next/docs/react-wrapper/data-provider) — override with `REACT_APP_API_BASE` and `REACT_APP_GRAPHQL_URL`.
- [Vue 3 (Vite)](https://codesandbox.io/p/devbox/github/handsontable/handsontable/tree/develop/examples/next/docs/vue3/data-provider) — override with `VITE_API_BASE` and `VITE_GRAPHQL_URL`.
- [Angular](https://codesandbox.io/p/devbox/github/handsontable/handsontable/tree/develop/examples/next/docs/angular-wrapper/data-provider) — set `restApiBase` and `graphqlUrl` in `src/environments/environment.ts`.

## Related guides

<div class="boxes-list">

- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Column filter](@/guides/columns/column-filter/column-filter.md)

</div>

## Related API reference

**Options**

<div class="boxes-list">

- [`dataProvider`](@/api/options.md#dataprovider)

</div>

**Plugins**

<div class="boxes-list">

- [`DataProvider`](@/api/dataProvider.md)

</div>

**Hooks**

<div class="boxes-list">

- [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch)
- [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch)
- [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror)
- [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort)
- [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource)
- [`modifyRowHeader`](@/api/hooks.md#modifyrowheader)
- [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation)
- [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation)
- [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror)

</div>

## What you learned

- The `dataProvider` option connects Handsontable to a server-side API instead of a static in-memory array.
- You supply `fetchRows` to load paged data, and `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` to push mutations to your backend.
- Handsontable forwards sort and filter state to `fetchRows` as `queryParameters`, so your server handles those operations.
- Hooks like `beforeDataProviderFetch` and `afterDataProviderFetchError` let you control loading UI and error handling.

## Next steps

- [Migrate to server-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md) -- follow the step-by-step checklist to move from a client-side array to `dataProvider`.
- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md) -- configure page size and navigation for server-backed grids.
