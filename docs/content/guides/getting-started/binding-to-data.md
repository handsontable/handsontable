---
title: Binding to data
metaTitle: Binding to data - Guide - Handsontable Documentation
permalink: /binding-to-data
canonicalUrl: /binding-to-data
tags:
  - data binding
  - data connect
  - data sources
---

# Binding to data

[[toc]]

## Overview
The following guide provides information on using a data source and manipulating how the data is displayed in the data grid.

## Compatible data types

### Array of arrays

Array of arrays is the most popular choice for the more grid-like scenarios where you need to provide the end-user with permission to manipulate the grid, e.g., insert columns, delete rows, decorate cells, etc.

::: example #example1
```js
const container = document.getElementById('example1');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];

const hot = new Handsontable(container, {
  data,
  startRows: 5,
  startCols: 5,
  height: 'auto',
  width: 'auto',
  colHeaders: true,
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Array of arrays with a selective display of columns

The following example shows how you would use the array of arrays with a selective display of columns. This scenario uses the same data source as in the previous example, this time omitting the `Tesla` column from the grid.

::: example #example2
```js
const container = document.getElementById('example2');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  minSpareRows: 1,
  height: 'auto',
  width: 'auto',
  columns: [
    { data: 0 },
    // skip the second column
    { data: 2 },
    { data: 3 },
    { data: 4 },
    { data: 5 },
    { data: 6 }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Array of objects

An array of objects can be used as a data source as follows:

::: example #example3
```js
const container = document.getElementById('example3');

const data = [
  { id: 1, name: 'Ted Right', address: '' },
  { id: 2, name: 'Frank Honest', address: '' },
  { id: 3, name: 'Joan Well', address: '' },
  { id: 4, name: 'Gail Polite', address: '' },
  { id: 5, name: 'Michael Fair', address: '' },
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Array of objects with column as a function

You can set the [`columns`](@/api/options.md#columns) configuration option to a function. This is good practice when you want to bind data more dynamically.

::: example #example4 .custom-class
```js
const container = document.getElementById('example4');

const data = [
  { id: 1, name: {first: 'Ted', last: 'Right'}, address: '' },
  { id: 2, address: '' },// HOT will create missing properties on demand
  { id: 3, name: {first: 'Joan', last: 'Well'}, address: '' }
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: function(column) {
    let columnMeta = {};

    if (column === 0) {
      columnMeta.data = 'id';
    } else if (column === 1) {
      columnMeta.data = 'name.first';
    } else if (column === 2) {
      columnMeta.data = 'name.last';
    } else if (column === 3) {
      columnMeta.data = 'address';
    } else {
      columnMeta = null;
    }

    return columnMeta;
  },
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Array of objects with column mapping

In a scenario where you have nested objects, you can use them as the data source by mapping the columns using the [`columns`](@/api/options.md#columns) option.

::: example #example5
```js
const container = document.getElementById('example5');

const data = [
  { id: 1, name: {first: 'Ted', last: 'Right'}, address: '' },
  { id: 2, address: '' }, // HOT will create missing properties on demand
  { id: 3, name: {first: 'Joan', last: 'Well'}, address: '' }
];

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'address' }
  ],
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Array of objects with custom data schema

When using object data binding, Handsontable needs to know what data structure to create when adding a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In a scenario where you start with an empty data source, you will need to provide the [`dataSchema`](@/api/options.md#dataschema) option containing the data structure for any new row added to the grid. The example below shows a custom data schema with an empty data source:

::: example #example6
```js
const container = document.getElementById('example6');

const hot = new Handsontable(container, {
  data: [],
  dataSchema: { id: null, name: { first: null, last: null }, address: null },
  startRows: 5,
  startCols: 4,
  colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
  height: 'auto',
  width: 'auto',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'address' }
  ],
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Function data source and schema

If your [`dataSchema`](@/api/options.md#dataschema) is a constructor of an object that doesn't directly expose its members, you can specify functions for the [`data`](@/api/options.md#data) member of each [`columns`](@/api/options.md#columns) item.

The example below shows how to use such objects:

::: example #example7
```js
const container = document.getElementById('example7');

const hot = new Handsontable(container, {
  data: [
    model({ id: 1, name: 'Ted Right', address: '' }),
    model({ id: 2, name: 'Frank Honest', address: '' }),
    model({ id: 3, name: 'Joan Well', address: '' }),
    model({ id: 4, name: 'Gail Polite', address: '' }),
    model({ id: 5, name: 'Michael Fair', address: '' })
  ],
  dataSchema: model,
  height: 'auto',
  width: 'auto',
  colHeaders: ['ID', 'Name', 'Address'],
  columns: [
    { data: property('id') },
    { data: property('name') },
    { data: property('address') }
  ],
  minSpareRows: 1,
  licenseKey: 'non-commercial-and-evaluation'
});

function model(opts) {
  let _pub = {
    id: undefined,
    name: undefined,
    address: undefined
  };
  let _priv = {};

  for (const i in opts) {
    if (opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function (attr, val) {
    if (typeof val === 'undefined') {
      window.console && console.log('GET the', attr, 'value of', _pub);

      return _priv[attr];
    }

    window.console && console.log('SET the', attr, 'value of', _pub);
    _priv[attr] = val;

    return _pub;
  };

  return _pub;
}

function property(attr) {
  return function (row, value) {
    return row.attr(attr, value);
  }
}
```
:::

### No data

By default, if you don't provide any data, Handsontable renders as an empty 5x5 grid.

::: example #example9
```js
const container = document.getElementById('example9');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

To change the number of rows or columns rendered by default, use the [`startRows`](@/api/options.md#startrows) and [`startCols`](@/api/options.md#startcols) options.

## Data-manipulating API methods

There are multiple ways you can insert your data into Handsontable. Let's go through the most useful ones:

### The [`data`](@/api/options.md#data) configuration option
You will probably want to initialize the table with some data (if you don't, the table will render an empty 5x5 grid for you). The easiest way to do it is passing your data array as [`data`](@/api/options.md#data) option in the initial config object:
```js
const hot = new Handsontable(container, {
  data: newDataset,
  // ... other config options
});
```

### The data-loading API methods
To replace the entire data in an already-initialized Handsontable instance, you can use one of the data-loading API methods:

- [`loadData()`](@/api/core.md#loaddata)<br>
  Replaces the data used in Handsontable with the dataset provided as the method argument. <br> **Note:** Since version `12.0.0` this method causes the table to reset its configuration options and index mapper information, so some of the work done on the table since its initialization might be lost.
  ```js
  hot.loadData(newDataset);
  ```
- [`updateData()`](@/api/core.md#updatedata)<br>
  Replaces the data used in Handsontable with the dataset provided as the method argument. Unlike [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata) does NOT reset the configuration options and/or index mapper information, so it can be safely used to replace just the data, leaving the rest of the table intact.
  ```js
  hot.updateData(newDataset);
  ```
- [`updateSettings()`](@/api/core.md#updatesettings)<br>
  Used to update the configuration of the table, [`updateSettings()`](@/api/core.md#updatesettings) can be also used to replace the data being used. Since version `12.0.0`, under the hood it utilizes the [`updateData()`](@/api/core.md#updatedata) method to perform the data replacement (apart from the one automatic call done during the initialization, where it uses [`loadData()`](@/api/core.md#loaddata)).
  ```js
  hot.updateSettings({
    data: newDataset,
    // ... other config options
  });
  ```

### The data-modifying API methods
To modify just a subset of data passed to Handsontable, these are the methods you might want to check out:

- [`setDataAtCell()`](@/api/core.md#setdataatcell)<br>
  Used to replace data in a single cell or to perform a series of single-cell data replacements:
  ```js
  // Replaces the cell contents at the (0, 2) visual coordinates (0 being the visual row index, 2 - the visual column index) with the supplied value.
  hot.setDataAtCell(0, 2, 'New Value');

  // Replaces the cells at `(0,2)`, `(1,2)` and `(2,2)` with the provided values.
  const changes = [
    [0, 2, 'New Value'],
    [1, 2, 'Different Value'],
    [2, 2, 'Third Replaced Value'],
  ];
  hot.setDataAtCell(changes);
  ```

- [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)<br>
  Used to replace data in a single cell or to perform a series of single-cell data replacements, analogously to `setDataAtCell()`, but allows targeting the cells by the visual row index and data row *property*. Useful for the [Array of objects data type](#array-of-objects).
  ```js
  // Replaces the cell contents at the (0, 'title') coordinates (0 being the visual row index, 'title' - the data row object property) with the supplied value.
  hot.setDataAtRowProp(0, 'title', 'New Value');

  // Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first row with the provided values.
  const changes = [
    [0, 'id', '22'],
    [0, 'firstName', 'John'],
    [0, 'lastName', 'Doe'],
  ];
  hot.setDataAtRowProp(changes);
  ```

- [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell)<br>
  As the displayed data coordinates can differ from the way it's stored internally, sometimes you might need to target the cells more directly - that's when [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell) comes in handy. The `row` and `columns`/`prop` arguments represent the *physical* indexes.
  ```js
  // Replaces the cell contents at the (0, 2) coordinates (0 being the physical row index, 2 - the physical column index) with the supplied value.
  hot.setSourceDataAtCell(0, 2, 'New Value');

  // Replaces the cell contents at the (0, 'title') coordinates (0 being the physical row index, 'title' - the data row property) with the supplied value.
  hot.setSourceDataAtCell(0, 'title', 'New Value');

  // Replaces the cells with the props of 'id', 'firstName' and 'lastName' in the first physical row with the provided values.
  const changes = [
    [0, 'id', '22'],
    [0, 'firstName', 'John'],
    [0, 'lastName', 'Doe'],
  ];
  hot.setSourceDataAtCell(changes);
  ```
- [`populateFromArray()`](@/api/core.md#populatefromarray)<br>
  Used to replace a chunk of the dataset by provided the start (and optionally end) coordinates and a two-dimensional data array of new values.
  ```js
  const newValues = [
    ['A', 'B', 'C'],
    ['D', 'E', 'F']
  ];

  // Replaces the values from (1, 1) to (2, 3) visual cell coordinates with the values from the `newValues` array.
  hot.populateFromArray(1, 1, newValues);

  // Replaces the values from (1, 1) to (2, 2) visual cell coordinates with the values from the `newValues` array, ommiting the values that would fall outside of the defined range.
  hot.populateFromArray(1, 1, newValues, 2, 2);
  ```

## Understand binding as a reference

Handsontable binds to your data source by reference, not by values. We don't copy the input dataset, and we rely on JavaScript to handle the objects. Any data entered into the grid will alter the original data source.

**Note:** Handsontable initializes the source data for the table using a reference, but you shouldn't rely on it. For example, you shouldn't change values in the source data using the reference to the input dataset. Some mechanisms for handling data aren't prepared for external changes that are made in this way.

To avoid this scenario, copy the data before you pass it to the grid. To change the data from outside Handsontable, you can use our API methods. For example, a change being made will be displayed immediately on the screen after calling the [`setDataAtCell()`](@/api/core.md#setdataatcell) method.

::: example #example10
```js
const container = document.getElementById('example10');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];
const settings = {
  data: data,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
};

const hot = new Handsontable(container, settings);

hot.setDataAtCell(0, 1, 'Ford');
```
:::

## Working with a copy of data

When working with a copy of data for Handsontable, it is best practice is to clone the data source before loading it into Handsontable. This can be done with `JSON.parse(JSON.stringify(data))` or another deep-cloning function.

::: example #example11
```js
const container = document.getElementById('example11');

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];

const hot = new Handsontable(container, {
  data: JSON.parse(JSON.stringify(data)),
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Related API reference

- Configuration options:
  - [`data`](@/api/options.md#data)
  - [`dataSchema`](@/api/options.md#dataschema)
- Core methods:
  - [`alter()`](@/api/core.md#alter)
  - [`clear()`](@/api/core.md#clear)
  - [`getData()`](@/api/core.md#getdata)
  - [`getDataAtCell()`](@/api/core.md#getdataatcell)
  - [`getDataAtCol()`](@/api/core.md#getdataatcol)
  - [`getDataAtProp()`](@/api/core.md#getdataatprop)
  - [`getDataAtRow()`](@/api/core.md#getdataatrow)
  - [`getDataAtRowProp()`](@/api/core.md#getdataatrowprop)
  - [`getSchema()`](@/api/core.md#getschema)
  - [`getSourceData()`](@/api/core.md#getsourcedata)
  - [`getSourceDataArray()`](@/api/core.md#getsourcedataarray)
  - [`getSourceDataAtCell()`](@/api/core.md#getsourcedataatcell)
  - [`getSourceDataAtCol()`](@/api/core.md#getsourcedataatcol)
  - [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow)
  - [`loadData()`](@/api/core.md#loaddata)
  - [`populateFromArray()`](@/api/core.md#populatefromarray)
  - [`setDataAtCell()`](@/api/core.md#setdataatcell)
  - [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)
  - [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell)
  - [`updateData()`](@/api/core.md#updatedata)
  - [`updateSettings()`](@/api/core.md#updatesettings)
- Hooks:
  - [`afterCellMetaReset`](@/api/hooks.md#aftercellmetareset)
  - [`afterChange`](@/api/hooks.md#afterchange)
  - [`afterLoadData`](@/api/hooks.md#afterloaddata)
  - [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell)
  - [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)
  - [`afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell)
  - [`afterUpdateData`](@/api/hooks.md#afterupdatedata)
  - [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)
  - [`beforeAutofillInsidePopulate`](@/api/hooks.md#beforeautofillinsidepopulate)
  - [`beforeLoadData`](@/api/hooks.md#beforeloaddata)
  - [`beforeUpdateData`](@/api/hooks.md#beforeupdatedata)
  - [`modifyData`](@/api/hooks.md#modifydata)
  - [`modifyRowData`](@/api/hooks.md#modifyrowdata)
  - [`modifySourceData`](@/api/hooks.md#modifysourcedata)
