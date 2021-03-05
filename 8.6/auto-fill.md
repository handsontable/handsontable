---
title: Auto fill
permalink: /8.6/auto-fill
canonicalUrl: /auto-fill
---

# {{ $frontmatter.title }}

[[toc]]

## Auto fill in all directions

Notice the little square (**fill handle**) in the corner of the selected cell. You can drag it (drag-down) to repeat the values from the cell. Double click the fill handle in cell B4 (value "30") to fill the selection down to the last value in neighbouring column, just like it would in Excel or Google Sheets.

::: example #example1
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
],
container = document.getElementById('example1'),
hot1;

hot1 = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  fillHandle: true // possible values: true, false, "horizontal", "vertical"
});

hot1.loadData(data);
```
:::

## Auto fill in vertical direction only with creating new rows

In this configuration fill handle is restricted to move only vertically. Additionally, to adding new rows when it comes to the edge of the table bottom we need change **autoInsertRow** to **true**.

::: example #example2
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', '']
],
container = document.getElementById('example2'),
hot2;

hot2 = new Handsontable(container, {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  fillHandle: {
    direction: 'vertical',
    autoInsertRow: true
  }
});
```
:::
