---
title: Column header
permalink: /next/column-header
canonicalUrl: /column-header
---

# Column header

[[toc]]

### Overview

Column headers are gray-colored rows which are used to label each column or [group of columns](../column-groups). By default, these headers are filled with letters in an alphabetical order.

To reflect the type or category of data in a particular column you can give it a custom name, and then display in a column header. For example, instead of letters as labels such as `A, B, C, ...` you can name them `ID, Full name, Country, ...`.

### Default headers

Set the [`colHeaders`](api/options/#colheaders) option to `true` to enable the default column headers.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 11),
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Header labels as an array

::: example #example2
```js
const container = document.querySelector('#example2');

const hot2 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 9),
  colHeaders: ['ID', 'Full name', 'Position','Country', 'City', 'Address', 'Zip code', 'Mobile', 'E-mail'],
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Header labels as a function

::: example #example3
```js
const container = document.querySelector('#example3');

const hot3 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(3, 11),
  colHeaders(index) {
    return 'Col ' + (index + 1);
  },
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

### Nested headers

More complex data structures can be displayed with multiple headers, each representing a different category of data. Learn more about it on  the [column groups](../column-groups) page.
