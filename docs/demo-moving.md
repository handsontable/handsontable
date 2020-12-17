---
id: demo-moving
title: Moving
sidebar_label: Moving
slug: /demo-moving
---

This page shows how to move rows and columns in Handsontable.

*   [Enabling plugins](#enablingPlugins)
*   [Drag and move actions of `manualRowMove` plugin](#manualRowMove)

### Enabling plugins

To enable move features, use settings `manualColumnMove: true` and `manualRowMove: true`

A draggable move handle appears above the selected column/row header. You can click and drag it to any location in the column header body.

Edit Dump data to console

var example1 = document.getElementById('example1'); var hot = new Handsontable(example1, { data: Handsontable.helper.createSpreadsheetData(200, 20), rowHeaders: true, colHeaders: true, colWidths: 100, manualColumnMove: true, manualRowMove: true });

### Drag and move actions of `manualRowMove` plugin

There are significant differences between the plugin's `dragRows` and `moveRows` API functions. Both of them change the order of rows, but what is important, they rely on other kind of indexes. The differences between them are shown in the diagrams below. Please keep in mind that both of these methods trigger the `[afterRowMove](/docs/8.2.0/Hooks.html#event:afterRowMove)` and `[beforeRowMove](/docs/8.2.0/Hooks.html#event:beforeRowMove)` hooks, but only `dragRows` passes the `dropIndex` argument to them.

1\. The `[dragRows](/docs/8.2.0/ManualRowMove.html#dragRows)` method with the `dropIndex` parameter. This argument points to where we are going to drop the moved elements.

![dragRows method](images/drag_action.svg)

2\. The `[moveRows](/docs/8.2.0/ManualRowMove.html#moveRows)` method with the `finalIndex` parameter. The argument points to where the elements will be placed after the _moving_ action (`finalIndex` being the index of the first moved element).

![moveRows method](images/move_action.svg)

Some of actions to be performed by `moveRows` function aren't possible, i.e. we can't move more than one element to the last position. In this case, the move will be cancelled. The Plugin's `[isMovePossible](/docs/8.2.0/ManualRowMove.html#isMovePossible)` API method and the `movePossible` parameter of `beforeRowMove` and `afterRowMove` hooks may be helpful in determining such situations.

[Help us improve this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/moving.html)
