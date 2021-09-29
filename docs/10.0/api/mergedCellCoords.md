---
title: MergedCellCoords
metaTitle: MergedCellCoords - Plugin - Handsontable Documentation
permalink: /10.0/api/merged-cell-coords
canonicalUrl: /api/merged-cell-coords
hotPlugin: true
editLink: false
---

# MergedCellCoords

[[toc]]

## Description

The `MergedCellCoords` class represents a single merged cell.


## Members

### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L23

:::

_mergedCellCoords.col : number_

The index of the leftmost column.



### colspan
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L35

:::

_mergedCellCoords.colspan : number_

The `colspan` value of the merged cell.



### removed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L41

:::

_mergedCellCoords.removed : boolean_

`true` only if the merged cell is bound to be removed.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L17

:::

_mergedCellCoords.row : number_

The index of the topmost merged cell row.



### rowspan
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L29

:::

_mergedCellCoords.rowspan : number_

The `rowspan` value of the merged cell.


## Methods

### containsNegativeValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L95

:::

_MergedCellCoords.containsNegativeValues(mergedCellInfo) ⇒ boolean_

Check whether the values provided for a merged cell contain any negative values.


| Param | Type | Description |
| --- | --- | --- |
| mergedCellInfo | `object` | Object containing the `row`, `col`, `rowspan` and `colspan` properties. |



### getLastColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L303

:::

_mergedCellCoords.getLastColumn() ⇒ number_

Get the rightmost column index of the merged cell.



### getLastRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L294

:::

_mergedCellCoords.getLastRow() ⇒ number_

Get the bottom row index of the merged cell.



### getRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L312

:::

_mergedCellCoords.getRange() ⇒ [CellRange](@/api/cellRange.md)_

Get the range coordinates of the merged cell.



### includes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L177

:::

_mergedCellCoords.includes(row, column) ⇒ boolean_

Returns `true` if the provided coordinates are inside the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The row index. |
| column | `number` | The column index. |



### includesHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L188

:::

_mergedCellCoords.includesHorizontally(column) ⇒ boolean_

Returns `true` if the provided `column` property is within the column span of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index. |



### includesVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L198

:::

_mergedCellCoords.includesVertically(row) ⇒ boolean_

Returns `true` if the provided `row` property is within the row span of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |



### IS_OUT_OF_BOUNDS_WARNING
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L62

:::

_MergedCellCoords.IS\_OUT\_OF\_BOUNDS\_WARNING(newMergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains values exceeding the table limits.


| Param | Type | Description |
| --- | --- | --- |
| newMergedCell | `object` | Object containg information about the merged cells that was about to be added. |



### IS_SINGLE_CELL
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L73

:::

_MergedCellCoords.IS\_SINGLE\_CELL(newMergedCell) ⇒ string_

Get a warning message for when the declared merged cell data represents a single cell.


| Param | Type | Description |
| --- | --- | --- |
| newMergedCell | `object` | Object containg information about the merged cells that was about to be added. |



### isFarther
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L268

:::

_mergedCellCoords.isFarther(mergedCell, direction) ⇒ boolean | null_

Check if the second provided merged cell is "farther" in the provided direction.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | [`MergedCellCoords`](#mergedcellcoords) | The merged cell to check. |
| direction | `string` | Drag direction. |


**Returns**: `boolean` | `null` - `true` if the second provided merged cell is "farther".  

### isOutOfBounds
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L129

:::

_MergedCellCoords.isOutOfBounds(mergeCell, rowCount, columnCount) ⇒ boolean_

Check whether the provided merged cell object is to be declared out of bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| mergeCell | `object` | Object containing the `row`, `col`, `rowspan` and `colspan` properties. |
| rowCount | `number` | Number of rows in the table. |
| columnCount | `number` | Number of rows in the table. |



### NEGATIVE_VALUES_WARNING
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L50

:::

_MergedCellCoords.NEGATIVE\_VALUES\_WARNING(newMergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains negative values.


| Param | Type | Description |
| --- | --- | --- |
| newMergedCell | `object` | Object containg information about the merged cells that was about to be added. |



### normalize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L143

:::

_mergedCellCoords.normalize(hotInstance)_

Sanitize (prevent from going outside the boundaries) the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| hotInstance | `Core` | The Handsontable instance. |



### shift
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L209

:::

_mergedCellCoords.shift(shiftVector, indexOfChange) ⇒ boolean_

Shift (and possibly resize, if needed) the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| shiftVector | `Array` | 2-element array containing the information on the shifting in the `x` and `y` axis. |
| indexOfChange | `number` | Index of the preceding change. |


**Returns**: `boolean` - Returns `false` if the whole merged cell was removed.  

### ZERO_SPAN_WARNING
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellCoords.js#L84

:::

_MergedCellCoords.ZERO\_SPAN\_WARNING(newMergedCell) ⇒ string_

Get a warning message for when the declared merged cell data contains "colspan" or "rowspan", that equals 0.


| Param | Type | Description |
| --- | --- | --- |
| newMergedCell | `object` | Object containg information about the merged cells that was about to be added. |


