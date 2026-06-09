---
type: how-to
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
**Stack:** Spring Boot 3.3, Spring Data JPA, PostgreSQL 16, Flyway, Handsontable `dataProvider`

## What You'll Build

A product catalog data grid that:
- Fetches paginated rows from a Spring Boot REST API on every page change
- Sorts and filters rows on the server -- the browser never loads the full dataset
- Creates, updates, and deletes rows via dedicated endpoints
- Converts Handsontable's 1-based page index to Spring Data's 0-based `PageRequest`
- Maps Spring Data's `Page` response to the `{ rows, totalRows }` shape Handsontable expects
- Seeds a PostgreSQL database with 55 product rows on startup

## Before you begin

- Docker and Docker Compose installed
- Node.js 18 or later and npm 9 or later installed
- Basic familiarity with Spring Boot and JPA
- A Handsontable project with the `dataProvider` plugin available

## Step 1: Create the Spring Boot project

Use Spring Initializr to generate a new project with the required dependencies:

```shell
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,flyway,postgresql \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.3.5 \
  -d javaVersion=21 \
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

  <!-- PostgreSQL JDBC driver -->
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- Flyway -- manages schema migrations -->
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
  </dependency>
</dependencies>
```

**What's happening:**
- `spring-boot-starter-web` provides the embedded Tomcat server and `@RestController` support.
- `spring-boot-starter-data-jpa` brings in Hibernate and the Spring Data repository abstraction.
- `postgresql` is scoped to `runtime` — it provides the JDBC driver but is not needed at compile time.
- `flyway-core` and `flyway-database-postgresql` manage schema creation via versioned SQL migration files instead of Hibernate's `ddl-auto`.

## Step 2: Configure the database

Create or update `src/main/resources/application.properties`:

::: example #properties-config

@[code properties](@/content/recipes/data-management/server-side-spring/server/application.properties)

:::

**What's happening:**
- The datasource URL, username, and password are read from environment variables (`DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`) with sensible local defaults. In the Docker Compose setup these are injected automatically.
- `ddl-auto=validate` tells Hibernate to verify that the schema matches the entity mapping on startup, but to never modify the database. Flyway owns all DDL changes.
- `flyway.enabled=true` tells Spring Boot to run pending migrations from `src/main/resources/db/migration` before the application context finishes starting. The migration `V1__create_products_table.sql` creates the `products` table on the first run.

## Step 3: Create the Product entity

::: example #java-product

@[code java](@/content/recipes/data-management/server-side-spring/server/Product.java)

:::

**What's happening:**
- `@Entity` and `@Table(name = "products")` tell JPA to map this class to the `products` table.
- `@Id` and `@GeneratedValue(strategy = GenerationType.IDENTITY)` configure auto-increment. The generated `id` value is what Handsontable references via `dataProvider.rowId: 'id'`.
- `@Column(nullable = false)` enforces database-level constraints on `name` and `sku`.
- `@Column(precision = 10, scale = 2)` stores `price` with two decimal places, matching the `numeric` cell type in the frontend column definition.

**Why keep the entity minimal?**
Each field maps directly to a column the Handsontable grid displays. Adding only what the grid needs keeps the API response small and the mapping code concise.

## Step 4: Add the repository interface

::: example #java-product-repository

@[code java](@/content/recipes/data-management/server-side-spring/server/ProductRepository.java)

:::

**What's happening:**
- `JpaRepository<Product, Long>` provides `save`, `findById`, `deleteAllById`, and `count` methods -- everything needed for CRUD without writing any SQL.
- `JpaSpecificationExecutor<Product>` adds the `findAll(Specification, Pageable)` overload. This is the key method used in `ProductService` to apply server-side filters as JPA predicates.

## Step 5: Seed the database

::: example #java-data-initializer

@[code java](@/content/recipes/data-management/server-side-spring/server/DataInitializer.java)

:::

**What's happening:**
- `CommandLineRunner` is a Spring Boot callback that runs after the application context starts. Returning it from a `@Bean` method registers it automatically.
- The `if (repository.count() == 0)` guard prevents duplicate rows if the bean runs more than once during testing.
- `repository.saveAll(List.of(...))` inserts all 55 rows in a single batch rather than 55 separate INSERT statements.

**Why 55 rows?**
The default `pagination.pageSize` is 10, so 55 rows creates 6 pages. This makes the pagination controls visible and meaningful from the first load.

## Step 6: Build the service

::: example #java-product-service

@[code java](@/content/recipes/data-management/server-side-spring/server/ProductService.java)

:::

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

::: example #java-product-controller

@[code java](@/content/recipes/data-management/server-side-spring/server/ProductController.java)

:::

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

::: example #java-cors-config

@[code java](@/content/recipes/data-management/server-side-spring/server/CorsConfig.java)

:::

**What's happening:**
- `WebMvcConfigurer` is a Spring MVC callback interface. Implementing `addCorsMappings` is the idiomatic way to configure CORS globally without annotations on every controller.
- `allowedOrigins("*")` is safe for a local development recipe. In production, replace `"*"` with the exact frontend origin (e.g. `"https://your-app.com"`) to prevent cross-site request abuse.
- Explicitly listing `allowedMethods` keeps the CORS headers narrow -- only the four HTTP methods the Handsontable callbacks use are allowed.

## Step 9: Wire up Handsontable

Start the backend and the Vite dev server with `bash setup.sh` (or `make setup`), then open `http://localhost:5173`. The backend runs on `http://localhost:8080` inside Docker; Vite proxies all `/api/*` requests to it so no CORS configuration is needed in the browser. The complete frontend code is in the files below.

::: only-for javascript

::: example #javascript-spring --code-only

@[code js](@/content/recipes/data-management/server-side-spring/javascript/example1.js)

:::

:::

::: only-for typescript

::: example #typescript-spring --code-only

@[code ts](@/content/recipes/data-management/server-side-spring/javascript/example1.ts)

:::

:::

::: only-for react

::: example #react-spring --code-only

@[code](@/content/recipes/data-management/server-side-spring/react/example1.jsx)

:::

:::

::: only-for angular

::: example #angular-spring --code-only

@[code](@/content/recipes/data-management/server-side-spring/angular/example1.ts)
@[code](@/content/recipes/data-management/server-side-spring/angular/example1.html)

:::

:::

**What's happening:**

### `buildUrl` helper

`buildUrl` assembles the query string for `fetchRows`. It skips `undefined` and `null` values so that optional parameters -- `sortProp`, `sortOrder`, and `filters` -- are only appended to the URL when they are actually set. Passing `undefined` to `URLSearchParams.set()` would append the literal string `"undefined"` instead of omitting the parameter.

### `fetchRows`

Handsontable calls `fetchRows` whenever the user changes the page, sorts a column, or applies a filter. The function:
1. Maps Handsontable's parameter shape to the Spring Boot query parameter names (`sortProp`, `sortOrder`).
2. Serializes the `filters` array to a JSON string -- the controller receives it as a `String` query parameter and the service deserializes it with Jackson.
3. Passes the `AbortSignal` to `fetch` so the browser cancels in-flight requests when a faster interaction follows (e.g., the user jumps two pages ahead quickly).
4. Throws on a non-ok response so `notification: true` displays an error toast automatically.
5. Returns `{ rows, totalRows }` -- Handsontable uses `totalRows` to calculate the total number of pages.

### `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`

`onRowsCreate` **must return** the array of rows created by the server (including server-assigned `id` values). Handsontable uses the returned rows to update its internal row map so that subsequent updates and deletes reference the correct primary keys. It also shows a "Row added" success notification with the generated IDs. The controller accepts the payload as `CreateRowsPayload`.

Cell edits via `onRowsUpdate` appear in the grid immediately (optimistic update). Each element sent to the server is `{ id, changes }` where `changes` contains only the columns the user modified -- the service applies those changes selectively in `ProductService.updateRows()`. If the server returns a non-2xx response or any callback throws, Handsontable rolls back the values and fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).

`onRowsRemove` sends an array of `id` values matching `dataProvider.rowId`. The controller deserializes them as `List<Long>` and passes them to `repository.deleteAllById()`.

### `beforeRowsMutation`

`beforeRowsMutation` fires before any create, update, or remove operation. Returning `false` cancels the operation -- `onRowsRemove` is not called and no rows are deleted on the server.

Because `beforeRowsMutation` is synchronous and checks for a strict `=== false` return, you cannot use `window.confirm()` or any async dialog. Instead, use `notification.showMessage()` with `variant: 'warning'` and two action buttons. Cancel the first attempt by returning `false`, then on **Delete** re-issue the remove via `hot.getPlugin('dataProvider').removeRows(rowsRemove)`. The `removeConfirmed` flag lets the second pass through without re-prompting.

### `notification: true` and `emptyDataState: true`

`notification: true` enables the built-in error toast. When `fetchRows` or a mutation callback throws or the server returns a non-2xx status, Handsontable shows a dismissible error message. Fetch failures also add a **Refetch** action that calls `fetchRows` again.

`emptyDataState: true` shows a placeholder message when the current filter combination returns zero rows, instead of leaving the grid blank.

`contextMenu: true` enables the right-click context menu with "Insert row above / below" and "Remove row" items.

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
14. **User inserts a row**: The user right-clicks and selects **Insert row below**. `onRowsCreate` fires with `{ position: 'below', referenceRowId: 4, rowsAmount: 1 }`. Spring creates a blank row and returns it. `dataProvider` updates its internal row map and Handsontable shows a "Row added" success notification.
15. **User deletes rows**: The user selects two rows and chooses **Remove rows**. `beforeRowsMutation` intercepts the operation, returns `false`, and shows a warning notification with **Delete** and **Cancel** action buttons. On **Delete**, `onRowsRemove` fires with `[4, 7]`. Spring deletes both rows.

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
- Compare with the [Symfony recipe](@/recipes/data-management/server-side-symfony/server-side-symfony.md) to see the same Handsontable frontend wired to a PHP/Symfony backend using the same endpoint shapes.
