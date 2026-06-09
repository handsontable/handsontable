---
type: how-to
title: Rows sorting
metaTitle: Rows sorting - JavaScript Data Grid | Handsontable
description: Sort rows alphabetically or numerically, in ascending, descending or a custom order, by one or multiple columns.
permalink: /rows-sorting
canonicalUrl: /rows-sorting
tags:
  - sorting
  - row sorting
  - column sorting
  - columnSorting
  - multicolumn sorting
  - multi-column sorting
  - multiColumnSorting
  - row ordering
  - order by
  - sort ascending
  - sort descending
  - highest to lowest
  - unordered data
  - sortEmptyCells
  - data sorting
  - sort data
  - sort rows
  - sort columns
react:
  metaTitle: Rows sorting - React Data Grid | Handsontable
angular:
  metaTitle: Rows sorting - Angular Data Grid | Handsontable
vue:
  metaTitle: Rows sorting - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
---
Sort rows alphabetically or numerically, in ascending, descending, or a custom order, by one or multiple columns.

[[toc]]

## Overview

Handsontable provides two plugins for sorting rows:

- [`ColumnSorting`](@/api/columnSorting.md) -- sorts rows by a **single column** at a time. Clicking a column header cycles through ascending, descending, and unsorted states.
- [`MultiColumnSorting`](@/api/multiColumnSorting.md) -- sorts rows by **multiple columns** simultaneously. Hold Ctrl/Cmd and click column headers to add more sort criteria.

Both plugins sort the view only. The source data array is never modified. To persist the sorted order back to the data source, see [Saving data](@/guides/getting-started/saving-data/saving-data.md).

`ColumnSorting` and `MultiColumnSorting` are mutually exclusive. Enable only one at a time. If both options are set to `true`, `ColumnSorting` is automatically disabled.

## Sorting demo

Click a column header to sort in ascending (↑) or descending (↓) order. Click again to return to the original order.

::: only-for javascript

::: example #exampleSortingDemo --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortingDemo.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortingDemo.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortingDemo.ts)

:::

:::

::: only-for react

::: example #exampleSortingDemo :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleSortingDemo.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleSortingDemo.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example1.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example1.html)

:::

:::

::: only-for vue

::: example #exampleSortingDemo :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleSortingDemo.vue)

:::

:::

## Enable sorting

To enable sorting for all columns, set [`columnSorting`](@/api/options.md#columnsorting) to `true`.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={true}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  columnSorting: true,
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: tip
When `columnSorting` (or `multiColumnSorting`) is enabled, Handsontable adds a sort-order arrow icon to each sortable column header. To make room for the icon, the minimum width of those columns is increased slightly. If you define explicit column widths, the sort icon is placed on top of the existing header space and does not affect your widths.
:::

To disable sorting for specific columns, set [`headerAction`](@/api/options.md#columnsorting) to `false` in the per-column configuration. In the following example, only the **Model**, **Date**, and **In stock** columns are sortable.

::: only-for javascript

::: example #exampleEnableSortingForColumns --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleEnableSortingForColumns.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleEnableSortingForColumns.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleEnableSortingForColumns.ts)

:::

:::

::: only-for react

::: example #exampleEnableSortingForColumns :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleEnableSortingForColumns.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleEnableSortingForColumns.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example2.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example2.html)

:::

:::

::: only-for vue

::: example #exampleEnableSortingForColumns :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleEnableSortingForColumns.vue)

:::

:::

## Configure sorting

Set `columnSorting` to an object to configure the plugin. See the [Reference](#reference) section below for all available options.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // enable click-to-sort on column headers (default: true)
    headerAction: true,
    // place empty cells at the end (default: false)
    sortEmptyCells: false,
    // show sort-order arrow in the column header (default: true)
    indicator: true,
    // sort column 1 descending at initialization
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // return -1, 0, or 1
      };
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    headerAction: true,
    sortEmptyCells: false,
    indicator: true,
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // return -1, 0, or 1
      };
    },
  }}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  columnSorting: {
    headerAction: true,
    sortEmptyCells: false,
    indicator: true,
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // return -1, 0, or 1
      };
    },
  },
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  columnSorting: {
    // enable click-to-sort on column headers (default: true)
    headerAction: true,
    // place empty cells at the end (default: false)
    sortEmptyCells: false,
    // show sort-order arrow in the column header (default: true)
    indicator: true,
    // sort column 1 descending at initialization
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // return -1, 0, or 1
      };
    },
  },
};
```

:::

You can also override `columnSorting` options per column, using the `columns` configuration:

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: true,
  columns: [
    {
      columnSorting: {
        // no sort icon for the first column
        indicator: false,
        // disable click-to-sort for the first column
        headerAction: false,
      },
    },
  ],
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={true}
  columns={[
    {
      columnSorting: {
        indicator: false,
        headerAction: false,
      },
    },
  ]}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  columnSorting: true,
  columns: [
    {
      columnSorting: {
        indicator: false,
        headerAction: false,
      },
    },
  ],
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  columnSorting: true,
  columns: [
    {
      columnSorting: {
        // no sort icon for the first column
        indicator: false,
        // disable click-to-sort for the first column
        headerAction: false,
      },
    },
  ],
};
```

:::

## Sort different types of data

Handsontable applies type-aware sorting automatically when you set the [`type`](@/api/options.md#type) option on a column. The supported cell types are:

- [`text`](@/guides/cell-types/cell-type/cell-type.md) — sorted alphabetically (default)
- [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md)
- [`date`](@/guides/cell-types/date-cell-type/date-cell-type.md)
- [`time`](@/guides/cell-types/time-cell-type/time-cell-type.md)
- [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md)
- [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [`password`](@/guides/cell-types/password-cell-type/password-cell-type.md)

You can also define a custom cell type. See [Cell type](@/guides/cell-types/cell-type/cell-type.md).

::: only-for javascript

::: example #exampleSortDifferentTypes --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortDifferentTypes.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortDifferentTypes.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortDifferentTypes.ts)

:::

:::

::: only-for react

::: example #exampleSortDifferentTypes :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleSortDifferentTypes.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleSortDifferentTypes.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example3.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example3.html)

:::

:::

::: only-for vue

::: example #exampleSortDifferentTypes :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleSortDifferentTypes.vue)

:::

:::

## Set an initial sort order

Use the `initialConfig` option to apply a sort order when Handsontable initializes. `column` is the visual column index. `sortOrder` is `'asc'` for ascending or `'desc'` for descending.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    initialConfig: {
      column: 0,
      sortOrder: 'asc',
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    initialConfig: {
      column: 0,
      sortOrder: 'asc',
    },
  }}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  columnSorting: {
    initialConfig: {
      column: 0,
      sortOrder: 'asc',
    },
  },
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  columnSorting: {
    initialConfig: {
      column: 0,
      sortOrder: 'asc',
    },
  },
};
```

:::

To set an initial sort order across multiple columns, use the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin with an array value for `initialConfig`. See [Set an initial multi-column sort order](#set-an-initial-multi-column-sort-order).

## Add a custom comparator

A comparator is a function that determines sort order based on two cell values. Use a custom comparator to implement sorting logic beyond Handsontable's built-in defaults.

Common use cases:

- Sort by value length, occurrence of a character, or any other custom criterion.
- Exclude specific rows from sorting (for example, rows with a particular job title).

Use the `compareFunctionFactory` option to provide a comparator factory. The factory receives `sortOrder` (`'asc'` or `'desc'`) and `columnMeta`, and must return a comparator function. The comparator receives two cell values and must return `-1`, `0`, or `1`.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    compareFunctionFactory: function(sortOrder, columnMeta) {
      return function(value, nextValue) {
        if (value < nextValue) return -1;
        if (value > nextValue) return 1;
        return 0;
      };
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    compareFunctionFactory: function(sortOrder, columnMeta) {
      return function(value, nextValue) {
        if (value < nextValue) return -1;
        if (value > nextValue) return 1;
        return 0;
      };
    },
  }}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  columnSorting: {
    compareFunctionFactory: function(sortOrder, columnMeta) {
      return function(value, nextValue) {
        if (value < nextValue) return -1;
        if (value > nextValue) return 1;
        return 0;
      };
    },
  },
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  columnSorting: {
    compareFunctionFactory: function(sortOrder, columnMeta) {
      return function(value, nextValue) {
        if (value < nextValue) return -1;
        if (value > nextValue) return 1;
        return 0;
      };
    },
  },
};
```

:::

## Use sorting hooks

Run code before or after sorting using the following [Handsontable hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md):

- [`beforeColumnSort`](@/api/hooks.md#beforecolumnsort) — fires before sorting. Return `false` to cancel the sort and keep the current order.
- [`afterColumnSort`](@/api/hooks.md#aftercolumnsort) — fires after sorting completes.

A common use of `beforeColumnSort` is server-side sorting: cancel the client-side sort, send the sort configuration to a server, and reload the data. A common use of `afterColumnSort` is excluding specific rows from the sorted result.

::: only-for javascript

```js
const configurationOptions = {
  beforeColumnSort(currentSortConfig, destinationSortConfigs) {
    // add your code here
    return false; // return false to block front-end sorting
  },
  afterColumnSort(currentSortConfig, sortedSortConfigs) {
    // add your code here
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  beforeColumnSort={(currentSortConfig, destinationSortConfigs) => {
    // add your code here
    return false; // return false to block front-end sorting
  }}
  afterColumnSort={(currentSortConfig, sortedSortConfigs) => {
    // add your code here
  }}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  beforeColumnSort(currentSortConfig, destinationSortConfigs) {
    // add your code here
    return false; // return false to block front-end sorting
  },
  afterColumnSort(currentSortConfig, sortedSortConfigs) {
    // add your code here
  },
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  beforeColumnSort(currentSortConfig, destinationSortConfigs) {
    // add your code here
    return false; // return false to block front-end sorting
  },
  afterColumnSort(currentSortConfig, sortedSortConfigs) {
    // add your code here
  },
};
```

:::

## Exclude rows from sorting

You can prevent specific top or bottom rows from being sorted. This is useful when a frozen row at the top displays column labels, or a frozen row at the bottom displays [column summaries](@/guides/columns/column-summary/column-summary.md) — rows that should always stay in place regardless of the sort order.

::: only-for javascript

::: example #exampleExcludeRowsFromSorting --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleExcludeRowsFromSorting.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleExcludeRowsFromSorting.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleExcludeRowsFromSorting.ts)

:::

:::

::: only-for react

::: example #exampleExcludeRowsFromSorting :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleExcludeRowsFromSorting.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleExcludeRowsFromSorting.tsx)

:::

:::

::: only-for angular

::: example #example8 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example8.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example8.html)

:::

:::

::: only-for vue

::: example #exampleExcludeRowsFromSorting :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleExcludeRowsFromSorting.vue)

:::

:::

## Control sorting programmatically

Use the [`ColumnSorting`](@/api/columnSorting.md) plugin API and [`updateSettings()`](@/api/core.md#updatesettings) to control sorting at runtime. This lets you, for example, enable or disable sorting based on conditions, or trigger sorting from outside the grid.

::: only-for react

To access Handsontable's API methods from a React component, see [Instance methods](@/guides/getting-started/react-methods/react-methods.md).

:::

### Enable or disable sorting programmatically

To enable or disable sorting programmatically, call [`updateSettings()`](@/api/core.md#updatesettings) with `columnSorting` set to `true` or `false`.

::: only-for javascript

```js
// enable sorting for all columns
handsontableInstance.updateSettings({
  columnSorting: true,
});

// disable sorting for all columns
handsontableInstance.updateSettings({
  columnSorting: false,
});

// enable sorting on column 0, disable sorting on column 1
handsontableInstance.updateSettings({
  columns: [
    { columnSorting: { headerAction: true } },
    { columnSorting: { headerAction: false } },
  ],
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// enable sorting for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: true,
});

// disable sorting for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: false,
});

// enable sorting on column 0, disable sorting on column 1
hotTableComponentRef.current.hotInstance.updateSettings({
  columns: [
    { columnSorting: { headerAction: true } },
    { columnSorting: { headerAction: false } },
  ],
});
```

:::

::: only-for angular

```ts
@ViewChild(HotTableComponent, {static: false})
hotTable!: HotTableComponent;

ngAfterViewInit() {
  const hot = this.hotTable.hotInstance;

  // enable sorting for all columns
  hot.updateSettings({ columnSorting: true });

  // disable sorting for all columns
  hot.updateSettings({ columnSorting: false });

  // enable sorting on column 0, disable sorting on column 1
  hot.updateSettings({
    columns: [
      { columnSorting: { headerAction: true } },
      { columnSorting: { headerAction: false } },
    ],
  });
}
```

:::

### Sort data programmatically

Use [`columnSorting.sort()`](@/api/columnSorting.md#sort) to sort programmatically. Pass an object with `column` (visual column index) and `sortOrder` (`'asc'` or `'desc'`). Each call replaces the previous sort order entirely.

Use [`columnSorting.clearSort()`](@/api/columnSorting.md#clearsort) to remove the active sort and return rows to their original order.

::: only-for javascript

```js
const columnSorting = handsontableInstance.getPlugin('columnSorting');

// sort column 0 in ascending order
columnSorting.sort({ column: 0, sortOrder: 'asc' });

// return rows to their original order
columnSorting.clearSort();
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);
const columnSorting = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

// sort column 0 in ascending order
columnSorting.sort({ column: 0, sortOrder: 'asc' });

// return rows to their original order
columnSorting.clearSort();
```

:::

::: only-for angular

```ts
@ViewChild(HotTableComponent, {static: false})
hotTable!: HotTableComponent;

ngAfterViewInit() {
  const columnSorting = this.hotTable.hotInstance.getPlugin('columnSorting');

  // sort column 0 in ascending order
  columnSorting.sort({ column: 0, sortOrder: 'asc' });

  // return rows to their original order
  columnSorting.clearSort();
}
```

:::

To see how it works, try out the following demo:

::: only-for javascript

::: example #exampleSortByAPI --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPI.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPI.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPI.ts)

:::

:::

::: only-for react

::: example #exampleSortByAPI :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleSortByAPI.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleSortByAPI.tsx)

:::

:::

::: only-for angular

::: example #example9 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example9.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example9.html)

:::

:::

::: only-for vue

::: example #exampleSortByAPI :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleSortByAPI.vue)

:::

:::

## MultiColumnSorting plugin

The [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin extends [`ColumnSorting`](@/api/columnSorting.md) to sort rows by multiple columns at the same time.

**Key differences from `ColumnSorting`:**

- Sort by multiple columns at once. The column clicked first has the highest sort priority.
- Hold <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd> and click a column header to add it to the active sort criteria without replacing the existing sort.
- Press <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> with a column header focused to append that column to the active sort criteria.
- `initialConfig` accepts an **array** of sort config objects to define a multi-column initial order.

`ColumnSorting` and `MultiColumnSorting` are mutually exclusive. If both are set to `true`, `ColumnSorting` is automatically disabled.

### Enable multi-column sorting

To enable multi-column sorting for all columns, set [`multiColumnSorting`](@/api/options.md#multicolumnsorting) to `true`.

::: only-for javascript

```js
const configurationOptions = {
  multiColumnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  multiColumnSorting={true}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  multiColumnSorting: true,
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

### Configure multi-column sorting options

`multiColumnSorting` supports the same options as `columnSorting`: `headerAction`, `sortEmptyCells`, `indicator`, and `compareFunctionFactory`. Refer to [Configure sorting](#configure-sorting) for a description of each option.

To disable multi-column sorting for a specific column, set `headerAction` to `false` in that column's configuration:

::: only-for javascript

```js
const configurationOptions = {
  multiColumnSorting: true,
  columns: [
    {
      multiColumnSorting: {
        headerAction: false,  // disable multi-column sorting for the first column
      },
    },
  ],
};
```

:::

::: only-for react

```jsx
<HotTable
  multiColumnSorting={true}
  columns={[
    {
      multiColumnSorting: {
        headerAction: false,
      },
    },
  ]}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  multiColumnSorting: true,
  columns: [
    {
      multiColumnSorting: {
        headerAction: false,
      },
    },
  ],
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

### Sort by multiple columns

To sort by multiple columns interactively, hold <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd> and click column headers in the desired priority order.

Try the following demo:

1. Click **Brand**. The rows sort by brand.
2. Hold <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd> and click **Model**. The rows sort by model within each brand.
3. Hold <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd> and click **Price**. The rows sort by price within each model.

::: only-for javascript

::: example #exampleSortByMultipleColumns --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByMultipleColumns.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByMultipleColumns.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByMultipleColumns.ts)

:::

:::

::: only-for react

::: example #exampleSortByMultipleColumns :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleSortByMultipleColumns.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleSortByMultipleColumns.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example4.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example4.html)

:::

:::

::: only-for vue

::: example #exampleSortByMultipleColumns :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleSortByMultipleColumns.vue)

:::

:::

### Set an initial multi-column sort order

Use `initialConfig` with an **array** of sort config objects to apply a multi-column sort at initialization. Each object has a `column` property (visual column index) and a `sortOrder` property (`'asc'` or `'desc'`). The array order determines sort priority: the first entry has the highest priority.

In the following demo, the data is initially sorted by **Brand** ascending, then by **Model** descending:

::: only-for javascript

::: example #exampleInitialSortOrder --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleInitialSortOrder.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleInitialSortOrder.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleInitialSortOrder.ts)

:::

:::

::: only-for react

::: example #exampleInitialSortOrder :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleInitialSortOrder.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleInitialSortOrder.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example5.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example5.html)

:::

:::

::: only-for vue

::: example #exampleInitialSortOrder :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleInitialSortOrder.vue)

:::

:::

::: only-for javascript

```js
const configurationOptions = {
  multiColumnSorting: {
    initialConfig: [
      { column: 0, sortOrder: 'asc' },   // sort column 0 ascending (highest priority)
      { column: 1, sortOrder: 'desc' },  // sort column 1 descending (next priority)
    ],
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  multiColumnSorting={{
    initialConfig: [
      { column: 0, sortOrder: 'asc' },
      { column: 1, sortOrder: 'desc' },
    ],
  }}
/>
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  multiColumnSorting: {
    initialConfig: [
      { column: 0, sortOrder: 'asc' },
      { column: 1, sortOrder: 'desc' },
    ],
  },
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

### Sort by multiple columns programmatically

Use [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) to sort by multiple columns programmatically. Pass an array of sort config objects. The array order determines sort priority. Each call replaces the previous sort order entirely.

Use [`multiColumnSorting.clearSort()`](@/api/multiColumnSorting.md#clearsort) to remove all sort criteria and return rows to their original order.

::: only-for javascript

```js
const multiColumnSorting = handsontableInstance.getPlugin('multiColumnSorting');

// sort column 0 ascending, then column 1 descending
multiColumnSorting.sort([
  { column: 0, sortOrder: 'asc' },
  { column: 1, sortOrder: 'desc' },
]);

// return rows to their original order
multiColumnSorting.clearSort();
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);
const multiColumnSorting = hotTableComponentRef.current.hotInstance.getPlugin('multiColumnSorting');

// sort column 0 ascending, then column 1 descending
multiColumnSorting.sort([
  { column: 0, sortOrder: 'asc' },
  { column: 1, sortOrder: 'desc' },
]);

// return rows to their original order
multiColumnSorting.clearSort();
```

:::

::: only-for angular

```ts
@ViewChild(HotTableComponent, {static: false})
hotTable!: HotTableComponent;

ngAfterViewInit() {
  const multiColumnSorting = this.hotTable.hotInstance.getPlugin('multiColumnSorting');

  // sort column 0 ascending, then column 1 descending
  multiColumnSorting.sort([
    { column: 0, sortOrder: 'asc' },
    { column: 1, sortOrder: 'desc' },
  ]);

  // return rows to their original order
  multiColumnSorting.clearSort();
}
```

:::

To see how it works, try out the following demo:

::: only-for javascript

::: example #exampleSortByAPIMultipleColumns --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPIMultipleColumns.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPIMultipleColumns.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleSortByAPIMultipleColumns.ts)

:::

:::

::: only-for react

::: example #exampleSortByAPIMultipleColumns :react --js 1 --ts 2

@[code](@/content/guides/rows/rows-sorting/react/exampleSortByAPIMultipleColumns.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleSortByAPIMultipleColumns.tsx)

:::

:::

::: only-for angular

::: example #example10 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example10.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example10.html)

:::

:::

::: only-for vue

::: example #exampleSortByAPIMultipleColumns :vue3

@[code](@/content/guides/rows/rows-sorting/vue/exampleSortByAPIMultipleColumns.vue)

:::

:::

## Add custom sort icons

The default sort icons (↑↓) are rendered using CSS `-webkit-mask-image`. Override the following pseudo-elements to replace them:

- `.columnSorting.sortAction.ascending::before`
- `.columnSorting.sortAction.descending::before`

::: only-for javascript

::: example #exampleCustomSortIcons --html 1 --js 2 --ts 3 --css 4

@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons.ts)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons.css)

:::

:::

::: only-for react

::: example #exampleCustomSortIcons :react --js 1 --css 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons.css)
@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons.tsx)

:::

:::

::: only-for angular

::: example #example6 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example6.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example6.html)

:::

:::

::: only-for vue

::: example #exampleCustomSortIcons :vue3 --css 2

@[code](@/content/guides/rows/rows-sorting/vue/exampleCustomSortIcons.vue)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons.css)

:::

:::

To replace the column-priority number indicators used by the `MultiColumnSorting` plugin (<sub>1</sub>, <sub>2</sub>, etc.), override the `content` of `.columnSorting.sort-1::after` and subsequent pseudo-elements:

::: only-for javascript

::: example #exampleCustomSortIcons3 --html 1 --js 2 --ts 3 --css 4

@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons3.html)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons3.js)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons3.ts)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons3.css)

:::

:::

::: only-for react

::: example #exampleCustomSortIcons3 :react --js 1 --css 2 --ts 3

@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons3.jsx)
@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons3.css)
@[code](@/content/guides/rows/rows-sorting/react/exampleCustomSortIcons3.tsx)

:::

:::

::: only-for angular

::: example #example7 :angular --ts 1 --html 2

@[code](@/content/guides/rows/rows-sorting/angular/example7.ts)
@[code](@/content/guides/rows/rows-sorting/angular/example7.html)

:::

:::

::: only-for vue

::: example #exampleCustomSortIcons3 :vue3 --css 2

@[code](@/content/guides/rows/rows-sorting/vue/exampleCustomSortIcons3.vue)
@[code](@/content/guides/rows/rows-sorting/javascript/exampleCustomSortIcons3.css)

:::

:::

## Import the sorting module

To reduce bundle size, import only the modules you need. For sorting, you need the [base module](@/guides/tools-and-building/modules/modules.md#import-the-base-module) and the plugin module.

```js
// import the base module
import Handsontable from 'handsontable/base';

// import ColumnSorting (or MultiColumnSorting instead)
import { registerPlugin, ColumnSorting } from 'handsontable/plugins';

// register the plugin
registerPlugin(ColumnSorting);
```

## Related keyboard shortcuts

| Windows | macOS | Action | Excel | Sheets |
| --- | --- | --- | :---: | :---: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Sort by the focused column, cycling through ascending, descending, and original order | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Enter**</kbd> | <kbd>⇧</kbd>+<kbd>**Enter**</kbd> | Append the focused column to the active sort criteria. Requires the [`MultiColumnSorting`](@/api/multiColumnSorting.md) plugin. | &cross; | &cross; |

## Reference

### Plugin comparison

| Feature | `ColumnSorting` | `MultiColumnSorting` |
| --- | --- | --- |
| Sort by single column | Yes | Yes |
| Sort by multiple columns | No | Yes |
| Ctrl/Cmd + click to add columns | No | Yes |
| `initialConfig` type | Object | Array of objects |
| Mutual exclusivity | Disabled when `MultiColumnSorting` is enabled | Disables `ColumnSorting` |

### Configuration options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `headerAction` | `boolean` | `true` | When `true`, clicking a column header sorts by that column. |
| `sortEmptyCells` | `boolean` | `false` | When `true`, empty cells participate in sorting. When `false`, empty cells are always placed at the end. |
| `indicator` | `boolean` | `true` | When `true`, a sort-order arrow icon is shown in the column header. |
| `compareFunctionFactory` | `function` | -- | A factory that returns a custom comparator function. See [Add a custom comparator](#add-a-custom-comparator). |
| `initialConfig` | `object` | -- | Sort config applied at initialization. Contains `column` (visual index) and `sortOrder` (`'asc'` or `'desc'`). |

## Result

After completing this guide, users can sort rows by clicking column headers, and you can control sort order programmatically. You can use `ColumnSorting` for single-column sorting or `MultiColumnSorting` for multi-column sorting with custom priority.

## API reference

For the full list of options, methods, and hooks related to sorting, see the following API reference pages:

- [`ColumnSorting`](@/api/columnSorting.md)
- [`MultiColumnSorting`](@/api/multiColumnSorting.md)

## Troubleshooting

Didn't find what you need? Try this:

<div class="boxes-list">

- [View related topics](https://github.com/handsontable/handsontable/labels/Column%20sorting) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help

</div>
