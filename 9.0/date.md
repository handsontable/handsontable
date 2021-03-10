---
title: Date
permalink: /9.0/date
canonicalUrl: /date
---

# {{ $frontmatter.title }}

To trigger the Date cell type, use the option `type: 'date'` in `columns` array or `cells` function. The Date cell uses [Pikaday datepicker](https://github.com/dbushell/Pikaday) as the UI control. Pikaday uses [Moment.js](https://github.com/moment/moment) as a date formatter.

Note that Date cell requires additional files in your `<head>` :

* `/dist/moment/moment.js`
* `/dist/pikaday/pikaday.js`
* `/dist/pikaday/css/pikaday.css`

All data entered to the data-typed cells are validated agains the default date format ([`DD/MM/YYYY`](http://momentjs.com/docs/#/parsing/) "Click here to find how to use different date format"), unless another format is provided. If you enable the `correctFormat` config item, the dates will be automatically formatted to match the desired format.

::: example #example1
```js
var container = document.getElementById('example1'),
    hot;

hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', '01/14/2017', 6999.95],
    ['Citroen', 'C4 Coupe', '12/01/2018', 8330],
    ['Audi', 'A4 Avant', '11/19/2019', 33900],
    ['Opel', 'Astra', '02/02/2020', 7000],
    ['BMW', '320i Coupe', '07/24/2021', 30500]
  ],
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
