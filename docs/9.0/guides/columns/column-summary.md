---
title: Column summary
metaTitle: Column summary - Guide - Handsontable Documentation
permalink: /9.0/column-summary
canonicalUrl: /column-summary
tags:
  - column summaries
  - calculations
  - formulas
  - functions
---

# Column summary

[[toc]]

## Overview

With this feature, you can create a summary row at the bottom of the table.

Each cell in the summary row presents the result of a calculation based on the values in the column. Think of this plugin as a pre-defined set of functions such as `sum`, `average`, `max`, and more.

## Basic example

This example retrieves information about the values in the following three columns:

- The `min` value in Column 1
- The `max` value in Column 3
- The `sum` of all values in Column 5

The index of the first column and row in Handsontable always starts from 0. In this case **Column 1** has index 0.

::: example #example1
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

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: generateData(),
  height: 'auto',
  colHeaders(index) { // replace the default header labels
    return 'Column ' + (index + 1);
  },
  rowHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 1,
      type: 'min'
    },
    {
      destinationRow: 4,
      destinationColumn: 3,
      type: 'max'
    },
    {
      destinationRow: 4,
      destinationColumn: 5,
      type: 'sum',
      forceNumeric: true
    }
  ]
});
```
:::

## Basic setup

To initialize the **columnSummary** plugin, you need to set a property in the Settings object. The `columnSummary` property should be declared as an `array of objects`, where each object represents a single endpoint, i.e., the "output" cell or a single calculation.

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

You need to provide the destination coordinates of a row and a column for the cell to display the calculations results. To do this, you need to set two options in the Handsontable configuration, as shown in the example below:

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
  data: generateData(),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 1,
      type: 'min'
    }
  ]
});
```
:::

If the destination cell is at the bottom of the table, you might find the `reversedRowCoords` useful. It counts the rows' coordinates from the bottom up.

In the example below, enabling this option will put the calculation result in a cell in the 5th column (starting from 0) and the 2nd row from the bottom of the table.

::: example #example8
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

const container = document.querySelector('#example8');

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

## Setting the calculation range

By default, the plugin makes calculations on data from all rows in the endpoint's destination column. However, you can specify it differently by column and row.

The properties responsible for this are `ranges` and `sourceColumn`.

### Row ranges

The `**ranges**` option specifies the row range that will be included in the calculations. It should be declared as an `array of arrays`, where each of the arrays represents a single row range.

In the example below, this configuration would perform the calculations for rows: `0`, `1`, `2`, `3`, `4`, `6`, `8` and `9`.

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

The **sourceColumn** option specifies the column to work on.

For example, this will make operations on the 3rd column (again, we're starting from 0):

::: example #example10
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

const container = document.querySelector('#example10');

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

::: example #example11
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

const container = document.querySelector('#example11');

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

::: example #example12
```js
const container = document.getElementById('example12');

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

Counts the non-empty values in the specified column and row range.

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

::: example #example13
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

const container = document.querySelector('#example13');

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

If your table doesn't contain only numeric data, you can try to force the values to be numeric in the calculations. For example, "9a" can be treated as "9" thanks to this option. To enable this feature, you will need to set the `forceNumeric` property to `true`.

Enabling this option can prove useful, as text-based Handsontable cells stores their contents as strings.

By default this option is **disabled**.

::: example #example14
```js
const container = document.querySelector('#example14');

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

If your table doesn't contain only numeric data, you can either skip the non-numeric entries in the calculation, throw an error, or try to parse them to `float` using the `forceNumeric` option. If you choose to throw the errors, you need to set the `suppressDataTypeErrors` property to `false`.

By default, `suppressDataTypeErrors` is set to `true`.

```js
columnSummary: [
  {
    // ...
    suppressDataTypeErrors: false
  }
]
```

### Making the endpoint cells read-only

You can make the cells with the calculation results "read-only" by setting the `readOnly` option to `true`.

This option is set to `true` by default.

### Rounding values after the decimal point

If you wish to round the calculation result to a specific number of digits after the decimal point, you need to use the `roundFloat` parameter.
This setting rounds the calculation result to the appropriate amount of digits.

::: example #example15
```js
const container = document.querySelector('#example15');

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
