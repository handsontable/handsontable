---
type: how-to
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
react:
  id: 1qclffzb
  metaTitle: Server-side data with Laravel - React Data Grid | Handsontable
angular:
  id: v9x1z3b5
  metaTitle: Server-side data with Laravel - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
---

This tutorial shows how to connect Handsontable's `dataProvider` plugin to a Laravel backend. You will build a product inventory grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to a Laravel database.

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/laravel" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Stack:** Laravel 11 (PHP 8.2+), Eloquent ORM, Handsontable `dataProvider`

## What You'll Build

A product inventory data grid that:

- Fetches paginated rows from `GET /api/products` on every page change
- Sorts and filters rows on the server -- the browser never loads the full dataset
- Creates, updates, and deletes rows via `POST`, `PATCH`, and `DELETE` endpoints
- Sends CSRF tokens for Blade-rendered pages or uses Sanctum for SPA auth
- Shows a loading overlay while data loads and an error toast when a request fails

## Before you begin

- Docker and Docker Compose installed
- Node.js 18 or later and npm 9 or later installed

No local PHP or Composer installation is required — the Laravel backend and MySQL 8 database run inside Docker.

## Step 1: Scaffold the backend

Run these Artisan commands in your Laravel project root:

```shell
php artisan make:model Product --migration
php artisan make:controller ProductController --model=Product
php artisan make:seeder ProductSeeder
```

**What's happening:**
- `make:model Product --migration` creates `app/Models/Product.php` and a timestamped migration file in `database/migrations/`.
- `make:controller ProductController --model=Product` creates `ProductController.php` pre-bound to the `Product` model.
- `make:seeder ProductSeeder` creates `database/seeders/ProductSeeder.php` for sample data.

## Step 2: Define the migration

Replace the generated migration's `up()` method with the products schema:

::: example #php-migration

@[code php](@/content/recipes/data-management/server-side-laravel/server/migration.php)

:::

**What's happening:**
- `id()` creates an auto-increment primary key. This is the value Handsontable uses as `rowId`.
- `string('sku')->unique()` is a server-generated field, so the grid marks it `readOnly: true`.
- `decimal('price', 10, 2)` stores two decimal places, matching the `numeric` cell type in the frontend column definition.
- `unsignedInteger('stock')` enforces a non-negative integer at the database level.

Run the migration:

```shell
php artisan migrate
```

## Step 3: Create the Eloquent model

Open `app/Models/Product.php` and set `$fillable` and `$casts`:

::: example #php-product

@[code php](@/content/recipes/data-management/server-side-laravel/server/Product.php)

:::

**What's happening:**
- `$fillable` lists the columns that `Product::create()` and `update()` may write to, protecting the `id` from mass-assignment.
- `$casts` maps `price` to `float` and `stock` to `integer`. Without this, Eloquent returns all values as strings and Handsontable's numeric cell type receives `"1299.99"` instead of `1299.99`.

## Step 4: Seed the database

Open `database/seeders/ProductSeeder.php` and add at least 50 rows so that pagination spans multiple pages:

::: example #php-seeder

@[code php](@/content/recipes/data-management/server-side-laravel/server/seeder.php)

:::

**What's happening:**
- `Product::create($data)` inserts each row through Eloquent so the `$fillable` guard and timestamps apply.
- The 52 rows create six pages at the default `pageSize: 10`, making pagination controls visible from the first load.

Run the seeder:

```shell
php artisan db:seed --class=ProductSeeder
```

## Step 5: Build the ProductController

`ProductController` handles all four HTTP verbs. Each method maps to one Handsontable `dataProvider` callback:

::: example #php-product-controller

@[code php](@/content/recipes/data-management/server-side-laravel/server/ProductController.php)

:::

**What's happening:**

### `index()` -- paginate, sort, and filter

Handsontable sends query parameters through the `buildUrl()` frontend helper:

| Query parameter | Example value | PHP access |
|---|---|---|
| `page`, `pageSize` | `1`, `10` | `$request->input('page')` |
| `sort[prop]`, `sort[order]` | `'name'`, `'asc'` | `$request->input('sort')` |
| `filters[0][prop]`, `filters[0][condition]`, `filters[0][value]` | `'price'`, `'gt'`, `'100'` | `$request->input('filters')` |

The filter loop maps Handsontable condition names to SQL clauses. Text conditions use `LOWER()` for case-insensitive matching:

| Handsontable condition | SQL equivalent |
|---|---|
| `contains` | `LIKE '%value%'` |
| `begins_with` | `LIKE 'value%'` |
| `gt` | `> value` |
| `between` | `BETWEEN value AND value2` |
| `empty` | `IS NULL OR = ''` |

Both `$prop` values (for filters and for sort) are validated against an allowlist of column names before being used in any query, preventing SQL injection through unsanitized user input.

**Why `skip()`/`take()` instead of `paginate()`?**

Laravel's `paginate(n)` manages its own `?page=` parameter and returns a `LengthAwarePaginator` JSON shape. Handsontable already sends `page` and `pageSize` directly, so manual `skip(($page - 1) * $pageSize)->take($pageSize)` returns the `{ data, total }` shape that `fetchRows` expects without any adapter code.

### `store()` -- create rows

When the user inserts rows from the context menu, `onRowsCreate` calls `POST /api/products` with:

```json
{ "position": "above", "referenceRowId": 5, "rowsAmount": 1 }
```

`store()` reads `position`, `referenceRowId`, and `rowsAmount`. It runs a `DB::transaction()` that calls `resolveInsertOrder()` to find the correct `sort_order` value, shifts existing rows to make room, and inserts the new blank rows. It returns the created rows as JSON with HTTP 201 so the frontend can show a success notification with the generated SKU.

### `batchUpdate()` -- update changed cells

After a cell edit, `onRowsUpdate` calls `PATCH /api/products` with:

```json
[{ "id": 4, "changes": { "price": 149.99 }, "rowData": { "..." } }]
```

`batchUpdate()` finds each product by `id` and calls `update()` with only the `changes` object, so unchanged fields are not overwritten.

### `batchDestroy()` -- delete rows

`onRowsRemove` calls `DELETE /api/products` with a plain array of row IDs:

```json
[4, 7, 12]
```

`batchDestroy()` deletes them in one `whereIn()->delete()` query and returns HTTP 204.

## Step 6: Register API routes

Open `routes/api.php` and add the four product routes:

::: example #php-routes-api

@[code php](@/content/recipes/data-management/server-side-laravel/server/routes-api.php)

:::

**What's happening:**
- All four routes share the same `/api/products` path. Laravel matches them by HTTP method.
- The Sanctum middleware group is shown commented out. Uncomment it when you add authentication to your API.

Verify the routes are registered:

```shell
php artisan route:list --path=api/products
```

## Step 7: Set up the Vite dev server

Create a `vite.config.js` at the root of your frontend project and configure a proxy so requests go to Vite (`:5173`) and are forwarded to Laravel without triggering CORS:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

**What's happening:**
- The Vite dev server forwards every `/api/*` request to the Laravel server running on port 8000. Because both the HTML page and the API requests share the same origin (`localhost:5173`), the browser never sees a cross-origin request — no CORS headers are needed on the backend.
- In production, deploy the frontend and backend behind the same reverse proxy (nginx or Apache), or configure CORS headers in `config/cors.php` for your production origin.

## Step 8: Wire up Handsontable

Start the backend and the Vite dev server with `bash setup.sh` (or `make setup`), then open `http://localhost:5173`. The Laravel API runs on `http://localhost:8000` inside Docker; Vite proxies all `/api/*` requests to it. The complete frontend code is in the files below.

::: only-for javascript vue

::: example #javascript-laravel --code-only

@[code js](@/content/recipes/data-management/server-side-laravel/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-laravel --code-only

@[code ts](@/content/recipes/data-management/server-side-laravel/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-laravel --code-only

@[code](@/content/recipes/data-management/server-side-laravel/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-laravel --code-only

@[code](@/content/recipes/data-management/server-side-laravel/angular/example1.ts)

:::

:::

**What's happening:**

### `buildUrl` helper

`buildUrl` serializes the `queryParameters` object that `fetchRows` receives into a URL query string that Laravel reads with `request()->input()`. It converts the Handsontable filter shape -- `{ prop, conditions: [{ name, args }] }` (each filter can carry multiple conditions) -- into the flat bracket-notation parameters Laravel parses automatically.

### `csrfToken` helper

Laravel requires a CSRF token on `POST`, `PATCH`, and `DELETE` requests. For Blade-rendered pages, inject the token via `<meta name="csrf-token" content="{{ csrf_token() }}">` in your layout. For a Sanctum SPA, call `GET /sanctum/csrf-cookie` once on startup and send the `X-XSRF-TOKEN` cookie value instead.

### `fetchRows`

`fetchRows` is called on every page change, sort, and filter. Passing `signal` to `fetch()` lets the browser cancel stale in-flight requests when the user sorts or pages quickly. Throwing on a non-ok response lets `notification: true` display an error toast automatically.

### `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`

`onRowsCreate` **must return** the array of rows created by the server (including server-assigned `id` values). Handsontable uses the returned rows to update its internal row map so that subsequent updates and deletes reference the correct primary keys.

`onRowsCreate` and `onRowsRemove` call `notification.showMessage()` with a `success` variant to confirm the operation to the user.

Cell edits via `onRowsUpdate` appear in the grid immediately (optimistic update). If the server returns a non-2xx response or any callback throws, Handsontable rolls back the values and fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

### `beforeRowsMutation`

`beforeRowsMutation` fires before any create, update, or remove operation. Returning `false` cancels the operation -- `onRowsRemove` is not called and no rows are deleted on the server.

Because `beforeRowsMutation` is synchronous and checks for a strict `=== false` return, you cannot use `window.confirm()` or any async dialog. Instead, use `notification.showMessage()` with `variant: 'warning'` and two action buttons. Cancel the first attempt by returning `false`, then on **Delete** re-issue the remove via `hot.getPlugin('dataProvider').removeRows(rowsRemove)`. The `removeConfirmed` flag lets the second pass through without re-prompting.

### `notification: true` and `emptyDataState: true`

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws, Handsontable shows a translated error message. Fetch failures also add a **Refetch** action that retries the last request.

`emptyDataState: true` shows a loading overlay while `fetchRows` is in flight and an empty-state message when the server returns zero rows.

`contextMenu: true` enables the right-click context menu with "Insert row above / below" and "Remove row" items.

## How It Works -- Complete Flow

1. **Initial load**: `fetchRows` fires with `{ page: 1, pageSize: 10, sort: null, filters: null }`. Laravel returns `{ data: [...10 rows...], total: 52 }`. The grid renders the first page with a pagination bar.
2. **Sort**: The user clicks the **Price** header. `fetchRows` fires with `sort: { prop: 'price', order: 'asc' }`. Laravel applies `orderBy('price', 'asc')` and returns the first page sorted by price.
3. **Filter**: The user opens the **Category** filter and types "Electronics". `fetchRows` fires with the filter condition. Laravel applies `WHERE LOWER(category) LIKE '%electronics%'` and returns the matching rows.
4. **Edit**: The user changes a price cell. The new value appears immediately. `onRowsUpdate` fires with `[{ id: 4, changes: { price: 149.99 } }]`. Laravel updates the row. On success, Handsontable silently refetches the current page.
5. **Insert**: The user right-clicks and selects **Insert row below**. `onRowsCreate` fires with `{ position: 'below', referenceRowId: 4, rowsAmount: 1 }`. Laravel creates a blank row and returns it. Handsontable refetches and shows a "Row added" success notification.
6. **Delete**: The user selects two rows and chooses **Remove rows**. `beforeRowsMutation` intercepts the operation, returns `false`, and shows a warning notification with **Delete** and **Cancel** action buttons. On **Delete**, `onRowsRemove` fires with `[4, 7]`. Laravel deletes both rows and a "Rows deleted" success notification appears.
7. **Error**: The server returns 500. `fetchRows` throws. Handsontable shows an error toast with a **Refetch** button.

## What you learned

- How to map Handsontable's `queryParameters` to Laravel `request()->input()` with the `buildUrl()` helper.
- How to apply Handsontable filter condition names as Eloquent `where()` clauses.
- Why `skip()`/`take()` is simpler than `paginate()` when Handsontable sends `page` and `pageSize` directly.
- How to validate column names against an allowlist before using them in `whereRaw()` and `orderBy()` to prevent SQL injection.
- How to send CSRF tokens for Blade-rendered pages and for SPA Sanctum apps.
- How `notification: true` provides error toasts and a Refetch action with no extra code.
- How `beforeRowsMutation` intercepts operations before they reach the server.

## Next steps

- [Server-side data overview](@/guides/getting-started/server-side-data/server-side-data.md) -- DataProvider plugin reference
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md) -- all `fetchRows` query fields
- [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md) -- mutation lifecycle and hooks
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md) -- error handling and loading UI
- [Server-side data with Spring Boot](@/recipes/data-management/server-side-spring/server-side-spring.md) -- the same Handsontable frontend wired to a Java backend
- [Server-side data with Symfony](@/recipes/data-management/server-side-symfony/server-side-symfony.md) -- the same Handsontable frontend wired to a Symfony backend
