---
title: ManualRowMove
permalink: /8.2/api/manual-row-move
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin allows to change rows order. To make rows order persistent the [Options#persistentState](Options#persistentState)
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



## Members
### isEnabled
`manualRowMove.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualRowMove+enablePlugin) method is called.



### enablePlugin
`manualRowMove.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`manualRowMove.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`manualRowMove.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### moveRow
`manualRowMove.moveRow(row, finalIndex) ⇒ boolean`

Moves a single row.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index to be moved. |
| finalIndex | <code>number</code> | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### moveRows
`manualRowMove.moveRows(rows, finalIndex) ⇒ boolean`

Moves a multiple rows.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array</code> | Array of visual row indexes to be moved. |
| finalIndex | <code>number</code> | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### dragRow
`manualRowMove.dragRow(row, dropIndex) ⇒ boolean`

Drag a single row to drop index position.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index to be dragged. |
| dropIndex | <code>number</code> | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### dragRows
`manualRowMove.dragRows(rows, dropIndex) ⇒ boolean`

Drag multiple rows to drop index position.

**Emits**: <code>Hooks#event:beforeRowMove</code>, <code>Hooks#event:afterRowMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| rows | <code>Array</code> | Array of visual row indexes to be dragged. |
| dropIndex | <code>number</code> | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### isMovePossible
`manualRowMove.isMovePossible(movedRows, finalIndex) ⇒ boolean`

Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | <code>Array</code> | Array of visual row indexes to be moved. |
| finalIndex | <code>number</code> | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html). |



### destroy
`manualRowMove.destroy()`

Destroys the plugin instance.



