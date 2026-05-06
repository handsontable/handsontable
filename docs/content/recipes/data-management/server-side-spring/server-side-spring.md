---
type: tutorial
id: b7e4912f
title: Server-side Data with Spring Boot
metaTitle: Server-side Data with Spring Boot - JavaScript Data Grid | Handsontable
description: Wire Handsontable's dataProvider plugin to a Spring Boot 3 backend with JPA-backed pagination, server-side sorting and filtering, and full CRUD operations using H2.
permalink: /recipes/data-management/server-side-spring
canonicalUrl: /recipes/data-management/server-side-spring
tags:
  - spring-boot
  - server-side
  - data-provider
  - java
  - recipes
react:
  id: tl8m1ydh
  metaTitle: Server-side data with Spring Boot - React Data Grid | Handsontable
angular:
  id: d7f9h1j3
  metaTitle: Server-side Data with Spring Boot - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
---

This tutorial shows how to connect Handsontable's `dataProvider` plugin to a Spring Boot 3 backend. You will build a product catalog grid that loads data from a REST API with server-side pagination, sorting, and filtering, and that persists row create, update, and delete operations to a JPA-managed H2 database.

<a class="github-example-cta" href="https://github.com/handsontable/examples/tree/master/server-examples/spring" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
  View full example on GitHub
</a>

**Difficulty:** Intermediate
**Time:** ~45 minutes
**Stack:** Spring Boot 3, Spring Data JPA, H2 (in-memory), Handsontable `dataProvider`

## What You'll Build

A product catalog data grid that:
- Fetches paginated rows from a Spring Boot REST API on every page change
- Sorts and filters rows on the server -- the browser never loads the full dataset
- Creates, updates, and deletes rows via dedicated endpoints
- Converts Handsontable's 1-based page index to Spring Data's 0-based `PageRequest`
- Maps Spring Data's `Page` response to the `{ rows, totalRows }` shape Handsontable expects
- Seeds an H2 in-memory database with 55 product rows on startup

## Before you begin

- Java 17 or later and Maven or Gradle installed
- Basic familiarity with Spring Boot and JPA
- A Handsontable project with the `dataProvider` plugin available

## Step 1: Create the Spring Boot project

Use Spring Initializr to generate a new project with the required dependencies:

```shell
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,h2,validation \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d groupId=com.example \
  -d artifactId=products \
  -d name=products \
  -o products.zip && unzip products.zip -d products
```

Or add the following to an existing `pom.xml`:

```xml
<dependencies>
  <!-- REST endpoints -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!-- JPA + Hibernate ORM -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>

  <!-- H2 in-memory database -- zero setup, no installation needed -->
  <dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- Bean Validation for request DTOs -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
</dependencies>
```

**What's happening:**
- `spring-boot-starter-web` provides the embedded Tomcat server and `@RestController` support.
- `spring-boot-starter-data-jpa` brings in Hibernate and the Spring Data repository abstraction.
- `h2` is scoped to `runtime` so it is available during development but excluded from production builds.
- `spring-boot-starter-validation` enables `@Valid` and `@RequestBody` validation annotations on DTOs.

## Step 2: Configure the H2 database

Create or update `src/main/resources/application.properties`:

@[code](@/content/recipes/data-management/server-side-spring/server/application.properties)

**What's happening:**
- `jdbc:h2:mem:products` creates an in-memory database named `products`. The data exists only while the application is running.
- `DB_CLOSE_DELAY=-1` keeps the database open for the lifetime of the JVM. Without it, H2 closes the connection pool after the first connection is released.
- `ddl-auto=create-drop` tells Hibernate to generate the schema from your entities on startup and drop it on shutdown. This is appropriate for a recipe but you should switch to `validate` or `none` in production.
- `h2.console.enabled=true` exposes the H2 web console at `http://localhost:8080/h2-console` so you can inspect the data during development.

## Step 3: Create the Product entity

@[code java](@/recipes/data-management/server-side-spring/server/Product.java)

**What's happening:**
- `@Entity` and `@Table(name = "products")` tell JPA to map this class to the `products` table.
- `@Id` and `@GeneratedValue(strategy = GenerationType.IDENTITY)` configure auto-increment. The generated `id` value is what Handsontable references via `dataProvider.rowId: 'id'`.
- `@Column(nullable = false)` enforces database-level constraints on `name` and `sku`.
- `@Column(precision = 10, scale = 2)` stores `price` with two decimal places, matching the `numeric` cell type in the frontend column definition.

**Why keep the entity minimal?**
Each field maps directly to a column the Handsontable grid displays. Adding only what the grid needs keeps the API response small and the mapping code concise.

## Step 4: Add the repository interface

@[code java](@/recipes/data-management/server-side-spring/server/ProductRepository.java)

**What's happening:**
- `JpaRepository<Product, Long>` provides `save`, `findById`, `deleteAllById`, and `count` methods -- everything needed for CRUD without writing any SQL.
- `JpaSpecificationExecutor<Product>` adds the `findAll(Specification, Pageable)` overload. This is the key method used in `ProductService` to apply server-side filters as JPA predicates.

## Step 5: Seed the database

@[code java](@/recipes/data-management/server-side-spring/server/DataInitializer.java)

**What's happening:**
- `CommandLineRunner` is a Spring Boot callback that runs after the application context starts. Returning it from a `@Bean` method registers it automatically.
- The `if (repository.count() == 0)` guard prevents duplicate rows if the bean runs more than once during testing.
- `repository.saveAll(List.of(...))` inserts all 55 rows in a single batch rather than 55 separate INSERT statements.

**Why 55 rows?**
The default `pagination.pageSize` is 10, so 55 rows creates 6 pages. This makes the pagination controls visible and meaningful from the first load.

## Step 6: Build the service

@[code java](@/recipes/data-management/server-side-spring/server/ProductService.java)

**What's happening:**

This is the core of the backend integration. The service translates between Handsontable's data model and Spring Data's abstractions.

### Page index conversion

```java
Pageable pageable = PageRequest.of(page - 1, pageSize, sort);
```

Handsontable sends `page: 1` for the first page. Spring Data's `PageRequest.of()` expects a 0-based index. Subtracting 1 before passing to `PageRequest.of()` is the single conversion point -- the rest of the code uses Spring's model.

### Sort mapping

```java
Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder)
    ? Sort.Direction.DESC
    : Sort.Direction.ASC;

return Sort.by(direction, sortProp);
```

Handsontable sends `{ prop: 'price', order: 'desc' }`. The service converts `order` to a `Sort.Direction` enum value and builds a `Sort` object. The `ALLOWED_COLUMNS` whitelist rejects any `sortProp` value that is not a known column name, preventing SQL injection.

### Filter deserialization

```java
List<Map<String, Object>> filters = objectMapper.readValue(
    filtersJson,
    new TypeReference<>() {}
);
```

Handsontable sends filters as a JSON array in a single query parameter -- for example `[{"column":"category","value":"Electronics"}]`. The controller receives this as a raw `String`, and the service deserializes it with Jackson's `ObjectMapper`. Each entry becomes a `LIKE` predicate applied to the matching column.

### Page response mapping

```java
response.put("rows", result.getContent());
response.put("totalRows", result.getTotalElements());
```

Spring Data's `Page<Product>` contains `content` (the row list), `totalElements` (the full count), and pagination metadata. Handsontable needs only `rows` and `totalRows`, so the service extracts those two values and discards the rest.

### `@Transactional` on mutations

The class-level `@Transactional` annotation wraps every public method in a single database transaction. If any step inside `updateRows` or `removeRows` throws, the whole operation rolls back automatically. The `findAll` method overrides this with `@Transactional(readOnly = true)` to allow Hibernate to skip dirty-checking during reads.

## Step 7: Create the REST controller

@[code java](@/recipes/data-management/server-side-spring/server/ProductController.java)

**What's happening:**
- `@RestController` combines `@Controller` and `@ResponseBody`, so every method return value is serialized to JSON automatically.
- `@RequestMapping("/api/products")` is the base path for all four endpoints.
- The `@GetMapping` method uses `@RequestParam` with `required = false` for optional parameters. Spring returns `null` for absent params, which the service handles with null checks.
- The `@PostMapping`, `@PatchMapping`, and `@DeleteMapping` methods receive their payloads as `@RequestBody` and return `200 OK` with no body. Handsontable only checks for a non-error HTTP status on mutation responses.

**Endpoint summary:**

| HTTP method | Path | Handsontable callback |
|---|---|---|
| `GET` | `/api/products` | `fetchRows` |
| `POST` | `/api/products/create-rows` | `onRowsCreate` |
| `PATCH` | `/api/products/update-rows` | `onRowsUpdate` |
| `DELETE` | `/api/products/remove-rows` | `onRowsRemove` |

## Step 8: Configure CORS

@[code java](@/recipes/data-management/server-side-spring/server/CorsConfig.java)

**What's happening:**
- `WebMvcConfigurer` is a Spring MVC callback interface. Implementing `addCorsMappings` is the idiomatic way to configure CORS globally without annotations on every controller.
- `allowedOrigins("*")` is safe for a local development recipe. In production, replace `"*"` with the exact frontend origin (e.g. `"https://your-app.com"`) to prevent cross-site request abuse.
- Explicitly listing `allowedMethods` keeps the CORS headers narrow -- only the four HTTP methods the Handsontable callbacks use are allowed.

## Step 9: Wire up Handsontable

With the server running on `http://localhost:8080`, configure Handsontable to use the `dataProvider` plugin. The complete frontend code is in the files below.

::: only-for javascript

@[code js](@/recipes/data-management/server-side-spring/javascript/example1.js)

:::

::: only-for typescript

@[code ts](@/recipes/data-management/server-side-spring/javascript/example1.ts)

:::

::: only-for react

@[code](@/content/recipes/data-management/server-side-spring/react/example1.jsx)

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/server-side-spring/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-spring/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

```javascript
function buildUrl(base, params) {
  const url = new URL(base, window.location.origin);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
```

`buildUrl` assembles the query string for `fetchRows`. It skips `undefined` and `null` values so that optional parameters -- `sortProp`, `sortOrder`, and `filters` -- are only appended to the URL when they are actually set. Passing `undefined` to `URLSearchParams.set()` would append the literal string `"undefined"` instead of omitting the parameter.

### `fetchRows`

```javascript
fetchRows: async ({ page, pageSize, sort, filters }, { signal }) => {
  const url = buildUrl('/api/products', {
    page,
    pageSize,
    sortProp: sort?.prop,
    sortOrder: sort?.order,
    filters: filters ? JSON.stringify(filters) : undefined,
  });

  const res = await fetch(url, { signal });
  const json = await res.json();

  return { rows: json.rows, totalRows: json.totalRows };
},
```

Handsontable calls `fetchRows` whenever the user changes the page, sorts a column, or applies a filter. The function:
1. Maps Handsontable's parameter shape to the Spring Boot query parameter names.
2. Serializes the `filters` array to a JSON string -- the controller receives it as a `String` query parameter and the service deserializes it.
3. Passes the `AbortSignal` to `fetch` so the browser cancels in-flight requests when a faster interaction follows (e.g., the user jumps two pages ahead quickly).
4. Returns `{ rows, totalRows }` -- Handsontable uses `totalRows` to calculate the total number of pages.

### `onRowsCreate`

```javascript
onRowsCreate: async (payload) => {
  await fetch('/api/products/create-rows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
},
```

Handsontable passes a `payload` object with `position`, `referenceRowId`, and `rowsAmount`. The controller accepts this as `CreateRowsPayload`. After the request completes, Handsontable calls `fetchRows` again to reload the current page with the newly created rows.

### `onRowsUpdate`

```javascript
onRowsUpdate: async (rows) => {
  await fetch('/api/products/update-rows', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });
},
```

Handsontable batches all cell edits from a single user action into one array. Each element is `{ id, changes }` where `changes` contains only the columns the user modified. The server applies those changes selectively in `ProductService.updateRows()`.

### `onRowsRemove`

```javascript
onRowsRemove: async (rowIds) => {
  await fetch('/api/products/remove-rows', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowIds),
  });
},
```

Handsontable passes an array of `id` values matching `dataProvider.rowId`. The controller deserializes them as `List<Long>` and passes them to `repository.deleteAllById()`.

### `notification: true` and `emptyDataState: true`

```javascript
notification: true,
emptyDataState: true,
```

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws or the server returns a non-2xx status, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action that calls `fetchRows` again.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows, instead of leaving the grid blank.

## How It Works -- Complete Flow

1. **Initial load**: Handsontable calls `fetchRows` with `page: 1`, `pageSize: 10`, no sort, no filters.
2. **Server receives**: `GET /api/products?page=1&pageSize=10`
3. **Service converts**: `PageRequest.of(0, 10, Sort.by(ASC, "id"))` -- page index shifted by -1.
4. **Spring Data queries**: `SELECT * FROM products ORDER BY id ASC LIMIT 10`.
5. **Response mapping**: `{ rows: [...10 products...], totalRows: 55 }` returned to the grid.
6. **User sorts by price descending**: Handsontable calls `fetchRows` with `sort: { prop: 'price', order: 'desc' }`.
7. **Server receives**: `GET /api/products?page=1&pageSize=10&sortProp=price&sortOrder=desc`
8. **Service builds**: `Sort.by(DESC, "price")` and creates a new `PageRequest`.
9. **User applies a filter**: Handsontable calls `fetchRows` with `filters: [{ column: 'category', value: 'Electronics' }]`.
10. **Server receives**: `GET /api/products?...&filters=[{"column":"category","value":"Electronics"}]`
11. **Service deserializes**: Jackson parses the JSON string into `List<Map<String, Object>>`, which becomes a JPA `LIKE '%electronics%'` predicate.
12. **User edits a cell**: Handsontable calls `onRowsUpdate` with `[{ id: 4, changes: { price: 599.00 } }]`.
13. **Server receives**: `PATCH /api/products/update-rows` -- service finds the product by ID and updates only the `price` field.

## What you learned

- How to convert Handsontable's 1-based page index to Spring Data's 0-based `PageRequest.of(page - 1, pageSize, sort)`.
- How to map Spring Data's `Page<T>` response to the `{ rows, totalRows }` shape the `dataProvider` plugin expects.
- How to whitelist sort columns to prevent SQL injection through the `sortProp` query parameter.
- How to deserialize Handsontable's JSON filter array from a single query parameter using Jackson's `ObjectMapper`.
- How to use `JpaSpecificationExecutor` to apply dynamic `LIKE` predicates without writing raw queries.
- How to use `@Transactional(readOnly = true)` on reads and `@Transactional` on mutations for correct transaction boundaries.
- How to configure CORS with `WebMvcConfigurer` so the browser can reach the Spring Boot API from a different origin.
- How `notification: true` and `emptyDataState: true` improve the user experience when the server is slow or returns no results.

## Next steps

- Replace H2 with a persistent database (PostgreSQL, MySQL) by swapping the datasource in `application.properties` and changing `ddl-auto` to `validate`.
- Add `@Valid` to the controller DTOs and define Bean Validation constraints (e.g. `@NotBlank` on `name`, `@Positive` on `price`) to return structured error responses when the user saves invalid data.
- Secure the API with Spring Security: require authentication for mutation endpoints while keeping `GET /api/products` public.
- Compare with the [Laravel recipe](@/recipes/data-management/server-side-laravel/server-side-laravel.md) to see the same Handsontable frontend wired to a PHP backend using the same endpoint shapes.
