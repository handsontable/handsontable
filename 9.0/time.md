---
title: Time
permalink: /time
canonicalUrl: /time
---

# {{ $frontmatter.title }}

To use the Time cell type, set the `type: 'time'` option in the `columns` array or the `cells` function.
The Time cell uses [Moment.js](https://github.com/moment/moment) as the time formatter, so be sure to add an additional file in your `<head>` :

* `/dist/moment/moment.js`

All data entered to the time-typed cells are eventually validated against the default time format (`h:mm:ss a`, which translates to, for example, `9:30:00 am`) unless another format is provided as the `timeFormat`.
If you enable the `correctFormat` config item, the values will be automatically formatted to match the desired time format.

By default, the values entered to the time-typed column are **not** validated, so if you want them to display in the proper format, remember to call `hot.validateCells()` after the table initialization.

::: example #example1
```js
var container = document.getElementById('example1'),
    hot;

hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', 1332284400000, 6999.95],
    ['Citroen', 'C4 Coupe', '10 30', 8330],
    ['Audi', 'A4 Avant', '8:00 PM', 33900],
    ['Opel', 'Astra', 1332284400000, 7000],
    ['BMW', '320i Coupe', 1332284400000, 30500]
  ],
  startRows: 7,
  startCols: 4,
  colHeaders: ['Car', 'Model', 'Registration time', 'Price'],
  columnSorting: true,
  contextMenu: true,
  minSpareRows: 1,
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
