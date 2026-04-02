---
id: xm9k2p7q
title: Server-side data
metaTitle: Server-side data - JavaScript Data Grid | Handsontable
description: Load paged data with Handsontable DataProvider—quick start, interactive demo, how fetchRows and CRUD fit together, and options that conflict with server-backed data.
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
searchCategory: Guides
category: Server-side data
menuTag: new
---

# Server-side data

Use the [`dataProvider`](@/api/options.md#dataprovider) option so Handsontable loads row data from your backend instead of keeping the full dataset in the browser. The grid stays aligned with paging, column sorting, and (optionally) column filters that run on the server. The same configuration wires **create**, **update**, and **remove** to your API. When the `dataProvider` object is **complete** (all required keys valid), Handsontable ignores a static [`data`](@/api/options.md#data) array and loads rows only through `fetchRows`. If you still pass a `data` array with a complete provider, Handsontable logs a console warning that `data` is ignored.

## Quick start

Pass a `dataProvider` object with five required keys, enable [`pagination`](@/api/options.md#pagination), and add sorting, filters, menus, and UI plugins as needed. Server-side sort is single-column only ([`multiColumnSorting`](@/api/options.md#multicolumnsorting) blocks DataProvider). See [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md#query-parameters) for the full `queryParameters` shape passed into `fetchRows`.

```js
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',
    fetchRows: async (queryParameters, { signal }) => {
      // queryParameters: { page, pageSize, sort, filters } — send sort and filters to your API.
      const res = await fetch(`/api/items?page=${queryParameters.page}`, { signal });
      const json = await res.json();

      return { rows: json.data, totalRows: json.total };
    },
    onRowsCreate: async (payload) => { await fetch('/api/items', { method: 'POST', body: JSON.stringify(payload) }); },
    onRowsUpdate: async (rows) => { await fetch('/api/items', { method: 'PATCH', body: JSON.stringify(rows) }); },
    onRowsRemove: async (rowIds) => { await fetch('/api/items', { method: 'DELETE', body: JSON.stringify(rowIds) }); },
  },
  columns: [{ data: 'name' }, { data: 'price' }],
  pagination: { pageSize: 10 },
  columnSorting: true,
  filters: true,
  emptyDataState: true,
  dialog: true,
  dropdownMenu: true,
  contextMenu: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

| Option | Description |
| --- | --- |
| [`dataProvider`](@/api/options.md#dataprovider) | Server-backed load and mutations; required keys are listed in the table below. |
| [`columns`](@/api/options.md#columns) | Column definitions; each `data` key matches row properties and is used for `sort` and `filters` `prop` values. |
| [`pagination`](@/api/options.md#pagination) | Page UI; current page and [`pageSize`](@/api/pagination.md) are passed as `queryParameters.page` and `queryParameters.pageSize`. |
| [`columnSorting`](@/api/options.md#columnsorting) | Header sort; with DataProvider, `fetchRows` receives `queryParameters.sort` (`prop`, `order`, or `null`). |
| [`filters`](@/api/options.md#filters) | Column filters; with a complete `dataProvider`, conditions map to `queryParameters.filters` and the grid refetches from page 1. |
| [`emptyDataState`](@/api/options.md#emptydatastate) | Loading spinner and empty overlay while data loads or when the page has no rows. |
| [`dialog`](@/api/options.md#dialog) | Built-in modal when `fetchRows` or CRUD callbacks reject. |
| [`dropdownMenu`](@/api/options.md#dropdownmenu) | Column dropdown menu (filter and sort entries when those plugins are enabled). |
| [`contextMenu`](@/api/options.md#contextmenu) | Context menu for row and cell actions (for example insert or remove row when your app enables those items). |
| [`autoWrapRow`](@/api/options.md#autowraprow) | When `true`, selection wraps from the last column to the first column of the next row. |
| [`autoWrapCol`](@/api/options.md#autowrapcol) | When `true`, selection wraps from the last row to the first row of the next column. |
| [`licenseKey`](@/api/options.md#licensekey) | Handsontable license string (non-production builds often use `non-commercial-and-evaluation`). |

| `dataProvider` key | Description |
| --- | --- |
| [`rowId`](@/api/options.md#dataprovider) | String property name on each row, or a function that returns a stable id for CRUD. |
| [`fetchRows`](@/api/options.md#dataprovider) | Async loader; receives `queryParameters` (`page`, `pageSize`, `sort`, `filters`) and `{ signal }`; resolves with `{ rows, totalRows }`. |
| [`onRowsCreate`](@/api/options.md#dataprovider) | Async handler for rows created in the grid; receives the plugin create payload. |
| [`onRowsUpdate`](@/api/options.md#dataprovider) | Async handler for edited rows; receives an array of updated row objects. |
| [`onRowsRemove`](@/api/options.md#dataprovider) | Async handler for removed rows; receives an array of row ids. |

See [What the DataProvider plugin does](#what-the-dataprovider-plugin-does) for the full breakdown and [Plugins and options that conflict with DataProvider](#plugins-and-options-that-conflict-with-dataprovider) for limitations.

## Demo

The example below splits **in-memory server logic** (catalog, simulated latency, filters, CRUD, optional failed fetch) from **grid settings** (columns, [`emptyDataState`](@/api/emptyDataState.md), [`dialog`](@/api/dialog.md), hooks). Row `id` values are used for [`rowId`](@/api/options.md#dataprovider) only, not shown as a column. Use **Reload data** after a simulated failure, or **Simulate failed fetch** to reject the next `fetchRows` — with `dialog: true`, the [Dialog](@/api/dialog.md) plugin shows **Could not load data**. [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch) and [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) update the same status line (for example `#example1-status`) in the bordered area above the buttons for both outcomes. Replace `createInventoryDemoServer()` with your API module in a real app.

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

[[toc]]

## What the DataProvider plugin does

When you pass a **complete** `dataProvider` configuration, Handsontable:

- Calls your `fetchRows` function with query parameters (`page`, `pageSize`, `sort`, `filters`) and an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal).
- Expects `fetchRows` to resolve with `{ rows, totalRows }`. Rows must be objects (or arrays) compatible with your [`columns`](@/api/options.md#columns) `data` keys. If `rows` is missing or not an array, Handsontable treats it as `[]`. If `totalRows` is missing or not a non-negative number, it falls back to `rows.length`. After a successful response, if `totalRows` implies fewer pages than the requested `page`, Handsontable automatically refetches the last valid page (for example after deletes on the last page).
- Uses [`rowId`](@/api/options.md#dataprovider) so updates, removes, and server operations can target stable row identity.
- Sends create, update, and remove work through `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` (see [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md#create-update-and-remove)).
- Registers a default [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource) handler that returns `true` when the configuration is complete, so the [Pagination](@/api/pagination.md) and [Filters](@/api/filters.md) plugins can run in server-driven mode together with [`columnSorting`](@/api/options.md#columnsorting) (single-column sort only; see [Sorting and filtering](@/guides/getting-started/server-side-data/server-side-data-configuration.md#sorting-and-filtering)).

You must supply all of `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove`. If any callback is missing or invalid, the plugin stays enabled but the affected operations no-op until the configuration is valid. A truthy non-object value (for example `dataProvider: true`) enables the plugin instance but is never a complete configuration. If a key fails validation (for example `rowId` is neither a string nor a function), Handsontable emits a console warning like other plugin settings and keeps the previous stored value for that key.

## Plugins and options that conflict with DataProvider

[`trimRows`](@/api/options.md#trimrows), [`manualRowMove`](@/api/options.md#manualrowmove), [`manualColumnMove`](@/api/options.md#manualcolumnmove), and [`multiColumnSorting`](@/api/options.md#multicolumnsorting) each **block the DataProvider plugin** when the option is truthy. Those row and column features can still enable; DataProvider does not. Handsontable logs a console warning (one message for the first incompatible option the runtime reports). On the **initial** table load, if a conflict applies, your [`dataProvider`](@/api/options.md#dataprovider) setting may be cleared to `false` so the plugin stays off. If a conflict appears later through [`updateSettings`](@/api/core.md#updatesettings), the `dataProvider` object is usually left in settings; the plugin remains disabled until you turn off the incompatible option. Remove or disable the conflicting options if you need server-backed `fetchRows` and CRUD.

| Conflicting option | Why it conflicts |
| --- | --- |
| [`trimRows`](@/api/options.md#trimrows) | Client-side row trimming changes physical-to-visual mappings that conflict with server-paged data. |
| [`manualRowMove`](@/api/options.md#manualrowmove) | Row indices are non-persistent across server-side pages. |
| [`manualColumnMove`](@/api/options.md#manualcolumnmove) | Column reordering affects `prop` mapping used by `fetchRows` query parameters. |
| [`multiColumnSorting`](@/api/options.md#multicolumnsorting) | DataProvider supports single-column sort only; use [`columnSorting`](@/api/options.md#columnsorting) instead. |

## More in this guide

- [Migrate from client-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md) — checklist when replacing a local `data` array and `afterChange` saves.
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md) — required keys, `pagination`, sort, filters, and the `fetchRows` query shape.
- [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md) — callbacks, lifecycle, hooks, and programmatic API.
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md) — load and error hooks, `getPlugin('dataProvider')` methods, REST and GraphQL samples, CodeSandbox links.

## Related guides

- [Rows pagination](@/guides/rows/rows-pagination/rows-pagination.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Column filter](@/guides/columns/column-filter/column-filter.md)

## Related API reference

- Option: [`dataProvider`](@/api/options.md#dataprovider)
- Plugin: [`DataProvider`](@/api/dataProvider.md)
- Hooks: [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch), [`afterDataProviderFetch`](@/api/hooks.md#afterdataproviderfetch), [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror), [`afterDataProviderFetchAbort`](@/api/hooks.md#afterdataproviderfetchabort), [`hasExternalDataSource`](@/api/hooks.md#hasexternaldatasource), [`modifyRowHeader`](@/api/hooks.md#modifyrowheader) (global row index with pagination), [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation), [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation), [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror)
