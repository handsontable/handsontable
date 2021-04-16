---
title: ManualRowMove
permalink: /next/api/manual-row-move
canonicalUrl: /api/manual-row-move
editLink: false
---

# ManualRowMove

[[toc]]

## Description


This plugin allows to change rows order. To make rows order persistent the [Options#persistentState](./Options/#persistentState)
plugin should be enabled.

API:
- `moveRow` - move single row to the new position.
- `moveRows` - move many rows (as an array of indexes) to the new position.
- `dragRow` - drag single row to the new position.
- `dragRows` - drag many rows (as an array of indexes) to the new position.

[Documentation](https://handsontable.com/docs/demo-moving.html) explain differences between drag and move actions. Please keep in mind that if you want apply visual changes,
you have to call manually the `render` method on the instance of Handsontable.

The plugin creates additional components to make moving possibly using user interface:
- backlight - highlight of selected rows.
- guideline - line which shows where rows has been moved.


## Methods

### destroy

_manualRowMove.destroy()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L708

Destroys the plugin instance.



### disablePlugin

_manualRowMove.disablePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L145

Disables the plugin functionality for this Handsontable instance.



### dragRow

_manualRowMove.dragRow(row, dropIndex) ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L212

Drag a single row to drop index position.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### dragRows

_manualRowMove.dragRows(rows, dropIndex) ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L226

Drag multiple rows to drop index position.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### enablePlugin

_manualRowMove.enablePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L109

Enables the plugin functionality for this Handsontable instance.



### isEnabled

_manualRowMove.isEnabled() ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L102

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualRowMove+enablePlugin) method is called.



### isMovePossible

_manualRowMove.isMovePossible(movedRows, finalIndex) ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L243

Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### moveRow

_manualRowMove.moveRow(row, finalIndex) ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L165

Moves a single row.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### moveRows

_manualRowMove.moveRows(rows, finalIndex) ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L179

Moves a multiple rows.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### updatePlugin

_manualRowMove.updatePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/manualRowMove/manualRowMove.js#L133

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.


