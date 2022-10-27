---
title: Column groups
metaTitle: Column groups - JavaScript Data Grid | Handsontable
description: Group your columns, using multiple levels of nested column headers, to better reflect the structure of your data.
permalink: /column-groups
canonicalUrl: /column-groups
tags:
  - nested headers
  - nestedHeaders
  - collapsing columns
react:
  metaTitle: Column groups - React Data Grid | Handsontable
searchCategory: Guides
---

# Column groups

Group your columns, using multiple levels of nested column headers, to better reflect the structure of your data.

[[toc]]

## Nested column headers

The [`NestedHeaders`](@/api/nestedHeaders.md) plugin allows creating a nested header structure using the `colspan` attribute. The header cannot be wider than its parent element, i.e., headers cannot overlap each other.

To make a header that spans across multiple columns, its corresponding configuration array element should be provided as an object with `label` and `colspan` properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

The maximum value for `colspan` for nested headers is 1000, meaning that the maximum number of columns that a header can span is 1000.  This constraint is based on [_HTML table specification_](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan), which sets the limit of `colspan` to 1000.

### Configuration

::: only-for javascript
```js
nestedHeaders: [
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
]
```
:::

::: only-for react
```jsx
nestedHeaders={[
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
]}
```
:::

### Example

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
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
    ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
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
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
    ]}
    colHeaders={true}
    rowHeaders={true}
    height="auto"
    nestedHeaders={[
      ['A', { label: 'B', colspan: 8 }, 'C'],
      ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
      ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
      ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
    ]}
    licenseKey="non-commercial-and-evaluation"
      >
  </HotTable>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */
```
:::
:::


## Collapsible headers

The [CollapsibleColumns](@/api/collapsibleColumns.md) plugin enables columns and their headers to be collapsed/expanded.

This plugin adds multi-column headers which have buttons. Clicking these buttons will collapse or expand all "child" headers, leaving the first one visible.

The [`NestedHeaders`](@/api/nestedHeaders.md) plugin needs to be enabled for this to work properly.

### Configuration

To enable the Collapsible Columns plugin, either set the [`collapsibleColumns`](@/api/options.md#collapsiblecolumns) configuration option to:

* `true` - this will enable the functionality for _all_ multi-column headers, every column with the `colspan` attribute defined will be extended with the "expand/collapse" button
* An array of objects containing information specifying which headers should have the "expand/collapse" buttons for example:

::: only-for javascript
```js
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true } // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
]
```
:::

::: only-for react
```jsx
collapsibleColumns={[
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true } // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
]}
```
:::

### Example

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
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ],
  colHeaders: true,
  rowHeaders: true,
  colWidths: 60,
  height: 'auto',
  nestedHeaders: [
    ['A', { label: 'B', colspan: 8 }, 'C'],
    ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
    ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
  ],
  collapsibleColumns: [
    { row: -4, col: 1, collapsible: true },
    { row: -3, col: 1, collapsible: true },
    { row: -2, col: 1, collapsible: true },
    { row: -2, col: 3, collapsible: true }
  ],
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
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      colWidths={60}
      height="auto"
      nestedHeaders={[
        ['A', { label: 'B', colspan: 8 }, 'C'],
        ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
        ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
        ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
      ]}
      collapsibleColumns={[
        { row: -4, col: 1, collapsible: true },
        { row: -3, col: 1, collapsible: true },
        { row: -2, col: 1, collapsible: true },
        { row: -2, col: 3, collapsible: true }
      ]}
      licenseKey="non-commercial-and-evaluation"
    >
    </HotTable>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */
```
:::
:::


## Related API reference

- Configuration options:
  - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)
- Core methods:
  - [`isColumnModificationAllowed()`](@/api/core.md#iscolumnmodificationallowed)
- Hooks:
  - [`afterColumnCollapse`](@/api/hooks.md#aftercolumncollapse)
  - [`afterColumnExpand`](@/api/hooks.md#aftercolumnexpand)
  - [`beforeColumnCollapse`](@/api/hooks.md#beforecolumncollapse)
  - [`beforeColumnExpand`](@/api/hooks.md#beforecolumnexpand)
- Plugins:
  - [`CollapsibleColumns`](@/api/collapsibleColumns.md)
  - [`NestedHeaders`](@/api/nestedHeaders.md)
