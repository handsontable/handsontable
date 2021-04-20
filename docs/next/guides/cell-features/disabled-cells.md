---
title: Disabled cells
permalink: /next/disabled-cells
canonicalUrl: /disabled-cells
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
  licenseKey: 'non-commercial-and-evaluation',
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
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation'
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

## Read-only cells vs non-editable cells

Non-editable cells behave like any other cells apart from preventing you from manually changing their values. You are still allowed to copy-paste or drag-to-fill the data. There is no additional CSS class added.

## Non-editable columns

In many cases you will need to configure a certain column to be non-editable. Doing it does not change it's basic behaviour (apart from editing), which means you are still available to use keyboard navigation, <kbd>CTRL+C</kbd> and <kbd>CTRL+V</kbd> functionalities, drag-to-fill etc.

To make a column non-editable, declare it in the `columns` setting. You can also define a special renderer function that will dim the `editor` value.

::: example #example1
```js
var container1 = document.getElementById('example1'),
  hot1;

hot1 = new Handsontable(container1, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      editor: false
    },
    {
      data: 'year',
      editor: 'numeric'
    },
    {
      data: 'chassis',
      editor: 'text'
    },
    {
      data: 'bumper',
      editor: 'text'
    }
  ]
});
```
:::

## Non-editable specific cells

The following example shows the table with non-editable cells containing the word "Nissan". This property of the cell is optional and can be easily set in the configuration of Handsontable.

::: example #example2
```js
var container2 = document.getElementById('example2'),
    hot2;

hot2 = new Handsontable(container2, {
  data: [
    {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'},
    {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'},
    {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'},
    {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'}
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation'
});
hot2.updateSettings({
  cells: function (row, col, prop) {
    var cellProperties = {};

    if (hot2.getDataAtRowProp(row, prop) === 'Nissan') {
      cellProperties.editor = false;
    } else {
      cellProperties.editor = 'text';
    }

    return cellProperties;
  }
});
```
:::
