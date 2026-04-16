---
type: tutorial
id: m4n7p2q8
title: Server-side data with Laravel
metaTitle: Server-side data with Laravel - JavaScript Data Grid | Handsontable
description: Connect Handsontable's dataProvider plugin to a Laravel backend -- paginated fetchRows, server-side sorting and filtering, and full CRUD with onRowsCreate, onRowsUpdate, and onRowsRemove.
permalink: /recipes/data-management/server-side-laravel
canonicalUrl: /recipes/data-management/server-side-laravel
tags:
  - laravel
  - server-side
  - data-management
  - recipes
  - dataprovider
searchCategory: Recipes
category: Data Management
---

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/server-side-laravel/javascript/example1.js)
@[code](@/content/recipes/data-management/server-side-laravel/javascript/example1.ts)

:::

:::

## Overview

In this tutorial, you will wire Handsontable's [`dataProvider`](@/api/options.md#dataprovider) plugin to a Laravel JSON API. The grid will load paginated rows from the server, sort and filter them with server-side SQL queries, and send create, update, and remove operations back to Laravel.

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Backend:** Laravel 11 (PHP 8.2+)  
**Frontend:** Vanilla JavaScript (or TypeScript)

## What You'll Build

An inventory grid that:

- Fetches one page of products at a time from `GET /api/products`
- Sends `page`, `pageSize`, `sort[prop]`, `sort[order]`, and `filters[]` as query parameters
- Maps those parameters to Eloquent `orderBy()` and `where()` calls
- Inserts blank rows via `POST /api/products`
- Batch-updates changed cells via `PATCH /api/products`
- Deletes rows via `DELETE /api/products`
- Shows a loading overlay while data loads and an error toast when the server returns 4xx/5xx
- Shows a confirmation dialog before any delete

## Before you begin

- PHP 8.2+ and Composer installed
- A Laravel 11 project created (`composer create-project laravel/laravel inventory`)
- A configured database (SQLite works for local development)
- Node.js 22 and Handsontable installed (`npm install handsontable`)

## Step 1 -- Scaffold the backend

Run these Artisan commands in your Laravel project root to generate the required files:

```shell
php artisan make:model Product --migration
php artisan make:controller ProductController --model=Product
php artisan make:seeder ProductSeeder
```

**What each command does:**
- `make:model Product --migration` -- creates `app/Models/Product.php` and a timestamped migration file in `database/migrations/`
- `make:controller ProductController --model=Product` -- creates `app/Http/Controllers/ProductController.php` pre-bound to the `Product` model
- `make:seeder ProductSeeder` -- creates `database/seeders/ProductSeeder.php` for sample data

## Step 2 -- Define the migration

Replace the generated migration's `up()` method with the schema for the `products` table:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/migration.php)
```

**Column choices:**
- `id()` -- auto-increment primary key; this is the value Handsontable uses as `rowId`
- `string('sku')->unique()` -- SKU is generated server-side, so the grid marks this column `readOnly: true`
- `decimal('price', 10, 2)` -- two decimal places; supports `gt`, `lt`, and `between` filter conditions
- `unsignedInteger('stock')` -- non-negative integer; suitable for numeric filters

Run the migration:

```shell
php artisan migrate
```

## Step 3 -- Create the Eloquent model

Open `app/Models/Product.php` and set the `$fillable` and `$casts` properties:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/Product.php)
```

**Why `$casts`?**

Without casting, Eloquent returns all column values as strings. Handsontable's numeric cell type expects JavaScript numbers. Adding `'price' => 'float'` and `'stock' => 'integer'` to `$casts` ensures the JSON response contains `1299.99` and `42`, not `"1299.99"` and `"42"`.

## Step 4 -- Seed the database

Open `database/seeders/ProductSeeder.php` and populate it with at least 50 rows so pagination is visible across multiple pages:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/seeder.php)
```

Run the seeder:

```shell
php artisan db:seed --class=ProductSeeder
```

You now have 52 products spread across six pages at 10 rows per page.

## Step 5 -- Build the ProductController

`ProductController` handles all four HTTP verbs. Each method maps to one Handsontable `dataProvider` callback:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/ProductController.php)
```

### `index()` -- fetch rows

`index()` reads three groups of query parameters sent by Handsontable's `buildUrl()` helper:

| Query parameter | What Handsontable sends | Laravel reads it with |
|---|---|---|
| `page`, `pageSize` | `1`, `10` | `$request->input('page')` |
| `sort[prop]`, `sort[order]` | `'name'`, `'asc'` | `$request->input('sort')` |
| `filters[0][prop]`, `filters[0][condition]`, `filters[0][value]` | `'price'`, `'gt'`, `'100'` | `$request->input('filters')` |

**Why manual skip/take instead of Laravel's `paginate()`?**

Laravel's `paginate(n)` manages its own page number via the `?page=` parameter and returns a `LengthAwarePaginator` object. Handsontable already sends `page` and `pageSize` directly, so it's more straightforward to use `skip()` and `take()` and return a plain `{ data, total }` JSON object that `fetchRows` expects.

**Filter condition mapping:**

The `switch` block in `index()` maps Handsontable condition names (which match the Filters plugin UI labels) to SQL clauses:

| Handsontable condition | SQL equivalent |
|---|---|
| `contains` | `LIKE '%value%'` |
| `begins_with` | `LIKE 'value%'` |
| `gt` | `> value` |
| `between` | `BETWEEN value AND value2` |
| `empty` | `IS NULL OR = ''` |

Text conditions use `LOWER()` / `strtolower()` for case-insensitive matching without a collation dependency.

### `store()` -- create rows

When the user right-clicks and chooses **Insert row above** or **Insert row below**, Handsontable calls `onRowsCreate` with:

```json
{ "position": "above", "referenceRowId": 5, "rowsAmount": 1 }
```

`store()` reads `rowsAmount` and creates that many blank rows. Return HTTP 201 on success.

### `batchUpdate()` -- update changed cells

After a cell edit (or paste, autofill, or clear), Handsontable batches the changes and calls `onRowsUpdate` with:

```json
[{ "id": 4, "changes": { "price": 149.99 }, "rowData": { ... } }]
```

`batchUpdate()` loops over the array, finds each product by `id`, and calls `update()` with only the `changes` object -- never the full row -- to avoid overwriting fields the user did not touch.

### `batchDestroy()` -- delete rows

`onRowsRemove` sends a plain array of row IDs:

```json
[4, 7, 12]
```

`batchDestroy()` passes them to `whereIn()->delete()` in a single query. Return HTTP 204 (no content) on success.

## Step 6 -- Register API routes

Open `routes/api.php` and add the four product routes:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/routes-api.php)
```

All four routes share the same `/api/products` URL -- Laravel matches them by HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).

Verify the routes are registered:

```shell
php artisan route:list --path=api/products
```

## Step 7 -- Configure CORS

Browsers block cross-origin requests unless the server sets the correct headers. Laravel ships with a built-in CORS middleware.

Open `config/cors.php` and allow your frontend origin:

```php
'allowed_origins' => ['http://localhost:5173'], // your Vite dev server
```

Or to allow all origins during development:

```php
'allowed_origins' => ['*'],
```

The CORS middleware is registered automatically via `bootstrap/app.php` in Laravel 11. If you are on Laravel 10, add `\Fruitcake\Cors\HandleCors::class` to the `$middleware` array in `app/Http/Kernel.php`.

## Step 8 -- Build the `buildUrl()` helper

On the frontend, `buildUrl()` serializes the `queryParameters` object that `fetchRows` receives into a URL query string that Laravel can read via `request()->input()`:

```javascript
function buildUrl(base, { page, pageSize, sort, filters }) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (sort) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order);
  }

  if (filters) {
    filters.forEach((filter, i) => {
      params.set(`filters[${i}][prop]`, filter.prop);
      params.set(`filters[${i}][condition]`, filter.condition.name);
      const args = filter.condition.args ?? [];
      // Single-value conditions: contains, gt, eq, …
      if (args[0] != null) params.set(`filters[${i}][value]`, String(args[0]));
      // Range conditions: between, not_between
      if (args[1] != null) params.set(`filters[${i}][value2]`, String(args[1]));
    });
  }

  return `${base}?${params}`;
}
```

**What Handsontable passes in `sort`:**

```javascript
// When the user clicks the "Name" column header to sort ascending:
sort = { prop: 'name', order: 'asc' }

// When no column is sorted:
sort = null
```

**What Handsontable passes in `filters`:**

Each filter in the array matches the Filters plugin condition shape:

```javascript
// "Price > 100" filter applied on the price column:
filters = [
  { prop: 'price', condition: { name: 'gt', args: [100] } }
]

// "Name contains 'laptop'" + "Stock between 10 and 200":
filters = [
  { prop: 'name',  condition: { name: 'contains', args: ['laptop'] } },
  { prop: 'stock', condition: { name: 'between',  args: [10, 200]  } }
]
```

The `buildUrl()` helper flattens `condition.name` into `filters[i][condition]` and `condition.args[0]` / `condition.args[1]` into `filters[i][value]` / `filters[i][value2]`. Laravel's `request()->input('filters')` parses the bracket notation automatically into a PHP array.

## Step 9 -- Handle CSRF tokens

Laravel requires a CSRF token on all state-changing requests (`POST`, `PATCH`, `DELETE`). There are two approaches depending on how your frontend is served.

### Blade-rendered pages

If Handsontable is embedded in a Blade template, inject the token into a `<meta>` tag:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

Then read it in JavaScript before each mutating request:

```javascript
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

// Use it in the request headers:
headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() }
```

### SPA with Laravel Sanctum

For a single-page application that makes API requests from a separate origin, use Sanctum's cookie-based authentication. First, call the CSRF cookie endpoint once when the app boots:

```javascript
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
```

This sets a `XSRF-TOKEN` cookie. Axios reads this cookie automatically. If you use the native `fetch` API, read and forward the token yourself:

```javascript
function sanctumToken() {
  return decodeURIComponent(
    document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
  );
}

// Use it in the request headers:
headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': sanctumToken() }
```

## Step 10 -- Configure Handsontable with `dataProvider`

Replace each `mockXxx()` call in the demo above with a real `fetch()` call. The structure stays the same:

```javascript
dataProvider: {
  // rowId must match the primary key column in your Laravel model.
  // All update and remove callbacks receive this value.
  rowId: 'id',

  // fetchRows is called on every page change, sort, and filter.
  // queryParameters: { page, pageSize, sort, filters }
  // signal: AbortSignal -- pass it to fetch() so stale requests cancel.
  fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
    const url = buildUrl('/api/products', { page, pageSize, sort, filters });
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Laravel returns: { data: [...], total: n }
    const json = await res.json();
    return { rows: json.data, totalRows: json.total };
  },
```

**Why pass `signal` to `fetch()`?**

When the user sorts, filters, or changes pages quickly, Handsontable issues a new request before the previous one finishes. Passing `signal` to `fetch()` lets the browser cancel the stale request. If you omit it, multiple in-flight requests may resolve out of order and display the wrong page.

## Step 11 -- Wire up CRUD callbacks

```javascript
onRowsCreate: async (payload) => {
  // payload: { position: 'above'|'below', referenceRowId, rowsAmount }
  await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
    body: JSON.stringify(payload),
  });
},

onRowsUpdate: async (rows) => {
  // rows: [{ id, changes: { price: 149.99 }, rowData: {...} }, ...]
  await fetch('/api/products', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
    body: JSON.stringify(rows),
  });
},

onRowsRemove: async (rowIds) => {
  // rowIds: [4, 7, 12]
  await fetch('/api/products', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
    body: JSON.stringify(rowIds),
  });
},
```

**Optimistic updates:**

Handsontable applies the cell changes to the grid immediately when `onRowsUpdate` is called (before the server responds). If your Laravel controller returns a 4xx or 5xx response, or if the `fetch()` throws, Handsontable rolls back the optimistic values and fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

## Step 12 -- Enable pagination, sorting, filters, and UI feedback

```javascript
const hot = new Handsontable(container, {
  dataProvider: { /* ... */ },

  // pagination: pageSize controls how many rows fetchRows requests per call.
  pagination: { pageSize: 10 },

  // columnSorting: sends { prop, order } in queryParameters.sort when the user
  // clicks a column header. Keep multiColumnSorting off -- it conflicts with dataProvider.
  columnSorting: true,

  // filters: sends condition objects in queryParameters.filters when the user
  // applies a column filter. The grid resets to page 1 automatically.
  filters: true,

  // dropdownMenu: shows the filter button in each column header.
  dropdownMenu: true,

  // contextMenu: exposes "Insert row above / below" and "Remove row" options.
  contextMenu: true,

  // emptyDataState: shows a loading overlay while fetchRows is running
  // and an empty-state overlay when the server returns zero rows.
  emptyDataState: true,

  // notification: shows an error toast (with a Refetch button for fetch failures)
  // when fetchRows or any CRUD callback rejects.
  notification: true,
});
```

**Why `emptyDataState: true`?**

Without it, the grid shows a blank table during the initial load. With it, a spinner overlay covers the grid while `fetchRows` is in flight, and a friendly empty-state message appears when the filtered result set is empty.

**Why `notification: true`?**

With `notification` enabled, you do not need to add a `try/catch` around your `fetch()` calls for basic error display. Handsontable catches the rejected promise from `fetchRows` or any CRUD callback, shows a translated error toast, and -- for fetch failures -- adds a **Refetch** button that calls `hot.getPlugin('dataProvider').fetchData()` again.

## Step 13 -- Add a delete confirmation with `beforeRowsMutation`

Use the [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation) hook to intercept remove operations before they reach the server:

```javascript
beforeRowsMutation(operation, payload) {
  if (operation === 'remove') {
    const count = payload.rowsRemove.length;
    return window.confirm(
      `Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`
    );
  }
},
```

**What's happening:**

- `operation` is `'create'`, `'update'`, or `'remove'`
- For `'remove'`, `payload.rowsRemove` is the array of row IDs that `onRowsRemove` would receive
- Returning `false` cancels the operation: `onRowsRemove` is not called and no rows are deleted on the server
- Returning `true` (or nothing) allows the operation to proceed

You can use the same hook to require manager approval before large updates, or to log audit events.

## How It Works -- Complete Flow

1. **Initial load** -- `fetchRows` fires with `{ page: 1, pageSize: 10, sort: null, filters: null }`. Laravel returns `{ data: [...10 rows...], total: 52 }`. Handsontable renders the first page and shows a pagination bar.

2. **Sort** -- The user clicks the **Price** column header. `fetchRows` fires with `sort: { prop: 'price', order: 'asc' }`. Laravel applies `orderBy('price', 'asc')` and returns the first page sorted by price.

3. **Filter** -- The user opens the **Category** column dropdown and sets "Category contains Electronics". `fetchRows` fires with `filters: [{ prop: 'category', condition: { name: 'contains', args: ['Electronics'] } }]`. Laravel applies `WHERE LOWER(category) LIKE '%electronics%'`, updates `total`, and returns page 1 of the filtered set.

4. **Edit** -- The user changes a price cell. The new value appears immediately (optimistic update). `onRowsUpdate` fires with `[{ id: 4, changes: { price: 149.99 }, rowData: { ... } }]`. Laravel updates the row. On success, Handsontable silently refetches the current page.

5. **Insert** -- The user right-clicks and selects **Insert row below**. `onRowsCreate` fires with `{ position: 'below', referenceRowId: 4, rowsAmount: 1 }`. Laravel creates a blank row. Handsontable refetches.

6. **Delete** -- The user selects two rows and chooses **Remove rows**. `beforeRowsMutation` fires first and shows a confirm dialog. If the user clicks **OK**, `onRowsRemove` fires with `[4, 7]`. Laravel deletes both rows. Handsontable refetches and may move to the previous page if the current page becomes empty.

7. **Error** -- The server returns 500. `fetchRows` throws. Handsontable shows an error toast with a **Refetch** button. Clicking Refetch replays the last request.

## What you learned

- How to map `fetchRows` `queryParameters` to Laravel `request()->input()` with the `buildUrl()` helper
- How to apply Handsontable filter conditions as Eloquent `where()` clauses
- Why manual `skip()`/`take()` is simpler than Laravel's `paginate()` with `dataProvider`
- How to send CSRF tokens for Blade-rendered pages and SPA Sanctum apps
- How `notification: true` gives you error toasts and a Refetch action with no extra code
- How to cancel delete operations with `beforeRowsMutation`

## Next steps

- [Server-side data overview](@/guides/getting-started/server-side-data/server-side-data.md) -- DataProvider plugin reference
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md) -- all `fetchRows` query fields
- [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md) -- mutation lifecycle and hooks
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md) -- error handling and loading UI
