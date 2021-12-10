---
title: Column moving
metaTitle: Column moving - Guide - Handsontable Documentation
permalink: /next/column-moving
canonicalUrl: /column-moving
---

# Column moving

[[toc]]

## Overview
This page shows you how to move columns in Handsontable.

## Enabling plugin

Use the setting `manualColumnMove: true` to enable this feature.

A draggable move handle appears above the selected column header. You can click and drag it to any location in the grid.

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

## Drag and move actions of `manualColumnMove` plugin

There are significant differences between the plugin's [dragColumns](@/api/manualColumnMove.md#dragcolumns) and [moveColumns](@/api/manualColumnMove.md#movecolumns) API functions. Both of them change the order of columns, **but** they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

::: tip
Both of these methods trigger the [beforeColumnMove](@/api/hooks.md#beforecolumnmove) and [afterColumnMove](@/api/hooks.md#aftercolumnmove) hooks, but only `dragColumns` passes the `dropIndex` argument to them.
:::

The [dragColumns](@/api/manualColumnMove.md#dragcolumns) method has a `dropIndex` parameter, which points to where the elements are being dropped.

![dragColumns method](/docs/next/img/drag_action.svg)


The [moveColumns](@/api/manualColumnMove.md#movecolumns) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

![moveColumns method](/docs/next/img/move_action.svg)

The `moveColumns` function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [isMovePossible](@/api/manualColumnMove.md#ismovepossible) API method and the `movePossible` parameters `beforeColumnMove` and `afterColumnMove` hooks help in determine such situations.
