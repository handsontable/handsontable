---
title: Column header
metaTitle: Column header - Guide - Handsontable Documentation
permalink: /10.0/column-header
canonicalUrl: /column-header
---

# Column header

[[toc]]

## Overview

Column headers are gray-colored rows used to label each column or [group of columns](@/guides/columns/column-groups.md). By default, these headers are populated with letters in alphabetical order.

To reflect the type or category of data in a particular column, give it a custom name and then display it in a column header. For example, instead of letters as labels such as `A, B, C, ...` name them `ID, Full name, Country, ...`.

## Default headers

Setting the [colHeaders](@/api/options.md#colheaders) option to `true` enables the default column headers as shown in the example below:

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 11),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Header labels as an array
An array of labels can be used to set the `colHeaders` as shown in the example below:

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 9),
  colHeaders: ['ID', 'Full name', 'Position','Country', 'City', 'Address', 'Zip code', 'Mobile', 'E-mail'],
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Header labels as a function
The `colHeaders` can also be populated using a function as shown in the example below:

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 11),
  colHeaders(index) {
    return 'Col ' + (index + 1);
  },
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Nested headers

More complex data structures can be displayed with multiple headers, each representing a different category of data. To learn more about nested headers, see the [column groups](@/guides/columns/column-groups.md) page.
