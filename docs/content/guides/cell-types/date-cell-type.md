---
title: Date cell type
metaTitle: Date cell type - JavaScript Data Grid | Handsontable
description: Use the date cell type to display, format, and validate date values. Pick a date using an interactive pop-up editor.
permalink: /date-cell-type
canonicalUrl: /date-cell-type
react:
  metaTitle: Date cell type - React Data Grid | Handsontable
searchCategory: Guides
---

# Date cell type

Use the date cell type to display, format, and validate date values. Pick a date using an interactive pop-up editor.

[[toc]]

## Usage

To set the date cell type, use the option `type: 'date'` in the [`columns`](@/api/options.md#columns) array or [`cells`](@/api/options.md#cells) function. The date cell uses [Pikaday datepicker](https://github.com/dbushell/Pikaday) as the UI control. Pikaday uses [Moment.js](https://github.com/moment/moment) as a date formatter.

Note that date cell requires additional modules :

```html
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/pikaday.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pikaday@1.8.2/css/pikaday.css">
```

## Date format

`date` cells accept strings that are formatted in line with the [`dateFormat`](@/api/options.md#dateformat) setting.

The default date format is `'DD/MM/YYYY'`.

Handsontable doesn't support JavaScript's `Date` object.

### Change the date format

To change the date format accepted by `date` cells, set the [`dateFormat`](@/api/options.md#dateformat) configuration option to a string with your preferred format. For example:

::: only-for javascript
```js
dateFormat: 'YYYY-MM-DD',
```
:::

::: only-for react
```jsx
dateFormat={'YYYY-MM-DD'}
```
:::

### Autocorrect invalid dates

By default, when the user enters a date in a format that doesn't match the [`dateFormat`](@/api/options.md#dateformat) setting, the date is treated as invalid.

You can let Handsontable correct such dates automatically, so they match the required format. To do this, set the [`correctFormat`](@/api/options.md#correctformat) option to `true`. For example:

::: only-for javascript
```js
dateFormat: 'YYYY-MM-DD',

// default behavior
// date entered as `30/12/2022` will be invalid
correctFormat: false,

// date entered as `30/12/2022` will be corrected to `2022/12/30`
correctFormat: true,
```
:::

::: only-for react
```jsx
dateFormat={'YYYY-MM-DD'}

// default behavior
// date entered as `30/12/2022` will be invalid
correctFormat={false}

// date entered as `30/12/2022` will be corrected to `2022/12/30`
correctFormat={true}
```
:::

## Basic example

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

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
:::

::: only-for react
::: example #example1 :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Mercedes', 'A 160', '01/14/2021', 6999.95],
        ['Citroen', 'C4 Coupe', '12/01/2022', 8330],
        ['Audi', 'A4 Avant', '11/19/2023', 33900],
        ['Opel', 'Astra', '02/02/2021', 7000],
        ['BMW', '320i Coupe', '07/24/2022', 30500]
      ]}
      colHeaders={['Car', 'Model', 'Registration date', 'Price']}
      height="auto"
      columns={[{
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
      ]}
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type.md)

### Related API reference

- Configuration options:
  - [`correctFormat`](@/api/options.md#correctformat)
  - [`dateFormat`](@/api/options.md#dateformat)
  - [`datePickerConfig`](@/api/options.md#datepickerconfig)
  - [`defaultDate`](@/api/options.md#defaultdate)
  - [`type`](@/api/options.md#type)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
    - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
    - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
    - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
    - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)
