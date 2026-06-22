---
type: how-to
id: k3p5q8r2
title: Server-side data with Symfony
metaTitle: Server-side data with Symfony - JavaScript Data Grid | Handsontable
description: Connect Handsontable's dataProvider plugin to a Symfony backend -- paginated fetchRows, server-side sorting and filtering, and full CRUD via REST API or GraphQL.
permalink: /recipes/data-management/server-side-symfony
canonicalUrl: /recipes/data-management/server-side-symfony
tags:
  - symfony
  - server-side
  - data-management
  - recipes
  - dataprovider
react:
  id: 9vzlddaa
  metaTitle: Server-side data with Symfony - React Data Grid | Handsontable
angular:
  id: h7j2m4n6
  metaTitle: Server-side data with Symfony - Angular Data Grid | Handsontable
vue:
  id: nwl1vnb4
  metaTitle: Server-side data with Symfony - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
menuTag: new
---

This tutorial shows how to connect Handsontable's `dataProvider` plugin to a Symfony backend. You will build a product inventory grid that loads data with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to a Symfony/Doctrine database. The recipe covers two API styles: a **REST API** (Steps 1–8) and an optional **GraphQL** variant using `webonyx/graphql-php` (Step 9).

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/symfony" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Stack:** Symfony 7 (PHP 8.2+), Doctrine ORM, Handsontable `dataProvider`

## What You'll Build

A product inventory data grid that:

- Fetches paginated rows from `GET /api/products` on every page change
- Sorts and filters rows on the server -- the browser never loads the full dataset
- Creates, updates, and deletes rows via `POST`, `PATCH`, and `DELETE` endpoints
- Uses a stateless JSON API with no CSRF tokens required
- Shows a loading overlay while data loads and an error toast when a request fails

## Before you begin

- PHP 8.2+ and Composer installed
- A Symfony 7 project created (`composer create-project symfony/skeleton inventory`)
- Doctrine ORM and Doctrine Migrations installed:
  ```shell
  composer require doctrine/orm doctrine/doctrine-bundle doctrine/doctrine-migrations-bundle
  ```
- A configured database (MySQL or PostgreSQL; set `DATABASE_URL` in `.env`)
- Node.js 22 and Handsontable installed (`npm install handsontable`)

## Step 1: Scaffold the backend

Install the required Symfony packages:

```shell
composer require symfony/framework-bundle symfony/routing
```

Create the entity, repository, controller, and seed command:

```shell
php bin/console make:entity Product
php bin/console make:controller ProductController
```

**What's happening:**
- `make:entity Product` generates `src/Entity/Product.php` and `src/Repository/ProductRepository.php`.
- `make:controller ProductController` generates `src/Controller/ProductController.php`.
- Routes are declared as PHP attributes directly on the controller class and methods — there is no separate routes file.

## Step 2: Define the Doctrine migration

Generate a migration from the entity mapping:

```shell
php bin/console doctrine:migrations:generate
```

Replace the generated `up()` body with the products schema:

:::example #php-migration

@[code php](@/content/recipes/data-management/server-side-symfony/server/migration.php)

:::

**What's happening:**
- `id INT AUTO_INCREMENT` is the primary key. This is the value Handsontable uses as `rowId`.
- `sku VARCHAR UNIQUE` is generated server-side, so the grid marks it `readOnly: true`.
- `price DECIMAL(10, 2)` stores two decimal places, matching the `numeric` cell type in the frontend column definition.
- `sort_order INT UNSIGNED` tracks display order independently of the primary key so that row insertions at arbitrary positions work correctly.

Run the migration:

```shell
php bin/console doctrine:migrations:migrate
```

## Step 3: Create the Product entity

Open `src/Entity/Product.php` and define the Doctrine mapping with typed properties:

:::example #php-product

@[code php](@/content/recipes/data-management/server-side-symfony/server/Product.php)

:::

**What's happening:**
- Each column is declared as a PHP 8 typed property with a Doctrine `#[ORM\Column]` attribute. There is no `$fillable` array -- Doctrine tracks persistence via the entity manager, not mass-assignment.
- `price` is mapped as `decimal` and stored as a PHP string by Doctrine to preserve precision. The controller explicitly casts it to `float` when serializing the response, so Handsontable's numeric cell type receives `1299.99` instead of `"1299.99"`.
- `sortOrder` is an extra column that keeps the display order stable when rows are inserted at arbitrary positions using the context menu.

## Step 4: Create the ProductRepository

The `ProductRepository` handles all query logic, keeping the controller thin. Open `src/Repository/ProductRepository.php`:

:::example #php-product-repository

@[code php](@/content/recipes/data-management/server-side-symfony/server/ProductRepository.php)

:::

**What's happening:**

### `findPage()` -- paginate, sort, and filter

`findPage()` builds a Doctrine `QueryBuilder` and applies filters, sorting, and pagination in sequence.

Handsontable sends query parameters through the `buildUrl()` frontend helper:

| Query parameter | Example value | PHP access |
|---|---|---|
| `page`, `pageSize` | `1`, `10` | `$request->query->get('page')` |
| `sort[prop]`, `sort[order]` | `'name'`, `'asc'` | `$request->query->all('sort')` |
| `filters[0][prop]`, `filters[0][condition]`, `filters[0][value]` | `'price'`, `'gt'`, `'100'` | `$request->query->all('filters')` |

The filter loop in `buildFilteredQuery()` maps Handsontable condition names to DQL clauses. Text conditions use `LOWER()` for case-insensitive matching:

| Handsontable condition | DQL equivalent |
|---|---|
| `contains` | `LOWER(p.prop) LIKE '%value%'` |
| `begins_with` | `LOWER(p.prop) LIKE 'value%'` |
| `gt` | `p.prop > :value` |
| `between` | `p.prop BETWEEN :v AND :v2` |
| `not_between` | `p.prop < :v OR p.prop > :v2` |
| `empty` | `p.prop IS NULL OR p.prop = ''` |

Both `$prop` values (for filters and for sort) are validated against `ALLOWED_COLUMNS` before being interpolated into DQL expressions, preventing injection through unsanitized user input.

**Why `setFirstResult()`/`setMaxResults()` instead of a paginator helper?**

Handsontable already sends `page` and `pageSize` directly, so manual offset/limit (`setFirstResult(($page - 1) * $pageSize)->setMaxResults($pageSize)`) returns the `{ data, total }` shape that `fetchRows` expects without any adapter code.

### `createBlankRows()` -- insert rows at position

When the user inserts rows from the context menu, `onRowsCreate` sends:

```json
{ "position": "above", "referenceRowId": 5, "rowsAmount": 1 }
```

`createBlankRows()` calls `resolveInsertOrder()` to find the correct `sortOrder` value for the new row. It then shifts all existing rows at or after that position by `$count` to make room, and inserts the new rows. The entire operation runs inside `wrapInTransaction()`.

### `updateRows()` -- update changed cells

After a cell edit, `onRowsUpdate` calls `PATCH /api/products` with:

```json
[{ "id": 4, "changes": { "price": 149.99 }, "rowData": { "..." } }]
```

`updateRows()` finds each product by `id` and calls the appropriate setter for each key in `changes`, so unchanged fields are not overwritten.

### `deleteByIds()` -- delete rows

`onRowsRemove` calls `DELETE /api/products` with a plain array of row IDs:

```json
[4, 7, 12]
```

`deleteByIds()` deletes them in one `DELETE ... WHERE id IN (...)` DQL query.

## Step 5: Seed the database

Create a Symfony Console command to populate the products table:

:::example #php-seed-products

@[code php](@/content/recipes/data-management/server-side-symfony/server/SeedProductsCommand.php)

:::

**What's happening:**
- The command is registered automatically via the `#[AsCommand]` attribute.
- It checks `count([]) > 0` before inserting, so it is safe to re-run on container restarts.
- The 52 rows create six pages at the default `pageSize: 10`, making pagination controls visible from the first load.

Run the seeder:

```shell
php bin/console app:seed-products
```

## Step 6: Build the ProductController

`ProductController` handles all four HTTP verbs. Routes are declared as PHP attributes on the class and each method:

:::example #php-product-controller

@[code php](@/content/recipes/data-management/server-side-symfony/server/ProductController.php)

:::

**What's happening:**
- `#[Route('/api/products')]` on the class sets the shared base path. Method-level `#[Route('', methods: ['GET'])]` attributes add the HTTP method constraint.
- `index()` delegates all query logic to `ProductRepository::findPage()` and maps the returned entities to plain arrays. The `(float)` cast on `$p->getPrice()` converts Doctrine's decimal string to a PHP float so Handsontable's numeric cell type receives a number, not a string.
- `store()` delegates to `createBlankRows()`, maps the returned entities to plain arrays (including `sort_order`), and returns the created rows as JSON with HTTP 201. The frontend reads this response to display a success notification and manually insert the row into the current page.
- `batchUpdate()` delegates to `updateRows()` and returns HTTP 200.
- `batchDestroy()` delegates to `deleteByIds()` and returns HTTP 204.

Verify the routes are registered:

```shell
php bin/console debug:router | grep products
```

## Step 7: Set up the Vite dev server

Create a `vite.config.js` at the root of your frontend project and configure a proxy so requests go to Vite (`:5173`) and are forwarded to Symfony without triggering CORS:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

**What's happening:**
- The Vite dev server forwards every `/api/*` request to the Symfony server running on port 8000. Because both the HTML page and the API requests share the same origin (`localhost:5173`), the browser never sees a cross-origin request — no CORS headers are needed on the backend.
- In production, deploy the frontend and backend behind the same reverse proxy (nginx or Apache), or configure CORS headers on the Symfony server for your production origin.
- No CSRF token is needed for this stateless JSON API. Symfony's CSRF protection applies to form-based flows, not `Content-Type: application/json` requests from a browser frontend.

## Step 8: Wire up Handsontable

With the Symfony server running (`symfony server:start` or `php -S localhost:8000 -t public/`) and the Vite dev server running (`npm run dev`), open `http://localhost:5173` to see the grid. The complete frontend code is in the files below.

::: only-for javascript

::: example #javascript-symfony --code-only

@[code js](@/content/recipes/data-management/server-side-symfony/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-symfony --code-only

@[code ts](@/content/recipes/data-management/server-side-symfony/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-symfony --code-only

@[code](@/content/recipes/data-management/server-side-symfony/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-symfony --code-only

@[code](@/content/recipes/data-management/server-side-symfony/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-symfony/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

`buildUrl` serializes the `queryParameters` object that `fetchRows` receives into a URL query string that Symfony reads with `$request->query->all()`. It converts the Handsontable filter shape -- `{ prop, conditions: [{ name, args }] }` (each filter can carry multiple conditions) -- into the flat bracket-notation parameters Symfony parses automatically.

### `fetchRows`

`fetchRows` is called on every page change, sort, and filter. Passing `signal` to `fetch()` lets the browser cancel stale in-flight requests when the user sorts or pages quickly. Throwing on a non-ok response lets `notification: true` display an error toast automatically. `totalRows = json.total` saves the current server-side total so `onRowsCreate` can increment it without a refetch.

### `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`

No CSRF token header is required. Symfony's built-in CSRF protection targets HTML form submissions, not JSON API requests.

`onRowsCreate` uses a Symfony-specific pattern instead of a simple return. After the server responds with the new row, the callback: shows a success notification, splices the row into the current page data at the correct position, increments `totalRows`, and fires `afterDataProviderFetch` to update the pagination counter. It then throws `new Error('stop refetch')`, which signals Handsontable to skip the automatic refetch that would normally follow a create. This avoids a second round-trip because the `sortOrder` column ensures the inserted row always appears at a predictable offset on the current page -- a full refetch is unnecessary.

Cell edits via `onRowsUpdate` appear in the grid immediately (optimistic update). If the server returns a non-2xx response or a callback throws for a reason other than `'stop refetch'`, Handsontable rolls back the values and fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

### `beforeRowsMutation`

`beforeRowsMutation` fires before any create, update, or remove operation. Returning `false` cancels the operation -- `onRowsRemove` is not called and no rows are deleted on the server.

Because `beforeRowsMutation` is synchronous and checks for a strict `=== false` return, you cannot use `window.confirm()` or other async dialogs. Instead, cancel the first attempt by returning `false`, show a notification with **Delete** and **Cancel** actions, and on **Delete** re-issue the remove via the DataProvider API. The `removeConfirmed` flag lets the second pass through without re-prompting.

### `notification: true` and `emptyDataState: true`

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws, Handsontable shows a translated error message. Fetch failures also add a **Refetch** action that retries the last request.

`emptyDataState: true` shows a loading overlay while `fetchRows` is in flight and an empty-state message when the server returns zero rows.

`contextMenu: true` enables the right-click context menu with "Insert row above / below" and "Remove row" items.

## Step 9: Alternative — Use a GraphQL API

Instead of the four REST endpoints you can expose the same logic through a single `/graphql` endpoint using [`webonyx/graphql-php`](https://github.com/webonyx/graphql-php).

Install the package:

```shell
composer require webonyx/graphql-php
```

### 9a. Define the schema

Create `src/GraphQL/ProductSchema.php`. This file defines every type, query, and mutation the frontend can call:

:::example #php-product-schema

@[code php](@/content/recipes/data-management/server-side-symfony/server/ProductSchema.php)

:::

**What's happening:**
- `$productType` — the shape of a single product row, returned by both `products.data[]` and `createProducts[]`.
- `$sortInput` / `$filterInput` / `$productUpdateInput` — input types that mirror the shapes Handsontable passes to `fetchRows`, `onRowsCreate`, and `onRowsUpdate`.
- `Query.products` — replaces `GET /api/products`. Accepts `page`, `pageSize`, `sort`, and `filters` and delegates to `ProductRepository::findPage()`.
- `Mutation.createProducts` — replaces `POST /api/products`. Returns the newly created rows so the frontend can show a success notification.
- `Mutation.updateProducts` / `Mutation.deleteProducts` — replace `PATCH` and `DELETE`. Both return a boolean; actual data comes from a subsequent `fetchRows` call.

### 9b. Add the GraphQL controller

Create `src/Controller/GraphQLController.php`:

:::example #php-graphql-controller

@[code php](@/content/recipes/data-management/server-side-symfony/server/GraphQLController.php)

:::

**What's happening:**

The controller handles every GraphQL request in one place. It decodes the request body, builds the schema from `ProductSchema::build()`, executes the query or mutation via `GraphQL::executeQuery()`, and returns the result as JSON. Stack traces are included in the response only when `kernel.debug` is `true`.

### 9c. Wire up the frontend

The frontend replaces the per-endpoint `fetch()` calls with a single `gql()` helper and adds a `mapFilters()` function to convert Handsontable's `conditions` array into the flat `FilterInput` shape the schema expects. The `Handsontable` configuration — columns, plugins, `beforeRowsMutation` — is otherwise identical to the REST example.

::: only-for javascript

::: example #javascript-graphql-symfony --code-only

@[code js](@/content/recipes/data-management/server-side-symfony/javascript/graphql.js)

:::

:::

::: only-for typescript

::: example #typescript-graphql-symfony --code-only

@[code ts](@/content/recipes/data-management/server-side-symfony/javascript/graphql.ts)

:::

:::

**What's happening:**

### `gql()` helper

Every GraphQL request is a `POST` to `/graphql` with a `{ query, variables }` body. The helper throws on both HTTP-level errors and GraphQL-level errors (the `errors` array in the response), so `notification: true` displays an error toast automatically in both cases.

### `mapFilters()` helper

Handsontable sends filters as `[{ prop, conditions: [{ name, args }] }]`. `mapFilters()` flattens each condition into a separate `FilterInput` object matching the `$filterInput` GraphQL type — the same field names that `ProductRepository::findPage()` already reads.

### Operations

| Frontend constant | Type | Replaces |
|---|---|---|
| `FETCH_PRODUCTS` | `query` | `GET /api/products` |
| `CREATE_PRODUCTS` | `mutation` | `POST /api/products` |
| `UPDATE_PRODUCTS` | `mutation` | `PATCH /api/products` |
| `DELETE_PRODUCTS` | `mutation` | `DELETE /api/products` |

`fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` pass their variables directly to `gql()`. No URL building or query-string serialization is needed — variables are sent as a typed JSON object.

## How It Works -- Complete Flow

1. **Initial load**: `fetchRows` fires with `{ page: 1, pageSize: 10, sort: null, filters: null }`. Symfony returns `{ data: [...10 rows...], total: 52 }`. The grid renders the first page with a pagination bar.
2. **Sort**: The user clicks the **Price** header. `fetchRows` fires with `sort: { prop: 'price', order: 'asc' }`. Symfony applies `->orderBy('p.price', 'asc')` and returns the first page sorted by price.
3. **Filter**: The user opens the **Category** filter and types "Electronics". `fetchRows` fires with the filter condition. Symfony applies `LOWER(p.category) LIKE '%electronics%'` and returns the matching rows.
4. **Edit**: The user changes a price cell. The new value appears immediately. `onRowsUpdate` fires with `[{ id: 4, changes: { price: 149.99 } }]`. Symfony updates the row. On success, Handsontable silently refetches the current page.
5. **Insert**: The user right-clicks and selects **Insert row below**. `onRowsCreate` fires with `{ position: 'below', referenceRowId: 4, rowsAmount: 1 }`. Symfony shifts existing rows, inserts a blank row with the correct `sortOrder`, and returns the created row as JSON. The frontend inserts it into the current page data and shows a success notification — no automatic refetch is triggered.
6. **Delete**: The user selects two rows and chooses **Remove rows**. `beforeRowsMutation` intercepts the operation, returns `false`, and shows a warning notification with **Delete** and **Cancel** action buttons. On **Delete**, `onRowsRemove` fires with `[4, 7]`. Symfony deletes both rows.
7. **Error**: The server returns 500. `fetchRows` throws. Handsontable shows an error toast with a **Refetch** button.

## What you learned

- How to map Handsontable's `queryParameters` to Symfony's `$request->query->all()` with the `buildUrl()` helper.
- How to apply Handsontable filter condition names as Doctrine QueryBuilder `andWhere()` clauses.
- Why a separate `ProductRepository` keeps the controller thin and makes the query logic testable in isolation.
- Why `sortOrder` is needed: the primary key reflects insertion order, but rows inserted via the context menu need an independent ordering column to preserve their display position.
- How Doctrine maps `decimal` columns to PHP strings and why the controller must cast them to `float` before serializing the JSON response.
- How to validate column names against `ALLOWED_COLUMNS` before interpolating them into DQL expressions to prevent injection.
- Why no CSRF token is needed for a stateless JSON API and how to avoid CORS entirely by proxying API requests through the Vite dev server.
- How `notification: true` provides error toasts and a Refetch action with no extra code.
- How `beforeRowsMutation` intercepts operations before they reach the server.

## Next steps

- [Server-side data overview](@/guides/getting-started/server-side-data/server-side-data.md) -- DataProvider plugin reference
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md) -- all `fetchRows` query fields
- [Server-side CRUD](@/guides/getting-started/server-side-data/server-side-data-crud.md) -- mutation lifecycle and hooks
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md) -- error handling and loading UI
- [Server-side data with Laravel](@/recipes/data-management/server-side-laravel/server-side-laravel.md) -- the same Handsontable frontend wired to a Laravel backend
