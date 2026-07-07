---
title: Server-side data with ASP.NET Core
metaTitle: Server-side Data with ASP.NET Core - JavaScript Data Grid | Handsontable
description: Connect Handsontable's dataProvider plugin to an ASP.NET Core Web API backend with paginated fetching, server-side sorting and filtering, and full CRUD using EF Core and SQLite.
permalink: /recipes/data-management/server-side-aspnet
canonicalUrl: /recipes/data-management/server-side-aspnet
tags:
  - aspnet
  - asp-net-core
  - dotnet
  - entity-framework
  - server-side
  - data-provider
  - recipe
react:
  metaTitle: Server-side Data with ASP.NET Core - React Data Grid | Handsontable
angular:
  metaTitle: Server-side Data with ASP.NET Core - Angular Data Grid | Handsontable
vue:
  metaTitle: Server-side Data with ASP.NET Core - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
menuTag: new
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to an [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet) Web API backend. The backend handles pagination, sorting, and filtering on the server. The frontend displays results and sends every edit back to the API.

## Overview

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Backend:** .NET 8 SDK, ASP.NET Core MVC controllers, EF Core 8 with SQLite

## What You'll Build

An Order Management grid that:

- Loads orders page by page from an ASP.NET Core API
- Sorts orders by any column on the server
- Filters orders by column value on the server
- Creates, updates, and deletes rows via dedicated collection endpoints
- Uses ASP.NET Core's default camelCase JSON so Handsontable's column keys match the API without extra configuration

## Before you begin

- .NET 8 SDK installed
- Node.js 18 or later and npm installed

No database server is required -- the backend stores data in a local SQLite file.

## Step 1: Create the project and add EF Core

Create a Web API project that uses MVC controllers:

```shell
dotnet new webapi --use-controllers -n OrdersApi
cd OrdersApi
```

Add the EF Core SQLite provider:

```shell
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
```

**Why these choices?**

- `--use-controllers` scaffolds the project with `[ApiController]` MVC controllers instead of Minimal API endpoints. Controllers group the pagination, sorting, filtering, and batch-CRUD logic this recipe needs into one typed class, instead of several `app.MapGet`/`app.MapPost` lambdas in `Program.cs`.
- SQLite requires no separate database server or Docker setup -- the whole backend runs with `dotnet run`. `Microsoft.EntityFrameworkCore.Design` adds the tooling EF Core needs even though this recipe uses `EnsureCreated()` instead of migrations.

## Step 2: Define the `Order` entity and the DbContext

Create `Order.cs`:

::: example #cs-order

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/Order.cs)

:::

Create `AppDbContext.cs`:

::: example #cs-dbcontext

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/AppDbContext.cs)

:::

**What's happening:**

- The primary key `Id` is auto-incremented by SQLite. It becomes the `rowId` value on the Handsontable side.
- SQLite has no native `decimal` column type -- EF Core stores `decimal` properties as `TEXT` by default, which sorts and compares lexicographically instead of numerically. `HasConversion<double>()` on `Total` stores it as a real number instead, so sorting by `total` and filtering with `gt`/`gte`/`lt`/`lte` behave correctly. This conversion is SQLite-specific -- PostgreSQL or SQL Server don't need it.

## Step 3: Seed the database

Create `DbInitializer.cs`:

::: example #cs-dbinitializer

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/DbInitializer.cs)

:::

**What's happening:**

- The seed script inserts 50 orders across realistic statuses (`pending`, `paid`, `shipped`, `delivered`, `cancelled`). It checks whether data already exists, so restarting the app doesn't duplicate rows.
- This recipe calls `Database.EnsureCreated()` in `Program.cs` (Step 4) instead of running EF Core migrations. `EnsureCreated()` creates the schema directly from the model, which is enough for a tutorial. For a production app, use `dotnet ef migrations add` and `Database.Migrate()` instead, so schema changes are versioned.

## Step 4: Wire up `Program.cs`

Replace the generated `Program.cs` with:

::: example #cs-program

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/Program.cs)

:::

**What's happening:**

- `AddDbContext<AppDbContext>` registers the database connection as a scoped service, so each request gets its own `DbContext` instance.
- `AddScoped<OrdersService>` registers the service built in Step 8.
- The `using (var scope = ...)` block runs once at startup, before `app.Run()`, to create the SQLite file and seed it.

The resulting routes, all under `/api/orders`, are:

| Method | URL | Handsontable callback |
|---|---|---|
| `GET` | `/api/orders` | `fetchRows` |
| `POST` | `/api/orders/create_rows` | `onRowsCreate` |
| `PATCH` | `/api/orders/update_rows` | `onRowsUpdate` |
| `DELETE` | `/api/orders/remove_rows` | `onRowsRemove` |

## Step 5: Configure CORS

CORS is registered in `Program.cs` (Step 4). This step explains why.

**What's happening:**

- `AddCors` with `AllowFrontend` permits requests from `http://localhost:5173`, the default Vite dev server port. Without it, the browser blocks every request from the frontend before ASP.NET Core sees it.
- `app.UseCors("AllowFrontend")` is registered before `app.MapControllers()` to follow the general ASP.NET Core middleware order -- CORS runs after routing and before authentication/authorization. This project has neither an explicit `UseRouting` call nor any authentication, so swapping these two specific lines wouldn't break anything here. The convention still matters the moment you add `UseAuthentication`/`UseAuthorization`, because CORS has to run before them so a preflight `OPTIONS` request never gets rejected by an auth check.

**Production note:** Replace `http://localhost:5173` with your deployed frontend's domain. If you need cookies or an `Authorization` header to travel with cross-origin requests, call `AllowCredentials()` on the policy and list explicit origins -- ASP.NET Core throws at startup if you combine `AllowCredentials()` with `AllowAnyOrigin()`.

## Step 6: Decide on the case convention

ASP.NET Core Web API projects serialize JSON with `JsonSerializerDefaults.Web` by default, which camelCases every property: the C# property `OrderNumber` becomes `orderNumber` in the response, and an incoming `{ "orderNumber": "ORD-1001" }` body binds to `OrderNumber` because property-name matching is case-insensitive. This means Handsontable's column `data` keys can use the same camelCase names as the JSON payload with no extra configuration on either side.

**The pitfall:** overriding `JsonSerializerOptions.PropertyNamingPolicy` to `null` -- for example, to match a legacy client that expects PascalCase -- changes every response key at once. If the Handsontable columns still declare `data: 'orderNumber'`, the grid renders empty cells because the server now returns `OrderNumber`.

**Why this matters for the whitelist dictionaries in Step 8:** the sort and filter column whitelists must be keyed by the wire-format name (`orderNumber`), not the C# property name (`OrderNumber`), because that's the string Handsontable actually sends in the query string.

## Step 7: Bind Handsontable's query parameters

Create `OrdersQuery.cs`:

::: example #cs-ordersquery

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/OrdersQuery.cs)

:::

Create `Payloads.cs`:

::: example #cs-payloads

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/Payloads.cs)

:::

**What's happening:**

Backends built on Express, Rails, or PHP typically parse Handsontable's filters from bracket-notation query parameters: `filters[0][prop]=status`. ASP.NET Core's default model binder doesn't understand that bracket syntax for binding a request into a C# object. Instead, it binds nested properties from **dot notation** and collections of complex types from indexed dot notation:

```
?page=1&pageSize=10&sort.prop=total&sort.order=desc&filters[0].prop=status&filters[0].condition=eq&filters[0].value=shipped
```

Given `[FromQuery] OrdersQuery query`, `sort.prop` and `sort.order` populate `query.Sort`, and each `filters[N].*` triple populates one `FilterDto` in `query.Filters` -- all without a custom model binder or per-property `[FromQuery]` attributes. The frontend `buildUrl` function (Step 10) targets this format, which is the only part of this recipe's frontend code that differs from the Express or Rails recipes' `buildUrl`.

`OrderCreateDto` has no `Id` or `CreatedAt` property. Where a dynamically typed backend blocks system-managed fields by filtering a dictionary at runtime, here the type system does it structurally: there's no property for a client to set.

## Step 8: Build the service

Create `OrdersService.cs`:

::: example #cs-ordersservice

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/OrdersService.cs)

:::

### Whitelist sortable and filterable columns

`ColumnMap` maps every wire-format column name Handsontable can send to the matching C# property name. `ApplySort` and `ApplyFilters` both call `ColumnMap.TryGetValue` before touching the query -- an unrecognized column name is silently ignored instead of reaching `EF.Property<T>`. LINQ parameterizes filter *values* automatically, but a column *name* that comes from client input still needs validation before it becomes part of a dynamically built expression.

### Sort helper

`ApplySort` reads `query.Sort?.Prop`. If it's missing or not in `ColumnMap`, the query falls back to `CreatedAt DESC`. Otherwise it calls `EF.Property<object>(o, property)` inside `OrderBy`/`OrderByDescending` so the property to sort by is chosen at runtime, from a name that already passed the whitelist check.

### Filter helper

`ApplyFilters` loops over `query.Filters` and dispatches each one to `ApplyStringFilter`, `ApplyDateFilter`, or `ApplyNumericFilter`, based on whether the column is in `StringColumns`, `DateColumns`, or neither. This three-way split matters because EF Core is strongly typed: calling `EF.Property<decimal>` against a `DateTime` column throws, so each column's filter values must be parsed and compared as the type that column actually is.

- String columns (`orderNumber`, `customer`, `status`) support `eq`, `neq`, `contains`, `not_contains`, `begins_with`, `ends_with`, `empty`, and `not_empty`. `contains`/`begins_with`/`ends_with` use `EF.Functions.Like` with an explicit `ESCAPE '\'` clause, and `EscapeLike` escapes `%`, `_`, and `\` in the user-supplied value first, so those characters are matched literally instead of acting as LIKE wildcards.
- The date column (`createdAt`) supports `eq`, `neq`, `gt`, `gte`, `lt`, and `lte`. `DateTime.TryParse` -- with `CultureInfo.InvariantCulture` explicitly, so the parse doesn't depend on the server's OS culture -- guards against malformed date input. `eq`/`neq` compare `.Date` on both sides so a filter value of a single day matches every `CreatedAt` timestamp on that day, not just an exact-to-the-second match.
- The numeric column (`total`) supports `eq`, `neq`, `gt`, `gte`, `lt`, and `lte`. `empty`/`not_empty` are rejected for both `total` and `createdAt` because they're non-nullable columns -- there's no empty state to check. `decimal.TryParse` -- also pinned to `CultureInfo.InvariantCulture` -- guards against malformed numeric input; a value that doesn't parse is ignored rather than throwing a `500`. Without the invariant culture, a value like `142.5` fails to parse on a server whose default culture uses a comma as the decimal separator, and the filter would silently no-op.
- Handsontable's Filters plugin offers more conditions than this whitelist covers -- for example, `between`/`not_between` on `total`, and date-specific conditions like `date_before`/`date_after` on `createdAt`. Selecting one of those in the UI produces a filter the server doesn't recognize, so it's ignored and the grid shows unfiltered results. Extending `ApplyNumericFilter`/`ApplyDateFilter` with more `case` arms is a natural next step; this recipe sticks to the condition set the other server-side recipes support.
- Multiple filters combine with `AND`, because each call reassigns `query` to a further-restricted `IQueryable`. `dataProvider` doesn't send `OR` groups by default.

### Pagination

`GetOrdersAsync` runs `CountAsync()` on the filtered-but-unsorted query to get `totalRows`, then applies sorting and `Skip`/`Take` for the current page. Handsontable sends a 1-based `page` index, so `Skip` uses `(page - 1) * pageSize`. `pageSize` is clamped to `MaxPageSize` (100) with `Math.Clamp`, so a client can't force the server to materialize the entire table in one request.

### Batch CRUD

- `CreateRowsAsync` builds new `Order` entities from `OrderCreateDto`, inserts them inside a transaction, and returns them with their database-assigned `Id`. `dataProvider` uses the returned rows to replace its client-side placeholder IDs.
- `UpdateRowsAsync` loads each order by `Id` and applies only the keys present in `EditableColumns` from the `Changes` dictionary -- `id` and `createdAt` are never in that set, so they can't be overwritten even if a client sends them. The `total` case also checks `element.ValueKind == JsonValueKind.Number` before calling `GetDecimal()` -- a cleared cell sends JSON `null`, and `GetDecimal()` throws on anything that isn't a JSON number.
- `RemoveRowsAsync` calls EF Core's `ExecuteDeleteAsync()`, which issues a single `DELETE FROM Orders WHERE Id IN (...)` instead of loading and deleting each row individually.

## Step 9: Create the controller

Create `OrdersController.cs`:

::: example #cs-orderscontroller

@[code csharp](@/content/recipes/data-management/server-side-aspnet/server/OrdersController.cs)

:::

This thin controller has no business logic of its own -- every method delegates to `OrdersService` and maps the result to an HTTP response: `201 Created` for new rows, `200 OK` with the updated rows for edits, and `204 No Content` for deletes.

**Antiforgery in API projects:** `dotnet new webapi --use-controllers` scaffolds a project with no antiforgery validation enabled by default -- `AddAntiforgery` and `[ValidateAntiForgeryToken]` are opt-in, and only matter when the app uses cookie-based authentication. A `fetch()` call from the browser using an `Authorization` header (or no authentication at all, as in this recipe) never needs an antiforgery token, because the browser doesn't attach that header automatically the way it attaches cookies.

## Step 10: Build the request URL and initialize Handsontable

Run the backend:

```shell
dotnet run --urls http://localhost:5000
```

Pinning the URL keeps the port stable -- otherwise the template's `launchSettings.json` can assign a random port on each machine, and the frontend's hardcoded API address (below) would need to change to match. Then start your frontend dev server (for example, `npm run dev` with Vite) and open it in the browser. The complete frontend code is in the files below.

::: only-for javascript vue

::: example #javascript-aspnet --code-only

@[code js](@/content/recipes/data-management/server-side-aspnet/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-aspnet --code-only

@[code ts](@/content/recipes/data-management/server-side-aspnet/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-aspnet --code-only

@[code](@/content/recipes/data-management/server-side-aspnet/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-aspnet --code-only

@[code](@/content/recipes/data-management/server-side-aspnet/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-aspnet/angular/example1.html)

:::

:::

**Key options explained:**

| Option | What it does |
|---|---|
| `rowId: 'id'` | Tells `dataProvider` which field uniquely identifies a row. Must match the entity's primary key property, serialized to camelCase (`id`). |
| `{ signal }` in `fetchRows` | Pass the `AbortSignal` to `fetch()` so in-flight requests are canceled when the user sorts or filters before the previous response arrives. |
| `{ rowsAmount }` in `onRowsCreate` | `dataProvider` passes the number of rows to add. The frontend builds default objects and sends them as `{ rows: [...] }`. Returning `json.rows` lets `dataProvider` replace client-side placeholder IDs with the ones assigned by SQLite. |
| `beforeRowsMutation` | Intercepts mutations before they run. Return `false` to cancel. Used here to show a delete-confirmation notification with **Delete**/**Cancel** actions instead of deleting immediately. |
| `pagination: { pageSize: 10 }` | Enables the pagination toolbar. `dataProvider` passes the current page and size to `fetchRows` automatically. |
| `columnSorting: true` | Enables column header click-to-sort. The sort state is passed to `fetchRows`. |
| `filters: true` with `dropdownMenu` | Renders the column filter UI. Active conditions are passed to `fetchRows`. |
| `contextMenu: true` | Enables right-click context menu with **Insert row above / below** and **Remove row** options. |
| `emptyDataState: true` | Shows a friendly illustration when the API returns zero rows (for example, when a filter matches nothing). |
| `notification: true` | Shows automatic error toasts when `fetchRows` or a mutation callback throws. Fetch failures include a **Refetch** action. The delete-confirmation prompt in `beforeRowsMutation` is also built on `notification`'s actionable toasts, not a separate dialog. |

## How It Works -- Complete Flow

1. **Initial load**: `dataProvider` calls `fetchRows({ page: 1, pageSize: 10 })`. ASP.NET Core returns the first 10 orders and the total row count.
2. **User clicks a column header**: `columnSorting` updates its sort state and `dataProvider` calls `fetchRows` again with `sort: { prop: 'total', order: 'desc' }`. The frontend builds `sort.prop=total&sort.order=desc`; the controller's `OrdersQuery.Sort` binds it, and `ApplySort` checks `ColumnMap` before calling `OrderByDescending`.
3. **User applies a column filter**: `Filters` updates its condition list and `dataProvider` calls `fetchRows` with the `filters` array. The frontend serializes each condition as `filters[N].prop/condition/value`; the model binder populates `OrdersQuery.Filters`, and `ApplyFilters` chains `.Where` calls.
4. **User navigates to page 2**: `dataProvider` calls `fetchRows({ page: 2, pageSize: 10, ... })`. `Skip(10).Take(10)` returns rows 11-20.
5. **User edits a cell**: `dataProvider` calls `onRowsUpdate` with `[{ id: 7, changes: { total: 142.5 } }]`. The frontend sends `{ rows: [{ id: 7, changes: { total: 142.5 } }] }`. `UpdateRowsAsync` applies only the `total` key inside a transaction.
6. **User adds a row**: `dataProvider` calls `onRowsCreate`. `CreateRowsAsync` inserts the row and returns it with the database-assigned `id`. `dataProvider` updates its row map so subsequent edits target the correct ID.
7. **User deletes rows**: `dataProvider` calls `onRowsRemove([3, 7, 14])`. `RemoveRowsAsync` issues a single `DELETE FROM Orders WHERE Id IN (3, 7, 14)`.

## What you learned

- ASP.NET Core Web API projects camelCase JSON by default, so Handsontable's column keys usually need no transformation -- but overriding the naming policy on one side without the other silently breaks the grid.
- ASP.NET Core's model binder reads nested query parameters from dot notation (`sort.prop`) and indexed collections from `filters[N].prop`, unlike the bracket notation (`filters[0][prop]`) that Express, Rails, and PHP backends parse natively.
- Validate every column name that reaches `EF.Property<T>` against a fixed whitelist dictionary. Never trust `Sort.Prop` or a filter's `Prop` directly.
- `HasConversion<double>()` is necessary for `decimal` columns on SQLite, because SQLite has no native decimal type and would otherwise sort and filter the column as text.
- A typed create DTO with no `Id` or `CreatedAt` property blocks system-managed fields structurally, without runtime filtering.
- `EF.Functions.Like` with an explicit `ESCAPE` clause, paired with manual escaping of `%`, `_`, and `\`, keeps LIKE-based filters safe from wildcard injection.
- ASP.NET Core's general middleware order runs CORS after routing and before authentication/authorization -- keep that convention even in a project like this one that has neither yet, so adding auth later doesn't silently reject preflight requests.
- Pass `CultureInfo.InvariantCulture` to `decimal.TryParse`/`DateTime.TryParse` in a Web API. Without it, parsing depends on the server's OS culture, and a value the client always formats the same way (JavaScript's `String(142.5)`) can fail or parse differently depending on where the server happens to run.
- Clamp a client-supplied `pageSize` to a server-side maximum. Without a cap, a single request can force the server to materialize and serialize the entire table.

## Next steps

- [Server-side data with Spring Boot](@/recipes/data-management/server-side-spring/server-side-spring.md)
- [Server-side data with Express.js](@/recipes/data-management/server-side-expressjs/server-side-expressjs.md)
- [Server-side data with NestJS](@/recipes/data-management/server-side-nestjs/server-side-nestjs.md)
- [Rows pagination guide](@/guides/rows/rows-pagination/rows-pagination.md)
- [Column filter guide](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting guide](@/guides/rows/rows-sorting/rows-sorting.md)
