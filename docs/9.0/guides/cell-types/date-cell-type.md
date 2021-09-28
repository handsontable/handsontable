---
title: Date cell type
metaTitle: Date cell type - Guide - Handsontable Documentation
permalink: /9.0/date-cell-type
canonicalUrl: /date-cell-type
---

# Date cell type

[[toc]]

## Overview
The `'date'` cell type is used to display a date in a cell or column.

## Usage

To trigger the date cell type, use the option `type: 'date'` in the `columns` array or `cells` function. The date cell uses [Pikaday datepicker](https://github.com/dbushell/Pikaday) as the UI control. Pikaday uses [Moment.js](https://github.com/moment/moment) as a date formatter.

Note that date cell requires additional modules :

```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/pikaday.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/css/pikaday.css">
```

All data entered into the date-type cells are validated against the default date format `DD/MM/YYYY` unless another format is provided. If you enable the `correctFormat` config item, the dates will be automatically formatted to match the desired format.

## Basic example

::: example #example1
```js
const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Mercedes', 'A 160', '01/14/2021', 6999.95],
    ['Citroen', 'C4 Coupe', '12/01/2022', 8330],
    ['Audi', 'A4 Avant', '11/19/2023', 33900],
    ['Opel', 'Astra', '02/02/2021', 7000],
    ['BMW', '320i Coupe', '07/24/2022', 30500]
  ],
  colHeaders: ['Car', 'Model', 'Registration date', 'Price'],
  height: 'auto',
  columns: [
    {
      type: 'text',
    },
    {
      // 2nd cell is simple text, no special options here
    },
    {
      type: 'date',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900',
      // datePicker additional options
      // (see https://github.com/dbushell/Pikaday#configuration)
      datePickerConfig: {
        // First day of the week (0: Sunday, 1: Monday, etc)
        firstDay: 0,
        showWeekNumber: true,
        numberOfMonths: 3,
        licenseKey: 'non-commercial-and-evaluation',
        disableDayFn(date) {
          // Disable Sunday and Saturday
          return date.getDay() === 0 || date.getDay() === 6;
        }
      }
    },
    {
      type: 'numeric',
      numericFormat: {
        pattern: '$ 0,0.00'
      }
    }
  ]
});
```
:::
