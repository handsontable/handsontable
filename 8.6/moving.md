---
title: Moving
permalink: /8.6/moving
canonicalUrl: /moving
---

# {{ $frontmatter.title }}

[[toc]]

This page shows how to move rows and columns in Handsontable.

## Enabling plugins

To enable move features, use settings `manualColumnMove: true` and `manualRowMove: true`

A draggable move handle appears above the selected column/row header. You can click and drag it to any location in the column header body.

::: example #example1
```js
var example1 = document.getElementById('example1');
var hot1 = new Handsontable(example1, {
  data: Handsontable.helper.createSpreadsheetData(200, 20),
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  manualColumnMove: true,
  manualRowMove: true
});
```
:::

## Drag and move actions of `manualRowMove` plugin

There are significant differences between the plugin's `dragRows` and `moveRows` API functions. Both of them change the order of rows, but what is important, they rely on other kind of indexes. The differences between them are shown in the diagrams below. Please keep in mind that both of these methods trigger the [`afterRowMove`](api/pluginHooks.md#afterrowmove) and [`beforeRowMove`](api/pluginHooks.md#beforerowmove) hooks, but only `dragRows` passes the `dropIndex` argument to them.

1\. The [`dragRows`](api/plugins/manualRowMove/manualRowMove.md#dragrows) method with the `dropIndex` parameter. This argument points to where we are going to drop the moved elements.

![dragRows method](/img/drag_action.svg)

2\. The [`moveRows`](api/plugins/manualRowMove/manualRowMove.md#moverows) method with the `finalIndex` parameter. The argument points to where the elements will be placed after the _moving_ action (`finalIndex` being the index of the first moved element).

![moveRows method](/img/move_action.svg)

Some of actions to be performed by `moveRows` function aren't possible, i.e. we can't move more than one element to the last position. In this case, the move will be cancelled. The Plugin's [`isMovePossible`](api/plugins/manualRowMove/manualRowMove.md#ismovepossible) API method and the `movePossible` parameter of `beforeRowMove` and `afterRowMove` hooks may be helpful in determining such situations.
