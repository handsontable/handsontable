---
title: AutofillCalculations
metaTitle: AutofillCalculations - Plugin - Handsontable Documentation
permalink: /10.0/api/autofill-calculations
canonicalUrl: /api/autofill-calculations
hotPlugin: true
editLink: false
---

# AutofillCalculations

[[toc]]

## Description

Class responsible for all of the Autofill-related operations on merged cells.


## Members

### mergedCellsCollection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L25

:::

_autofillCalculations.mergedCellsCollection : [MergedCellsCollection](@/api/mergedCellsCollection.md)_

Reference to the MergedCellsCollection class instance.



### plugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L19

:::

_autofillCalculations.plugin : [MergeCells](@/api/mergeCells.md)_

Reference to the Merge Cells plugin.


## Methods

### correctSelectionAreaSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L40

:::

_autofillCalculations.correctSelectionAreaSize(selectionArea)_

Correct the provided selection area, so it's not selecting only a part of a merged cell.


| Param | Type | Description |
| --- | --- | --- |
| selectionArea | `Array` | The selection to correct. |



### dragAreaOverlapsCollections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L426

:::

_autofillCalculations.dragAreaOverlapsCollections(baseArea, fullArea, direction) ⇒ boolean_

Check if the drag area contains any merged cells.


| Param | Type | Description |
| --- | --- | --- |
| baseArea | `Array` | The base selection area. |
| fullArea | `Array` | The base area extended by the drag area. |
| direction | `string` | Drag direction. |



### getDirection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L58

:::

_autofillCalculations.getDirection(selectionArea, finalArea) ⇒ string_

Get the direction of the autofill process.


| Param | Type | Description |
| --- | --- | --- |
| selectionArea | `Array` | The selection area. |
| finalArea | `Array` | The final area (base + drag). |


**Returns**: `string` - `up`, `down`, `left` or `right`.  

### recreateAfterDataPopulation
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L289

:::

_autofillCalculations.recreateAfterDataPopulation(changes)_

Recreate the merged cells after the autofill process.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | Changes made. |



### snapDragArea
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/mergeCells/calculations/autofill.js#L88

:::

_autofillCalculations.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells) ⇒ Array_

Snap the drag area to the farthest merged cell, so it won't clip any of the merged cells.


| Param | Type | Description |
| --- | --- | --- |
| baseArea | `Array` | The base selected area. |
| dragArea | `Array` | The drag area. |
| dragDirection | `string` | The autofill drag direction. |
| foundMergedCells | `Array` | MergeCellCoords found in the base selection area. |


**Returns**: `Array` - The new drag area.  
