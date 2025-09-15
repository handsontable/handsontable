---
title: CellCoords
metaTitle: CellCoords - JavaScript Data Grid | Handsontable
permalink: /api/cell-coords
canonicalUrl: /api/cell-coords
searchCategory: API Reference
hotPlugin: false
editLink: false
id: qthfdrss
description: Options, members, and methods of Handsontable's CellCoord API.
react:
  id: ufhe1gsm
  metaTitle: CellCoords - React Data Grid | Handsontable
angular:
  id: l2e7n5op
  metaTitle: CellCoords - Angular Data Grid | Handsontable
---

# Plugin: CellCoords

[[toc]]

## Description

The `CellCoords` class holds the coordinates (`row`, `col`) of a single cell.

It also contains methods for validating the coordinates
and retrieving them as an object.

To import the `CellCoords` class:

```js
import Handsontable, { CellCoords } from '/handsontable';

// or, using modules
import Handsontable, { CellCoords } from '/handsontable/base';
```


## Members

### col
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L31

:::

_cellCoords.col : number_

A visual column index.



### row
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L25

:::

_cellCoords.row : number_

A visual row index.


## Methods

### assign
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L207

:::

_cellCoords.assign(coords) ⇒ [CellCoords](@/api/cellCoords.md)_

Assigns the coordinates from another `CellCoords` instance (or compatible literal object)
to your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| coords | [`CellCoords`](#cellcoords) <br/> `Object` | The CellCoords instance or compatible literal object. |



### clone
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L227

:::

_cellCoords.clone() ⇒ [CellCoords](@/api/cellCoords.md)_

Clones your `CellCoords` instance.



### isCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L124

:::

_cellCoords.isCell() ⇒ boolean_

Checks if the coordinates point to the cells range. If all axis (row and col) point to
the cell (positive value) then method returns `true`.



### isEqual
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L100

:::

_cellCoords.isEqual(coords) ⇒ boolean_

Checks if another set of coordinates (`coords`)
is equal to the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| coords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L114

:::

_cellCoords.isHeader() ⇒ boolean_

Checks if the coordinates point to the headers range. If one of the axis (row or col) point to
the header (negative value) then method returns `true`.



### isNorthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L180

:::

_cellCoords.isNorthEastOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is north-east of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isNorthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L156

:::

_cellCoords.isNorthWestOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is north-west of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isRtl
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L133

:::

_cellCoords.isRtl() ⇒ boolean_

Checks if the coordinates runs in RTL mode.



### isSouthEastOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L144

:::

_cellCoords.isSouthEastOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is south-east of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isSouthWestOf
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L168

:::

_cellCoords.isSouthWestOf(testedCoords) ⇒ boolean_

Checks if another set of coordinates (`testedCoords`)
is south-west of the coordinates in your `CellCoords` instance.


| Param | Type | Description |
| --- | --- | --- |
| testedCoords | [`CellCoords`](#cellcoords) | Coordinates to check. |



### isValid
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L69

:::

_cellCoords.isValid([tableParams]) ⇒ boolean_

Checks if the coordinates in your `CellCoords` instance are valid
in the context of given table parameters.

The `row` index:
- Must be an integer.
- Must be higher than the number of column headers in the table.
- Must be lower than the total number of rows in the table.

The `col` index:
- Must be an integer.
- Must be higher than the number of row headers in the table.
- Must be lower than the total number of columns in the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tableParams] | `object` |  | `optional` An object with a defined table size. |
| [tableParams.countRows] | `number` | <code>0</code> | `optional` The total number of rows. |
| [tableParams.countCols] | `number` | <code>0</code> | `optional` The total number of columns. |
| [tableParams.countRowHeaders] | `number` | <code>0</code> | `optional` A number of row headers. |
| [tableParams.countColHeaders] | `number` | <code>0</code> | `optional` A number of column headers. |


**Returns**: `boolean` - `true`: The coordinates are valid.  

### normalize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L192

:::

_cellCoords.normalize() ⇒ [CellCoords](@/api/cellCoords.md)_

Normalizes the coordinates in your `CellCoords` instance to the nearest valid position.

Coordinates that point to headers (negative values) are normalized to `0`.



### toObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/3rdparty/walkontable/src/cell/coords.js#L236

:::

_cellCoords.toObject() ⇒ Object_

Converts your `CellCoords` instance into an object literal with `row` and `col` properties.


**Returns**: `Object` - An object literal with `row` and `col` properties.  
