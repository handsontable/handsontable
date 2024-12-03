---
id: xndxqkoc
title: Column summary
metaTitle: Column summary - JavaScript Data Grid | Handsontable
description: Calculate sum, min, max, count, average or custom aggregates of individual columns' data, using Handsontable's aggregate functions.
permalink: /column-summary
canonicalUrl: /column-summary
tags:
  - column summaries
  - calculations
  - functions
  - suppressDataTypeErrors
  - destinationRow
  - destinationColumn
  - reversedRowCoords
react:
  id: r3x4l0gp
  metaTitle: Column summary - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column summary

Calculate sum, min, max, count, average or custom aggregates of individual columns' data, using Handsontable's aggregate functions.

[[toc]]

## Overview

The [`ColumnSummary`](@/api/columnSummary.md) plugin lets you quickly calculate and display a column summary.

To customize your column summaries, you can:
- Decide how a summary is calculated:
    - Either select one of the [built-in summary functions](#built-in-summary-functions)
    - Or implement a [custom summary function](#implement-a-custom-summary-function)
- [Select columns and ranges of rows](#step-2-select-cells-that-you-want-to-summarize) that you want to summarize
- [Display your summary result](#step-4-provide-the-destination-cell-s-coordinates) in a specific cell

### Column summary example

This example calculates and displays five different column summaries:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example1.js)
@[code](@/content/guides/columns/column-summary/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example1.jsx)
@[code](@/content/guides/columns/column-summary/react/example1.tsx)

:::

:::

### Built-in summary functions

To decide how a column summary is calculated, you can use one of the following summary functions:

| Function  | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `sum`     | Returns the sum of all values in a column.                                                             |
| `min`     | Returns the lowest value in a column.                                                                  |
| `max`     | Returns the highest value in a column.                                                                 |
| `count`   | Returns the number of all non-empty cells in a column.                                                 |
| `average` | Returns the sum of all values in a column,<br>divided by the number of non-empty cells in that column. |
| `custom`  | Lets you implement a [custom summary function](#implement-a-custom-summary-function).                  |

### Column summary options

You can customize each of your column summaries with configuration options.

For the full list of available options, see the [API reference](@/api/columnSummary.md#options).

## Set up a column summary

To set up a column summary, follow the steps below.

### Step 1: Enable the [`ColumnSummary`](@/api/columnSummary.md) plugin

To enable the [`ColumnSummary`](@/api/columnSummary.md) plugin, set the [`columnSummary`](@/api/options.md#columnsummary) configuration option to an array of objects. Each object represents a single column summary.

::: only-for javascript

```js
import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const hot = new Handsontable(document.querySelector('#example'), {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ],
  colHeaders: true,
  rowHeaders: true,
  // set the `columnSummary` configuration option to an array of objects
  columnSummary: [
    {},
    {}
  ],
});
```

:::

::: only-for react

```jsx
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15]
      ]}
      colHeaders={true}
      rowHeaders={true}
      columnSummary={[
        {},
        {}
      ]}
    />
  );
};
```

:::

You can also set the [`columnSummary`](@/api/options.md#columnsummary) option [to a function](#set-up-column-summaries-using-a-function).

### Step 2: Select cells that you want to summarize

By default, a column summary takes all cells of the column in which it displays its result (see the [`destinationColumn`](@/api/columnSummary.md#options) option in [step 4](#step-4-provide-the-destination-cell-s-coordinates)).

To summarize any other column, use the [`sourceColumn`](@/api/columnSummary.md#options) option:

::: only-for javascript

```js
columnSummary: [
  {
    // set this column summary to summarize the first column
    // (i.e. a column with physical index `0`)
    sourceColumn: 0,
  },
  {
    // set this column summary to summarize the second column
    // (i.e. a column with physical index `1`)
    sourceColumn: 1,
  }
]
```

:::

::: only-for react

```jsx
columnSummary={[
  {
    // set this column summary to summarize the first column
    // (i.e. a column with physical index `0`)
    sourceColumn: 0,
  },
  {
    // set this column summary to summarize the second column
    // (i.e. a column with physical index `1`)
    sourceColumn: 1,
  }
]}
```

:::

You can also summarize individual ranges of rows (rather than a whole column). To do this, set the [`ranges`](@/api/columnSummary.md#options) option to an array of arrays, where each array represents a single row range.

::: only-for javascript

```js
columnSummary: [
  {
    sourceColumn: 0,
    // set this column summary to only summarize rows with physical indexes 0-2, 4, and 6-8
    ranges: [
      [0, 2], [4], [6, 8]
    ],
  },
  {
    sourceColumn: 0,
    // set this column summary to only summarize rows with physical indexes 0-5
    ranges: [
      [0, 5]
    ],
  }
]
```

:::

::: only-for react

```jsx
columnSummary={[
  {
    sourceColumn: 0,
    // set this column summary to only summarize rows with physical indexes 0-2, 4, and 6-8
    ranges: [
      [0, 2], [4], [6, 8]
    ],
  },
  {
    sourceColumn: 0,
    // set this column summary to only summarize rows with physical indexes 0-5
    ranges: [
      [0, 5]
    ],
  }
]}
```

:::

### Step 3: Calculate your summary

Now, decide how you want to calculate your column summary.

You can:
- Either select one of the [built-in summary functions](#built-in-summary-functions)
- Or implement a [custom summary function](#implement-a-custom-summary-function)

::: only-for javascript

```js
columnSummary: [
  {
    sourceColumn: 0,
    // set this column summary to return the sum all values in the summarized column
    type: 'sum',
  },
  {
    sourceColumn: 1,
    // set this column summary to return the lowest value in the summarized column
    type: 'min',
  }
]
```

:::

::: only-for react

```jsx
columnSummary={[
  {
    sourceColumn: 0,
    // set this column summary to return the sum all values in the summarized column
    type: 'sum',
  },
  {
    sourceColumn: 1,
    // set this column summary to return the lowest value in the summarized column
    type: 'min',
  }
]}
```

:::

### Step 4: Provide the destination cell's coordinates

To display your column summary result in a cell, provide the destination cell's coordinates.

Set the [`destinationRow`](@/api/columnSummary.md#options) and [`destinationColumn`](@/api/columnSummary.md#options) options to the physical coordinates of your required cell.

::: only-for javascript

```js
columnSummary: [
  {
    sourceColumn: 0,
    type: 'sum',
    // set this column summary to display its result in cell (4, 0)
    destinationRow: 4,
    destinationColumn: 0
  },
  {
    sourceColumn: 1,
    type: 'min',
    // set this column summary to display its result in cell (4, 1)
    destinationRow: 4,
    destinationColumn: 1
  }
]
```

:::

::: only-for react

```jsx
columnSummary={[
  {
    sourceColumn: 0,
    type: 'sum',
    // set this column summary to display its result in cell (4, 0)
    destinationRow: 4,
    destinationColumn: 0
  },
  {
    sourceColumn: 1,
    type: 'min',
    // set this column summary to display its result in cell (4, 1)
    destinationRow: 4,
    destinationColumn: 1
  }
]}
```

:::

::: tip

Don't change the [`className`](@/api/options.md#classname) metadata of the summary row.

If you need to style the summary row, use the class name assigned automatically by the [`ColumnSummary`](@/api/columnSummary.md) plugin: `columnSummaryResult`.

:::

### Step 5: Make room for the destination cell

The [`ColumnSummary`](@/api/columnSummary.md) plugin doesn't automatically add new rows to display its summary results.

So, if you always want to display your column summary result below your existing rows, you need to:
1. Add an empty row to the bottom of your grid (to avoid overwriting your existing rows).
2. Reverse row coordinates for your column summary (to always display your summary result at the bottom).

::: tip

To reverse row coordinates for your column summary, set the [`reversedRowCoords`](@/api/columnSummary.md#options) option to `true`, and adjust the [`destinationRow`](@/api/columnSummary.md#options) coordinate.

:::

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example2.js)
@[code](@/content/guides/columns/column-summary/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example2.jsx)
@[code](@/content/guides/columns/column-summary/react/example2.tsx)

:::

:::

## Set up column summaries, using a function

Instead of [setting up the column summary options manually](#set-up-a-column-summary), you can provide the whole column summary configuration as a function that returns a required array of objects.

The example below sets up five different column summaries. To do this, it:
- Defines a function named `generateData` which generates an array of arrays with dummy numeric data, and which lets you add an empty row at the bottom of the grid (to make room for displaying column summaries)
- Sets Handsontable's [`columnSummary`](@/api/options.md#columnsummary) configuration option to a function that:
    - Iterates over visible columns
    - For each visible column, adds a column summary with a configuration
    - To display the column summaries in the empty row added by `generateData`, sets the [`reversedRowCoords`](@/api/columnSummary.md#options) option to `true`, and the [`destinationRow`](@/api/columnSummary.md#options) option to `0`

::: only-for javascript

::: example #example7 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example7.js)
@[code](@/content/guides/columns/column-summary/javascript/example7.ts)

:::

:::

::: only-for react

::: example #example7 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example7.jsx)
@[code](@/content/guides/columns/column-summary/react/example7.tsx)

:::

:::

Using a function to provide a column summary configuration lets you set up all sorts of more complex column summaries. For example, you can sum subtotals for nested groups:

::: only-for javascript

::: example #example8 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example8.js)
@[code](@/content/guides/columns/column-summary/javascript/example8.ts)

:::

:::

::: only-for react

::: example #example8 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example8.jsx)
@[code](@/content/guides/columns/column-summary/react/example8.tsx)

:::

:::

## Implement a custom summary function

Apart from using the [built-in summary functions](#built-in-summary-functions), you can also implement your own custom function that performs any summary calculation you want.

To implement a custom summary function:

1. [Set up your column summary](#set-up-a-column-summary).
2. In your [column summary object](#step-1-enable-the-columnsummary-plugin), set the [`type`](@/api/options.md#type) option to `'custom'`:

::: only-for javascript

```js
columnSummary: [{
  sourceColumn: 1,
  // set the `type` option to `'custom'`
  type: 'custom',
  destinationRow: 0,
  destinationColumn: 5,
  reversedRowCoords: true
}]
```

:::

::: only-for react

```js
columnSummary={[{
    sourceColumn: 1,
    // set the `type` option to `'custom'`
    type: 'custom',
    destinationRow: 0,
    destinationColumn: 5,
    reversedRowCoords: true
}]}
```

:::

3. In your column summary object, add your custom summary function:

::: only-for javascript

```js
columnSummary: [{
    type: 'custom',
    destinationRow: 0,
    destinationColumn: 5,
    reversedRowCoords: true,
    // add your custom summary function
    customFunction: function(endpoint) {
      // implement your function here
    }
}]
```

:::

::: only-for react

```js
columnSummary={[{
    type: 'custom',
    destinationRow: 0,
    destinationColumn: 5,
    reversedRowCoords: true,
    // add your custom summary function
    customFunction: function(endpoint) {
      // implement your function here
    }
}]}
```

:::

This example implements a function that counts the number of even values in a column:

::: only-for javascript

::: example #example9 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example9.js)
@[code](@/content/guides/columns/column-summary/javascript/example9.ts)

:::

:::

::: only-for react

::: example #example9 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example9.jsx)
@[code](@/content/guides/columns/column-summary/react/example9.tsx)

:::

:::

## Round a column summary result

You can round a column summary result to a specific number of digits after the decimal point.

To enable this feature, set the [`roundFloat`](@/api/columnSummary.md) option to your preferred number of digits between 0 and 100.
See the following example:

::: only-for javascript

::: example #example12 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example12.js)
@[code](@/content/guides/columns/column-summary/javascript/example12.ts)

:::

:::

::: only-for react

::: example #example12 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example12.jsx)
@[code](@/content/guides/columns/column-summary/react/example12.tsx)

:::

:::

The [`roundFloat`](@/api/columnSummary.md) option accepts the following values:

| Value             | Behavior                                                |
| ----------------- | ------------------------------------------------------- |
| `false` (default) | Don't round the column summary result.                  |
| `true`            | Round the result to 0 digits after the decimal point.   |
| Integer 0-100 (n) | Round the result to n digits after the decimal point.   |
| Integer < 0       | Round the result to 0 digits after the decimal point.   |
| Integer > 100     | Round the result to 100 digits after the decimal point. |

If you enable [`roundFloat`](@/api/columnSummary.md), the data type returned by Handsontable's data-retrieving methods 
(like [`getDataAtCell()`](@/api/core.md#getdataatcell)) changes from `number` to `string`.

## Handle non-numeric values

To summarize a column that contains non-numeric data, you can:

- Either force your column summary to treat non-numeric values as numeric values
- Or throw an error whenever a non-numeric value is passed to your column summary
- Or make your column summary skip any non-numeric values

### Force numeric values

You can force your column summary to treat non-numeric values as numeric values.

::: tip

The [`forceNumeric`](@/api/columnSummary.md) option uses JavaScript's `parseFloat()` function.

This means that e.g., `3c` is treated as `3`, but `c3` is still treated as `c3`.

:::

To enable this feature, set the [`forceNumeric`](@/api/columnSummary.md) option to `true` (by default, [`forceNumeric`](@/api/columnSummary.md) is set to `false`). For example:

::: only-for javascript

::: example #example10 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example10.js)
@[code](@/content/guides/columns/column-summary/javascript/example10.ts)

:::

:::

::: only-for react

::: example #example10 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example10.jsx)
@[code](@/content/guides/columns/column-summary/react/example10.tsx)

:::

:::

### Throw data type errors

You can throw a data type error whenever a non-numeric value is passed to your column summary.

To throw data type errors, set the [`suppressDataTypeErrors`](@/api/columnSummary.md) option to `false` (by default, [`suppressDataTypeErrors`](@/api/columnSummary.md) is set to `true`). For example:

::: only-for javascript

::: example #example11 --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/javascript/example11.js)
@[code](@/content/guides/columns/column-summary/javascript/example11.ts)

:::

:::

::: only-for react

::: example #example11 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-summary/react/example11.jsx)
@[code](@/content/guides/columns/column-summary/react/example11.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`columnSummary`](@/api/options.md#columnsummary)
- Plugins:
  - [`ColumnSummary`](@/api/columnSummary.md)
