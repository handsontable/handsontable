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

In this demo, click on a column label (A, B, C) to sort the rows in ascending, descending, or the original order.

::: only-for javascript

::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');

const myHandsontableInstance = new Handsontable(container, {
  data: [
    { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
    { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
    { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
  ],
  columns: [
    {
      type: 'text',
      data: 'car',
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
      type: 'date',
      data: 'productionDate',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900'
    }
  ],
  colHeaders: true,
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

export const MyHandsontableComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
        { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
        { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
      ]}
      columns={[
        {
          type: 'text',
          data: 'car',
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
          type: 'date',
          data: 'productionDate',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/1900'
        }
      ]}
      columnSorting={{
        // at initialization, sort rows by column 1, in descending order
        initialConfig: {
          column: 1,
          sortOrder: 'desc',
        },
      }}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<MyHandsontableComponent />, document.getElementById('example1'));
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
      myHandsontableInstance.rowIndexMapper.moveIndexes(
        [
          myHandsontableInstance.toVisualRow(0),
          myHandsontableInstance.toVisualRow(1)
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

const myHandsontableInstance = new Handsontable(container, {
  data: [
    { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
    { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
    { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
  ],
  columns: [
    {
      // set the data type of column 1
      type: 'text', // 'text' is the default type, so you can omit it
      data: 'car',
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
      type: 'date',
      data: 'productionDate',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900'
    }
  ],
  colHeaders: true,
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

export const MyHandsontableComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
        { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
        { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
      ]}
      columns={[
        {
          // set the data type of column 1
          type: 'text', // 'text' is the default type, so you can omit it
          data: 'car',
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
          type: 'date',
          data: 'productionDate',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/1900'
        }
      ]}
      columnSorting={true}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<MyHandsontableComponent />, document.getElementById('example2'));
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
      myHandsontableInstance.rowIndexMapper.moveIndexes(
        [
          myHandsontableInstance.toVisualRow(0),
          myHandsontableInstance.toVisualRow(1)
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

1. Click on a column label (A, B, C) to sort the rows by a single column.
2. Hold down <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd>.
3. Click on other column labels to apply additional levels of sort criteria.

::: only-for javascript

::: example #example3
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');

const myHandsontableInstance = new Handsontable(container, {
  data: [
    { car: 'Tesla', price: 33750, productionDate: '06/29/2022' },
    { car: 'Honda', price: 72788, productionDate: '04/02/2021' },
    { car: 'Mazda', price: 32426, productionDate: '09/11/2020' },
    { car: 'Tesla', price: 32750, productionDate: '06/28/2022' },
    { car: 'Honda', price: 71788, productionDate: '04/03/2021' },
    { car: 'Mazda', price: 31426, productionDate: '09/10/2020' },
  ],
  columns: [
    {
      // set the data type of column 1
      type: 'text', // 'text' is the default type, so you can omit it
      data: 'car',
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
      type: 'date',
      data: 'productionDate',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900'
    }
  ],
  colHeaders: true,
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

export const MyHandsontableComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', price: 33750, productionDate: '06/29/2022' },
        { car: 'Honda', price: 72788, productionDate: '04/02/2021' },
        { car: 'Mazda', price: 32426, productionDate: '09/11/2020' },
        { car: 'Tesla', price: 32750, productionDate: '06/28/2022' },
        { car: 'Honda', price: 71788, productionDate: '04/03/2021' },
        { car: 'Mazda', price: 31426, productionDate: '09/10/2020' },
      ]}
      columns={[
        {
          type: 'text',
          data: 'car',
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
          type: 'date',
          data: 'productionDate',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/1900'
        }
      ]}
      multiColumnSorting={true}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<MyHandsontableComponent />, document.getElementById('example3'));
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
      sortOrder: 'asc', // for descending order, set `'desc'`
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
      sortOrder: 'asc',  // for descending order, set `'desc'`
    },
  }}
/>
```

:::

In this demo, rows are initially sorted by column A, in ascending order.

::: only-for javascript

::: example #example4
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example4');

const myHandsontableInstance = new Handsontable(container, {
  data: [
    { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
    { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
    { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
  ],
  columns: [
    {
      type: 'text',
      data: 'car',
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
      type: 'date',
      data: 'productionDate',
      dateFormat: 'MM/DD/YYYY',
      correctFormat: true,
      defaultDate: '01/01/1900'
    }
  ],
  colHeaders: true,
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

export const MyHandsontableComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
        { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
        { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
      ]}
      columns={[
        {
          type: 'text',
          data: 'car',
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
          type: 'date',
          data: 'productionDate',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/1900'
        }
      ]}
      columnSorting={{
        // at initialization, sort rows by column 1, in ascending order
        initialConfig: {
          column: 0,
          sortOrder: 'asc',
        },
      }}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      width="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<MyHandsontableComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```
:::

:::

## Add custom sort icons

<!--
https://github.com/handsontable/handsontable/blob/develop/handsontable/src/css/handsontable.scss#L101-L148

https://jsfiddle.net/kirszenbaum/bmy2v60t/39/
-->

To replace the default sort icons, overwrite the `.columnSorting` classes of Handsontable's CSS.

```css
/* the icon for ascending order */
.handsontable span.colHeader.columnSorting.ascending::before {
 content: '✋';
}

/* the icon for descending order */
.handsontable span.colHeader.columnSorting.descending::before {
 content: '✋';
}
```

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

::: example #example5 --html 1 --js 2
```html
<div id="example5"></div>

<div class="controls">
  <button id="sort">Sort rows by column 1, in ascending order</button>
</div>
```

```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example5');
const button = document.querySelector('#sort');
const handsontableInstance = new Handsontable(container, {
  data: [
    { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
    { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
    { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
  ],
  colHeaders: true,
  rowHeaders: true,
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});

const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');

button.addEventListener('click', () => {
  columnSortingPluginInstance.sort({
    column: 0,
    sortOrder: 'asc',
  });
});
```

:::

:::


::: only-for react

::: example #example5 :react

```jsx
import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotTableComponentRef = useRef(null);

  let buttonClickCallback;

  useEffect(() => {
    const handsontableInstance = hotTableComponentRef.current.hotInstance;

    const columnSortingPluginInstance = handsontableInstance.getPlugin('columnSorting');
    
    buttonClickCallback = () => {
      columnSortingPluginInstance.sort({
        column: 0,
        sortOrder: 'asc',
      });
    };
  });

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          { car: 'Tesla', price: 32750, productionDate: '06/29/2022' },
          { car: 'Honda', price: 71788, productionDate: '04/02/2021' },
          { car: 'Mazda', price: 31426, productionDate: '09/11/2020' },
        ]}
        colHeaders={true}
        rowHeaders={true}
        columnSorting={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button id="export-file" onClick={(...args) => buttonClickCallback(...args)}>Sort rows by column 1, in ascending order</button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example5'));
/* end:skip-in-preview */
```

:::

:::

## Related resources

Read our [blog article](https://handsontable.com/blog/articles/2018/11/feature-spotlight-multi-column-sorting) about multi-column rows sorting.

### More examples

- [Enable rows sorting](https://examples.handsontable.com/demo/sorting.html)
- [Disable sorting for individual columns](https://jsfiddle.net/handsoncode/gsvy8m0f)
- [Sort remote data]()
- [Make the sorted state persistent]()
- [Sort different kinds of data in a single column (kg vs dkg)]()
- [Sort the child rows of a parent row]()
- [Ignore HTML while sorting]()
- [Change the background color of the sorted column headers]()
- [Get the current sort parameters]()

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