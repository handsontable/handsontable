---
title: MergedCellsCollection
metaTitle: MergedCellsCollection - Plugin - Handsontable Documentation
permalink: /10.0/api/merged-cells-collection
canonicalUrl: /api/merged-cells-collection
hotPlugin: true
editLink: false
---

# MergedCellsCollection

[[toc]]

## Description

Defines a container object for the merged cells.


## Members

### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L34

:::

_mergedCellsCollection.hot : [Handsontable](@/api/core.md)_

The Handsontable instance.



### mergedCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L28

:::

_mergedCellsCollection.mergedCells : Array_

Array of merged cells.



### plugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L22

:::

_mergedCellsCollection.plugin : [MergeCells](@/api/mergeCells.md)_

Reference to the Merge Cells plugin.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L145

:::

_mergedCellsCollection.add(mergedCellInfo) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Add a merged cell to the container.


| Param | Type | Description |
| --- | --- | --- |
| mergedCellInfo | `object` | The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the new merged cell on success and `false` on failure.  

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L195

:::

_mergedCellsCollection.clear()_

Clear all the merged cells.



### get
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L57

:::

_mergedCellsCollection.get(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns a wanted merged cell on success and `false` on failure.  

### getByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L81

:::

_mergedCellsCollection.getByRange(range) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Get a merged cell containing the provided range.


| Param | Type | Description |
| --- | --- | --- |
| range | `CellRange` <br/> `object` | The range to search merged cells for. |



### getFirstRenderableCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L290

:::

_mergedCellsCollection.getFirstRenderableCoords(row, column) ⇒ [CellCoords](@/api/cellCoords.md)_

Get the first renderable coords of the merged cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) - A `CellCoords` object with the coordinates to the first renderable cell within the
                       merged cell.  

### getWithinRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L106

:::

_mergedCellsCollection.getWithinRange(range, [countPartials]) ⇒ Array | boolean_

Get a merged cell contained in the provided range.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| range | `CellRange` <br/> `object` |  | The range to search merged cells in. |
| [countPartials] | `boolean` | <code>false</code> | `optional` If set to `true`, all the merged cells overlapping the range will be taken into calculation. |


**Returns**: `Array` | `boolean` - Array of found merged cells of `false` if none were found.  

### IS_OVERLAPPING_WARNING
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L43

:::

_MergedCellsCollection.IS\_OVERLAPPING\_WARNING(newMergedCell) ⇒ string_

Get a warning message for when the declared merged cell data overlaps already existing merged cells.


| Param | Type | Description |
| --- | --- | --- |
| newMergedCell | `object` | Object containg information about the merged cells that was about to be added. |



### isFirstRenderableMergedCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L274

:::

_mergedCellsCollection.isFirstRenderableMergedCell(row, column) ⇒ boolean_

Check whether the provided row/col coordinates direct to a first not hidden cell within merge area.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### isOverlapping
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L241

:::

_mergedCellsCollection.isOverlapping(mergedCell) ⇒ boolean_

Check if the provided merged cell overlaps with the others in the container.


| Param | Type | Description |
| --- | --- | --- |
| mergedCell | `MergedCellCoords` | The merged cell to check against all others in the container. |


**Returns**: `boolean` - `true` if the provided merged cell overlaps with the others, `false` otherwise.  

### remove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L178

:::

_mergedCellsCollection.remove(row, column) ⇒ [MergedCellCoords](@/api/mergedCellCoords.md) | boolean_

Remove a merged cell from the container. You can provide either the "starting coordinates"
of a merged cell, or any coordinates from the body of the merged cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |


**Returns**: [`MergedCellCoords`](@/api/mergedCellCoords.md) | `boolean` - Returns the removed merged cell on success and `false` on failure.  

### shiftCollections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/cellsCollection.js#L310

:::

_mergedCellsCollection.shiftCollections(direction, index, count)_

Shift the merged cell in the direction and by an offset defined in the arguments.


| Param | Type | Description |
| --- | --- | --- |
| direction | `string` | `right`, `left`, `up` or `down`. |
| index | `number` | Index where the change, which caused the shifting took place. |
| count | `number` | Number of rows/columns added/removed in the preceding action. |


