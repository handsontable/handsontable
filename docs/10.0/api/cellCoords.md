---
title: CellCoords
metaTitle: CellCoords - API Reference - Handsontable Documentation
permalink: /10.0/api/cell-coords
canonicalUrl: /api/cell-coords
hotPlugin: false
editLink: false
---

# CellCoords

[[toc]]
## Members

### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L19

:::

_cellCoords.col : number_

Column index.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L13

:::

_cellCoords.row : number_

Row index.


## Methods

### clone
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L118

:::

_cellCoords.clone() ⇒ [CellCoords](@/api/cellCoords.md)_

Clones the coordinates.



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L52

:::

_cellCoords.isEqual(cellCoords) ⇒ boolean_

Checks if this cell coordinates are the same as cell coordinates given as an argument.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellCoords`](#cellcoords) | Cell coordinates to equal. |



### isNorthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L96

:::

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L76

:::

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L66

:::

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L86

:::

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-west from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L33

:::

_cellCoords.isValid(wot) ⇒ boolean_

Checks if given set of coordinates is valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |



### normalize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L106

:::

_cellCoords.normalize() ⇒ [CellCoords](@/api/cellCoords.md)_

Normalizes the coordinates to the nearest valid position. The coordinates that point
to the headers (negative values) are normalized to 0.



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/cell/coords.js#L127

:::

_cellCoords.toObject() ⇒ object_

Converts CellCoords to literal object with `row` and `col` properties.


**Returns**: `object` - Returns a literal object with `row` and `col` properties.  
