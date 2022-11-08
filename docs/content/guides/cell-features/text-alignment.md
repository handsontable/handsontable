---
title: Text alignment
metaTitle: Text alignment - JavaScript Data Grid | Handsontable
description: "Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell)."
permalink: /text-alignment
canonicalUrl: /text-alignment
react:
  metaTitle: Text alignment - React Data Grid | Handsontable
searchCategory: Guides
---

# Text alignment

Align values within cells: horizontally (to the right, left, center, or by justifying them), and vertically (to the top, middle, or bottom of the cell).

[[toc]]

## Horizontal and vertical alignment

To initialize Handsontable with predefined horizontal and vertical alignment globally, provide the alignment details in the [`className`](@/api/options.md#classname) option, for example:

::: only-for javascript
```js
className: 'htCenter'
```
:::

::: only-for react
```jsx
className="htCenter"
```
:::

Cells can be also configured individually by setting up the [`cells`](@/api/options.md#cells) option. See the code sample below for an example.

Available class names:

* Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`,
* Vertical: `htTop`, `htMiddle`, `htBottom`.

Alignment changes can be tracked using the [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta) hook.

## Basic example

The following code sample configures the grid to use `htCenter` and configures individual cells to use different alignments.

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

// generate an array of arrays with dummy data
const data = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(18) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data,
  colWidths: 100,
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 }
  ],
  className: 'htCenter',
  cell: [
    { row: 0, col: 0, className: 'htRight' },
    { row: 1, col: 1, className: 'htLeft htMiddle' },
    { row: 3, col: 4, className: 'htLeft htBottom' }
  ],
  afterSetCellMeta(row, col, key, val) {
    console.log('cell meta changed', row, col, key, val);
  }
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
  .map((_, row) => new Array(18) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

export const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colWidths={100}
      height={320}
      rowHeaders={true}
      colHeaders={true}
      contextMenu={true}
      licenseKey="non-commercial-and-evaluation"
      mergeCells={[
        { row: 1, col: 1, rowspan: 3, colspan: 3 },
        { row: 3, col: 4, rowspan: 2, colspan: 2 }
      ]}
      className="htCenter"
      cell={[
        { row: 0, col: 0, className: 'htRight' },
        { row: 1, col: 1, className: 'htLeft htMiddle' },
        { row: 3, col: 4, className: 'htLeft htBottom' }
      ]}
      afterSetCellMeta={function(row, col, key, val) {
        console.log('cell meta changed', row, col, key, val);
      }}
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
  - [`className`](@/api/options.md#classname)
- Hooks:
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeCellAlignment`](@/api/hooks.md#beforecellalignment)
