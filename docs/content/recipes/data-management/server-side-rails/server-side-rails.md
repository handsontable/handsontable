---
id: d8c51f2a
title: Server-side data with Ruby on Rails
metaTitle: Server-side Data with Ruby on Rails - JavaScript Data Grid | Handsontable
description: Connect Handsontable's dataProvider plugin to a Ruby on Rails API-only backend with paginated fetching, server-side sorting and filtering, and full CRUD using the kaminari gem.
permalink: /recipes/data-management/server-side-rails
canonicalUrl: /recipes/data-management/server-side-rails
tags:
  - ruby-on-rails
  - rails
  - server-side
  - data-provider
  - recipe
react:
  id: v76z3enw
  metaTitle: Server-side data with Ruby on Rails - React Data Grid | Handsontable
angular:
  id: dg0cfnxy
  metaTitle: Server-side data with Ruby on Rails - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

This tutorial shows how to wire Handsontable's `dataProvider` plugin to a [Ruby on Rails](https://rubyonrails.org/) API-only backend. The backend handles pagination, sorting, and filtering on the server. The frontend displays results and sends every edit back to the API.

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/rails" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

**Difficulty:** Intermediate  
**Time:** ~30 minutes  
**Backend:** Ruby 3.2+, Rails 7.1+, `kaminari` for pagination, `rack-cors` for CORS

## What you'll build

An Order Management grid that:

- Loads orders page by page from a Rails API
- Sorts orders by any column on the server
- Filters orders by column value on the server
- Creates, updates, and deletes rows via dedicated collection endpoints
- Handles Rails' default snake_case payloads without mismatching Handsontable column keys

## Before you begin

Install Ruby and Rails (see the [Rails installation guide](https://guides.rubyonrails.org/getting_started.html)), then generate a new API-only project:

```shell
rails new orders-api --api
cd orders-api
```

Install the JavaScript dependency:

```shell
npm install handsontable
```

## Step 1 -- Add the Ruby gems

Add `kaminari` (pagination) and `rack-cors` (cross-origin requests) to the `Gemfile`:

```ruby
# Gemfile
gem "kaminari"
gem "rack-cors"
```

Install them:

```shell
bundle install
```

**Why these two gems?**

- `kaminari` gives you a `.page(n).per(size)` query method on any ActiveRecord relation. It also exposes `total_count`, which you return to Handsontable as `totalRows`.
- `rack-cors` lets the Rails API accept requests from a different origin than the frontend dev server. Without it, the browser blocks the requests before Rails sees them.

## Step 2 -- Generate the `Order` model

Use the generator to create the model, the migration, and a matching controller file:

```shell
rails generate model Order order_number:string customer:string status:string total:decimal
rails db:migrate
```

The generated migration adds `id` and `created_at` / `updated_at` columns automatically. The final schema has the six fields referenced throughout this recipe: `id`, `order_number`, `customer`, `status`, `total`, and `created_at`.

**What's happening:**

- Rails' `decimal` type stores currency values without floating-point rounding. For production, specify precision and scale: `total:decimal{10,2}`.
- The primary key `id` is auto-incremented by the database. It becomes the `rowId` value on the Handsontable side.
- `created_at` is filled automatically by ActiveRecord on insert.

See `server/order.rb` for a minimal model with validations and a `status` enum.

## Step 3 -- Seed the database

Add realistic seed data in `db/seeds.rb` (see `server/seeds.rb` in this recipe), then run:

```shell
rails db:seed
```

The seed script inserts 50 orders across realistic statuses (`pending`, `paid`, `shipped`, `delivered`, `cancelled`). It checks whether data already exists, so running it twice does not duplicate rows.

## Step 4 -- Configure the routes

Open `config/routes.rb` and register the orders resource inside an `api` namespace:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    resources :orders, only: [:index] do
      collection do
        post   :create_rows
        patch  :update_rows
        delete :remove_rows
      end
    end
  end
end
```

**What's happening:**

- `namespace :api` prefixes all routes with `/api` and scopes the controller under `Api::OrdersController`. This keeps the API separate from any server-rendered views you might add later.
- `only: [:index]` restricts the generated RESTful routes to `GET /api/orders` -- standard per-resource create/update/destroy routes are replaced by the batch `collection` routes below.
- `collection do ... end` registers three custom routes at the collection URL (`/api/orders/...`) instead of the detail URL (`/api/orders/:id`). Handsontable's `dataProvider` sends every mutation as an array in a single request, so batch endpoints are what you want.

The three resulting routes are:

| Method | URL | Controller action |
|---|---|---|
| `POST` | `/api/orders/create_rows` | `create_rows` |
| `PATCH` | `/api/orders/update_rows` | `update_rows` |
| `DELETE` | `/api/orders/remove_rows` | `remove_rows` |

## Step 5 -- Configure CORS

Create `config/initializers/cors.rb`:

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", "http://localhost:3000"

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :patch, :put, :delete, :options],
      expose:  ["Content-Type"]
  end
end
```

**What's happening:**

- `insert_before 0` puts the middleware at the very front of the stack so it runs before Rails' routing.
- `origins` lists the URLs that are allowed to call the API. Replace these with your production domain before deploying.
- `resource "/api/*"` scopes the CORS rule to the API endpoints only.
- `methods` must include `:options` for browsers to complete preflight requests on non-simple methods (`PATCH`, `DELETE`).

**Production note:** Never use `origins "*"` in production. Pin the list to the exact domains that own your Handsontable deployment.

## Step 6 -- Decide on the case convention

Rails emits snake_case JSON by default (`order_number`, `created_at`). Handsontable's column `data` keys must match whatever the server returns.

You have two practical options:

**Option A -- Keep snake_case (used in this recipe).** Set `data: 'order_number'` on the matching Handsontable column. No transformation on either side.

**Option B -- Emit camelCase from Rails.** Override serialization globally:

```ruby
# config/initializers/json_case.rb
class ActiveRecord::Base
  def as_json(options = {})
    super(options).deep_transform_keys { |key| key.to_s.camelize(:lower) }
  end
end
```

Then use `data: 'orderNumber'` on the frontend and also translate the `sort_prop` and `filters[][prop]` values back to snake_case in the controller.

**Why this matters:** mixing conventions -- Rails returning `order_number` while Handsontable columns declare `data: 'orderNumber'` -- silently breaks pagination, sorting, and filtering. The grid renders empty cells and the server receives unknown column names. Pick one convention and stick to it.

The rest of this recipe uses Option A (snake_case everywhere).

## Step 7 -- Build the controller

Create `app/controllers/api/orders_controller.rb`. This single file implements paginated `index`, server-side sort and filter, and the three batch CRUD actions.

### Whitelist sortable columns

Sort inputs that flow into `order()` reach the SQL `ORDER BY` clause. Treating them as raw strings is an SQL-injection risk. Whitelist them once at the top of the class:

```ruby
SORTABLE_COLUMNS = %w[order_number customer status total created_at].freeze
```

### `index` -- paginated list with sort and filter

```ruby
def index
  orders = Order.all
  orders = apply_filters(orders)
  orders = apply_sort(orders)
  orders = orders.page(params[:page]).per(params[:page_size] || 10)

  render json: { rows: orders.as_json, total_rows: orders.total_count }
end
```

**What's happening:**

1. Start from `Order.all`. This builds a base ActiveRecord relation without hitting the database yet.
2. `apply_filters` adds `.where(...)` clauses from the parsed Handsontable filter list.
3. `apply_sort` adds an `.order(...)` clause if the request includes a whitelisted `sort_prop`.
4. `kaminari` adds `LIMIT` and `OFFSET` via `.page(n).per(size)`. The query is still not executed.
5. `as_json` triggers the query and serializes results. `total_count` issues a separate `SELECT COUNT(*)` that Handsontable uses to size the paginator.

The response shape is exactly what `dataProvider` expects: `{ rows, total_rows }`. The frontend maps `total_rows` to `totalRows` (see Step 9).

### Sort helper

```ruby
def apply_sort(scope)
  prop  = params[:sort_prop]
  order = params[:sort_order] == "desc" ? :desc : :asc

  return scope unless SORTABLE_COLUMNS.include?(prop)

  scope.order(prop => order)
end
```

**What's happening:**

- `params[:sort_prop]` comes directly from the frontend's `sort_prop=` query param (see Step 9).
- `SORTABLE_COLUMNS.include?(prop)` is the whitelist check. Any column not on the list is silently ignored -- no SQL is generated for it.
- `scope.order(prop => order)` uses the hash form of `.order()`, which ActiveRecord quotes safely.
- `params[:sort_order]` falls back to `:asc` unless the client explicitly sends `desc`. This prevents arbitrary SQL fragments (for example, `created_at; DROP TABLE orders`) from reaching the database.

### Filter helper

Handsontable sends filters as an indexed structure:

```
?filters[0][prop]=status&filters[0][value]=shipped&filters[0][condition]=eq
?filters[1][prop]=total&filters[1][value]=100&filters[1][condition]=gte
```

Rails parses bracket-indexed params into a nested hash automatically. Parse each condition and chain `.where` calls:

```ruby
def apply_filters(scope)
  filters = params[:filters]
  return scope if filters.blank?

  Array(filters.values).each do |filter|
    prop      = filter[:prop]
    value     = filter[:value]
    condition = filter[:condition].presence || "contains"

    next unless SORTABLE_COLUMNS.include?(prop)

    case condition
    when "contains"     then scope = scope.where("#{prop} ILIKE ?", "%#{value}%")
    when "not_contains" then scope = scope.where.not("#{prop} ILIKE ?", "%#{value}%")
    when "eq"           then scope = scope.where(prop => value)
    when "neq"          then scope = scope.where.not(prop => value)
    when "begins_with"  then scope = scope.where("#{prop} ILIKE ?", "#{value}%")
    when "ends_with"    then scope = scope.where("#{prop} ILIKE ?", "%#{value}")
    when "gt"           then scope = scope.where("#{prop} > ?", value)
    when "gte"          then scope = scope.where("#{prop} >= ?", value)
    when "lt"           then scope = scope.where("#{prop} < ?", value)
    when "lte"          then scope = scope.where("#{prop} <= ?", value)
    end
  end

  scope
end
```

**What's happening:**

- The `SORTABLE_COLUMNS` check is reused as a filter whitelist. Column names that reach the raw SQL fragment (`ILIKE`, `>=`, etc.) must be validated against a fixed list.
- `ILIKE` is PostgreSQL-specific. On SQLite or MySQL, use `LIKE` with a `COLLATE` clause or case-normalize the input.
- Each condition rebinds `scope`, so multiple filters combine with `AND`. `dataProvider` does not send `OR` groups by default.

### Batch CRUD actions

```ruby
def create_rows
  payload = params.permit!.to_h

  rows = Array(payload[:rows]).map do |row|
    Order.create!(row.slice(*Order.column_names - %w[id created_at updated_at]))
  end

  render json: { rows: rows.as_json }, status: :created
end

def update_rows
  updated = Array(params[:rows]).map do |row|
    record  = Order.find(row[:id])
    changes = row[:changes].to_unsafe_h.slice(*Order.column_names)
    record.update!(changes)
    record
  end

  render json: { rows: updated.as_json }
end

def remove_rows
  ids = Array(params[:row_ids])
  Order.where(id: ids).delete_all
  head :no_content
end
```

**What's happening:**

- `create_rows` -- receives `{ rows: [...] }`. Each row is inserted with `create!`, which raises on validation errors. `column_names - ['id', 'created_at', 'updated_at']` blocks the client from setting system-managed fields. Status 201 tells `dataProvider` the rows were created.
- `update_rows` -- receives `{ rows: [{ id, changes: { ... } }] }`. `changes.slice(*Order.column_names)` drops any unknown keys so stray fields never reach the ORM. Returning the updated rows lets `dataProvider` reconcile its internal row map.
- `remove_rows` -- receives `{ row_ids: [1, 2, 3] }`. `delete_all` issues a single `DELETE ... WHERE id IN (...)` statement, which is faster than deleting each row one by one. Status 204 signals a successful delete with no response body.

The full controller file lives at `server/orders_controller.rb`.

## Step 8 -- CSRF in API mode

`ApplicationController` in API mode inherits from `ActionController::API`, which does not include `RequestForgeryProtection`. That means CSRF verification is **off by default** for this project, and `fetch()` requests from the browser do not need an `X-CSRF-Token` header.

**When does CSRF matter?**

- If you mount the Rails API under the same origin as a classic Rails app that uses cookie-based sessions, the classic app enforces CSRF protection -- your fetch calls will need the token.
- Token-based auth (for example, a `Authorization: Bearer` header) does not require CSRF protection because the browser never attaches the token automatically.

This recipe assumes a stateless API and an `Authorization` header (or no auth) in production. Add `protect_from_forgery with: :null_session` inside the controller only if you re-enable session-based auth.

## Step 9 -- Build the request URL on the frontend

Handsontable's `dataProvider` calls `fetchRows` with `{ page, pageSize, sort, filters }`. Map those to the Rails parameter names:

```javascript
function buildUrl(base, { page, pageSize, sort, filters }) {
  const params = new URLSearchParams();

  params.set('page', page);
  params.set('page_size', pageSize);

  if (sort?.prop) {
    params.set('sort_prop', sort.prop);
    params.set('sort_order', sort.order ?? 'asc');
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

- `pageSize` is converted to `page_size` because Rails and kaminari use snake_case parameter names.
- `sort` is split into two flat params, `sort_prop` and `sort_order`. The controller's `apply_sort` reads them directly.
- Each filter condition becomes a `filters[N][prop]`, `filters[N][value]`, `filters[N][condition]` triplet. Rails converts the bracket notation to a nested hash automatically.

## Step 10 -- Initialize Handsontable

Wire everything into `dataProvider`:

```javascript
const hot = new Handsontable(container, {
  dataProvider: {
    rowId: 'id',

    fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
      const url = buildUrl('http://localhost:3000/api/orders', {
        page, pageSize, sort, filters,
      });
      const res = await fetch(url, { signal });

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const json = await res.json();

      // Rails returns snake_case; dataProvider expects camelCase for totalRows.
      return { rows: json.rows, totalRows: json.total_rows };
    },

    onRowsCreate: async (rows) => {
      const res = await fetch('http://localhost:3000/api/orders/create_rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();

      return json.rows; // dataProvider updates its row map with server-assigned ids
    },

    onRowsUpdate: async (rows) => {
      await fetch('http://localhost:3000/api/orders/update_rows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rows.map((r) => ({ id: r.id, changes: r })) }),
      });
    },

    onRowsRemove: async (rowIds) => {
      await fetch('http://localhost:3000/api/orders/remove_rows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row_ids: rowIds }),
      });
    },
  },

  pagination:     { pageSize: 10 },
  columnSorting:  true,
  filters:        true,
  dropdownMenu:   ['filter_by_condition', 'filter_action_bar'],
  emptyDataState: true,
  notification:   true,

  colHeaders: ['Order #', 'Customer', 'Status', 'Total', 'Created'],
  columns: [
    { data: 'order_number', type: 'text' },
    { data: 'customer',     type: 'text' },
    { data: 'status',       type: 'text' },
    { data: 'total',        type: 'numeric', numericFormat: { pattern: '$0,0.00' } },
    { data: 'created_at',   type: 'date', dateFormat: 'YYYY-MM-DD', readOnly: true },
  ],

  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**Key options explained:**

| Option | What it does |
|---|---|
| `rowId: 'id'` | Tells `dataProvider` which field uniquely identifies a row. Must match the Rails primary key name. |
| `{ signal }` in `fetchRows` | Pass the `AbortSignal` to `fetch()` so in-flight requests are cancelled when the user sorts or filters before the previous response arrives. |
| Returning `json.rows` from `onRowsCreate` | Lets `dataProvider` replace client-side placeholder ids with the ids assigned by Rails. |
| `pagination: { pageSize: 10 }` | Enables the pagination toolbar. `dataProvider` passes the current page and size to `fetchRows` automatically. |
| `columnSorting: true` | Enables column header click-to-sort. The sort state is passed to `fetchRows`. |
| `filters: true` with `dropdownMenu` | Renders the column filter UI. Active conditions are passed to `fetchRows`. |
| `emptyDataState: true` | Shows a friendly illustration when the API returns zero rows (for example, when a filter matches nothing). |
| `notification: true` | Shows automatic error toasts when `fetchRows` or a mutation callback throws. Fetch failures include a **Refetch** action. |

## How it works -- Complete flow

1. **Initial load**: `dataProvider` calls `fetchRows({ page: 1, pageSize: 10 })`. Rails returns the first 10 orders and the total row count.
2. **User clicks a column header**: `columnSorting` updates its sort state and `dataProvider` calls `fetchRows` again with `sort: { prop: 'total', order: 'desc' }`. The controller's `apply_sort` checks `SORTABLE_COLUMNS`, then issues `order(total: :desc)`.
3. **User applies a column filter**: `Filters` updates its condition list and `dataProvider` calls `fetchRows` with the `filters` array. The controller's `apply_filters` parses the indexed hash and chains `.where` calls.
4. **User navigates to page 2**: `dataProvider` calls `fetchRows({ page: 2, pageSize: 10, ... })`. kaminari returns rows 11-20.
5. **User edits a cell**: `dataProvider` collects the changed cells for each row and calls `onRowsUpdate` with `[{ id: 7, total: 142.5 }]`. The frontend wraps each row in `{ id, changes }` before sending. `update_rows` applies the change.
6. **User adds a row**: `dataProvider` calls `onRowsCreate`. `create_rows` inserts the row and returns it with the database-assigned `id`. `dataProvider` updates its row map so subsequent edits target the correct id.
7. **User deletes rows**: `dataProvider` calls `onRowsRemove([3, 7, 14])`. `remove_rows` issues a single `DELETE ... WHERE id IN (3, 7, 14)`.

## What you learned

- Rails API mode (`rails new ... --api`) skips middleware you do not need for a JSON API and leaves CSRF protection off by default.
- kaminari adds `.page(n).per(size)` plus `.total_count` to any ActiveRecord relation -- exactly what you need to build a `{ rows, total_rows }` response.
- Validate every column name that reaches `order()` or a raw SQL fragment against a fixed whitelist. Never trust `params[:sort_prop]` or `params[:filters]` directly.
- Pick one case convention (snake_case or camelCase) for the whole round trip. Mixing conventions silently breaks pagination, sorting, and filtering.
- Translate `sort: { prop, order }` on the frontend to flat `sort_prop` / `sort_order` query params. This matches Rails' parameter-naming conventions and keeps the controller focused.
- Handsontable's indexed `filters[N][...]` format parses directly into Rails' nested hash params -- no custom decoder is required.
- Use `rack-cors` to allow requests from the frontend dev server. Place the middleware before `0` so it runs before Rails' routing.

## Next steps

- [Server-side data with Django](@/recipes/data-management/server-side-django/server-side-django.md)
- [Server-side data with Spring Boot](@/recipes/data-management/server-side-spring/server-side-spring.md)
- [Rows pagination guide](@/guides/rows/rows-pagination/rows-pagination.md)
- [Column filter guide](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting guide](@/guides/rows/rows-sorting/rows-sorting.md)
