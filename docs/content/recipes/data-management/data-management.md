---
title: Data Management Recipes
metaTitle: Data Management Recipes - JavaScript Data Grid | Handsontable
description: Practical recipes for connecting Handsontable to real-world data sources and backends.
permalink: /recipes/data-management
canonicalUrl: /recipes/data-management
searchCategory: Recipes
hotPlugin: false
editLink: false
id: a3f82c1d
react:
  id: c84d0e21
  metaTitle: Data Management Recipes - React Data Grid | Handsontable
angular:
  id: f72b19c8
  metaTitle: Data Management Recipes - Angular Data Grid | Handsontable
---

[[toc]]

## Overview

This section contains recipes for connecting Handsontable to external data sources using the `dataProvider` plugin. Each recipe covers a specific backend stack -- from REST APIs and Node.js to Spring Boot and Laravel -- with complete working code and step-by-step explanations.

## Getting Started

Before diving into a specific stack, read the [server-side data guide](@/guides/binding-data/data-binding.md) to understand how the `dataProvider` plugin works. It handles pagination, sorting, filtering, and CRUD through a small set of callback functions you provide. The recipes in this section show exactly what those callbacks look like for each backend.

## Available Recipes

### Server-side Integrations

- **[Server-side Data with Spring Boot](@/content/recipes/data-management/server-side-spring/server-side-spring.md)** -- Paginated data grid backed by Spring Boot 3, Spring Data JPA, and an H2 in-memory database. Covers the 1-based to 0-based page index conversion, `Sort.by()` mapping, filter deserialization, and full CRUD.

## Common Concepts

All server-side recipes use the same Handsontable configuration shape:

- `dataProvider.rowId` -- the unique row identifier returned by the server
- `dataProvider.fetchRows` -- loads a page of rows with optional sort and filter params
- `dataProvider.onRowsCreate` / `onRowsUpdate` / `onRowsRemove` -- CRUD callbacks
- `pagination.pageSize` -- controls how many rows to request per page
- `notification: true` -- shows error toasts when a fetch or mutation fails
- `emptyDataState: true` -- shows a placeholder when no rows match the current filters
