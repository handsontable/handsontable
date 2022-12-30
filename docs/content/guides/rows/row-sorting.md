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

**Sort rows alphabetically or numerically, in ascending, descending or a custom order, across one or multiple columns.**

[[toc]]

Click on a column label (A, B, C) to sort the rows in ascending, descending, or the original order.

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

Sorting happens on Handsontable's visual layer and doesn't affect your source data structure.

## Enable rows sorting

Enable rows sorting for the entire grid, individual columns, or individual rows.

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
        // enable rows sorting for column 1
        columnSorting: true,
      },
      {
        // disable rows sorting for column 2
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
      // enable rows sorting for column 1
      columnSorting={true}
    />
    <HotColumn
      // disable rows sorting for column 2
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

## Configure rows sorting

Configure the sorting UI, set the initial sort order, and implement your own compare function.

::: only-for javascript

<code-group>
  <code-block title="Default options">
  
  ```js
  const configurationOptions = {
    columnSorting: {
      // sort by clicking on a column label
      headerAction: true,
      // when sorting, move rows with empty cells to the bottom
      sortEmptyCells: false,
      // after sorting, display the arrow icon in the column header
      indicator: true,
    },
  };
  ```

  </code-block>

  <code-block title="All options">

  ```js
  const configurationOptions = {
    columnSorting: {
      // disable clicking on a column label to sort
      headerAction: false,
      // sort empty cells, too
      sortEmptyCells: true,
      // don't display the arrow icon in the column header
      indicator: false,

      // at initialization, sort rows by column 1, in descending order
      initialConfig: {
        column: 1,
        sortOrder: 'desc',
      },

      // implement your own comparator
      compareFunctionFactory(sortOrder, columnMeta) {
        return function(value, nextValue) {
          // a compare function
          // returns `-1`, or `0`, or `1`
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
      // sort by clicking on a column label
      headerAction: true,
      // when sorting, move rows with empty cells to the bottom
      sortEmptyCells: false,
      // after sorting, display the arrow icon in the column header
      indicator: true,
    }}
  />
  ```

  </code-block>

  <code-block title="All options">

  ```jsx
  <HotTable
    columnSorting={{
      // sort by clicking on a column label
      headerAction: true,
      // sort empty cells, too
      sortEmptyCells: true,
      // after sorting, display the arrow icon in the column header
      indicator: true,

      // at initialization, sort rows by column 1, in descending order
      initialConfig: {
        column: 1,
        sortOrder: 'desc',
      },

      // implement your own comparator
      compareFunctionFactory(sortOrder, columnMeta) {
        return function(value, nextValue) {
          // a compare function
          // returns `-1`, or `0`, or `1`
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

This demo sets a different [`type`](@/api/options.md#type) for each column, and sets additional options for formatting numbers and dates.

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

Sort data by multiple columns, to apply additional levels of sort criteria.

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

Enable multicolumn sorting for the entire grid, or for individual columns.

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
</code-group>

:::

## Set the initial sort order

Sort your data at Handsontable's initialization, to start out with rows displayed in a particular order.

In this demo, the rows are initially sorted by column A, in ascending order.

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
    // at initialization, sort rows by column 0, in ascending order
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
        // at initialization, sort rows by column 0, in ascending order
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

To set this up, use the [`initialConfig`](@/api/options.md#columnsorting) option.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // at initialization, sort rows by column 0, in ascending order
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
    // at initialization, sort rows by column 0, in ascending order
    initialConfig: {
      column: 0,
      sortOrder: 'asc',  // for descending order, set `'desc'`
    },
  }}
/>
```

:::

## Add custom sort icons

<!--
https://github.com/handsontable/handsontable/blob/develop/handsontable/src/css/handsontable.scss#L101-L148

https://jsfiddle.net/kirszenbaum/bmy2v60t/39/
-->

To replace the default sort icons, overwrite the `.columnSorting` classes of Handsontable's CSS.

```css
.handsontable span.colHeader.columnSorting.ascending::before {
 content: '✋';
}

.handsontable span.colHeader.columnSorting.descending::before {
 content: '✋';
}
```

## Add a custom comparator

Add a custom [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description), to implement your own rows sorting logic.

::: only-for javascript

```js
const configurationOptions = {
  columnSorting: {
    // implement your own comparator
    compareFunctionFactory(sortOrder, columnMeta) {
      return function(value, nextValue) {
        // a compare function
        // returns `-1`, or `0`, or `1`
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
        // a compare function
        // returns `-1`, or `0`, or `1`
      },
    },
  }}
/>
```

:::