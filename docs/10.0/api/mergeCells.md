---
title: MergeCells
metaTitle: MergeCells - Plugin - Handsontable Documentation
permalink: /10.0/api/merge-cells
canonicalUrl: /api/merge-cells
hotPlugin: true
editLink: false
---

# MergeCells

[[toc]]

## Description

Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).

**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
 data: getData(),
 mergeCells: [
   {row: 0, col: 3, rowspan: 3, colspan: 3},
   {row: 2, col: 6, rowspan: 2, colspan: 2},
   {row: 4, col: 8, rowspan: 3, colspan: 3}
 ],
```

## Options

### mergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1997

:::

_mergeCells.mergeCells : boolean | Array&lt;object&gt;_

If set to `true`, it enables a possibility to merge cells. If set to an array of objects, it merges the cells provided
in the objects (see the example below). More information on [the demo page](@/guides/cell-features/merge-cells.md).

**Default**: <code>false</code>  
**Example**  
```js
// enables the mergeCells plugin
margeCells: true,

// declares a list of merged sections
mergeCells: [
  // rowspan and colspan properties declare the width and height of a merged section in cells
  {row: 1, col: 1, rowspan: 3, colspan: 3},
  {row: 3, col: 4, rowspan: 2, colspan: 2},
  {row: 5, col: 6, rowspan: 3, colspan: 3}
],
```

## Methods

### clearCollections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L289

:::

_mergeCells.clearCollections()_

Clears the merged cells from the merged cell container.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L144

:::

_mergeCells.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L97

:::

_mergeCells.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L90

:::

_mergeCells.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [MergeCells#enablePlugin](@/api/mergeCells.md#enableplugin) method is called.



### merge
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L494

:::

_mergeCells.merge(startRow, startColumn, endRow, endColumn)_

Merges the specified range.

**Emits**: [`Hooks#event:beforeMergeCells`](@/api/hooks.md#beforemergecells), [`Hooks#event:afterMergeCells`](@/api/hooks.md#aftermergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### mergeSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L330

:::

_mergeCells.mergeSelection([cellRange])_

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### unmerge
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L511

:::

_mergeCells.unmerge(startRow, startColumn, endRow, endColumn)_

Unmerges the merged cell in the provided range.

**Emits**: [`Hooks#event:beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells), [`Hooks#event:afterUnmergeCells`](@/api/hooks.md#afterunmergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### unmergeSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L349

:::

_mergeCells.unmergeSelection([cellRange])_

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/mergeCells.js#L153

:::

_mergeCells.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


