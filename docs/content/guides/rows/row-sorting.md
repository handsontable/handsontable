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

export const ExampleComponent = () => {
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
      columnSorting={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::

## Enable rows sorting

::: only-for javascript

<code-group>
  <code-block title="Entire grid">
  
  ```js
  const configurationOptions = {
    ...
  }
  ```
  
  </code-block>
  <code-block title="Single columns">
  
  ```js
  const configurationOptions = {
    columns: [
      {
        ...
      },
      {
        ...
      },
    ],
  }
  ```
  
  </code-block>
  <code-block title="Single rows">
  
  ```js
  const configurationOptions = {
    cells(row, col, prop) {
      if (row === 1 || row === 4) {
        return {
          ...
        };
      }
    }
  }
  ```
  
  </code-block>
  <code-block title="Single cells">
  
  ```js
  // you can't enable rows sorting for single cells
  ```
  
  </code-block>
</code-group>

:::

::: only-for react

<code-group>
  <code-block title="Entire grid">
  
  ```jsx
  <HotTable
    ...
  />
  ```
  
  </code-block>
  <code-block title="Single columns">
  
  ```jsx
  <HotTable>
    <HotColumn ... />
    <HotColumn ... />
    <HotColumn ... />
  </HotTable>
  ```
  
  </code-block>
  <code-block title="Single rows">
  
  ```jsx
  <HotTable
    cells={(row, col, prop) => {
      if (row === 1 || row === 4) {
        return {
          ...
        };
      }
    }}
  />
  ```
  
  </code-block>
  <code-block title="Single cells">
  
  ```jsx
  <HotTable
    cell={[
      { 
        ...
      },
    ]}
  />
  ```
  
  </code-block>
</code-group>

:::

## Configuration options

In a single code sample, list all of the feature's configuration options, with their default settings.

::: only-for javascript
```js
mainOption: {
  option1: defaultSetting,
  option2: defaultSetting,
  ...
}
```
:::

::: only-for react
```jsx
<HotTable
  mainOption={{
    option1: defaultSetting,
    option2: defaultSetting,
    ...
  }}
/>
```
:::