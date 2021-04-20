---
title: Column width
permalink: /next/column-width
canonicalUrl: /column-width
tags:
  - resizing columns
  - stretching columns
---

# {{ $frontmatter.title }}

[[toc]]

## Overview

- opis ustawien i zachowania domyslnego; oraz w odniesieniu do konterenera i jego ustawien
- szerokosc kolummy a zawijanie sie tekstu - opis zaleznosci
- Nadanie szerokosci kolumnie o konkretnym ID
- szerokosc wszystkich kolum w wartosciach bezwzglednych
- szerokosc kolumn o konkretnej kolejnosci (1, 3, 5-10)
- szerokosc wszystkich kolumn jako funkcja
- sterowanie szerokoscia kolumny z zewnatrz
- opis edge cases np jak ustawienia dotyczaca nie istniejacych jeszcze kolumn, albo gdy sie przenosi kolumne (czy przenosi sie wraz ze swoja szerokoscia)

## User-triggered resize

To enable these features, use settings `manualColumnResize: true`. The draggable resize handle will be displayed on the right on the column header. Double-click on the resize handle automatically adjusts size of the row or column. For the selected rows or columns works simultaneously resizing.

::: example #example1
```js
var container = document.getElementById('example1');
var hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(200, 10),
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: 320,
  colWidths: [45, 100, 160, 60, 80, 80, 80],
  manualColumnResize: true,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## StretchH `last` column

The following example creates a table with vertical scrollbar by specifying only the container height and `overflow: hidden` in CSS. The last column is stretched using `stretchH: 'last'` option.

::: example #example1
```js
var container1 = document.getElementById('example1');
var hot1 = new Handsontable(container1, {
  data: Handsontable.helper.createSpreadsheetData(40, 6),
  height: 320,
  colWidths: 47,
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'last',
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## StretchH `all` columns

If the table content is not as wide as the container width, the table will be stretched to the container width. The default horizontal stretch model is to stretch the last column only (by using `stretchH: 'last'` option).

Other possible stretch modes are `all` (stretches all columns equally, used in the below example) and `none` (not stretching).

::: example #example2
```js
var container2 = document.getElementById('example2');
var hot2 = new Handsontable(container2, {
  data: Handsontable.helper.createSpreadsheetData(40, 6),
  height: 320,
  colWidths: [47, 47, 47, 47, 47, 47, 47], // can also be a number or a function
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## StretchH `none` (default)

::: example #example3
```js
var container3 = document.getElementById('example3');
var hot3 = new Handsontable(container3, {
  data: Handsontable.helper.createSpreadsheetData(40, 6),
  height: 320,
  colWidths: [47, 47, 47, 47, 47, 47, 47], // can be declared as a number or a function
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'none', // 'none' is the default value of this option
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
