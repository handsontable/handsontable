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

This guide shows how to wire Handsontable's [`dataProvider`](@/api/options.md#dataprovider) plugin to a Laravel JSON API, covering paginated row loading, server-side sorting and filtering, and full CRUD.

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Backend:** Laravel 11 (PHP 8.2+)

## What You'll Build

A product inventory grid that:

- Loads one page of rows at a time from `GET /api/products`
- Sends sort and filter parameters as query strings Laravel reads natively
- Inserts, updates, and deletes rows through `POST`, `PATCH`, and `DELETE` endpoints
- Shows a loading overlay while data loads and an error toast when the server returns an error
- Confirms before deleting rows

## Prerequisites

```shell
# Create a Laravel project and install Handsontable
composer create-project laravel/laravel inventory
cd inventory
npm install handsontable
```

## Step 1: Scaffold the Backend

Run these Artisan commands to generate the required files:

```shell
php artisan make:model Product --migration
php artisan make:controller ProductController --model=Product
php artisan make:seeder ProductSeeder
```

**What each command does:**
- `make:model Product --migration` -- creates `app/Models/Product.php` and a database migration
- `make:controller ProductController --model=Product` -- creates `ProductController.php` bound to the `Product` model
- `make:seeder ProductSeeder` -- creates a seeder to populate sample rows

## Step 2: Define the Migration

Replace the generated migration's `up()` method with the products schema:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/migration.php)
```

**Column choices:**
- `id()` -- auto-increment primary key; Handsontable uses this as `rowId`
- `string('sku')->unique()` -- generated server-side, so the grid sets this column `readOnly: true`
- `decimal('price', 10, 2)` -- supports `gt`, `lt`, and `between` filter conditions
- `unsignedInteger('stock')` -- non-negative integer; suitable for numeric filters

Run the migration:

```shell
php artisan migrate
```

## Step 3: Create the Eloquent Model

Open `app/Models/Product.php` and set `$fillable` and `$casts`:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/Product.php)
```

**Why `$casts`?**

Without casting, Eloquent returns all column values as strings. Handsontable's numeric cell type expects JavaScript numbers. Adding `'price' => 'float'` and `'stock' => 'integer'` ensures the JSON response contains `1299.99` and `42`, not `"1299.99"` and `"42"`.

## Step 4: Seed the Database

Open `database/seeders/ProductSeeder.php` and add at least 50 rows so pagination is visible across multiple pages:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/seeder.php)
```

Run the seeder:

```shell
php artisan db:seed --class=ProductSeeder
```

## Step 5: Build the ProductController

`ProductController` handles all four HTTP verbs. Each method maps to one Handsontable `dataProvider` callback:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/ProductController.php)
```

### `index()` -- paginate, sort, and filter

`index()` reads three groups of query parameters sent by the `buildUrl()` helper on the frontend:

| Query parameter | Example value | PHP access |
|---|---|---|
| `page`, `pageSize` | `1`, `10` | `$request->input('page')` |
| `sort[prop]`, `sort[order]` | `'name'`, `'asc'` | `$request->input('sort')` |
| `filters[0][prop]`, `filters[0][condition]`, `filters[0][value]` | `'price'`, `'gt'`, `'100'` | `$request->input('filters')` |

**Why `skip()`/`take()` instead of Laravel's `paginate()`?**

Laravel's `paginate(n)` manages its own `?page=` parameter and returns a `LengthAwarePaginator` object with a different JSON shape. Handsontable already sends `page` and `pageSize` directly, so manual `skip(($page - 1) * $pageSize)->take($pageSize)` is more straightforward and returns the `{ data, total }` shape that `fetchRows` expects.

**Filter condition mapping:**

The `switch` block maps Handsontable condition names to SQL clauses:

| Handsontable condition | SQL equivalent |
|---|---|
| `contains` | `LIKE '%value%'` |
| `begins_with` | `LIKE 'value%'` |
| `gt` | `> value` |
| `between` | `BETWEEN value AND value2` |
| `empty` | `IS NULL OR = ''` |

Text conditions use `LOWER()` for case-insensitive matching.

### `store()` -- create rows

When the user inserts rows via the context menu, `onRowsCreate` sends:

```json
{ "position": "above", "referenceRowId": 5, "rowsAmount": 1 }
```

`store()` reads `rowsAmount` and creates that many blank rows. It returns HTTP 201.

### `batchUpdate()` -- update changed cells

After a cell edit, `onRowsUpdate` sends:

```json
[{ "id": 4, "changes": { "price": 149.99 }, "rowData": { "..." } }]
```

`batchUpdate()` finds each product by `id` and calls `update()` with only the `changes` object -- never the full row -- to avoid overwriting fields the user did not touch.

### `batchDestroy()` -- delete rows

`onRowsRemove` sends a plain array of row IDs:

```json
[4, 7, 12]
```

`batchDestroy()` deletes them in a single `whereIn()->delete()` query and returns HTTP 204.

## Step 6: Register API Routes

Open `routes/api.php` and add the four product routes:

```php
@[code](@/content/recipes/data-management/server-side-laravel/server/routes-api.php)
```

All four routes share the same `/api/products` path -- Laravel matches them by HTTP method.

Verify:

```shell
php artisan route:list --path=api/products
```

## Step 7: Configure CORS

Browsers block cross-origin requests unless the server sends the correct headers.

Open `config/cors.php` and allow your frontend origin:

```php
'allowed_origins' => ['http://localhost:5173'], // Vite dev server
```

The CORS middleware registers automatically in Laravel 11. For development, set `'allowed_origins' => ['*']`.

## Step 8: Build the `buildUrl()` Helper

`buildUrl()` serializes the `queryParameters` object that `fetchRows` receives into a URL query string that Laravel reads with `request()->input()`:

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
      if (args[0] != null) params.set(`filters[${i}][value]`, String(args[0]));
      if (args[1] != null) params.set(`filters[${i}][value2]`, String(args[1]));
    });
  }

  return `${base}?${params}`;
}
```

**What `sort` looks like:**

```javascript
// User clicks the Name column header to sort ascending:
sort = { prop: 'name', order: 'asc' }

// No column is sorted:
sort = null
```

**What `filters` looks like:**

```javascript
// "Price > 100" filter:
filters = [{ prop: 'price', condition: { name: 'gt', args: [100] } }]

// "Name contains 'laptop'" and "Stock between 10 and 200":
filters = [
  { prop: 'name',  condition: { name: 'contains', args: ['laptop'] } },
  { prop: 'stock', condition: { name: 'between',  args: [10, 200]  } },
]
```

`buildUrl()` flattens `condition.name` into `filters[i][condition]` and the args into `filters[i][value]` / `filters[i][value2]`. Laravel's bracket notation parsing handles this automatically.

## Step 9: Handle CSRF Tokens

Laravel requires a CSRF token on `POST`, `PATCH`, and `DELETE` requests. There are two approaches depending on how your frontend is served.

### Blade-rendered pages

Inject the token into a `<meta>` tag in your Blade layout:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

Read it in JavaScript:

```javascript
function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}
```

Then pass it in the `X-CSRF-TOKEN` header of every mutating request -- as shown in `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` in the example above.

### SPA with Laravel Sanctum

For a single-page application served from a separate origin, call the CSRF cookie endpoint once when the app starts:

```javascript
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
```

This sets a `XSRF-TOKEN` cookie. Read and forward it in subsequent requests:

```javascript
function sanctumToken() {
  return decodeURIComponent(
    document.cookie.split('; ')
      .find(c => c.startsWith('XSRF-TOKEN='))
      ?.split('=')[1] ?? ''
  );
}

// Use X-XSRF-TOKEN instead of X-CSRF-TOKEN:
headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': sanctumToken() }
```

## Step 10: Configure `fetchRows`

`fetchRows` is called on every page change, sort, and filter. Pass `signal` to `fetch()` so stale requests abort automatically:

```javascript
fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
  const url = buildUrl('/api/products', { page, pageSize, sort, filters });
  const res = await fetch(url, { signal });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Laravel returns: { data: [...], total: n }
  const json = await res.json();

  return { rows: json.data, totalRows: json.total };
},
```

**Why `signal`?**

When the user sorts or changes pages quickly, Handsontable fires a new `fetchRows` before the previous one resolves. Passing `signal` lets the browser cancel the stale in-flight request so the grid always shows the correct page.

**Why throw on non-ok responses?**

With `notification: true`, Handsontable catches the rejected promise and shows a translated error toast automatically. Fetch failures also include a **Refetch** button that retries the last request.

## Step 11: Wire Up CRUD Callbacks

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

Cell changes appear in the grid immediately when `onRowsUpdate` is called. If the server returns a 4xx or 5xx, or the `fetch()` throws, Handsontable rolls back the values and fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

## Step 12: Enable Pagination, Sorting, Filters, and UI Feedback

```javascript
pagination: { pageSize: 10 },  // rows per page — also sent in queryParameters.pageSize
columnSorting: true,           // sends queryParameters.sort on column header click
filters: true,                 // sends queryParameters.filters on filter change
dropdownMenu: true,            // shows the filter button in column headers
contextMenu: true,             // "Insert row above / below" and "Remove row"
emptyDataState: true,          // loading overlay + empty-state overlay
notification: true,            // error toasts with Refetch for fetch failures
```

**`emptyDataState: true`** shows a spinner while `fetchRows` is in flight and a friendly empty-state message when the filtered result is empty.

**`notification: true`** means you do not need a `try/catch` for basic error display. Handsontable catches rejected promises from `fetchRows` and all CRUD callbacks, shows a translated toast, and adds a Refetch button for load failures.

## Step 13: Add a Delete Confirmation with `beforeRowsMutation`

```javascript
beforeRowsMutation(operation, payload) {
  if (operation === 'remove') {
    const count = payload.rowsRemove.length;
    return window.confirm(`Delete ${count} row${count !== 1 ? 's' : ''}? This cannot be undone.`);
  }
},
```

**What's happening:**
- `operation` is `'create'`, `'update'`, or `'remove'`
- For `'remove'`, `payload.rowsRemove` holds the array of IDs that `onRowsRemove` would receive
- Returning `false` cancels the operation -- `onRowsRemove` is not called and no rows are deleted

## How It Works -- Complete Flow

1. **Initial load** -- `fetchRows` fires with `{ page: 1, pageSize: 10, sort: null, filters: null }`. Laravel returns `{ data: [...10 rows...], total: 52 }`. The grid renders the first page with a pagination bar.

2. **Sort** -- The user clicks the **Price** header. `fetchRows` fires with `sort: { prop: 'price', order: 'asc' }`. Laravel applies `orderBy('price', 'asc')` and returns the first page sorted by price.

3. **Filter** -- The user opens the **Category** filter and types "Electronics". `fetchRows` fires with `filters: [{ prop: 'category', condition: { name: 'contains', args: ['Electronics'] } }]`. Laravel applies `WHERE LOWER(category) LIKE '%electronics%'` and returns the filtered result.

4. **Edit** -- The user changes a price cell. The new value appears immediately. `onRowsUpdate` fires with `[{ id: 4, changes: { price: 149.99 } }]`. Laravel updates the row. On success, Handsontable silently refetches the current page.

5. **Insert** -- The user right-clicks and selects **Insert row below**. `onRowsCreate` fires with `{ position: 'below', referenceRowId: 4, rowsAmount: 1 }`. Laravel creates a blank row. Handsontable refetches.

6. **Delete** -- The user selects two rows and chooses **Remove rows**. `beforeRowsMutation` shows a confirm dialog. On confirmation, `onRowsRemove` fires with `[4, 7]`. Laravel deletes both rows. If the current page becomes empty, Handsontable moves to the previous page.

7. **Error** -- The server returns 500. `fetchRows` throws. Handsontable shows an error toast with a **Refetch** button. Clicking Refetch replays the last request.

---

**Congratulations!** You have a fully wired Handsontable grid backed by a Laravel API with pagination, sorting, filtering, CRUD, and error handling.
