---
title: Row freezing
metaTitle: Row freezing - Guide - Handsontable Documentation
permalink: /row-freezing
canonicalUrl: /row-freezing
tags:
  - fixing rows
  - pinning rows
---

# Row freezing

[[toc]]

## Overview
Row freezing locks specific rows of a grid in place, keeping them visible while scrolling to another area of the grid.

## Example

The following example specifies two fixed rows with `fixedRowsTop: 2`. Horizontal scroll bars are needed, so set a container `width` and `overflow: hidden` in CSS.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(100, 50),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  fixedRowsTop: 2,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::
::: only-for react
::: example #example1 :react
```jsx
import React, { Fragment, useEffect } from 'react';
import Handsontable from 'handsontable';
import ReactDOM from 'react-dom';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {

  const hotSettings = {
    data: Handsontable.helper.createSpreadsheetData(100, 50),
    colWidths: 100,
    width: '100%',
    height: 320,
    rowHeaders: true,
    colHeaders: true,
    fixedRowsTop: 2,
    licenseKey: 'non-commercial-and-evaluation'
  };

  return (
          <Fragment>
            <HotTable settings={hotSettings}>
            </HotTable>
          </Fragment>
  );
};

ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
```
:::
:::


## Related API reference

- Configuration options:
  - [`fixedRowsBottom`](@/api/options.md#fixedrowsbottom)
  - [`fixedRowsTop`](@/api/options.md#fixedrowstop)
