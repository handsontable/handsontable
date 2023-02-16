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

Handsontable sorts data only visually, so your source data remains in the original order. To save your sorting changes in the data source, see: [Saving data](@/guides/getting-started/saving-data.md).

### Demo

Click on a colum name to sort the values in ascending (↑) or descending (↓) order, or to go back to the original order.

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
      // disable sorting for the first column
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
      // disable sorting for the third column
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
      // disable sorting for the fifth column
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
          // disable sorting for the first column
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
          // disable sorting for the third column
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
          // disable sorting for the fifth column
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

You can configure the sort UI, set an initial sort order, and implement your own compare function.

By default:
- Sorting is enabled for all columns.
- The end user can sort data by clicking on the column name.
- The sort order indicator is visible.
- No rows are sorted initially.

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

Handsontable automatically sorts different types of data, such as text, numbers, dates, and more. Just configure each column's [`type`](@/api/options.md#type).

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

This demo uses a different [`type`](@/api/options.md#type) in each column.

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
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd>.
3. Click on the **Model** column name. The data gets sorted by model, but within each brand.

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

  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
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
      // enable sorting by multiple columns, for all columns
      multiColumnSorting={true}
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
  columnSorting={true}
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

You can set a default sort order that's applied every time Handsontable is launched.

In this demo, the data is initially sorted:
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
      multiColumnSorting={{
        initialConfig: [
          {
            // at initialization, sort the data by the 'Brand' column, in ascending order
            column: 0,
            sortOrder: 'asc',
          },
            // at initialization, sort the data by the 'Model' column, in ascending order
          {
            column: 1,
            sortOrder: 'desc',
          },
        ],
      }}
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

## Add custom sort icons

The default sort icons are encoded in Base64. You can replace them with PNG files by changing the `background-image`
property in the following pseudo-elements of Handsontable's CSS:
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
  className: 'handsontable1',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* custom sort icon for both ascending and descending order */
.handsontable1 span.colHeader.columnSorting.ascending::before,
.handsontable1 span.colHeader.columnSorting.descending::before {
  background-image: url("https://cdn-icons-png.flaticon.com/512/130/130906.png") !important;
  /* minor adjustments, as the custom icon has a different size than the original */
  top: 12px;
  right: -35px;
  width: 16px;
  height: 22px;
  zoom: .4;
}

/* same icon as for ascending order, but pointed downward – rotated 180 degrees */
.handsontable1 span.colHeader.columnSorting.descending:before {
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
        // at initialization, sort the data by the 'Brand' column, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="handsontable1"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example6'));
/* end:skip-in-preview */
```

```css
/* custom sort icon for both ascending and descending order */
.handsontable1 span.colHeader.columnSorting.ascending::before,
.handsontable1 span.colHeader.columnSorting.descending::before {
  background-image: url("https://cdn-icons-png.flaticon.com/512/130/130906.png") !important;
  /* minor adjustments, as the custom icon has a different size than the original */
  top: 12px;
  right: -35px;
  width: 16px;
  height: 22px;
  zoom: .4;
}

/* same icon as for ascending order, but pointed downward – rotated 180 degrees */
.handsontable1 span.colHeader.columnSorting.descending:before {
  top: 16px;
  transform: rotate(180deg);
}
```

:::

:::

You can also change the sort icons by changing the `content` property of the same psuedo-elements:

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
  className: 'handsontable2',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* the icon for ascending order */
.handsontable2 span.colHeader.columnSorting.ascending::before {
  content: '△';
  background-image: none !important;
}

/* the icon for descending order */
.handsontable2 span.colHeader.columnSorting.descending::before {
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
        // at initialization, sort the data by the 'Brand' column, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="handsontable2"
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
.handsontable2 span.colHeader.columnSorting.ascending::before {
  content: '△';
  background-image: none !important;
}

/* the icon for descending order */
.handsontable2 span.colHeader.columnSorting.descending::before {
  content: '▽';
  background-image: none !important;
}
```

:::

:::

## Add a custom comparator

To implement your own [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description), use the [`compareFunctionFactory`](@/api/options.md#columnsorting) option.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
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

## Control sorting programmatically

You can control sorting at runtime by using Handsontable's API.

::: only-for react

To learn how to access Handsontable's API methods, see [Instance methods](@/guides/getting-started/react-methods.md).

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
      columnSorting: true,
    },
    {
      // disable sorting for the second column
      columnSorting: false,
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
      columnSorting: true,
    },
    {
      // disable sorting for the second column
      columnSorting: false,
    },
  ],
});
```

:::

### Sort data programmatically

To sort data programmatically, use the [`columnSorting.sort()`](@/api/columnSorting.md#sort) method.
Remember to [enable sorting](#enable-sorting) first.

Mind that using [`columnSorting.sort()`](@/api/columnSorting.md#sort) erases any previous sort orders.

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

::: example #example8 --html 1 --js 2

```html
<div id="example8"></div>

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

const container = document.querySelector('#example8');

const button_sort_ascending = document.querySelector('#sort_asc');
const button_unsort = document.querySelector('#unsort');


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
  licenseKey: 'non-commercial-and-evaluation'
});

const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

button_sort_ascending.addEventListener('click', () => {
  columnSortingPluginInstance.sort({
    column: 0,
    sortOrder: 'asc',
  });
});

button_unsort.addEventListener('click', () => {
  columnSortingPluginInstance.clearSort();
});
```
:::

:::


::: only-for react

::: example #example8 :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const HandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);

  const sort_asc = () => {
  
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
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sort_asc}>Sort by the "Brand" column, in ascending order</button>
        <br />
        <br />
        <button onClick={unsort}>Go back to the original order</button>
      </div>
    </>
  );
}

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example8'));
/* end:skip-in-preview */
```

:::

:::

### Sort data programmatically by multiple columns

To sort data programmatically [by multiple columns](#sort-by-multiple-columns),
use the [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) method.

Remember to [enable](#sort-by-multiple-columns) sorting by multiple columns first.

Mind that using [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) erases any previous sort orders.

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

::: example #example9 --html 1 --js 2

```html
<div id="example9"></div>

<div class="controls">
  <button id="sort" class="button">Sort</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example9');

const button_sort = document.querySelector('#sort');

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
  licenseKey: 'non-commercial-and-evaluation'
});

const multiColumnSortingPluginInstance = handsontableInstance.getPlugin('multiColumnSorting');

button_sort.addEventListener('click', () => {
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
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sort}>Sort</button>
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

### Exclude rows from sorting

You can exclude any number of top or bottom rows from sorting.

To do this, use Handsontable's [`afterColumnSort`](@/api/hooks.md#aftercolumnsort) hook,
which is fired after each sorting. Inside the hook, call the [`moveIndexes()`](@/api/indexMapper.md#moveindexes) method
to change the visual indexes of the rows that you want to exclude.

::: only-for javascript

```js
const configurationOptions = {
  afterColumnSort() {
    // keep rows number 1 and 2 at index 0
    handsontableInstance.rowIndexMapper.moveIndexes(
      [
        handsontableInstance.toVisualRow(0),
        handsontableInstance.toVisualRow(1),
      ], 0);

```

:::

::: only-for react
```jsx
const exclude = () => {
  // keep rows number 1 and 2 at index 0
  hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
    [
      hotTableComponentRef.current.hotInstance.toVisualRow(0),
      hotTableComponentRef.current.hotInstance.toVisualRow(1),
    ], 0);
};

<HotTable
  afterColumnSort={exclude}
/>
```
:::

In this demo, click on any column name. The rows get sorted, but the the first row and the last row stay in place.

::: only-for javascript

::: example #example10 --html 1 --js 2

```html
<div id="example10"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example10');

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
  // exclude rows number 1 and 5 from sorting
  afterColumnSort() {
    handsontableInstance.rowIndexMapper.moveIndexes(
      [
        handsontableInstance.toVisualRow(0),
        // you can add more top rows here
      ], 0);

    handsontableInstance.rowIndexMapper.moveIndexes(
      [
        handsontableInstance.toVisualRow(4),
        // you can add more bottom rows here
      ], 4);
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```
:::

:::

::: only-for react

::: example #example10 :react

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
    hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
      [
        hotTableComponentRef.current.hotInstance.toVisualRow(0),
        // you can add more top rows here
      ], 0);

    hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
      [
        hotTableComponentRef.current.hotInstance.toVisualRow(4),
        // you can add more bottom rows here
      ], 4);
  };

  return (
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
      // exclude rows number 1 and 5 from sorting
      afterColumnSort={exclude}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<HandsontableComponent />, document.getElementById('example10'));
/* end:skip-in-preview */
```
:::

:::

You can also exclude [frozen rows](@/guides/rows/row-freezing.md) from sorting. In the following demo,
click on any column name: the rows get sorted, but the frozen bottom row stays in place.

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
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
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
  height: 150,
  fixedRowsBottom: 1,
  columnSorting: true,
  afterColumnSort() {
  	 let howManyRows = this.countRows() -1;
     this.rowIndexMapper.moveIndexes([this.toVisualRow(howManyRows)]);
  },
  cells(row) {
    if ([14].includes(row)) {
      return {
        fixedRowsBottom: row,
      }
    }
        
    return {};
  },
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
    let howManyRows = hotTableComponentRef.current.hotInstance.countRows() -1;
    hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes([hotTableComponentRef.current.hotInstance.toVisualRow(howManyRows)]);
  };

  return (
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
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: '11/10/2023',
          sellTime: '01:23',
          inStock: false,
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
      fixedRowsBottom={1}
      columnSorting={true}
      afterColumnSort={exclude}
      cells={(row) => {
        if ([14].includes(row)) {
          return {
            fixedRowsBottom: row,
          }
        }
      }}
      height={150}
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

If you're using Handsontable through [modules](@/guides/tools-and-building/modules.md),
you need to do the following before you can [enable sorting](#enable-sorting):

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

| Plugins                                                                                          | Options                                                                                                          | Handsontable's hooks                                                                                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`ColumnSorting`](@/api/columnSorting.md)<br>[`MultiColumnSorting`](@/api/multiColumnSorting.md) | [`columnSorting`](@/api/options.md#columnsorting)<br>[`multiColumnSorting`](@/api/options.md#multicolumnsorting) | [`afterColumnSort`](@/api/hooks.md#aftercolumnsort)<br>[`beforeColumnSort`](@/api/hooks.md#beforecolumnsort) |

## Troubleshooting

Didn't find what you need? Try this:

- View [GitHub issues](https://github.com/handsontable/handsontable/labels/Column%20sorting) related to sorting.
- Report a [new GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose).
- Ask a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/handsontable).
- Ask a question on [Handsontable's forum](https://forum.handsontable.com/c/getting-help/questions).
- Contact Handsontable's [technical support](https://handsontable.com/contact?category=technical_support).