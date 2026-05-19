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

Install the Python dependencies:

```shell
pip install django djangorestframework django-cors-headers
```

Install the JavaScript dependency:

```shell
npm install handsontable
```

## Step 1 -- Set up the Django app

Create a Django project and a `employees` app:

```shell
django-admin startproject myproject .
python manage.py startapp employees
```

**Why a separate app?**  
Django apps are self-contained modules. Keeping the employee model, serializer, and views in one app makes the code easier to extend and test independently.

Register the app and required packages in `settings.py`:

```python
# settings-snippet.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'employees',
]
```

## Step 2 -- Define the Employee model

Create the model in `employees/models.py`:

```python
# models.py
from django.db import models

class Employee(models.Model):
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    role       = models.CharField(max_length=100)
    salary     = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['last_name', 'first_name']
```

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

Create the seed command file at `employees/management/commands/seed.py` (see `server/seed_command.py` in this recipe) and run it:

```shell
python manage.py seed
```

The command inserts 50 realistic employee records. It checks whether data already exists, so running it twice does not duplicate rows.

## Step 4 -- Write the serializer

Create `employees/serializers.py`:

```python
# serializers.py
from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Employee
        fields = ['id', 'first_name', 'last_name', 'department', 'role', 'salary']
        read_only_fields = ['id']
```

**What's happening:**

- `ModelSerializer` inspects the model and generates field definitions and validation rules automatically.
- `id` is read-only because the database assigns it -- the frontend never sends one for new rows.
- The `fields` list controls which columns appear in the API response and therefore which columns Handsontable receives.

## Step 5 -- Configure pagination

Create `employees/pagination.py`:

```python
# pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class EmployeePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'pageSize'  # matches Handsontable's default param name
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'rows':      data,
            'totalRows': self.page.paginator.count,
        })
```

**Why a custom pagination class?**

DRF's default response shape is `{ count, next, previous, results }`. Handsontable's `dataProvider` expects `{ rows, totalRows }`. Overriding `get_paginated_response` converts the shape on the server side, so the `fetchRows` callback on the frontend can `return res.json()` without any extra transformation.

**Why `page_size_query_param = 'pageSize'`?**

Handsontable sends `?pageSize=10` automatically. DRF's default param name is `page_size`. Setting `page_size_query_param = 'pageSize'` lets DRF read Handsontable's value directly, so no URL translation is needed in `fetchRows`.

## Step 6 -- Write the ViewSet

Create `employees/views.py`. The key parts are the sort translation and the three batch CRUD actions.

### Sort translation

Handsontable sends `?sort[prop]=salary&sort[order]=desc`. DRF's `OrderingFilter` expects `?ordering=-salary`. Translate in `get_queryset`:

```python
sort_prop  = self.request.query_params.get('sort[prop]')
sort_order = self.request.query_params.get('sort[order]', 'asc')

if sort_prop and sort_prop in self.ordering_fields:
    ordering = sort_prop if sort_order == 'asc' else f'-{sort_prop}'
    self.request._request.GET = self.request._request.GET.copy()
    self.request._request.GET['ordering'] = ordering
```

**What's happening:**

1. Read Handsontable's `sort[prop]` and `sort[order]` params.
2. Prepend `-` for descending order (DRF convention).
3. Inject the translated value into the mutable query params copy so `OrderingFilter` picks it up as if the frontend had sent `?ordering=` directly.

### Filter translation

Handsontable sends filters as:

```
?filters[0][prop]=department&filters[0][value]=Engineering&filters[0][condition]=eq
```

Parse these and build a Django `Q` object:

```python
q = Q()
index = 0

while index < 20:
    prefix    = f'filters[{index}]'
    prop      = self.request.query_params.get(f'{prefix}[prop]')
    value     = self.request.query_params.get(f'{prefix}[value]')
    condition = self.request.query_params.get(f'{prefix}[condition]', 'contains')

    if prop is None:
        break

    lookup_map = {
        'contains':     f'{prop}__icontains',
        'not_contains': f'{prop}__icontains',  # negated below
        'eq':           f'{prop}__iexact',
        'begins_with':  f'{prop}__istartswith',
        'ends_with':    f'{prop}__iendswith',
        'gte':          f'{prop}__gte',
        'lte':          f'{prop}__lte',
    }

    lookup = lookup_map.get(condition)

    if lookup:
        if condition in ('not_contains',):
            q &= ~Q(**{lookup: value})
        else:
            q &= Q(**{lookup: value})

    index += 1

return queryset.filter(q)
```

**What's happening:**

- The loop reads up to 20 filter conditions from the query string. Multiple conditions are combined with `AND` using `&=`.
- `icontains`, `istartswith`, and `iendswith` are case-insensitive Django ORM lookups.
- `not_contains` negates the `Q` object with `~`.
- `gte` and `lte` work for numeric fields like `salary`.

### Batch CRUD endpoints

Standard REST conventions use single-resource endpoints (`POST /employees/`, `DELETE /employees/{id}/`). Handsontable's `dataProvider` sends all mutations as arrays in a single request. A DRF `@action` solves this without creating a separate URL pattern by hand:

```python
@action(detail=False, methods=['post'], url_path='create-rows')
def create_rows(self, request):
    serializer = EmployeeSerializer(data=request.data, many=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=201)

@action(detail=False, methods=['patch'], url_path='update-rows')
def update_rows(self, request):
    updated = []
    for row in request.data:
        employee = Employee.objects.get(pk=row['id'])
        serializer = EmployeeSerializer(employee, data=row, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        updated.append(serializer.data)
    return Response(updated)

@action(detail=False, methods=['delete'], url_path='remove-rows')
def remove_rows(self, request):
    deleted_count, _ = Employee.objects.filter(pk__in=request.data).delete()
    return Response({'deleted': deleted_count})
```

**What's happening:**

- `detail=False` registers the action at the list URL (`/api/employees/`) instead of the detail URL (`/api/employees/{id}/`).
- `many=True` on the serializer tells DRF to accept and validate an array of objects at once.
- `partial=True` in `update_rows` allows updating a subset of fields without requiring all fields to be present.
- `filter(pk__in=ids).delete()` removes multiple rows in a single SQL statement.

**Why not use standard `DELETE /api/employees/{id}/` for each row?**

Deleting N rows individually requires N requests. A single batch request is faster and reduces network round trips.

## Step 7 -- Register URLs

Create `employees/urls.py`:

```python
# urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

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

```python
# settings-snippet.py
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... rest of your middleware ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',   # Vite dev server
    'http://localhost:3000',   # CRA / Next.js dev server
]
```

**Why must `CorsMiddleware` come before `CommonMiddleware`?**  
`CorsMiddleware` needs to intercept the preflight `OPTIONS` request before Django's routing logic handles it. Placing it after `CommonMiddleware` can result in missing CORS headers on preflight responses.

**Production note:** Replace the dev server origins with your actual production domain. Never set `CORS_ALLOW_ALL_ORIGINS = True` in production.

## Step 9 -- Handle CSRF in the frontend

Django protects mutating endpoints with a CSRF token. It sets a `csrftoken` cookie on every response. Read it and include it in the `X-CSRFToken` header for every `POST`, `PATCH`, or `DELETE` request:

```javascript
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1];
}
```

Pass the token in the request headers:

```javascript
headers: {
  'Content-Type': 'application/json',
  'X-CSRFToken': getCsrfToken(),
},
```

**Why a cookie instead of a hidden form field?**  
Handsontable uses `fetch()`, not HTML form submission. Reading the token from the cookie (SameSite + CSRF double-submit pattern) works with any JavaScript HTTP client without server-side template changes.

## Step 10 -- Build the URL for fetchRows

Handsontable's `dataProvider` calls `fetchRows` with a `{ page, pageSize, sort, filters }` object. Translate these into query string parameters:

```javascript
function buildUrl(base, { page, pageSize, sort, filters }) {
  const params = new URLSearchParams();

  params.set('page', page);
  params.set('pageSize', pageSize);

  if (sort?.prop) {
    params.set('sort[prop]', sort.prop);
    params.set('sort[order]', sort.order ?? 'asc');
  }

  if (filters?.length) {
    filters.forEach(({ prop, value, condition }, i) => {
      params.set(`filters[${i}][prop]`, prop);
      params.set(`filters[${i}][value]`, value);
      params.set(`filters[${i}][condition]`, condition);
    });
  }

  return `${base}?${params.toString()}`;
}
```

**What's happening:**

- `page` and `pageSize` are sent as-is. DRF reads `pageSize` directly because `page_size_query_param = 'pageSize'` was set in Step 5.
- `sort` is split into `sort[prop]` and `sort[order]`. The Django view reassembles them into DRF's `ordering` param (see Step 6).
- Each filter condition becomes a `filters[N][prop]`, `filters[N][value]`, `filters[N][condition]` triplet. The Django view parses this indexed format in a loop.

## Step 11 -- Initialize Handsontable

Wire everything together in the `dataProvider` configuration:

```javascript
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      const url = buildUrl('http://localhost:8000/api/employees/', {
        page, pageSize, sort, filters,
      });
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      // pagination.py already maps { count, results } to { rows, totalRows }.
      return res.json();
    },

    onRowsCreate: async (rows) => {
      const res = await fetch('.../create-rows/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify(rows),
      });
      return res.json(); // return created rows so dataProvider updates its row map
    },

    onRowsUpdate: async (rows) => {
      await fetch('.../update-rows/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify(rows),
      });
    },

    onRowsRemove: async (rowIds) => {
      await fetch('.../remove-rows/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify(rowIds),
      });
    },
  },

  pagination:    { pageSize: 10 },
  columnSorting: true,
  filters:       true,
  dropdownMenu:  ['filter_by_condition', 'filter_action_bar'],
  emptyDataState: true,
  notification:  true,

  colHeaders: ['First Name', 'Last Name', 'Department', 'Role', 'Salary'],
  columns: [
    { data: 'first_name', type: 'text' },
    { data: 'last_name',  type: 'text' },
    { data: 'department', type: 'text' },
    { data: 'role',       type: 'text' },
    { data: 'salary',     type: 'numeric', numericFormat: { pattern: '$0,0' } },
  ],

  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code collapse={7-154}](@/content/recipes/data-management/server-side-django/react/example1.jsx)
@[code collapse={7-154}](@/content/recipes/data-management/server-side-django/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

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

## How it works -- Complete flow

1. **Initial load**: `dataProvider` calls `fetchRows({ page: 1, pageSize: 10 })`. The view returns the first 10 rows and the total row count.
2. **User clicks a column header**: `columnSorting` updates its sort state and `dataProvider` calls `fetchRows` again with `sort: { prop: 'salary', order: 'desc' }`. The Django view translates this to `?ordering=-salary` for `OrderingFilter`.
3. **User applies a column filter**: The filter UI updates its condition list and `dataProvider` calls `fetchRows` with the `filters` array. The Django view parses `filters[0][prop]`, `filters[0][value]`, and `filters[0][condition]` into a Django `Q` object.
4. **User navigates to page 2**: `dataProvider` calls `fetchRows({ page: 2, pageSize: 10, ... })`.
5. **User edits a cell**: `dataProvider` collects all changed cells for that row and calls `onRowsUpdate` with `[{ id: 7, salary: 102000 }]`. The `update-rows` endpoint applies a partial update.
6. **User adds a row**: `dataProvider` calls `onRowsCreate` with the new row values. The `create-rows` endpoint inserts the row and returns it with an `id`. `dataProvider` updates its internal map so future edits use the correct id.
7. **User deletes rows**: `dataProvider` calls `onRowsRemove` with the selected row ids. The `remove-rows` endpoint deletes all matching rows in a single SQL statement.

## What you learned

- DRF's default response shape (`{ count, results }`) differs from what `dataProvider` expects (`{ rows, totalRows }`). Override `get_paginated_response` in a custom pagination class to map the shape on the server.
- Set `page_size_query_param = 'pageSize'` so DRF reads Handsontable's parameter name directly.
- Translate Handsontable's `sort[prop]` + `sort[order]` params to DRF's `ordering` param in `get_queryset` before `OrderingFilter` runs.
- Parse Handsontable's indexed `filters[N][...]` params into Django `Q` objects to support column-level filtering.
- Use DRF `@action` endpoints for batch CRUD instead of single-resource REST routes.
- Read Django's CSRF token from the `csrftoken` cookie and include it as the `X-CSRFToken` header in all mutating requests.
- Place `CorsMiddleware` before `CommonMiddleware` so preflight requests receive CORS headers.

## Next steps

- [Server-side data documentation](@/guides/getting-started/binding-to-data/binding-to-data.md) -- full `dataProvider` API reference
- [Rows pagination guide](@/guides/rows/rows-pagination/rows-pagination.md)
- [Column filter guide](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting guide](@/guides/rows/rows-sorting/rows-sorting.md)
