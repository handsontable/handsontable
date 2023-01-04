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
  - columns sorting
  - columnSorting
  - multicolumn sorting
  - multi-column sorting
  - multiColumnSorting
react:
  id: h4jfevxj
  metaTitle: Rows sorting - React Data Grid | Handsontable
searchCategory: Guides
---

# Rows sorting

<p style="font-size:20px;">Sort rows alphabetically or numerically, in ascending, descending or a custom order, across one or multiple columns.</p>

[[toc]]

Try it out: click on a column label to sort the rows in ascending, descending, or the original order.

::: only-for javascript

::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');

const yourHandsontableInstance = new Handsontable(container, {
  data: [
    {
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      type: 'text',
      data: 'company',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      type: 'text',
      data: 'name',
    },
    {
      type: 'date',
      data: 'sellDate',
    },
    {
      type: 'text',
      data: 'orderID',
    },
    {
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
  height: 'auto',
  width: 'auto',
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
        company: 'Tagcat',
        name: 'Classic Vest',
        price: 327,
        sellDate: '11/10/2020',
        orderID: '01-2331',
        inStock: true,
      },
      {
        company: 'Zoomzone',
        name: 'Cycling Cap',
        price: 717,
        sellDate: '03/05/2020',
        orderID: '88-2768',
        inStock: true,
      },
      {
        company: 'Meeveo',
        name: 'Full-Finger Gloves',
        price: 314,
        sellDate: '27/03/2020',
        orderID: '51-6775',
        inStock: true,
      },
      {
        company: 'Buzzdog',
        name: 'HL Mountain Frame',
        price: 268,
        sellDate: '29/08/2020',
        orderID: '44-4028',
        inStock: true,
      },
      {
        company: 'Katz',
        name: 'Half-Finger Gloves',
        price: 204,
        sellDate: '02/10/2020',
        orderID: '08-2758',
        inStock: true,
      },
    ]}
      columns={[
        {
          type: 'text',
          data: 'company',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
        },
        {
          type: 'text',
          data: 'name',
        },
        {
          type: 'date',
          data: 'sellDate',
        },
        {
          type: 'text',
          data: 'orderID',
        },
        {
          type: 'checkbox',
          data: 'inStock',
        },
      ]}
      colHeaders={[
        'Company',
        'Price',
        'Name',
        'Sell date',
        'Order ID',
        'Stock',
      ]}
      columnSorting={{
        // at initialization, sort rows by column 1, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      rowHeaders={true}
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

Only the table view is sorted. Your source data remains in the original order.

## Enable rows sorting

To enable rows sorting, use the [`columnSorting`](@/api/options.md#columnsorting) option.

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  const configurationOptions = {
    // enable rows sorting for the entire grid
    columnSorting: true,
  };
  ```
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>
  <code-block title="Rows">
  
  ```js
  const configurationOptions = {
    // enable rows sorting for the entire grid
    columnSorting: true,

    // exclude rows 1 and 2 from sorting
    afterColumnSort() {
      yourHandsontableInstance.rowIndexMapper.moveIndexes(
        [
          yourHandsontableInstance.toVisualRow(0),
          yourHandsontableInstance.toVisualRow(1)
        ], 0);
    },
  };
  ```
  
  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
  ```jsx
  <HotTable
    // enable rows sorting for the entire grid
    columnSorting={true}
  />
  ```
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>
  <code-block title="Rows">
  
  ```jsx
  // you need `useRef` to call Handsontable's instance methods
  import { useRef } from 'react';
  const hotTableComponentRef = useRef(null);

  <HotTable
    ref={hotTableComponentRef}

    // enable rows sorting for the entire grid
    columnSorting={true}

    // exclude rows 1 and 2 from sorting
    afterColumnSort={{
      hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
        [
          hotTableComponentRef.current.hotInstance.toVisualRow(0),
          hotTableComponentRef.current.hotInstance.toVisualRow(1),
        ], 0);
    }},
  />
  ```
  
  </code-block>
</code-group>

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

## Configure rows sorting

Configure the sort UI, set an initial sort order, and implement your own compare function.

By default:
- Sorting is enabled for all columns.
- The end user can sort rows by clicking on the column label.
- The sort order indicator is visible.
- No rows are sorted initially.

::: only-for javascript

<code-group>
  <code-block title="Default options">
  
  ```js
  const configurationOptions = {
    columnSorting: {
      // let the end user sort rows by clicking on the column label
      headerAction: true,
      // don't sort empty cells (move rows with empty cells to the bottom)
      sortEmptyCells: false,
      // show the sort order indicator in the column header
      indicator: true,
    },
  };
  ```

  </code-block>

  <code-block title="All options">

  ```js
  const configurationOptions = {
    columnSorting: {
      // don't let the end user sort rows by clicking on the column label
      headerAction: false,
      // sort empty cells, too
      sortEmptyCells: true,
      // hide the sort order indicator in the column header
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

  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Default options">
  
  ```jsx
  <HotTable
    columnSorting={{
      // let the end user sort rows by clicking on the column label
      headerAction: true,
      // don't sort empty cells (move rows with empty cells to the bottom)
      sortEmptyCells: false,
      // show the sort order indicator in the column header
      indicator: true,
    }}
  />
  ```

  </code-block>

  <code-block title="All options">

  ```jsx
  <HotTable
    columnSorting={{
      // don't let the end user sort rows by clicking on the column label
      headerAction: false,
      // sort empty cells, too
      sortEmptyCells: true,
      // hide the sort order indicator in the column header
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

  </code-block>
</code-group>

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

This demo defines a different [`type`](@/api/options.md#type) for each column, and sets a few additional options for formatting numbers and dates.

::: only-for javascript

::: example #example2
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example2');

const yourHandsontableInstance = new Handsontable(container, {
  data: [
    {
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      // set the data type of column 1
      type: 'text', // 'text' is the default type, so you can omit it
      data: 'company',
    },
    {
      // set the data type of column 2
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      // set the data type of column 3
      type: 'text',
      data: 'name',
    },
    {
      // set the data type of column 4
      type: 'date',
      data: 'sellDate',
    },
    {
      // set the data type of column 5
      type: 'text',
      data: 'orderID',
    },
    {
      // set the data type of column 6
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
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
        company: 'Tagcat',
        name: 'Classic Vest',
        price: 327,
        sellDate: '11/10/2020',
        orderID: '01-2331',
        inStock: true,
      },
      {
        company: 'Zoomzone',
        name: 'Cycling Cap',
        price: 717,
        sellDate: '03/05/2020',
        orderID: '88-2768',
        inStock: true,
      },
      {
        company: 'Meeveo',
        name: 'Full-Finger Gloves',
        price: 314,
        sellDate: '27/03/2020',
        orderID: '51-6775',
        inStock: true,
      },
      {
        company: 'Buzzdog',
        name: 'HL Mountain Frame',
        price: 268,
        sellDate: '29/08/2020',
        orderID: '44-4028',
        inStock: true,
      },
      {
        company: 'Katz',
        name: 'Half-Finger Gloves',
        price: 204,
        sellDate: '02/10/2020',
        orderID: '08-2758',
        inStock: true,
      },
    ]}
      columns={[
        {
          // set the data type of column 1
          type: 'text', // 'text' is the default type, so you can omit it
          data: 'company',
        },
        {
          // set the data type of column 2
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
        },
        {
          // set the data type of column 3
          type: 'text',
          data: 'name',
        },
        {
          // set the data type of column 4
          type: 'date',
          data: 'sellDate',
        },
        {
          // set the data type of column 5
          type: 'text',
          data: 'orderID',
        },
        {
          // set the data type of column 6
          type: 'checkbox',
          data: 'inStock',
        },
      ]}
      colHeaders={[
        'Company',
        'Price',
        'Name',
        'Sell date',
        'Order ID',
        'Stock',
      ]}
      columnSorting={true}
      rowHeaders={true}
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

To let the end user apply multiple levels of sort criteria, use the [`multiColumnSorting`](@/api/options.md#multicolumnsorting) option.

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  const configurationOptions = {
    // enable sorting by multiple columns (for the entire grid)
    multiColumnSorting: true,
  };
  ```
  
  </code-block>
  <code-block title="Columns">
  
  ```js
  const configurationOptions = {
    columns: [
      {
        // enable sorting by multiple columns (for column 1)
        multiColumnSorting: true,
      },
      {
        // disable sorting by multiple columns (for column 2)
        multiColumnSorting: false,
      },
    ],
  };
  ```
  
  </code-block>
  <code-block title="Rows">
  
  ```js
  const configurationOptions = {
    // enable sorting by multiple columns (for the entire grid)
    multiColumnSorting: true,

    // exclude rows 1 and 2 from sorting
    afterColumnSort() {
      yourHandsontableInstance.rowIndexMapper.moveIndexes(
        [
          yourHandsontableInstance.toVisualRow(0),
          yourHandsontableInstance.toVisualRow(1)
        ], 0);
    },
  };
  ```
  
  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
  ```jsx
  <HotTable
    // enable sorting by multiple columns (for the entire grid)
    multiColumnSorting={true}
  />
  ```
  
  </code-block>
  <code-block title="Columns">
  
  ```jsx
  <HotTable>
    <HotColumn
      // enable sorting by multiple columns (for column 1)
      multiColumnSorting={true}
    />
    <HotColumn
      // disable sorting by multiple columns (for column 2)
      multiColumnSorting={false}
    />
  </HotTable>
  ```
  
  </code-block>
  <code-block title="Rows">

  ```jsx
  // you need `useRef` to call Handsontable's instance methods
  import { useRef } from 'react';
  const hotTableComponentRef = useRef(null);

  <HotTable
    ref={hotTableComponentRef}

    // enable sorting by multiple columns (for the entire grid)
    columnSorting={true}

    // exclude rows 1 and 2 from sorting
    afterColumnSort={{
      hotTableComponentRef.current.hotInstance.rowIndexMapper.moveIndexes(
        [
          hotTableComponentRef.current.hotInstance.toVisualRow(0),
          hotTableComponentRef.current.hotInstance.toVisualRow(1),
        ], 0);
    }},
  />
  ```
  
  </code-block>
</code-group>

:::

Don't use the [`columnSorting`](@/api/options.md#columnsorting) and [`multiColumnSorting`](@/api/options.md#multicolumnsorting) options at the same time, though.

Try it out:

1. Click on a column label to sort the rows by a single column.
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd>.
3. Click on other column labels to apply additional levels of sort criteria.

::: only-for javascript

::: example #example3
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');

const yourHandsontableInstance = new Handsontable(container, {
  data: [
    {
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      type: 'text',
      data: 'company',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      type: 'text',
      data: 'name',
    },
    {
      type: 'date',
      data: 'sellDate',
    },
    {
      type: 'text',
      data: 'orderID',
    },
    {
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
  height: 'auto',
  width: 'auto',
  // enable sorting by multiple columns (for the entire grid)
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
        company: 'Tagcat',
        name: 'Classic Vest',
        price: 327,
        sellDate: '11/10/2020',
        orderID: '01-2331',
        inStock: true,
      },
      {
        company: 'Zoomzone',
        name: 'Cycling Cap',
        price: 717,
        sellDate: '03/05/2020',
        orderID: '88-2768',
        inStock: true,
      },
      {
        company: 'Meeveo',
        name: 'Full-Finger Gloves',
        price: 314,
        sellDate: '27/03/2020',
        orderID: '51-6775',
        inStock: true,
      },
      {
        company: 'Buzzdog',
        name: 'HL Mountain Frame',
        price: 268,
        sellDate: '29/08/2020',
        orderID: '44-4028',
        inStock: true,
      },
      {
        company: 'Katz',
        name: 'Half-Finger Gloves',
        price: 204,
        sellDate: '02/10/2020',
        orderID: '08-2758',
        inStock: true,
      },
    ]}
      columns={[
        {
          type: 'text',
          data: 'company',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
        },
        {
          type: 'text',
          data: 'name',
        },
        {
          type: 'date',
          data: 'sellDate',
        },
        {
          type: 'text',
          data: 'orderID',
        },
        {
          type: 'checkbox',
          data: 'inStock',
        },
      ]}
      colHeaders={[
        'Company',
        'Price',
        'Name',
        'Sell date',
        'Order ID',
        'Stock',
      ]}
      // enable sorting by multiple columns (for the entire grid)
      multiColumnSorting={true}
      rowHeaders={true}
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
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      type: 'text',
      data: 'company',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      type: 'text',
      data: 'name',
    },
    {
      type: 'date',
      data: 'sellDate',
    },
    {
      type: 'text',
      data: 'orderID',
    },
    {
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
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
        company: 'Tagcat',
        name: 'Classic Vest',
        price: 327,
        sellDate: '11/10/2020',
        orderID: '01-2331',
        inStock: true,
      },
      {
        company: 'Zoomzone',
        name: 'Cycling Cap',
        price: 717,
        sellDate: '03/05/2020',
        orderID: '88-2768',
        inStock: true,
      },
      {
        company: 'Meeveo',
        name: 'Full-Finger Gloves',
        price: 314,
        sellDate: '27/03/2020',
        orderID: '51-6775',
        inStock: true,
      },
      {
        company: 'Buzzdog',
        name: 'HL Mountain Frame',
        price: 268,
        sellDate: '29/08/2020',
        orderID: '44-4028',
        inStock: true,
      },
      {
        company: 'Katz',
        name: 'Half-Finger Gloves',
        price: 204,
        sellDate: '02/10/2020',
        orderID: '08-2758',
        inStock: true,
      },
    ]}
      columns={[
        {
          type: 'text',
          data: 'company',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
        },
        {
          type: 'text',
          data: 'name',
        },
        {
          type: 'date',
          data: 'sellDate',
        },
        {
          type: 'text',
          data: 'orderID',
        },
        {
          type: 'checkbox',
          data: 'inStock',
        },
      ]}
      colHeaders={[
        'Company',
        'Price',
        'Name',
        'Sell date',
        'Order ID',
        'Stock',
      ]}
      columnSorting={{
        // at initialization, sort rows by column 1, in ascending order
        initialConfig: {
          column: 0,
          sortOrder: 'asc',
        },
      }}
      rowHeaders={true}
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
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      type: 'text',
      data: 'company',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      type: 'text',
      data: 'name',
    },
    {
      type: 'date',
      data: 'sellDate',
    },
    {
      type: 'text',
      data: 'orderID',
    },
    {
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
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
        company: 'Tagcat',
        name: 'Classic Vest',
        price: 327,
        sellDate: '11/10/2020',
        orderID: '01-2331',
        inStock: true,
      },
      {
        company: 'Zoomzone',
        name: 'Cycling Cap',
        price: 717,
        sellDate: '03/05/2020',
        orderID: '88-2768',
        inStock: true,
      },
      {
        company: 'Meeveo',
        name: 'Full-Finger Gloves',
        price: 314,
        sellDate: '27/03/2020',
        orderID: '51-6775',
        inStock: true,
      },
      {
        company: 'Buzzdog',
        name: 'HL Mountain Frame',
        price: 268,
        sellDate: '29/08/2020',
        orderID: '44-4028',
        inStock: true,
      },
      {
        company: 'Katz',
        name: 'Half-Finger Gloves',
        price: 204,
        sellDate: '02/10/2020',
        orderID: '08-2758',
        inStock: true,
      },
    ]}
      columns={[
        {
          type: 'text',
          data: 'company',
        },
        {
          type: 'numeric',
          data: 'price',
          numericFormat: {
            pattern: '$ 0,0.00',
            culture: 'en-US'
          },
        },
        {
          type: 'text',
          data: 'name',
        },
        {
          type: 'date',
          data: 'sellDate',
        },
        {
          type: 'text',
          data: 'orderID',
        },
        {
          type: 'checkbox',
          data: 'inStock',
        },
      ]}
      colHeaders={[
        'Company',
        'Price',
        'Name',
        'Sell date',
        'Order ID',
        'Stock',
      ]}
      columnSorting={{
        // at initialization, sort rows by column 1, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      className="your-handsontable-instance"
      rowHeaders={true}
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

Control sorting at runtime by using Handsontable's API.

::: only-for react

To learn how to access the API methods, read the [Instance methods](@/guides/getting-started/react-methods.md) guide.

:::

### Disable rows sorting

To disable and re-enable sorting at Handsontable's runtime, use the [`updateSettings()`](@/api/core.md#updatesettings) method.

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  // disable rows sorting for the entire grid
  handsontableInstance.updateSettings({
    columnSorting: false,
  });

  // re-enable rows sorting for the entire grid
  handsontableInstance.updateSettings({
    columnSorting: true,
  });
  ```
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
  ```jsx
  const hotTableComponentRef = useRef(null);

  // disable rows sorting for the entire grid
  hotTableComponentRef.current.hotInstance.updateSettings({
    columnSorting: false,
  });

  // re-enable rows sorting for the entire grid
  hotTableComponentRef.current.hotInstance.updateSettings({
    columnSorting: true,
  });
  ```
  
  </code-block>
  <code-block title="Columns">
  
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
  
  </code-block>
</code-group>

:::

### Sort rows programmatically

To sort rows programmatically, use the [`columnSorting.sort()`](@/api/columnSorting.md#sort) method.
Remember to [enable rows sorting](#enable-rows-sorting) first.

Mind that [`columnSorting.sort()`](@/api/columnSorting.md#sort) erases any previous sort orders.

::: only-for javascript

```js
// get the `ColumnSorting` plugin instance
const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

columnSortingPluginInstance.sort(
  // sort column 1 in ascending order
  {
    column: 0,
    sortOrder: 'asc',
  },
  // sort column 2 in descending order
  {
    column: 1,
    sortOrder: 'desc',
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
  // sort column 1 in ascending order
  {
    column: 0,
    sortOrder: 'asc',
  },
  // sort column 2 in descending order
  {
    column: 1,
    sortOrder: 'desc',
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
      company: 'Tagcat',
      name: 'Classic Vest',
      price: 327,
      sellDate: '11/10/2020',
      orderID: '01-2331',
      inStock: true,
    },
    {
      company: 'Zoomzone',
      name: 'Cycling Cap',
      price: 717,
      sellDate: '03/05/2020',
      orderID: '88-2768',
      inStock: true,
    },
    {
      company: 'Meeveo',
      name: 'Full-Finger Gloves',
      price: 314,
      sellDate: '27/03/2020',
      orderID: '51-6775',
      inStock: true,
    },
    {
      company: 'Buzzdog',
      name: 'HL Mountain Frame',
      price: 268,
      sellDate: '29/08/2020',
      orderID: '44-4028',
      inStock: true,
    },
    {
      company: 'Katz',
      name: 'Half-Finger Gloves',
      price: 204,
      sellDate: '02/10/2020',
      orderID: '08-2758',
      inStock: true,
    },
  ],
  columns: [
    {
      type: 'text',
      data: 'company',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US'
      },
    },
    {
      type: 'text',
      data: 'name',
    },
    {
      type: 'date',
      data: 'sellDate',
    },
    {
      type: 'text',
      data: 'orderID',
    },
    {
      type: 'checkbox',
      data: 'inStock',
    },
  ],
  colHeaders: [
    'Company',
    'Price',
    'Name',
    'Sell date',
    'Order ID',
    'Stock',
  ],
  rowHeaders: true,
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
          company: 'Tagcat',
          name: 'Classic Vest',
          price: 327,
          sellDate: '11/10/2020',
          orderID: '01-2331',
          inStock: true,
        },
        {
          company: 'Zoomzone',
          name: 'Cycling Cap',
          price: 717,
          sellDate: '03/05/2020',
          orderID: '88-2768',
          inStock: true,
        },
        {
          company: 'Meeveo',
          name: 'Full-Finger Gloves',
          price: 314,
          sellDate: '27/03/2020',
          orderID: '51-6775',
          inStock: true,
        },
        {
          company: 'Buzzdog',
          name: 'HL Mountain Frame',
          price: 268,
          sellDate: '29/08/2020',
          orderID: '44-4028',
          inStock: true,
        },
        {
          company: 'Katz',
          name: 'Half-Finger Gloves',
          price: 204,
          sellDate: '02/10/2020',
          orderID: '08-2758',
          inStock: true,
        },
      ]}
        columns={[
          {
            type: 'text',
            data: 'company',
          },
          {
            type: 'numeric',
            data: 'price',
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US'
            },
          },
          {
            type: 'text',
            data: 'name',
          },
          {
            type: 'date',
            data: 'sellDate',
          },
          {
            type: 'text',
            data: 'orderID',
          },
          {
            type: 'checkbox',
            data: 'inStock',
          },
        ]}
        colHeaders={[
          'Company',
          'Price',
          'Name',
          'Sell date',
          'Order ID',
          'Stock',
        ]}
        columnSorting={{
          // at initialization, sort rows by column 1, in descending order
          initialConfig: {
            column: 1,
            sortOrder: 'desc',
          },
        }}
        rowHeaders={true}
        height="auto"
        width="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <br></br>
        <button onClick={sort_asc}>Sort column 1, in ascending order</button>
        <button onClick={sort_desc}>Sort column 1, in descending order</button>
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

Read our [blog article](https://handsontable.com/blog/articles/2018/11/feature-spotlight-multi-column-sorting) about multi-column rows sorting.

### More examples

::: only-for javascript

- [Disable sorting for individual columns](https://jsfiddle.net/handsoncode/gsvy8m0f)
- [Sort remote data]()
- [Make the sorted state persistent]()
- [Sort different units in the same column](https://jsfiddle.net/aszymanski/4pzrdtjw/)
- [Sort the child rows of a parent row]()
- [Ignore HTML while sorting]()
- [Change the background color of the sorted column headers]()
- [Get the current sort configuration](https://jsfiddle.net/aszymanski/mbzh3sLk/)

:::

::: only-for react

- [Disable sorting for individual columns](https://jsfiddle.net/kirszenbaum/r0pbLzgs/9)
- [Sort remote data]()
- [Make the sorted state persistent]()
- [Sort different units in the same column](https://jsfiddle.net/aszymanski/nxewLkhz)
- [Sort the child rows of a parent row]()
- [Ignore HTML while sorting]()
- [Change the background color of the sorted column headers]()
- [Get the current sort configuration](https://jsfiddle.net/aszymanski/2g5ary7n/)

:::

### API reference

| Plugins                                                                                          | Options                                                                                                               | Handsontable's hooks                                                                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`ColumnSorting`](@/api/columnSorting.md)<br>[`MultiColumnSorting`](@/api/multiColumnSorting.md) | [`columnSorting`](@/api/options.md#columnsorting)<br>[`multiColumnSorting`](@/api/options.md#multicolumnsorting) | [`afterColumnSort`](@/api/hooks.md#aftercolumnsort)<br>[`beforeColumnSort`](@/api/hooks.md#beforecolumnsort) |

## Troubleshooting

Didn't find what you need? Try this:

- View [GitHub issues](https://github.com/handsontable/handsontable/labels/Column%20sorting) related to rows sorting
- Report a [new GitHub issue](https://github.com/handsontable/handsontable/issues/new/choose)
- Ask a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/handsontable)
- Ask a question on [Handsontable's forum](https://forum.handsontable.com/c/getting-help/questions)
- Contact Handsontable's [technical support](https://handsontable.com/contact?category=technical_support)