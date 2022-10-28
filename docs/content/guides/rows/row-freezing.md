---
title: Row freezing
metaTitle: Row freezing - JavaScript Data Grid | Handsontable
description: Lock (freeze) the position of specified rows, keeping them visible while scrolling to another area of the grid. This feature is sometimes called "pinned rows".
permalink: /row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
  - fixedRows
react:
  metaTitle: Row freezing - React Data Grid | Handsontable
searchCategory: Guides
---

# Row freezing

Lock the position of specified rows, keeping them visible when scrolling.

[[toc]]

## Overview

Row freezing locks specific rows of a grid in place, keeping them visible while scrolling to another area of the grid.

This feature is sometimes called "pinned rows".

## Example

The following example specifies two fixed rows with `fixedRowsTop: 2`. Horizontal scroll bars are needed, so set a container `width` and `overflow: hidden` in CSS.

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data,
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedRowsTop: 2,
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

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

export const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colWidths={100}
      width="100%"
      height={320}
      rowHeaders={true}
      colHeaders={true}
      fixedRowsTop={2}
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


## Related API reference

- Configuration options:
  - [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)
  - [`fixedRowsTop`](@/api/options.md#fixedrowstop)
