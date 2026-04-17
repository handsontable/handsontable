---
type: tutorial
id: c4d71b8e
title: Server-side Data with Laravel
metaTitle: Server-side Data with Laravel - JavaScript Data Grid | Handsontable
description: Wire Handsontable's dataProvider plugin to a Laravel 11 backend with Eloquent-backed pagination, server-side sorting and filtering, and full CRUD operations using SQLite.
permalink: /recipes/data-management/server-side-laravel
canonicalUrl: /recipes/data-management/server-side-laravel
tags:
  - laravel
  - server-side
  - data-provider
  - php
  - recipes
searchCategory: Recipes
category: Data Management
---

## Overview

This recipe shows how to connect Handsontable's `dataProvider` plugin to a Laravel 11 backend. You will build a support-tickets grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to an Eloquent-managed SQLite database.

**Difficulty:** Intermediate
**Time:** ~40 minutes
**Stack:** Laravel 11, Eloquent ORM, SQLite (zero-config), Handsontable `dataProvider`

## What You'll Build

A support-tickets data grid that:
- Fetches paginated rows from a Laravel REST API on every page, sort, or filter change
- Applies filters on the server using Eloquent's fluent query builder
- Creates, updates, and deletes rows via dedicated endpoints
- Serializes Handsontable's sort and filter objects as JSON query parameters -- decoded in PHP with `json_decode()`
- Seeds the database from a `TicketSeeder` class on first run

## Before you begin

- PHP 8.2 or later and Composer installed
- Basic familiarity with Laravel controllers, Eloquent, and FormRequest validation
- A Handsontable project with the `dataProvider` plugin available

## Step 1: Create the Laravel project

Use the Laravel installer to scaffold a new application with SQLite as the default database:

```shell
composer create-project laravel/laravel tickets-api
cd tickets-api
```

Laravel 11 defaults to SQLite when you accept the defaults during setup. Confirm the `.env` file contains:

```shell
DB_CONNECTION=sqlite
```

Then create the database file Laravel will use:

```shell
touch database/database.sqlite
```

**Why SQLite?**
SQLite requires no server installation and stores everything in a single file. It is ideal for a recipe. To switch to MySQL or PostgreSQL, update `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `.env` and run `php artisan migrate:fresh --seed`.

## Step 2: Create the migration

Copy `2025_01_01_000000_create_tickets_table.php` from `server/` into `database/migrations/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/2025_01_01_000000_create_tickets_table.php)

Run the migration:

```shell
php artisan migrate
```

**What's happening:**
- `Schema::create('tickets', ...)` creates the `tickets` table if it does not exist. The `down()` method drops it on rollback.
- `$table->id()` adds an auto-incrementing `BIGINT` primary key named `id`. This is the value Handsontable references via `dataProvider.rowId: 'id'`.
- `$table->enum('status', [...])` constrains status to a fixed set of values at the database level. Handsontable uses a `dropdown` cell type with the same values on the frontend.
- `$table->date('created_at')` stores a plain date (no time component). The model casts it back to the `Y-m-d` string the frontend expects.

## Step 3: Create the Eloquent model

Copy `Ticket.php` from `server/` into `app/Models/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/Ticket.php)

**What's happening:**
- `$fillable` lists every column that `Ticket::create()` and `$ticket->fill()` may write. Eloquent's mass-assignment protection blocks any column not in this list, preventing the controller from accidentally overwriting columns the client should not control.
- `$casts = ['created_at' => 'date:Y-m-d']` serializes the date column as a plain `"2025-01-15"` string in JSON responses instead of a full timestamp object. This matches the `dateFormat: 'YYYY-MM-DD'` setting in the Handsontable column definition.
- `$timestamps = false` tells Eloquent not to manage `created_at` and `updated_at` automatically. The migration defines `created_at` as a plain `date` column that the seeder and the frontend populate directly.

## Step 4: Seed the database

Copy `TicketSeeder.php` from `server/` into `database/seeders/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/TicketSeeder.php)

Run the seeder:

```shell
php artisan db:seed --class=TicketSeeder
```

**What's happening:**
- `Ticket::count() > 0` guards against running the seeder twice during development. If rows already exist, the method returns early.
- `Ticket::insert([...])` executes a single bulk `INSERT` instead of 12 separate statements. This is significantly faster for large seed datasets.
- The data uses realistic support-ticket subjects, statuses, priorities, and assignee names. This makes pagination and filtering meaningful from the first load.

## Step 5: Add the FormRequest validator

Copy `FetchTicketsRequest.php` from `server/` into `app/Http/Requests/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/FetchTicketsRequest.php)

**What's happening:**
- `FormRequest` runs before the controller method. If `rules()` fails, Laravel automatically returns a 422 response -- no try/catch needed in the controller.
- `'page' => ['required', 'integer', 'min:1']` rejects a missing or non-positive page number with a descriptive error.
- `'sort' => ['nullable', 'string']` and `'filters' => ['nullable', 'string']` accept the JSON-encoded strings sent by the frontend `buildUrl()` helper. Structure validation happens in the controller after `json_decode()`.
- `prepareForValidation()` casts `page` and `pageSize` to integers before the rules run. Query-string values are always PHP strings; without this cast, `min:1` compares `"1"` to `1` using string comparison, which is unreliable.

## Step 6: Build the controller

Copy `TicketController.php` from `server/` into `app/Http/Controllers/Api/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/TicketController.php)

**What's happening:**

### Filter decoding and mapping

```php
$filters = json_decode($request->input('filters'), true) ?? [];

foreach ($filters as $filter) {
    $prop      = $filter['prop'];
    $condition = $filter['condition'];
    $value     = $filter['value'][0] ?? '';

    match ($condition) {
        'eq'       => $query->where($prop, $value),
        'contains' => $query->where($prop, 'LIKE', "%{$value}%"),
        // ...
    };
}
```

Handsontable serializes the active filter conditions as a JSON array and the frontend encodes it as a single query string value. `json_decode(..., true)` converts it back to a PHP array. The `match` expression maps Handsontable's condition names (`eq`, `contains`, `begins_with`, etc.) to the Eloquent equivalent.

### Sort whitelisting

```php
$allowed = ['id', 'subject', 'status', 'priority', 'assignee', 'created_at'];

if (isset($sort['column']) && in_array($sort['column'], $allowed, true)) {
    $query->orderBy($sort['column'], $sort['order'] === 'desc' ? 'desc' : 'asc');
}
```

The `sortProp` value comes from user interaction. Passing it directly to `orderBy()` would allow SQL injection. The `$allowed` whitelist rejects any column name that is not explicitly listed.

### Pagination with `forPage()`

```php
$totalRows = $query->count();
$rows      = $query->forPage($page, $pageSize)->get();
```

Handsontable sends a 1-based `page` index. Laravel's `forPage($page, $pageSize)` method also uses a 1-based index, so no offset adjustment is needed here -- unlike Spring Data, which requires `page - 1`. `count()` runs before `forPage()` to get the total number of matching rows across all pages, which Handsontable uses to render the correct number of page buttons.

### `onRowsCreate` must return the created rows

```php
return response()->json($created, 201);
```

After creating a row, the server assigns a database-generated `id`. The controller returns the created rows so Handsontable can replace its temporary client-side ID with the real one. If the response is empty, subsequent edits and deletes on the new row will fail because the grid still holds the wrong ID.

## Step 7: Register the API routes

Copy `api.php` from `server/` into `routes/`:

@[code php](@/content/recipes/data-management/server-side-laravel/server/api.php)

In Laravel 11 you need to opt into API routing if it was not included when you created the project:

```shell
php artisan install:api
```

**Endpoint summary:**

| HTTP method | Path | Handsontable callback |
|---|---|---|
| `GET` | `/api/tickets` | `fetchRows` |
| `POST` | `/api/tickets` | `onRowsCreate` |
| `PATCH` | `/api/tickets` | `onRowsUpdate` |
| `DELETE` | `/api/tickets` | `onRowsRemove` |

## Step 8: Configure CORS

When the Handsontable frontend runs on a different origin (e.g. `localhost:5173`) from the Laravel API (`localhost:8000`), the browser blocks cross-origin requests. Laravel ships with `fruitcake/laravel-cors` pre-configured. Update `config/cors.php`:

```php
return [
    'paths'               => ['api/*'],
    'allowed_methods'     => ['GET', 'POST', 'PATCH', 'DELETE'],
    'allowed_origins'     => ['http://localhost:5173'], // your frontend origin
    'allowed_headers'     => ['Content-Type', 'Accept'],
    'supports_credentials'=> false,
];
```

**What's happening:**
- `'paths' => ['api/*']` applies CORS headers only to API routes, not to web routes.
- List only the methods your endpoints use. Keeping this list narrow prevents unexpected cross-origin access.
- In production replace `localhost:5173` with the deployed frontend domain.

Start the development server:

```shell
php artisan serve
```

The API is now available at `http://localhost:8000`.

## Step 9: Wire up Handsontable

With the server running, configure Handsontable to use the `dataProvider` plugin. The complete frontend code is below.

::: only-for javascript

@[code js](@/content/recipes/data-management/server-side-laravel/javascript/example1.js)

:::

::: only-for typescript

@[code ts](@/content/recipes/data-management/server-side-laravel/javascript/example1.ts)

:::

**What's happening:**

### `buildUrl` helper

```javascript
function buildUrl(base, params) {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
```

`buildUrl` assembles the query string for `GET /api/tickets`. It skips `undefined` and `null` so that `sort` and `filters` are only appended when they are active. Passing `undefined` to `URLSearchParams.set()` would append the literal string `"undefined"` to the URL.

### Serializing sort and filters as JSON

```javascript
sort:    sort    ? JSON.stringify(sort)    : undefined,
filters: filters ? JSON.stringify(filters) : undefined,
```

Handsontable's sort object is `{ column: 'status', order: 'asc' }` and its filters array is `[{ prop: 'status', condition: 'eq', value: ['open'] }]`. Both are serialized to JSON strings so each travels as a single query parameter. The Laravel controller decodes them with `json_decode($request->input('sort'), true)`.

**Why JSON strings instead of bracket notation?**
PHP's `$_GET` parser handles bracket notation (e.g. `sort[column]=status`) natively, but nested arrays require exact key matching and become verbose for the filter array. Sending a single JSON string keeps the URL construction symmetrical with the PHP decode -- one `JSON.stringify()` on the client, one `json_decode()` on the server.

### TypeScript types from `handsontable/plugins/dataProvider`

```typescript
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
} from 'handsontable/plugins/dataProvider';
```

`DataProviderQueryParameters` describes the `params` argument -- `page`, `pageSize`, `sort`, and `filters`. `DataProviderFetchOptions` describes the second argument, which carries the `AbortSignal`. Importing these gives compile-time checks on the `fetchRows` signature without adding runtime overhead.

### The `AbortSignal` and request cancellation

```javascript
fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
  const res = await fetch(url, { signal });
  ...
}
```

When the user changes the page or applies a filter before the current fetch finishes, Handsontable aborts the previous request. Passing `signal` to `fetch()` causes the browser to cancel the HTTP request. Without it, a slow previous response can arrive after a faster one and overwrite the displayed data.

### `notification: true` and `emptyDataState: true`

```javascript
notification: true,
emptyDataState: true,
```

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws or the server returns a non-2xx status, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows instead of leaving the grid blank.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows` with `{ page: 1, pageSize: 10 }`.
2. **Frontend builds**: `GET /api/tickets?page=1&pageSize=10`.
3. **Laravel routes** the request to `TicketController@index` via `FetchTicketsRequest`.
4. **Service queries**: `SELECT * FROM tickets ORDER BY id LIMIT 10 OFFSET 0`.
5. **Response**: `{ rows: [...10 tickets...], totalRows: 12 }` -- grid renders two pages.
6. **User sorts by priority**: `fetchRows` called with `sort: { column: 'priority', order: 'asc' }`.
7. **Frontend builds**: `GET /api/tickets?page=1&pageSize=10&sort={"column":"priority","order":"asc"}`.
8. **Controller decodes**: `json_decode($request->input('sort'), true)` → `['column' => 'priority', 'order' => 'asc']`.
9. **Whitelist passes**: `'priority'` is in `$allowed`; query adds `ORDER BY priority ASC`.
10. **User filters status = open**: `fetchRows` called with `filters: [{ prop: 'status', condition: 'eq', value: ['open'] }]`.
11. **Controller decodes**: `json_decode(...)` → filter array; `match` maps `eq` to `$query->where('status', 'open')`.
12. **User edits assignee**: `onRowsUpdate([{ id: 3, assignee: 'Li Wei' }])` sent via `PATCH /api/tickets`.
13. **Controller updates**: `$ticket->fill(['assignee' => 'Li Wei'])->save()` -- only the changed column is written.

## What you learned

- How to use `FormRequest` to validate and cast query-string parameters before they reach the controller -- so `page` arrives as an integer, not a string.
- How to serialize Handsontable's sort and filter objects as JSON strings and decode them in PHP with `json_decode()`.
- How to whitelist sort columns to prevent SQL injection via the sort query parameter.
- How to map Handsontable filter condition names (`eq`, `contains`, `begins_with`, etc.) to Eloquent query builder methods.
- Why Laravel's `forPage($page, $pageSize)` uses a 1-based index directly -- no offset arithmetic needed.
- Why `onRowsCreate` must return the created rows with their server-assigned IDs.
- How `notification: true` and `emptyDataState: true` improve the user experience when the server is slow or returns no results.

## Next steps

- Replace SQLite with MySQL or PostgreSQL by updating `.env` and running `php artisan migrate:fresh --seed`.
- Add `Sanctum` or `Passport` authentication: protect mutation endpoints with `auth:sanctum` middleware while keeping the `GET` route public.
- Define stricter validation in `FetchTicketsRequest` and `store()`/`update()` methods to return structured error responses when the user saves invalid data.
- Compare with the [Spring Boot recipe](@/content/recipes/data-management/server-side-spring/server-side-spring.md) to see the same Handsontable frontend wired to a Java backend using the same endpoint shapes.
