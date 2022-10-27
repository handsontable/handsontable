---
title: Row heights
metaTitle: Row heights - JavaScript Data Grid | Handsontable
description: Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable's interface.
permalink: /row-height
canonicalUrl: /row-height
tags:
  - resizing rows
  - wrap content
  - overflow
  - crop content
  - row size
  - height
  - max-height
  - min-height
  - row dimmensions
  - manual resize
react:
  metaTitle: Row heights - React Data Grid | Handsontable
searchCategory: Guides
---

# Row heights

Configure row heights, using a number, an array or a function. Let your users manually change row heights using Handsontable's interface.

[[toc]]

## Overview

By default, the height of a row adjusts to the height of the content. The minimum height is `23px`. The row height can be passed as a `constant`, an `array`, or a `function`.

The content inside a cell gets wrapped if it doesn't fit the cell's size.

## Set the row height as a constant

We set the same height of `40px` for all rows across the entire grid in this example.

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
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
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      rowHeights={40}
      manualRowResize={true}
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


## Set the row height in an array

In this example, the height is only set for the first rows. Each additional row would be automatically adjusted to the content.

::: only-for javascript
::: example #example2
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example2');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: [40, 40, 40, 40],
  manualRowResize: true,
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
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
      ]}
      width="100%"
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      rowHeights={[40, 40, 40, 40]}
      manualRowResize={true}
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


## Set the row height using a function

The row height can be set using a function. In this example, the size of all rows is set using a function that takes a row `index` (1, 2 ...) and multiplies it by `20px` for each consecutive row.

::: only-for javascript
::: example #example3
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example3');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights(index) {
    return (index + 1) * 20;
  },
  manualRowResize: true,
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
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
      ]}
      width="100%"
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      rowHeights={function(index) {
        return (index + 1) * 20;
      }}
      manualRowResize={true}
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


## Adjust the row height manually

Set the option [`manualRowResize`](@/api/options.md#manualrowresize) to `true` to allow users to manually resize the row height by dragging the handle between the adjacent row headers. Don't forget to enable row headers by setting [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

You can adjust the size of one or multiple rows simultaneously, even if the selected rows are not placed next to each other.

::: only-for javascript
::: example #example4
```js
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example4');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  rowHeights: 40,
  manualRowResize: true,
  licenseKey: 'non-commercial-and-evaluation'
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

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      rowHeights={40}
      manualRowResize={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example4'));
/* end:skip-in-preview */
```
:::
:::


## Related API reference

- Configuration options:
  - [`autoRowSize`](@/api/options.md#autorowsize)
  - [`rowHeights`](@/api/options.md#rowheights)
- Core methods:
  - [`getRowHeight()`](@/api/core.md#getrowheight)
- Hooks:
  - [`afterRowResize`](@/api/hooks.md#afterrowresize)
  - [`beforeRowResize`](@/api/hooks.md#beforerowresize)
  - [`modifyRowHeight`](@/api/hooks.md#modifyrowheight)
- Plugins:
  - [`AutoRowSize`](@/api/autoRowSize.md)
  - [`ManualRowResize`](@/api/manualRowResize.md)
