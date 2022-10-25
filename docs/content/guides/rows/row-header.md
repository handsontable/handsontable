---
title: Row headers
metaTitle: Row headers - JavaScript Data Grid | Handsontable
description: Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.
permalink: /row-header
canonicalUrl: /row-header
tags:
  - custom headers
  - bind rows with headers
  - row id
react:
  metaTitle: Row headers - React Data Grid | Handsontable
searchCategory: Guides
---

# Row headers

Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.

[[toc]]

## Overview

Row headers are gray-colored columns that are used to label each row. By default, these headers are filled with numbers displayed in ascending order.

To turn the headers on, set the option [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

## Bind rows with headers

There is a plugin **Bind rows with headers** which allows the binding of row numbers to their headers. This is used mostly to differentiate two business cases in which Handsontable is most often used.

1. When moving a row in a typical grid-like application, the numbers in the row headers remain intact. Only the content is moved.

2. In a data grid, each row has its unique ID. Therefore, the column header should follow its row whenever it changes its position in the grid.

### Basic example

To enable the plugin, set the [`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders) property to `true`. Move the rows in the example below to see what this plugin does.

::: only-for javascript
::: example #example1
```js
// Generate an array of arrays with a dummy data
const generateData = (rows = 3, columns = 7, additionalRows = true) => {
  let counter = 0;

  const array2d = [...new Array(rows)]
    .map(_ => [...new Array(columns)]
    .map(_ => counter++));

  if (additionalRows) {
    array2d.push([]);
    array2d.push([]);
  }

  return array2d;
};

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: generateData(),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  contextMenu: true,
  manualRowMove: true,
  bindRowsWithHeaders: 'strict',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::

::: only-for react
::: example #example1 :react
```jsx
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  //  Generate an array of arrays with a dummy data
  const generateData = (rows = 3, columns = 7, additionalRows = true) => {
    let counter = 0;

    const array2d = [...new Array(rows)]
            .map(_ => [...new Array(columns)]
                    .map(_ => counter++));

    if (additionalRows) {
      array2d.push([]);
      array2d.push([]);
    }

    return array2d;
  };

  return (
    <HotTable
      data={generateData()}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      contextMenu={true}
      manualRowMove={true}
      bindRowsWithHeaders="strict"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Tree grid

A tree grid enables you to represent the nested data structures within the data grid. To learn more about this feature, see the [Row parent-child](@/guides/rows/row-parent-child.md) page.

## Related articles

### Related guides

- [Row parent-child](@/guides/rows/row-parent-child.md)

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders)
  - [`rowHeaders`](@/api/options.md#rowheaders)
- Core methods:
  - [`getRowHeader()`](@/api/core.md#getrowheader)
  - [`hasRowHeaders()`](@/api/core.md#hasrowheaders)
- Hooks:
  - [`afterGetRowHeader`](@/api/hooks.md#aftergetrowheader)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`beforeHighlightingRowHeader`](@/api/hooks.md#beforehighlightingrowheader)
  - [`modifyRowHeader`](@/api/hooks.md#modifyrowheader)
  - [`modifyRowHeaderWidth`](@/api/hooks.md#modifyrowheaderwidth)
- Plugins:
  - [`BindRowsWithHeaders`](@/api/bindRowsWithHeaders.md)
