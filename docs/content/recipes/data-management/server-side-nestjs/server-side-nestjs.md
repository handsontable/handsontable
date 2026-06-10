---
type: how-to
id: a3f82c91
title: Server-side Data with NestJS
metaTitle: Server-side Data with NestJS - JavaScript Data Grid | Handsontable
description: Wire Handsontable's dataProvider plugin to a NestJS 10 backend with paginated, sorted, and filtered server-side data and full CRUD operations using an in-memory store.
permalink: /recipes/data-management/server-side-nestjs
canonicalUrl: /recipes/data-management/server-side-nestjs
tags:
  - nestjs
  - server-side
  - data-provider
  - typescript
  - recipes
react:
  id: 02t7jojx
  metaTitle: Server-side data with NestJS - React Data Grid | Handsontable
angular:
  id: n3p5r7t9
  metaTitle: Server-side Data with NestJS - Angular Data Grid | Handsontable
vue:
  id: f362z4hr
  metaTitle: Server-side Data with NestJS - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to a NestJS 10 backend. The backend provides paginated, sorted, and filtered server-side data with full CRUD operations using an in-memory store.

::: tip Handsontable sponsors NestJS
Handsontable is a proud sponsor of NestJS. You can support the project on [Open Collective](https://opencollective.com/handsontable-javascript-data-grid).
:::

## Overview

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/nestjs" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

This recipe shows how to connect Handsontable's `dataProvider` plugin to a NestJS 10 backend. You will build a support-tickets grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to an in-memory store.

**Difficulty:** Intermediate
**Time:** ~40 minutes
**Stack:** NestJS 10, TypeScript, `class-validator`, `class-transformer`, Handsontable `dataProvider`

## What You'll Build

A support-tickets data grid that:
- Fetches paginated rows from a NestJS REST API on every page, sort, or filter change
- Applies filters on the server using an in-memory array predicate -- the browser never loads the full dataset
- Creates, updates, and deletes rows via dedicated endpoints
- Serializes Handsontable's sort and filter objects as bracket-notation query parameters -- decoded in NestJS with `@Query()` and `class-transformer`
- Seeds the store with 12 realistic support tickets on startup

## Before you begin

- Node.js 18 or later installed
- NestJS CLI installed: `npm install -g @nestjs/cli`
- Basic familiarity with NestJS modules, controllers, and services
- A Handsontable project with the `dataProvider` plugin available

## Step 1: Scaffold the NestJS project

Create a new NestJS application and install the validation libraries:

```shell
nest new tickets-api --package-manager npm
cd tickets-api
npm install class-validator class-transformer
```

**What's happening:**
- `nest new` scaffolds a complete NestJS project with `AppModule`, `AppController`, and `AppService`. You will replace the default controller and service with a `TicketsController` and `TicketsService`.
- `class-transformer` converts query-string values -- which are always strings -- into the TypeScript types declared in your DTO. For example, `page=2` in the query string becomes the number `2`.
- `class-validator` then validates those typed values against constraints such as `@IsInt()` and `@Min(1)`, and rejects invalid requests with a `400` response before they reach your service.

Together these two libraries give you end-to-end type safety from the HTTP request all the way to the TypeScript service method.

## Step 2: Define the data model

Copy `ticket.entity.ts` into `src/tickets/`:

@[code typescript](@/recipes/data-management/server-side-nestjs/server/ticket.entity.ts)

**What's happening:**
- `TicketStatus` and `TicketPriority` are union types that match the `source` arrays in the Handsontable column definitions. Sharing these types between server and client prevents mismatched values.
- `ticketsStore` is an in-memory array that acts as the database for this recipe. Twelve realistic support-ticket rows make pagination and filtering meaningful from the first load.
- The `id` field is a string rather than a number because Handsontable's `dataProvider.rowId` option tracks rows by string identity. Converting numbers to strings at the database boundary keeps the rest of the code consistent.

**Switching to TypeORM:**
Replace the interface and array with a `@Entity()` class and inject `Repository<TicketEntity>` into the service. The `findAndCount()`, `save()`, and `delete()` calls map directly to the array operations in this recipe.

## Step 3: Create the fetch DTO

Copy `fetch-tickets.dto.ts` into `src/tickets/dto/`:

@[code typescript](@/recipes/data-management/server-side-nestjs/server/fetch-tickets.dto.ts)

**What's happening:**

### `@Type(() => Number)` on `page` and `pageSize`

Query-string values arrive as strings. `@Type(() => Number)` tells `class-transformer` to coerce `"2"` to `2` before `@IsInt()` runs. Without this decorator, `@IsInt()` would reject every request because `"2"` is a string, not an integer.

### `@ValidateNested()` on `sort` and `filters`

`@ValidateNested()` applies the constraints declared on the nested DTO class. Without it, `class-validator` only checks that the outer object has a `sort` field -- it does not inspect `sort.column` or `sort.order`.

### `@Transform(...)` on `filters`

Handsontable sends one filter object per active column. With a single active filter the query string looks like:

```
filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
```

NestJS parses this as `filters = { '0': { prop: 'status', ... } }` when only one filter is present and as an array when multiple filters are present. The `@Transform` decorator normalizes both shapes into a consistent `FilterConditionDto[]`.

### `@IsArray()` on `FilterConditionDto.value`

A filter condition can carry one or two values depending on the condition type (for example, `between` uses two). `@IsArray()` accepts both a single-element and a two-element array from Handsontable.

## Step 4: Bootstrap with CORS and `ValidationPipe`

Copy `main.ts` into `src/`:

@[code typescript](@/recipes/data-management/server-side-nestjs/server/main.ts)

**What's happening:**

### `app.enableCors()`

Without CORS headers, the browser blocks requests from a different origin -- for example, a Vite dev server on `localhost:5173` calling the NestJS API on `localhost:3000`. `enableCors()` with no arguments allows all origins, which is safe for local development. In production, pass your deployed frontend domain:

```typescript
app.enableCors({ origin: 'https://your-app.example.com' });
```

### `ValidationPipe` options

| Option | What it does |
|---|---|
| `transform: true` | Activates `class-transformer` so `@Type()` decorators convert string values to numbers and nested objects |
| `enableImplicitConversion: true` | Also converts primitive types without an explicit `@Type()` decorator -- ensures deeply nested query params are coerced correctly |
| `whitelist: true` | Strips any properties not declared in the DTO, preventing extra data from reaching the service |

### Inline `AppModule`

The recipe declares `AppModule` inline in `main.ts` for brevity. In a real application, move `TicketsController` and `TicketsService` into a dedicated `TicketsModule`:

```typescript
@Module({ controllers: [TicketsController], providers: [TicketsService] })
export class TicketsModule {}

@Module({ imports: [TicketsModule] })
export class AppModule {}
```

## Step 5: Implement the service

Copy `tickets.service.ts` into `src/tickets/`:

@[code typescript](@/recipes/data-management/server-side-nestjs/server/tickets.service.ts)

**What's happening:**

### Filtering -- condition mapping

Handsontable's Filters plugin sends condition names such as `eq`, `neq`, `contains`, `not_contains`, `begins_with`, `ends_with`, `empty`, and `not_empty`. The `switch` statement maps each name to a JavaScript string predicate. With TypeORM, you would map the same names to `WHERE` clauses instead:

```typescript
case 'contains':
  queryBuilder.andWhere(`ticket.${filter.prop} LIKE :val`, { val: `%${filter.value[0]}%` });
  break;
```

### Sorting

Handsontable sends `{ column: 'status', order: 'asc' }` for the active sort. The service reads `column` and `order` from the DTO and calls `localeCompare` for consistent alphabetical ordering. The result is negated for `'desc'`.

### Pagination

```typescript
const start = (dto.page - 1) * dto.pageSize;
return { rows: tickets.slice(start, start + dto.pageSize), totalRows };
```

Handsontable sends a 1-based `page` index. Subtracting 1 converts it to a 0-based offset for `Array.slice()`. `totalRows` is the count of matching rows *before* slicing -- Handsontable uses this number to render the correct number of pages in the pagination bar.

### ID generation with an incrementing counter

```typescript
let nextId = ticketsStore.length + 1;
```

Using an incrementing counter rather than `Date.now()` avoids duplicate IDs when `onRowsCreate` sends a batch of rows. All calls in the batch happen within the same millisecond, so `Date.now()` would return the same value for every row in the batch.

### `create` must return the created row

After inserting a row the service returns it with its server-assigned `id`. The controller passes this return value back to Handsontable via `onRowsCreate`. Handsontable replaces the temporary client-side ID with the real one. If the response is empty, subsequent edits and deletes on the new row fail because the grid still holds the wrong ID.

## Step 6: Add the controller

Copy `tickets.controller.ts` into `src/tickets/`:

@[code typescript](@/recipes/data-management/server-side-nestjs/server/tickets.controller.ts)

**What's happening:**
- `@Controller('tickets')` sets the base path. All four endpoints share the `/tickets` prefix.
- `@Query() query: FetchTicketsDto` binds the parsed query string to the DTO. The `ValidationPipe` configured in `main.ts` transforms and validates the values before `findAll()` receives them.
- `create()` accepts `CreateTicketDto | CreateTicketDto[]` because Handsontable may send one new row or several. Wrapping a single object in an array normalizes the input before the service loop.
- `updateMany()` receives an array of partial row objects -- each includes the row `id` plus only the changed columns. The service finds each row by ID and applies the changes with `Object.assign`.
- `removeMany()` receives an array of ID strings and returns `204 No Content`. Handsontable only checks for a non-error HTTP status on delete responses.

**Endpoint summary:**

| HTTP method | Path | Handsontable callback |
|---|---|---|
| `GET` | `/tickets` | `fetchRows` |
| `POST` | `/tickets` | `onRowsCreate` |
| `PATCH` | `/tickets` | `onRowsUpdate` |
| `DELETE` | `/tickets` | `onRowsRemove` |

## Step 7: Wire up Handsontable

With the server running on `http://localhost:3000`, configure Handsontable to use the `dataProvider` plugin. The complete frontend code is below.

::: only-for javascript

@[code js](@/recipes/data-management/server-side-nestjs/javascript/example1.js)

:::

::: only-for typescript

@[code ts](@/recipes/data-management/server-side-nestjs/javascript/example1.ts)

:::

::: only-for react

@[code](@/content/recipes/data-management/server-side-nestjs/react/example1.jsx)

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/server-side-nestjs/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-nestjs/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

```javascript
function buildUrl(base, params) {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.column);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters?.length) {
    params.filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop);
      query.set(`filters[${i}][condition]`, filter.condition);
      filter.value.forEach((v, j) => query.set(`filters[${i}][value][${j}]`, String(v)));
    });
  }

  return `${base}?${query.toString()}`;
}
```

`buildUrl` converts Handsontable's `DataProviderQueryParameters` object into the bracket-notation query string that NestJS parses correctly. The key difference from the Laravel recipe is the notation style: NestJS expects `sort[column]=status` while Laravel accepts a flat JSON string. The bracket notation maps directly to the nested `SortDto` object via `@Query()` and `class-transformer`.

### `fetchRows`

```javascript
fetchRows: async (params, { signal }) => {
  const url = buildUrl('http://localhost:3000/tickets', params);
  const res = await fetch(url, { signal });

  if (!res.ok) throw new Error(`Server error ${res.status}`);

  return res.json();
},
```

Handsontable calls `fetchRows` whenever the user changes the page, sorts a column, or applies a filter. The `AbortSignal` from the second argument is passed to `fetch()`. When the user changes the page before the current request finishes, Handsontable aborts the in-flight request. Without the signal, a slow previous response can arrive after a faster one and overwrite the displayed data.

### `onRowsCreate`

```javascript
onRowsCreate: async (payload) => {
  const res = await fetch('http://localhost:3000/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json(); // Must return created rows with server-assigned IDs.
},
```

Handsontable passes a `payload` object with the new row data keyed by the column `data` properties. The server creates the row, assigns a string `id`, and returns the created row. Handsontable uses the returned `id` to replace the temporary client-side ID -- without this the grid loses track of the row.

### `onRowsUpdate`

```javascript
onRowsUpdate: async (rows) => {
  await fetch('http://localhost:3000/tickets', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
},
```

Handsontable batches all cell edits from a single user action into one array. Each element is a partial row object that includes the row `id` and only the columns the user changed. The service applies the changes selectively using `Object.assign`.

### `onRowsRemove`

```javascript
onRowsRemove: async (rowIds) => {
  await fetch('http://localhost:3000/tickets', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowIds),
  });
},
```

Handsontable passes an array of `id` strings matching `dataProvider.rowId`. The controller deserializes them as `string[]` and passes them to `ticketsService.removeMany()`.

### `notification: true` and `emptyDataState: true`

```javascript
notification: true,
emptyDataState: true,
```

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action that calls `fetchRows` again.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows, instead of leaving the grid blank.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows` with `{ page: 1, pageSize: 5 }`.
2. **Frontend builds**: `GET /tickets?page=1&pageSize=5`.
3. **NestJS routes** the request to `TicketsController.findAll` via `FetchTicketsDto`.
4. **Service queries**: slices the in-memory store to rows 0--4 and returns `{ rows: [...5 tickets...], totalRows: 12 }`.
5. **User sorts by priority**: `fetchRows` called with `sort: { column: 'priority', order: 'asc' }`.
6. **Frontend builds**: `GET /tickets?page=1&pageSize=5&sort[column]=priority&sort[order]=asc`.
7. **Service sorts** the store using `localeCompare` and returns the first page of sorted results.
8. **User filters status = open**: `fetchRows` called with `filters: [{ prop: 'status', condition: 'eq', value: ['open'] }]`.
9. **Frontend builds**: `GET /tickets?...&filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open`.
10. **DTO deserializes**: `class-transformer` maps bracket notation to `FilterConditionDto[]`; the `switch` maps `eq` to a strict equality predicate.
11. **User edits assignee**: `onRowsUpdate([{ id: '3', assignee: 'Li Wei' }])` sent via `PATCH /tickets`.
12. **Service updates**: `Object.assign(ticketsStore[idx], { assignee: 'Li Wei' })` -- only the changed column is written.

## What you learned

- How to use `class-validator` and `class-transformer` in a NestJS `ValidationPipe` to parse and validate Handsontable's query parameters.
- How bracket-notation serialization maps Handsontable's sort and filter objects to NestJS `@Query()` DTOs -- `sort[column]=status` becomes `{ sort: { column: 'status' } }`.
- How to map Handsontable filter condition names (`eq`, `contains`, `begins_with`, etc.) to array predicates or TypeORM `WHERE` clauses.
- How to use an incrementing counter for ID generation to avoid duplicate IDs in batch creates.
- Why `onRowsCreate` must return the created rows with server-assigned IDs.
- How `notification: true` provides automatic error toasts with a **Refetch** button for fetch failures.
- How `emptyDataState: true` shows a placeholder when no rows match the active filters.

## Next steps

- Replace the in-memory store with TypeORM + SQLite (zero extra config) or PostgreSQL.
- Add authentication -- pass a `Bearer` token in the `fetchRows` fetch headers and protect mutation endpoints with a NestJS `AuthGuard`.
- Share the DTO types between the NestJS backend and the Handsontable frontend in a monorepo using a shared `packages/types` workspace package.
- Compare with the [Spring Boot recipe](@/recipes/data-management/server-side-spring/server-side-spring.md) to see the same Handsontable frontend wired to a Java backend using the same endpoint shapes.
