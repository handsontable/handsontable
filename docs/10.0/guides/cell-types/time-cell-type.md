---
title: Time cell type
metaTitle: Time cell type - Guide - Handsontable Documentation
permalink: /10.0/time-cell-type
canonicalUrl: /time-cell-type
---

# Time cell type

[[toc]]

## Overview
The time cell type formats, renders, and validates the contents of the cell as a time.

## Usage
To use the time cell type, set the `type: 'time'` option in the `columns` array or the `cells` function.
The time cell uses [Moment.js](https://github.com/moment/moment) as the time formatter, therefore you **must** add the following required dependency:

```html
<script src="https://cdn.jsdelivr.net/npm/moment/moment.min.js"></script>
```

All data entered into the time-typed cells is eventually validated against the default time format - `h:mm:ss a`, which translates to, for example, `9:30:00 am` unless another format is provided as the `timeFormat`.
If you enable the `correctFormat` config item, the values will be automatically formatted to match the desired time format.

::: tip
By default, the values entered into the time-type column are **not** validated, so if you want them to display in the proper format, remember to call `hot.validateCells()` after the table initialization.
:::

## Basic example

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', 1332284400000, 6999.95],
    ['Citroen', 'C4 Coupe', '10 30', 8330],
    ['Audi', 'A4 Avant', '8:00 PM', 33900],
    ['Opel', 'Astra', 1332284400000, 7000],
    ['BMW', '320i Coupe', 1332284400000, 30500]
  ],
  colHeaders: ['Car', 'Model', 'Registration time', 'Price'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      type: 'text',
    },
    {
      // 2nd cell is simple text, no special options here
    },
    {
      type: 'time',
      timeFormat: 'h:mm:ss a',
      correctFormat: true
    },
    {
      type: 'numeric',
      numericFormat: {
        pattern: '$ 0,0.00'
      }
    }
  ]
});

hot.validateCells();
```
:::
