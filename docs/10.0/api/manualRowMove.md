---
title: ManualRowMove
metaTitle: ManualRowMove - Plugin - Handsontable Documentation
permalink: /10.0/api/manual-row-move
canonicalUrl: /api/manual-row-move
hotPlugin: true
editLink: false
---

# ManualRowMove

[[toc]]

## Description

This plugin allows to change rows order. To make rows order persistent the [Options#persistentState](@/api/options.md#persistentstate)
plugin should be enabled.

API:
- `moveRow` - move single row to the new position.
- `moveRows` - move many rows (as an array of indexes) to the new position.
- `dragRow` - drag single row to the new position.
- `dragRows` - drag many rows (as an array of indexes) to the new position.

[Documentation](@/guides/rows/row-moving.md) explain differences between drag and move actions. Please keep in mind that if you want apply visual changes,
you have to call manually the `render` method on the instance of Handsontable.

The plugin creates additional components to make moving possibly using user interface:
- backlight - highlight of selected rows.
- guideline - line which shows where rows has been moved.


## Options

### manualRowMove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1950

:::

_manualRowMove.manualRowMove : boolean | Array&lt;number&gt;_

Turns on [Manual row move](@/guides/columns/column-moving.md), if set to a boolean or define initial row order (as an array of row indexes).

**Default**: <code>undefined</code>  
**Example**  
```js
// as a boolean
manualRowMove: true,

// as a array with initial order
// (move row index at 0 to 1 and move row index at 1 to 4)
manualRowMove: [1, 4],
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L712

:::

_manualRowMove.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L144

:::

_manualRowMove.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### dragRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L211

:::

_manualRowMove.dragRow(row, dropIndex) ⇒ boolean_

Drag a single row to drop index position.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### dragRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L225

:::

_manualRowMove.dragRows(rows, dropIndex) ⇒ boolean_

Drag multiple rows to drop index position.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be dragged. |
| dropIndex | `number` | Visual row index, being a drop index for the moved rows. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/rows/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L110

:::

_manualRowMove.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L103

:::

_manualRowMove.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [ManualRowMove#enablePlugin](@/api/manualRowMove.md#enableplugin) method is called.



### isMovePossible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L242

:::

_manualRowMove.isMovePossible(movedRows, finalIndex) ⇒ boolean_

Indicates if it's possible to move rows to the desired position. Some of the actions aren't possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedRows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### moveRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L164

:::

_manualRowMove.moveRow(row, finalIndex) ⇒ boolean_

Moves a single row.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### moveRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L178

:::

_manualRowMove.moveRows(rows, finalIndex) ⇒ boolean_

Moves a multiple rows.

**Emits**: [`Hooks#event:beforeRowMove`](@/api/hooks.md#beforerowmove), [`Hooks#event:afterRowMove`](@/api/hooks.md#afterrowmove)  

| Param | Type | Description |
| --- | --- | --- |
| rows | `Array` | Array of visual row indexes to be moved. |
| finalIndex | `number` | Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving.md#drag-and-move-actions-of-manualrowmove-plugin). |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/manualRowMove/manualRowMove.js#L132

:::

_manualRowMove.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


