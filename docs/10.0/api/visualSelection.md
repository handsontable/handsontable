---
title: VisualSelection
metaTitle: VisualSelection - API Reference - Handsontable Documentation
permalink: /10.0/api/visual-selection
canonicalUrl: /api/visual-selection
hotPlugin: false
editLink: false
---

# VisualSelection

[[toc]]
## Members

### visualCellRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L11

:::

_visualSelection.visualCellRange : null | [CellRange](@/api/cellRange.md)_

Range of selection visually. Visual representation may have representation in a rendered selection.


## Methods

### add
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L21

:::

_visualSelection.add(coords) ⇒ [VisualSelection](@/api/visualSelection.md)_

Adds a cell coords to the selection.


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | Visual coordinates of a cell. |



### adjustCoordinates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L267

:::

_visualSelection.adjustCoordinates(broaderCellRange) ⇒ [VisualSelection](@/api/visualSelection.md)_

Some selection may be a part of broader cell range. This function adjusting coordinates of current selection
and the broader cell range when needed (current selection can't be presented visually).


| Param | Type | Description |
| --- | --- | --- |
| broaderCellRange | `CellRange` | Visual range. Actual cell range may be contained in the broader cell range. When there is no way to represent some cell range visually we try to find range containing just the first visible cell. Warn: Please keep in mind that this function may change coordinates of the handled broader range. |



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L37

:::

_visualSelection.clear() ⇒ [VisualSelection](@/api/visualSelection.md)_

Clears visual and renderable selection.



### commit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L201

:::

_visualSelection.commit() ⇒ [VisualSelection](@/api/visualSelection.md)_

Override internally stored visual indexes added by the Selection's `add` function. It should be executed
at the end of process of adding visual selection coordinates.



### createRenderableCellRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L354

:::

_visualSelection.createRenderableCellRange(visualFromCoords, visualToCoords) ⇒ [CellRange](@/api/cellRange.md)_

Creates a new CellRange object based on visual coordinates which before object creation are
translated to renderable indexes.


| Param | Type | Description |
| --- | --- | --- |
| visualFromCoords | `CellCoords` | The CellCoords object which contains coordinates that                                      points to the begining of the selection. |
| visualToCoords | `CellCoords` | The CellCoords object which contains coordinates that                                    points to the end of the selection. |



### getCorners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L305

:::

_visualSelection.getCorners() ⇒ Array_

Returns the top left (TL) and bottom right (BR) selection coordinates (renderable indexes).
The method overwrites the original method to support header selection for hidden cells.
To make the header selection working, the CellCoords and CellRange have to support not
complete coordinates (`null` values for example, `row: null`, `col: 2`).


**Returns**: `Array` - Returns array of coordinates for example `[1, 1, 5, 5]`.  

### getVisualCorners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/selection/highlight/visualSelection.js#L332

:::

_visualSelection.getVisualCorners() ⇒ Array_

Returns the top left (TL) and bottom right (BR) selection coordinates (visual indexes).


**Returns**: `Array` - Returns array of coordinates for example `[1, 1, 5, 5]`.  
