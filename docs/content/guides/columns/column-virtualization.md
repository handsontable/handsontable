---
title: Column virtualization
metaTitle: Column virtualization - JavaScript Data Grid | Handsontable
description: Render hundreds of columns without freezing the browser, using column virtualization.
permalink: /column-virtualization
canonicalUrl: /column-virtualization
tags:
  - dom
  - render all columns
  - offset
react:
  metaTitle: Column virtualization - React Data Grid | Handsontable
searchCategory: Guides
---

# Column virtualization

Render hundreds of columns without freezing the browser, using column virtualization.

[[toc]]

## Overview

To process a large number of columns in a browser Handsontable utilizes the virtualization process to display only the visible part of the grid with a small offset for a better scrolling experience. This feature is turned on by default and can be turned off only for rows, not columns.

## Configure the column virtualization

You can experiment with the [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset) config option, which determines the number of columns being displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, the virtualization will be practically turned off.

To make the grid scrollable, set the constant width and height to same as the container holding Handsontable and height and set the `overflow` property to `hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

* Number of cells - number of rows multiplied by the number of columns
* Amount and complexity of custom renderers in cells
* Number of options enabled in the configuration
* Performance of your setup - physical machine and browser

The demo below presents a data grid displaying one million cells (1000 rows x 1000 columns).

::: only-for javascript
::: example #example1
```js
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

// generate an array of arrays with dummy data
const data = new Array(1000) // number of rows
  .fill()
  .map((_, row) => new Array(1000) // number of columns
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
const data = new Array(1000) // number of rows
  .fill()
  .map((_, row) => new Array(1000) // number of columns
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


## Related articles

### Related guides

- [Row virtualization](@/guides/rows/row-virtualization.md)
- [Performance](@/guides/optimization/performance.md)

### Related API reference
- Configuration options:
  - [`viewportColumnRenderingOffset`](@/api/options.md#viewportcolumnrenderingoffset)
