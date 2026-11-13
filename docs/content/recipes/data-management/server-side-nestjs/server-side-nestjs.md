---
type: how-to
title: Server-side Data with NestJS
metaTitle: Server-side Data with NestJS | Handsontable DataGrid for JavaScript
description: Wire Handsontable DataGrid's dataProvider plugin to a NestJS 10 backend with paginated, sorted, and filtered server-side data and full CRUD operations backed by PostgreSQL via TypeORM.
permalink: /recipes/data-management/server-side-nestjs
canonicalUrl: /recipes/data-management/server-side-nestjs
tags:
  - nestjs
  - server-side
  - data-provider
  - typescript
  - recipes
react:
  metaTitle: Server-side Data with NestJS | Handsontable DataGrid for React
angular:
  metaTitle: Server-side Data with NestJS | Handsontable DataGrid for Angular
vue:
  metaTitle: Server-side Data with NestJS | Handsontable DataGrid for Vue
searchCategory: Recipes
category: Data Management
menuTag: updated
---

This tutorial shows how to wire Handsontable DataGrid's `dataProvider` plugin to a NestJS 10 backend. The backend provides paginated, sorted, and filtered server-side data with full CRUD operations, stored in PostgreSQL via TypeORM.

::: tip Handsontable sponsors NestJS
Handsontable is a proud sponsor of NestJS. You can support the project on [Open Collective](https://opencollective.com/handsontable-javascript-data-grid).
:::

## Overview

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/nestjs" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

This recipe shows how to connect Handsontable's `dataProvider` plugin to a NestJS 10 backend. You will build a support-tickets grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to a PostgreSQL database via TypeORM.

**Difficulty:** Intermediate
**Time:** ~40 minutes
**Stack:** NestJS 10, TypeScript, TypeORM 0.3, PostgreSQL 16, `class-validator`, `class-transformer`, Handsontable `dataProvider`

## What You'll Build

A support-tickets data grid that:
- Fetches paginated rows from a NestJS REST API on every page, sort, or filter change
- Applies filters on the server using TypeORM QueryBuilder predicates -- the browser never loads the full dataset
- Creates, updates, and deletes rows via dedicated endpoints
- Serializes Handsontable's sort and filter objects as bracket-notation query parameters -- decoded in NestJS with `@Query()` and `class-transformer`
- Seeds the database with 12 realistic support tickets via a migration

## Before you begin

- Docker and Docker Compose installed
- Node.js 18 or later and npm installed
- Basic familiarity with NestJS modules, controllers, and services

## Step 1: Start the project

Run the one-command bootstrap script, which starts PostgreSQL, runs TypeORM migrations, seeds 12 sample tickets, starts the NestJS backend, and opens the Vite dev server:

```shell
bash setup.sh
# or: make setup
```

The project uses `class-validator` and `class-transformer` for request validation:

**What's happening:**
- `class-transformer` converts query-string values -- which are always strings -- into the TypeScript types declared in your DTO. For example, `page=2` in the query string becomes the number `2`.
- `class-validator` then validates those typed values against constraints such as `@IsInt()`, `@Min(1)`, and `@IsIn()`, and rejects invalid requests with a `400` response before they reach your service. The same check applies to the JSON bodies of the create, update, and delete requests.

Together these two libraries give you end-to-end type safety from the HTTP request all the way to the TypeScript service method.

## Step 2: Define the data model

Copy `ticket.entity.ts` into `src/tickets/`:

:::example #ts-ticket-entity

@[code ts](@/content/recipes/data-management/server-side-nestjs/server/ticket.entity.ts)

:::

**What's happening:**
- `TicketStatus` and `TicketPriority` are union types that match the `source` arrays in the Handsontable column definitions. Sharing these types between server and client prevents mismatched values.
- `TicketEntity` is a TypeORM entity backed by a PostgreSQL table. The `@Entity('tickets')` decorator maps the class to the `tickets` table. Twelve seed rows are inserted by a migration so pagination and filtering are meaningful from the first load.
- The `id` field is a UUID string generated by PostgreSQL (`gen_random_uuid()`). Handsontable's `dataProvider.rowId` option identifies rows by string, so a UUID id requires no conversion.

## Step 3: Create the fetch DTO

Copy `fetch-tickets.dto.ts` into `src/tickets/dto/`:

:::example #ts-fetch-tickets-dto

@[code ts](@/content/recipes/data-management/server-side-nestjs/server/fetch-tickets.dto.ts)

:::

**What's happening:**

### `@Type(() => Number)` on `page` and `pageSize`

Query-string values arrive as strings. `@Type(() => Number)` tells `class-transformer` to coerce `"2"` to `2` before `@IsInt()` runs. Without this decorator, `@IsInt()` would reject every request because `"2"` is a string, not an integer.

### `@IsIn(ALLOWED_COLUMNS)` on `prop` and `column`

The service interpolates the filter `prop` and the sort `column` into SQL, because a column name can't be passed as a query parameter. `@IsIn(ALLOWED_COLUMNS)` rejects any name outside the list with a `400` response, so a crafted value such as `sort[column]=subject;DROP` never reaches the query builder. `@IsIn(['asc', 'desc'])` does the same for the sort order.

`@IsIn(FILTER_CONDITIONS)` whitelists the condition name the same way. The list holds every condition the grid offers for the recipe's columns, and the service's `switch` statement handles each one. Any other name returns `400`, so the grid rolls the filter back instead of showing unfiltered rows under an active filter.

### `@ValidateNested()` on `sort` and `filters`

`@ValidateNested()` applies the constraints declared on the nested DTO class. Without it, `class-validator` only checks that the outer object has a `sort` field -- it does not inspect `sort.column` or `sort.order`.

### `@Transform(...)` on `filters`

Handsontable sends one filter object per active column. With a single active filter the query string looks like:

```
filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
```

The query parser turns the indexed keys into an array. A request that sends one filter without an index (`filters[prop]=status`) arrives as a single object instead. The `@Transform` decorator wraps a single object in an array, and `@Type(() => FilterConditionDto)` turns each item into a `FilterConditionDto`, so `@ValidateNested()` checks every filter.

### `@IsOptional()` on `FilterConditionDto.value`

A filter condition carries zero, one, or two values depending on the condition type: `empty` and `not_empty` send none, `between` sends two. `@IsOptional()` with a default of `[]` accepts a condition without values, and `@IsArray()` checks the shape when values are present.

## Step 4: Bootstrap with CORS and `ValidationPipe`

Copy `main.ts` into `src/`:

:::example #ts-main

@[code ts](@/content/recipes/data-management/server-side-nestjs/server/main.ts)

:::

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

:::example #ts-tickets-service

@[code ts](@/content/recipes/data-management/server-side-nestjs/server/tickets.service.ts)

:::

**What's happening:**

### Filtering -- condition mapping

Handsontable's Filters plugin sends the condition names that the column's type offers. The text and dropdown columns offer `eq`, `neq`, `contains`, `not_contains`, `begins_with`, `ends_with`, `empty`, and `not_empty`. The `createdAt` column has `type: 'date'`, so it offers `date_before`, `date_before_or_equal`, `date_after`, `date_after_or_equal`, `between`, `date_today`, `date_tomorrow`, and `date_yesterday` as well. The `switch` statement maps each name to a TypeORM QueryBuilder `WHERE` clause:

```typescript
case 'contains':
  qb.andWhere(`LOWER(${col}::text) LIKE LOWER(:${param}) ESCAPE '!'`, { [param]: `%${esc(val)}%` });
  break;
```

All string comparisons use `LOWER()` so filtering is case-insensitive. LIKE metacharacters (`%`, `_`, `!`) in user input are escaped to prevent them from being interpreted as wildcards. Multiple filter conditions are combined with `AND` using repeated `andWhere()` calls.

The date conditions compare `created_at` as text, because a `YYYY-MM-DD` string sorts in date order. The grid's date inputs send `YYYY-MM-DD` values. `toIsoDate()` cuts a full ISO 8601 date-time to its date part, and rejects any other value with `400`. `between` includes both ends. `date_today`, `date_tomorrow`, and `date_yesterday` send no value, so the service compares against the server's local date. The grid's own filter uses the browser's time zone, so the two can differ around midnight.

### Request body DTOs

`CreateTicketDto` and `UpdateTicketDto` are classes with `class-validator` decorators, so the controller can validate every row in a request body. `@IsIn(TICKET_STATUSES)` and `@IsIn(TICKET_PRIORITIES)` reject values outside the dropdown sources, `@MaxLength()` matches the column sizes in the migration, and `@IsUUID()` checks the row `id` of an update. Update fields use `ValidateIf()` instead of `@IsOptional()`: a column left out of the request is skipped, but a `null` value is rejected, because every column is `NOT NULL`. The exception is `subject` and `assignee`: clearing one of those cells with **Delete** sends `null`, so `@Transform()` turns it into an empty string before validation. `@Matches(ISO_DATE)` checks the shape of `createdAt`, and `@IsISO8601({ strict: true })` rejects a date that doesn't exist, such as `2025-02-30`.

### Sorting

Handsontable sends `sort[column]=status&sort[order]=asc` as query params. The DTO maps this to `{ column: 'status', order: 'asc' }`. The service calls `qb.orderBy()` with the column name and uppercased direction. Without a sort param, rows fall back to `createdAt ASC`.

### Pagination

```typescript
const [rows, totalRows] = await qb
  .skip((dto.page - 1) * dto.pageSize)
  .take(dto.pageSize)
  .getManyAndCount();
```

Handsontable sends a 1-based `page` index. Subtracting 1 converts it to a 0-based SQL offset. `getManyAndCount()` runs the data query and a `COUNT(*)` in one round trip. `totalRows` is the count of matching rows *before* pagination -- Handsontable uses this number to render the correct number of pages in the pagination bar.

### ID generation

PostgreSQL generates a UUID for each new row via `DEFAULT gen_random_uuid()`. The service calls `this.repo.save(ticket)`, which runs the `INSERT` and returns the entity with its database-assigned `id`. Batch creates call `this.repo.save()` once per row inside `Promise.all()`, so each row receives a unique UUID regardless of timing.

### `create` must return the created row

After inserting a row the service returns it with its server-assigned `id`. The controller passes this return value back to Handsontable via `onRowsCreate`. Handsontable replaces the temporary client-side ID with the real one. If the response is empty, subsequent edits and deletes on the new row fail because the grid still holds the wrong ID.

## Step 6: Add the controller

Copy `tickets.controller.ts` into `src/tickets/`:

:::example #ts-tickets-controller

@[code ts](@/content/recipes/data-management/server-side-nestjs/server/tickets.controller.ts)

:::

**What's happening:**
- `@Controller('tickets')` sets the base path. All four endpoints share the `/tickets` prefix.
- `@Query() query: FetchTicketsDto` binds the parsed query string to the DTO. The `ValidationPipe` configured in `main.ts` transforms and validates the values before `findAll()` receives them.
- Every mutation body is a JSON array. The global `ValidationPipe` doesn't validate array bodies, so each handler uses `ParseArrayPipe`: `items` names the DTO class to validate each element against, and `whitelist: true` strips undeclared keys. A body that isn't an array, or an element that fails validation, returns `400`.
- `create()` receives an array of new rows, because Handsontable may add one row or several.
- `updateMany()` receives an array of partial row objects -- each includes the row `id` plus only the changed columns. The service calls `repo.update(id, changes)` for each row.
- `removeMany()` receives an array of ID strings, rejects any that isn't a UUID, and returns `204 No Content`. Handsontable only checks for a non-error HTTP status on delete responses.

**Endpoint summary:**

| HTTP method | Path | Handsontable callback |
|---|---|---|
| `GET` | `/tickets` | `fetchRows` |
| `POST` | `/tickets` | `onRowsCreate` |
| `PATCH` | `/tickets` | `onRowsUpdate` |
| `DELETE` | `/tickets` | `onRowsRemove` |

## Step 7: Wire up Handsontable DataGrid

Start the backend and the Vite dev server with `bash setup.sh` (or `make setup`), then open `http://localhost:5173`. The NestJS API runs on `http://localhost:3000`; Vite proxies all `/tickets` requests to it. The complete frontend code is below.

::: only-for javascript

::: example #javascript-nestjs --code-only

@[code js](@/content/recipes/data-management/server-side-nestjs/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-nestjs --code-only

@[code ts](@/content/recipes/data-management/server-side-nestjs/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-nestjs --code-only

@[code](@/content/recipes/data-management/server-side-nestjs/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-nestjs --code-only

@[code](@/content/recipes/data-management/server-side-nestjs/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-nestjs/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

`buildUrl` converts Handsontable's `DataProviderQueryParameters` object into the bracket-notation query string that NestJS parses correctly. Key points:
- Sort uses `sort[column]` mapped from `params.sort.prop` — NestJS's `@Query()` + `class-transformer` parses bracket notation directly into the typed `SortDto`.
- Filters are flattened from `DataProviderFilterColumn[]` (each with `prop` and `conditions: [{name, args}]`) into one indexed entry per condition. This is the opposite of the Django/Laravel approach, which sends a JSON string — NestJS bracket notation maps directly to the `FilterConditionDto[]` via `@Query()`.

### `fetchRows`

Handsontable calls `fetchRows` whenever the user changes the page, sorts a column, or applies a filter. The `AbortSignal` from the second argument is passed to `fetch()`. When the user changes the page before the current request finishes, Handsontable aborts the in-flight request. Without the signal, a slow previous response can arrive after a faster one and overwrite the displayed data.

### `onRowsCreate`

`onRowsCreate` receives `{ rowsAmount }` — the number of rows the user wants to add. The frontend builds an array of default objects (one per row) and sends them to `POST /tickets`. The server inserts each row, PostgreSQL assigns a UUID, and the created rows are returned. Handsontable uses the returned `id` values to replace the temporary client-side IDs -- without this the grid loses track of newly created rows.

### `onRowsUpdate`

`dataProvider` passes each updated row as `{ id, changes }` where `changes` contains only the modified columns. The frontend flattens this into `{ id, ...changes }` before sending to the API. The service finds each row by `id`, calls `repo.update(id, rest)`, and returns the updated entities.

### `onRowsRemove`

Handsontable passes an array of `id` strings matching `dataProvider.rowId`. The controller checks that each one is a UUID and passes them to `ticketsService.removeMany()`.

### `notification: true` and `emptyDataState: true`

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action that calls `fetchRows` again.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows, instead of leaving the grid blank.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows` with `{ page: 1, pageSize: 5 }`.
2. **Frontend builds**: `GET /tickets?page=1&pageSize=5`.
3. **NestJS routes** the request to `TicketsController.findAll` via `FetchTicketsDto`.
4. **Service queries**: runs SQL with `skip(0).take(5).getManyAndCount()` and returns `{ rows: [...5 tickets...], totalRows: 12 }`.
5. **User sorts by priority**: `fetchRows` called with `sort: { prop: 'priority', order: 'asc' }`.
6. **Frontend builds**: `GET /tickets?page=1&pageSize=5&sort[column]=priority&sort[order]=asc`.
7. **Service sorts**: `qb.orderBy('ticket.priority', 'ASC')` adds an `ORDER BY` clause, and the query returns the first page of sorted results.
8. **User filters status = open**: `fetchRows` called with `filters: [{ prop: 'status', operation: 'conjunction', conditions: [{ name: 'eq', args: ['open'] }] }]`.
9. **Frontend builds**: `GET /tickets?...&filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open`.
10. **DTO deserializes**: `class-transformer` maps bracket notation to `FilterConditionDto[]`; the `switch` maps `eq` to a case-insensitive equality predicate.
11. **User edits assignee**: `onRowsUpdate` receives `[{ id: '<uuid>', changes: { assignee: 'Li Wei' } }]` and sends `[{ id: '<uuid>', assignee: 'Li Wei' }]` via `PATCH /tickets`.
12. **Service updates**: `repo.update(id, { assignee: 'Li Wei' })` -- only the changed column is written to the database.

## What you learned

- How to use `class-validator` and `class-transformer` in a NestJS `ValidationPipe` to parse and validate Handsontable's query parameters, and how to whitelist column names before they reach SQL.
- How to validate array request bodies with `ParseArrayPipe` and DTO classes.
- How bracket-notation serialization maps Handsontable's sort and filter objects to NestJS `@Query()` DTOs -- `sort[column]=status` becomes `{ sort: { column: 'status' } }`.
- How to map Handsontable filter condition names (`eq`, `contains`, `begins_with`, etc.) to TypeORM QueryBuilder `WHERE` clauses with case-insensitive `LOWER()` and LIKE-safe escaping.
- How PostgreSQL UUID generation (`gen_random_uuid()`) handles ID assignment for batch creates without requiring an application-level counter.
- Why `onRowsCreate` must return the created rows with server-assigned IDs.
- How `notification: true` provides automatic error toasts with a **Refetch** button for fetch failures.
- How `emptyDataState: true` shows a placeholder when no rows match the active filters.

## Next steps

- Swap PostgreSQL for a different database by updating the TypeORM `DataSource` config and the TypeORM migration file.
- Add authentication -- pass a `Bearer` token in the `fetchRows` fetch headers and protect mutation endpoints with a NestJS `AuthGuard`.
- Share the DTO types between the NestJS backend and the Handsontable frontend in a monorepo using a shared `packages/types` workspace package.
- Compare with the [Spring Boot recipe](@/recipes/data-management/server-side-spring/server-side-spring.md) to see the same Handsontable frontend wired to a Java backend.
- Compare with the [Symfony recipe](@/recipes/data-management/server-side-symfony/server-side-symfony.md) to see the same Handsontable frontend wired to a PHP backend.
- Compare with the [ASP.NET Core recipe](@/recipes/data-management/server-side-aspnet/server-side-aspnet.md) to see the same decorator-and-DI-container pattern implemented with ASP.NET Core MVC controllers and EF Core instead of NestJS and TypeORM.
