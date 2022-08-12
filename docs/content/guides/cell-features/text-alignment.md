---
title: Text alignment
metaTitle: Text alignment - Guide - Handsontable Documentation
permalink: /text-alignment
canonicalUrl: /text-alignment
---

# Text alignment

[[toc]]

## Overview

Text alignment functionality enables you to predefine the horizontal and vertical alignment of how the text is displayed in the cells.

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
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 18),
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
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={Handsontable.helper.createSpreadsheetData(100, 18)}
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

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Related API reference

- Configuration options:
  - [`className`](@/api/options.md#classname)
- Hooks:
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeCellAlignment`](@/api/hooks.md#beforecellalignment)
