---
type: how-to
id: 85u4f81b
title: Rows pagination
metaTitle: Rows pagination - JavaScript Data Grid | Handsontable
description: The pagination component splits the data into a range of pages, allowing users to easily navigate through large data sets.
permalink: /rows-pagination
canonicalUrl: /rows-pagination
tags:
  - pagination
  - client-side pagination
  - slice data
  - paging
  - page numbers
  - navigation
  - page size
  - bar
  - counter
  - limit
  - range of pages
  - chunks
react:
  id: 5inhebcn
  metaTitle: Row pagination - React Data Grid | Handsontable
angular:
  id: lt6sgwts
  metaTitle: Row pagination - Angular Data Grid | Handsontable
vue:
  id: 57pnumth
  metaTitle: Row pagination - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: updated
---
Split large data sets into pages to improve usability and rendering performance. Pagination operates fully on the client side and automatically recomputes the total page count whenever rows are added, removed, filtered, or otherwise modified.

[[toc]]

## Pagination demo

Use the controls below the grid to switch between pages.

::: only-for javascript
::: example #example1 --js 1 --ts 2

@[code collapse={8-107, 117-162}](@/content/guides/rows/rows-pagination/javascript/example1.js)
@[code collapse={8-107, 117-162}](@/content/guides/rows/rows-pagination/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code collapse={8-107, 126-156}](@/content/guides/rows/rows-pagination/react/example1.jsx)
@[code collapse={8-107, 126-156}](@/content/guides/rows/rows-pagination/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code collapse={16-115, 122-168}](@/content/guides/rows/rows-pagination/angular/example1.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example1.html)

:::
:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example1.vue)

:::

:::

## Enable pagination

To enable pagination set the [`pagination`](@/api/options.md#pagination) option to `true`.

```javascript
const configurationOptions = {
  pagination: true,
};
```

Defining the option as `true` is equivalent to defining the following options:

```javascript
const configurationOptions = {
  pagination: {
    pageSize: 10,
    pageSizeList: ['auto', 5, 10, 20, 50, 100],
    initialPage: 1,
    showPageSize: true,
    showCounter: true,
    showNavigation: true,
    uiContainer: null,
  },
};
```

## Configure pagination

You can customize pagination using available settings, such as showing or hiding specific UI sections like the page size selector, page counter, or page navigation.

Control aspects such as the number of rows per page, the initial page on load, or whether the grid should automatically adjust page size based on the container's height.

You can configure the following options:
```javascript
const configurationOptions = {
  pagination: {
    // Set number of rows per page. If the value is `auto` then the
    // page size is calculated
    // based on available height.
    pageSize: 20,
    // Provide a list of selectable page sizes
    pageSizeList: ['auto', 10, 20, 50],
    // Set the initial page when the grid loads
    initialPage: 2,
    // Show or hide the page size section
    showPageSize: false,
    // Show or hide the page counter section
    showCounter: true,
    // Show or hide the page navigation section
    showNavigation: true,
    // Custom container where the pagination UI will be injected
    // (optional)
    uiContainer: null,
  }
};
```

In the data grid below, several pagination options are applied to provide a customized experience. The demo allows you to resize the table container and observe how the auto page size feature (`pageSize: 'auto'`) dynamically adjusts the number of visible rows to fit the available space.

::: only-for javascript
::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-pagination/javascript/example2.html)
@[code collapse={8-107, 124-169}](@/content/guides/rows/rows-pagination/javascript/example2.js)
@[code collapse={8-107, 124-169}](@/content/guides/rows/rows-pagination/javascript/example2.ts)

:::
:::

::: only-for react
::: example #example2 :react --js 1 --css 2 --ts 3

@[code collapse={8-107, 137-167}](@/content/guides/rows/rows-pagination/react/example2.jsx)
@[code](@/content/guides/rows/rows-pagination/react/example2.css)
@[code collapse={8-107, 137-167}](@/content/guides/rows/rows-pagination/react/example2.tsx)

:::
:::

::: only-for angular
::: example #example2 :angular --ts 1 --html 2

@[code collapse={16-115, 142-188}](@/content/guides/rows/rows-pagination/angular/example2.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example2.html)

:::
:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example2.vue)

:::

:::

## Control pagination programmatically

Build your own pagination UI using API methods such as [`setPage()`](@/api/pagination.md#setpage), [`nextPage()`](@/api/pagination.md#nextpage), [`prevPage()`](@/api/pagination.md#prevpage), and more. For a complete list of available methods and hooks, see the [`Pagination`](@/api/pagination.md) plugin API reference.

::: only-for javascript
::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-pagination/javascript/example3.html)
@[code collapse={8-107, 122-167}](@/content/guides/rows/rows-pagination/javascript/example3.js)
@[code collapse={8-107, 123-168}](@/content/guides/rows/rows-pagination/javascript/example3.ts)

:::
:::

::: only-for react
::: example #example3 :react --js 1 --ts 2

@[code collapse={8-107, 200-230}](@/content/guides/rows/rows-pagination/react/example3.jsx)
@[code collapse={8-107, 200-230}](@/content/guides/rows/rows-pagination/react/example3.tsx)

:::
:::

::: only-for angular
::: example #example3 :angular --ts 1 --html 2

@[code collapse={42-141, 154-200}](@/content/guides/rows/rows-pagination/angular/example3.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example3.html)

:::
:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example3.vue)

:::

:::

## Choose where to display the pagination UI

By default, the pagination UI is displayed at the bottom of the grid. You can change the place of the pagination component by setting the [`uiContainer`](@/api/options.md#uicontainer) option to a custom container element.

::: only-for javascript
::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-pagination/javascript/example4.html)
@[code collapse={8-107, 119-164}](@/content/guides/rows/rows-pagination/javascript/example4.js)
@[code collapse={8-107, 119-164}](@/content/guides/rows/rows-pagination/javascript/example4.ts)

:::
:::

::: only-for react
::: example #example4 :react --js 1 --css 2 --ts 3

@[code collapse={8-107, 140-170}](@/content/guides/rows/rows-pagination/react/example4.jsx)
@[code](@/content/guides/rows/rows-pagination/react/example4.css)
@[code collapse={8-107, 140-170}](@/content/guides/rows/rows-pagination/react/example4.tsx)

:::
:::

::: only-for angular
::: example #example4 :angular --ts 1 --html 2

@[code collapse={16-115, 144-190}](@/content/guides/rows/rows-pagination/angular/example4.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example4.html)

:::
:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example4.vue)

:::

:::

## Modify paged data

Sometimes you need to modify data only on the currently visible page. Core method like [`setDataAtCell`](@/api/core.md#setdataatcell) operates on all rows, including those hidden by pagination. To modify data only on the current page, you can use the [`getPaginationData`](@/api/pagination.md#getpaginationdata) method to get the pagination state and use it in conjunction with Core method.

::: only-for javascript
::: example #example5 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-pagination/javascript/example5.html)
@[code collapse={8-107, 116-161}](@/content/guides/rows/rows-pagination/javascript/example5.js)
@[code collapse={8-107, 117-162}](@/content/guides/rows/rows-pagination/javascript/example5.ts)

:::
:::

::: only-for react
::: example #example5 :react --js 1 --ts 2

@[code collapse={8-107, 158-188}](@/content/guides/rows/rows-pagination/react/example5.jsx)
@[code collapse={8-107, 159-189}](@/content/guides/rows/rows-pagination/react/example5.tsx)

:::
:::

::: only-for angular
::: example #example5 :angular --ts 1 --html 2

@[code collapse={25-124, 131-177}](@/content/guides/rows/rows-pagination/angular/example5.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example5.html)

:::
:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example5.vue)

:::

:::

## Use pagination hooks

You can run your code before or after different stages of pagination, using the following [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md):

- [`beforePageChange()`](@/api/hooks.md#beforepagechange)
- [`afterPageChange()`](@/api/hooks.md#afterpagechange)
- [`beforePageSizeChange()`](@/api/hooks.md#beforepagesizechange)
- [`afterPageSizeChange()`](@/api/hooks.md#afterpagesizechange)
- [`afterPageSizeVisibilityChange()`](@/api/hooks.md#afterpagesizevisibilitychange)
- [`afterPageCounterVisibilityChange()`](@/api/hooks.md#afterpagecountervisibilitychange)
- [`afterPageNavigationVisibilityChange()`](@/api/hooks.md#afterpagenavigationvisibilitychange)

::: only-for javascript
```js
const configurationOptions = {
  beforePageChange() {
    // add your code here
    return false; // to block page change
  },
  afterPageChange() {
    // add your code here
  },
  beforePageSizeChange() {
    // add your code here
    return false; // to block page size change
  },
  // ...
};
```
:::

::: only-for react
```jsx
<HotTable
  beforePageChange={() => {
    // add your code here
    return false; // to block page change
  }}
  afterPageChange={() => {
    // add your code here
  }}
  beforePageSizeChange={() => {
    // add your code here
    return false; // to block page size change
  }}
  // ...
/>
```
:::

## Localize pagination

Translate default pagination labels - such as "Page size:", "Page" and more - using the global translations mechanism. The pagination introduces the following keys to the language dictionary that you can use to translate the pagination UI:
- `PAGINATION_SECTION = 'Pagination'`
- `PAGINATION_PAGE_SIZE_SECTION = 'Page size'`
- `PAGINATION_PAGE_SIZE_AUTO = 'Auto'`
- `PAGINATION_COUNTER_SECTION = '[start] - [end] of [total]'`
- `PAGINATION_NAV_SECTION = 'Page [currentPage] of [totalPages]'`
- `PAGINATION_FIRST_PAGE = 'Go to first page'`
- `PAGINATION_PREV_PAGE = 'Go to previous page'`
- `PAGINATION_NEXT_PAGE = 'Go to next page'`
- `PAGINATION_LAST_PAGE = 'Go to last page'`

To learn more about the translation mechanism, see the [Languages guide](@/guides/internationalization/language/language.md).

The example below demonstrates how to customize the translation of the pagination counter and navigation sections.

::: only-for javascript
::: example #example6 --js 1 --ts 2

@[code collapse={8-107, 129-174}](@/content/guides/rows/rows-pagination/javascript/example6.js)
@[code collapse={8-107, 129-174}](@/content/guides/rows/rows-pagination/javascript/example6.ts)

:::
:::

::: only-for react
::: example #example6 :react --js 1 --ts 2

@[code collapse={8-107, 139-169}](@/content/guides/rows/rows-pagination/react/example6.jsx)
@[code collapse={8-107, 139-169}](@/content/guides/rows/rows-pagination/react/example6.tsx)

:::
:::

::: only-for angular
::: example #example6 :angular --ts 1 --html 2

@[code collapse={16-115, 139-185}](@/content/guides/rows/rows-pagination/angular/example6.ts)
@[code](@/content/guides/rows/rows-pagination/angular/example6.html)

:::
:::

::: only-for vue

::: example #example6 :vue3

@[code](@/content/guides/rows/rows-pagination/vue/example6.vue)

:::

:::

## Customize pagination UI

You can customize the look of each pagination element by assigning new values to the CSS variables defined in our main, horizon and classic themes, aligning them with your app's design guidelines. For a list of available variables, see the [Handsontable Design System](@/guides/styling/design-system/design-system.md) on Figma.

Within the plugin the following CSS variables are available:

 - `--ht-pagination-bar-foreground-color`: Controls the text color of pagination bar elements;
 - `--ht-pagination-bar-background-color`: Sets the background color of the pagination bar;
 - `--ht-pagination-bar-horizontal-padding`: Defines the left and right padding of the pagination bar;
 - `--ht-pagination-bar-vertical-padding`: Controls the top and bottom padding of the pagination bar;

## Importing the pagination module

You can reduce the size of your bundle by importing and using only the [modules](@/guides/tools-and-building/modules/modules.md) that you need.

To use pagination, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules/modules.md#import-the-base-module)
- The [`Pagination`](@/api/pagination.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';

// import the Pagination plugin
import { registerPlugin, Pagination } from 'handsontable/plugins';

// register the Pagination plugin
registerPlugin(Pagination);
```

## Known limitations

When pagination is enabled:

- [`fixedRowsTop`](@/api/options.md#fixedrowstop) and [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom) options should be disabled.
- [`NestedRows`](@/api/nestedRows.md) and [`MergeCells`](@/api/mergeCells.md) plugins should be disabled.
- The [`height`](@/api/options.md#height) option set as `auto` is not supported when the `pageSize: 'auto'` is set.
- Pagination always displays a fixed number of rows per page (default is `10`), regardless of data changes such as hiding, trimming, filtering, removing, adding, or pasting rows - unless `pageSize: 'auto'` is set.

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 16.1: Row Pagination, Loading Plugin, and Long-Term Support Policy](https://handsontable.com/blog/handsontable-16.1-row-pagination-loading-plugin-and-long-term-support-policy)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [pagination](@/api/options.md#pagination)
- [fixedRowsBottom](@/api/options.md#fixedrowsbottom)
- [fixedRowsTop](@/api/options.md#fixedrowstop)

</div>

**Hooks**

<div class="boxes-list">

- [beforePageChange()](@/api/hooks.md#beforepagechange)
- [afterPageChange()](@/api/hooks.md#afterpagechange)
- [beforePageSizeChange()](@/api/hooks.md#beforepagesizechange)
- [afterPageSizeChange()](@/api/hooks.md#afterpagesizechange)
- [afterPageSizeVisibilityChange()](@/api/hooks.md#afterpagesizevisibilitychange)
- [afterPageCounterVisibilityChange()](@/api/hooks.md#afterpagecountervisibilitychange)
- [afterPageNavigationVisibilityChange()](@/api/hooks.md#afterpagenavigationvisibilitychange)

</div>

**Plugins**

<div class="boxes-list">

- [Pagination](@/api/pagination.md)
- [NestedRows](@/api/nestedRows.md)
- [MergeCells](@/api/mergeCells.md)

</div>

## Result

After completing this guide, your grid divides rows into pages with built-in navigation controls. You can configure the page size, customize the UI position, control pagination programmatically, and react to page changes using hooks.

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/labels/Pagination) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>
