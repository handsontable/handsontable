---
title: Date cell type
permalink: /next/date-cell-type
canonicalUrl: /date-cell-type
---

# Date cell type

[[toc]]

## Overview

To trigger the Date cell type, use the option `type: 'date'` in `columns` array or `cells` function. The Date cell uses [Pikaday datepicker](https://github.com/dbushell/Pikaday) as the UI control. Pikaday uses [Moment.js](https://github.com/moment/moment) as a date formatter.

Note that Date cell requires additional files in your `<head>` :

* `/dist/moment/moment.js`
* `/dist/pikaday/pikaday.js`
* `/dist/pikaday/css/pikaday.css`

All data entered to the data-typed cells are validated agains the default date format `DD/MM/YYYY` unless another format is provided. If you enable the `correctFormat` config item, the dates will be automatically formatted to match the desired format.

## Basic example

::: example #example1
```js
var container = document.getElementById('example1'),
    hot;

hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', '01/14/2021', 6999.95],
    ['Citroen', 'C4 Coupe', '12/01/2022', 8330],
    ['Audi', 'A4 Avant', '11/19/2023', 33900],
    ['Opel', 'Astra', '02/02/2021', 7000],
    ['BMW', '320i Coupe', '07/24/2022', 30500]
  ],
  licenseKey: 'non-commercial-and-evaluation',
  colHeaders: ['Car', 'Model', 'Registration date', 'Price'],
  columns: [
    {
      type: 'autocomplete',
      source: ['Audi', 'BMW', 'Chrysler', 'Citroen', 'Mercedes', 'Nissan', 'Opel', 'Suzuki', 'Toyota', 'Volvo'],
      strict: false
    },
    {
      // 2nd cell is simple text, no special options here
    },
    {
      type: 'date',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900',
      // datePicker additional options (see https://github.com/dbushell/Pikaday#configuration)
      datePickerConfig: {
        // First day of the week (0: Sunday, 1: Monday, etc)
        firstDay: 0,
        showWeekNumber: true,
        numberOfMonths: 3,
        licenseKey: 'non-commercial-and-evaluation',
        disableDayFn: function(date) {
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
