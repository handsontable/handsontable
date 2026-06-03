---
type: how-to
id: 7b3d9f2e
title: Empty Data State
metaTitle: Empty Data State - JavaScript Data Grid | Handsontable
description: Display empty data state overlays and provide user feedback when your data grid has no data to display using the Empty Data State plugin.
permalink: /empty-data-state
canonicalUrl: /empty-data-state
tags:
  - empty data state
  - empty state
  - no data
  - filters
  - user feedback
  - overlay
react:
  id: c8e4a1b5
  metaTitle: Empty Data State - React Data Grid | Handsontable
angular:
  id: 9f2e8c4a
  metaTitle: Empty Data State - Angular Data Grid | Handsontable
vue:
  id: qx83am9a
  metaTitle: Empty Data State - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and Menus
---
Use the `EmptyDataState` plugin to display a contextual overlay when the grid has no data or all rows are hidden by active filters.

[[toc]]

## Prerequisites

To use the Empty Data State plugin, import it from Handsontable:

::: only-for javascript

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
```

:::

To use the filter-aware empty state (which automatically detects when all rows are hidden by filters), also enable the [`Filters`](@/api/filters.md) plugin alongside `emptyDataState`.

## Overview

The Empty Data State plugin provides a user-friendly overlay system for Handsontable when there's no data to display. It automatically detects when your table is empty or when all data is hidden by filters, and displays an appropriate message with optional action buttons. It automatically integrates with the [Filters](@/api/filters.md) plugin to provide context-aware messages and actions.

## Basic configuration

To enable the Empty Data State plugin, set the [`emptyDataState`](@/api/options.md#emptydatastate) option to `true` or provide a configuration object.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example1.js)
@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example1.jsx)
@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/accessories-and-menus/empty-data-state/vue/example1.vue)

:::

:::

## Custom configuration

The empty data state supports customization of the title, description, and action buttons.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example2.js)
@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example2.jsx)
@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example2.ts)
@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/accessories-and-menus/empty-data-state/vue/example2.vue)

:::

:::

## Dynamic messages based on source

You can provide different messages based on the source of the empty state (e.g., filters vs. no data). This allows for more contextual user guidance.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example3.js)
@[code](@/content/guides/accessories-and-menus/empty-data-state/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example3.jsx)
@[code](@/content/guides/accessories-and-menus/empty-data-state/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example3.ts)
@[code](@/content/guides/accessories-and-menus/empty-data-state/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/accessories-and-menus/empty-data-state/vue/example3.vue)

:::

:::

## Localize empty data state

Translate default empty data state labels using the global translations mechanism. The empty data state plugin introduces the following keys to the language dictionary that you can use to translate the empty state UI:

| Key                                      | Default Value                                                  |
|------------------------------------------|----------------------------------------------------------------|
| `EMPTY_DATA_STATE_TITLE`                 | `'No data available'`                                          |
| `EMPTY_DATA_STATE_DESCRIPTION`           | `'There's nothing to display yet.'`                            |
| `EMPTY_DATA_STATE_TITLE_FILTERS`         | `'No results found'`                                           |
| `EMPTY_DATA_STATE_DESCRIPTION_FILTERS`   | `'It looks like your current filters are hiding all results.'` |
| `EMPTY_DATA_STATE_BUTTONS_FILTERS_RESET` | `'Reset filters'`                                              |

To learn more about the translation mechanism, see the [Languages guide](@/guides/internationalization/language/language.md).

## Result

After enabling the plugin, the grid displays a centered overlay message whenever there is no data to show. When the [`Filters`](@/api/filters.md) plugin is also enabled, the overlay automatically switches to a filter-specific message and shows a "Reset filters" button when all rows are hidden by active filter conditions.

## Related API reference

<div class="boxes-list">

- [Options: `emptyDataState`](@/api/options.md#emptydatastate)
- [Plugins: `EmptyDataState`](@/api/emptyDataState.md)
- [Plugins: `Filters`](@/api/filters.md)

</div>
