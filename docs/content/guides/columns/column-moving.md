---
title: Column moving
metaTitle: Column moving - Guide - Handsontable Documentation
permalink: /column-moving
canonicalUrl: /column-moving
---

# Column moving

[[toc]]

## Overview
This page shows you how to move columns in Handsontable.

## Enabling plugin

To enable column moving, set the [`manualColumnMove`](@/api/options.md#manualcolumnmove) configuration option to `true`.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the grid.

::: only-for javascript
::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(200, 20),
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  manualColumnMove: true,
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
    data: Handsontable.helper.createSpreadsheetData(200, 20),
    width: '100%',
    height: 320,
    rowHeaders: true,
    colHeaders: true,
    colWidths: 100,
    manualColumnMove: true,
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


## Drag and move actions of the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin

There are significant differences between the plugin's [dragColumns](@/api/manualColumnMove.md#dragcolumns) and [moveColumns](@/api/manualColumnMove.md#movecolumns) API functions. Both of them change the order of columns, **but** they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

::: tip
Both of these methods trigger the [beforeColumnMove](@/api/hooks.md#beforecolumnmove) and [afterColumnMove](@/api/hooks.md#aftercolumnmove) hooks, but only [`dragColumns`](@/api/manualColumnMove.md#dragcolumns) passes the [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) argument to them.
:::

The [dragColumns](@/api/manualColumnMove.md#dragcolumns) method has a [`dropIndex`](@/api/manualColumnMove.md#dragcolumns) parameter, which points to where the elements are being dropped.

![dragColumns method]({{$basePath}}/img/drag_action.svg)


The [moveColumns](@/api/manualColumnMove.md#movecolumns) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

![moveColumns method]({{$basePath}}/img/move_action.svg)

The [`moveColumns`](@/api/manualColumnMove.md#movecolumns) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [isMovePossible](@/api/manualColumnMove.md#ismovepossible) API method and the `movePossible` parameters [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove) and [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) hooks help in determine such situations.

## Related API reference

- Configuration options:
  - [`manualColumnMove`](@/api/options.md#manualcolumnmove)
- Core methods:
  - [`colToProp()`](@/api/core.md#coltoprop)
  - [`isColumnModificationAllowed()`](@/api/core.md#iscolumnmodificationallowed)
  - [`propToCol()`](@/api/core.md#proptocol)
  - [`toPhysicalColumn()`](@/api/core.md#tophysicalcolumn)
  - [`toVisualColumn()`](@/api/core.md#tovisualcolumn)
- Hooks:
  - [`afterColumnMove`](@/api/hooks.md#aftercolumnmove)
  - [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove)
- Plugins:
  - [`ManualColumnMove`](@/api/manualColumnMove.md)
