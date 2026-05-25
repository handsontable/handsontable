---
type: how-to
id: b5e92d71
title: Server-side Data with Express.js
metaTitle: Server-side Data with Express.js - JavaScript Data Grid | Handsontable
description: Wire Handsontable's dataProvider plugin to an Express.js 4 backend with paginated, sorted, and filtered server-side data and full CRUD operations backed by PostgreSQL via TypeORM and Zod.
permalink: /recipes/data-management/server-side-expressjs
canonicalUrl: /recipes/data-management/server-side-expressjs
tags:
  - expressjs
  - server-side
  - data-provider
  - typescript
  - recipes
react:
  id: 7a3c1f8e
  metaTitle: Server-side data with Express.js - React Data Grid | Handsontable
angular:
  id: 4n6q9v2w
  metaTitle: Server-side Data with Express.js - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to an Express.js 4 backend. The backend provides paginated, sorted, and filtered server-side data with full CRUD operations using PostgreSQL via TypeORM and Zod for request validation.

## Overview

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/express" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

This recipe shows how to connect Handsontable's `dataProvider` plugin to an Express.js 4 backend. You will build a support-tickets grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to a PostgreSQL database via TypeORM.

**Difficulty:** Beginner–Intermediate
**Time:** ~30 minutes
**Stack:** Express.js 4, TypeScript, TypeORM 0.3, PostgreSQL 16, Zod, Handsontable `dataProvider`

## What You'll Build

A support-tickets data grid that:
- Fetches paginated rows from an Express REST API on every page, sort, or filter change
- Applies filters on the server using TypeORM QueryBuilder predicates -- the browser never loads the full dataset
- Creates, updates, and deletes rows via dedicated endpoints
- Serializes Handsontable's sort and filter objects as bracket-notation query parameters -- decoded by Zod's `safeParse` using `z.coerce`
- Seeds the database with 12 realistic support tickets via a TypeORM migration

## Before you begin

- Docker and Docker Compose installed
- Node.js 18 or later and npm installed
- Basic familiarity with Express.js routing and middleware

## Step 1: Start the project

Run the one-command bootstrap script, which starts PostgreSQL, runs TypeORM migrations, seeds 12 sample tickets, starts the Express backend, and opens the Vite dev server:

```shell
bash setup.sh
# or: make setup
```

The project uses Zod for request validation:

**What's happening:**
- `z.coerce.number()` converts query-string values -- which are always strings -- into numbers. For example, `page=2` in the query string becomes the number `2`.
- Zod's `safeParse` validates those coerced values against the schema constraints such as `.int().min(1)`, and returns an error object instead of throwing, so the router can respond with a `400` before the request reaches the service.
- The `z.union([z.array(...), ...]).transform(...)` on `filters` normalises both the single-filter and multi-filter shapes that Express parses from bracket notation into a consistent array.

Together these give you end-to-end type safety from the HTTP request all the way to the TypeScript service method without a DI container or decorator metadata.

## Step 2: Define the data model

Copy `ticket.entity.ts` into `src/`:

:::example #ts-ticket-entity

@[code ts](@/content/recipes/data-management/server-side-expressjs/server/ticket.entity.ts)

:::

**What's happening:**
- `TicketStatus` and `TicketPriority` are union types that match the `source` arrays in the Handsontable column definitions. Sharing these types between server and client prevents mismatched values.
- `TicketEntity` is a TypeORM entity backed by a PostgreSQL table. The `@Entity('tickets')` decorator maps the class to the `tickets` table. Twelve seed rows are inserted by a migration so pagination and filtering are meaningful from the first load.
- The `id` field is a UUID string generated by PostgreSQL (`gen_random_uuid()`). Handsontable's `dataProvider.rowId` option identifies rows by string, so a UUID id requires no conversion.

## Step 3: Define validation types with Zod

Copy `types.ts` into `src/`:

:::example #ts-types

@[code ts](@/content/recipes/data-management/server-side-expressjs/server/types.ts)

:::

**What's happening:**

### `z.coerce.number()` on `page` and `pageSize`

Query-string values arrive as strings. `z.coerce.number()` converts `"2"` to `2` before the `.int().min(1)` constraints run. Without coercion, validation would reject every request because `"2"` is a string, not a number.

### `z.union([z.array(filterSchema), filterSchema]).transform(...)` on `filters`

Handsontable sends one filter object per active column. With a single active filter the query string looks like:

```
filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
```

Express parses this as `filters = { '0': { prop: 'status', ... } }` when only one filter is present and as an array when multiple filters are present. The `z.union` with `.transform` normalizes both shapes into a consistent `FilterConditionDto[]`.

### `ALLOWED_COLUMNS` and `ALLOWED_CONDITIONS` enums

Using `z.enum(ALLOWED_COLUMNS)` on the `prop` field ensures users cannot inject arbitrary column names into the SQL query builder. Any request with an unrecognised column name is rejected with a `400` before reaching the service.

## Step 4: Bootstrap the server

Copy `main.ts` into `src/`:

:::example #ts-main

@[code ts](@/content/recipes/data-management/server-side-expressjs/server/main.ts)

:::

**What's happening:**

### `app.use(cors())`

Without CORS headers, the browser blocks requests from a different origin -- for example, a Vite dev server on `localhost:5173` calling the Express API on `localhost:3000`. `cors()` with no arguments allows all origins, which is safe for local development. In production, pass your deployed frontend domain:

```typescript
app.use(cors({ origin: 'https://your-app.example.com' }));
```

### `app.use(express.json())`

This middleware parses incoming `Content-Type: application/json` request bodies and exposes the result as `req.body`. Without it, `req.body` is `undefined` and the POST, PATCH, and DELETE handlers receive no data.

### `AppDataSource.initialize()`

TypeORM's `DataSource.initialize()` opens the database connection pool and runs any pending migrations before the server starts listening. Starting `app.listen()` inside the `.then()` callback ensures the server only accepts requests after the database is ready.

## Step 5: Implement the service

Copy `tickets.service.ts` into `src/`:

:::example #ts-tickets-service

@[code ts](@/content/recipes/data-management/server-side-expressjs/server/tickets.service.ts)

:::

**What's happening:**

### Filtering -- condition mapping

Handsontable's Filters plugin sends condition names such as `eq`, `neq`, `contains`, `not_contains`, `begins_with`, `ends_with`, `empty`, and `not_empty`. The `switch` statement maps each name to a TypeORM QueryBuilder `WHERE` clause:

```typescript
case 'contains':
  qb.andWhere(`LOWER(${col}::text) LIKE LOWER(:${param}) ESCAPE '!'`, { [param]: `%${esc(val)}%` });
  break;
```

All string comparisons use `LOWER()` so filtering is case-insensitive. LIKE metacharacters (`%`, `_`, `!`) in user input are escaped to prevent them from being interpreted as wildcards. Multiple filter conditions are combined with `AND` using repeated `andWhere()` calls.

### Sorting

Handsontable sends `sort[column]=status&sort[order]=asc` as query params. The Zod schema coerces this into `{ column: 'status', order: 'asc' }`. The service calls `qb.orderBy()` with the column name and uppercased direction. Without a sort param, rows fall back to `createdAt ASC`.

### Pagination

```typescript
const [rows, totalRows] = await qb
  .skip((params.page - 1) * params.pageSize)
  .take(params.pageSize)
  .getManyAndCount();
```

Handsontable sends a 1-based `page` index. Subtracting 1 converts it to a 0-based SQL offset. `getManyAndCount()` runs the data query and a `COUNT(*)` in one round trip. `totalRows` is the count of matching rows *before* pagination -- Handsontable uses this number to render the correct number of pages in the pagination bar.

### ID generation

PostgreSQL generates a UUID for each new row via `DEFAULT gen_random_uuid()`. The service calls `this.repo.save(ticket)`, which runs the `INSERT` and returns the entity with its database-assigned `id`. Batch creates call `service.create()` once per row inside `Promise.all()`, so each row receives a unique UUID regardless of timing.

### `create` must return the created row

After inserting a row the service returns it with its server-assigned `id`. The router passes this return value back to Handsontable via `onRowsCreate`. Handsontable replaces the temporary client-side ID with the real one. If the response is empty, subsequent edits and deletes on the new row fail because the grid still holds the wrong ID.

## Step 6: Add the router

Copy `tickets.router.ts` into `src/`:

:::example #ts-tickets-router

@[code ts](@/content/recipes/data-management/server-side-expressjs/server/tickets.router.ts)

:::

**What's happening:**
- `fetchQuerySchema.safeParse(req.query)` validates and coerces the incoming query parameters. If validation fails, the router responds immediately with `400` and the Zod error details -- the service never runs.
- The `GET` handler passes `parsed.data` directly to `service.findAll()`. Because Zod's `safeParse` returns a typed `ParsedData` object, the service receives correctly typed `page`, `pageSize`, `sort`, and `filters` values.
- The `POST` handler wraps a single object in an array to normalise the input: Handsontable may send one new row or several.
- The `PATCH` handler receives an array of partial row objects -- each includes the row `id` plus only the changed columns.
- The `DELETE` handler receives an array of ID strings and returns `204 No Content`. Handsontable only checks for a non-error HTTP status on delete responses.

**Endpoint summary:**

| HTTP method | Path | Handsontable callback |
|---|---|---|
| `GET` | `/tickets` | `fetchRows` |
| `POST` | `/tickets` | `onRowsCreate` |
| `PATCH` | `/tickets` | `onRowsUpdate` |
| `DELETE` | `/tickets` | `onRowsRemove` |

## Step 7: Wire up Handsontable

Start the backend and the Vite dev server with `bash setup.sh` (or `make setup`), then open `http://localhost:5173`. The Express API runs on `http://localhost:3000`; Vite proxies all `/tickets` requests to it. The complete frontend code is below.

::: only-for javascript vue

::: example #javascript-expressjs --code-only

@[code js](@/content/recipes/data-management/server-side-expressjs/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-expressjs --code-only

@[code ts](@/content/recipes/data-management/server-side-expressjs/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-expressjs --code-only

@[code](@/content/recipes/data-management/server-side-expressjs/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-expressjs --code-only

@[code](@/content/recipes/data-management/server-side-expressjs/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-expressjs/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

`buildUrl` converts Handsontable's `DataProviderQueryParameters` object into the bracket-notation query string that Express parses correctly. Key points:
- Sort uses `sort[column]` mapped from `params.sort.prop` -- Zod's schema coerces the string values to the correct types automatically.
- Filters are flattened from `DataProviderFilterColumn[]` (each with `prop` and `conditions: [{name, args}]`) into one indexed entry per condition. This is the same bracket-notation format used by the NestJS recipe, which means you can swap the backend without changing the frontend `buildUrl` function.

### `fetchRows`

Handsontable calls `fetchRows` whenever the user changes the page, sorts a column, or applies a filter. The `AbortSignal` from the second argument is passed to `fetch()`. When the user changes the page before the current request finishes, Handsontable aborts the in-flight request. Without the signal, a slow previous response can arrive after a faster one and overwrite the displayed data.

### `onRowsCreate`

`onRowsCreate` receives `{ rowsAmount }` -- the number of rows the user wants to add. The frontend builds an array of default objects (one per row) and sends them to `POST /tickets`. The server inserts each row, PostgreSQL assigns a UUID, and the created rows are returned. Handsontable uses the returned `id` values to replace the temporary client-side IDs -- without this the grid loses track of newly created rows.

### `onRowsUpdate`

`dataProvider` passes each updated row as `{ id, changes }` where `changes` contains only the modified columns. The frontend flattens this into `{ id, ...changes }` before sending to the API. The service finds each row by `id`, calls `repo.update(id, rest)`, and returns the updated entities.

### `onRowsRemove`

Handsontable passes an array of `id` strings matching `dataProvider.rowId`. The router receives them as `req.body` (a `string[]`) and passes them to `service.removeMany()`.

### `notification: true` and `emptyDataState: true`

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action that calls `fetchRows` again.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows, instead of leaving the grid blank.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows` with `{ page: 1, pageSize: 5 }`.
2. **Frontend builds**: `GET /tickets?page=1&pageSize=5`.
3. **Express routes** the request to the `GET /tickets` handler; Zod coerces and validates the query params.
4. **Service queries**: runs SQL with `skip(0).take(5).getManyAndCount()` and returns `{ rows: [...5 tickets...], totalRows: 12 }`.
5. **User sorts by priority**: `fetchRows` called with `sort: { column: 'priority', order: 'asc' }`.
6. **Frontend builds**: `GET /tickets?page=1&pageSize=5&sort[column]=priority&sort[order]=asc`.
7. **Service sorts** using `qb.orderBy('ticket.priority', 'ASC')` and returns the first page of sorted results.
8. **User filters status = open**: `fetchRows` called with `filters: [{ prop: 'status', condition: 'eq', value: ['open'] }]`.
9. **Frontend builds**: `GET /tickets?...&filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open`.
10. **Zod coerces**: the bracket-notation params are parsed and validated; the `switch` maps `eq` to a strict equality predicate.
11. **User edits assignee**: `onRowsUpdate([{ id: '3', assignee: 'Li Wei' }])` sent via `PATCH /tickets`.
12. **Service updates**: `repo.update(id, { assignee: 'Li Wei' })` -- only the changed column is written to the database.

## What you learned

- How to use Zod's `safeParse` with `z.coerce` in an Express router to parse and validate Handsontable's bracket-notation query parameters without decorators or a DI container.
- How bracket-notation serialization maps Handsontable's sort and filter objects to plain TypeScript interfaces -- `sort[column]=status` becomes `{ sort: { column: 'status' } }` after Zod coercion.
- How to map Handsontable filter condition names (`eq`, `contains`, `begins_with`, etc.) to TypeORM QueryBuilder `WHERE` clauses with case-insensitive `LOWER()` and LIKE-safe escaping.
- How PostgreSQL UUID generation (`gen_random_uuid()`) handles ID assignment for batch creates without requiring an application-level counter.
- Why `onRowsCreate` must return the created rows with server-assigned IDs.
- How `notification: true` provides automatic error toasts with a **Refetch** button for fetch failures.
- How `emptyDataState: true` shows a placeholder when no rows match the active filters.

## Next steps

- Swap PostgreSQL for a different database by updating the TypeORM `DataSource` config and the migration file.
- Add authentication -- pass a `Bearer` token in the `fetchRows` fetch headers and protect mutation endpoints with an Express middleware that verifies the token.
- Share the Zod schema types between the Express backend and the Handsontable frontend in a monorepo using a shared `packages/types` workspace package.
- Compare with the [NestJS recipe](@/recipes/data-management/server-side-nestjs/server-side-nestjs.md) to see the same pattern implemented with decorators, a DI container, and `class-validator` instead of Zod.
- Compare with the [Symfony recipe](@/recipes/data-management/server-side-symfony/server-side-symfony.md) to see the same Handsontable frontend wired to a PHP backend using the same endpoint shapes.
