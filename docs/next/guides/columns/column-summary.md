---
title: Column summary
metaTitle: Column summary - Guide - Handsontable Documentation
permalink: /next/column-summary
canonicalUrl: /column-summary
tags:
  - column summaries
  - calculations
  - formulas
  - functions
---

# Column summary

[[toc]]

You can easily calculate and display column summaries, using the [`ColumnSummary`](@/api/columnSummary.md) plugin.

## About column summary

The [`ColumnSummary`](@/api/columnSummary.md) plugin lets you quickly summarize a column, in any way you want.

To set up the way a column summary is calculated, you can:
- Either select one of our [predefined column summary functions](#column-summary-functions)
- Or define a [custom column summary function]()

### Column summary functions

You can use the following column summary functions:

| Function                                                                                                                   | Description                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`sum`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L146-L161)     | Returns the sum of all values in a column.                                                         |
| [`min`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L193-L226)     | Returns the lowest value in a column.                                                              |
| [`max`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L193-L226)     | Returns the highest value in a column.                                                             |
| [`count`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L293-L313)   | Returns the number of all non-empty cells in a column.                                             |
| [`average`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L315-L327) | Returns the sum of all values in a column,<br>divided by the number of non-empty cells in that column. |
| [`custom`](https://github.com/handsontable/handsontable/blob/master/src/plugins/columnSummary/columnSummary.js#L138-L139)  | Lets you define a custom column summary function.                                                  |

### Column summary example

The example below calculates and displays the following column summaries:
- The sum of all values ([`sum`](@/api/columnSummary.md#options)) in the first column (the column with index `0`)
- The lowest value ([`min`](@/api/columnSummary.md#options)) in the second column (the column with index `1`)
- The highest value ([`max`](@/api/columnSummary.md#options)) in the third column (the column with index `2`)
- The number of non-empty cells ([`count`](@/api/columnSummary.md#options)) in the fourth column (the column with index `3`)
- The average value ([`average`](@/api/columnSummary.md#options)) in the fifth column (the column with index `4`)

::: example #example1
```js
// generate an array of arrays with dummy data
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

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  // use the generated dummy data to initialize a Handsontable instance
  data: generateData(),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  // enable and configure the `ColumnSummary` plugin
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 0,
      type: 'sum',
      forceNumeric: true
    },
    {
      destinationRow: 4,
      destinationColumn: 1,
      type: 'min'
    },
    {
      destinationRow: 4,
      destinationColumn: 2,
      type: 'max'
    },
    {
      destinationRow: 4,
      destinationColumn: 3,
      type: 'count'
    },
    {
      destinationRow: 4,
      destinationColumn: 4,
      type: 'average'
    }
  ]
});
```
:::

## Setting up a column summary

To set up a column summary, follow the steps below.

### Step 1: Enable the `ColumnSummary` plugin

### Step 2: Specify what you want to summarize

### Step 3: Select the summary calculation function

### Step 4: Display the summary

## Column summary options

## Column summary API methods

## Basic setup

To initialize the `ColumnSummary` plugin, set a `columnSummary` property in your Handsontable instance's `settings` object.

Declare the `columnSummary` property as an array of objects, where each object represents a single endpoint, i.e. the "output" cell or a single calculation.

```js
columnSummary: [
  {
    destinationRow: 2,
    destinationColumn: 2,
    type: 'min',
    // other options...
  },
  {
    destinationRow: 3,
    destinationColumn: 3,
    type: 'max',
    // other options...
  }
]
```

## Setting the destination cell

To display a summary result in a cell, provide the cell's coordinates, using the following properties:
- `destinationRow`
- `destinationColumn`

For example:

::: example #example2
```js
// Generate an array of arrays with a dummy data
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

const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: generateData(),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      // add the destination cell's row index
      destinationRow: 4,
      // add the destination cell's column index
      destinationColumn: 1,
      type: 'min'
    }
  ]
});
```
:::

The `ColumnSummary` plugin doesn't automatically add new rows to display its summary results.

So, to display a summary result below your existing rows:
- Either [set the `reversedRowCoords` option to `true`](#reversedrowcoords)
- Or [add an empty row at the bottom of your table](#add-an-empty-row)

### `reversedRowCoords`

If the destination cell is at the bottom of the table, you might find the `reversedRowCoords` useful. It counts the rows' coordinates from the bottom up.

In the example below, enabling this option will put the calculation result in a cell in the 5th column (starting from 0) and the 2nd row from the bottom of the table.

::: example #example3
```js
// Generate an array of arrays with a dummy data
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

const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: generateData(),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 1,
      destinationColumn: 4,
      reversedRowCoords: true,
      type: 'min'
    }
  ]
});
```
:::

### Add an empty row

To display your summary result below your existing rows, you can also add an empty row at the bottom of your table (the `columnSummary` plugin doesn't add such an empty row automatically).

For example:

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    [0.5, 0.5],
    [0.5, 0.5],
    [1, 1],
    // add an empty row
    [null]
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'average'
    }
  ]
});
```
:::

## Setting the calculation range

By default, the `ColumnSummary` plugin makes calculations on data from all rows in the endpoint's destination column. However, you can specify it differently by column and row.

The properties responsible for this are `ranges` and `sourceColumn`.

### Row ranges

The `ranges` option specifies the row range that will be included in the calculations. It should be declared as an array of arrays, where each of the arrays represents a single row range.

In the example below, this configuration would perform the calculations for rows: `0`, `1`, `2`, `3`, `4`, `6`, `8` and `9`.

::: example #example5
```js
// Generate an array of arrays with a dummy data
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

const container = document.querySelector('#example5');

const hot = new Handsontable(container, {
  data: generateData(10, 3),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      ranges: [
        [0, 4], [6], [8, 9]
      ],
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'sum',
      forceNumeric: true
    }
  ]
});
```
:::

### Column source

The `sourceColumn` option specifies the column to work on.

For example, this will make operations on the 3rd column (again, we're starting from `0`):

::: example #example6
```js
// Generate an array of arrays with a dummy data
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

const container = document.querySelector('#example6');

const hot = new Handsontable(container, {
  data: generateData(5, 5),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      sourceColumn: 2,
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'sum',
      forceNumeric: true
    }
  ]
});
```
:::

## Providing the settings as a function

You can provide a function instead of an array as the config item. The function has to return an array of objects, similarly to a traditional setup method. See the example below:

::: example #example7
```js
// Generate an array of arrays with a dummy data
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

const container = document.querySelector('#example7');

const hot = new Handsontable(container, {
  data: generateData(5, 5, false),
  height: 'auto',
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary() {
    const configArray = [];
    const summaryTypes = ['sum', 'min', 'max', 'count', 'average'];

    for (let i = 0; i < this.hot.countCols(); i++) { // iterate over visible columns
      configArray.push({
        sourceColumn: i,
        destinationRow: 0,
        destinationColumn: i,
        type: summaryTypes[i],
        forceNumeric: true
      });
    }

    return configArray;
  }
});
```
:::

This allows many possible usages: for example, you can sum subtotals for nested groups.

::: example #example8
```js
const container = document.getElementById('example8');

const hot = new Handsontable(container, {
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
  licenseKey: 'non-commercial-and-evaluation',
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

## Available calculations

### Sum

Calculates the sum of values in the specified column and row range.

Usage:

```js
columnSummary: [
  {
    // ...
    type: 'sum'
  }
]
```

### Min

Finds the lowest value in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'min'
  }
]
```

### Max

Finds the highest value in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'max'
  }
]
```

### Count

Counts the number of non-empty values in the specified column and row range.

:::tip
`count` counts `null` values, but doesn't count empty strings.
:::

```js
columnSummary: [
  {
    // ...
    type: 'count'
  }
]
```

### Average

Calculates the average from the values in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'average'
  }
]
```

### Custom

Takes a custom function and applies it to the values in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'custom',
    customFunction(endpoint) {
      // endpoint is an object containing the endpoint data

      // your function
    }
  }
]
```

### Example of calculations

::: example #example9
```js
// Generate an array of arrays with a dummy data
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
  data: generateData(5, 7),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'sum',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      type: 'min',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 2,
      reversedRowCoords: true,
      type: 'max',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 3,
      reversedRowCoords: true,
      type: 'count',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 4,
      reversedRowCoords: true,
      type: 'average',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 5,
      reversedRowCoords: true,
      type: 'custom',
      customFunction(endpoint) { // this function counts the even values in the column
        const hotInstance = this.hot;
        let evenCount = 0;

        // helper function
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

## Additional options

### Forcing numeric values

If your table contains more data types than just numeric data, you can try to force non-numeric values to be treated as numeric values in the `columnSummary` calculations.

Enabling this option can prove useful, as text-based Handsontable cells store their contents as strings.

To enable this feature, set the `forceNumeric` property to `true` (by default, `forceNumeric` is set to `false`).

:::tip
The `forceNumeric` option uses JavaScript's [parseFloat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat) function.

This means that e.g. `3c` is treated as `3`, but `c3` is still treated as `c3`.
:::

::: example #example10
```js
const container = document.querySelector('#example10');

const hot = new Handsontable(container, {
  data: [
    [0, 1, 2],
    ['3c', '4', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'sum',
      forceNumeric: true
    },
    {
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      type: 'sum',
      forceNumeric: true
    }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Throwing datatype errors

If your table contains more data types than just numeric data, you can:
- Either skip non-numeric values in your `columnSummary` calculations
- Or try to force non-numeric values into numeric values, with the [`forceNumeric` option](#forcing-numeric-values)
- Or throw an error when a non-numeric value is passed to your `columnSummary` calculations
 
To throw errors, set the `suppressDataTypeErrors` property to `false` (by default, `suppressDataTypeErrors` is set to `true`).

::: example #example11
```js
const container = document.querySelector('#example11');

const hot = new Handsontable(container, {
  data: [
    [0, 1, 2],
    ['3c', '4', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'sum',
      suppressDataTypeErrors: false
    },
    {
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      type: 'sum',
      suppressDataTypeErrors: false
    }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Making the endpoint cells read-only

You can make the cells with the calculation results "read-only" by setting the `readOnly` option to `true`.

This option is set to `true` by default.

### Rounding values after the decimal point

If you wish to round the calculation result to a specific number of digits after the decimal point, you need to use the `roundFloat` parameter.
This setting rounds the calculation result to the appropriate amount of digits.

::: example #example12
```js
const container = document.querySelector('#example12');

const hot = new Handsontable(container, {
  data: [
    [0.5, 0.5],
    [0.5, 0.5],
    [1, 1],
    [],[]
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      type: 'average'
    },
    {
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      type: 'average',
      roundFloat: 2
    }
  ]
});
```
:::
