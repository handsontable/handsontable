---
title: Row moving
metaTitle: Row moving - Guide - Handsontable Documentation
permalink: /next/row-moving
canonicalUrl: /row-moving
---

# Row moving

[[toc]]

This page shows how to move rows and columns in Handsontable.

## Enabling plugins

To enable move features, set `manualRowMove: true`.

A draggable move handle appears above the selected column/row header. You can click and drag it to any location in the column header body.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot1 = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(200, 20),
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  manualRowMove: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::

## Drag and move actions of `manualRowMove` plugin

There are significant differences between the plugin's `dragRows` and `moveRows` API functions. Both of them change the order of rows, **but** they rely on different kinds of indexes. The differences between them are shown in the diagrams below. 

::: tip
Both of these methods trigger the [`beforeRowMove`](api/pluginHooks.md#beforerowmove) and [`afterRowMove`](api/pluginHooks.md#afterrowmove) hooks, but only `dragRows` passes the `dropIndex` argument to them.
:::

The [`dragRows`](api/plugins/manualRowMove/manualRowMove.md#dragrows) method has a `dropIndex` parameter, which points to where the elements are being dropped.

![dragRows method](/docs/img/drag_action.svg)


The [`moveRows`](api/plugins/manualRowMove/manualRowMove.md#moverows) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

![moveRows method](/docs/img/move_action.svg)

The `moveRows` function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](api/plugins/manualRowMove/manualRowMove.md#ismovepossible) API method and the `movePossible` parameters `beforeRowMove` and `afterRowMove` hooks help in determine such situations.
