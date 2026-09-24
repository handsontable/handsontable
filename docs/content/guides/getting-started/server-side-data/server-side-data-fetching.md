---
type: reference
title: Server-side fetching and examples
metaTitle: Server-side fetching and examples - JavaScript Data Grid | Handsontable
description: Handsontable DataProvider fetch hooks, loading UI with emptyDataState, plugin methods fetchData and getQueryParameters, REST and GraphQL sample servers, and CodeSandbox projects.
permalink: /server-side-data-fetching
canonicalUrl: /server-side-data-fetching
tags:
  - data provider
  - server-side
  - REST
  - GraphQL
react:
  metaTitle: Server-side fetching and examples - React Data Grid | Handsontable
angular:
  metaTitle: Server-side fetching and examples - Angular Data Grid | Handsontable
vue:
  metaTitle: Server-side fetching and examples - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
---

Hooks around `fetchRows`, loading and error UI, and the DataProvider plugin API. For CRUD callbacks, see [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md). For query fields passed into `fetchRows`, see [Server-side configuration](@/guides/getting-started/server-side-data/server-side-data-configuration.md).

[[toc]]

## Fetch hooks and loading UI

- [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) — return `false` to cancel a fetch. The argument merges query fields with optional `skipLoading` (set on internal refetches after sort or CRUD). That flag is **not** passed to `fetchRows`.
- [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) — result includes `rows`, `totalRows`, `queryParameters`, `columnSortConfig`, and `filtersConditionsStack` (the latter two mirror ColumnSorting and Filters state for the query that just ran).
- [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) — `(error, queryParameters)` when `fetchRows` throws or rejects with a non-abort error.
- [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort) — `(queryParameters, reason)` when a fetch is superseded, aborted, or ends with `AbortError`.

When [`notification`](@/api/options.md#notification) is enabled, the [Notification](@/api/notification.md) plugin shows an error toast if `fetchRows` rejects or if `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` rejects, including when a refetch after a successful mutation fails. The title is translated per operation (load vs create vs update vs remove). The message text prefers a string `message`, `error`, or `detail` from a JSON body, including when that body is nested on the error object (`error.response?.data`, `error.data`, or `error.body`, as with some HTTP clients). Otherwise it falls back to an `Error` message, a string rejection, or a generic fallback. **Fetch** errors (including a failed refetch after a mutation) also add a **Refetch** button on the toast that calls `hot.getPlugin('dataProvider').fetchData()` again; the toast stays until you dismiss it or use Refetch. If Notification is disabled, use [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) for failed loads and refetches, and [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) for rejected mutation callbacks; you supply your own error UI.

The [Empty data state / loading](@/guides/accessories-and-menus/empty-data-state/empty-data-state.md) overlay follows DataProvider for the `"loading"` branch: [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) turns loading on when `skipLoading` is not set; [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) and [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) turn it off. [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort) does **not** clear loading by itself (for example when the user changes page while a request is in flight), so the overlay stays until a fetch finishes successfully or with an error. Refetches after column sort or CRUD pass `skipLoading: true` into [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch), so the Empty data state plugin skips the full loading overlay for those internal loads.

## DataProvider plugin methods

From `hot.getPlugin('dataProvider')`:

- [`fetchData`](@/api/dataProvider.md#fetchdata) — fetches the visible sheet, with optional overrides (`page`, `pageSize`, `sort`, `filters`, and client-only `skipLoading`). Overrides are merged into the current query; `page` is clamped to at least 1, and Handsontable may issue a follow-up fetch if `totalRows` from the server implies a lower last page than requested. After init, changing the `dataProvider` object through [`updateSettings`](@/api/core.md#updatesettings) runs the plugin's update path and triggers a **refetch** when the grid is already rendered. A sheets bar switch is the exception: it applies the arriving sheet's `dataProvider` without refetching (see [Use DataProvider with the sheets bar](#use-dataprovider-with-the-sheets-bar) below).
- [`isFetching`](@/api/dataProvider.md#isfetching) — whether the visible sheet is waiting for a `fetchRows` response that shows the loading overlay. An internal refetch that passes `skipLoading` (sort, CRUD) does not count.
- **`updateSettings` and loaded rows** — When [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource) is `true`, Handsontable only resets the in-memory placeholder to an empty array during init or when the `updateSettings` payload includes [`data`](@/api/options.md#data) or [`dataProvider`](@/api/options.md#dataprovider). Other keys alone (for example `height` or `colHeaders`) do not clear the current page of rows or force a refetch; the DataProvider plugin refetches when its settings change. If you update `columns` without `data` or `dataProvider`, the data map is rebuilt but the same rule avoids wiping the grid with an empty dataset by accident. The [`Pagination`](@/api/pagination.md) and [`Filters`](@/api/filters.md) plugins follow a `dataProvider` added or removed this way too: both read live whether a data provider backs the grid, so they switch between server-side and client-side behavior the moment the setting changes. Destroying the grid while a fetch is in flight aborts that fetch without logging a console error.
- [`getQueryParameters`](@/api/dataProvider.md#getqueryparameters) — current `page`, `pageSize`, `sort`, `filters`.
- [`getRowId`](@/api/dataProvider.md#getrowid) — resolve the id for a visual row.
- [`createRows`](@/api/dataProvider.md#createrows), [`updateRows`](@/api/dataProvider.md#updaterows), [`removeRows`](@/api/dataProvider.md#removerows) — programmatic CRUD through the same server callbacks (see [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md)).

## Use DataProvider with the sheets bar

With the [sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md), declare `dataProvider` in the `settings` of each sheet that loads from a server. Sheets without it stay local - sorting, filtering, paging, and editing all run in the browser. Handsontable disables a grid-level `dataProvider` while the sheets bar is enabled, even when every sheet declares its own, and logs one console warning; it restores that value if you disable the sheets bar later. Setting a grid-level `dataProvider` afterward through `updateSettings()`, on a sheet that does not declare its own, is blocked the same way, and the sheet keeps its rows.

- The first time you show a sheet, it fetches its rows.
- Returning to a sheet that already fetched does not trigger a new fetch. The sheet shows the rows, sort, filters, page, and page size it had when you left - Handsontable replays the saved response through [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) instead of re-sorting or re-filtering the rows in the browser. Call [`fetchData()`](@/api/dataProvider.md#fetchdata) to refresh them.
- A fetch that is still running when you switch away keeps running, and its rows land in the sheet that started it.
- An edit you save on a sheet after switching away still reaches that sheet's server, with that sheet's own row ids.
- If a fetch or a mutation fails while its sheet is off-screen, [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) or [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires right away, and the error notification appears when you return to that sheet. `afterDataProviderFetchError` then receives a third argument, `isVisible`, set to `false`, so a custom error UI can tell such a failure apart from one on the sheet you see. The failure changes nothing on the visible sheet: its filters and its loading overlay stay as they are.
- A duplicated sheet starts with a copy of the original's rows and server view, and its first visit does not fetch. Removing a sheet aborts its running fetch silently.

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

## More in this guide

<div class="boxes-list">

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- [Migrate from client-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md)
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md)
- [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md)

</div>

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
- [`modifyRowHeader`](@/api/hooks.md#modifyrowheader) (global row index with pagination)
- [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation)
- [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation)
- [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror)

</div>
