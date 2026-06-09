---
type: reference
title: Server-side configuration
metaTitle: Server-side configuration - JavaScript Data Grid | Handsontable
description: Handsontable dataProvider configuration—required keys, pagination and pageSize, query parameters for fetchRows, column sorting, and server-side filters.
permalink: /server-side-data-configuration
canonicalUrl: /server-side-data-configuration
tags:
  - data provider
  - server-side
  - pagination
react:
  metaTitle: Server-side configuration - React Data Grid | Handsontable
angular:
  metaTitle: Server-side configuration - Angular Data Grid | Handsontable
vue:
  metaTitle: Server-side configuration - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
---

How to wire [`dataProvider`](@/api/options.md#dataprovider) with [`pagination`](@/api/options.md#pagination), sorting, and filters, and what `fetchRows` receives in each request. Start with [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) if you need the overview or demo.

[[toc]]

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
notification: true, // built-in error toasts when fetchRows or CRUD callbacks reject; fetch failures include a Refetch action
```

Use [`pagination`](@/api/options.md#pagination) so users can change pages and page size in the UI. With DataProvider, the Pagination plugin copies its **`pageSize`** and current **page** into every `fetchRows` call as `queryParameters.pageSize` and `queryParameters.page` (including [`initialPage`](@/guides/rows/rows-pagination/rows-pagination.md) when that is how the UI selects the first page). There is no `pageSize` field on the `dataProvider` object; set rows per page with `pagination: { pageSize: 10 }`, or `pagination: true` for the plugin’s default page size. With [`rowHeaders`](@/api/options.md#rowheaders) enabled, the DataProvider plugin uses [`modifyRowHeader`](@/api/hooks.md#modifyrowheader) so row headers reflect a **global** 1-based row index across pages (for example row `0` on page 2 with `pageSize: 5` shows header `6`), not only the index within the loaded slice. See the [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md) guide for the full configuration object.

The sketch also sets [`filters`](@/api/options.md#filters) for server-driven column filters, [`emptyDataState`](@/api/options.md#emptydatastate) for loading and empty overlays with asynchronous fetches, and [`notification`](@/api/options.md#notification) so request failures from the DataProvider can show an error toast in the Notification plugin (see [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md#fetch-hooks-and-loading-ui)). Omit or adjust any of these if you do not need that feature.

## Query parameters

`fetchRows` receives:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `page` | number | 1-based page index. |
| `pageSize` | number | Rows per page: same value as the [Pagination](@/api/pagination.md) plugin’s `pageSize` setting when Pagination is enabled. |
| `sort` | object or `null` | Object with `prop` (column `data` key) and `order` (`'asc'` or `'desc'`). `null` when unsorted. |
| `filters` | array or `null` | Server-side filter payload when the Filters plugin runs in server mode (same condition shapes as the Filters API, with `prop` instead of a column index). |

`page` and `pageSize` come from the [Pagination](@/api/pagination.md) plugin when it is enabled, including **`pagination: { pageSize: n }`** so your API receives `n` rows per request. If you omit `pagination` or leave Pagination off, Handsontable still calls `fetchRows` with a fixed **page 1** and the library default page size (10) until you enable pagination or drive pages yourself via [`fetchData`](@/api/dataProvider.md#fetchdata) (you can pass `{ pageSize: n }` there as an override).

Respect `signal` so outdated requests abort when the user sorts, filters, or changes pages quickly.

## Sorting and filtering

- Use [`columnSorting`](@/api/options.md#columnsorting) for server-backed sorting. If [`multiColumnSorting`](@/api/options.md#multicolumnsorting) is enabled, the DataProvider plugin does not run (see [Plugins and options that conflict with DataProvider](@/guides/getting-started/server-side-data/server-side-data.md#plugins-and-options-that-conflict-with-dataprovider)); keep it off for server-driven data.
- Enable [`filters`](@/api/options.md#filters) and export conditions from the UI; when **`fetchRows` is configured**, Handsontable maps those conditions into `queryParameters.filters`, resets to page 1, and refetches (Filters skip client-side row trimming). If Filters are on but `fetchRows` is missing (incomplete `dataProvider` object), filtering stays **client-side** on whatever rows are currently loaded.
- With a complete `dataProvider` configuration, the column menu does **not** offer **Filter by value** (only the current page is loaded, so value lists would be incomplete). Use condition-based filters (for example text, numeric, or date conditions) for server-side filtering. Programmatic `addCondition(..., 'by_value', ...)` is ignored when server-backed `fetchRows` is active.

## More in this guide

<div class="boxes-list">

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- [Migrate from client-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md)
- [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md)
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md)

</div>
