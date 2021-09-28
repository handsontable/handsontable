---
title: Binding to data
metaTitle: Binding to data - Guide - Handsontable Documentation
permalink: /next/binding-to-data
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

## Array of arrays

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

## Array of arrays with a selective display of columns

The following example shows how you would use the array of arrays with a selective display of columns. This scenario uses the same data source as in the previous example, this time omitting the **Tesla** column from the grid.

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

## Array of objects

An **array of objects** can be used as a data source as follows:

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

## Array of objects with column as a function

It is possible to define **columns** as a function. This is good practice when you want to bind data more dynamically.

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

## Array of objects with column mapping

In a scenario where you have nested objects, you can use them as the data source by mapping the columns using the **columns** option.

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

## Array of objects with custom data schema

When using object data binding, Handsontable needs to know what data structure to create when adding a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In a scenario where you start with an empty data source, you will need to provide the **dataSchema** option containing the data structure for any new row added to the grid. The example below shows a custom data schema with an empty data source:

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

## Function data source and schema

If your **dataSchema** is a constructor of an object that doesn't directly expose its members, you can specify functions for the **data** member of each **columns** item.

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

## Understand binding as a reference

Handsontable binds to your data source by reference, not by values. We don't copy the input dataset, and we rely on JavaScript to handle the objects. Any data entered into the grid will alter the original data source.

**Note:** Handsontable initializes the source data for the table using a reference, but you shouldn't rely on it. For example, you shouldn't change values in the source data using the reference to the input dataset. Some mechanisms for handling data aren't prepared for external changes that are made in this way.

To avoid this scenario, copy the data before you pass it to the grid. To change the data from outside Handsontable, you can use our API methods. For example, a change being made will be displayed immediately on the screen after calling [setDataAtCell](@/api/core.md#setdataatcell) method.

::: example #example9
```js
const container = document.getElementById('example9');

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

const hot = new Handsontable(container, {
  data: JSON.parse(JSON.stringify(data)),
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
