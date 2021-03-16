---
title: CellCoords
permalink: /next/api/coords
canonicalUrl: /api/coords
---

# {{ $frontmatter.title }}

[[toc]]
## Members:

### col

_cellCoords.col : number_

Column index.



### row

_cellCoords.row : number_

Row index.


## Methods:

### clone

_cellCoords.clone() ⇒ [CellCoords](./coords/)_

Clones the coordinates.



### isEqual

_cellCoords.isEqual(cellCoords) ⇒ boolean_

Checks if this cell coordinates are the same as cell coordinates given as an argument.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [<code>CellCoords</code>](#CellCoords) | Cell coordinates to equal. |



### isNorthEastOf

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | <code>object</code> | Cell coordinates to check. |



### isNorthWestOf

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | <code>object</code> | Cell coordinates to check. |



### isSouthEastOf

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | <code>object</code> | Cell coordinates to check. |



### isSouthWestOf

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-west from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | <code>object</code> | Cell coordinates to check. |



### isValid

_cellCoords.isValid(wot) ⇒ boolean_

Checks if given set of coordinates is valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | <code>Walkontable</code> | A Walkontable instance. |



### normalize

_cellCoords.normalize() ⇒ [CellCoords](./coords/)_

Normalizes the coordinates to the nearest valid position. The coordinates that point
to the headers (negative values) are normalized to 0.



### toObject

_cellCoords.toObject() ⇒ object_

Converts CellCoords to literal object with `row` and `col` properties.


**Returns**: object - Returns a literal object with `row` and `col` properties.  
