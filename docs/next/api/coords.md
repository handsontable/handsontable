---
title: CellCoords
permalink: /next/api/coords
canonicalUrl: /api/coords
editLink: false
---

# CellCoords

[[toc]]
## Members

### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L19

:::

`cellCoords.col : number`

Column index.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L13

:::

`cellCoords.row : number`

Row index.


## Methods

### clone
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L118

:::

`cellCoords.clone() ⇒ [CellCoords](./coords/)`

Clones the coordinates.



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L52

:::

`cellCoords.isEqual(cellCoords) ⇒ boolean`

Checks if this cell coordinates are the same as cell coordinates given as an argument.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellCoords`](#CellCoords) | Cell coordinates to equal. |



### isNorthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L96

:::

`cellCoords.isNorthEastOf(testedCoords) ⇒ boolean`

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L76

:::

`cellCoords.isNorthWestOf(testedCoords) ⇒ boolean`

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L66

:::

`cellCoords.isSouthEastOf(testedCoords) ⇒ boolean`

Checks if tested coordinates are positioned in south-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L86

:::

`cellCoords.isSouthWestOf(testedCoords) ⇒ boolean`

Checks if tested coordinates are positioned in south-west from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L33

:::

`cellCoords.isValid(wot) ⇒ boolean`

Checks if given set of coordinates is valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |



### normalize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L106

:::

`cellCoords.normalize() ⇒ [CellCoords](./coords/)`

Normalizes the coordinates to the nearest valid position. The coordinates that point
to the headers (negative values) are normalized to 0.



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L127

:::

`cellCoords.toObject() ⇒ object`

Converts CellCoords to literal object with `row` and `col` properties.


**Returns**: `object` - Returns a literal object with `row` and `col` properties.  
