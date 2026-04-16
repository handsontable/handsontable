---
type: tutorial
id: a3f82c91
title: Server-side data with NestJS
metaTitle: Server-side Data with NestJS - JavaScript Data Grid | Handsontable
description: Connect Handsontable to a NestJS backend for paginated, sorted, and filtered server-side data with full CRUD support using the dataProvider plugin.
permalink: /recipes/data-management/server-side-nestjs
canonicalUrl: /recipes/data-management/server-side-nestjs
tags:
  - nestjs
  - server-side
  - data-provider
  - typescript
  - rest-api
  - pagination
  - sorting
  - filtering
  - crud
searchCategory: Recipes
category: Data Management
---

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/data-management/server-side-nestjs/javascript/example1.js)
@[code](@/content/recipes/data-management/server-side-nestjs/javascript/example1.ts)

:::

:::

## Overview

In this tutorial, you will connect Handsontable to a [NestJS](https://nestjs.com/) backend. You will build a support-tickets data grid with server-side pagination, sorting, filtering, and full CRUD (create, update, delete) operations.

**Difficulty:** Intermediate
**Time:** ~40 minutes
**Stack:** NestJS 10, TypeScript, Handsontable `dataProvider` plugin

## What You'll Build

- A NestJS REST API with `GET`, `POST`, `PATCH`, and `DELETE /tickets` endpoints
- A Handsontable grid that fetches data from the API and reflects every page, sort, and filter change
- Full CRUD -- add, edit, and delete rows; changes are sent to the server automatically
- Automatic error toasts when a request fails, with a Refetch button for fetch errors
- A status label outside the grid that shows the total record count

## Before You Begin

- [x] Node.js 18 or later installed
- [x] NestJS CLI installed: `npm install -g @nestjs/cli`
- [x] Basic familiarity with NestJS modules, controllers, and services
- [x] Basic familiarity with Handsontable initialization

## Step 1 -- Scaffold the NestJS project

Create a new NestJS application and install the validation libraries:

```shell
nest new tickets-api --package-manager npm
cd tickets-api
npm install class-validator class-transformer
```

**Why `class-validator` and `class-transformer`?**

NestJS's `ValidationPipe` uses these two libraries together:

- `class-transformer` converts query-string values (all strings by default) into the TypeScript types declared in your DTO -- so `page=2` becomes the number `2` instead of the string `"2"`.
- `class-validator` then checks that those typed values satisfy your constraints (`@IsInt()`, `@Min(1)`, etc.) and rejects invalid requests before they reach your service.

Together they give you end-to-end type safety from the HTTP request to the TypeScript service method.

## Step 2 -- Define the data model (`ticket.entity.ts`)

Copy `ticket.entity.ts` from the `server/` folder into `src/tickets/`. This file defines the `Ticket` interface and the in-memory data store:

```typescript
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  createdAt: string; // ISO date string, e.g. "2025-01-15"
}

export const ticketsStore: Ticket[] = [ /* ... seed data ... */ ];
```

**Using TypeORM instead of an in-memory array**

The in-memory store is enough to run this recipe with zero configuration. For a real application, replace it with a TypeORM entity backed by SQLite (zero extra setup) or any other database:

```shell
npm install @nestjs/typeorm typeorm better-sqlite3
```

```typescript
// Replace the interface + array with:
@Entity()
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() subject: string;
  @Column({ default: 'open' }) status: TicketStatus;
  @Column({ default: 'medium' }) priority: TicketPriority;
  @Column() assignee: string;
  @Column({ type: 'date' }) createdAt: string;
}
```

Inject `@InjectRepository(TicketEntity)` into the service and replace array operations with `repository.findAndCount()`, `repository.save()`, and `repository.delete()`.

## Step 3 -- Create the fetch DTO (`fetch-tickets.dto.ts`)

Copy `fetch-tickets.dto.ts` into `src/tickets/dto/`. This DTO validates and transforms the query parameters sent by Handsontable:

```typescript
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class FilterConditionDto {
  @IsString() prop: string;
  @IsString() condition: string;
  value: string[];
}

export class SortDto {
  @IsString() column: string;
  @IsString() order: 'asc' | 'desc';
}

export class FetchTicketsDto {
  @IsInt() @Min(1) @Type(() => Number)
  page: number = 1;

  @IsInt() @Min(1) @Type(() => Number)
  pageSize: number = 10;

  @IsOptional() @ValidateNested() @Type(() => SortDto)
  sort?: SortDto;

  @IsOptional() @ValidateNested({ each: true }) @Type(() => FilterConditionDto)
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  filters?: FilterConditionDto[];
}
```

**What each decorator does:**

| Decorator | Purpose |
|---|---|
| `@Type(() => Number)` | Converts the query-string `"2"` to the number `2` before validation runs |
| `@IsInt()` / `@Min(1)` | Rejects non-integer or out-of-range values with a 400 response |
| `@ValidateNested()` | Recursively validates nested objects (`SortDto`, `FilterConditionDto`) |
| `@Transform(...)` | Normalizes `filters` -- ensures a single filter is always wrapped in an array |

**How Handsontable serializes filters**

Handsontable's Filters plugin sends one condition object per active column. In the query string that looks like:

```
filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
```

NestJS parses bracket notation into nested objects automatically when `enableImplicitConversion` is set in the `ValidationPipe` options (configured in Step 4).

## Step 4 -- Bootstrap with CORS and `ValidationPipe` (`main.ts`)

Copy `main.ts` into the project root `src/` folder:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow requests from the frontend origin (any origin in development).
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
```

**`app.enableCors()`**

Without this, the browser blocks requests from a different origin (e.g., `localhost:5173` calling `localhost:3000`). In production, replace the wildcard with your frontend domain:

```typescript
app.enableCors({ origin: 'https://your-app.example.com' });
```

**`ValidationPipe` options explained:**

| Option | What it does |
|---|---|
| `transform: true` | Activates class-transformer so `@Type()` decorators convert string values to numbers and nested objects |
| `enableImplicitConversion: true` | Also converts primitive types without an explicit `@Type()` decorator -- useful for nested query params |
| `whitelist: true` | Strips any properties not declared in the DTO, preventing extra data from reaching the service |

## Step 5 -- Implement the service (`tickets.service.ts`)

The service performs filtering, sorting, and pagination on the in-memory store. Copy `tickets.service.ts` into `src/tickets/`:

```typescript
@Injectable()
export class TicketsService {
  findAll(dto: FetchTicketsDto): { rows: Ticket[]; totalRows: number } {
    let tickets = [...ticketsStore];

    // Filtering: map each Handsontable condition to an array predicate
    if (dto.filters?.length) {
      for (const filter of dto.filters) {
        tickets = tickets.filter((ticket) => {
          const cell = String(ticket[filter.prop as keyof Ticket] ?? '').toLowerCase();

          switch (filter.condition) {
            case 'eq':           return cell === String(filter.value[0]).toLowerCase();
            case 'contains':     return cell.includes(String(filter.value[0]).toLowerCase());
            case 'begins_with':  return cell.startsWith(String(filter.value[0]).toLowerCase());
            case 'empty':        return cell === '';
            default:             return true;
          }
        });
      }
    }

    // Sorting: compare strings with localeCompare; reverse for 'desc'
    if (dto.sort) {
      const { column, order } = dto.sort;

      tickets.sort((a, b) => {
        const cmp = String(a[column as keyof Ticket]).localeCompare(String(b[column as keyof Ticket]));

        return order === 'asc' ? cmp : -cmp;
      });
    }

    // Pagination: slice the array to the requested page
    const totalRows = tickets.length;
    const start = (dto.page - 1) * dto.pageSize;

    return { rows: tickets.slice(start, start + dto.pageSize), totalRows };
  }

  // create, updateMany, removeMany -- see full server/tickets.service.ts
}
```

**Filtering -- condition mapping**

Handsontable's Filters plugin sends condition names such as `eq`, `neq`, `contains`, `not_contains`, `begins_with`, `ends_with`, `empty`, `not_empty`. The `switch` statement maps each to a JavaScript predicate. With TypeORM you would map these to `WHERE` clauses instead:

```typescript
// TypeORM equivalent for 'contains':
queryBuilder.andWhere(`ticket.${filter.prop} LIKE :val`, { val: `%${filter.value[0]}%` });
```

**Why `totalRows` matters**

Handsontable uses `totalRows` to render the correct number of pages in the pagination bar. If you omit it or return the length of the current page instead of the total filtered count, the pagination will be wrong.

## Step 6 -- Add the controller (`tickets.controller.ts`)

Copy `tickets.controller.ts` into `src/tickets/`. It maps each HTTP verb to the corresponding service method:

```typescript
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // GET /tickets?page=1&pageSize=10&sort[column]=status&sort[order]=asc
  @Get()
  findAll(@Query() query: FetchTicketsDto) {
    return this.ticketsService.findAll(query);
  }

  // POST /tickets -- body: [{ subject, status, priority, assignee, createdAt }]
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateTicketDto | CreateTicketDto[]) {
    const rows = Array.isArray(body) ? body : [body];

    return rows.map((dto) => this.ticketsService.create(dto));
  }

  // PATCH /tickets -- body: [{ id, status }]  (partial updates)
  @Patch()
  updateMany(@Body() body: UpdateTicketDto[]) {
    return this.ticketsService.updateMany(body);
  }

  // DELETE /tickets -- body: ['1', '3']
  @Delete()
  @HttpCode(204)
  removeMany(@Body() ids: string[]) {
    this.ticketsService.removeMany(ids);
  }
}
```

**Payload shapes -- how Handsontable calls each endpoint**

| Handsontable callback | HTTP method | Body shape |
|---|---|---|
| `fetchRows` | `GET` | Query params (page, pageSize, sort, filters) |
| `onRowsCreate` | `POST` | Array of new row objects with column data |
| `onRowsUpdate` | `PATCH` | Array of partial row objects, each including the `rowId` field |
| `onRowsRemove` | `DELETE` | Array of row ID strings |

The `rowId: 'id'` option in the frontend configuration tells Handsontable which field to use as the row identifier. The `onRowsUpdate` payload includes this ID alongside only the changed properties -- so a status change sends `[{ id: '3', status: 'resolved' }]`, not the full row.

## Step 7 -- Configure the frontend (`example1.ts`)

**Import the TypeScript interfaces**

NestJS developers are TypeScript users. Importing the Handsontable type interfaces gives you compile-time checks on the `fetchRows` signature:

```typescript
import type {
  DataProviderFetchOptions,
  DataProviderQueryParameters,
} from 'handsontable/plugins/dataProvider';
```

`DataProviderQueryParameters` describes the `params` argument -- `page`, `pageSize`, `sort`, and `filters`. `DataProviderFetchOptions` describes the second argument, which contains the `AbortSignal`.

**Build the query string**

Handsontable passes a plain object to `fetchRows`. You need to convert it to a query string that NestJS can parse. Use bracket notation for nested values:

```typescript
function buildUrl(base: string, params: DataProviderQueryParameters): string {
  const query = new URLSearchParams();

  query.set('page', String(params.page));
  query.set('pageSize', String(params.pageSize));

  if (params.sort) {
    query.set('sort[column]', params.sort.column as string);
    query.set('sort[order]', params.sort.order);
  }

  if (params.filters?.length) {
    params.filters.forEach((filter, i) => {
      query.set(`filters[${i}][prop]`, filter.prop as string);
      query.set(`filters[${i}][condition]`, filter.condition);
      filter.value.forEach((v, j) => {
        query.set(`filters[${i}][value][${j}]`, String(v));
      });
    });
  }

  return `${base}?${query.toString()}`;
}
```

**Why bracket notation?**

NestJS's `@Query()` decorator together with `class-transformer` parses `sort[column]=status` into the nested object `{ sort: { column: 'status' } }`. Plain dot-notation (e.g., `sort.column=status`) does not work -- NestJS treats it as a flat key named `"sort.column"`.

**Wire up `dataProvider`**

```typescript
dataProvider: {
  rowId: 'id',

  fetchRows: async (params: DataProviderQueryParameters, { signal }: DataProviderFetchOptions) => {
    const url = buildUrl('http://localhost:3000/tickets', params);
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`Server error ${res.status}`);

    return res.json();
  },

  onRowsCreate: async (payload) => {
    const res = await fetch('http://localhost:3000/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Create failed: ${res.status}`);

    return res.json(); // Must return the created rows with server-assigned IDs
  },

  onRowsUpdate: async (rows) => {
    await fetch('http://localhost:3000/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    });
  },

  onRowsRemove: async (rowIds) => {
    await fetch('http://localhost:3000/tickets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowIds),
    });
  },
},
```

**The `signal` parameter and request cancellation**

The `DataProviderFetchOptions` object includes an `AbortSignal`. Pass it to `fetch()` as `{ signal }`. When the user changes the page or sort before the previous request finishes, Handsontable aborts the old request. Without the signal, stale responses can arrive out of order and overwrite newer data.

**`onRowsCreate` must return the created rows**

After the server creates a row it assigns a server-generated ID. `onRowsCreate` must return those rows so Handsontable can update its internal row tracker with the real IDs. If you return nothing, subsequent edits and deletes on the new rows will fail because the grid still holds a temporary client-side ID.

## Step 8 -- Enable pagination, sorting, filtering, and error handling

Add these options to the Handsontable configuration:

```typescript
pagination: { pageSize: 5 },  // Triggers server-side paging
columnSorting: true,           // Sends sort descriptor in fetchRows params
filters: true,                 // Sends filter conditions in fetchRows params
dropdownMenu: true,            // Shows the column header menu with filter controls
emptyDataState: true,          // Loading overlay + empty-state message
notification: true,            // Automatic error toasts for all dataProvider errors
```

**`pagination`**

Setting `pagination` activates the pagination bar below the grid and tells `dataProvider` to include `page` and `pageSize` in every `fetchRows` call. Without this option the grid would try to load all rows at once.

**`emptyDataState`**

Shows a loading spinner overlay while `fetchRows` is in flight. When the server returns zero rows, it shows a configurable empty-state message instead of a blank grid.

**`notification: true`**

Wraps all `dataProvider` callbacks in error handling. When `fetchRows` throws, a toast appears with a **Refetch** button that retries the last request. When `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` throw, a toast appears with the error message. You can customize the message by passing a configuration object instead of `true`:

```typescript
notification: {
  fetchError: { message: 'Could not load tickets. Check your connection.' },
  mutationError: { message: 'Save failed. Please try again.' },
}
```

## Step 9 -- React to fetch results with a hook

Use `afterDataProviderFetch` to update elements outside the grid whenever the data refreshes:

```typescript
afterDataProviderFetch(result) {
  statusLabel.textContent = `${result.totalRows} tickets total`;
},
```

**When does `afterDataProviderFetch` fire?**

After every successful `fetchRows` call -- on initial load, page change, sort change, and filter change. The `result` argument is the object returned by your `fetchRows` function, so it includes both `rows` (the current page) and `totalRows` (the total filtered count).

Use this hook to keep record counts, breadcrumbs, or any other derived UI in sync with the grid without polling.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows({ page: 1, pageSize: 5 })`. The frontend builds the URL and fetches from NestJS. The service returns `{ rows: [...], totalRows: 12 }`. The grid renders the first page and the pagination bar shows 3 pages.
2. **User changes page**: `fetchRows({ page: 2, pageSize: 5 })` is called. The previous request is aborted via `AbortSignal` if still in flight.
3. **User clicks a column header**: `fetchRows({ page: 1, pageSize: 5, sort: { column: 'priority', order: 'asc' } })` is called. The service sorts the store and returns the first page of sorted results.
4. **User opens the column menu and filters**: `fetchRows({ ..., filters: [{ prop: 'status', condition: 'eq', value: ['open'] }] })` is called. The service filters to only open tickets and returns the first page with a new `totalRows`.
5. **User edits a cell**: After the edit is committed, `onRowsUpdate([{ id: '3', status: 'resolved' }])` is called. The service updates the store. No reload occurs -- the grid reflects the change locally.
6. **User adds a row**: `onRowsCreate([{ subject: 'New issue', ... }])` is called. The service creates the row and returns it with a server-assigned `id`. The grid replaces the temporary client ID with the real one.
7. **User deletes a row**: `onRowsRemove(['5'])` is called. The service removes the row. The current page is refetched to fill the gap.
8. **A request fails**: `fetchRows` throws. The `notification` plugin shows a toast with a **Refetch** button. The `afterDataProviderFetchError` hook also fires if you need custom handling.

## What You Learned

- How to scaffold a NestJS API with the correct module, controller, service, and DTO structure
- How to use `class-validator` and `class-transformer` in a `ValidationPipe` to parse and validate Handsontable query parameters
- How bracket-notation serialization maps Handsontable's sort and filter objects to NestJS `@Query()` DTOs
- How to map Handsontable filter condition names (`eq`, `contains`, etc.) to array predicates or TypeORM `WHERE` clauses
- How to use `DataProviderQueryParameters` and `DataProviderFetchOptions` TypeScript interfaces from `handsontable/plugins/dataProvider`
- How `rowId`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` work together for full CRUD
- How `notification: true` provides automatic error toasts with a Refetch button
- How `afterDataProviderFetch` keeps UI outside the grid in sync

## Next Steps

- Replace the in-memory store with TypeORM + SQLite (zero extra config) or PostgreSQL
- Add authentication -- pass a `Bearer` token in the `fetchRows` fetch headers
- Share the DTO types between the NestJS backend and the Handsontable frontend in a monorepo (e.g., a shared `packages/types` workspace package)
- Explore the `afterDataProviderFetchError` and `afterRowsMutationError` hooks for custom error UI when `notification` is off
