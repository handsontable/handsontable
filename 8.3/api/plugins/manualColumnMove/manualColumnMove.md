---
title: ManualColumnMove
permalink: /8.3/api/manual-column-move
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin allows to change columns order. To make columns order persistent the [Options#persistentState](options#persistentstate)
plugin should be enabled.

API:
- `moveColumn` - move single column to the new position.
- `moveColumns` - move many columns (as an array of indexes) to the new position.
- `dragColumn` - drag single column to the new position.
- `dragColumns` - drag many columns (as an array of indexes) to the new position.

[Documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove) explain differences between drag and move actions. Please keep in mind that if you want apply visual changes,
you have to call manually the `render` method on the instance of Handsontable.

The plugin creates additional components to make moving possibly using user interface:
- backlight - highlight of selected columns.
- guideline - line which shows where columns has been moved.



## Members
### isEnabled
`manualColumnMove.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](hooks#beforeInit)
hook and if it returns `true` than the [ManualColumnMove#enablePlugin](manual-column-move#enableplugin) method is called.



### enablePlugin
`manualColumnMove.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`manualColumnMove.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](core#updatesettings) is invoked.



### disablePlugin
`manualColumnMove.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### moveColumn
`manualColumnMove.moveColumn(column, finalIndex) ⇒ boolean`

Moves a single column.

**Emits**: <code>Hooks#event:beforeColumnMove</code>, <code>Hooks#event:afterColumnMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index to be moved. |
| finalIndex | <code>number</code> | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove). |



### moveColumns
`manualColumnMove.moveColumns(columns, finalIndex) ⇒ boolean`

Moves a multiple columns.

**Emits**: <code>Hooks#event:beforeColumnMove</code>, <code>Hooks#event:afterColumnMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array</code> | Array of visual column indexes to be moved. |
| finalIndex | <code>number</code> | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove). |



### dragColumn
`manualColumnMove.dragColumn(column, dropIndex) ⇒ boolean`

Drag a single column to drop index position.

**Emits**: <code>Hooks#event:beforeColumnMove</code>, <code>Hooks#event:afterColumnMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index to be dragged. |
| dropIndex | <code>number</code> | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove). |



### dragColumns
`manualColumnMove.dragColumns(columns, dropIndex) ⇒ boolean`

Drag multiple columns to drop index position.

**Emits**: <code>Hooks#event:beforeColumnMove</code>, <code>Hooks#event:afterColumnMove</code>  

| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array</code> | Array of visual column indexes to be dragged. |
| dropIndex | <code>number</code> | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove). |



### isMovePossible
`manualColumnMove.isMovePossible(movedColumns, finalIndex) ⇒ boolean`

Indicates if it's possible to move columns to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | <code>Array</code> | Array of visual column indexes to be moved. |
| finalIndex | <code>number</code> | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](https://handsontable.com/docs/demo-moving.html#manualColumnMove). |



### destroy
`manualColumnMove.destroy()`

Destroys the plugin instance.



