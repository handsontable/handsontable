---
title: Data sources
permalink: /9.0/data-sources
canonicalUrl: /data-sources
---

# {{ $frontmatter.title }}

[[toc]]

::: tip
  Please note that Handsontable will change the original data source.
:::

## Array data source

The most popular way of binding data with Handsontable is to use an **array of arrays**.

::: example #example1
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];

var container1 = document.getElementById('example1');
var hot1 = new Handsontable(container1, {
  data: data,
  startRows: 5,
  startCols: 5,
  height: 'auto',
  width: 'auto',
  colHeaders: true,
  minSpareRows: 1
});
```
:::

## Array data source with a selective display of columns

Let's say, you want the same data source, but without the **Tesla** column:

::: example #example2
```js
var allData = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];

var container = document.getElementById('example2');

var hot2 = new Handsontable(container, {
  data: allData,
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
  ]
});
```
:::

## Object data source

You can use an **array of objects** as a data source.

::: example #example3
```js
var objectData = [
  { id: 1, name: 'Ted Right', address: '' },
  { id: 2, name: 'Frank Honest', address: '' },
  { id: 3, name: 'Joan Well', address: '' },
  { id: 4, name: 'Gail Polite', address: '' },
  { id: 5, name: 'Michael Fair', address: '' },
];

var container3 = document.getElementById('example3');

var hot3 = new Handsontable(container3, {
  data: objectData,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  minSpareRows: 1
});
```
:::

## Object data source with column as a function

You can define **columns** as a function. That can be a good choice when you want to bind data more dynamically.

::: example #example4 .custom-class
```js
var nestedObjects = [
  { id: 1, name: {first: "Ted", last: "Right"}, address: "" },
  { id: 2, address: "" },// HOT will create missing properties on demand
  { id: 3, name: {first: "Joan", last: "Well"}, address: "" }
];

var container4 = document.getElementById('example4');

var hot4 = new Handsontable(container4, {
  data: nestedObjects,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: function(column) {
    var columnMeta = {};

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
  minSpareRows: 1
});
```
:::

## Object data source with column mapping (nested)

Some people have nested objects. They can also be used at the data source with a little bit of column mapping. The mapping is done using the **columns** option.

::: example #example5
```js
var nestedObjects = [
  { id: 1, name: {first: "Ted", last: "Right"}, address: "" },
  { id: 2, address: "" }, // HOT will create missing properties on demand
  { id: 3, name: {first: "Joan", last: "Well"}, address: "" }
];

var container5 = document.getElementById('example5');

var hot5 = new Handsontable(container5, {
  data: nestedObjects,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'address' }
  ],
  minSpareRows: 1
});
```
:::

## Object data source with custom data schema

When you use object data binding, Handsontable needs to know the data structure to create when you add a new row. If your data source contains at least one row, Handsontable will figure out the data structure based on the first row.

In case you want to start with an empty data source, you will need to provide the **dataSchema** option that contains the data structure for any new row added to the grid. The below example shows custom data schema with an empty data source:

::: example #example6
```js
var container = document.getElementById('example6');

var hot6 = new Handsontable(container, {
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
  minSpareRows: 1
});
```
:::

## Function data source and schema

If your **dataSchema** is actually a constructor of an object that doesn't directly expose its members, like a Backbone.js model, you can specify functions for the **data** member of each **columns** item.

The below example shows a small example of using such objects:

::: example #example7
```js
var container7 = document.getElementById('example7');

var hot7 = new Handsontable(container7, {
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
  minSpareRows: 1
});

function model(opts) {
  var _pub = {},
  _priv = { "id": undefined, "name": undefined, "address": undefined };

  for (var i in opts) {
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
