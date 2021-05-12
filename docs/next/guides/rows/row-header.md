---
title: Row header
metaTitle: Row header - Guide - Handsontable Documentation
permalink: /next/row-header
canonicalUrl: /row-header
tags:
  - custom headers
  - bind rows with headers
  - row id
---

# Row header

[[toc]]

## Overview

Row headers are gray-colored columns which are used to label each row. By default, these headers are filled with numbers displayed in an ascending order.

You can turn the headers on by setting the option `rowHeaders` to `true`.

## Bind rows with headers

There is a plugin **Bind rows with headers** which allows to bind the row numbers with their headers. This is used mostly to differentiate two business cases in which Handsontable is most often used.

1. In a typical spreadsheet-like application, when you moved the row, the numbers in the row headers remain intact. Only the content is moved.

2. In a data grid each rows has its unique ID and therefore the column header should follow its row whenever it changes its position in the grid.

### Basic example

To enable the plugin, set the `bindRowsWithHeaders` property to `true`. Move the rows in the example below to see what this plugin actually does.

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
const hot1 = new Handsontable(container, {
  data: generateData(),
  colHeaders: true,
  rowHeaders: true,
  contextMenu: true,
  manualRowMove: true,
  bindRowsWithHeaders: 'strict',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Tree grid

A tree grid allows you to represent the nested data structures within the data grid. To learn more about this feature head to the [Row parent-child](../row-parent-child) page.
