---
title: Summary calculations
permalink: /8.2/summary-calculations
canonicalUrl: /summary-calculations
---

# {{ $frontmatter.title }}

[[toc]]

The Column Summary plugin allows making pre-defined calculations on the cell values and display the results within Handsontable.
You can think of this plugin as pre-defined formulas.

::: example #example1
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var example1 = document.getElementById('example1');

var hot = new Handsontable(example1, {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 1,
      type: 'min'
    },
    {
      destinationRow: 0,
      destinationColumn: 3,
      reversedRowCoords: true,
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

To initialize the _columnSummary_ plugin, you need to properly set a property in the Handsontable initial config.
The `columnSummary` property should be declared as an array of objects, where each object represents a single _endpoint_ (the "output" cell, or a single calculation).

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

The columnSummary plugin requires the user to provide the destination coordinates (row and column number) for the cell to display the calculations results in.

To do that, you need to set two properties in the Handsontable config object:

::: example #example7
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example7');

var hot7 = new Handsontable(container, {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
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

If the destination cell should be closer to the bottom of the table, you might find the `reversedRowCoords` useful. What it does is counting the rows from the _bottom_, not the top, as it usually does.

So, for example, defining the plugin like this puts the calculation result in a cell in the 5th column (we're counting from 0) and 2nd row from the bottom of the table.

::: example #example8
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example8');

var hot8 = new Handsontable(container, {
  data: generateDataObj(),
  colHeaders: true,
  rowHeaders: true,
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

By default, the plugin makes calculations on data from all rows in the endpoint's destination column. However, you can specify it differently (both column and row-wise).

The properties responsible for this are `ranges` and `sourceColumn`.

1. `**ranges**` option specifies the row range to make the calculations on. It should be declared as an _array of arrays_ , where each of the arrays represent a single row range.

    For example, this configuration would do the calculations for rows: `0`, `1`, `2`, `3`, `4`, `6`, `8` and `9`.

   ::: example #example9
   ```js
    var generateDataObj = function(rows, columns, additionalRows) {
      if (additionalRows === void 0) {
        additionalRows = true;
      }

      var data = [];
      var number = 0;

      if (!rows) {
        rows = 3;
      }
      if (!columns) {
        columns = 7;
      }

      for (var i = 0; i < rows; i++) {
        data[i] = [];
        for (var j = 0; j < columns; j++) {
          data[i][j] = number++;
        }
      }

      if (additionalRows) {
        for (i = 0; i < 2; i++) {
          data.push([]);
        }
      }

      return data;
    };

    var container = document.getElementById('example9');
    var hot9 = new Handsontable(container, {
      data: generateDataObj(10, 3),
      colHeaders: true,
      rowHeaders: true,
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

3. `**sourceColumn**` option specifies the column to work on.

    For example, this will make operations on the 3rd column (again, we're counting from 0):

   ::: example #example10
   ```js
    var generateDataObj = function(rows, columns, additionalRows) {
      if (additionalRows === void 0) {
        additionalRows = true;
      }

      var data = [];
      var number = 0;

      if (!rows) {
        rows = 3;
      }
      if (!columns) {
        columns = 7;
      }

      for (var i = 0; i < rows; i++) {
        data[i] = [];
        for (var j = 0; j < columns; j++) {
          data[i][j] = number++;
        }
      }

      if (additionalRows) {
        for (i = 0; i < 2; i++) {
          data.push([]);
        }
      }

      return data;
    };

    var container = document.getElementById('example10');
    var hot10 = new Handsontable(container, {
      data: generateDataObj(5, 5),
      colHeaders: true,
      rowHeaders: true,
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

Since version `1.8.1`, you can provide a function instead of an array as the config item. The function has to return an array of objects, similarly to a traditional setup method.

Take a look at the example below:

::: example #example11
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};

var container = document.getElementById('example11');
var hot11 = new Handsontable(container, {
  data: generateDataObj(5, 5, false),
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  columnSummary: function() {
    var configArray = [];
    var summaryTypes = ['sum', 'min', 'max', 'count', 'average'];
    for (var i = 0; i < 5; i++) {
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

This allows many possible usages: for example, you can easily calculate a total for a group in a group parent combining this plugin with the [Nested Rows plugin](nested-rows.md).

Take a look at this simple demo:

::: example #example12
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example12');

var hot12 = new Handsontable(container, {
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
    {data: 'value'}
  ],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  columnSummary: function() {
    var endpoints = [];
    var nestedRowsPlugin = this.hot.getPlugin('nestedRows');
    var getRowIndex = nestedRowsPlugin.dataManager.getRowIndex.bind(nestedRowsPlugin.dataManager);
    var nestedRowsCache = null;
    var tempEndpoint = null;
    var resultColumn = 0;

    if (nestedRowsPlugin.isEnabled()) {
      nestedRowsCache = this.hot.getPlugin('nestedRows').dataManager.cache;
    } else {
      return;
    }

    for (var i = 0; i < nestedRowsCache.levels[0].length; i++) {
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

##Available calculations

## Sum

Calculates a sum of values in the specified column and row range.

Usage:

```js
columnSummary: [
  {
    // ...
    type: 'sum'
  }
]
```

## Min

Finds the lowest value in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'min'
  }
]
```

## Max

Finds the highest value in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'max'
  }
]
```

## Count

Counts the non-empty values in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'count'
  }
]
```

## Average

Calculates the average from the values in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'average'
  }
]
```

## Custom

Takes a custom function and applies ot to the values in the specified column and row range.

```js
columnSummary: [
  {
    // ...
    type: 'custom',
    customFunction: function(endpoint) {
      // endpoint is an object containing the endpoint data

      // your function
    }
  }
]
```

## Example:

::: example #example13
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example13');

var hot13 = new Handsontable(container, {
  data: generateDataObj(5, 7),
  colHeaders: true,
  rowHeaders: true,
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
      customFunction: function(endpoint) {
        // this function counts the even values in the column

        var evenCount = 0;
        var hotInstance = this.hot;

        // helper function
        function checkRange(rowRange) {
          var i = rowRange[1] || rowRange[0];
          var counter = 0;

          do {

              if (parseInt(hotInstance.getDataAtCell(i, endpoint.sourceColumn), 10)%2 === 0) {
                counter++;
              }

              i--;
            } while (i >= rowRange[0]);
            return counter;
          }

          // go through all declared ranges
          for (var r in endpoint.ranges) {
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

## Forcing numeric values

If your table doesn't contain only numeric data, you can try to force the values to be numeric in the calculations. For example, _9a_ can be treated as _9_. To enable this feature, you'll need to set the `forceNumeric` property to `true`.

Enabling this option might sometimes be a good idea, as text-based Handsontable cells stores their contents as strings, which might cause problems with, for example, the _sum_ function.

By default this option is **disabled**.

::: example #example14
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example14');

var hot14 = new Handsontable(container, {
  data: [
    [0, 1, 2],
    ['3c', '4', 5],
    [], []
  ],
  colHeaders: true,
  rowHeaders: true,
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
  ]
});
```
:::

## Throwing datatype errors

If your table doesn't contain only numeric data, you can either skip the non-numeric entries in the calculation, throw an error or try to parse them to float using the forceNumeric option.
If you choose to throw the errors, you need to set the `suppressDataTypeErrors` property to `false`.

By default, `suppressDataTypeErrors` is set to `true`.

```js
columnSummary: [
  {
    // ...
    suppressDataTypeErrors: false
  }
]
```

## Making the endpoint cells read-only

You can make the the cells with the calculation results read-only by setting the `readOnly` option to `true`.

This option is `true` by default.

## Rounding values after the decimal point

If you wish to round the calculation result to a specific number of digits after the decimal point, you need to use the `roundFloat` parameter.
It's value will result in rounding the result to the appropriate amount of digits.

::: example #example15
```js
var generateDataObj = function(rows, columns, additionalRows) {
  if (additionalRows === void 0) {
    additionalRows = true;
  }

  var data = [];
  var number = 0;

  if (!rows) {
    rows = 3;
  }
  if (!columns) {
    columns = 7;
  }

  for (var i = 0; i < rows; i++) {
    data[i] = [];
    for (var j = 0; j < columns; j++) {
      data[i][j] = number++;
    }
  }

  if (additionalRows) {
    for (i = 0; i < 2; i++) {
      data.push([]);
    }
  }

  return data;
};
var container = document.getElementById('example15');

var hot15 = new Handsontable(container, {
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
