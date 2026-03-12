---
id: ir3m4x8n
title: Server-side data
metaTitle: Server-side data - JavaScript Data Grid | Handsontable
description: Use Handsontable with server-side pagination, sorting, filtering, and CRUD operations through dataProvider.
permalink: /server-side-data
canonicalUrl: /server-side-data
tags:
  - server-side data
  - dataProvider
  - pagination
  - sorting
  - filtering
  - CRUD
react:
  id: v0r3w4kz
  metaTitle: Server-side data - React Data Grid | Handsontable
angular:
  id: m4o9p1jt
  metaTitle: Server-side data - Angular Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: new
---

# Server-side data

Use `dataProvider` to fetch data from your backend on demand. Handsontable builds query parameters and calls your function when pagination, sorting, or filtering changes.

[[toc]]

## Overview

When `dataProvider` is set, Handsontable switches to server-side mode:

- Pagination requests use `page` and `pageSize`.
- Sorting updates `sort`.
- Filtering updates `filters`.
- `refreshData()` re-fetches the current server-side view.

`data` and `dataProvider` can coexist in configuration, but Handsontable prioritizes `dataProvider`.

## REST example (JavaScript)

```js
const hot = new Handsontable(container, {
  dataProvider: async(queryParameters, { signal }) => {
    const { page, pageSize, sort, filters } = queryParameters;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (sort) {
      params.set('sortBy', sort.column);
      params.set('sortDir', sort.direction);
    }

    if (filters) {
      params.set('filters', JSON.stringify(filters));
    }

    const response = await fetch(`/api/products?${params.toString()}`, { signal });
    const json = await response.json();

    return {
      rows: json.rows,
      totalRows: json.totalRows,
    };
  },
  rowId: 'id',
  pagination: {
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  columns: [
    { data: 'id', readOnly: true },
    { data: 'name' },
    { data: 'price', type: 'numeric' },
    { data: 'category' },
  ],
});
```

## GraphQL example (JavaScript)

```js
const hot = new Handsontable(container, {
  dataProvider: async(queryParameters, { signal }) => {
    const query = `
      query Products($page: Int!, $pageSize: Int!, $sort: SortInput, $filters: FilterInput) {
        products(page: $page, pageSize: $pageSize, sort: $sort, filters: $filters) {
          rows { id name price category }
          totalRows
        }
      }
    `;
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        query,
        variables: queryParameters,
      }),
    });
    const json = await response.json();

    return json.data.products;
  },
  rowId: 'id',
  pagination: true,
  columnSorting: true,
  filters: true,
  columns: [
    { data: 'id', readOnly: true },
    { data: 'name' },
    { data: 'price' },
    { data: 'category' },
  ],
});
```

## CRUD callbacks

Use async callbacks for server-side mutations:

```js
const hot = new Handsontable(container, {
  dataProvider,
  rowId: 'id',
  onRowCreate: async(row) => {
    await api.createProduct(row);
  },
  onRowUpdate: async(id, changes, rowData) => {
    await api.updateProduct(id, changes, rowData);
  },
  onRowRemove: async(id) => {
    await api.deleteProduct(id);
  },
});

await hot.createRow({ name: 'New product', price: 0 });
await hot.updateRow(42, { price: 19.99 });
await hot.removeRow(42);
```

Handsontable refreshes server-side data after each successful mutation.

## React example

```jsx
import { HotTable } from '@handsontable/react-wrapper';

<HotTable
  dataProvider={async(queryParameters, options) => fetchProducts(queryParameters, options)}
  rowId="id"
  pagination={{ pageSize: 20, pageSizeOptions: [10, 20, 50] }}
  columnSorting={true}
  filters={true}
  dropdownMenu={true}
  columns={[
    { data: 'id', readOnly: true },
    { data: 'name' },
    { data: 'price' },
    { data: 'category' },
  ]}
/>;
```

## Angular example

```ts
hotSettings = {
  dataProvider: async(queryParameters, options) => {
    return this.productsService.fetch(queryParameters, options.signal);
  },
  rowId: 'id',
  pagination: { pageSize: 20, pageSizeOptions: [10, 20, 50] },
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  columns: [
    { data: 'id', readOnly: true },
    { data: 'name' },
    { data: 'price' },
    { data: 'category' },
  ],
};
```

## Vue 3 example

```vue
<template>
  <HotTable :settings="settings" />
</template>

<script setup>
import { HotTable } from '@handsontable/vue3';

const settings = {
  dataProvider: async(queryParameters, options) => fetchProducts(queryParameters, options),
  rowId: 'id',
  pagination: { pageSize: 20, pageSizeOptions: [10, 20, 50] },
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  columns: [
    { data: 'id', readOnly: true },
    { data: 'name' },
    { data: 'price' },
    { data: 'category' },
  ],
};
</script>
```

## Related API reference

- Options:
  - [`dataProvider`](@/api/options.md#dataprovider)
  - [`dataProviderParams`](@/api/options.md#dataproviderparams)
  - [`rowId`](@/api/options.md#rowid)
  - [`onRowCreate`](@/api/options.md#onrowcreate)
  - [`onRowUpdate`](@/api/options.md#onrowupdate)
  - [`onRowRemove`](@/api/options.md#onrowremove)
- Core methods:
  - [`refreshData()`](@/api/core.md#refreshdata)
  - [`getQueryParameters()`](@/api/core.md#getqueryparameters)
  - [`createRow()`](@/api/core.md#createrow)
  - [`updateRow()`](@/api/core.md#updaterow)
  - [`removeRow()`](@/api/core.md#removerow)
- Hooks:
  - [`beforeDataProviderRequest()`](@/api/hooks.md#beforedataproviderrequest)
  - [`afterDataProviderResponse()`](@/api/hooks.md#afterdataproviderresponse)
  - [`afterDataProviderError()`](@/api/hooks.md#afterdataprovidererror)
  - [`beforeRowMutation()`](@/api/hooks.md#beforerowmutation)
  - [`afterRowMutation()`](@/api/hooks.md#afterrowmutation)
  - [`afterRowMutationError()`](@/api/hooks.md#afterrowmutationerror)
