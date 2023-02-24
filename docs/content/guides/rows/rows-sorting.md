---
id: 6o0zftmc
title: Rows sorting
metaTitle: Rows sorting - JavaScript Data Grid | Handsontable
description: Sort rows alphabetically or numerically, in ascending, descending or a custom order, by one or multiple columns.
permalink: /rows-sorting
canonicalUrl: /rows-sorting
tags:
  - row sorting
  - column sorting
  - columnSorting
  - multicolumn sorting
  - multi-column sorting
  - multiColumnSorting
  - row ordering
  - order by
  - sort ascending
  - sort descending
  - highest to lowest
  - unordered data
  - sortEmptyCells
  - data sorting
  - sort data
  - sort rows
  - sort columns
  - sorting
react:
  id: h4jfevxj
  metaTitle: Rows sorting - React Data Grid | Handsontable
searchCategory: Guides
---

# Rows sorting

Sort data alphabetically or numerically, in ascending, descending or a custom order, by one or multiple columns.

[[toc]]

## Overview

With sorting, you can easily rearrange rows of data, based on the values in specific columns.
This is particularly useful for analyzing and organizing large datasets, which helps you identify patterns and trends.

You can sort data in different ways:
- Alphabetically, numerically, or based on a [custom sorting logic](#add-a-custom-comparator).
- In ascending, descending, or a [custom order](#add-a-custom-comparator).
- By a single column, or by [multiple columns](#sort-by-multiple-columns).
- Using Handsontable's [UI](#demo) or [API](#control-sorting-programmatically).

Handsontable sorts data only visually, so your source data remains in the original order. To save your sorting changes
in the data source, see: [Saving data](@/guides/getting-started/saving-data.md).

### Demo

Click on one of the column names to sort the values in ascending (↑) or descending (↓) order,
or to go back to the original order.

::: only-for javascript

::: example #example1 --html 1 --js 2

```html
<div id="example1"></div>
```

```js
// to import sorting as an individual module, see the 'Import the sorting module' section of this page

import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  // enable sorting for all columns
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example1 :react

```jsx
// to import just individual modules, see the 'Import the sorting module' section of this page

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      // enable sorting for all columns
      columnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```

:::

:::

## Enable sorting

To enable sorting for all columns, set [`columnSorting`](@/api/options.md#columnsorting) to `true`.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting for all columns
  columnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting for all columns
  columnSorting={true}
/>
```

:::

To enable sorting only for specific columns, set [`headerAction`](@/api/options.md#columnsorting) to `false`
for those columns that you don't want to sort.

::: only-for javascript

::: example #example2 --html 1 --js 2

```html
<div id="example2"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example2');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  // enable sorting for all columns
  columnSorting: true,
  columns: [
    {
      title: 'Brand<br>(non-sortable)',
      type: 'text',
      data: 'brand',
      // disable sorting for the 'Brand' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'Model<br>(sortable)',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price<br>(non-sortable)',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
      // disable sorting for the 'Price' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'Date<br>(sortable)',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time<br>(non-sortable)',
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
      // disable sorting for the 'Time' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'In stock<br>(sortable)',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example2 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      // enable sorting for all columns
      columnSorting={true}
      columns={[
        {
          title: 'Brand<br>(non-sortable)',
          type: 'text',
          data: 'brand',
          // disable sorting for the 'Brand' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'Model<br>(sortable)',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price<br>(non-sortable)',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
          // disable sorting for the 'Price' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'Date<br>(sortable)',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time<br>(non-sortable)',
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
          // disable sorting for the 'Time' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'In stock<br>(sortable)',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```

:::

:::

## Configure sorting

You can configure the sorting UI, set an initial sort order,
and implement your own [comparator](#add-a-custom-comparator).

By default:
- Sorting is enabled for all columns.
- The end user can sort data by clicking on the column name.
- The sort order indicator is visible.
- Initially, no rows are sorted.

This is the default sorting configuration:

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // let the end user sort data by clicking on the column name
    headerAction: true,
    // don't sort empty cells: move rows with empty cells to the bottom
    sortEmptyCells: false,
    // enable the sort order icon that appears next to the column name
    indicator: true,
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    // let the end user sort data by clicking on the column name
    headerAction: true,
    // don't sort empty cells: move rows with empty cells to the bottom
    sortEmptyCells: false,
    // enable the sort order icon that appears next to the column name
    indicator: true,
  }}
/>
```

:::

All sorting options:

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // don't let the end user sort data by clicking on the column name
    headerAction: false,
    // sort empty cells, too
    sortEmptyCells: true,
    // disable the sort order icon that appears next to the column name
    indicator: false,

    // at initialization, sort data by the first column, in descending order
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },

    // implement your own comparator
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // here, add a compare function
        // that returns `-1`, or `0`, or `1`
      }
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    // don't let the end user sort data by clicking on the column name
    headerAction: false,
    // sort empty cells, too
    sortEmptyCells: true,
    // disable the sort order icon that appears next to the column name
    indicator: false,

    // at initialization, sort data by the first column, in descending order
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },

    // implement your own comparator
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // here, add a compare function
        // that returns `-1`, or `0`, or `1`
      },
    },
  }}
/>
```

:::

## Sort different types of data

Handsontable automatically sorts different [types of data](@/guides/cell-types/cell-type.md#available-cell-types),
based on which [`type`](@/api/options.md#type) you configure for each column.

::: only-for javascript

```js
const configurationOptions = {
  columns: [
    {
      // set the data type of the first column
      type: 'numeric',
    },
  ],
};
```

:::

::: only-for react

```jsx
<HotTable>
  <HotColumn
    // set the data type of the first column
    type={'numeric'}
  />
</HotTable>
```

:::

You can configure the following types:
- [`text`](@/guides/cell-types/cell-type.md) gets sorted by default, so you don't have to configure it.
- [`autocomplete`](@/guides/cell-types/autocomplete-cell-type.md)
- [`checkbox`](@/guides/cell-types/checkbox-cell-type.md)
- [`date`](@/guides/cell-types/date-cell-type.md)
- [`dropdown`](@/guides/cell-types/dropdown-cell-type.md)
- [`handsontable`](@/guides/cell-types/handsontable-cell-type.md)
- [`numeric`](@/guides/cell-types/numeric-cell-type.md)
- [`password`](@/guides/cell-types/password-cell-type.md)
- [`select`](@/guides/cell-types/select-cell-type.md)
- [`time`](@/guides/cell-types/time-cell-type.md)

::: only-for javascript

::: example #example3 --html 1 --js 2

```html
<div id="example3"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Model',
      // set the data type of the 'Model' column
      type: 'text', // 'text' is the default type, so you can omit it
      data: 'model',
    },
    {
      title: 'Price',
      // set the data type of the 'Price' column
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      // set the data type of the 'Date' column
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      // set the data type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      // set the data type of the 'In stock' column
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example3 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
    ]}
      columns={[
        {
          title: 'Model',
          // set the data type of the 'Model' column
          type: 'text', // 'text' is the default type, so you can omit it
          data: 'model',
        },
        {
          title: 'Price',
          // set the data type of the 'Price' column
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          // set the data type of the 'Date' column
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          // set the data type of the 'Time' column
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          // set the data type of the 'In stock' column
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      columnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```

:::

:::

## Sort by multiple columns

You can sort data by more than one column, which lets you apply multiple sets of sort criteria at the same time.

For example, if you display a list of employees, you can sort them by last name
and then, within each last name, by first name.
This way, you can easily sort the list even if there are multiple employees with the same last name.

Try it out:

1. Click on the **Brand** column name. The data gets sorted by brand.
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> and click on the **Model** column name.<br>
   The data gets sorted by model, but within each brand.
3. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> and click on the **Price** column name.<br>
   The data gets sorted by price, but within each model.

::: only-for javascript

::: example #example4 --html 1 --js 2

```html
<div id="example4"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example4');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 30,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 279.99,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 59,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],

  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example4 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 30,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 279.99,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'HL Road Tire',
          price: 59,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
    ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      // enable sorting by multiple columns, for all columns
      multiColumnSorting={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```

:::

:::

To enable sorting by multiple columns, set [`multiColumnSorting`](@/api/options.md#multicolumnsorting) to `true`.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting by multiple columns, for all columns
  multiColumnSorting={true}
/>
```

:::

To select which columns can be sorted at the same time,
set [`headerAction`](@/api/options.md#columnsorting) to `false`
for those columns that you don't want to sort.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
  columns: [
    {
      // disable sorting by multiple columns for the first column
      multiColumnSorting: {
        headerAction: false,
      },
    },
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting by multiple columns, for all columns
  multiColumnSorting={true}
  columns={[
    {
      // disable sorting by multiple columns for the first column
      columnSorting: {
        headerAction: false,
      },
    },
  ]}
/>
```

:::

The [`columnSorting`](@/api/options.md#columnsorting) and [`multiColumnSorting`](@/api/options.md#multicolumnsorting)
options override each other. If you use them both, the one defined later takes precedence.

::: only-for javascript

```js
// here, `multiColumnSorting` overrides `columnSorting`
const configurationOptions = {
  columnSorting: true,
  multiColumnSorting: true,
};
```

:::

::: only-for react

```jsx
// here, `multiColumnSorting` overrides `columnSorting`
<HotTable
  columnSorting={true}
  multiColumnSorting={true}
/>
```

:::

## Set an initial sort order

You can set a default sort order that's applied every time you initialize Handsontable.

In the following demo, the data is initially sorted:
- By the **Brand** column, in ascending order.
- By the **Model** column, in descending order.

::: only-for javascript

::: example #example5 --html 1 --js 2

```html
<div id="example5"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example5');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  multiColumnSorting: {
    initialConfig: [
      // at initialization, sort the data by the 'Brand' column, in ascending order
      {
        column: 0,
        sortOrder: 'asc',
      },
      // at initialization, sort the data by the 'Model' column, in descending order
      {
        column: 1,
        sortOrder: 'desc',
      },
    ],
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example5 :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
    ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      multiColumnSorting={{
        initialConfig: [
          {
            // at initialization, sort the data by the 'Brand' column, in ascending order
            column: 0,
            sortOrder: 'asc',
          },
            // at initialization, sort the data by the 'Model' column, in descending order
          {
            column: 1,
            sortOrder: 'desc',
          },
        ],
      }}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example5'));
/* end:skip-in-preview */
```

:::

:::

To set an initial sort order, use the [`initialConfig`](@/api/options.md#columnsorting) option. 

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // at initialization, sort data by the first column, in ascending order
    initialConfig: {
      column: 0,
      sortOrder: 'asc', // for descending order, use `'desc'`
    },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    // at initialization, sort data by the first column, in ascending order
    initialConfig: {
      column: 0,
      sortOrder: 'asc',  // for descending order, use `'desc'`
    },
  }}
/>
```

:::

To initially sort data [by multiple columns](#sort-by-multiple-columns),
set [`initialConfig`](@/api/options.md#columnsorting) to an array.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting by multiple columns
  multiColumnSorting: {
    initialConfig: [
      // at initialization, sort data by the first column, in ascending order
      {
        column: 0,
        sortOrder: 'asc',
      },
      // at initialization, sort data by the second column, in descending order
      {
        column: 1,
        sortOrder: 'desc',
      },
    ]
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting by multiple columns
  multiColumnSorting={{
    initialConfig: [
      // at initialization, sort data by the first column, in ascending order
      {
        column: 0,
        sortOrder: 'asc',
      },
      // at initialization, sort data by the second column, in descending order
      {
        column: 1,
        sortOrder: 'desc',
      },
    ]
  }}
/>
```

:::

## Add custom sort icons

The default sort icons (↑↓) are encoded in Base64.
You can replace them by changing `background-image` for the following pseudo-elements of Handsontable's CSS:
- `.columnSorting.ascending::before`
- `.columnSorting.descending::before`

::: only-for javascript

::: example #example6 --html 1 --js 2 --css 3

```html
<div id="example6"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example6');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  className: 'custom-sort-icon-example-1',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* the icon for both ascending and descending order */
.custom-sort-icon-example-1 span.colHeader.columnSorting.ascending::before,
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending::before {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAB1tAAAdbQGcq9LnAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAtNQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOdhNgAAAPB0Uk5TAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3JzdHd4e3+DhIeIiYqLjI6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+anNa/wAADPBJREFUeNrt3fmfV/MCx/GTNZRqlmamKSSlvQjZqSQqEgpZStn3e13u5S72fStblmxlC0lkadO+l51SGSlSUj5/wj22GjXLd3mfcz6f83k9fz/n+z3n9X7EfGfmTBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOxXp7xLn2HXXTesT5fyOtwN3zQaOGK52WL58AENuSce6Tdxk9nGzxP6cl880X2SqdL73bg3Hmg/zlTrjfbcn7QbuM7U4IfTuUOptsMNphb/5CuCFGv4iqnVmPrcp7QqmG4yMLkBd8rn/izA9/4sIKX9Z5iMTeFzwdQpzKI/C0hh/5kmK1NZgNf9WYDv/Y2ZxgJSo2iWycG0Rtw5n/uzAN/7G/MhC0hD/9nGsAB/FefR35jpBdxBx/vPMYYF0J8F0D9XM1iAsxrPNQIzCrmTPvc3ZiYL8Lo/C3C0/zxjWIC/SoT9jZlVxB11rP98Y1gA/XVmswCHlMr7hwso5r4603+BMSyA/mpzWIDX/VmAG8oWmsjMbcz99bk/C/C9Pwuwvv8iE7F5LMBiTSLvHy6ghPvsc39j5rMAW/svNoYF+Ks8pv7hAkq52z73N2YBC7Cv/xJjWIC/msbanwX43t+YhWXcdYv6LzWGBdA/XotYgCWaJdI/XEAT7r0V/T8yhgXQPwmLWUDi9kqwf7iAcgok3P9jY1gA/ZOzhAUkaO/E+7OARPt/YiywpCklfO5vzFIW4HV/FpCMfT411ljajB4+9zfmIxbgdX8WELfmn4nCVVSoFrAXVVzsf8ABqgV8zAJc7B8ELMA5+8r6d/71dJ1lC9ibNrH0/1wU7JvOv5+w8zeiE37CAlzszwKc0kLWv9PWk3aSLWAfCkXc/4sI+gsX8CkLcKP/qo5/PXHHVSzAAftF1V+5gOZ0iqz/l6r+HbY/eQfVAj5jAS72ZwHWa6nqv7JD1S/QYaVqAftSy+b+7at7ifaqBXzOAvT9v4q8PwuwWCtV/xXtanqZditUC2hBMwf7CxfwBQtQ9l8WU38WYKX9Zf3b1v5ibWUL2I9ylvX/um0mL9f2a9HLfckCLOvfJrMXbMMCbNJ6ecz9lQtoST9r+i9vk/mLtlG96FcswJr+rRN52a9a0TAfbZLpzwJs6a/6j/Gy1ln/07OMBSRO9gXZsv0T/OIjlxdH4v1ZQPL9VR/JLcvxH+FWLCBJsg/lc/+PsOxbUMtb09PB/iwgFf3z+iimJQtIhuxHc/L9MFb2g2jZfBAJa/oLF/A1C0igv+DbcbIfRs/sm9EQ/ni25kcyZL+OxAIy7K/6BQ3VD2XJfiFxBQvIQEfb+isX0I6+sfVX/mC27KEELCC+/tJfzZA9lmRFexrXRPagBvWv5sgWsJIFxNFf/+uZskeTsYA4+kfwC9qyhxNW98vJ6Gxzf+ECVrGAqvurHtgY1UNamn/KAiIke2RrdI9pkj2ifPtHFMGB/izAhf7RPqpxn09Eb/OvjynEgd+q+kf8sNa9WYDX/VlAJLqo+sfxwHbZH6vc+rBq+qv6x/InG2R/rraCBbjYX7mAA6gfBAetFt3O+P5sk+xP1rMAZf8Y/3BbM9kCDvS9/8Eu9hcu4NsD6S8R9x9vbbaUBSj6f6fqH/ufb24qW0AXf/sf4m5/FmBT/yWJ/Pn2pktEb3/1QX727yrrX57MBZSzAK/7hwtYzAJy779GdPMWlyd3EboFHOxb/0Nl/ZskeRlNVAv47mD652RRk2QvpMki1QIO8an/YWnpzwJy679W1b8s+Yspky2gqy/9D1f1X1hmw+WULWQBPvcXLmBNV/o72F+5gEPT3/8IVf8FpfZcVOkCFpBp/+9T2F+5gMPS3f9IVf/5pXZdWOl80YWtPYz+mfQvse3SSmQLODy9/Y9Kb38WEGf/eSU2Xl7JPNUCjkhp/x9U/RvbeYGNWUBNjlb1n9vY1ktsPFd0id8fQX8H+ysXcGTa+h/jQ38WEH3/OcV2X2jxHNUCjkpT/2N96c8Cqu6/TnRTZhfbf7HFs0UX+8PR9HewPwvYTjdZ/yI3LrhItoBj6F/JrCJXLrloFgvYort//ZULONb5/j+KbsXMQpcuu3Cm6LLXOb6AHn72Vy6gG/0d7M8CfnOcqv+MQvcuvnCG9wvQ9S9w8fILZAvo7mb/nqr+0wvcvAEF00U34EcnF9Bzvef9lQvo4XH/D53tHy7gQ28XcLysfyOXvwxqJFvAcfRnAe7opeo/zfH+4QKmiW7F+p70ZwFuOGGD6JKnNgxSoOFU1QKOpz8LsN+Jqv5TUtI/XMAU1QJ60Z8F2K23rH+DIEUaqBaw4QRP+k9OVf9wAZO9WEAf+ke/gBMt7v+T6CInpa5/uIBJqV9AX1n/PYMU2lO2gN4p7/9BKvuHC/gg1Qs4if7xLaBPivu/n9r+4QLeF92kn6xbwMn0j3cBfVPa/736QarVfy+VC+i3kf6xL+Ak+rMAO5yi6v+uB/3DBbyrWsDJaetfL/BCPdUCNlqxgP6q/hM96R8uYKJqAf3ozwKSdaqq/zse9Q8X8I5qAafQ3/MF9E/yMk77WXQZb+8ReGaPt1OwAPpbsYBTk7qE01X9J3jYP1zABMcXQH9bFvDzaUm8/QGq/m952j9cwFsOL0DXf/fAW7vLFnB63G99oKr/eI/7hwsY7+gC6G/dAgbE+bbP2CR622963j9cwJsOLoD+Vi5gYFxv+UxV/3G70T8Idhvn2ALob+sCNp0Rx9s9S9X/Dfr/uYA3HFoA/a1ewJlRv9VBqv6v07/yAl5XLeAsV/rXpXpldd1YwNmq/q/Rf9sFvKZawCD6s4BonLNZ9BbH0r+qBYxVLeBs+rMAvXNV/V+lf3ULeFV0izefY3P/XSldnV3tXcB5qv6v0L+mBbyiWsC52jc2mP6uLeA8K/u/TP/aFvCyhQsYQn8XFzDYuv4v0T+TBbxk2QLOl/XfhbqZ2EW2gCFW9X+R/pku4EWLFjD0F/o7vIDzrek/hv7ZLGCMagFD83sjw+jv+AJ+GWpF/9H0z3YBo1ULGJb7m7hA1n9nijq4gAtV/V+gfw52fkG1gAvo7/kCLszl5S9S9X+e/rku4PkEF0D/VC3gomxf+mJV/+fon88CnktoAbL+z9I/vwU8q1rAxdm87CX0T98CLsn8RS9V9X9mJwrma6dnYl8A/VO6gEsze8HLVP1H0V+zgFGxLuAyQ//ULuCy2l/sclX/p+mvW8DTqiqX058F1OQK1es8RX/tAp5Slbmippe5UvUqT+5IM60dn4xhAfT3YgFXVvcSV6le4Qn6R7GAJ1R9rqI/C9je1aqzj6R/VAsYqWp0Nf1ZQESf/z1O/ygX8Liq0zafCfZUPf/rMfpHu4DHRKE2HVf5tC1X09+3BVS02HrSBgtEJ310BwpFbYdHRbHm1t9yztH093EBo/48Y3fRCR+hfzwLeEQU7Kg/TjiZ/n4uYOLvp+uvOdvD9I9vAQ9rmvX+7WTzJOcaQf84FzBCEm1GnfBcPejv7wKODE91k+JEw+kf9wKGK7r9OzzTIvr7u4D5QdBScJqH6J/EAh4SpGuh+C7gg/RPZgEPKr4reE/+/evQIhl18l/APfl/DPwA/ZNbwAP51hud98eA9Hd6AZODz/M7wf30T3YB9+fX77NgQ17H30f/pBdwX14BNwQV9Pd5ARXB3DyOvpf+Nizg3jwSzgvG0d/nBYwLcv8Rs3vob8sCcv8w57HgxlwPvZv+9izg7lwr3hicQH+fF9ArqLsupwPvor9dC7grp4zf75LjjwTTPx0LeDY88qIcjruT/vYt4M4cQg4JDyzN/rPAO7jdNroj65A/Fv163M3093UB//ntsKK12R11O3faVrdnV3JN4e+HXZ/VUbdxn+11W1Ypr//jqHor6e/jAr7Z8tuhvTJ/OsCt3GO73Zpxys19tx71N/r7t4BrKx+V4W8b3sL9td8tmX4bqLK6Gf1o4M3cXRdk9HX9lLp/Pajh2NqfKnMN99YNf99ca8yxDbc9aMf/1vbDQz25s6448btaYv6vqmc5nbO+pkPm7Mt9dUfrxTW1XH9u1Ud1fL3aQ9bdsAd31SWN7vip2pjjO1d7WLdJVR6x8a4ybqlrmj9S9f8JTK35P+X9xm/c9ohV9/Ovv5PajdzuuzybJp5W62ENBoxYUekhIv86lN/9ddbOPW6q9PiHipGDCjI7rk5Jp15Drr164NGt6nMTXVfcqdfgf1x/cb9D9uIprgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABc93/oZAmhEtZQQgAAAABJRU5ErkJggg==') !important;
  /* minor adjustments, as the custom icon is of a different size than the original */
  top: 12px;
  right: -35px;
  width: 16px;
  height: 22px;
  zoom: .4;
}

/* the same icon as for ascending order, but rotated 180 degrees */
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending:before {
  top: 16px;
  transform: rotate(180deg);
}
```

:::

:::

::: only-for react

::: example #example6 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
    ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      columnSorting={{
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="custom-sort-icon-example-1"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example6'));
/* end:skip-in-preview */
```

```css
/* the icon for both ascending and descending order */
.custom-sort-icon-example-1 span.colHeader.columnSorting.ascending::before,
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending::before {
  background-image: url('data:image/png;base64,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') !important;
  /* minor adjustments, as the custom icon is of a different size than the original */
  top: 12px;
  right: -35px;
  width: 16px;
  height: 22px;
  zoom: .4;
}

/* the same icon as for ascending order, but rotated 180 degrees */
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending:before {
  top: 16px;
  transform: rotate(180deg);
}
```

:::

:::

You can also replace the sort icons by changing `content` for the same pseudo-elements:

::: only-for javascript

::: example #example7 --html 1 --js 2 --css 3

```html
<div id="example7"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example7');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  className: 'custom-sort-icon-example-2',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* the icon for ascending order */
.custom-sort-icon-example-2 span.colHeader.columnSorting.ascending::before {
  content: '△';
  background-image: none !important;
}

/* the icon for descending order */
.custom-sort-icon-example-2 span.colHeader.columnSorting.descending::before {
  content: '▽';
  background-image: none !important;
}
```

:::

:::

::: only-for react

::: example #example7 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
    ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      columnSorting={{
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="custom-sort-icon-example-2"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example7'));
/* end:skip-in-preview */
```

```css
/* the icon for ascending order */
.custom-sort-icon-example-2 span.colHeader.columnSorting.ascending::before {
  content: '△';
  background-image: none !important;
}

/* the icon for descending order */
.custom-sort-icon-example-2 span.colHeader.columnSorting.descending::before {
  content: '▽';
  background-image: none !important;
}
```

:::

:::

To replace the icons that indicate sorting [by multiple columns](#sort-by-multiple-columns)
(<sub>1</sub>, <sub>2</sub> etc.), change `content` for the following pseudo-elements:
- `.handsontable span.colHeader.columnSorting.sort-1::after`
- `.handsontable span.colHeader.columnSorting.sort-2::after`
- `.handsontable span.colHeader.columnSorting.sort-3::after`
- `.handsontable span.colHeader.columnSorting.sort-4::after`
- `.handsontable span.colHeader.columnSorting.sort-5::after`
- `.handsontable span.colHeader.columnSorting.sort-6::after`
- `.handsontable span.colHeader.columnSorting.sort-7::after`

::: only-for javascript

::: example #example8 --html 1 --js 2 --css 3

```html
<div id="example8"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example8');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      color: 'White',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Frame',
      color: 'Black',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      color: 'Red',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      color: 'Green',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      color: 'Blue',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Color',
      type: 'text',
      data: 'color',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  className: 'custom-sort-icon-example-3',
  multiColumnSorting: {
    initialConfig: [
      {
        column: 0,
        sortOrder: 'asc',
      },
      {
        column: 1,
        sortOrder: 'desc',
      },
      {
        column: 2,
        sortOrder: 'asc',
      },
      {
        column: 3,
        sortOrder: 'desc',
      },
      {
        column: 4,
        sortOrder: 'asc',
      },
      {
        column: 5,
        sortOrder: 'desc',
      },
      {
        column: 6,
        sortOrder: 'asc',
      },
    ],
  },
  height: 'auto',
  colWidths: 100,
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-1::after {
  content: '①';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-2::after {
  content: '②';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-3::after {
  content: '③';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-4::after {
  content: '④';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-5::after {
  content: '⑤';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-6::after {
  content: '⑥';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-7::after {
  content: '⑦';
  right: -13px;
  top: 1px;
  zoom: 200%;
}
```

:::

:::

::: only-for react

::: example #example8 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          color: 'White',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Frame',
          color: 'Black',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          color: 'Red',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          color: 'Green',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          color: 'Blue',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Color',
          type: 'text',
          data: 'color',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      multiColumnSorting={{
        initialConfig: [
          {
            column: 0,
            sortOrder: 'asc',
          },
          {
            column: 1,
            sortOrder: 'desc',
          },
          {
            column: 2,
            sortOrder: 'asc',
          },
          {
            column: 3,
            sortOrder: 'desc',
          },
          {
            column: 4,
            sortOrder: 'asc',
          },
          {
            column: 5,
            sortOrder: 'desc',
          },
          {
            column: 6,
            sortOrder: 'asc',
          },
        ],
      }}
      className="custom-sort-icon-example-3"
      height="auto"
      colWidths={100}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example8'));
/* end:skip-in-preview */
```

```css
.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-1::after {
  content: '①';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-2::after {
  content: '②';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-3::after {
  content: '③';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-4::after {
  content: '④';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-5::after {
  content: '⑤';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-6::after {
  content: '⑥';
  right: -13px;
  top: 1px;
  zoom: 200%;
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-7::after {
  content: '⑦';
  right: -13px;
  top: 1px;
  zoom: 200%;
}
```

:::

:::

## Add a custom comparator

A comparator is a function that determines the sort order, based on specified criteria.

Adding a custom comparator lets you go beyond Handsontable's built-in sorting features. You can:
- Apply a custom sort order. For example, instead of sorting data alphabetically or numerically, you can sort it by
  length or by the occurrence of a specific character.
- Handle exceptions. For example, in a list of employees, you can exclude workers with a specific job title from sorting.
- Implement a custom sorting logic based on your own criteria.

To add a custom comparator, use the [`compareFunctionFactory`](@/api/options.md#columnsorting) option.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    compareFunctionFactory: function(sortOrder, columnMeta) {
      // implement your own comparator
      return function(value, nextValue) {
        if (value < nextValue) {
          return -1;
        }
        if (value > nextValue) {
          return 1;
        }

        return 0;
      }
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    compareFunctionFactory: function(sortOrder, columnMeta) {
      // implement your own comparator
      return function(value, nextValue) {
        if (value < nextValue) {
          return -1;
        }
        if (value > nextValue) {
          return 1;
        }

        return 0;
      }
    },
  }}
/>
```

:::

## Control sorting programmatically

You can control sorting at the grid's runtime by using Handsontable's
[hooks](@/guides/getting-started/events-and-hooks.md) and [API methods](@/api/columnSorting.md#methods).

For example, you can:
- Enable or disable sorting depending on specified conditions. For example, you can disable sorting
  for very large data sets.
- Implement your own UI. For example, you can let the end user sort data by clicking on external buttons.
- Control sorting from outside of Handsontable. For example, you can trigger sorting depending on the state of another
  component in your application.

::: only-for react

To learn how to access Handsontable's API methods, see: [Instance methods](@/guides/getting-started/react-methods.md).

:::

### Enable or disable sorting programmatically

To enable or disable sorting programmatically, use the [`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
// enable sorting for all columns
handsontableInstance.updateSettings({
  columnSorting: true,
});

// disable sorting for all columns
handsontableInstance.updateSettings({
  columnSorting: false,
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// enable sorting for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: true,
});

// disable sorting for all columns
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: false,
});
```

:::

You can also enable or disable sorting for specific columns.

::: only-for javascript

```js
handsontableInstance.updateSettings({
  columns: [
    {
      // enable sorting for the first column
      columnSorting: {
        headerAction: true,
      },
    },
    {
      // disable sorting for the second column
      columnSorting: {
        headerAction: false,
      },
    },
  ],
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

hotTableComponentRef.current.hotInstance.updateSettings({
  columns: [
    {
      // enable sorting for the first column
      columnSorting: {
        headerAction: true,
      },
    },
    {
      // disable sorting for the second column
      columnSorting: {
        headerAction: false,
      },
    },
  ],
});
```

:::

### Sort data programmatically

To sort data programmatically, use the [`columnSorting.sort()`](@/api/columnSorting.md#sort) method.
Remember to [enable sorting](#enable-sorting) first.

Mind that using [`columnSorting.sort()`](@/api/columnSorting.md#sort) overwrites any previous sort orders.

::: only-for javascript

```js
// get the `ColumnSorting` plugin instance
const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

columnSortingPluginInstance.sort(
  // sort data by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc', // for descending order, use `'desc'`
  },
);

// go back to the original order
columnSortingPluginInstance.clearSort();
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);
// get the `ColumnSorting` plugin instance
const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

columnSortingPluginInstance.sort(
  // sort data by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc', // for descending order, use `'desc'`
  },
);

// go back to the original order
columnSortingPluginInstance.clearSort();
```

:::

Try it out:

::: only-for javascript

::: example #example9 --html 1 --js 2

```html
<div id="example9"></div>

<div class="controls">
  <button id="sort_asc" class="button">Sort by the "Brand" column, in ascending order</button>
  <br>
  <br>
  <button id="unsort" class="button">Go back to the original order</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example9');
const buttonSortAscending = document.querySelector('#sort_asc');
const buttonUnsort = document.querySelector('#unsort');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

buttonSortAscending.addEventListener('click', () => {
  columnSortingPluginInstance.sort({
    column: 0,
    sortOrder: 'asc',
  });
});

buttonUnsort.addEventListener('click', () => {
  columnSortingPluginInstance.clearSort();
});
```
:::

:::


::: only-for react

::: example #example9 :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);
  const sortAsc = () => {
    // get the `ColumnSorting` plugin instance
    const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');
  
    columnSortingPluginInstance.sort(
      {
        column: 0,
        sortOrder: 'asc',
      },
    );
  };

  const unsort = () => {
    // get the `ColumnSorting` plugin instance
    const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

    columnSortingPluginInstance.clearSort();
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: '11/10/2023',
            sellTime: '01:23',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.90,
            sellDate: '03/05/2023',
            sellTime: '11:27',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.10,
            sellDate: '27/03/2023',
            sellTime: '03:17',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: '28/08/2023',
            sellTime: '08:01',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: '02/10/2023',
            sellTime: '13:23',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US'
            },
            className: 'htLeft',
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        columnSorting={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sortAsc}>Sort by the "Brand" column, in ascending order</button>
        <br />
        <br />
        <button onClick={unsort}>Go back to the original order</button>
      </div>
    </>
  );
}

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example9'));
/* end:skip-in-preview */
```

:::

:::

### Sort data programmatically by multiple columns

To sort data programmatically [by multiple columns](#sort-by-multiple-columns),
use the [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) method.

Remember to [enable](#sort-by-multiple-columns) sorting by multiple columns first.

Mind that using [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) overwrites any previous sort orders.

::: only-for javascript

```js
// get the `MultiColumnSorting` plugin instance
const multiColumnSortingPluginInstance = handsontableInstance.getPlugin('multiColumnSorting');

multiColumnSortingPluginInstance.sort(
  [
    // sort data by the first column, in ascending order
    {
      column: 0,
      sortOrder: 'asc',
    },
    // within the above sort criteria,
    // sort data by the second column, in descending order
    {
      column: 1,
      sortOrder: 'desc',
    },
  ],
);
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);
// get the `ColumnSorting` plugin instance
const multiColumnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('multiColumnSorting');

multiColumnSortingPluginInstance.sort(
  [
    // sort data by the first column, in ascending order
    {
      column: 0,
      sortOrder: 'asc',
    },
    // within the above sort criteria,
    // sort data by the second column, in descending order
    {
      column: 1,
      sortOrder: 'desc',
    },
  ],
);
```

:::

Try it out:

::: only-for javascript

::: example #example10 --html 1 --js 2

```html
<div id="example10"></div>

<div class="controls">
  <button id="sort" class="button">Sort</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example10');
const buttonSort = document.querySelector('#sort');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  multiColumnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

const multiColumnSortingPluginInstance = handsontableInstance.getPlugin('multiColumnSorting');

buttonSort.addEventListener('click', () => {
  multiColumnSortingPluginInstance.sort(
    [
      {
        column: 0,
        sortOrder: 'asc',
      },
      {
        column: 1,
        sortOrder: 'desc',
      },
    ],
  );
});
```
:::

:::


::: only-for react

::: example #example10 :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);
  const sort = () => {
    // get the `MultiColumnSorting` plugin instance
    const multiColumnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('multiColumnSorting');

    multiColumnSortingPluginInstance.sort(
      [
        {
          column: 0,
          sortOrder: 'asc',
        },
        {
          column: 1,
          sortOrder: 'desc',
        },
      ],
    );
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: '11/10/2023',
            sellTime: '01:23',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'HL Mountain Frame',
            price: 1890.90,
            sellDate: '03/05/2023',
            sellTime: '11:27',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'Cycling Cap',
            price: 130.10,
            sellDate: '27/03/2023',
            sellTime: '03:17',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: '28/08/2023',
            sellTime: '08:01',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: '02/10/2023',
            sellTime: '13:23',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US'
            },
            className: 'htLeft',
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        multiColumnSorting={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sort}>Sort</button>
      </div>
    </>
  );
}

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example10'));
/* end:skip-in-preview */
```

:::

:::

### Exclude rows from sorting

You can exclude any number of top or bottom rows from sorting.

For example, if you [freeze](@/guides/rows/row-freezing.md) a row at the top (to display column names),
and freeze a row at the bottom (to display [column summaries](@/guides/columns/column-summary.md)),
you can prevent those frozen rows from sorting, so they always stay in place.

::: only-for javascript

::: example #example11 --html 1 --js 2

```html
<div id="example11"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example11');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Brand',
      model: 'Model',
      price: 'Price',
      sellDate: 'Date',
      sellTime: 'Time',
      inStock: 'In stock',
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.90,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.10,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: 2,
    },
    {},
  ],
  columns: [
    {
      type: 'text',
      data: 'brand',
    },
    {
      type: 'text',
      data: 'model',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
      className: 'htLeft',
    },
    {
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'numeric',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 200,
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  colHeaders: true,
  columnSorting: true,
  // `afterColumnSort` is a Handsontable hook: it's fired after each sorting
  afterColumnSort() {
    const lastRowIndex = handsontableInstance.countRows() - 1;
    
    // after each sorting, take row 1 and change its index to 0
    handsontableInstance.rowIndexMapper
    	.moveIndexes(handsontableInstance
      	.toVisualRow(0), 0);

    // after each sorting, take row 16 and change its index to 15
    handsontableInstance.rowIndexMapper
    	.moveIndexes(handsontableInstance
      	.toVisualRow(lastRowIndex), lastRowIndex);
  },
  cells(row, col, prop) {
    const lastRowIndex = this.instance.countRows() - 1;
    
    if (row === 0) {
      return {
        type: 'text',
        className: 'htCenter',
      };
    }
    if (row === lastRowIndex) {
      return {
        type: 'numeric',
        className: 'htCenter',
      };
    }
  },
  columnSummary: [
    {
      sourceColumn: 2,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 2,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
    {
      sourceColumn: 5,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 5,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
```
:::

:::

::: only-for react

::: example #example11 :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);
  const exclude = () => {
    // take row 1 and change its index to 0
    hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
      [
        hotTableComponentRef.current.hotInstance.toVisualRow(0),
      ], 0);

    // take row 16 and change its index to 15
    hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
      [
        hotTableComponentRef.current.hotInstance.toVisualRow(15),
      ], 15);
  };

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={[
        {
          brand: 'Brand',
          model: 'Model',
          price: 'Price',
          sellDate: 'Date',
          sellTime: 'Time',
          inStock: 'In stock',
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 11,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 0,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 1,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: 3,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 5,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 22,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 13,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '02/10/2023',
          sellTime: '13:23',
          inStock: 14,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 16,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.90,
          sellDate: '03/05/2023',
          sellTime: '11:27',
          inStock: 18,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.10,
          sellDate: '27/03/2023',
          sellTime: '03:17',
          inStock: 3,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '28/08/2023',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: 2,
        },
        {},
      ]}
      columns={[
        {
          type: 'text',
          data: 'brand',
        },
        {
          type: 'text',
          data: 'model',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
          className: 'htLeft',
        },
        {
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          type: 'time',
          data: 'sellTime',
          correctFormat: true,
          className: 'htRight',
        },
        {
          type: 'numeric',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height={200}
      fixedRowsTop={1}
      fixedRowsBottom={1}
      colHeaders={true}
      columnSorting={true}
      // `afterColumnSort` is a Handsontable hook: it's fired after each sorting
      afterColumnSort={exclude}
      cells={(row, col, prop) => {
        if (row === 0) {
          return {
            type: 'text',
            className: 'htCenter',
          };
        }
        if (row === 15) {
          return {
            type: 'numeric',
            className: 'htCenter',
          };
      }}}
      columnSummary={[
        {
          sourceColumn: 2,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 2,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
        {
          sourceColumn: 5,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 5,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
      ]}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example11'));
/* end:skip-in-preview */
```

:::

:::

## Import the sorting module

You can reduce the size of your JavaScript bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use sorting, you need only the following modules:
- The [base module](@/guides/tools-and-building/modules.md#import-the-base-module)
- [`ColumnSorting`](@/api/columnSorting.md) or [`MultiColumnSorting`](@/api/multiColumnSorting.md)

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';

// import the sorting plugins
import {
  registerPlugin,
  ColumnSorting,
  MultiColumnSorting,
} from 'handsontable/plugins';

// register the sorting plugins
registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);
```

## API reference

| Plugins                                                                                          | Options                                                                                                          | Handsontable hooks                                                                                           |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`ColumnSorting`](@/api/columnSorting.md)<br>[`MultiColumnSorting`](@/api/multiColumnSorting.md) | [`columnSorting`](@/api/options.md#columnsorting)<br>[`multiColumnSorting`](@/api/options.md#multicolumnsorting) | [`afterColumnSort`](@/api/hooks.md#aftercolumnsort)<br>[`beforeColumnSort`](@/api/hooks.md#beforecolumnsort) |

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Column%20sorting) on GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to get help