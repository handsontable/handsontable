---
id: k5920uow
title: Merge cells
metaTitle: Merge cells - JavaScript Data Grid | Handsontable
description: Merge adjacent cells, using the "Ctrl + M" shortcut or the context menu. Control merged cells, using Handsontable's API.
permalink: /merge-cells
canonicalUrl: /merge-cells
react:
  id: ulndkavi
  metaTitle: Merge cells - React Data Grid | Handsontable
searchCategory: Guides
---

# Merge cells

Merge adjacent cells, using the <kbd>**Ctrl**</kbd> + <kbd>**M**</kbd> shortcut or the context menu. Control merged cells, using Handsontable's API.

[[toc]]

## Overview

By merging, you can combine two or more adjacent cells into a single cell that spans several rows or columns.

Handsontable merges cells in the same way as Microsoft Excel: keeps only the upper-left value of the selected range and clears other values.

Cell merging happens on Handsontable's visual layer and doesn't affect your source data structure.

## How to merge cells

To enable the merge cells feature, set the [`mergeCells`](@/api/options.md#mergecells) option to  `true` or to an array.

To initialize Handsontable with predefined merged cells, provide merged cells details in form of an array:

::: only-for javascript

`mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }]`

:::

::: only-for react

`mergeCells={[{ row: 1, col: 1, rowspan: 2, colspan: 2 }]}`

:::

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
  height: 320,
  colWidths: 47,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
    { row: 5, col: 6, rowspan: 3, colspan: 3 }
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
      height={320}
      colWidths={47}
      rowHeaders={true}
      colHeaders={true}
      contextMenu={true}
      mergeCells={[
        { row: 1, col: 1, rowspan: 3, colspan: 3 },
        { row: 3, col: 4, rowspan: 2, colspan: 2 },
        { row: 5, col: 6, rowspan: 3, colspan: 3 }
      ]}
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

## Related keyboard shortcuts

| Windows                                | macOS                                  | Action                              |  Excel  | Sheets  |
| -------------------------------------- | -------------------------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**M**</kbd> | <kbd>**Ctrl**</kbd> + <kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

## Related API reference

- Configuration options:
  - [`mergeCells`](@/api/options.md#mergecells)
- Hooks:
  - [`afterMergeCells`](@/api/hooks.md#aftermergecells)
  - [`afterUnmergeCells`](@/api/hooks.md#afterunmergecells)
  - [`beforeMergeCells`](@/api/hooks.md#beforemergecells)
  - [`beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells)
- Plugins:
  - [`MergeCells`](@/api/mergeCells.md)
