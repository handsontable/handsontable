---
id: a3f7c2e1
title: Server-side data with Django
metaTitle: Server-side Data with Django - JavaScript Data Grid | Handsontable
description: Connect Handsontable to a Django REST Framework backend with paginated fetching, server-side sorting and filtering, and full CRUD support.
permalink: /recipes/data-management/server-side-django
canonicalUrl: /recipes/data-management/server-side-django
tags:
  - django
  - rest-framework
  - server-side
  - data-provider
  - recipe
react:
  id: zdsrh5oc
  metaTitle: Server-side data with Django - React Data Grid | Handsontable
angular:
  id: q1s3u5w7
  metaTitle: Server-side Data with Django - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to a [Django REST Framework](https://www.django-rest-framework.org/) (DRF) backend. The backend handles pagination, sorting, and filtering on the server. The frontend displays results and sends all edits back to the API.

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/django" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Backend:** Python 3.11+, Django 4+, Django REST Framework 3.14+

## What you'll build

An employee directory grid that:

- Loads data page by page from a DRF API
- Sorts rows by any column on the server
- Filters rows by column value on the server
- Creates, updates, and deletes rows via batch API endpoints
- Handles Django's CSRF protection transparently

## Before you begin

- Docker and Docker Compose installed
- Node.js and npm installed

No local Python installation is required — the Django backend and PostgreSQL database run inside Docker.

## Step 1 -- Set up the Django app

Start the backend and the Vite dev server with `bash setup.sh` (or `make setup`). The script builds and starts PostgreSQL + Django via Docker Compose, runs migrations, seeds 50 employee records, and opens the Vite dev server at `http://localhost:5173`.

The Django project uses a `employees` app:

**Why a separate app?**  
Django apps are self-contained modules. Keeping the employee model, serializer, and views in one app makes the code easier to extend and test independently.

Register the app and required packages in `settings.py`:

::: example #py-settings

@[code py](@/content/recipes/data-management/server-side-django/server/settings-snippet.py)

:::

## Step 2 -- Define the Employee model

Create the model in `employees/models.py`:

::: example #py-models

@[code py](@/content/recipes/data-management/server-side-django/server/models.py)

:::

**What's happening:**

- `DecimalField` stores salary without floating-point rounding errors -- important for currency values.
- `ordering` in `Meta` sets the default query order. The `OrderingFilter` overrides it when the user sorts a column.
- Django automatically adds an `id` primary key. This becomes the `rowId` value on the frontend.

Run migrations to create the database table:

```shell
python manage.py makemigrations employees
python manage.py migrate
```

## Step 3 -- Seed the database

Create the seed command file at `employees/management/commands/seed.py`:

::: example #py-seed-command

@[code py](@/content/recipes/data-management/server-side-django/server/seed_command.py)

:::

Run it:

```shell
python manage.py seed
```

The command inserts 50 realistic employee records. It checks whether data already exists, so running it twice does not duplicate rows.

## Step 4 -- Write the serializer

Create `employees/serializers.py`:

::: example #py-serializers

@[code py](@/content/recipes/data-management/server-side-django/server/serializers.py)

:::

**What's happening:**

- `ModelSerializer` inspects the model and generates field definitions and validation rules automatically.
- `id` is read-only because the database assigns it -- the frontend never sends one for new rows.
- The `fields` list controls which columns appear in the API response and therefore which columns Handsontable receives.

## Step 5 -- Configure pagination

Create `employees/pagination.py`:

::: example #py-pagination

@[code py](@/content/recipes/data-management/server-side-django/server/pagination.py)

:::

**Why a custom pagination class?**

DRF's default response shape is `{ count, next, previous, results }`. Handsontable's `dataProvider` expects `{ rows, totalRows }`. Overriding `get_paginated_response` converts the shape on the server side, so the `fetchRows` callback on the frontend can `return res.json()` without any extra transformation.

**Why `page_size_query_param = 'pageSize'`?**

Handsontable sends `?pageSize=10` automatically. DRF's default param name is `page_size`. Setting `page_size_query_param = 'pageSize'` lets DRF read Handsontable's value directly, so no URL translation is needed in `fetchRows`.

## Step 6 -- Write the ViewSet

Create `employees/views.py`:

::: example #py-views

@[code py](@/content/recipes/data-management/server-side-django/server/views.py)

:::

The key parts are the sort translation and the three batch CRUD actions.

### Sort translation

Handsontable sends `?sort[prop]=salary&sort[order]=desc`. See `get_queryset` in `views.py` for the translation.

**What's happening:**

1. Read Handsontable's `sort[prop]` and `sort[order]` params.
2. Prepend `-` for descending order (Django ORM convention).
3. Call `queryset.order_by()` directly. `ALLOWED_ORDERING_FIELDS` is a whitelist that prevents ORM injection through arbitrary field names.

### Filter translation

`dataProvider` passes filters as a single `filters` query param containing a JSON-encoded array. Each element is a `DataProviderFilterColumn` object:

```json
[
  {
    "prop": "department",
    "operation": "conjunction",
    "conditions": [{ "name": "eq", "args": ["Engineering"] }]
  }
]
```

Decode and build a Django `Q` object. See `get_queryset` in `views.py` for the complete filter translation.

**What's happening:**

- `json.loads(filters_json)` decodes the single `filters` param into a list of column filter objects.
- Each column object contains `prop`, `operation` (`conjunction` = AND, `disjunction` = OR), and a `conditions` list.
- Conditions within one column combine according to `operation`; columns always combine with AND.
- `eq`/`not_eq` use `exact` for `salary` (DecimalField rejects `iexact`) and `iexact` for text fields.
- `empty`/`not_empty` handle both null and blank-string cases for text fields.
- `ALLOWED_ORDERING_FIELDS` whitelists the `prop` value to prevent ORM injection.

### Batch CRUD endpoints

Standard REST conventions use single-resource endpoints (`POST /employees/`, `DELETE /employees/{id}/`). Handsontable's `dataProvider` sends all mutations as arrays in a single request. A DRF `@action` solves this without creating a separate URL pattern by hand. See `create_rows`, `update_rows`, and `remove_rows` in `views.py`.

**What's happening:**

- `detail=False` registers the action at the list URL (`/api/employees/`) instead of the detail URL (`/api/employees/{id}/`).
- `create_rows` reads `rowsAmount` from the request and uses `bulk_create` to insert that many empty rows in one SQL statement. Returning them with their new `id` values lets `dataProvider` update its internal row map.
- `partial=True` in `update_rows` allows updating a subset of fields (`row['changes']`) without requiring all fields to be present.
- `filter(pk__in=ids).delete()` removes multiple rows in a single SQL statement.

**Why not use standard `DELETE /api/employees/{id}/` for each row?**

Deleting N rows individually requires N requests. A single batch request is faster and reduces network round trips.

## Step 7 -- Register URLs

Create `employees/urls.py`:

::: example #py-urls

@[code py](@/content/recipes/data-management/server-side-django/server/urls.py)

:::

Include this in your project's root `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    path('', include('employees.urls')),
]
```

`DefaultRouter` generates all standard and custom action URLs automatically. You can verify the registered routes by visiting `http://localhost:8000/api/` in a browser.

## Step 8 -- Configure CORS

The browser blocks cross-origin requests by default. Add `django-cors-headers` to allow requests from the frontend development server:

::: example #py-settings-cors

@[code py](@/content/recipes/data-management/server-side-django/server/settings-snippet.py)

:::

**Why must `CorsMiddleware` come before `CommonMiddleware`?**  
`CorsMiddleware` needs to intercept the preflight `OPTIONS` request before Django's routing logic handles it. Placing it after `CommonMiddleware` can result in missing CORS headers on preflight responses.

**Production note:** Replace the dev server origins with your actual production domain. Never set `CORS_ALLOW_ALL_ORIGINS = True` in production.

## Step 9 -- Handle CSRF in the frontend

Django protects mutating endpoints with a CSRF token. It sets a `csrftoken` cookie on every response. Read it and include it in the `X-CSRFToken` header for every `POST`, `PATCH`, or `DELETE` request. See `getCsrfToken` in the code files in Step 11.

**Why a cookie instead of a hidden form field?**  
Handsontable uses `fetch()`, not HTML form submission. Reading the token from the cookie (SameSite + CSRF double-submit pattern) works with any JavaScript HTTP client without server-side template changes.

## Step 10 -- Build the URL for fetchRows

Handsontable's `dataProvider` calls `fetchRows` with a `{ page, pageSize, sort, filters }` object. See `buildUrl` in the code files in Step 11.

**What's happening:**

- `page` and `pageSize` are sent as-is. DRF reads `pageSize` directly because `page_size_query_param = 'pageSize'` was set in Step 5.
- `sort` is split into `sort[prop]` and `sort[order]`. The Django view reads both params and calls `queryset.order_by()` directly (see Step 6).
- `filters` is serialised with `JSON.stringify`. `dataProvider` passes the full `DataProviderFilterColumn` array — including `operation` and nested `conditions` — which Django decodes with `json.loads()`.
- `API_BASE` uses a relative path (`/api/employees/`). In development, Vite proxies `/api/*` to `http://localhost:8000`, so the browser and Django share one origin, which keeps CSRF cookies accessible without extra CORS configuration.

## Step 11 -- Initialize Handsontable

With the backend and Vite dev server running (`bash setup.sh`), open `http://localhost:5173` to see the grid. The Django API runs on `http://localhost:8000` inside Docker; Vite proxies all `/api/*` requests to it. The complete frontend code is in the files below.

::: only-for javascript

::: example #javascript-django --code-only

@[code js](@/content/recipes/data-management/server-side-django/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-django --code-only

@[code ts](@/content/recipes/data-management/server-side-django/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-django --code-only

@[code](@/content/recipes/data-management/server-side-django/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-django --code-only

@[code](@/content/recipes/data-management/server-side-django/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-django/angular/example1.html)

:::

:::

**Key options explained:**

| Option | What it does |
|---|---|
| `rowId: 'id'` | Tells `dataProvider` which field identifies a row. Must match the serializer field name. |
| `{ signal }` in `fetchRows` | Pass the `AbortSignal` to `fetch()` so in-flight requests are cancelled when the user sorts or filters before the previous response arrives. |
| `return res.json()` in `onRowsCreate` | Return the server response so `dataProvider` can update its internal row map with the server-assigned `id` values. |
| `pagination: { pageSize: 10 }` | Enables the pagination toolbar. `dataProvider` sends the current page and size to `fetchRows` automatically. |
| `columnSorting: true` | Enables column header click-to-sort. The sort state is passed to `fetchRows` on each change. |
| `filters: true` | Enables the column filter UI. Active conditions are passed to `fetchRows` on each change. |
| `emptyDataState: true` | Shows a friendly illustration when `fetchRows` returns zero rows (for example, when a filter matches nothing). |
| `notification: true` | Shows automatic error toast notifications when `fetchRows` or a mutation callback throws. Fetch failures include a **Refetch** action. |
| `beforeRowsMutation` | Intercepts delete operations before they are sent. Used here to show a confirmation dialog; the actual delete is re-issued after the user confirms. |
| `contextMenu: true` | Enables the right-click context menu with "Insert row above / below" and "Remove row" items. |

## How it works -- Complete flow

1. **Initial load**: `dataProvider` calls `fetchRows({ page: 1, pageSize: 10 })`. The view returns the first 10 rows and the total row count.
2. **User clicks a column header**: `columnSorting` updates its sort state and `dataProvider` calls `fetchRows` again with `sort: { prop: 'salary', order: 'desc' }`. The Django view translates this to `?ordering=-salary` for `OrderingFilter`.
3. **User applies a column filter**: The filter UI updates its condition list and `dataProvider` calls `fetchRows` with the `filters` array. The Django view decodes the `filters` JSON string with `json.loads()` and builds a Django `Q` object from each column's `conditions` list.
4. **User navigates to page 2**: `dataProvider` calls `fetchRows({ page: 2, pageSize: 10, ... })`.
5. **User edits a cell**: `dataProvider` collects all changed cells for that row and calls `onRowsUpdate` with `[{ id: 7, salary: 102000 }]`. The `update-rows` endpoint applies a partial update.
6. **User adds a row**: `dataProvider` calls `onRowsCreate` with the new row values. The `create-rows` endpoint inserts the row and returns it with an `id`. `dataProvider` updates its internal map so future edits use the correct id.
7. **User deletes rows**: `dataProvider` calls `onRowsRemove` with the selected row ids. The `remove-rows` endpoint deletes all matching rows in a single SQL statement.

## What you learned

- DRF's default response shape (`{ count, results }`) differs from what `dataProvider` expects (`{ rows, totalRows }`). Override `get_paginated_response` in a custom pagination class to map the shape on the server.
- Set `page_size_query_param = 'pageSize'` so DRF reads Handsontable's parameter name directly.
- Read Handsontable's `sort[prop]` and `sort[order]` params in `get_queryset` and call `queryset.order_by()` directly. Whitelist the field name with `ALLOWED_ORDERING_FIELDS` to prevent ORM injection.
- Receive Handsontable's `filters` param as a JSON string and decode it with `json.loads()`. Each entry is `{ prop, operation, conditions: [{ name, args }] }` — conditions within a column combine with AND or OR; columns always combine with AND.
- Use DRF `@action` endpoints for batch CRUD instead of single-resource REST routes.
- Read Django's CSRF token from the `csrftoken` cookie and include it as the `X-CSRFToken` header in all mutating requests.
- Place `CorsMiddleware` before `CommonMiddleware` so preflight requests receive CORS headers.

## Next steps

- [Server-side data documentation](@/guides/getting-started/binding-to-data/binding-to-data.md) -- full `dataProvider` API reference
- [Rows pagination guide](@/guides/rows/rows-pagination/rows-pagination.md)
- [Column filter guide](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting guide](@/guides/rows/rows-sorting/rows-sorting.md)
