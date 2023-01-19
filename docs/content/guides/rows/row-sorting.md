---
id: 6o0zftmc
title: Rows sorting
metaTitle: Rows sorting - JavaScript Data Grid | Handsontable
description: Sort rows alphabetically or numerically, in ascending, descending or a custom order, across one or multiple columns.
permalink: /row-sorting
canonicalUrl: /row-sorting
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
react:
  id: h4jfevxj
  metaTitle: Rows sorting - React Data Grid | Handsontable
searchCategory: Guides
---

# Rows sorting

Sort data alphabetically or numerically, in ascending, descending or a custom order, across one or multiple columns.

[[toc]]

## Overview

With sorting, you can easily rearrange rows of data, based on the values in specified columns.
This is particularly useful for analyzing and organizing large datasets, which helps you identify patterns and trends.

You can sort rows in different ways:
- Alphabetically, numerically, or based on a [custom data type](@/guides/cell-types/cell-type.md).
- In ascending, descending, or a [custom order](#add-a-custom-comparator).
- By a single column, or by [multiple columns](#sort-by-multiple-columns).
- Using Handsontable's [UI](#demo) or [API](#control-sorting-programmatically).

Data is sorted just visually. Your source data remains in the original order.

### Demo

Click on a column name to sort the rows in ascending (↑) or descending (↓) order, or to restore the original order.

::: only-for javascript

::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');

const yourHandsontableInstance = new Handsontable(container, {
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
  height: 'auto',
  width: 'auto',
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation',
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

export const YourHandsontableComponent = () => {
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
      columnSorting={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::

:::

## Enable sorting

To enable sorting, use the [`columnSorting`](@/api/options.md#columnsorting) option.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting for the entire grid
  columnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting for the entire grid
  columnSorting={true}
/>
```

:::

To select which columns are sortable,
set [`columnSorting`](@/api/options.md#columnsorting) for each column separately.

::: only-for javascript

```js
const configurationOptions = {
  columns: [
    {
      // enable sorting by column 1
      columnSorting: true,
    },
    {
      // disable sorting by column 2
      columnSorting: false,
    },
  ],
};
```

:::

::: only-for react

```jsx
<HotTable>
  <HotColumn
    // enable sorting by column 1
    columnSorting={true}
  />
  <HotColumn
    // disable sorting by column 2
    columnSorting={false}
  />
</HotTable>
```

:::

### Import the sorting module

If you're using Handsontable through [modules](@/guides/tools-and-building/modules.md),
import the [`ColumnSorting`](@/api/columnSorting.md) module.

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';

// import the `ColumnSorting` module
import {
  registerPlugin,
  ColumnSorting,
} from 'handsontable/plugins';

// register the `ColumnSorting` plugin
registerPlugin(ColumnSorting);
```

## Configure sorting

You can configure the sort UI, set an initial sort order, and implement your own compare function.

By default:
- Sorting is enabled for all columns.
- The end user can sort rows by clicking on the column name.
- The sort order indicator is visible.
- No rows are sorted initially.

The default sorting configuration:

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // let the end user sort rows by clicking on the column name
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
    // let the end user sort rows by clicking on the column name
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
    // don't let the end user sort rows by clicking on the column name
    headerAction: false,
    // sort empty cells, too
    sortEmptyCells: true,
    // disable the sort order icon that appears next to the column name
    indicator: false,

    // at initialization, sort rows by column 1, in descending order
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
    // don't let the end user sort rows by clicking on the column name
    headerAction: false,
    // sort empty cells, too
    sortEmptyCells: true,
    // disable the sort order icon that appears next to the column name
    indicator: false,

    // at initialization, sort rows by column 1, in descending order
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
      // set the data type of column 1
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
    // set the data type of column 1
    type={'numeric'}
  />
</HotTable>
```

:::

This demo uses a different [`type`](@/api/options.md#type) in each column.

::: only-for javascript

::: example #example2
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example2');

const yourHandsontableInstance = new Handsontable(container, {
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
      // set the data type of column 1
      type: 'text', // 'text' is the default type, so you can omit it
      data: 'model',
    },
    {
      title: 'Price',
      // set the data type of column 2
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
      // set the data type of column 3
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      // set the data type of column 4
      type: 'time',
      data: 'sellTime',
      className: 'htRight',
    },
    {
      title: 'In stock',
      // set the data type of column 5
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 'auto',
  width: 'auto',
  columnSorting: true,
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

export const YourHandsontableComponent = () => {
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
          // set the data type of column 1
          type: 'text', // 'text' is the default type, so you can omit it
          data: 'model',
        },
        {
          title: 'Price',
          // set the data type of column 2
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
          // set the data type of column 3
          type: 'date',
          data: 'sellDate',
          className: 'htRight',
        },
        {
          title: 'Time',
          // set the data type of column 4
          type: 'time',
          data: 'sellTime',
          className: 'htRight',
        },
        {
          title: 'In stock',
          // set the data type of column 5
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      columnSorting={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```
:::

:::

## Sort by multiple columns

To let the end user apply multiple levels of sort criteria,
use the [`multiColumnSorting`](@/api/options.md#multicolumnsorting) option.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting by multiple columns, for the entire grid
  multiColumnSorting: true,
};
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting by multiple columns, for the entire grid
  multiColumnSorting={true}
/>
```

:::

To select which columns can be sorted at the same time,
set [`multiColumnSorting`](@/api/options.md#multicolumnsorting) for each column separately.

::: only-for javascript

```js
const configurationOptions = {
  columns: [
    {
      // enable sorting by multiple columns, for column 1
      multiColumnSorting: true,
    },
    {
      // disable sorting by multiple columns, for column 2
      multiColumnSorting: false,
    },
  ],
};
```

:::

::: only-for react

```jsx
<HotTable>
  <HotColumn
    // enable sorting by multiple columns, for column 1
    multiColumnSorting={true}
  />
  <HotColumn
    // disable sorting by multiple columns, for column 2
    multiColumnSorting={false}
  />
</HotTable>
```

:::

You can't use the [`columnSorting`](@/api/options.md#columnsorting) and [`multiColumnSorting`](@/api/options.md#multicolumnsorting) options at the same time, though.

Try it out:

1. Click on a column name to sort the rows by a single column.
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd>.
3. Click on other column names to apply additional levels of sort criteria.

::: only-for javascript

::: example #example3
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');

const yourHandsontableInstance = new Handsontable(container, {
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
  height: 'auto',
  width: 'auto',
  // enable sorting by multiple columns, for the entire grid
  multiColumnSorting: true,
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

export const YourHandsontableComponent = () => {
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
      // enable sorting by multiple columns, for the entire grid
      multiColumnSorting={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```
:::

:::

## Set an initial sort order

To initialize Handsontable with a particular sort order, use the [`initialConfig`](@/api/options.md#columnsorting) option. 

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // at initialization, sort rows by column 1, in ascending order
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
    // at initialization, sort rows by column 1, in ascending order
    initialConfig: {
      column: 0,
      sortOrder: 'asc',  // for descending order, use `'desc'`
    },
  }}
/>
```

:::

In this demo, rows are initially sorted by the first column, in ascending order.

::: only-for javascript

::: example #example4
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example4');

const yourHandsontableInstance = new Handsontable(container, {
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
  height: 'auto',
  width: 'auto',
  columnSorting: {
    // at initialization, sort rows by column 1, in ascending order
    initialConfig: {
      column: 0,
      sortOrder: 'asc',
    },
  },
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

export const YourHandsontableComponent = () => {
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
        // at initialization, sort rows by column 1, in ascending order
        initialConfig: {
          column: 0,
          sortOrder: 'asc',
        },
      }}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```
:::

:::

## Add custom sort icons

To replace the default sort icons, overwrite the `.columnSorting.ascending::before`
and `.columnSorting.descending::before` pseudo-elements of Handsontable's CSS.

```css
/* the icon for ascending order */
.handsontable span.colHeader.columnSorting.ascending::before

/* the icon for descending order */
.handsontable span.colHeader.columnSorting.descending::before
```

This demo replaces the default sort icons with the 👆 and 👇 emojis.

::: only-for javascript

::: example #example5 --css 1 --js 2

```css
/* the icon for ascending order */
.your-handsontable-instance span.colHeader.columnSorting.ascending::before {
  content: '👆';
  background-image: none !important;
}

/* the icon for descending order */
.your-handsontable-instance span.colHeader.columnSorting.descending::before {
  content: '👇';
  background-image: none !important;
}
```
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example5');

const yourHandsontableInstance = new Handsontable(container, {
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
  height: 'auto',
  width: 'auto',
  className: 'your-handsontable-instance',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #example5 :react --css 1 --js 2
```css
/* the icon for ascending order */
.your-handsontable-instance span.colHeader.columnSorting.ascending::before {
  content: '👆';
  background-image: none !important;
}

/* the icon for descending order */
.your-handsontable-instance span.colHeader.columnSorting.descending::before {
  content: '👇';
  background-image: none !important;
}
```
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const YourHandsontableComponent = () => {
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
        // at initialization, sort rows by column 1, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="your-handsontable-instance"
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example5'));
/* end:skip-in-preview */
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

To learn how to access the API methods, read the [Instance methods](@/guides/getting-started/react-methods.md) guide.

:::

### Disable sorting

To disable and re-enable sorting at Handsontable's runtime, use the [`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

```js
// disable sorting for the entire grid
handsontableInstance.updateSettings({
  columnSorting: false,
});

// re-enable sorting for the entire grid
handsontableInstance.updateSettings({
  columnSorting: true,
});
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// disable sorting for the entire grid
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: false,
});

// re-enable sorting for the entire grid
hotTableComponentRef.current.hotInstance.updateSettings({
  columnSorting: true,
});
```

:::

You can also disable and re-enable sorting for specified columns.

::: only-for javascript

```js
handsontableInstance.updateSettings({
  columns: [
    {
      // disable sorting by column 1
      columnSorting: false,
    },
    {
      // disable sorting by column 2
      columnSorting: false,
    },
  ],
});

handsontableInstance.updateSettings({
  columns: [
    {
      // re-enable sorting by column 1
      columnSorting: true,
    },
    {
      // re-enable sorting by column 2
      columnSorting: true,
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
      // disable sorting by column 1
      columnSorting: false,
    },
    {
      // disable sorting by column 2
      columnSorting: false,
    },
  ],
});

hotTableComponentRef.current.hotInstance.updateSettings({
  columns: [
    {
      // re-enable sorting by column 1
      columnSorting: true,
    },
    {
      // re-enable sorting by column 2
      columnSorting: true,
    },
  ],
});
```

:::

### Sort rows programmatically

To sort rows programmatically, use the [`columnSorting.sort()`](@/api/columnSorting.md#sort) method.
Remember to [enable sorting](#enable-sorting) first.

Mind that [`columnSorting.sort()`](@/api/columnSorting.md#sort) erases any previous sort orders.

::: only-for javascript

```js
// get the `ColumnSorting` plugin instance
const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

columnSortingPluginInstance.sort(
  // sort rows by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc',
  },
);
```

:::

::: only-for react

```jsx
const hotTableComponentRef = useRef(null);

// get the `ColumnSorting` plugin instance
const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

columnSortingPluginInstance.sort(
  // sort rows by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc',
  },
);
```

:::

Try it out:

::: only-for javascript

::: example #example6 --html 1 --js 2
```html
<div id="example6"></div>

<div class="controls">
  <button id="sort_asc" class="button">Sort rows by column 1, in ascending order</button>
  <br>
  <br>
  <button id="sort_desc" class="button">Sort rows by column 1, in descending order</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example6');

const button_ascending = document.querySelector('#sort_asc');
const button_descending = document.querySelector('#sort_desc');


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
  licenseKey: 'non-commercial-and-evaluation'
});

const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

button_ascending.addEventListener('click', () => {
  columnSortingPluginInstance.sort({
    column: 0,
    sortOrder: 'asc',
  });
});

button_descending.addEventListener('click', () => {
  columnSortingPluginInstance.sort({
    column: 0,
    sortOrder: 'desc',
  });
});
```
:::

:::


::: only-for react

::: example #example6 :react
```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const YourHandsontableComponent = () => {
  const hotTableComponentRef = useRef(null);

  const sort_asc = () => {
  
   // get the `ColumnSorting` plugin instance
  const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('ColumnSorting');
  
    columnSortingPluginInstance.sort(
      {
        column: 0,
        sortOrder: 'asc',
      },
    );
  };
  
    const sort_desc = () => {
    
    // get the `ColumnSorting` plugin instance
    const columnSortingPluginInstance = hotTableComponentRef.current.hotInstance.getPlugin('ColumnSorting');
    
    columnSortingPluginInstance.sort(
      {
        column: 0,
        sortOrder: 'desc',
      },
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
          // at initialization, sort rows by column 1, in descending order
          initialConfig: {
            column: 1,
            sortOrder: 'desc',
          },
        }}
        height="auto"
        width="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sort_asc}>Sort rows by column 1, in ascending order</button>
        <br />
        <br />
        <button onClick={sort_desc}>Sort rows by column 1, in descending order</button>
      </div>
    </>
  );
}

/* start:skip-in-preview */
ReactDOM.render(<YourHandsontableComponent />, document.getElementById('example6'));
/* end:skip-in-preview */
```

:::

:::

## Related resources

Read our [blog article](https://handsontable.com/blog/articles/2018/11/feature-spotlight-multi-column-sorting) about multi-column sorting.

### API reference

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