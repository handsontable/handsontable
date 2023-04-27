---
id: 6o0zftmc
title: Rows sorting
metaTitle: Rows sorting - JavaScript Data Grid | Handsontable
description:
  Sort rows alphabetically or numerically, in ascending, descending or a custom order, by one or
  multiple columns.
permalink: /rows-sorting
canonicalUrl: /rows-sorting
tags:
  - sorting
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
react:
  id: h4jfevxj
  metaTitle: Rows sorting - React Data Grid | Handsontable
searchCategory: Guides
---

# Rows sorting

Sort data alphabetically or numerically, in ascending, descending or a custom order, by one or
multiple columns.

[[toc]]

## Overview

With sorting, you can easily rearrange rows of data, based on the values in specific columns. This
is particularly useful for analyzing and organizing large data sets, which helps you identify
patterns and trends.

You can sort data in different ways:

- Alphabetically, numerically, or based on a custom sorting logic
- In ascending, descending, or a custom order
- By a single column, or by multiple columns
- Using Handsontable's UI or API

Handsontable sorts data only visually, so your source data remains in the original order. To save
your sorting changes in the data source, see this guide:
[Saving data](@/guides/getting-started/saving-data.md).

## Sorting demo

Click on one of the column names to sort the values in ascending (↑) or descending (↓) order, or to
go back to the original order.

::: only-for javascript

::: example #exampleSortingDemo --html 1 --js 2

```html
<div id="exampleSortingDemo"></div>
```

```js
// to import sorting as an individual module, see the 'Import the sorting module' section of this page
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleSortingDemo');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleSortingDemo :react

```jsx
// to import sorting as an individual module, see the 'Import the sorting module' section of this page
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
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
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleSortingDemo'));
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

To enable sorting only for specific columns, set [`headerAction`](@/api/options.md#columnsorting) to
`false` for those columns that you don't want to sort. In the following example, only columns **Model**, **Date** and **In stock** are sortable.

::: only-for javascript

::: example #exampleEnableSortingForColumns --html 1 --js 2

```html
<div id="exampleEnableSortingForColumns"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleEnableSortingForColumns');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
    },
  ],
  // enable sorting for all columns
  columnSorting: true,
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
      // disable sorting for the 'Brand' column
      columnSorting: {
        headerAction: false,
      },
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
        culture: 'en-US',
      },
      // disable sorting for the 'Price' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
      // disable sorting for the 'Time' column
      columnSorting: {
        headerAction: false,
      },
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleEnableSortingForColumns :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: true,
        },
      ]}
      // enable sorting for all columns
      columnSorting={true}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
          // disable sorting for the 'Brand' column
          columnSorting: {
            headerAction: false,
          },
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
            culture: 'en-US',
          },
          // disable sorting for the 'Price' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          className: 'htRight',
          // disable sorting for the 'Time' column
          columnSorting: {
            headerAction: false,
          },
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleEnableSortingForColumns'));
/* end:skip-in-preview */
```

:::

:::

## Configure sorting

You can configure the sorting UI, set an [initial sort order](#set-an-initial-sort-order), and
implement your own [comparator](#add-a-custom-comparator).

By default:

- Sorting is enabled for all columns.
- The end user can sort data by clicking on the column name.
- The sort order indicator is visible.
- At Handsontable's initialization, no rows are sorted.

You can configure the following options:

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // let the end user sort data by clicking on the column name (set by default)
    headerAction: true,
    // don't sort empty cells – move rows that contain empty cells to the bottom (set by default)
    sortEmptyCells: false,
    // enable the sort order icon that appears next to the column name (set by default)
    indicator: true,

    // at initialization, sort data by the first column, in descending order
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },

    // implement your own comparator
    compareFunctionFactory(sortOrder, columnMeta) {
      return function (value, nextValue) {
        // here, add a compare function
        // that returns `-1`, or `0`, or `1`
      };
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    // let the end user sort data by clicking on the column name (set by default)
    headerAction: true,
    // don't sort empty cells – move rows that contain empty cells to the bottom (set by default)
    sortEmptyCells: false,
    // enable the sort order icon that appears next to the column name (set by default)
    indicator: true,

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

Handsontable sorts different [types of data](@/guides/cell-types/cell-type.md#available-cell-types)
automatically, based on which [`type`](@/api/options.md#type) you configure for each column.

You can configure the following types:

- [`text`](@/guides/cell-types/cell-type.md) gets sorted by default, so you don't have to configure
  it.
- [`numeric`](@/guides/cell-types/numeric-cell-type.md)
- [`date`](@/guides/cell-types/date-cell-type.md)
- [`time`](@/guides/cell-types/time-cell-type.md)
- [`checkbox`](@/guides/cell-types/checkbox-cell-type.md)
- [`dropdown`](@/guides/cell-types/dropdown-cell-type.md)
- [`autocomplete`](@/guides/cell-types/autocomplete-cell-type.md)
- [`password`](@/guides/cell-types/password-cell-type.md)

::: only-for javascript

::: example #exampleSortDifferentTypes --html 1 --js 2

```html
<div id="exampleSortDifferentTypes"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleSortDifferentTypes');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
      color: 'Black',
      email: '8576@all.xyz',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
      color: 'White',
      email: 'tayn@all.xyz',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
      color: 'Green',
      email: '6lights@far.com',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
      color: 'Blue',
      email: 'raj@fq1my2c.com',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: true,
      color: 'Black',
      email: 'da@pdc.ga',
    },
  ],
  columns: [
    {
      title: 'Model<br>(text)',
      // set the type of the 'Model' column
      type: 'text', // 'text' is the default type, so you can omit this line
      data: 'model',
    },
    {
      title: 'Price<br>(numeric)',
      // set the type of the 'Price' column
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Sold on<br>(date)',
      // set the type of the 'Date' column
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time<br>(time)',
      // set the type of the 'Time' column
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock<br>(checkbox)',
      // set the type of the 'In stock' column
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
    {
      title: 'Size<br>(dropdown)',
      // set the type of the 'Size' column
      type: 'dropdown',
      data: 'size',
      source: ['XS', 'S', 'M', 'L', 'XL'],
      className: 'htCenter',
    },
    {
      title: 'Color<br>(autocomplete)',
      // set the type of the 'Size' column
      type: 'autocomplete',
      data: 'color',
      source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
      className: 'htCenter',
    },
    {
      title: 'Email<br>(password)',
      // set the type of the 'Email' column
      type: 'password',
      data: 'email',
    },
  ],
  columnSorting: true,
  height: 168,
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleSortDifferentTypes :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          model: 'Racing Socks',
          size: 'S',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
          color: 'Black',
          email: '8576@all.xyz',
        },
        {
          model: 'HL Mountain Shirt',
          size: 'XS',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
          color: 'White',
          email: 'tayn@all.xyz',
        },
        {
          model: 'Cycling Cap',
          size: 'L',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
          color: 'Green',
          email: '6lights@far.com',
        },
        {
          model: 'Ski Jacket',
          size: 'M',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
          color: 'Blue',
          email: 'raj@fq1my2c.com',
        },
        {
          model: 'HL Goggles',
          size: 'XL',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: true,
          color: 'Black',
          email: 'da@pdc.ga',
        },
      ]}
      columns={[
        {
          title: 'Model<br>(text)',
          // set the type of the 'Model' column
          type: 'text', // 'text' is the default type, so you can omit this line
          data: 'model',
        },
        {
          title: 'Price<br>(numeric)',
          // set the type of the 'Price' column
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US',
          },
        },
        {
          title: 'Sold on<br>(date)',
          // set the type of the 'Date' column
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time<br>(time)',
          // set the type of the 'Time' column
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'In stock<br>(checkbox)',
          // set the type of the 'In stock' column
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
        {
          title: 'Size<br>(dropdown)',
          // set the type of the 'Size' column
          type: 'dropdown',
          data: 'size',
          source: ['XS', 'S', 'M', 'L', 'XL'],
          className: 'htCenter',
        },
        {
          title: 'Color<br>(autocomplete)',
          // set the type of the 'Size' column
          type: 'autocomplete',
          data: 'color',
          source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
          className: 'htCenter',
        },
        {
          title: 'Email<br>(password)',
          // set the type of the 'Email' column
          type: 'password',
          data: 'email',
        },
      ]}
      columnSorting={true}
      height={168}
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleSortDifferentTypes'));
/* end:skip-in-preview */
```

:::

:::

You can also create a custom type. For details, see this guide:
[Cell type](@/guides/cell-types/cell-type.md).

## Sort by multiple columns

You can sort data by more than one column, which lets you apply multiple sets of sort criteria at
the same time.

To try out sorting by multiple columns, see the following demo:

1. Click on the **Brand** column name. The data gets sorted by brand.
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> and click on the **Model** column name.<br> The
   data gets sorted by model, but within each brand.
3. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> and click on the **Price** column name.<br> The
   data gets sorted by price, but within each model.

::: only-for javascript

::: example #exampleSortByMultipleColumns --html 1 --js 2

```html
<div id="exampleSortByMultipleColumns"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleSortByMultipleColumns');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 30,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 279.99,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 59,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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

  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleSortByMultipleColumns :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 30,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 279.99,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'HL Road Tire',
          price: 59,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      // enable sorting by multiple columns, for all columns
      multiColumnSorting={true}
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleSortByMultipleColumns'));
/* end:skip-in-preview */
```

:::

:::

To enable sorting by multiple columns, set
[`multiColumnSorting`](@/api/options.md#multicolumnsorting) to `true`.

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

To select which columns can be sorted at the same time, set
[`headerAction`](@/api/options.md#columnsorting) to `false` for those columns that you don't want to
sort.

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

The [`columnSorting`](@/api/options.md#columnsorting) and
[`multiColumnSorting`](@/api/options.md#multicolumnsorting) options override each other. If you use
them both, the one defined later takes precedence.

## Set an initial sort order

You can set a default sort order that's applied every time you initialize Handsontable.

In the following demo, the data is initially sorted:

- By the **Brand** column, in ascending order
- By the **Model** column, in descending order

::: only-for javascript

::: example #exampleInitialSortOrder --html 1 --js 2

```html
<div id="exampleInitialSortOrder"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleInitialSortOrder');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

:::

::: only-for react

::: example #exampleInitialSortOrder :react

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Jetpulse',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleInitialSortOrder'));
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
      sortOrder: 'asc', // for descending order, use `'desc'`
    },
  }}
/>
```

:::

To initially sort data [by multiple columns](#sort-by-multiple-columns), set
[`initialConfig`](@/api/options.md#columnsorting) to an array.

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
    ],
  }}
/>
```

:::

## Add custom sort icons

The default sort icons (↑↓) are encoded in Base64. You can replace them by changing
`background-image` for the following pseudo-elements of Handsontable's CSS:

- `.columnSorting.ascending::before`
- `.columnSorting.descending::before`

::: only-for javascript

::: example #exampleCustomSortIcons --html 1 --js 2 --css 3

```html
<div id="exampleCustomSortIcons"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomSortIcons');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  className: 'custom-sort-icon-example-1',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
/* the icon for both ascending and descending order */
.custom-sort-icon-example-1 span.colHeader.columnSorting.ascending::before,
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending::before {
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjxzdmcgZmlsbD0iIzAwMDAwMCIgaGVpZ2h0PSI4MDBweCIgd2lkdGg9IjgwMHB4IiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiANCgkgdmlld0JveD0iMCAwIDMzMCAzMzAiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggaWQ9IlhNTElEXzIyNV8iIGQ9Ik0zMjUuNjA3LDc5LjM5M2MtNS44NTctNS44NTctMTUuMzU1LTUuODU4LTIxLjIxMywwLjAwMWwtMTM5LjM5LDEzOS4zOTNMMjUuNjA3LDc5LjM5Mw0KCWMtNS44NTctNS44NTctMTUuMzU1LTUuODU4LTIxLjIxMywwLjAwMWMtNS44NTgsNS44NTgtNS44NTgsMTUuMzU1LDAsMjEuMjEzbDE1MC4wMDQsMTUwYzIuODEzLDIuODEzLDYuNjI4LDQuMzkzLDEwLjYwNiw0LjM5Mw0KCXM3Ljc5NC0xLjU4MSwxMC42MDYtNC4zOTRsMTQ5Ljk5Ni0xNTBDMzMxLjQ2NSw5NC43NDksMzMxLjQ2NSw4NS4yNTEsMzI1LjYwNyw3OS4zOTN6Ii8+DQo8L3N2Zz4=) !important;
  /* minor adjustments, as the custom icon is of a different size than the original */
  top: 12px;
  right: -35px;
  width: 22px;
  height: 22px;
  zoom: 0.4;
}

/* the same icon as for ascending order, but rotated 180 degrees */
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending:before {
  transform: scaleY(-1);
}
```

:::

:::

::: only-for react

::: example #exampleCustomSortIcons :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      columnSorting={{
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="custom-sort-icon-example-1"
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomSortIcons'));
/* end:skip-in-preview */
```

```css
/* the icon for both ascending and descending order */
.custom-sort-icon-example-1 span.colHeader.columnSorting.ascending::before,
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending::before {
  background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjxzdmcgZmlsbD0iIzAwMDAwMCIgaGVpZ2h0PSI4MDBweCIgd2lkdGg9IjgwMHB4IiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiANCgkgdmlld0JveD0iMCAwIDMzMCAzMzAiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggaWQ9IlhNTElEXzIyNV8iIGQ9Ik0zMjUuNjA3LDc5LjM5M2MtNS44NTctNS44NTctMTUuMzU1LTUuODU4LTIxLjIxMywwLjAwMWwtMTM5LjM5LDEzOS4zOTNMMjUuNjA3LDc5LjM5Mw0KCWMtNS44NTctNS44NTctMTUuMzU1LTUuODU4LTIxLjIxMywwLjAwMWMtNS44NTgsNS44NTgtNS44NTgsMTUuMzU1LDAsMjEuMjEzbDE1MC4wMDQsMTUwYzIuODEzLDIuODEzLDYuNjI4LDQuMzkzLDEwLjYwNiw0LjM5Mw0KCXM3Ljc5NC0xLjU4MSwxMC42MDYtNC4zOTRsMTQ5Ljk5Ni0xNTBDMzMxLjQ2NSw5NC43NDksMzMxLjQ2NSw4NS4yNTEsMzI1LjYwNyw3OS4zOTN6Ii8+DQo8L3N2Zz4=) !important;
  /* minor adjustments, as the custom icon is of a different size than the original */
  top: 12px;
  right: -35px;
  width: 22px;
  height: 22px;
  zoom: 0.4;
}

/* the same icon as for ascending order, but rotated 180 degrees */
.custom-sort-icon-example-1 span.colHeader.columnSorting.descending:before {
  transform: scaleY(-1);
}
```

:::

:::

You can also replace the sort icons by changing `content` for the same pseudo-elements:

::: only-for javascript

::: example #exampleCustomSortIcons2 --html 1 --js 2 --css 3

```html
<div id="exampleCustomSortIcons2"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomSortIcons2');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  className: 'custom-sort-icon-example-2',
  columnSorting: {
    initialConfig: {
      column: 1,
      sortOrder: 'desc',
    },
  },
  height: 'auto',
  stretchH: 'all',
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

::: example #exampleCustomSortIcons2 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      columnSorting={{
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="custom-sort-icon-example-2"
      height="auto"
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomSortIcons2'));
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
(<sub>1</sub>, <sub>2</sub> etc.), change `content` for the `.columnSorting.sort-1::after` and
subsequent pseudo-elements:

::: only-for javascript

::: example #exampleCustomSortIcons3 --html 1 --js 2 --css 3

```html
<div id="exampleCustomSortIcons3"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleCustomSortIcons3');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      color: 'White',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Frame',
      color: 'Black',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      color: 'Red',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      color: 'Green',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      color: 'Blue',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  stretchH: 'all',

  licenseKey: 'non-commercial-and-evaluation',
});
```

```css
.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-1::after {
  content: '①';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-2::after {
  content: '②';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-3::after {
  content: '③';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-4::after {
  content: '④';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-5::after {
  content: '⑤';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-6::after {
  content: '⑥';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-7::after {
  content: '⑦';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting::after {
  right: -13px;
  top: 1px;
  zoom: 200%;
}
```

:::

:::

::: only-for react

::: example #exampleCustomSortIcons3 :react --js 1 --css 2

```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          color: 'White',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Frame',
          color: 'Black',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          color: 'Red',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          color: 'Green',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          color: 'Blue',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          title: 'Date',
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          title: 'Time',
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      stretchH="all"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleCustomSortIcons3'));
/* end:skip-in-preview */
```

```css
.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-1::after {
  content: '①';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-2::after {
  content: '②';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-3::after {
  content: '③';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-4::after {
  content: '④';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-5::after {
  content: '⑤';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-6::after {
  content: '⑥';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting.sort-7::after {
  content: '⑦';
}

.custom-sort-icon-example-3 .handsontable span.colHeader.columnSorting::after {
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

- Apply a custom sort order. For example, instead of sorting data alphabetically or numerically, you
  can sort it by length or by the occurrence of a specific character.
- Handle exceptions. For example, in a list of employees, you can exclude workers with a specific
  job title from sorting.
- Implement a custom sorting logic based on your own criteria.

To add a custom comparator, use the [`compareFunctionFactory`](@/api/options.md#columnsorting)
option.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    compareFunctionFactory: function (sortOrder, columnMeta) {
      // implement your own comparator
      return function (value, nextValue) {
        if (value < nextValue) {
          return -1;
        }
        if (value > nextValue) {
          return 1;
        }

        return 0;
      };
    },
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  columnSorting={{
    compareFunctionFactory: function (sortOrder, columnMeta) {
      // implement your own comparator
      return function (value, nextValue) {
        if (value < nextValue) {
          return -1;
        }
        if (value > nextValue) {
          return 1;
        }

        return 0;
      };
    },
  }}
/>
```

:::

## Use sorting hooks

You can run your code before or after sorting, using the following
[Handsontable hooks](@/guides/getting-started/events-and-hooks.md):

- [`beforeColumnSort()`](@/api/hooks.md#beforecolumnsort)
- [`afterColumnSort()`](@/api/hooks.md#aftercolumnsort)

For example, you can use [`beforeColumnSort()`](@/api/hooks.md#beforecolumnsort) for server-side
sorting, or use [`afterColumnSort()`](@/api/hooks.md#aftercolumnsort) to
[exclude rows from sorting](#exclude-rows-from-sorting).

::: only-for javascript

```js
const configurationOptions = {
  beforeColumnSort() {
    // add your code here
    return false; // to block front-end sorting
  },
  afterColumnSort() {
    // add your code here
  },
};
```

:::

::: only-for react

```jsx
<HotTable
  beforeColumnSort={
    // add your code here
    return false; // to block front-end sorting
  }
  afterColumnSort={
    // add your code here
  }
/>
```

:::

## Exclude rows from sorting

You can exclude any number of top or bottom rows from sorting.

For example, if you [freeze](@/guides/rows/row-freezing.md) a row at the top (to display column
names), and freeze a row at the bottom (to display
[column summaries](@/guides/columns/column-summary.md)), you can prevent those frozen rows from
getting sorted, so they always stay in place.

::: only-for javascript

::: example #exampleExcludeRowsFromSorting --html 1 --js 2

```html
<div id="exampleExcludeRowsFromSorting"></div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleExcludeRowsFromSorting');
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
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  stretchH: 'all',
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  colHeaders: true,
  columnSorting: true,
  // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting
  afterColumnSort() {
    const lastRowIndex = handsontableInstance.countRows() - 1;

    // after each sorting, take row 1 and change its index to 0
    handsontableInstance.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(0), 0);

    // after each sorting, take row 16 and change its index to 15
    handsontableInstance.rowIndexMapper.moveIndexes(
      handsontableInstance.toVisualRow(lastRowIndex),
      lastRowIndex
    );
  },
  cells(row, col, prop) {
    const lastRowIndex = this.instance.countRows() - 1;

    if (row === 0) {
      return {
        type: 'text',
        className: 'htCenter',
        readOnly: true,
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

::: example #exampleExcludeRowsFromSorting :react

```jsx
// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const exclude = () => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;
    const lastRowIndex = handsontableInstance.countRows() - 1;

    // after each sorting, take row 1 and change its index to 0
    handsontableInstance.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(0), 0);
    // after each sorting, take row 16 and change its index to 15
    handsontableInstance.rowIndexMapper.moveIndexes(
      handsontableInstance.toVisualRow(lastRowIndex),
      lastRowIndex
    );
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
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 11,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 0,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 1,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: 3,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: 5,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 22,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 13,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 0,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: 'Oct 2, 2023',
          sellTime: '13:23 AM',
          inStock: 14,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
          inStock: 16,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: 'May 3, 2023',
          sellTime: '11:27 AM',
          inStock: 18,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: 'Mar 27, 2023',
          sellTime: '03:17 AM',
          inStock: 3,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: 'Aug 28, 2023',
          sellTime: '08:01 AM',
          inStock: 0,
        },
        {
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: 'Oct 11, 2023',
          sellTime: '01:23 AM',
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
            culture: 'en-US',
          },
        },
        {
          type: 'date',
          data: 'sellDate',
          dateFormat: 'MMM D, YYYY',
          correctFormat: true,
          className: 'htRight',
        },
        {
          type: 'time',
          data: 'sellTime',
          timeFormat: 'hh:mm A',
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
      stretchH="all"
      fixedRowsTop={1}
      fixedRowsBottom={1}
      colHeaders={true}
      columnSorting={true}
      // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting
      afterColumnSort={exclude}
      cells={(row, col, prop) => {
        if (hotTableComponentRef.current != null) {
          const lastRowIndex = hotTableComponentRef.current.hotInstance.countRows() - 1;

          if (row === 0) {
            return {
              type: 'text',
              className: 'htCenter',
              readOnly: true,
            };
          }
          if (row === lastRowIndex) {
            return {
              type: 'numeric',
              className: 'htCenter',
            };
          }
        }
      }}
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
ReactDOM.render(<App />, document.getElementById('exampleExcludeRowsFromSorting'));
/* end:skip-in-preview */
```

:::

:::

## Control sorting programmatically

You can control sorting at the grid's runtime by using Handsontable's
[hooks](@/guides/getting-started/events-and-hooks.md) and
[API methods](@/api/columnSorting.md#methods).

This allows you to:

- Enable or disable sorting depending on specified conditions. For example, you can disable sorting
  for very large data sets.
- Trigger sorting depending on the state of another component in your application. For example, you
  can let the end user sort data by clicking on buttons outside of the grid.

::: only-for react

To learn how to access Handsontable's API methods, see this guide:
[Instance methods](@/guides/getting-started/react-methods.md).

:::

### Enable or disable sorting programmatically

To enable or disable sorting programmatically, use the
[`updateSettings()`](@/api/core.md#updatesettings) method.

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

Mind that calling [`columnSorting.sort()`](@/api/columnSorting.md#sort) overwrites any previous sort
orders.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting for all columns
  columnSorting: true,
};

const columnSorting = handsontableInstance.getPlugin('columnSorting');

columnSorting.sort(
  // sort data by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc', // for descending order, use `'desc'`
  }
);

// go back to the original order
columnSorting.clearSort();
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting for all columns
  columnSorting={true}
  ref={hotTableComponentRef}
/>;

const hotTableComponentRef = useRef(null);
// get the `ColumnSorting` plugin
const columnSorting = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

columnSorting.sort(
  // sort data by the first column, in ascending order
  {
    column: 0,
    sortOrder: 'asc', // for descending order, use `'desc'`
  }
);

// go back to the original order
columnSorting.clearSort();
```

:::

To see how it works, try out the following demo:

::: only-for javascript

::: example #exampleSortByAPI --html 1 --js 2

```html
<div id="exampleSortByAPI"></div>

<div class="controls">
  <button id="sort_asc" class="button">Sort by the "Brand" column, in ascending order</button>
  <br />
  <br />
  <button id="unsort" class="button">Go back to the original order</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleSortByAPI');
const buttonSortAscending = document.querySelector('#sort_asc');
const buttonUnsort = document.querySelector('#unsort');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  columnSorting: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});

const columnSorting = handsontableInstance.getPlugin('columnSorting');

buttonSortAscending.addEventListener('click', () => {
  columnSorting.sort({
    column: 0,
    sortOrder: 'asc',
  });
});

buttonUnsort.addEventListener('click', () => {
  columnSorting.clearSort();
});
```

:::

:::

::: only-for react

::: example #exampleSortByAPI :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const sortAsc = () => {
    // get the `ColumnSorting` plugin
    const columnSorting = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

    columnSorting.sort({
      column: 0,
      sortOrder: 'asc',
    });
  };

  const unsort = () => {
    // get the `ColumnSorting` plugin
    const columnSorting = hotTableComponentRef.current.hotInstance.getPlugin('columnSorting');

    columnSorting.clearSort();
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
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
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
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
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
        stretchH="all"
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
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleSortByAPI'));
/* end:skip-in-preview */
```

:::

:::

### Sort data programmatically by multiple columns

To sort data programmatically [by multiple columns](#sort-by-multiple-columns), use the
[`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) method. Remember to
[enable](#sort-by-multiple-columns) sorting by multiple columns first.

Mind that calling [`multiColumnSorting.sort()`](@/api/multiColumnSorting.md#sort) overwrites any
previous sort orders.

::: only-for javascript

```js
const configurationOptions = {
  // enable sorting by multiple columns, for all columns
  multiColumnSorting: true,
};

// get the `MultiColumnSorting` plugin
const multiColumnSorting = handsontableInstance.getPlugin('multiColumnSorting');

multiColumnSorting.sort([
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
]);

// go back to the original order
multiColumnSorting.clearSort();
```

:::

::: only-for react

```jsx
<HotTable
  // enable sorting by multiple columns, for all columns
  multiColumnSorting={true}
  ref={hotTableComponentRef}
/>;

const hotTableComponentRef = useRef(null);
// get the `ColumnSorting` plugin
const multiColumnSorting = hotTableComponentRef.current.hotInstance.getPlugin('multiColumnSorting');

multiColumnSorting.sort([
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
]);

// go back to the original order
multiColumnSorting.clearSort();
```

:::

To see how it works, try out the following demo:

::: only-for javascript

::: example #exampleSortByAPIMultipleColumns --html 1 --js 2

```html
<div id="exampleSortByAPIMultipleColumns"></div>

<div class="controls">
  <button id="sort" class="button">Sort</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#exampleSortByAPIMultipleColumns');
const buttonSort = document.querySelector('#sort');
const handsontableInstance = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: false,
    },
    {
      brand: 'Jetpulse',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
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
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
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
  multiColumnSorting: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});

const multiColumnSorting = handsontableInstance.getPlugin('multiColumnSorting');

buttonSort.addEventListener('click', () => {
  multiColumnSorting.sort([
    {
      column: 0,
      sortOrder: 'asc',
    },
    {
      column: 1,
      sortOrder: 'desc',
    },
  ]);
});
```

:::

:::

::: only-for react

::: example #exampleSortByAPIMultipleColumns :react

```jsx
import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const App = () => {
  const hotTableComponentRef = useRef(null);
  const sort = () => {
    // get the `MultiColumnSorting` plugin
    const multiColumnSorting =
      hotTableComponentRef.current.hotInstance.getPlugin('multiColumnSorting');

    multiColumnSorting.sort([
      {
        column: 0,
        sortOrder: 'asc',
      },
      {
        column: 1,
        sortOrder: 'desc',
      },
    ]);
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
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '13:23 AM',
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
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
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
        multiColumnSorting={true}
        height="auto"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={sort}>Sort</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<App />, document.getElementById('exampleSortByAPIMultipleColumns'));
/* end:skip-in-preview */
```

:::

:::

## Import the sorting module

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/tools-and-building/modules.md) that you need.

To use sorting, you need only the following modules:

- The [base module](@/guides/tools-and-building/modules.md#import-the-base-module)
- The [`ColumnSorting`](@/api/columnSorting.md) module or the
  [`MultiColumnSorting`](@/api/multiColumnSorting.md) module

```js
// import the base module
import Handsontable from 'handsontable/base';

// import Handsontable's CSS
import 'handsontable/dist/handsontable.full.min.css';

// import the ColumnSorting plugin (or the MultiColumnSorting plugin)
import { registerPlugin, ColumnSorting } from 'handsontable/plugins';

// register the ColumnSorting (or MultiColumnSorting plugin)
registerPlugin(ColumnSorting);
```

## API reference

For the list of [options](@/guides/getting-started/configuration-options.md), methods, and
[Handsontable hooks](@/guides/getting-started/events-and-hooks.md) related to sorting, see the
following API reference pages:

- [`ColumnSorting`](@/api/columnSorting.md)
- [`MultiColumnSorting`](@/api/multiColumnSorting.md)

## Troubleshooting

Didn't find what you need? Try this:

- [View related topics](https://github.com/handsontable/handsontable/labels/Column%20sorting) on
  GitHub
- [Report an issue](https://github.com/handsontable/handsontable/issues/new/choose) on GitHub
- [Ask a question](https://stackoverflow.com/questions/tagged/handsontable) on Stack Overflow
- [Start a discussion](https://forum.handsontable.com/c/getting-help/questions) on Handsontable's
  forum
- [Contact our technical support](https://handsontable.com/contact?category=technical_support) to
  get help
