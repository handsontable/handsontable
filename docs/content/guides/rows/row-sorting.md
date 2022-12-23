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
react:
  id: h4jfevxj
  metaTitle: Rows sorting - React Data Grid | Handsontable
searchCategory: Guides
---

# Rows sorting

**Sort rows alphabetically or numerically, in ascending, descending or a custom order, across one or multiple columns.**

[[toc]]

In the demo below, click on a column name to sort the data in ascending or descending order. The third click on the same header restores the original order.

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');

const myHandsontableInstance = new Handsontable(container, {
  data: [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' },
    { id: 4, name: 'D' },
    { id: 5, name: 'E' },
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  width: 'auto',
  // enable rows sorting (for the entire grid)
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation'
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
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
        { id: 4, name: 'D' },
        { id: 5, name: 'E' },
      ]}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      width="auto"
      // enable rows sorting (for the entire grid)
      columnSorting={true}
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
  <code-block title="Cells">
  
  ```js
  // you can't enable rows sorting for individual cells
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
  <code-block title="Single columns">
  
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
  <code-block title="Single rows">
  
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
  <code-block title="Single cells">
  
  ```jsx
  // you can't enable rows sorting for individual cells
  ```
  
  </code-block>
</code-group>

:::

## Configure rows sorting

Configure the UI, set the initial sorting order, and implement your own comparison function.

::: only-for javascript

<code-group>
  <code-block title="Configuration options">

  ```js
  const configurationOptions = {
    columnSorting: {
      // display the arrow icon in the column header
      indicator: true,

      // enable clicking on the column header to sort the column
      headerAction: true,

      // sort empty cells as well
      sortEmptyCells: true,

      // at initialization, sort rows by column 1, in ascending order
      initialConfig: {
        column: 1,
        sortOrder: 'asc'
      },

      // at initialization, sort rows by column 2, in descending order
      initialConfig: {
        column: 2,
        sortOrder: 'desc'
      },

      // implement your own comparison function
      compareFunctionFactory(sortOrder, columnMeta) {
        return function(value, nextValue) {
          // a function that compares values
          // and returns `-1`, or `0`, or `1`
        }
      },
    },
  };
  ```

  </code-block>

  <code-block title="Default configuration">
  
  ```js
  const configurationOptions = {
    columnSorting: {
      indicator: true,
      headerAction: true,
      sortEmptyCells: false,
    },
  };
  ```
  
  </code-block>
</code-group>

:::


::: only-for react

<code-group>
  <code-block title="Configuration options">

  ```jsx
  <HotTable
    columnSorting={{
      columnSorting: {
        // display the arrow icon in the column header
        indicator: true,

        // enable clicking on the column header to sort the column
        headerAction: true,

        // sort empty cells as well
        sortEmptyCells: true,

        // at initialization, sort rows by column 1, in ascending order
        initialConfig: {
          column: 1,
          sortOrder: 'asc'
        },

        // at initialization, sort rows by column 2, in descending order
        initialConfig: {
          column: 2,
          sortOrder: 'desc'
        },

        // implement your own comparison function
        compareFunctionFactory(sortOrder, columnMeta) {
          return function(value, nextValue) {
            // a function that compares values
            // and returns `-1`, or `0`, or `1`
          }
        },
    }}
  />
  ```

  </code-block>

  <code-block title="Default configuration">
  
  ```js
  <HotTable
    columnSorting={{
      indicator: true,
      headerAction: true,
      sortEmptyCells: false,
    }}
  />
  ```
  
  </code-block>
</code-group>

:::