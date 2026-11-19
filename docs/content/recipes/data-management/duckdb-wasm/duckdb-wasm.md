---
type: tutorial
title: Query a million rows in the browser with DuckDB-Wasm
metaTitle: Query a million rows in the browser with DuckDB-Wasm | Handsontable DataGrid for JavaScript
description: Back Handsontable DataGrid's dataProvider plugin with DuckDB-Wasm, so a million rows page, sort, filter, and save in the browser with no backend.
permalink: /recipes/data-management/duckdb-wasm
canonicalUrl: /recipes/data-management/duckdb-wasm
framework: react
menuTag: new
tags:
  - duckdb
  - duckdb-wasm
  - webassembly
  - parquet
  - data-provider
  - large datasets
  - tutorial
  - recipes
react:
  metaTitle: Query a million rows in the browser with DuckDB-Wasm | Handsontable DataGrid for React
searchCategory: Recipes
category: Data Management
---

In this tutorial, you will back a Handsontable DataGrid with [DuckDB-Wasm](https://duckdb.org/docs/stable/clients/wasm/overview), the in-process SQL database compiled to WebAssembly. DuckDB holds a million rows in a Web Worker, and the grid holds one page at a time. Every page, sort, filter, and edit runs as SQL in the browser, with no server, no API, and no account.

<iframe src="https://demos.handsontable.com/embed/16i6w2p2k2/"
  style="width:100%; height: 780px; border:0; border-radius: 4px; overflow:hidden;"
  title="A Handsontable DataGrid over a million rows held in DuckDB-Wasm"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-downloads allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in the demo runner**](https://demos.handsontable.com/share/16i6w2p2k2)

The grid above generates a million orders in DuckDB when it loads. Sort a column, filter **Region** or **Qty**, or page to the end. The status bar shows how many rows match and how long the last query took. The demo loads the DuckDB engine from jsDelivr, while this recipe serves it from your own app with Vite.

<script>
  // Keep the embedded demo in the same light/dark mode as this page. The
  // demos.handsontable.com embed wrapper posts { source, ready } when it loads
  // and applies any { source, mode } it receives.
  (() => {
    const SOURCE = 'hot-runner-scheme';
    const ORIGIN = 'https://demos.handsontable.com';
    const mode = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    const frames = () => Array.from(document.querySelectorAll('iframe[src^="' + ORIGIN + '"]'));
    const send = (win) => win && win.postMessage({ source: SOURCE, mode: mode() }, ORIGIN);
    window.addEventListener('message', (event) => {
      if (event.origin === ORIGIN && event.data && event.data.source === SOURCE && event.data.ready) send(event.source);
    });
    new MutationObserver(() => frames().forEach((frame) => send(frame.contentWindow))).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ['data-theme'] },
    );
  })();
</script>

[[toc]]

## Overview

**Difficulty:** Intermediate<br>
**Time:** ~30 minutes<br>
**Stack:** React, Vite, Handsontable `dataProvider`, `@handsontable/react-wrapper`, `@duckdb/duckdb-wasm` 1.32

The [`dataProvider` plugin](@/guides/getting-started/server-side-data/server-side-data.md) turns Handsontable into a grid backed by a remote source. You supply four async functions -- one that fetches a page of rows, and three that create, update, and delete rows -- and the plugin drives pagination, sorting, and filtering through them. The other server-side recipes point those functions at an HTTP API. This one points them at a database that runs in the same browser tab.

That fits a common case: someone has a large Parquet or CSV export and no API in front of it. DuckDB reads the file in the browser, and the grid gives them sorting, filtering, and editing over all of it.

## What you'll build

An orders grid over 1,000,000 generated rows:

- A DuckDB-Wasm database in a Web Worker, seeded in SQL with no download.
- Page-by-page loading with a stable order, so no row is repeated or skipped between pages.
- Sorting and filtering in SQL, with each Handsontable filter condition mapped to a parameterized SQL predicate.
- Cell edits, new rows, and deletions written to DuckDB, with a multi-row edit committed in one transaction.
- A status bar that shows how many rows match and how long the last query took.
- A **Load Parquet or CSV** button that replaces the data with your own file, and an **Export Parquet** button that downloads the table, edits included.

On a recent laptop, the million rows are generated in under a second, and a sorted page returns in tens of milliseconds.

## Before you begin

| Requirement | Version |
|---|---|
| `handsontable` | 18.1 or later |
| `@handsontable/react-wrapper` | 18.1 or later |
| `@duckdb/duckdb-wasm` | 1.32.0 |
| React + Vite | any current version |

Scaffold a Vite + React + TypeScript app if you do not have one, then add the packages:

```bash
npm create vite@latest orders-app -- --template react-ts
cd orders-app
npm install handsontable @handsontable/react-wrapper
npm install --save-exact @duckdb/duckdb-wasm@1.32.0
```

Pin `@duckdb/duckdb-wasm` to an exact version. The package publishes development builds under its `latest` tag, so a bare `npm install @duckdb/duckdb-wasm` can install a pre-release build. Run `npm view @duckdb/duckdb-wasm dist-tags` to see what each tag points to.

The recipe has seven files in `src/`:

| File | Purpose |
|---|---|
| `duckdb.ts` | Starts DuckDB in a Web Worker and runs statements one at a time |
| `seed.ts` | Generates the table, loads a user's file, and exports Parquet |
| `schema.ts` | The columns that SQL is allowed to reference |
| `filterToSql.ts` | Turns Handsontable filter conditions into a SQL `WHERE` clause |
| `ordersProvider.ts` | The four `dataProvider` functions |
| `OrdersGrid.tsx` | The grid component |
| `App.tsx` | Seeds the data, shows the status bar, and renders the grid |

## Step 1: Start DuckDB in a Web Worker

Create `src/duckdb.ts`:

::: example #duckdb-ts --code-only

@[code ts](@/content/recipes/data-management/duckdb-wasm/react/duckdb.ts)

:::

**What's happening:**

- **Vite serves the engine.** The `?url` imports give you URLs to the worker scripts and `.wasm` files inside `node_modules`, so the app needs no CDN at runtime. `selectBundle` picks the exception-handling (EH) build when the browser supports it, and falls back to the MVP build otherwise. Neither build needs cross-origin isolation headers. Only DuckDB's multithreaded build does.
- **The worker keeps the page responsive.** Every query runs off the main thread, so scrolling and typing in the grid never wait on DuckDB.
- **`castBigIntToDouble` keeps BigInt out of the grid.** `COUNT(*)` and sequence values are `BIGINT` in DuckDB, which Apache Arrow returns as JavaScript `BigInt`. The cast turns them into ordinary numbers in one place.
- **`exclusive` runs one statement at a time.** The plugin can start a fetch while the refetch that follows a mutation is still pending. Queuing every call keeps a transaction from interleaving with an unrelated query on the shared connection.
- **`query` closes every prepared statement.** A prepared statement holds memory in the worker until you close it, so the `finally` block closes it whether the query succeeds or fails.

## Step 2: Generate a million rows

Create `src/seed.ts`. The first function builds the `orders` table. The other two come into play in [Step 7](#load-and-export-parquet-or-csv).

::: example #seed-ts --code-only

@[code ts](@/content/recipes/data-management/duckdb-wasm/react/seed.ts)

:::

**What's happening:**

`range(1_000_000)` produces a million row numbers, and each column derives its value from `hash()` of that number. The values look random but stay the same on every load, so a screenshot or a bug report is reproducible. Nothing is downloaded, so the demo works offline.

`CREATE OR REPLACE SEQUENCE` starts the `id` sequence after the last generated row. New rows take their `id` from it, which matters in [Step 5](#write-the-dataprovider-functions).

## Step 3: Declare the columns SQL can reference

Create `src/schema.ts`:

::: example #schema-ts --code-only

@[code ts](@/content/recipes/data-management/duckdb-wasm/react/schema.ts)

:::

**What's happening:**

Filter values are bound as SQL parameters, but column names cannot be. The sort column and filter columns come from the grid as the `prop` of a column, so `getColumn` checks every `prop` against this map before it reaches SQL. A `prop` that is not in the map throws an error instead of becoming part of a query.

Each column also records how it appears in SQL. `order_date` is a `DATE` in the table, but the grid filters it as `YYYY-MM-DD` text, the same string it displays. Sorting still uses the real `DATE` column.

## Step 4: Map filter conditions to SQL

When the [Filters](@/guides/columns/column-filter/column-filter.md) plugin runs with `dataProvider`, every fetch receives the current filter state as `filters`. Each entry describes one column: its `prop`, a list of `conditions` (each a `name` and `args`), and an `operation` that combines them.

| Handsontable condition | Text column | Numeric column |
|---|---|---|
| `eq` | `lower(col) = lower(?)` | `col = ?` |
| `neq` | `col IS NULL OR lower(col) <> lower(?)` | `col IS NULL OR col <> ?` |
| `contains` | `contains(lower(col), lower(?))` | - |
| `not_contains` | `col IS NULL OR NOT contains(lower(col), lower(?))` | - |
| `begins_with` | `starts_with(lower(col), lower(?))` | - |
| `ends_with` | `ends_with(lower(col), lower(?))` | - |
| `gt`, `gte`, `lt`, `lte` | - | `col > ?`, `col >= ?`, `col < ?`, `col <= ?` |
| `between` | - | `col BETWEEN ? AND ?` |
| `not_between` | - | `col < ? OR col > ?` |
| `empty` | `col IS NULL OR col = ''` | `col IS NULL` |
| `not_empty` | `col IS NOT NULL AND col <> ''` | `col IS NOT NULL` |

The `operation` takes one of three values:

| `operation` | Meaning | SQL |
|---|---|---|
| `conjunction` | All conditions match. | `a AND b` |
| `disjunction` | Any condition matches. | `a OR b` |
| `disjunctionWithExtraCondition` | Any of the first conditions matches, and the last one also matches. | `(a OR b) AND c` |

Put the mapping in `src/filterToSql.ts`:

::: example #filter-to-sql-ts --code-only

@[code ts](@/content/recipes/data-management/duckdb-wasm/react/filterToSql.ts)

:::

**What's happening:**

- **Case-insensitive text matching.** Handsontable's own `eq`, `contains`, and `begins_with` conditions ignore case, so the SQL compares `lower()` values. `contains()`, `starts_with()`, and `ends_with()` take the search text as a plain string, so a `%` or `_` that a user types matches literally and needs no escaping.
- **Numbers arrive as strings.** The filter inputs return text, so numeric arguments are converted with `Number()` before binding. A value that is not a number skips the condition instead of matching nothing.
- **Every operation is handled.** A column filter with **Or** selected arrives as `disjunction`. The Filters plugin also produces `disjunctionWithExtraCondition`, so a mapping that treats every non-`disjunction` value as `AND` returns the wrong rows.
- **Unsupported conditions are skipped.** A condition with no mapping logs a warning and is left out, so an unmapped filter never breaks a fetch.

## Step 5: Write the dataProvider functions

Create `src/ordersProvider.ts`. It builds each query from the `schema.ts` and `filterToSql.ts` helpers and exports the four functions the grid needs:

::: example #orders-provider-ts --code-only

@[code ts](@/content/recipes/data-management/duckdb-wasm/react/ordersProvider.ts)

:::

**What's happening:**

- **`fetchRows` always orders the rows completely.** `LIMIT` and `OFFSET` without a total order can return rows in a different order on each call, so a row can appear on two pages or on none. With no sort, the newest rows come first. With a sort, `id` breaks ties: a million orders across four regions means about 250,000 rows share each `region` value.
- **The count uses the same `WHERE` clause.** The second query counts every row that matches the filters, which drives the pagination bar.
- **A superseded fetch is dropped, not canceled.** DuckDB-Wasm cannot cancel a prepared statement from an `AbortSignal`. When the user pages or sorts before a query finishes, `fetchRows` checks `signal.aborted` after the query and returns an empty result, which the plugin discards.
- **The grid refetches after every mutation.** After `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` succeeds, the plugin calls `fetchRows` again, and that refetch is what updates the grid. New rows take the next `id` from the sequence, so they appear at the top of page 1.
- **One user action, one transaction.** A paste can change hundreds of rows at once, and they all arrive in a single `onRowsUpdate` call. The function commits them together, and rolls all of them back if any value is invalid. The plugin then reverts the cells and shows the error.
- **JavaScript numbers bind as `DOUBLE`.** `range()` accepts only `BIGINT`, so `onRowsCreate` casts its argument. Apply the same cast anywhere a function needs an integer type.

## Step 6: Build the grid component

Create `src/OrdersGrid.tsx`:

::: only-for react

::: example #example1 --code-only

@[code](@/content/recipes/data-management/duckdb-wasm/react/OrdersGrid.tsx)

:::

:::

**What's happening:**

- **Every prop is defined once, outside the component.** The React wrapper passes changed props to `updateSettings()`, and a new `dataProvider` object makes the plugin fetch again. If you write the config inline, every parent render triggers a refetch. In this app, every fetch updates the parent's status bar, so the grid would refetch forever and never leave its loading state. Module-level constants and `memo` keep the grid out of that loop.
- **`columnSorting`, not `multiColumnSorting`.** The `dataProvider` plugin sends one sort column to `fetchRows`, and it does not enable when `multiColumnSorting` is on.
- **No filter by value.** In server mode, the **Filter by value** checklist could only list the values on the loaded page, so `dropdownMenu` leaves it out. The condition filters from [Step 4](#map-filter-conditions-to-sql) run against all million rows.
- **`fixedColumnsStart` counts hidden columns.** The frozen span starts at the hidden `id` column, so `fixedColumnsStart={3}` freezes the two visible columns, `order_no` and `customer`. With `{2}`, only `order_no` would stay in place.
- **`notification` shows errors as toasts.** A failed fetch or a rejected edit, such as an invalid date, appears as a toast with DuckDB's error message.

## Step 7: Load and export Parquet or CSV

Replace `src/App.tsx`:

::: example #app-tsx --code-only

@[code tsx](@/content/recipes/data-management/duckdb-wasm/react/App.tsx)

:::

**What's happening:**

- **The grid mounts after the data exists.** `App` seeds the table first, then renders `OrdersGrid`, so the first fetch never queries a missing table. `seedOnce` keeps React's development double mount from generating the table twice.
- **A user's file stays in the browser.** `loadFile` from Step 2 registers the file with DuckDB under a fixed internal name, so the user's file name never appears in SQL. It reads Parquet with `read_parquet` and CSV with `read_csv_auto`, and casts every column to the demo schema. The rows land in a temporary table first, and `loadFile` rejects the file if any `id` is missing or repeated, because edits and deletes match rows by `id`: two rows with the same `id` would change or disappear together. A file that fails a check, or lacks a column, shows the error, and the current table stays as it was. `App` then calls `fetchData({ page: 1 })` on the plugin to show the new data.
- **Export writes the current table.** `exportParquet` runs `COPY orders TO 'orders.parquet'` inside DuckDB's virtual file system and hands the bytes to the browser as a download, edits included.
- **The file picker is a real button.** A hidden `<input type="file">` is not in the tab order, so a native `<button>` opens it through a ref. Keyboard users can reach and press **Load Parquet or CSV** like any other button.
- **The status bar reads each fetch.** `onFetchStats` reports the matching row count and the query time. Updating `App` state is safe here because `OrdersGrid` does not re-render with it.

Run `npm run dev` and open the app. Sort a column, filter by region, or page to the end to see the query time for each change.

## How it works -- complete flow

1. `App` starts DuckDB in a worker and runs the seed SQL. When the table exists, it renders `OrdersGrid`.
2. Handsontable calls `fetchRows` with `{ page: 1, pageSize: 50 }`. DuckDB returns the 50 newest orders and the total count, and the grid renders the page.
3. The user clicks the **Qty** header. Handsontable calls `fetchRows` with `sort: { prop: 'quantity', order: 'asc' }`, and DuckDB runs `ORDER BY quantity ASC, id ASC`.
4. The user filters **Region** to contain `emea`. `filtersToWhere` builds `WHERE (contains(lower(region), lower(?)))` and binds `'emea'`. The status bar shows the new match count.
5. The user edits a cell. Handsontable calls `onRowsUpdate` with `[{ id, changes }]`. The update commits in a transaction, and the plugin refetches the page.
6. The user inserts a row from the context menu. `onRowsCreate` takes the next `id` from the sequence, and the refetch shows the new row at the top of page 1.
7. The user deletes rows. `onRowsRemove` receives their `id` values and runs one `DELETE ... WHERE id IN (...)`.

## Known limitations

- **The data lives in the tab.** DuckDB keeps the table in the worker's memory, and a reload regenerates it. Use **Export Parquet** to keep edits. For automatic persistence, DuckDB-Wasm can also store a database file in the browser's Origin Private File System (OPFS).
- **The engine is a large download.** The EH `.wasm` file is about 34 MB, or about 8 MB compressed. Serve it with compression and long-term caching, and show a loading state while it starts.
- **Memory grows with the data.** The million generated rows fit comfortably in a desktop browser. Larger files are limited by the memory the browser gives the tab.
- **Uploaded files must match the schema.** `loadFile` expects the demo columns. To support any file, read its columns with `DESCRIBE` and build the grid's `columns` and the `schema.ts` map from them.
- **A development warning in React StrictMode.** StrictMode mounts the grid, unmounts it, and mounts it again. With Handsontable 18.1.2, the discarded first instance logs `Data fetch failed: TypeError: Cannot read properties of undefined (reading 'runHooks')`. The second instance loads normally, and production builds do not double-mount.

## What you learned

- How to run DuckDB-Wasm in a Web Worker and serve its files with Vite, with no CDN and no cross-origin isolation headers.
- How `dataProvider` drives pagination, sorting, filtering, and CRUD through four functions, whatever the data source.
- Why `LIMIT` and `OFFSET` need a tiebreaker column to return stable pages.
- How to map all three filter operations, including `disjunctionWithExtraCondition`, to SQL.
- Why grid props must stay referentially stable when a parent re-renders on every fetch.
- How to load a user's Parquet or CSV file in the browser and export the table back to Parquet.

## Next steps

- [Server-side data overview](@/guides/getting-started/server-side-data/server-side-data.md) -- the full `dataProvider` API, lifecycle hooks, and options that do not work in server-side mode.
- [Fetching data](@/guides/getting-started/server-side-data/server-side-data-fetching.md) -- the query parameters, `beforeDataProviderFetch`, and abort behavior.
- [CRUD operations](@/guides/getting-started/server-side-data/server-side-data-crud.md) -- the mutation lifecycle, optimistic updates, and programmatic CRUD.
- [Server-side data with Supabase](@/recipes/data-management/server-side-supabase/server-side-supabase.md) -- the same four functions against a hosted Postgres database.
- [DuckDB-Wasm documentation](https://duckdb.org/docs/stable/clients/wasm/overview) -- data ingestion, extensions, and OPFS persistence.
