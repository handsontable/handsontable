---
title: Merge cells
metaTitle: Merge cells - JavaScript Data Grid | Handsontable
description: Merge adjacent cells, using the "Ctrl + M" shortcut or the right-click context menu. Control merged cells, using Handsontable's API.
permalink: /merge-cells
canonicalUrl: /merge-cells
react:
  metaTitle: Merge cells - React Data Grid | Handsontable
searchCategory: Guides
---

# Merge cells

[[toc]]

## Overview

The merging cells feature enables you to combine the contents of two or more cells to create a new larger cell that spans several columns. Particularly useful when you have data that's length is greater than the width of the column. For example, a license id that's length is so long that it needs more than one column width to view it in its entirety.

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
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
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
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={Handsontable.helper.createSpreadsheetData(100, 50)}
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

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
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
