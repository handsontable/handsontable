---
type: how-to
title: Migrate to server-side data
metaTitle: Migrate to server-side data - JavaScript Data Grid | Handsontable
description: Move from a full in-memory data array and afterChange saves to Handsontable dataProvider—stable row ids, fetchRows, CRUD callbacks, pagination, and filters.
permalink: /server-side-data-migration
canonicalUrl: /server-side-data-migration
tags:
  - data provider
  - server-side
  - migration
react:
  metaTitle: Migrate to server-side data - React Data Grid | Handsontable
angular:
  metaTitle: Migrate to server-side data - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate to server-side data - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
---

Use this checklist when moving from a full in-memory `data` array and hooks such as [`afterChange`](@/api/hooks.md#afterchange) to `dataProvider`. For an overview and demo, see [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md).

[[toc]]

## Checklist

1. **Stable row ids** — Set `rowId` to a property name (for example `'id'`) or a function. Every row from the server must include that field.
2. **`fetchRows`** — Replace ad hoc `loadData` calls with `fetchRows(queryParameters, { signal })`. Read `page`, `pageSize`, `sort`, and `filters` from `queryParameters`, call your API, return `{ rows, totalRows }`, and honor `signal` for cancellation. Drop or stop updating the old `data` array; with a complete provider, it is not used.
3. **CRUD callbacks** — Implement `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` for your backend. Until all three are valid functions (with `rowId` and `fetchRows`), the configuration is incomplete. Details: [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md).
4. **Pagination and sort** — Set [`pagination`](@/api/options.md#pagination) to `true` or pass an object (for example `{ pageSize: 10 }` so `fetchRows` receives that `pageSize` in `queryParameters`). Use [`columnSorting`](@/api/options.md#columnsorting) for single-column server sort. Keep [`multiColumnSorting`](@/api/options.md#multicolumnsorting), [`trimRows`](@/api/options.md#trimrows), [`manualRowMove`](@/api/options.md#manualrowmove), and [`manualColumnMove`](@/api/options.md#manualcolumnmove) off if you need DataProvider to run; when any of them is truthy, the DataProvider plugin does not enable (see [Plugins and options that conflict with DataProvider](@/guides/getting-started/server-side-data/server-side-data.md#plugins-and-options-that-conflict-with-dataprovider)).
5. **Save hooks** — If you only used [`afterChange`](@/api/hooks.md#afterchange) to POST each edit, remove that and rely on `onRowsUpdate` batches instead. Keep unrelated hooks (validation UI, analytics, etc.).
6. **Filters (optional)** — Enable [`filters`](@/api/options.md#filters) and translate `queryParameters.filters` on the server. See [Column filter](@/guides/columns/column-filter/column-filter.md#server-side-filtering).
7. **Frameworks** — Pass `dataProvider` inside grid settings (`HotTable`, `hot-table`, or Vue `:settings`). After `updateSettings` in React, preserve selection with `selection.exportSelection()` and `selection.importSelection()` on the Handsontable instance where your wrapper documents it.

## More in this guide

<div class="boxes-list">

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) — overview, quick start, and demo.
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md)
- [Create, update, and remove](@/guides/getting-started/server-side-data/server-side-data-crud.md)
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md)

</div>

## Result

Your grid now loads and saves data server-side using the updated API.
