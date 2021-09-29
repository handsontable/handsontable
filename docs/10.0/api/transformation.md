---
title: Transformation
metaTitle: Transformation - API Reference - Handsontable Documentation
permalink: /10.0/api/transformation
canonicalUrl: /api/transformation
hotPlugin: false
editLink: false
---

# Transformation

[[toc]]

## Description

The Transformation class implements algorithms for transforming coordinates based on current settings
passed to the Handsontable.

Transformation is always applied relative to the current selection.


## Members

### options
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/transformation.js#L28

:::

_transformation.options : object_

Additional options which define the state of the settings which can infer transformation and
give the possibility to translate indexes.



### range
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/transformation.js#L21

:::

_transformation.range : [SelectionRange](@/api/selectionRange.md)_

Instance of the SelectionRange, holder for visual coordinates applied to the table.


## Methods

### transformEnd
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/transformation.js#L125

:::

_transformation.transformEnd(rowDelta, colDelta) ⇒ [CellCoords](@/api/cellCoords.md)_

Sets selection end cell relative to current selection end cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) - Visual coordinates after transformation.  

### transformStart
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/transformation.js#L40

:::

_transformation.transformStart(rowDelta, colDelta, force) ⇒ [CellCoords](@/api/cellCoords.md)_

Selects cell relative to current cell (if possible).


| Param | Type | Description |
| --- | --- | --- |
| rowDelta | `number` | Rows number to move, value can be passed as negative number. |
| colDelta | `number` | Columns number to move, value can be passed as negative number. |
| force | `boolean` | If `true` the new rows/columns will be created if necessary. Otherwise, row/column will                        be created according to `minSpareRows/minSpareCols` settings of Handsontable. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) - Visual coordinates after transformation.  
