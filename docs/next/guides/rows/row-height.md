---
title: Row height
permalink: /next/row-height
canonicalUrl: /row-height
tags:
  - resizing
---

# Row height

[[toc]]

## Overview

- opis ustawien i zachowania domyslnego
- wysokosc wiersza a wyrównanie/zawijanie sie tekstu
- Ustawienie szerokosci wiersza o konkretnym ID
- wysokosc wszystkich wierszy w wartosciach bezwzglednych
- wysokosc wszystkich wierszy o konkretnej kolejnosci (1, 3, 5-10)
- wysokosc wszystkich wierszy jako funkcja
- sterowanie wysokoscia z zewnatrz
- opis edge cases np jak ustawienia dotyczaca nie istniejacych jeszcze kolumn, albo gdy sie przenosi kolumne (czy przenosi sie wraz ze swoja szerokoscia)

## User-triggered resize

To enable these features, use settings `manualRowResize: true`.

The draggable resize handle appears in the bottom part of the row header. Double click on the resize handle automatically adjusts size of the row or column. For the selected rows or columns works simultaneously resizing.

::: example #example1
```js
var container = document.getElementById('example1');
var hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: 320,
  rowHeights: [20, 40, 60, 80, 120],
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

