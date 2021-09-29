---
title: Column summary
metaTitle: Column summary - Guide - Handsontable Documentation
permalink: /10.0/column-summary
canonicalUrl: /column-summary
tags:
  - column summaries
  - calculations
  - formulas
  - functions
---

# Column summary

[[toc]]

You can easily summarize your columns, using the [`ColumnSummary`](@/api/columnSummary.md) plugin.

## About column summary

The [`ColumnSummary`](@/api/columnSummary.md) plugin lets you quickly calculate and display a column summary.

To customize your column summaries, you can:
- Decide how a summary is calculated:
    - Either select one of the [built-in summary functions](#built-in-summary-functions)
    - Or implement a [custom summary function](#implementing-a-custom-summary-function)
- [Select columns and ranges of rows](#step-2-select-cells-that-you-want-to-summarize) that you want to summarize
- [Display your summary result](#step-4-provide-the-destination-cell-s-coordinates) in a specific cell

### Column summary example

The example below calculates and displays five different column summaries:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [null]
  ],
  colHeaders: true,
  rowHeaders: true,
  // enable and configure the `ColumnSummary` plugin
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      destinationRow: 3,
      destinationColumn: 0
    },
    {
      sourceColumn: 1,
      type: 'min',
      destinationRow: 3,
      destinationColumn: 1
    },
    {
      sourceColumn: 2,
      type: 'max',
      destinationRow: 3,
      destinationColumn: 2
    },
    {
      sourceColumn: 3,
      type: 'count',
      destinationRow: 3,
      destinationColumn: 3
    },
    {
      sourceColumn: 4,
      type: 'average',
      destinationRow: 3,
      destinationColumn: 4
    }
  ]
});
```
:::

### Built-in summary functions

To decide how a column summary is calculated, you can use one of the following summary functions:

| Function                                                                                                                   | Description                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [`sum`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L146-L161)     | Returns the sum of all values in a column.                                                             |
| [`min`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L193-L226)     | Returns the lowest value in a column.                                                                  |
| [`max`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L193-L226)     | Returns the highest value in a column.                                                                 |
| [`count`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L293-L313)   | Returns the number of all non-empty cells in a column.                                                 |
| [`average`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L315-L327) | Returns the sum of all values in a column,<br>divided by the number of non-empty cells in that column. |
| [`custom`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L138-L139)  | Lets you implement a [custom summary function](#implementing-a-custom-summary-function).                                                  |

### Column summary options

You can customize each of your column summaries with configuration options.

For the full list of available options, see the [API reference](@/api/columnsummary.md#options).

## Setting up a column summary

To set up a column summary, follow the steps below.

### Step 1: Enable the `ColumnSummary` plugin

To enable the [`ColumnSummary`](@/api/columnSummary.md) plugin, set the [`columnSummary`](@/api/metaSchema.md#columnsummary) [configuration option](@/guides/getting-started/setting-options.md) to an array of objects.

Each object represents a single column summary.

```js
const hot = new Handsontable(container, {
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
  ]
});
```

::: tip
You can also set the [`columnSummary`](@/api/metaSchema.md#columnsummary) option [to a function](#providing-column-summary-configuration-as-a-function).
:::

### Step 2: Select cells that you want to summarize

By default, a column summary takes all cells of the column in which it displays its result (see the [`destinationColumn`](@/api/columnSummary.md#options) option in [step 4](#step-4-provide-the-destination-cell-s-coordinates)).

To summarize any other column, use the [`sourceColumn`](@/api/columnSummary.md#options) option:

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ],
  colHeaders: true,
  rowHeaders: true,
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
});
```

You can also summarize individual ranges of rows (rather than a whole column). To do this, set the [`ranges`](@/api/columnSummary.md#options) option to an array of arrays, where each array represents a single row range.

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ],
  colHeaders: true,
  rowHeaders: true,
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
});
```

### Step 3: Calculate your summary

Now, decide how you want to calculate your column summary.

You can:
- Either select one of the [built-in summary functions](#built-in-summary-functions)
- Or implement a [custom summary function](#implementing-a-custom-summary-function)

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ],
  colHeaders: true,
  rowHeaders: true,
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
});
```

### Step 4: Provide the destination cell's coordinates

To display your column summary result in a cell, provide the destination cell's coordinates.

Set the [`destinationRow`](@/api/columnSummary.md#options) and [`destinationColumn`](@/api/columnSummary.md#options) options to the physical coordinates of your required cell.

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ],
  colHeaders: true,
  rowHeaders: true,
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
});
```

### Step 5: Make room for the destination cell

The [`ColumnSummary`](@/api/columnSummary.md) plugin doesn't automatically add new rows to display its summary results.

So, if you always want to display your column summary result below your existing rows, you need to:
1. Add an empty row to the bottom of your grid (to avoid overwriting your existing rows).
2. Reverse row coordinates for your column summary (to always display your summary result at the bottom).
    ::: tip
    To reverse row coordinates for your column summary, set the [`reversedRowCoords`](@/api/columnSummary.md#options) option to `true`, and adjust the [`destinationRow`](@/api/columnSummary.md#options) coordinate.
    :::

```js
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    // add an empty row
    [null]
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      // for this column summary, count row coordinates backward
      reversedRowCoords: true,
      // now, to always display this column summary in the bottom row,
      // set `destinationRow` to `0` (i.e. the last possible row)
      destinationRow: 0,
      destinationColumn: 0
    },
    {
      sourceColumn: 1,
      type: 'min',
      // for this column summary, count row coordinates backward
      reversedRowCoords: true,
      // now, to always display this column summary in the bottom row,
      // set `destinationRow` to `0` (i.e. the last possible row)
      destinationRow: 0,
      destinationColumn: 1
    }
  ]
});
```

## Setting up column summaries, using a function

Instead of [setting up the column summary options manually](#setting-up-a-column-summary), you can provide the whole column summary configuration as a function that returns a required array of objects.

The example below sets up five different column summaries. To do this, it:
- Defines a function named `generateData` which generates an array of arrays with dummy numeric data, and which lets you add an empty row at the bottom of the grid (to make room for displaying column summaries)
- Sets Handsontable's [`columnSummary`](@/api/options.md#columnsummary) [configuration option](@/guides/getting-started/setting-options.md) to a function that:
    - Iterates over visible columns
    - For each visible column, adds a column summary with a configuration
    - To display the column summaries in the empty row added by `generateData`, sets the [`reversedRowCoords`](@/api/columnsummary.md#options) option to `true`, and the [`destinationRow`](@/api/columnsummary.md#options) option to `0`

::: example #example7
```js
// generate an array of arrays with dummy numeric data
const generateData = (rows = 3, columns = 7, additionalRows = true) => {
  let counter = 0;

  const array2d = [...new Array(rows)]
    .map(_ => [...new Array(columns)]
    .map(_ => counter++));
  
  // add an empty row at the bottom, to display column summaries
  if (additionalRows) {
    array2d.push([]);
  }

  return array2d;
};

const container = document.querySelector('#example7');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  // initialize a Handsontable instance with the generated data
  data: generateData(5, 5, true),
  height: 'auto',
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  // set the `columnSummary` configuration option to a function
  columnSummary() {
    const configArray = [];
    const summaryTypes = ['sum', 'min', 'max', 'count', 'average'];

    for (let i = 0; i < this.hot.countCols(); i++) { // iterate over visible columns
      // for each visible column, add a column summary with a configuration
      configArray.push({
        sourceColumn: i,
        type: summaryTypes[i],
        // count row coordinates backward
        reversedRowCoords: true,
        // display the column summary in the bottom row (because of the reversed row coordinates)
        destinationRow: 0,
        destinationColumn: i,
        forceNumeric: true
      });
    }

    return configArray;
  }
});
```
:::

Using a function to provide a column summary configuration lets you set up all sorts of more complex column summaries. For example, you can sum subtotals for nested groups:

::: example #example8
```js
const container = document.getElementById('example8');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    {
      value: null,
      __children: [
        {value: 5},
        {value: 6},
        {value: 7},
      ]
    },
    {
      __children: [
        {value: 15},
        {value: 16},
        {value: 17},
      ]
    }
  ],
  columns: [
    { data: 'value' }
  ],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  columnSummary() {
    const endpoints = [];
    const nestedRowsPlugin = this.hot.getPlugin('nestedRows');
    const getRowIndex = nestedRowsPlugin.dataManager.getRowIndex.bind(nestedRowsPlugin.dataManager);
    const resultColumn = 0;

    let tempEndpoint = null;
    let nestedRowsCache = null;

    if (nestedRowsPlugin.isEnabled()) {
      nestedRowsCache = this.hot.getPlugin('nestedRows').dataManager.cache;
    } else {
      return;
    }

    for (let i = 0; i < nestedRowsCache.levels[0].length; i++) {
      tempEndpoint = {};

      if (!nestedRowsCache.levels[0][i].__children || nestedRowsCache.levels[0][i].__children.length === 0) {
        continue;
      }

      tempEndpoint.destinationColumn = resultColumn;
      tempEndpoint.destinationRow = getRowIndex(nestedRowsCache.levels[0][i]);
      tempEndpoint.type = 'sum';
      tempEndpoint.forceNumeric = true;
      tempEndpoint.ranges = [];

      tempEndpoint.ranges.push([
        getRowIndex(nestedRowsCache.levels[0][i].__children[0]),
        getRowIndex(nestedRowsCache.levels[0][i].__children[nestedRowsCache.levels[0][i].__children.length - 1])
      ]);

      endpoints.push(tempEndpoint);
      tempEndpoint = null;
    }

    return endpoints;
  }
});
```
:::

## Implementing a custom summary function

Apart from using the [built-in summary functions](#built-in-summary-functions), you can also implement your own custom function that performs any summary calculation you want.

To implement a custom summary function:

1. [Set up your column summary](#setting-up-a-column-summary).
2. In your [column summary object](#step-1-enable-the-columnsummary-plugin), set the `type` option to `'custom'`:
    ```js
    columnSummary: [
        {
          sourceColumn: 1,
          // set the `type` option to `'custom'`
          type: 'custom',
          destinationRow: 0,
          destinationColumn: 5,
          reversedRowCoords: true
        },
    ```
3. In your [column summary object](#step-1-enable-the-columnsummary-plugin), add your custom summary function:
    ```js
    columnSummary: [
        {
          type: 'custom',
          destinationRow: 0,
          destinationColumn: 5,
          reversedRowCoords: true,
          // add your custom summary function
          customFunction(endpoint) {
            // implement your function here
          },
    ```

The example below implements a function that counts the number of even values in a column:

::: example #example9
```js
// generate an array of arrays with dummy numeric data
const generateData = (rows = 3, columns = 7, additionalRows = true) => {
  let counter = 0;

  const array2d = [...new Array(rows)]
    .map(_ => [...new Array(columns)]
    .map(_ => counter++));

  if (additionalRows) {
    array2d.push([]);
    array2d.push([]);
  }

  return array2d;
};

const container = document.querySelector('#example9');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  // initialize a Handsontable instance with the generated numeric data
  data: generateData(5, 7),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the `ColumnSummary` plugin
  columnSummary: [
    // configure a column summary
    {
      // set the `type` option to `'custom'`
      type: 'custom',
      destinationRow: 0,
      destinationColumn: 5,
      reversedRowCoords: true,
      // add your custom summary function
      customFunction(endpoint) {
        // implement a function that counts the number of even values in the column
        const hotInstance = this.hot;
        let evenCount = 0;

        // a helper function
        const checkRange = rowRange => {
          let i = rowRange[1] || rowRange[0];
          let counter = 0;

          do {
              if (parseInt(hotInstance.getDataAtCell(i, endpoint.sourceColumn), 10) % 2 === 0) {
                counter++;
              }

              i--;
            } while (i >= rowRange[0]);

            return counter;
          }

          // go through all declared ranges
          for (const r in endpoint.ranges) {
            if (endpoint.ranges.hasOwnProperty(r)) {
              evenCount += checkRange(endpoint.ranges[r]);
            }
          }

          return evenCount;
        },
        forceNumeric: true
      }
    ]
  });
```
:::

## Rounding a column summary result

You can round a column summary result to a specific number of digits after the decimal point.

To enable this feature, set the `roundFloat` option to your preferred number of digits. For example:

::: example #example12
```js
const container = document.querySelector('#example12');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [0.5, 0.5],
    [0.5, 0.5],
    [1, 1],
    [],[]
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true
    },
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // round this column summary result to two digits after the decimal point
      roundFloat: 2
    }
  ]
});
```
:::

## Dealing with non-numeric values

To summarize a column that contains non-numeric data, you can:

- Either [force your column summary to treat non-numeric values as numeric values](#forcing-numeric-values)
- Or [throw an error whenever a non-numeric value is passed to your column summary](#throwing-data-type-errors)
- Or make your column summary skip any non-numeric values

### Forcing numeric values

You can force your column summary to treat non-numeric values as numeric values.

:::tip
The `forceNumeric` option uses JavaScript's [parseFloat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat) function.

This means that e.g. `3c` is treated as `3`, but `c3` is still treated as `c3`.
:::

To enable this feature, set the `forceNumeric` option to `true` (by default, `forceNumeric` is set to `false`). For example:

::: example #example10
```js
const container = document.querySelector('#example10');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [0, 1, 2],
    ['3c', '4b', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true
    }
  ]
});
```
:::

### Throwing data type errors

You can throw a data type error whenever a non-numeric value is passed to your column summary.

To throw data type errors, set the `suppressDataTypeErrors` option to `false` (by default, `suppressDataTypeErrors` is set to `true`). For example:
 
::: example #example11
```js
const container = document.querySelector('#example11');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    [0, 1, 2],
    ['3c', '4b', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      // enable throwing data type errors for this column summary
      suppressDataTypeErrors: false
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // enable throwing data type errors for this column summary
      suppressDataTypeErrors: false
    }
  ]
});
```
:::