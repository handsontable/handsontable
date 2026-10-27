---
type: tutorial
title: Load data from an OData service
metaTitle: Load data from an OData service | Handsontable DataGrid for JavaScript
description: Connect Handsontable DataGrid to an OData V4 service with the dataProvider plugin, and fill an autocomplete cell with values from the same service.
permalink: /recipes/data-management/load-data-odata
canonicalUrl: /recipes/data-management/load-data-odata
tags:
  - recipes
  - data-management
  - odata
  - data-provider
  - autocomplete
react:
  metaTitle: Load data from an OData service | Handsontable DataGrid for React
angular:
  metaTitle: Load data from an OData service | Handsontable DataGrid for Angular
vue:
  metaTitle: Load data from an OData service | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Data Management
menuTag: new
---

In this tutorial, you will connect Handsontable DataGrid to an [OData](https://www.odata.org/) V4 service. You will learn how to turn the grid's page, sort, and filter state into OData query options, and how to fill an autocomplete cell with values from the same service.

The examples call the public, read-only [Northwind](https://services.odata.org/V4/Northwind/Northwind.svc/) demo service. Replace `SERVICE_URL` with the address of your own entity set.

[[toc]]

## Before you begin

- Read the [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) guide to learn how the `dataProvider` plugin works.
- Make sure your OData service accepts requests from your app's origin (CORS).
- If your app sends a `Content-Security-Policy` header, add the service's origin to its `connect-src` directive.

## Step 1: Load pages, sorting, and filters from the service

The [`dataProvider`](@/api/options.md#dataprovider) option calls `fetchRows` whenever the page, the sort order, or the column filters change. `fetchRows` builds an OData URL from those parameters and returns the rows with the total row count.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-odata/javascript/example1.js)
@[code](@/content/recipes/data-management/load-data-odata/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-odata/react/example1.jsx)
@[code](@/content/recipes/data-management/load-data-odata/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-odata/angular/example1.ts)
@[code](@/content/recipes/data-management/load-data-odata/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/recipes/data-management/load-data-odata/vue/example1.vue)

:::

:::

Each query parameter of `fetchRows` maps to one OData query option:

| `fetchRows` parameter | OData query option |
| --- | --- |
| `page`, `pageSize` | `$top=pageSize` and `$skip=(page - 1) * pageSize` |
| `sort` | `$orderby=<column> asc` or `$orderby=<column> desc` |
| `filters` | `$filter=<expression>` |
| (total row count) | `$count=true`, read back from `@odata.count` |

The `toODataFilter()` function builds the `$filter` expression:

- Each column filter becomes one group in parentheses. The groups are joined with `and`.
- Inside a group, the conditions are joined with `and` or `or`, depending on the operator the user picks in the column menu.
- The `CONDITIONS` table maps each condition name to an OData operator or function, for example `begins_with` to `startswith()`.
- Text values are wrapped in single quotes, and any single quote inside a value is doubled. Without that, a value like `Sir Rodney's` breaks the query.
- Text comparisons go through `tolower()`, so they ignore case the same way the Filters plugin does.
- Numeric columns, listed in `NUMERIC_FIELDS`, send unquoted numbers.

OData compares `null` differently from the Filters plugin. **Is empty** matches `null` values only, not empty strings. **Is not equal to** and **Does not contain** leave out rows whose value is `null`. Adjust the matching `CONDITIONS` entries if your data has empty values.

With the `dataProvider` plugin, the column menu offers condition filters only. **Filter by value** is not available, because the grid holds only the current page. See [Sorting and filtering](@/guides/getting-started/server-side-data/server-side-data.md#sorting-and-filtering).

## Step 2: Send changes to a writable service

The `dataProvider` plugin needs all five keys: `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove`. The Northwind service is read-only, so the example passes callbacks that do nothing and sets `readOnly: true`.

For a writable OData service, map each callback to one HTTP request per row:

```javascript
// `fetch()` resolves on HTTP errors, so throw to let the grid roll the change back.
async function send(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
}

const json = { 'Content-Type': 'application/json' };

// In the `dataProvider` option:
onRowsCreate: async ({ rowsAmount }) => {
  const created = [];

  for (let i = 0; i < rowsAmount; i++) {
    const body = JSON.stringify({ ProductName: 'New product' });
    const response = await send(SERVICE_URL, { method: 'POST', headers: json, body });

    created.push(await response.json());
  }

  return created;
},
onRowsUpdate: async (rows) => {
  await Promise.all(rows.map(({ id, changes }) => send(`${SERVICE_URL}(${id})`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify(changes),
  })));
},
onRowsRemove: async (rowIds) => {
  await Promise.all(rowIds.map((id) => send(`${SERVICE_URL}(${id})`, { method: 'DELETE' })));
},
```

The `Products(5)` key syntax fits a numeric key. For a text key, quote it and double any single quote inside it, for example `Customers('ALFKI')`. To send all changes in one request, use your service's `$batch` endpoint. See [Server-side data: CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md) for the payload of each callback.

## Step 3: Fill an autocomplete cell from the service

An [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) cell can ask the service for suggestions while the user types. Pass a function as the [`source`](@/api/options.md#source) option. The function sends the typed text in a `contains()` filter and limits the response with `$top=10`.

The example sets `strict: false`, so the cell accepts any text and no validation request runs. The editor ignores responses to queries the user has already typed past, but it still sends one request per keystroke. For a production service, add a short debounce before the request.

Double-click a cell in the **Product** column and type, for example, `cha`.

::: only-for javascript

::: example #example2 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-odata/javascript/example2.js)
@[code](@/content/recipes/data-management/load-data-odata/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/load-data-odata/react/example2.jsx)
@[code](@/content/recipes/data-management/load-data-odata/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/load-data-odata/angular/example2.ts)
@[code](@/content/recipes/data-management/load-data-odata/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/recipes/data-management/load-data-odata/vue/example2.vue)

:::

:::

## OData V2 services

The examples use OData V4. For an OData V2 service, make these changes:

- Add `$format=json` (or an `Accept: application/json` header), because V2 services return XML by default.
- Replace `$count=true` with `$inlinecount=allpages`, and read the total from `Number(json.d.__count)`, because V2 returns it as a string.
- Read the rows from `json.d.results` instead of `json.value`.
- Replace `contains(field,'text')` with `substringof('text',field)`, and `not contains(...)` with `not substringof(...)`.

## What you learned

- How to map the `fetchRows` page, sort, and filter parameters to `$top`, `$skip`, `$orderby`, and `$filter`.
- How to quote OData text values and keep numeric values unquoted.
- How to read the total row count from `@odata.count`.
- How to keep the `dataProvider` configuration complete for a read-only service.
- How to fill an autocomplete cell from an OData query.

## Next steps

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- [Load data from a REST API](@/recipes/data-management/load-data-rest-api/load-data-rest-api.md)
- [Load data from a GraphQL API](@/recipes/data-management/load-data-graphql/load-data-graphql.md)
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
