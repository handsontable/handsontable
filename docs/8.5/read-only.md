---
title: Read-only
permalink: /8.5/read-only
canonicalUrl: /read-only
---

# {{ $frontmatter.title }}

[[toc]]

## Read-only columns

In many usage cases, you will need to configure a certain column to be read only. This column will be available for keyboard navigation and CTRL+C. Only editing and pasting data will be disabled.

To make a column read-only, declare it in the `columns` setting. You can also define a special renderer function that will dim the read-only values.

::: example #example1
```js
var container1 = document.getElementById('example1');
var hot1 = new Handsontable(container1, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {
      data: 'car',
      readOnly: true
    },
    {
      data: 'year'
    },
    {
      data: 'chassis'
    },
    {
      data: 'bumper'
    }
  ]
});
```
:::

## Read-only specific cells

This example makes cells that contain the word "Nissan" read only. It forces all cells to be processed by the `cells` function which will decide whether a cell meta should have set `readOnly` property.

::: example #example2
```js
var container2 = document.getElementById('example2');
var hot2 = new Handsontable(container2, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color']

});

hot2.updateSettings({
  cells: function (row, col) {
    var cellProperties = {};

    if (hot2.getData()[row][col] === 'Nissan') {
      cellProperties.readOnly = true;
    }

    return cellProperties;
  }
});
```
:::

## Read-only comments

This example makes the comment attached to a cell that contain the word "Tesla" read only.

You can compare it with the comment inside a cell with "Honda" wording.

::: example #example3
```js
var container3 = document.getElementById('example3'),
  hot3;

  hot3 = new Handsontable(container3, {
    data: [
      ['', 'Tesla', 'Toyota', 'Honda', 'Ford'],
      ['2018', 10, 11, 12, 13, 15, 16],
      ['2019', 10, 11, 12, 13, 15, 16],
      ['2020', 10, 11, 12, 13, 15, 16],
    ],
    rowHeaders: true,
    colHeaders: true,
    contextMenu: true,
    comments: true,
    cell: [
      {row: 0, col: 1, comment: {value: 'A read-only comment.', readOnly: true}},
      {row: 0, col: 3, comment: {value: 'You can edit this comment!'}}
    ]
  });
```
:::
