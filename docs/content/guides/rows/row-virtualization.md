---
title: Row virtualization
metaTitle: Row virtualization - JavaScript Data Grid | Handsontable
description: Render thousands of rows without freezing the browser, using row virtualization.
permalink: /row-virtualization
canonicalUrl: /row-virtualization
tags:
  - dom
  - render all rows
  - offset
react:
  metaTitle: Row virtualization - React Data Grid | Handsontable
---

# Row virtualization

[[toc]]

## Overview

Virtualization allows Handsontable to process hundreds of thousands of records without causing the browser to hang. This technique draws only the visible part of the grid, displaying the minimum items physically rendered in the DOM. The elements outside the viewport are rendered when you scroll across the grid. Depending on your configuration, there might be a small offset of columns or rows rendered outside the viewport to make the scrolling performance smoother.

This feature is enabled by default and can be turned off by setting the [`renderAllRows`](@/api/options.md#renderallrows) option to `true`.

## Configuring row virtualization

You can experiment with the [`viewportRowsRenderingOffset`](@/api/options.md#viewportrowsrenderingoffset) configuration option, which determines the number of rows displayed outside the visible viewport. If the number passed to that option is greater than the total columns in your data set, then the virtualization will be practically turned off.

To make the grid scrollable, set the constant width and height to the same as the container holding Handsontable and set the `overflow` property to `hidden` in the container's stylesheet. If the table contains enough rows or columns, it will be scrollable.

The scrolling performance depends mainly on four factors:

* Number of cells - number of rows multiplied by the number of columns
* Amount and complexity of custom renderers in cells
* Number of options enabled in the configuration
* Performance of your setup - physical machine and a browser

The example below presents a data grid displaying 1 million cells (1000 rows x 1000 columns):

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(1000, 1000),
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
      data={Handsontable.helper.createSpreadsheetData(1000, 1000)}
      colWidths={100}
      width="100%"
      height={320}
      rowHeaders={true}
      colHeaders={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Related articles

### Related guides

- [Column virtualization](@/guides/rows/row-virtualization.md)
- [Performance](@/guides/optimization/performance.md)

### Related API reference

- Configuration options:
  - [`renderAllRows`](@/api/options.md#renderallrows)
  - [`viewportRowsRenderingOffset`](@/api/options.md#viewportrowsrenderingoffset)
