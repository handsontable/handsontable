---
title: ManualColumnMove
metaTitle: ManualColumnMove - Plugin - Handsontable Documentation
permalink: /9.0/api/manual-column-move
canonicalUrl: /api/manual-column-move
editLink: false
---

# ManualColumnMove

[[toc]]

## Description

This plugin allows to change columns order. To make columns order persistent the [Options#persistentState](@/api/metaSchema.md#persistentstate)
plugin should be enabled.

API:
- `moveColumn` - move single column to the new position.
- `moveColumns` - move many columns (as an array of indexes) to the new position.
- `dragColumn` - drag single column to the new position.
- `dragColumns` - drag many columns (as an array of indexes) to the new position.

[Documentation](@/guides/columns/column-moving.md) explain differences between drag and move actions.
Please keep in mind that if you want apply visual changes,
you have to call manually the `render` method on the instance of Handsontable.

The plugin creates additional components to make moving possibly using user interface:
- backlight - highlight of selected columns.
- guideline - line which shows where columns has been moved.


## Options

### manualColumnMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L1886

:::

_manualColumnMove.manualColumnMove : boolean | Array&lt;number&gt;_

Turns on [Manual column move](@/guides/columns/column-moving.md), if set to a boolean or define initial column order (as an array of column indexes).

**Default**: <code>undefined</code>  
**Example**  
```js
// as a boolean to enable column move
manualColumnMove: true,

// as a array with initial order
// (move column index at 0 to 1 and move column index at 1 to 4)
manualColumnMove: [1, 4],
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L727

:::

_manualColumnMove.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L149

:::

_manualColumnMove.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### dragColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L216

:::

_manualColumnMove.dragColumn(column, dropIndex) ⇒ boolean_

Drag a single column to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/pluginHooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/pluginHooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### dragColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L230

:::

_manualColumnMove.dragColumns(columns, dropIndex) ⇒ boolean_

Drag multiple columns to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/pluginHooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/pluginHooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L113

:::

_manualColumnMove.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L106

:::

_manualColumnMove.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [ManualColumnMove#enablePlugin](@/api/manualColumnMove.md#enableplugin) method is called.



### isMovePossible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L248

:::

_manualColumnMove.isMovePossible(movedColumns, finalIndex) ⇒ boolean_

Indicates if it's possible to move columns to the desired position. Some of the actions aren't
possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L169

:::

_manualColumnMove.moveColumn(column, finalIndex) ⇒ boolean_

Moves a single column.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/pluginHooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/pluginHooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L183

:::

_manualColumnMove.moveColumns(columns, finalIndex) ⇒ boolean_

Moves a multiple columns.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/pluginHooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/pluginHooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnMove/manualColumnMove.js#L137

:::

_manualColumnMove.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


