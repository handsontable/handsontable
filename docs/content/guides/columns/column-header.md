---
title: Column headers
metaTitle: Column headers - JavaScript Data Grid | Handsontable
description: Use default column headers (A, B, C), or set them to custom values provided by an array or a function.
permalink: /column-header
canonicalUrl: /column-header
react:
  metaTitle: Column headers - React Data Grid | Handsontable
searchCategory: Guides
---

# Column headers

Use default column headers (A, B, C), or set them to custom values provided by an array or a function.

[[toc]]

## Overview

Column headers are gray-colored rows used to label each column or group of columns. By default, these headers are populated with letters in alphabetical order.

To reflect the type or category of data in a particular column, give it a custom name and then display it in a column header. For example, instead of letters as labels such as `A, B, C, ...` name them `ID, Full name, Country, ...`.

## Default headers

Setting the [colHeaders](@/api/options.md#colheaders) option to `true` enables the default column headers as shown in the example below:

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
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
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
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


## Header labels as an array
An array of labels can be used to set the [`colHeaders`](@/api/options.md#colheaders) as shown in the example below:

::: only-for javascript
::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
  ],
  colHeaders: ['ID', 'Full name', 'Position','Country', 'City', 'Address', 'Zip code', 'Mobile', 'E-mail'],
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
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

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
      ]}
      colHeaders={['ID', 'Full name', 'Position', 'Country', 'City', 'Address', 'Zip code', 'Mobile', 'E-mail']}
      rowHeaders={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```
:::
:::


## Header labels as a function
The [`colHeaders`](@/api/options.md#colheaders) can also be populated using a function as shown in the example below:

::: only-for javascript
::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3'],
  ],
  colHeaders(index) {
    return 'Col ' + (index + 1);
  },
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
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

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3'],
      ]}
      colHeaders={(index) => {
        return 'Col ' + (index + 1);
      }}
      rowHeaders={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */
```
:::
:::


## Nested headers

More complex data structures can be displayed with multiple headers, each representing a different category of data. To learn more about nested headers, see the [column groups](@/guides/columns/column-groups.md) page.

## Related articles

### Related guides

- [Column groups](@/guides/columns/column-groups.md)

### Related API reference

- Configuration options:
  - [`activeHeaderClassName`](@/api/options.md#activeheaderclassname)
  - [`colHeaders`](@/api/options.md#colheaders)
  - [`columnHeaderHeight`](@/api/options.md#columnheaderheight)
  - [`currentHeaderClassName`](@/api/options.md#currentheaderclassname)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)
  - [`title`](@/api/options.md#title)
- Core methods:
  - [`getColHeader()`](@/api/core.md#getcolheader)
  - [`hasColHeaders()`](@/api/core.md#hascolheaders)
- Hooks:
  - [`afterGetColHeader`](@/api/hooks.md#aftergetcolheader)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`beforeHighlightingColumnHeader`](@/api/hooks.md#beforehighlightingcolumnheader)
  - [`modifyColHeader`](@/api/hooks.md#modifycolheader)
  - [`modifyColumnHeaderHeight`](@/api/hooks.md#modifycolumnheaderheight)
- Plugins:
  - [`NestedHeaders`](@/api/nestedHeaders.md)
