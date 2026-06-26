---
type: how-to
title: Server-side data with Supabase
metaTitle: Server-side Data with Supabase - JavaScript Data Grid | Handsontable
description: Wire Handsontable's dataProvider plugin to a Supabase Postgres table with server-side pagination, sorting, filtering, and full CRUD, secured with Row Level Security.
permalink: /recipes/data-management/server-side-supabase
canonicalUrl: /recipes/data-management/server-side-supabase
framework: react
tags:
  - supabase
  - server-side
  - data-provider
  - postgrest
  - row-level-security
  - recipes
react:
  metaTitle: Server-side Data with Supabase - React Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
menuTag: new
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to a live [Supabase](https://supabase.com) Postgres table. Every page load, sort, filter, and cell edit goes through the database, so the browser never holds the full dataset.

## Overview

**Difficulty:** Intermediate<br>
**Time:** ~30 minutes<br>
**Stack:** React, Vite, Handsontable `dataProvider`, `@handsontable/react-wrapper`, `@supabase/supabase-js` v2

The `dataProvider` plugin turns Handsontable into a server-backed grid. You supply four async functions -- one to fetch a page of rows, and three to create, update, and delete them -- and the plugin drives pagination, sorting, and filtering against the server. This recipe connects those functions to a Supabase Postgres table through PostgREST, the REST API that every Supabase project exposes automatically.

## What You'll Build

An inventory grid backed by a live Supabase table:

- Page-by-page loading with server-side pagination.
- Server-side sorting through PostgREST's `.order()` method.
- Server-side filtering, with each Handsontable filter condition mapped to its PostgREST equivalent.
- Full CRUD: cell edits, new rows, and deletions are written to the database and confirmed by the server.
- Error toasts through the [Notification plugin](@/guides/dialog/notification/notification.md).

## Before you begin

| Requirement | Version |
|---|---|
| `handsontable` | 17.1 or later |
| `@handsontable/react-wrapper` | 17.1 or later |
| `@supabase/supabase-js` | 2 |
| React + Vite | any current version |
| Supabase project | the free plan is enough |

This recipe adds to an existing Vite + React + TypeScript app. If you do not have one, scaffold it first, then add the Handsontable and Supabase packages:

```bash
npm create vite@latest my-inventory-app -- --template react-ts
cd my-inventory-app
npm install handsontable @handsontable/react-wrapper @supabase/supabase-js
```

The grid uses an `inventory` dataset with seven columns: id, SKU, name, quantity, unit price, warehouse, and an updated-at timestamp. With enough rows the grid pages through the data, so server-side pagination is meaningful from the first load.

## Step 1: Create the database table

Run this SQL in the Supabase SQL Editor to create the `inventory` table, enable Row Level Security, and seed a few rows:

```sql
create table inventory (
  id          uuid          primary key default gen_random_uuid(),
  sku         text          not null,
  name        text          not null,
  quantity    integer       not null default 0,
  unit_price  numeric(10,2) not null default 0,
  warehouse   text          not null,
  updated_at  timestamptz   not null default now()
);

-- Keep updated_at current on every update; the client never sends this field.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventory_set_updated_at
  before update on inventory
  for each row execute function set_updated_at();

-- Enable Row Level Security. The table is private until you add a policy.
alter table inventory enable row level security;

-- Grant the Data API roles access to the table. This is required as of
-- April 2026, when Supabase stopped exposing new tables automatically.
grant select, insert, update, delete on table inventory to anon, authenticated;

-- A permissive starter policy. Replace it with the per-user rules in Step 7.
create policy "anon full access"
  on inventory for all
  to anon
  using (true)
  with check (true);

insert into inventory (sku, name, quantity, unit_price, warehouse) values
  ('SKU-001', 'Widget A',        120,   5.99, 'East'),
  ('SKU-002', 'Widget B',         45,   7.49, 'West'),
  ('SKU-003', 'Gadget Pro',      200,  24.99, 'East'),
  ('SKU-004', 'Gadget Lite',      30,  14.99, 'Central'),
  ('SKU-005', 'Connector Cable',  88,   9.99, 'West'),
  ('SKU-006', 'Power Adapter',   150,  19.99, 'East'),
  ('SKU-007', 'USB Hub 4-port',   60,  29.99, 'Central'),
  ('SKU-008', 'Monitor 27"',      12, 349.99, 'West');
```

**What's happening:**

The `set_updated_at` trigger fires on every `UPDATE` and writes the current time to `updated_at`, so the client never needs to send that field. Enabling Row Level Security blocks all access by default; the `anon` role reaches the table through the Data API only because of the explicit `grant`. Row-level rules come from the policies you add on top, starting with the permissive `anon full access` policy here.

## Step 2: Configure environment variables

Add your Supabase project URL and anon key to `.env.local`:

```ini
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these values in the Supabase dashboard under **Project Settings -> API**.

**What's happening:**

Vite exposes any variable prefixed with `VITE_` to the browser bundle. The anon key is meant to be public: it identifies your project but grants no permissions on its own. Access is controlled by the RLS policies in the database, not by keeping the key secret.

## Step 3: Create the Supabase client

Create `src/supabase.ts`, a single client instance shared across the app:

:::example #supabase-client

@[code ts](@/content/recipes/data-management/server-side-supabase/react/supabase.ts)

:::

**What's happening:**

`createClient` runs once at module load and is exported as a singleton. PostgREST manages connection pooling on the server, so there is nothing to configure on the client. Every function that queries Supabase imports this one instance.

## Step 4: Map filter conditions to PostgREST

When the Filters plugin runs with `dataProvider`, Handsontable passes the current filter state as `filters` on every fetch. Each entry describes one column: a `prop` (the column data key), an array of `conditions` (each with a `name` and `args`), and an `operation`.

Map each condition name to its PostgREST equivalent:

| Handsontable condition | `args` | Supabase call |
|---|---|---|
| `eq` | `[value]` | `.eq(col, value)` |
| `neq` | `[value]` | `.neq(col, value)` |
| `contains` | `[value]` | `.ilike(col, '%value%')` |
| `not_contains` | `[value]` | `.not(col, 'ilike', '%value%')` |
| `begins_with` | `[value]` | `.ilike(col, 'value%')` |
| `ends_with` | `[value]` | `.ilike(col, '%value')` |
| `gt` | `[value]` | `.gt(col, value)` |
| `gte` | `[value]` | `.gte(col, value)` |
| `lt` | `[value]` | `.lt(col, value)` |
| `lte` | `[value]` | `.lte(col, value)` |
| `between` | `[from, to]` | `.gte(col, low).lte(col, high)` |
| `not_between` | `[from, to]` | `.or('col.lt.low,col.gt.high')` |
| `empty` | `[]` | `.or('col.is.null,col.eq.')` |
| `not_empty` | `[]` | `.not(col, 'is', null).neq(col, '')` |

Put the mapping in `src/filterAdapter.ts`:

:::example #filter-adapter

@[code ts](@/content/recipes/data-management/server-side-supabase/react/filterAdapter.ts)

:::

**What's happening:**

`applyFilters` reads each column's `operation`. For the default `conjunction`, it chains the conditions with `applyCondition` -- PostgREST ANDs chained calls, so the conditions are ANDed. For `disjunction` (the "Or" toggle in the column's filter menu), it maps the conditions to PostgREST `.or()` terms and applies them in a single `.or()` call, so they are ORed. Inside `.or()` terms, wildcards use `*` instead of `%` and negation uses the `not.` prefix; values containing commas or parentheses would need quoting. An unrecognized condition is logged and skipped rather than throwing, so an unmapped filter never breaks a fetch.

## Step 5: Build the grid component

Create `src/InventoryGrid.tsx`. It imports the client and the filter adapter as siblings (`./supabase`, `./filterAdapter`), supplies the four `dataProvider` functions, and configures the columns. The types come from `handsontable/plugins/dataProvider`, so the query parameters and mutation payloads are checked at compile time:

::: only-for react

::: example #example1 --code-only

@[code](@/content/recipes/data-management/server-side-supabase/react/example1.tsx)

:::

:::

**What's happening:**

- **`fetchRows`** converts the page number to a PostgREST range and passes `count: 'exact'`, so a single HTTP call returns both the page of rows and the total count. The `AbortSignal` from Handsontable is passed straight to Supabase: when the user pages or sorts before a response arrives, the in-flight request is canceled and the stale result is discarded.
- **`onRowsCreate`** chains `.select()` after `.insert()` so PostgREST returns the inserted rows, including the server-assigned `id` and `updated_at`. Returning those values is required: Handsontable uses the `id` to track new rows for later updates and deletes.
- **`onRowsUpdate`** receives all changes from one user action as a single array and dispatches them in parallel with `Promise.all`. This is safe because Handsontable serializes mutation calls, so there is never more than one `onRowsUpdate` in flight at once.
- **`hiddenColumns` and `fixedColumnsStart`** work together. The `id` column is hidden (physical index 0), so `fixedColumnsStart={2}` freezes the two visible columns `sku` and `name` rather than `id` and `sku`.
- **`dropdownMenu`** omits `filter_by_value` (the checkbox list of distinct values). In server mode the list could only be built from the loaded page, so `dataProvider` drops the menu item and ignores any `by_value` condition added in code. See [Filtering by a Set of Values](#filtering-by-a-set-of-values) for the server-side alternative.

Render the grid from your app's entry point -- for example, in `src/App.tsx`, import the component (`import InventoryGrid from './InventoryGrid'`) and return `<InventoryGrid />`.

## Step 6: Add error handling

`notification: true` wires up Handsontable's built-in toast layer, so errors surface in the UI with no extra setup. The two error hooks let you add behavior on top, such as logging to an error tracker:

```tsx
afterDataProviderFetchError={(error, queryParameters) => {
  // error           - the rejection reason from fetchRows
  // queryParameters - page, pageSize, sort, filters at the time of failure
  reportToErrorTracker(error, { context: queryParameters });
}}

afterRowsMutationError={(error) => {
  // Handsontable has already rolled back the optimistic UI update here.
  reportToErrorTracker(error);
}}
```

**What's happening:**

The Notification plugin listens for `afterDataProviderFetchError` and `afterRowsMutationError` internally and fires the toast whether or not you attach a hook. The plugin reads a human-readable message from the `message`, `error`, or `detail` property of the rejection. Supabase's `PostgrestError` has a `message` property, so the toast text is meaningful by default.

## Step 7: Lock down access with Row Level Security

The `VITE_SUPABASE_ANON_KEY` you embed in the frontend is public by design. The key identifies your project but grants no permissions on its own; access is controlled entirely by RLS policies. Replace the permissive starter policy from Step 1 with rules that match your app.

A per-user ownership pattern:

```sql
alter table inventory add column owner_id uuid references auth.users;

create policy "select own rows"
  on inventory for select
  using ((select auth.uid()) = owner_id);

create policy "insert own rows"
  on inventory for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "update own rows"
  on inventory for update
  using  ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "delete own rows"
  on inventory for delete
  using ((select auth.uid()) = owner_id);
```

A public-read, authenticated-write pattern:

```sql
create policy "public read"
  on inventory for select to anon, authenticated
  using (true);

create policy "authenticated write"
  on inventory for all to authenticated
  using (true) with check (true);
```

**What's happening:**

RLS policies are the real access-control layer. An empty policy list blocks all rows, so enabling RLS without adding policies locks the table completely. Write `(select auth.uid())` rather than `auth.uid()` in `USING` and `WITH CHECK` clauses: the scalar subquery form is evaluated once per query instead of once per row, which matters on large tables.

## How It Works - Complete Flow

1. `ExampleComponent` mounts and Handsontable calls `fetchRows` with `{ page: 1, pageSize: 10 }`.
2. `fetchRows` requests `range(0, 9)` with `count: 'exact'`. PostgREST returns the first ten rows and the total count in one HTTP call. Handsontable renders the page and sets up the pagination control.
3. The user clicks a column header. Handsontable calls `fetchRows` again with a `sort` parameter, and the in-flight request from step 2 is canceled through the `AbortSignal`.
4. The user opens the filter dropdown and sets a condition. Handsontable calls `fetchRows` with a `filters` array. The adapter maps each condition name to a PostgREST method and chains it onto the query.
5. The user edits a cell and moves away. Handsontable calls `onRowsUpdate` with `[{ id, changes }]`. The update is sent to Supabase, the `set_updated_at` trigger fires, and the returned row, with its refreshed timestamp, is written back into the grid.
6. The user right-clicks and inserts a row. Handsontable calls `onRowsCreate` with `{ rowsAmount: 1 }`. The new row is inserted, and the server-assigned `id` and `updated_at` come back in the response. Handsontable stores the `id` so it can update or delete that row later.
7. The user selects rows and deletes them. Handsontable calls `onRowsRemove` with the array of `id` values, which are passed to a single `DELETE ... IN (...)` statement.

## Performance and Production Considerations

The steps above cover the happy path. For production workloads, add the following:

- **Index the columns you sort and filter on.** PostgREST runs every sort and filter as SQL, so an unindexed table does a full scan on each request. Add B-tree indexes on the exposed columns, for example `create index on inventory (sku);` and `create index on inventory (warehouse);`. A composite index helps when users combine conditions on the same columns.
- **Batch large edits.** `onRowsUpdate` sends one request per changed row. A single cell edit is one request, but pasting a block produces many. For bulk writes, send the changes to a Postgres function through `supabase.rpc()`, or use one `.upsert()` call, so the round trip is a single request instead of N.
- **Index the RLS ownership column.** The per-user policy in Step 7 filters every query by `owner_id`. Add `create index on inventory (owner_id);` and keep the `(select auth.uid())` form so the check runs once per query, not once per row. Set `owner_id` on insert with a column default of `auth.uid()` or a `before insert` trigger, so the client never sends it.
- **Tune the count on large tables.** `count: 'exact'` runs a full `COUNT(*)` on every fetch, which grows costly past a few hundred thousand rows. Switch the pagination total to `count: 'estimated'` (or `'planned'`) on large tables, and keep `pageSize` modest so each page stays a small range scan.

## Filtering by a Set of Values

The built-in **Filter by value** checkbox list is unavailable in server mode: the list could only be built from the loaded page, so `dataProvider` omits the menu item and ignores `by_value` conditions. The condition-based filters from Step 4 cover most cases, but you can rebuild value-style filtering with your own control.

1. Populate a multi-select with the column's distinct values from the server, for example `select distinct warehouse from inventory order by warehouse`. Put this behind a cached view or an RPC so it stays cheap on large tables.
2. Hold the selection in your own state and apply it as an `.in()` filter inside `fetchRows`:

```ts
// Set by your multi-select control.
let selectedWarehouses: string[] = [];

// Inside fetchRows, after building the base query:
if (selectedWarehouses.length > 0) {
  query = query.in('warehouse', selectedWarehouses);
}
```

When the selection changes, refetch from the first page with the plugin's `fetchData({ page: 1 })` (reach it through the wrapper ref's `hotInstance`). Because the filter lives in your own state, pagination and sorting preserve it, and the server returns only matching rows.

## What you learned

- How `dataProvider` replaces manual `afterChange` wiring: pagination, sorting, filtering, and CRUD are handled by the plugin once the four async functions are in place.
- Why `onRowsCreate` must return the inserted rows, since Handsontable needs the server-assigned primary key to track new rows for later updates and deletes.
- How to pass an `AbortSignal` to Supabase so stale in-flight requests are canceled when the user changes page, sort, or filter before the response arrives.
- How to map Handsontable's filter conditions to PostgREST methods with a `switch` statement.
- Why the built-in `filter_by_value` checkbox is unavailable server-side: the plugin omits the menu item and ignores `by_value` conditions, because the list could only reflect the loaded page. A custom multi-select backed by a `select distinct` query replaces it.
- How Supabase RLS policies are the real access-control layer even though the anon key is public.

## Next steps

- [Server-side data overview](@/guides/getting-started/server-side-data/server-side-data.md) -- the full `dataProvider` API, lifecycle hooks, and options incompatible with server-side mode.
- [Fetching data](@/guides/getting-started/server-side-data/server-side-data-fetching.md) -- query-parameter structure, `beforeDataProviderFetch`, and abort behavior.
- [CRUD operations](@/guides/getting-started/server-side-data/server-side-data-crud.md) -- mutation lifecycle, optimistic updates, and programmatic CRUD.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- the complete guide to writing RLS policies.
- [Supabase PostgREST filters](https://supabase.com/docs/reference/javascript/using-filters) -- the full list of `.eq()`, `.or()`, `.textSearch()`, and other filter methods.
