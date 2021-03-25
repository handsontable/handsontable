---
title: CellCoords
permalink: /next/api/coords
canonicalUrl: /api/coords
editLink: false
---

# CellCoords

[[toc]]
## Members:

### col

_cellCoords.col : number_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L19)

Column index.



### row

_cellCoords.row : number_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L13)

Row index.


## Methods:

### clone

_cellCoords.clone() ⇒ [CellCoords](./coords/)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L118)

Clones the coordinates.



### isEqual

_cellCoords.isEqual(cellCoords) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L52)

Checks if this cell coordinates are the same as cell coordinates given as an argument.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellCoords`](#CellCoords) | Cell coordinates to equal. |



### isNorthEastOf

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L96)

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isNorthWestOf

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L76)

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthEastOf

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L66)

Checks if tested coordinates are positioned in south-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthWestOf

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L86)

Checks if tested coordinates are positioned in south-west from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isValid

_cellCoords.isValid(wot) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L33)

Checks if given set of coordinates is valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |



### normalize

_cellCoords.normalize() ⇒ [CellCoords](./coords/)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L106)

Normalizes the coordinates to the nearest valid position. The coordinates that point
to the headers (negative values) are normalized to 0.



### toObject

_cellCoords.toObject() ⇒ object_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/3rdparty/walkontable/src/cell/coords.js#L127)

Converts CellCoords to literal object with `row` and `col` properties.


**Returns**: `object` - Returns a literal object with `row` and `col` properties.  
