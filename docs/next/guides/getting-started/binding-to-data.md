---
title: Binding to data
permalink: /next/binding-to-data
canonicalUrl: /binding-to-data
tags:
  - data binding
  - data connect
  - data sources
---

# Binding to data

[[toc]]

## Array of arrays

Array of arrays is the most popular choice for the more spreadsheet-like cases in which you need to give the end-user the right to manipulate the grid, eg. inserting columns, rows, decorating cells, and more.

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

Let's say, you want the same data source, but without the **Tesla** column:

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

You can use an **array of objects** as a data source.

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

You can define **columns** as a function. That can be a good choice when you want to bind data more dynamically.

::: example #example4 .custom-class
```js
const container = document.getElementById('example4');

const data = [
  { id: 1, name: {first: "Ted", last: "Right"}, address: "" },
  { id: 2, address: "" },// HOT will create missing properties on demand
  { id: 3, name: {first: "Joan", last: "Well"}, address: "" }
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

Some people have nested objects. They can also be used at the data source with a little bit of column mapping. The mapping is done using the **columns** option.

::: example #example5
```js
const container = document.getElementById('example5');

const data = [
  { id: 1, name: {first: "Ted", last: "Right"}, address: "" },
  { id: 2, address: "" }, // HOT will create missing properties on demand
  { id: 3, name: {first: "Joan", last: "Well"}, address: "" }
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

When you use object data binding, Handsontable needs to know the data structure to create when you add a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In case you want to start with an empty data source, you will need to provide the **dataSchema** option that contains the data structure for any new row added to the grid. The below example shows custom data schema with an empty data source:

::: example #example6
```js
const container = document.getElementById('example6');

const hot = new Handsontable(container, {
  data: [],
  dataSchema: { id: null, name: { first: null, last: null }, address: null },
  startRows: 5,
  startCols: 4,
  height: 'auto',
  width: 'auto',
  colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
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

If your **dataSchema** is actually a constructor of an object that doesn't directly expose its members, you can specify functions for the **data** member of each **columns** item.

The below example shows a small example of using such objects:

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
  colHeaders: ['ID', 'Name', 'Address'],
  height: 'auto',
  width: 'auto',
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
    "id": undefined,
    "name": undefined,
    "address": undefined
  };
  let _priv = {};

  for (const i in opts) {
    if (opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function (attr, val) {
    if (typeof val === 'undefined') {
      window.console && console.log("GET the", attr, "value of", _pub);

      return _priv[attr];
    }

    window.console && console.log("SET the", attr, "value of", _pub);
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

Handsontable binds to your data source by reference (not by values, we don't copy input dataset; we rely on the way how JavaScript handle objects). Therefore, all the data entered in the grid will alter the original data source.

**Note:** You should know the fact that Handsontable initialize source data for the table using a reference, but you shouldn't rely on it. For example, you shouldn't change values in source data using the reference to input dataset. Some mechanisms for handling data aren't prepared for changes from the outside, done in this way.

If you have to avoid that, copy the data before you pass it to the grid. To change the data from outside Handsontable you can use our API methods, for example a change being made will be displayed immediately on the screen after calling [setDataAtCell](api/core.md#setDataAtCell) method.

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
const settings = { data: data, licenseKey: 'non-commercial-and-evaluation' };

const hot = new Handsontable(container, settings);

hot.setDataAtCell(0, 1, 'Ford');
```
:::

## Working with a copy of data

To work with a copy of data for Handsontable, it is suggested to clone the data source before loading it into Handsontable. This can be done with `JSON.parse(JSON.stringify(data))` or another deep-cloning function.

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
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
