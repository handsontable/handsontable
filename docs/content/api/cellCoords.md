---
title: CellCoords
metaTitle: CellCoords - API Reference - Handsontable Documentation
permalink: /api/cell-coords
canonicalUrl: /api/cell-coords
hotPlugin: false
editLink: false
---

# CellCoords

[[toc]]
## Members

### col

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L18

:::

_cellCoords.col : number_

Column index.



### row

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L12

:::

_cellCoords.row : number_

Row index.


## Methods

### clone

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L128

:::

_cellCoords.clone() ⇒ [CellCoords](@/api/cellCoords.md)_

Clones the coordinates.



### isEqual

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L58

:::

_cellCoords.isEqual(cellCoords) ⇒ boolean_

Checks if this cell coordinates are the same as cell coordinates given as an argument.


| Param | Type | Description |
| --- | --- | --- |
| cellCoords | [`CellCoords`](#cellcoords) | Cell coordinates to equal. |



### isNorthEastOf

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L105

:::

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isNorthWestOf

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L83

:::

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in north-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthEastOf

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L72

:::

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-east from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isSouthWestOf

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L94

:::

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

Checks if tested coordinates are positioned in south-west from this cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | `object` | Cell coordinates to check. |



### isValid

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L39

:::

_cellCoords.isValid(wot) ⇒ boolean_

Checks if given set of coordinates is valid in context of a given Walkontable instance.


| Param | Type | Description |
| --- | --- | --- |
| wot | `Walkontable` | A Walkontable instance. |



### normalize

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L116

:::

_cellCoords.normalize() ⇒ [CellCoords](@/api/cellCoords.md)_

Normalizes the coordinates to the nearest valid position. The coordinates that point
to the headers (negative values) are normalized to 0.



### toObject

::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L137

:::

_cellCoords.toObject() ⇒ object_

Converts CellCoords to literal object with `row` and `col` properties.


**Returns**: `object` - Returns a literal object with `row` and `col` properties.
