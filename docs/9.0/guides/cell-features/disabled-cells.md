---
title: Disabled cells
metaTitle: Disabled cells - Guide - Handsontable Documentation
permalink: /9.0/disabled-cells
canonicalUrl: /disabled-cells
tags:
  - read-only
  - noneditable
---

# Disabled cells

[[toc]]

## Overview

Disabling a cell makes the cell read-only or non-editable. Both have similar outcomes, the difference between the two being that the non-editable cells allow the drag-to-fill functionality, whereas read-only cells do not.

## Read-only columns

In many use cases, you will need to configure a certain column to be read-only. This column will be available for keyboard navigation and <kbd>CTRL+C</kbd>. Editing and pasting data will be disabled.

To make a column read-only, declare it in the `columns` setting. You can also define a special renderer function that will dim the read-only values, providing a visual cue for the user that the cells are read-only.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
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

This example makes cells that contain the word "Nissan" read-only. It forces all cells to be processed by the `cells` function which will decide whether a cell's metadata should have the `readOnly` property set.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

hot.updateSettings({
  cells(row, col) {
    const cellProperties = {};

    if (hot.getData()[row][col] === 'Nissan') {
      cellProperties.readOnly = true;
    }

    return cellProperties;
  }
});
```
:::

## Read-only cells vs. non-editable cells

Non-editable cells behave like any other cells apart from preventing you from manually changing their values. You are still able to copy-paste or drag-to-fill the data. There is no additional CSS class added. Read-only cells do not permit the drag-to-fill functionality.

## Non-editable columns

In many cases, you will need to configure a certain column to be non-editable. Doing this does not change its basic behaviour, apart from editing. This means that you can still use the keyboard navigation <kbd>CTRL+C</kbd>, and <kbd>CTRL+V</kbd> functionalities, and drag-to-fill, etc.

To make a column non-editable, declare it in the `columns` setting. You can also define a special renderer function that will dim the `editor` value. This will provide the user with a visual cue that the cell is non-editable.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
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

The following example shows the table with non-editable cells containing the word "Nissan". This cell property is optional and can be easily set in the Handsontable configuration.

::: example #example4
```js
const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

hot.updateSettings({
  cells(row, col, prop) {
    const cellProperties = {};

    if (hot.getDataAtRowProp(row, prop) === 'Nissan') {
      cellProperties.editor = false;

    } else {
      cellProperties.editor = 'text';
    }

    return cellProperties;
  }
});
```
:::
