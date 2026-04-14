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
