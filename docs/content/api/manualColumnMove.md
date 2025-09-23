---
title: ManualColumnMove
metaTitle: ManualColumnMove - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-move
canonicalUrl: /api/manual-column-move
searchCategory: API Reference
hotPlugin: true
editLink: false
id: bck95e73
description: Use the ManualColumnMove plugin with its API options and methods (e.g., moveColumn(), moveColumns(), dragColumn()), to change the order of columns.
react:
  id: 41x190ra
  metaTitle: ManualColumnMove - React Data Grid | Handsontable
angular:
  id: w7p2y0kl
  metaTitle: ManualColumnMove - Angular Data Grid | Handsontable
---

# Plugin: ManualColumnMove

[[toc]]

## Description

This plugin allows to change columns order. To make columns order persistent the [Options#persistentState](@/api/options.md#persistentstate)
plugin should be enabled.

API:
- `moveColumn` - move single column to the new position.
- `moveColumns` - move many columns (as an array of indexes) to the new position.
- `dragColumn` - drag single column to the new position.
- `dragColumns` - drag many columns (as an array of indexes) to the new position.

[Documentation](@/guides/columns/column-moving/column-moving.md) explain differences between drag and move actions.
Please keep in mind that if you want apply visual changes,
you have to call manually the `render` method on the instance of Handsontable.

The plugin creates additional components to make moving possibly using user interface:
- backlight - highlight of selected columns.
- guideline - line which shows where columns has been moved.


## Options

### manualColumnMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L3134

:::

_manualColumnMove.manualColumnMove : boolean | Array&lt;number&gt;_

The `manualColumnMove` option configures the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin.

You can set the `manualColumnMove` option to one of the following:

| Setting  | Description                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `true`   | Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                  |
| `false`  | Disable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin                                                 |
| An array | - Enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin<br>- Move individual columns at initialization |

Read more:
- [Column moving](@/guides/columns/column-moving/column-moving.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualColumnMove` plugin
manualColumnMove: true,

// enable the `ManualColumnMove` plugin
// at initialization, move column 0 to 1
// at initialization, move column 1 to 4
// at initialization, move column 2 to 6
manualColumnMove: [1, 4, 6],
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L712

:::

_manualColumnMove.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L155

:::

_manualColumnMove.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### dragColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L221

:::

_manualColumnMove.dragColumn(column, dropIndex) ⇒ boolean_

Drag a single column to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### dragColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L235

:::

_manualColumnMove.dragColumns(columns, dropIndex) ⇒ boolean_

Drag multiple columns to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L118

:::

_manualColumnMove.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L111

:::

_manualColumnMove.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnMove#enablePlugin](@/api/manualColumnMove.md#enableplugin) method is called.



### isMovePossible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L252

:::

_manualColumnMove.isMovePossible(movedColumns, finalIndex) ⇒ boolean_

Indicates if it's possible to move columns to the desired position. Some of the actions aren't
possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L175

:::

_manualColumnMove.moveColumn(column, finalIndex) ⇒ boolean_

Moves a single column.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L189

:::

_manualColumnMove.moveColumns(columns, finalIndex) ⇒ boolean_

Moves a multiple columns.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/manualColumnMove/manualColumnMove.js#L143

:::

_manualColumnMove.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnMove`](@/api/options.md#manualcolumnmove)


